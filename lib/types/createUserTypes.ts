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