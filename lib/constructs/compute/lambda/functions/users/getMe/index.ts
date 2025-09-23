import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { getAuthenticatedUser } from '../../../helpers/getAuthenticatedUser';
import { User, GetMeEvent } from '../../../types/userTypes';

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: {
    removeUndefinedValues: true
  }
});

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME!;

/**
 * Lambda handler for getMe GraphQL query
 * Returns the complete user object for the authenticated user
 */
export const handler = async (event: GetMeEvent): Promise<User | null> => {
  console.log('GetMe Lambda invoked:', JSON.stringify(event, null, 2));

  try {
    const { testUserId } = event.arguments;

    // Get authenticated user (required for this endpoint)
    const auth = getAuthenticatedUser(event, { userId: testUserId });
    const userId = auth.userId;

    console.log(`Fetching complete profile for authenticated user: ${userId}, auth: ${auth.authMethod}`);

    // Get user from DynamoDB
    const getCommand = new GetCommand({
      TableName: USERS_TABLE_NAME,
      Key: { userId }
      // Fetch all user data (no projection - we want everything)
    });

    const result = await docClient.send(getCommand);

    if (!result.Item) {
      console.log('User not found:', userId);
      // This shouldn't happen if user was authenticated, but handle gracefully
      throw new Error('User profile not found. Please contact support.');
    }

    const user = result.Item as User;

    console.log('Complete user profile retrieved successfully for:', userId);
    return user;

  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    
    // Handle specific DynamoDB errors
    if (error.name === 'ResourceNotFoundException') {
      throw new Error('User table not found');
    }
    
    // Re-throw authentication errors as-is
    if (error.message.includes('Authentication required') || error.message.includes('required')) {
      throw error;
    }
    
    // Generic error for unexpected issues
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }
};