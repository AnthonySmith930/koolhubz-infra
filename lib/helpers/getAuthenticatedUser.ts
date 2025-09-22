export interface AuthContext {
  userId: string;
  authMethod: 'cognito' | 'api-key';
  stage: string;
}

export function getAuthenticatedUser(event: any, input?: any): AuthContext {
  const stage = process.env.STAGE!;
  
  // Security: Block test userId in production
  if (input?.userId && stage === 'prod') {
    throw new Error('userId parameter not allowed in production');
  }

  // Get userId based on environment and auth method
  const userId = event.identity?.sub || 
    (stage !== 'prod' ? input?.userId : null);

  if (!userId) {
    throw new Error(stage === 'prod' 
      ? 'Cognito authentication required' 
      : 'Authentication required or userId must be provided for testing'
    );
  }

  const authMethod = event.identity?.sub ? 'cognito' : 'api-key';
  
  // Audit logging
  console.log(`Auth: userId=${userId}, method=${authMethod}, stage=${stage}`);

  return { userId, authMethod, stage };
}