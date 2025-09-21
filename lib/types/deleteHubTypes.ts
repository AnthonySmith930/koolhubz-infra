export interface DeleteHubEvent {
  arguments: {
    hubId: string;
    userId?: string;
  };
  identity?: {
    sub: string;
  };
}