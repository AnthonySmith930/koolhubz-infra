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