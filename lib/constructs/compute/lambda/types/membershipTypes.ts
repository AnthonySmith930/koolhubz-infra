export interface Membership {
  hubId: string
  userId: string
  joinedAt: string
  lastSeen: string
}

export interface AddMemberInput {
    hubId: string
    testUserId?: string
}

export interface AddMemberEvent {
  arguments: {
    input: AddMemberInput
  }
  identity?: {
    sub?: string
  }
}

export interface CleanupEvent {
  source: string
  action: string
}