import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand
} from '@aws-sdk/lib-dynamodb'
import { Hub } from '../../../types/hubTypes'
import {
  Membership,
  AddMemberEvent,
  AddMemberInput
} from '../../../types/membershipTypes'
import { getAuthenticatedUser } from '../../../helpers/getAuthenticatedUser'

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: {
    removeUndefinedValues: true
  }
})

const MEMBERSHIPS_TABLE_NAME = process.env.MEMBERSHIPS_TABLE_NAME!
const HUBS_TABLE_NAME = process.env.HUBS_TABLE_NAME!

/**
 * Lambda handler for addMember GraphQL mutation
 */
export const handler = async (event: AddMemberEvent): Promise<Membership> => {
  console.log('AddMember Lambda invoked:', JSON.stringify(event, null, 2))

  try {
    const input = event.arguments.input
    const auth = getAuthenticatedUser(event, input)
    const userId = auth.userId

    console.log(`Adding user ${userId} to hub ${input.hubId}`)

    validateInput(input)

    // Check if hub exists and is joinable
    await validateHub(input.hubId)

    // Check if user is already a member
    await checkExistingMembership(input.hubId, userId)

    const member = await createMemberRecord(input.hubId, userId)

    console.log(`Successfully added user ${userId} to hub ${input.hubId}`)

    return member
  } catch (error: any) {
    console.error('Error adding member:', error)

    if (error.name === 'ConditionalCheckFailedException') {
      throw new Error('Unable to join hub - please try again')
    }

    throw new Error(`Failed to add member: ${error.message}`)
  }
}

function validateInput(input: AddMemberInput): void {
  if (!input.hubId || input.hubId.trim().length === 0) {
    throw new Error('Hub ID is required')
  }
}

/**
 * Validate that hub exists and is joinable
 */
async function validateHub(hubId: string): Promise<void> {
  const getCommand = new GetCommand({
    TableName: HUBS_TABLE_NAME,
    Key: { hubId }
  })

  const result = await docClient.send(getCommand)

  if (!result.Item) {
    throw new Error('Hub not found')
  }

  const hub = result.Item as Hub

  if (!hub.isActive) {
    throw new Error('Hub is not active')
  }

  // For now, only allow joining PUBLIC hubs
  // TODO: Later add logic for private hub invites
  if (hub.hubType === 'PRIVATE') {
    throw new Error('Cannot join private hub without invitation')
  }
}

/**
 * Check if user is already a member of this hub
 */
async function checkExistingMembership(
  hubId: string,
  userId: string
): Promise<void> {
  const getCommand = new GetCommand({
    TableName: MEMBERSHIPS_TABLE_NAME,
    Key: { hubId, userId }
  })

  const result = await docClient.send(getCommand)

  if (result.Item) {
    throw new Error('User is already a member of this hub')
  }
}

/**
 * Create member record in DynamoDB
 */
async function createMemberRecord(
  hubId: string,
  userId: string
): Promise<Membership> {
  const now = new Date().toISOString()

  const membership: Membership = {
    hubId,
    userId,
    joinedAt: now,
    lastSeen: now
  }

  const putCommand = new PutCommand({
    TableName: MEMBERSHIPS_TABLE_NAME,
    Item: membership,
    ConditionExpression:
      'attribute_not_exists(hubId) AND attribute_not_exists(userId)'
  })

  await docClient.send(putCommand)

  return membership
}
