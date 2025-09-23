export interface Hub {
    hubId: string;
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    radius: number;
    hubType: 'PUBLIC' | 'PRIVATE';
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    geohash: string;
}

export interface HubWithDistance extends Hub {
    distance: number;
}

export interface CreateHubInput {
    userId?: string; // Optional for hybrid auth
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    radius: number;
    hubType: 'PUBLIC' | 'PRIVATE';
}

export interface CreateHubEvent {
  info: {
    fieldName: string;
    parentTypeName: string;
  };
  arguments: {
    input: CreateHubInput;
  };
  identity?: {
    sub: string; // Cognito user ID
    username?: string;
  };
  request: {
    headers: Record<string, string>;
  };
}

export interface DeleteHubEvent {
  arguments: {
    hubId: string;
    testUserId?: string;
  };
  identity?: {
    sub: string;
  };
}

export interface GetHubEvent {
  arguments: {
    hubId: string;
  };
  identity?: {
    sub: string;
  };
}

export interface GetNearbyHubsInput {
    latitude: number;
    longitude: number;
    radiusKm?: number;
    limit?: number;
    hubType?: 'PUBLIC' | 'PRIVATE';
}

export interface GetNearbyHubsEvent {
  arguments: {
    latitude: number;
    longitude: number;
    radiusKm?: number;
    limit?: number;
    hubType?: 'PUBLIC' | 'PRIVATE';
  };
  identity?: {
    sub: string;
  };
}