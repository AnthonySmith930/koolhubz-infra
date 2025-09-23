export interface User {
  userId: string;
  profile: UserProfile;
  preferences: UserPreferences;
  joinedAt: string;
  currentHub?: string;
  favoriteHubs: Array<{
    name: string;
    hubId: string;
  }>;
  blockedUsers?: string[];
  updatedAt: string;
}

export interface UserPreferences {
  theme: 'LIGHT' | 'DARK' | 'AUTO';
  notifications: boolean;
  locationSharing: 'ALWAYS' | 'HUBS_ONLY' | 'NEVER';
  profileVisibility: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  isAnonymous: boolean;
}

export interface UserProfile {
  displayName: string;
  bio?: string;
  friends?: string[];
}

export interface CreateUserInput {
  displayName: string;
  bio?: string;
  avatarUrl?: string;
}

export interface CreateUserEvent {
  info: {
    fieldName: string;
    parentTypeName: string;
  };
  arguments: {
    input: CreateUserInput;
  };
  identity?: {
    sub: string; // Cognito user ID
    username?: string;
  };
  request: {
    headers: Record<string, string>;
  };
}

interface GetMeArgs {
  testUserId?: string;  // For API key testing only
}

export interface GetMeEvent {
  info: {
    fieldName: string;
    parentTypeName: string;
  };
  arguments: GetMeArgs;
  identity?: {
    sub: string; // Cognito user ID
    username?: string;
  };
  request: {
    headers: Record<string, string>;
  };
}

export interface GetUserProfileArgs {
  userId: string;
  testUserId?: string;  // For API key testing - who is making the request
}

export interface GetUserProfileEvent {
  info: {
    fieldName: string;
    parentTypeName: string;
  };
  arguments: GetUserProfileArgs;
  identity?: {
    sub: string; // Cognito user ID of the requesting user
    username?: string;
  };
  request: {
    headers: Record<string, string>;
  };
}

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
  testUserId?: string;  // For API key testing
}

export interface UpdateProfileEvent {
  info: {
    fieldName: string;
    parentTypeName: string;
  };
  arguments: {
    input: UpdateProfileInput;
  };
  identity?: {
    sub: string; // Cognito user ID
    username?: string;
  };
  request: {
    headers: Record<string, string>;
  };
}