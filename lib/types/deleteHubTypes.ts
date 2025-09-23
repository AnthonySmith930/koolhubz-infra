export interface DeleteHubEvent {
  arguments: {
    hubId: string;
    testUserId?: string;
  };
  identity?: {
    sub: string;
  };
}