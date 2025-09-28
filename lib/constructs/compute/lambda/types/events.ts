import type {
  // Query argument types
  QueryGetHubArgs,
  QueryGetNearbyHubsArgs,
  QueryGetUserProfileArgs,

  // Mutation argument types
  MutationCreateUserArgs,
  MutationCreateHubArgs,
  MutationDeleteHubArgs,
  MutationUpdateProfileArgs,
  MutationUpdateUserPreferencesArgs,
  MutationAddMemberArgs,
  MutationRemoveMemberArgs,

  // Return types
  User,
  Hub,
  UserProfile,
  UserPreferences,
  Membership
} from './generated'

// Base AppSync Lambda event structure
export interface BaseAppSyncEvent<TArguments = Record<string, never>> {
  arguments: TArguments
  identity: {
    sub: string
    username: string
    claims: Record<string, any>
    sourceIp: string[]
    defaultAuthStrategy: string
  }
  source: any
  request: {
    headers: Record<string, string>
  }
  prev: {
    result: any
  }
  info: {
    fieldName: string
    parentTypeName: string
    variables: Record<string, any>
  }
}

// Query Event Types
export type GetHubEvent = BaseAppSyncEvent<QueryGetHubArgs>
export type GetMeEvent = BaseAppSyncEvent<Record<string, never>> // No arguments
export type GetNearbyHubsEvent = BaseAppSyncEvent<QueryGetNearbyHubsArgs>
export type GetUserProfileEvent = BaseAppSyncEvent<QueryGetUserProfileArgs>

// Mutation Event Types
export type CreateUserEvent = BaseAppSyncEvent<MutationCreateUserArgs>
export type CreateHubEvent = BaseAppSyncEvent<MutationCreateHubArgs>
export type DeleteHubEvent = BaseAppSyncEvent<MutationDeleteHubArgs>
export type UpdateProfileEvent = BaseAppSyncEvent<MutationUpdateProfileArgs>
export type UpdateUserPreferencesEvent =
  BaseAppSyncEvent<MutationUpdateUserPreferencesArgs>
export type AddMemberEvent = BaseAppSyncEvent<MutationAddMemberArgs>
export type RemoveMemberEvent = BaseAppSyncEvent<MutationRemoveMemberArgs>

// Lambda Handler Type Definitions
export type GetHubHandler = (event: GetHubEvent) => Promise<Hub | null>
export type GetMeHandler = (event: GetMeEvent) => Promise<User | null>
export type GetNearbyHubsHandler = (event: GetNearbyHubsEvent) => Promise<Hub[]>
export type GetUserProfileHandler = (
  event: GetUserProfileEvent
) => Promise<UserProfile | null>

export type CreateUserHandler = (event: CreateUserEvent) => Promise<User>
export type CreateHubHandler = (event: CreateHubEvent) => Promise<Hub>
export type DeleteHubHandler = (event: DeleteHubEvent) => Promise<boolean>
export type UpdateProfileHandler = (
  event: UpdateProfileEvent
) => Promise<UserProfile>
export type UpdateUserPreferencesHandler = (
  event: UpdateUserPreferencesEvent
) => Promise<UserPreferences>
export type AddMemberHandler = (event: AddMemberEvent) => Promise<Membership>
export type RemoveMemberHandler = (event: RemoveMemberEvent) => Promise<boolean>