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