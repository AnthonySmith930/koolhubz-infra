export interface AuthenticatedUser {
  userId: string
  username: string
}

export function getAuthenticatedUser(event: any): AuthenticatedUser {
  if (!event.identity || !event.identity.sub) {
    throw new Error('Authentication required. User must be signed in.')
  }

  return {
    userId: event.identity.sub,
    username: event.identity.username || event.identity.sub
  }
}
