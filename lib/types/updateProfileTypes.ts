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