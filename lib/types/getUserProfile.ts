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