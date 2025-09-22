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
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  locationSharing: 'always' | 'hubs_only' | 'never';
  profileVisibility: 'public' | 'friends' | 'private';
  isAnonymous: boolean;
}