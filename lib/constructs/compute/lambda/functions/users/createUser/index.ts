import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { User, UserPreferences } from '../../../../../../types/userTypes';
import { CreateUserInput, CreateUserEvent } from '../../../../../../types/createUserTypes';

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME!;

/**
 * Lambda handler for CreateUser GraphQL mutation
 */
export const handler = async (event: CreateUserEvent): Promise<User> => {
  console.log('CreateUser Lambda invoked:', JSON.stringify(event, null, 2));

  try {
    const input = event.arguments.input;

    // Get user ID from Cognito identity
    const userId = event.identity?.sub;
    if (!userId) {
      throw new Error('Authentication required. User must be signed in to create profile.');
    }

    console.log('Creating user profile for:', userId);

    // Validate input
    validateInput(input);

    // Generate timestamps
    const now = new Date().toISOString();

    // Create default preferences
    const defaultPreferences: UserPreferences = {
      theme: 'auto',
      notifications: true,
      locationSharing: 'hubs_only',
      profileVisibility: 'public',
      isAnonymous: false,
    };

    // Create user object
    const user: User = {
      userId,
      profile: {
        displayName: input.displayName.trim(),
        bio: input.bio?.trim(),
        friends: [],
      },
      preferences: defaultPreferences,
      joinedAt: now,
      favoriteHubs: [],
      blockedUsers: [],
      updatedAt: now,
    };

    // Saving to DynamoDB with conditional check to prevent overwrites
    const putCommand = new PutCommand({
      TableName: USERS_TABLE_NAME,
      Item: user,
      // Ensure user doesn't already exist
      ConditionExpression: 'attribute_not_exists(userId)',
    });

    await docClient.send(putCommand);

    console.log('User profile created successfully:', userId);

    return user;

  } catch (error: any) {
    console.error('Error creating user:', error);
    
    // Handle specific DynamoDB errors
    if (error.name === 'ConditionalCheckFailedException') {
      throw new Error('User already exists. Cannot create duplicate profile.');
    }
    
    // Re-throw validation errors as-is
    if (error.message.includes('validation') || error.message.includes('required')) {
      throw error;
    }
    
    // Generic error for unexpected issues
    throw new Error(`Failed to create user: ${error.message}`);
  }
};

/**
 * Validate input data
 */
function validateInput(input: CreateUserInput): void {
  // Validate display name
  if (!input.displayName || input.displayName.trim().length === 0) {
    throw new Error('Display name is required.');
  }
  
  if (input.displayName.trim().length < 2) {
    throw new Error('Display name must be at least 2 characters long.');
  }
  
  if (input.displayName.length > 50) {
    throw new Error('Display name cannot exceed 50 characters.');
  }

  // Check for valid characters (letters, numbers, spaces, basic punctuation)
  const displayNameRegex = /^[a-zA-Z0-9\s\-_.]+$/;
  if (!displayNameRegex.test(input.displayName)) {
    throw new Error('Display name can only contain letters, numbers, spaces, hyphens, underscores, and periods.');
  }

  // Validate bio if provided
  if (input.bio !== undefined) {
    if (input.bio.length > 500) {
      throw new Error('Bio cannot exceed 500 characters.');
    }
  }
}