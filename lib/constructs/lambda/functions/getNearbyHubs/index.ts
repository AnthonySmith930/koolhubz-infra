import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const HUBS_TABLE_NAME = process.env.HUBS_TABLE_NAME!;

// Types
interface GetNearbyHubsInput {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  limit?: number;
  hubType?: 'PUBLIC' | 'PRIVATE';
}

interface AppSyncEvent {
  arguments: {
    latitude: number;
    longitude: number;
    radiusKm?: number;
    limit?: number;
    hubType?: 'PUBLIC' | 'PRIVATE';
  };
  identity?: {
    sub: string;
  };
}

interface Hub {
  hubId: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  radius: number;
  hubType: 'PUBLIC' | 'PRIVATE';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  geohash: string;
}

interface HubWithDistance extends Hub {
  distance: number;
}

/**
 * Lambda handler for GetNearbyHubs GraphQL query
 */
export const handler = async (event: AppSyncEvent): Promise<Hub[]> => {
  console.log('GetNearbyHubs Lambda invoked:', JSON.stringify(event, null, 2));

  try {
    const geolib = await import('geolib')
    const ngeohash = await import('ngeohash');
    const { encode: geohashEncode, neighbors: geohashNeighbors } = ngeohash.default;

    const input = event.arguments;
    
    // Set defaults
    const radiusKm = input.radiusKm || 3.0;
    const limit = input.limit || 50;
    const radiusMeters = radiusKm * 1000;

    console.log(`Searching for hubs within ${radiusKm}km of (${input.latitude}, ${input.longitude})`);

    // Validate input
    validateInput(input);

    // Calculate user's geohash
    const userGeohash = geohashEncode(input.latitude, input.longitude, 6);
    
    // Determine precision based on search radius
    // Larger radius = lower precision (broader geohash cells)
    const precision = radiusKm > 5 ? 4 : radiusKm > 1 ? 5 : 6;
    const userGeohashPrefix = userGeohash.substring(0, precision);
    
    console.log(`User geohash: ${userGeohash}, using precision ${precision}, prefix: ${userGeohashPrefix}`);

    // Get neighboring geohash prefixes to handle boundary cases
    const searchPrefixes = [userGeohashPrefix, ...geohashNeighbors(userGeohashPrefix)];
    console.log(`Searching ${searchPrefixes.length} geohash prefixes:`, searchPrefixes);

    // Query DynamoDB for each geohash prefix in parallel
    const queryPromises = searchPrefixes.map(prefix => 
      queryHubsByGeohash(prefix, input.hubType, limit * 2) // Fetch extra for distance filtering
    );

    const queryResults = await Promise.all(queryPromises);
    
    // Flatten results and remove duplicates
    const allHubs = new Map<string, Hub>();
    queryResults.forEach(results => {
      results.forEach(hub => {
        allHubs.set(hub.hubId, hub);
      });
    });

    console.log(`Found ${allHubs.size} total hubs from geohash queries`);

    // Calculate distances and filter by radius
    const hubsWithDistance: HubWithDistance[] = [];
    
    for (const hub of allHubs.values()) {
      const distance = geolib.getDistance(
        { latitude: input.latitude, longitude: input.longitude },
        { latitude: hub.latitude, longitude: hub.longitude }
      );

      // Include hubs within search radius OR hubs whose radius reaches the user
      const isWithinSearchRadius = distance <= radiusMeters;
      const hubReachesUser = distance <= hub.radius;
      
      if (isWithinSearchRadius || hubReachesUser) {
        hubsWithDistance.push({
          ...hub,
          distance
        });
      }
    }

    console.log(`After distance filtering: ${hubsWithDistance.length} nearby hubs`);

    // Sort by distance and apply limit
    const sortedHubs = hubsWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    // Remove distance property before returning (not in GraphQL schema)
    const nearbyHubs: Hub[] = sortedHubs.map(({ distance, ...hub }) => hub);

    console.log(`Returning ${nearbyHubs.length} hubs`);
    
    return nearbyHubs;

  } catch (error: any) {
    console.error('Error getting nearby hubs:', error);
    throw new Error(`Failed to get nearby hubs: ${error.message}`);
  }
};

/**
 * Query DynamoDB for hubs with a specific geohash prefix
 */
async function queryHubsByGeohash(
  geohashPrefix: string, 
  hubType?: 'PUBLIC' | 'PRIVATE',
  limit: number = 100
): Promise<Hub[]> {
  try {
    // Private hubs are never returned in general searches
    if (hubType === 'PRIVATE') {
      console.log('Private hub search requested - returning empty results (not implemented)');
      return [];
    }

    // Always query only public, active hubs
    const queryParams = {
      TableName: HUBS_TABLE_NAME,
      IndexName: 'LocationIndex',
      KeyConditionExpression: 'geohash = :geohash',
      FilterExpression: 'hubType = :hubType AND isActive = :isActive',
      ExpressionAttributeValues: {
        ':geohash': geohashPrefix,
        ':hubType': 'PUBLIC',
        ':isActive': true
      },
      Limit: limit
    };

    const result = await docClient.send(new QueryCommand(queryParams));
    return (result.Items as Hub[]) || [];

  } catch (error) {
    console.error(`Error querying geohash ${geohashPrefix}:`, error);
    return []; // Return empty array on error to avoid breaking the entire query
  }
}

/**
 * Validate input parameters
 */
function validateInput(input: GetNearbyHubsInput): void {
  // Validate coordinates
  if (input.latitude < -90 || input.latitude > 90) {
    throw new Error('Latitude must be between -90 and 90 degrees.');
  }
  
  if (input.longitude < -180 || input.longitude > 180) {
    throw new Error('Longitude must be between -180 and 180 degrees.');
  }
  
  // Validate radius
  if (input.radiusKm && (input.radiusKm < 0.1 || input.radiusKm > 50)) {
    throw new Error('Search radius must be between 0.1 and 50 kilometers.');
  }
  
  // Validate limit
  if (input.limit && (input.limit < 1 || input.limit > 200)) {
    throw new Error('Limit must be between 1 and 200.');
  }
}