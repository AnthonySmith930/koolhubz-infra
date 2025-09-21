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