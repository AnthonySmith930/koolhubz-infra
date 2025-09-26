import { DynamoDBStreamEvent, DynamoDBRecord } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'

// Initialize clients
const ddbClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(ddbClient)

// Environment variables
const HUBS_TABLE_NAME = process.env.HUBS_TABLE_NAME!

/**
 * Lambda handler for DynamoDB Stream events - Updates hub member counts in real-time
 */
export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  console.log(`Processing ${event.Records.length} DynamoDB stream records`)

  try {
    // The lambda is set to handle upto 10 records at a time
    // so we group records by hubId to batch updates.
    // This prevents needing to access the hub table  multiple times for
    // members leaving/entering the same hub
    const hubUpdates = new Map<string, number>()

    for (const record of event.Records) {
      try {
        const memberCountChange = await processStreamRecord(record)

        if (memberCountChange.hubId && memberCountChange.delta !== 0) {
          const currentDelta = hubUpdates.get(memberCountChange.hubId) || 0
          hubUpdates.set(
            memberCountChange.hubId,
            currentDelta + memberCountChange.delta
          )
        }
      } catch (error) {
        console.error(
          'Failed to process stream record:',
          record.eventName,
          error
        )
        // Continue processing other records instead of failing entire batch
      }
    }

    // Update hub member counts
    let successCount = 0
    for (const [hubId, delta] of hubUpdates.entries()) {
      try {
        await updateHubMemberCount(hubId, delta)
        successCount++
        console.log(`Updated hub ${hubId} member count by ${delta}`)
      } catch (error) {
        console.error(`Failed to update hub ${hubId} member count:`, error)
      }
    }

    console.log(`Stream processing complete. Updated ${successCount} hubs.`)
  } catch (error) {
    console.error('Stream processing failed:', error)
    throw error
  }
}

/**
 * Process individual DynamoDB stream record
 */
async function processStreamRecord(
  record: DynamoDBRecord
): Promise<{ hubId?: string; delta: number }> {
  const eventName = record.eventName
  console.log(`Processing ${eventName} event`)

  if (eventName === 'INSERT') {
    // New member joined
    const newImage = record.dynamodb?.NewImage
    if (newImage?.hubId?.S) {
      return { hubId: newImage.hubId.S, delta: 1 }
    }
  } else if (eventName === 'REMOVE') {
    // Member left/removed
    const oldImage = record.dynamodb?.OldImage
    if (oldImage?.hubId?.S) {
      return { hubId: oldImage.hubId.S, delta: -1 }
    }
  }

  return { delta: 0 } // No change needed
}

/**
 * Update hub member count in Hubs table
 */
async function updateHubMemberCount(
  hubId: string,
  delta: number
): Promise<void> {
  const updateCommand = new UpdateCommand({
    TableName: HUBS_TABLE_NAME,
    Key: { hubId },
    UpdateExpression: 'ADD memberCount :delta',
    ConditionExpression: 'attribute_exists(hubId)',
    ExpressionAttributeValues: {
      ':delta': delta
    }
  })

  await docClient.send(updateCommand)
}
