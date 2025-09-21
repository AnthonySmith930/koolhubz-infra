export interface GetHubEvent {
  arguments: {
    hubId: string;
  };
  identity?: {
    sub: string;
  };
}