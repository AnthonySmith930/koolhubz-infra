export interface AppSyncContext {
  identity: {
    sub: string
    username: string
    claims: Record<string, any>
    sourceIp: string[]
    defaultAuthStrategy: string
  }
  request: {
    headers: Record<string, string>
  }
}