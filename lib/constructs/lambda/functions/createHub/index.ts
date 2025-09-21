import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { CreateHubEvent, CreateHubInput } from '../../../../types/createHubTypes';
import { Hub } from '../../../../types/hub';

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const HUBS_TABLE_NAME = process.env.HUBS_TABLE_NAME!;

/**
 * Lambda handler for CreateHub GraphQL mutation
 */
export const handler = async (event: CreateHubEvent): Promise<Hub> => {
  console.log('CreateHub Lambda invoked:', JSON.stringify(event, null, 2));

  try {
    const { v4: uuidv4 } = await import('uuid');
    const ngeohash = await import('ngeohash');
    const { encode: geohashEncode } = ngeohash.default;

    const input = event.arguments.input;

    // Hybrid authentication: Use Cognito user ID if available, otherwise use provided userId
    const userId = event.identity?.sub || input.userId;
    if (!userId) {
      throw new Error('User identification required. Either authenticate with Cognito or provide userId parameter.');
    }

    console.log('Creating hub for user:', userId);

    // Validate input
    validateInput(input);

    // Generate hub data
    const hubId = uuidv4();
    const now = new Date().toISOString();
    
    // Calculate geohash for location indexing
    const geohash = geohashEncode(input.latitude, input.longitude, 5);
    
    console.log('Generated hubId:', hubId, 'geohash:', geohash);

    // Create hub object
    const hub: Hub = {
      hubId,
      name: input.name.trim(),
      description: input.description.trim(),
      latitude: input.latitude,
      longitude: input.longitude,
      radius: input.radius,
      hubType: input.hubType,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      isActive: true,
      geohash,
    };

    // Save to DynamoDB
    const putCommand = new PutCommand({
      TableName: HUBS_TABLE_NAME,
      Item: hub,
      // Ensure hubId doesn't already exist (shouldn't happen with UUID, but safety first)
      ConditionExpression: 'attribute_not_exists(hubId)',
    });

    await docClient.send(putCommand);

    console.log('Hub created successfully:', hubId);

    return hub;

  } catch (error: any) {
    console.error('Error creating hub:', error);
    
    // Handle specific DynamoDB errors
    if (error.name === 'ConditionalCheckFailedException') {
      throw new Error('Hub with this ID already exists');
    }
    
    // Re-throw validation errors as-is
    if (error.message.includes('validation') || error.message.includes('required')) {
      throw error;
    }
    
    // Generic error for unexpected issues
    throw new Error(`Failed to create hub: ${error.message}`);
  }
};

/**
 * Validate input data
 */
function validateInput(input: CreateHubInput): void {
  // Validate radius (between 10m and 1000m)
  if (input.radius < 10 || input.radius > 1000) {
    throw new Error('Hub radius must be between 10 and 1000 meters.');
  }
  
  // Validate coordinates
  if (input.latitude < -90 || input.latitude > 90) {
    throw new Error('Latitude must be between -90 and 90 degrees.');
  }
  
  if (input.longitude < -180 || input.longitude > 180) {
    throw new Error('Longitude must be between -180 and 180 degrees.');
  }
  
  // Validate hub name
  if (!input.name || input.name.trim().length < 3) {
    throw new Error('Hub name must be at least 3 characters long.');
  }
  
  if (input.name.length > 100) {
    throw new Error('Hub name cannot exceed 100 characters.');
  }
  
  // Validate description
  if (!input.description || input.description.trim().length < 10) {
    throw new Error('Hub description must be at least 10 characters long.');
  }
  
  if (input.description.length > 500) {
    throw new Error('Hub description cannot exceed 500 characters.');
  }

  // Validate hubType
  if (!['PUBLIC', 'PRIVATE'].includes(input.hubType)) {
    throw new Error('Hub type must be either PUBLIC or PRIVATE.');
  }
}