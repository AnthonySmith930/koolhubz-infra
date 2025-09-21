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