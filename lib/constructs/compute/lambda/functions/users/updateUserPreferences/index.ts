import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { getAuthenticatedUser } from '../../../helpers/getAuthenticatedUser';
import { UserPreferences, UpdateUserPreferencesInput, UpdateUserPreferencesEvent } from '../../../types/userTypes';

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: {
    removeUndefinedValues: true
  }
});

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME!;

/**
 * Lambda handler for updateUserPreferences GraphQL mutation
 * Updates user preference settings and returns the updated preferences
 */
export const handler = async (event: UpdateUserPreferencesEvent): Promise<UserPreferences> => {
  console.log('UpdateUserPreferences Lambda invoked:', JSON.stringify(event, null, 2));

  try {
    const input = event.arguments.input;

    // Get authenticated user (required)
    const auth = getAuthenticatedUser(event, input);
    const userId = auth.userId;

    console.log(`Updating preferences for user: ${userId}, auth: ${auth.authMethod}`);

    // Validate input
    validateInput(input);

    const now = new Date().toISOString();

    // Build update expression dynamically based on provided fields
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    // Always update the updatedAt timestamp
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = now;

    // Update theme if provided
    if (input.theme !== undefined) {
      updateExpressions.push('#preferences.#theme = :theme');
      expressionAttributeNames['#preferences'] = 'preferences';
      expressionAttributeNames['#theme'] = 'theme';
      expressionAttributeValues[':theme'] = input.theme;
    }

    // Update notifications if provided
    if (input.notifications !== undefined) {
      updateExpressions.push('#preferences.#notifications = :notifications');
      expressionAttributeNames['#preferences'] = 'preferences';
      expressionAttributeNames['#notifications'] = 'notifications';
      expressionAttributeValues[':notifications'] = input.notifications;
    }

    // Update location sharing if provided
    if (input.locationSharing !== undefined) {
      updateExpressions.push('#preferences.#locationSharing = :locationSharing');
      expressionAttributeNames['#preferences'] = 'preferences';
      expressionAttributeNames['#locationSharing'] = 'locationSharing';
      expressionAttributeValues[':locationSharing'] = input.locationSharing;
    }

    // Update profile visibility if provided
    if (input.profileVisibility !== undefined) {
      updateExpressions.push('#preferences.#profileVisibility = :profileVisibility');
      expressionAttributeNames['#preferences'] = 'preferences';
      expressionAttributeNames['#profileVisibility'] = 'profileVisibility';
      expressionAttributeValues[':profileVisibility'] = input.profileVisibility;
    }

    // Update anonymous posting if provided
    if (input.isAnonymous !== undefined) {
      updateExpressions.push('#preferences.#isAnonymous = :isAnonymous');
      expressionAttributeNames['#preferences'] = 'preferences';
      expressionAttributeNames['#isAnonymous'] = 'isAnonymous';
      expressionAttributeValues[':isAnonymous'] = input.isAnonymous;
    }

    // Build UpdateExpression
    const updateExpression = `SET ${updateExpressions.join(', ')}`;

    // Perform the update
    const updateCommand = new UpdateCommand({
      TableName: USERS_TABLE_NAME,
      Key: { userId },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      // Ensure user still exists
      ConditionExpression: 'attribute_exists(userId)',
      ReturnValues: 'ALL_NEW',
    });

    const updateResult = await docClient.send(updateCommand);

    if (!updateResult.Attributes) {
      throw new Error('Failed to update preferences - no data returned');
    }

    const updatedUser = updateResult.Attributes;

    // Return only the updated preferences data
    const updatedPreferences: UserPreferences = {
      theme: updatedUser.preferences.theme,
      notifications: updatedUser.preferences.notifications,
      locationSharing: updatedUser.preferences.locationSharing,
      profileVisibility: updatedUser.preferences.profileVisibility,
      isAnonymous: updatedUser.preferences.isAnonymous,
    };

    console.log('Preferences updated successfully for user:', userId);
    return updatedPreferences;

  } catch (error: any) {
    console.error('Error updating user preferences:', error);
    
    // Handle specific DynamoDB errors
    if (error.name === 'ConditionalCheckFailedException') {
      throw new Error('Preferences update failed - user may have been deleted. Please try again.');
    }
    
    if (error.name === 'ResourceNotFoundException') {
      throw new Error('User table not found');
    }
    
    // Re-throw authentication and validation errors as-is
    if (error.message.includes('Authentication required') || 
        error.message.includes('validation') || 
        error.message.includes('required')) {
      throw error;
    }
    
    // Generic error for unexpected issues
    throw new Error(`Failed to update preferences: ${error.message}`);
  }
};

/**
 * Validate preferences input data
 */
function validateInput(input: UpdateUserPreferencesInput): void {
  // Check if at least one preference field is being updated
  if (input.theme === undefined && 
      input.notifications === undefined && 
      input.locationSharing === undefined && 
      input.profileVisibility === undefined && 
      input.isAnonymous === undefined) {
    throw new Error('At least one preference field must be provided for update.');
  }

  // Validate theme if provided
  if (input.theme !== undefined) {
    const validThemes = ['LIGHT', 'DARK', 'AUTO'];
    if (!validThemes.includes(input.theme)) {
      throw new Error('Theme must be one of: LIGHT, DARK, AUTO');
    }
  }

  // Validate location sharing if provided
  if (input.locationSharing !== undefined) {
    const validLocationSettings = ['ON', 'OFF'];
    if (!validLocationSettings.includes(input.locationSharing)) {
      throw new Error('Location sharing must be one of: ALWAYS, HUBS_ONLY, NEVER');
    }
  }

  // Validate profile visibility if provided
  if (input.profileVisibility !== undefined) {
    const validVisibilitySettings = ['PUBLIC', 'FRIENDS', 'PRIVATE'];
    if (!validVisibilitySettings.includes(input.profileVisibility)) {
      throw new Error('Profile visibility must be one of: PUBLIC, FRIENDS, PRIVATE');
    }
  }
}