import { EventBridgeEvent } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { 
  DynamoDBDocumentClient, 
  ScanCommand, 
  DeleteCommand,
  ScanCommandOutput 
} from '@aws-sdk/lib-dynamodb'
import { Membership } from '../../../types/generated'

// Initialize clients
const ddbClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(ddbClient)

// Environment variables
const MEMBERSHIPS_TABLE_NAME = process.env.MEMBERSHIPS_TABLE_NAME!
const HEARTBEAT_TIMEOUT_MINUTES = parseInt(process.env.HEARTBEAT_TIMEOUT_MINUTES || '20')

interface CleanupEvent {
  source: string
  action: string
}

/**
 * Lambda handler for scheduled member cleanup
 */
export const handler = async (event: EventBridgeEvent<string, CleanupEvent>): Promise<void> => {
  console.log('Starting scheduled member cleanup:', JSON.stringify(event, null, 2))
  
  try {
    const cleanupStats = await performMembershipsCleanup()
    
    console.log('Cleanup completed successfully:', cleanupStats)
    
  } catch (error) {
    console.error('Memberhip cleanup failed:', error)
    throw error // Re-throw to trigger CloudWatch alarm
  }
}

/**
 * Perform the actual member cleanup process
 */
async function performMembershipsCleanup(): Promise<{ membersRemoved: number, hubsAffected: number }> {
  const cutoffTime = new Date()
  cutoffTime.setMinutes(cutoffTime.getMinutes() - HEARTBEAT_TIMEOUT_MINUTES)
  const cutoffISO = cutoffTime.toISOString()
  
  console.log(`Cleaning up members inactive since before: ${cutoffISO}`)

  let totalRemoved = 0
  const affectedHubs = new Set<string>()
  let lastEvaluatedKey: any = undefined
  let scanCount = 0

  do {
    scanCount++
    console.log(`Starting cleanup scan #${scanCount}`)
    
    try {
      // Scan for inactive members (paginated)
      const scanCommand = new ScanCommand({
        TableName: MEMBERSHIPS_TABLE_NAME,
        FilterExpression: 'lastSeen < :cutoff',
        ExpressionAttributeValues: {
          ':cutoff': cutoffISO
        },
        ExclusiveStartKey: lastEvaluatedKey,
        Limit: 25 // Process in small batches to avoid timeouts
      })

      const result: ScanCommandOutput = await docClient.send(scanCommand)
      const staleMemberships = result.Items as Membership[] || []

      console.log(`Scan #${scanCount}: Found ${staleMemberships.length} inactive members`)

      // Remove inactive members
      for (const membership of staleMemberships) {
        try {
          await removeInactiveMember(membership)
          totalRemoved++
          affectedHubs.add(membership.hubId)
          
          console.log(`Removed inactive member: ${membership.userId} from hub: ${membership.hubId} (last seen: ${membership.lastSeen})`)
          
        } catch (error) {
          console.error(`Failed to remove member ${membership.userId} from hub ${membership.hubId}:`, error)
          // Continue with other members
        }
      }

      lastEvaluatedKey = result.LastEvaluatedKey

      // Add delay between scans to avoid overwhelming DynamoDB
      if (lastEvaluatedKey && staleMemberships.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100)) // 100ms delay
      }

    } catch (error) {
      console.error(`Error during cleanup scan #${scanCount}:`, error)
      break // Exit loop on scan failure
    }

  } while (lastEvaluatedKey && scanCount < 100) // Safety limit to prevent infinite loops

  const stats = {
    membersRemoved: totalRemoved,
    hubsAffected: affectedHubs.size
  }

  if (totalRemoved > 0) {
    console.log(`Cleanup complete. Removed ${totalRemoved} inactive members from ${affectedHubs.size} hubs.`)
  } else {
    console.log('Cleanup complete. No inactive members found.')
  }

  return stats
}

/**
 * Remove an inactive member from the Members table
 */
async function removeInactiveMember(membership: Membership): Promise<void> {
  const deleteCommand = new DeleteCommand({
    TableName: MEMBERSHIPS_TABLE_NAME,
    Key: {
      hubId: membership.hubId,
      userId: membership.userId
    }
  })

  await docClient.send(deleteCommand)
  // hub member count will be updated by the memberCount 
  // lambda triggered by these deletes
}