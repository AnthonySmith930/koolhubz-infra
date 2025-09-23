import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { DeleteHubEvent } from '../../../../../../types/deleteHubTypes';
import { Hub } from '../../../../../../types/hub';

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const HUBS_TABLE_NAME = process.env.HUBS_TABLE_NAME!;

/**
 * Lambda handler for DeleteHub GraphQL mutation
 */
export const handler = async (event: DeleteHubEvent): Promise<boolean> => {
  console.log('DeleteHub Lambda invoked:', JSON.stringify(event, null, 2));

  try {
    const { hubId } = event.arguments;
    const userId = event.identity?.sub || event.arguments.testUserId;

    // Validate input
    if (!hubId || hubId.trim().length === 0) {
      throw new Error('Hub ID is required');
    }

    if (!userId) {
      throw new Error('User identification required. Either authenticate with Cognito or provide userId parameter.');
    }

    console.log(`Attempting to delete hub: ${hubId} by user: ${userId}`);

    // First, get the hub to verify it exists and check ownership
    const getCommand = new GetCommand({
      TableName: HUBS_TABLE_NAME,
      Key: { hubId }
    });

    const getResult = await docClient.send(getCommand);

    if (!getResult.Item) {
      console.log(`Hub not found: ${hubId}`);
      throw new Error('Hub not found');
    }

    const hub = getResult.Item as Hub;

    // Check if user is the creator
    if (hub.createdBy !== userId) {
      console.log(`Unauthorized deletion attempt - Hub: ${hubId}, Creator: ${hub.createdBy}, User: ${userId}`);
      throw new Error('Access denied: Only the hub creator can delete this hub');
    }

    console.log(`Authorization confirmed - proceeding with deletion of hub: ${hubId}`);

    // Perform hard delete
    const deleteCommand = new DeleteCommand({
      TableName: HUBS_TABLE_NAME,
      Key: { hubId },
      // Add condition to ensure we're deleting the same item we just retrieved
      ConditionExpression: 'attribute_exists(hubId) AND createdBy = :createdBy',
      ExpressionAttributeValues: {
        ':createdBy': userId
      }
    });

    await docClient.send(deleteCommand);

    console.log(`Hub successfully deleted: ${hubId}`);

    // TODO: Future cleanup tasks
    // - Delete related membership records (when Members table is implemented)
    // - Delete related messages (when Messages table is implemented)
    // - Trigger notifications to current members
    // - Update any cached data

    return true;

  } catch (error: any) {
    console.error('Error deleting hub:', error);

    // Re-throw validation and authorization errors as-is
    if (error.message.includes('required') || 
        error.message.includes('denied') || 
        error.message.includes('not found') ||
        error.message.includes('Authentication required') ||
        error.message.includes('already deleted')) {
      throw error;
    }

    // Handle DynamoDB-specific errors
    if (error.name === 'ConditionalCheckFailedException') {
      throw new Error('Hub could not be deleted - it may have been modified or deleted by another process');
    }

    // Generic error for unexpected issues
    throw new Error(`Failed to delete hub: ${error.message}`);
  }
};