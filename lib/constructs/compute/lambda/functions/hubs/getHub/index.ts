import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { Hub, GetHubEvent } from '../../../types/hubTypes';

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const HUBS_TABLE_NAME = process.env.HUBS_TABLE_NAME!;

/**
 * Lambda handler for GetHub GraphQL query
 */
export const handler = async (event: GetHubEvent): Promise<Hub | null> => {
  console.log('GetHub Lambda invoked:', JSON.stringify(event, null, 2));

  try {
    const { hubId } = event.arguments;
    const userId = event.identity?.sub;

    // Validate input
    if (!hubId || hubId.trim().length === 0) {
      throw new Error('Hub ID is required');
    }

    console.log(`Looking up hub: ${hubId}`);

    // Get hub from DynamoDB
    const getCommand = new GetCommand({
      TableName: HUBS_TABLE_NAME,
      Key: { hubId }
    });

    const result = await docClient.send(getCommand);

    if (!result.Item) {
      console.log(`Hub not found: ${hubId}`);
      return null;
    }

    const hub = result.Item as Hub;

    // Check if hub is active
    if (!hub.isActive) {
      console.log(`Hub is inactive: ${hubId}`);
      return null;
    }

    // For public hubs, return immediately
    if (hub.hubType === 'PUBLIC') {
      console.log(`Returning public hub: ${hubId}`);
      return hub;
    }

    // For private hubs, check access control
    if (hub.hubType === 'PRIVATE') {
      // TODO: Implement membership checking when Members table is created
      // For now, only return if user is the creator
      if (!userId) {
        console.log(`Anonymous access denied for private hub: ${hubId}`);
        throw new Error('Authentication required for private hubs');
      }

      if (hub.createdBy === userId) {
        console.log(`Creator access granted for private hub: ${hubId}`);
        return hub;
      }

      // TODO: Check membership table
      // const membership = await checkMembership(hubId, userId);
      // if (membership && membership.status === 'ACTIVE') {
      //   return hub;
      // }

      console.log(`Access denied for private hub: ${hubId}, user: ${userId}`);
      throw new Error('Access denied: You are not a member of this private hub');
    }

    // Should not reach here
    throw new Error('Invalid hub type');

  } catch (error: any) {
    console.error('Error getting hub:', error);

    // Re-throw validation and access control errors as-is
    if (error.message.includes('required') || 
        error.message.includes('denied') || 
        error.message.includes('Authentication required')) {
      throw error;
    }

    // Generic error for unexpected issues
    throw new Error(`Failed to get hub: ${error.message}`);
  }
};

/**
 * TODO: Implement when Members table is created
 * Check if user is a current member of the hub
 */
// async function checkMembership(hubId: string, userId: string): Promise<boolean> {
//   const getMembershipCommand = new GetCommand({
//     TableName: MEMBERS_TABLE_NAME,
//     Key: { membershipId: `${userId}#${hubId}` }
//   });
//   
//   const result = await docClient.send(getMembershipCommand);
//   return result.Item !== undefined;
// }