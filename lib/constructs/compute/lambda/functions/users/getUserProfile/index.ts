import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import { getAuthenticatedUser } from '../../../helpers/getAuthenticatedUser'
import { UserProfile } from '../../../types/generated'
import { GetUserProfileEvent, GetUserProfileHandler } from '../../../types/events'

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: {
    removeUndefinedValues: true
  }
})

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME!

/**
 * Lambda handler for getUserProfile GraphQL query
 * Returns only the public profile information (user.profile)
 * Allows unauthenticated access to public profiles
 */
export const handler: GetUserProfileHandler = async (
  event: GetUserProfileEvent
): Promise<UserProfile | null> => {
  console.log('GetUserProfile Lambda invoked:', JSON.stringify(event, null, 2))

  try {
    const { userId: targetUserId } = event.arguments

    // Validate input
    if (!targetUserId) {
      throw new Error('userId is required')
    }

    // Authentication is not required for the method
    // But, we may need it for accessing private profiles
    let requestingUserId: string | null = null
    let authMethod: string = 'none'

    try {
      const { userId } = getAuthenticatedUser(event)
      requestingUserId = userId
    } catch {
      // Catch and continue
      // Allow unauthenticated requests - checking privacy later
      console.log('Unauthenticated request for profile:', targetUserId)
    }

    console.log(
      `Fetching profile for: ${targetUserId}, requester: ${requestingUserId || 'unauthenticated'}, auth: ${authMethod}`
    )

    // Get user from DynamoDB
    const getCommand = new GetCommand({
      TableName: USERS_TABLE_NAME,
      Key: { userId: targetUserId },
      // Only fetch the fields we need for profile
      ProjectionExpression: 'profile, preferences.profileVisibility'
    })

    const result = await docClient.send(getCommand)

    if (!result.Item) {
      console.log('User not found:', targetUserId)
      return null
    }

    const user = result.Item
    const profileVisibility = user.preferences?.profileVisibility || 'PUBLIC'

    // Apply privacy filtering
    if (!canViewProfile(profileVisibility, targetUserId, requestingUserId)) {
      console.log(
        `Profile access denied for user ${targetUserId}, visibility: ${profileVisibility}, requester: ${requestingUserId || 'unauthenticated'}`
      )
      throw new Error('You do not have permission to view this profile')
    }

    // Return only the profile data
    const userProfile: UserProfile = {
      displayName: user.profile.displayName,
      bio: user.profile.bio,
    }

    console.log('Profile retrieved successfully for user:', targetUserId)
    return userProfile
  } catch (error: any) {
    console.error('Error fetching user profile:', error)

    // Handle specific DynamoDB errors
    if (error.name === 'ResourceNotFoundException') {
      throw new Error('User table not found')
    }

    // Re-throw permission and validation errors as-is
    if (
      error.message.includes('permission') ||
      error.message.includes('required')
    ) {
      throw error
    }

    // Generic error for unexpected issues
    throw new Error(`Failed to fetch user profile: ${error.message}`)
  }
}

/**
 * Determine if the requesting user can view the target user's profile
 * Handles unauthenticated requests for public profiles
 */
function canViewProfile(
  profileVisibility: string,
  targetUserId: string,
  requestingUserId: string | null
): boolean {
  // Public profiles can be viewed by anyone (authenticated or not)
  if (profileVisibility === 'PUBLIC') {
    return true
  }

  // Private/Friends profiles require authentication
  if (!requestingUserId) {
    console.log('Unauthenticated request denied for non-public profile')
    return false
  }

  // Users can always view their own profile
  if (targetUserId === requestingUserId) {
    return true
  }

  // For now, treat FRIENDS same as PRIVATE (return false)
  // TODO: Implement friend relationship checking when friends feature is added
  if (profileVisibility === 'FRIENDS' || profileVisibility === 'PRIVATE') {
    console.log(`Profile is ${profileVisibility}, access denied for non-owner`)
    return false
  }

  // Default to deny access
  return false
}
