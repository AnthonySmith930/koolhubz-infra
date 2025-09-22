export interface User {
  userId: string;
  profile: {
    displayName: string;
    bio?: string;
    friends?: string[];
  };
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