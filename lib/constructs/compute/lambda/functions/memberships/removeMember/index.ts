import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { getAuthenticatedUser } from '../../../helpers/getAuthenticatedUser'
import { RemoveMemberInput } from '../../../types/generated'
import { RemoveMemberEvent, RemoveMemberHandler } from '../../../types/events'

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: {
    removeUndefinedValues: true
  }
})

const MEMBERSHIPS_TABLE_NAME = process.env.MEMBERSHIPS_TABLE_NAME!

/**
 * Lambda handler for removeMembership GraphQL mutation
 */
export const handler: RemoveMemberHandler = async (event: RemoveMemberEvent): Promise<boolean> => {
  console.log('RemoveMember Lambda invoked:', JSON.stringify(event, null, 2))

  try {
    const input = event.arguments.input
    const { userId } = getAuthenticatedUser(event)

    validateInput(input)
    
    console.log(`Removing user ${userId} from hub ${input.hubId}`)


    // Check if membership exists
    await validateMembershipExists(input.hubId, userId)

    // Remove membership record
    await removeMembershipRecord(input.hubId, userId)

    console.log(`Successfully removed user ${userId} from hub ${input.hubId}`)

    return true

  } catch (error: any) {
    console.error('Error removing member:', error)

    // Handle specific DynamoDB errors
    if (error.name === 'ConditionalCheckFailedException') {
      throw new Error('Member could not be removed - please try again')
    }

    // Re-throw validation errors as-is
    if (
      error.message.includes('validation') ||
      error.message.includes('required')
    ) {
      throw error
    }

    // Generic error for unexpected issues
    throw new Error(`Failed to remove member: ${error.message}`)
  }
}

/**
 * Validate input parameters
 */
function validateInput(input: RemoveMemberInput): void {
  if (!input.hubId || input.hubId.trim().length === 0) {
    throw new Error('Hub ID is required')
  }
}

/**
 * Validate that membership exists
 */
async function validateMembershipExists(hubId: string, userId: string): Promise<void> {
  const getCommand = new GetCommand({
    TableName: MEMBERSHIPS_TABLE_NAME,
    Key: { hubId, userId }
  })

  const result = await docClient.send(getCommand)

  if (!result.Item) {
    throw new Error('Membership not found - user is not a member of this hub')
  }
}

/**
 * Remove membership record from DynamoDB
 */
async function removeMembershipRecord(hubId: string, userId: string): Promise<void> {
  const deleteCommand = new DeleteCommand({
    TableName: MEMBERSHIPS_TABLE_NAME,
    Key: { hubId, userId },
    // Ensure membership still exists before deleting
    ConditionExpression: 'attribute_exists(hubId) AND attribute_exists(userId)'
  })

  await docClient.send(deleteCommand)
}