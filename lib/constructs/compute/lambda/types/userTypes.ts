export interface User {
  userId: string
  profile: UserProfile
  preferences: UserPreferences
  joinedAt: string
  currentHub?: string
  favoriteHubs: Array<{
    name: string
    hubId: string
  }>
  blockedUsers?: string[]
  updatedAt: string
}

export interface UserPreferences {
  theme: string;
  notifications: boolean;
  locationSharing: string;
  profileVisibility: string;
  isAnonymous: boolean;
}

export interface UpdateUserPreferencesInput {
  testUserId?: string,
  theme?: 'LIGHT' | 'DARK' | 'AUTO'
  notifications?: boolean
  locationSharing?: 'ON' | 'OFF'
  profileVisibility?: 'PUBLIC' | 'FRIENDS' | 'PRIVATE'
  isAnonymous?: boolean
}

export interface UpdateUserPreferencesEvent {
  info: {
    fieldName: string;
    parentTypeName: string;
  };
  arguments: {
    input: UpdateUserPreferencesInput;
  };
  identity?: {
    sub: string; // Cognito user ID
    username?: string;
  };
  request: {
    headers: Record<string, string>;
  };
}

export interface UserProfile {
  displayName: string
  bio?: string
  friends?: string[]
}

export interface CreateUserInput {
  displayName: string
  bio?: string
  avatarUrl?: string
}

export interface CreateUserEvent {
  info: {
    fieldName: string
    parentTypeName: string
  }
  arguments: {
    input: CreateUserInput
  }
  identity?: {
    sub: string // Cognito user ID
    username?: string
  }
  request: {
    headers: Record<string, string>
  }
}

interface GetMeArgs {
  testUserId?: string // For API key testing only
}

export interface GetMeEvent {
  info: {
    fieldName: string
    parentTypeName: string
  }
  arguments: GetMeArgs
  identity?: {
    sub: string // Cognito user ID
    username?: string
  }
  request: {
    headers: Record<string, string>
  }
}

export interface GetUserProfileArgs {
  userId: string
  testUserId?: string // For API key testing - who is making the request
}

export interface GetUserProfileEvent {
  info: {
    fieldName: string
    parentTypeName: string
  }
  arguments: GetUserProfileArgs
  identity?: {
    sub: string // Cognito user ID of the requesting user
    username?: string
  }
  request: {
    headers: Record<string, string>
  }
}

export interface UpdateProfileInput {
  testUserId?: string // For API key testing
  displayName?: string
  bio?: string
}

export interface UpdateProfileEvent {
  info: {
    fieldName: string
    parentTypeName: string
  }
  arguments: {
    input: UpdateProfileInput
  }
  identity?: {
    sub: string // Cognito user ID
    username?: string
  }
  request: {
    headers: Record<string, string>
  }
}
