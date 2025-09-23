import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { getAuthenticatedUser } from '../../../helpers/getAuthenticatedUser'
import {
  User,
  UserProfile,
  UpdateProfileEvent,
  UpdateProfileInput
} from '../../../types/userTypes'

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: {
    removeUndefinedValues: true
  }
})

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME!

/**
 * Lambda handler for updateProfile GraphQL mutation
 * Updates user profile data with optimistic locking
 */
export const handler = async (
  event: UpdateProfileEvent
): Promise<UserProfile> => {
  console.log('UpdateProfile Lambda invoked:', JSON.stringify(event, null, 2))

  try {
    const input = event.arguments.input

    // Get authenticated user (required)
    const auth = getAuthenticatedUser(event, input)
    const userId = auth.userId

    console.log(
      `Updating profile for user: ${userId}, auth: ${auth.authMethod}`
    )

    // Validate input
    validateInput(input)

    const now = new Date().toISOString()

    // Build update expression dynamically based on provided fields
    const updateExpressions: string[] = []
    const expressionAttributeNames: Record<string, string> = {}
    const expressionAttributeValues: Record<string, any> = {}

    // Always update the updatedAt timestamp
    updateExpressions.push('#updatedAt = :updatedAt')
    expressionAttributeNames['#updatedAt'] = 'updatedAt'
    expressionAttributeValues[':updatedAt'] = now

    // Update display name if provided
    if (input.displayName !== undefined) {
      updateExpressions.push('#profile.#displayName = :displayName')
      expressionAttributeNames['#profile'] = 'profile'
      expressionAttributeNames['#displayName'] = 'displayName'
      expressionAttributeValues[':displayName'] = input.displayName.trim()
    }

    // Update bio if provided (including empty string to clear bio)
    if (input.bio !== undefined) {
      if (input.bio.trim() === '') {
        // Remove bio field entirely if empty string provided
        updateExpressions.push('REMOVE #profile.#bio')
        expressionAttributeNames['#profile'] = 'profile'
        expressionAttributeNames['#bio'] = 'bio'
      } else {
        // Set bio to new value
        updateExpressions.push('#profile.#bio = :bio')
        expressionAttributeNames['#profile'] = 'profile'
        expressionAttributeNames['#bio'] = 'bio'
        expressionAttributeValues[':bio'] = input.bio.trim()
      }
    }

    // Perform the update with optimistic locking

    // Separate SET and REMOVE operations
    const setExpressions = updateExpressions.filter(
      (expr) => !expr.includes('REMOVE')
    )
    const removeExpressions = updateExpressions
      .filter((expr) => expr.includes('REMOVE'))
      .map((expr) => expr.replace('REMOVE ', ''))

    // Build UpdateExpression
    let updateExpression = `SET ${setExpressions.join(', ')}`
    if (removeExpressions.length > 0) {
      updateExpression += ` REMOVE ${removeExpressions.join(', ')}`
    }

    const updateCommand = new UpdateCommand({
      TableName: USERS_TABLE_NAME,
      Key: { userId },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      // Ensure user still exists (basic optimistic locking)
      ConditionExpression: 'attribute_exists(userId)',
      ReturnValues: 'ALL_NEW'
    })

    const updateResult = await docClient.send(updateCommand)

    if (!updateResult.Attributes) {
      throw new Error('Failed to update profile - no data returned')
    }

    const updatedUser = updateResult.Attributes as User

    const updatedProfile: UserProfile = {
      displayName: updatedUser.profile.displayName,
      bio: updatedUser.profile.bio
    }

    console.log('Profile updated successfully for user:', userId)
    return updatedProfile
  } catch (error: any) {
    console.error('Error updating user profile:', error)

    // Handle specific DynamoDB errors
    if (error.name === 'ConditionalCheckFailedException') {
      throw new Error(
        'Profile update failed - user may have been deleted. Please try again.'
      )
    }

    if (error.name === 'ResourceNotFoundException') {
      throw new Error('User table not found')
    }

    // Re-throw authentication and validation errors as-is
    if (
      error.message.includes('Authentication required') ||
      error.message.includes('validation') ||
      error.message.includes('required')
    ) {
      throw error
    }

    // Generic error for unexpected issues
    throw new Error(`Failed to update profile: ${error.message}`)
  }
}

/**
 * Validate update input data
 */
function validateInput(input: UpdateProfileInput): void {
  // Check if at least one field is being updated
  if (input.displayName === undefined && input.bio === undefined) {
    throw new Error(
      'At least one field (displayName or bio) must be provided for update.'
    )
  }

  // Validate display name if provided
  if (input.displayName !== undefined) {
    if (input.displayName.trim().length === 0) {
      throw new Error('Display name cannot be empty.')
    }

    if (input.displayName.trim().length < 2) {
      throw new Error('Display name must be at least 2 characters long.')
    }

    if (input.displayName.length > 50) {
      throw new Error('Display name cannot exceed 50 characters.')
    }

    // Check for valid characters (letters, numbers, spaces, basic punctuation)
    const displayNameRegex = /^[a-zA-Z0-9\s\-_.]+$/
    if (!displayNameRegex.test(input.displayName)) {
      throw new Error(
        'Display name can only contain letters, numbers, spaces, hyphens, underscores, and periods.'
      )
    }
  }

  // Validate bio if provided (allow empty string to clear bio)
  if (input.bio !== undefined) {
    if (input.bio.length > 500) {
      throw new Error('Bio cannot exceed 500 characters.')
    }
  }
}
