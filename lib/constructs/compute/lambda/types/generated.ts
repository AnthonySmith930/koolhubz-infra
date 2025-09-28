import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { AppSyncContext } from './context';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  AWSDateTime: { input: string; output: string; }
  AWSEmail: { input: string; output: string; }
  AWSJSON: { input: string; output: string; }
  AWSPhone: { input: string; output: string; }
  AWSURL: { input: string; output: string; }
};

export type AddMemberInput = {
  hubId: Scalars['ID']['input'];
};

export type CreateHubInput = {
  description: Scalars['String']['input'];
  hubType: HubType | '%future added value';
  latitude: Scalars['Float']['input'];
  longitude: Scalars['Float']['input'];
  name: Scalars['String']['input'];
  radius: Scalars['Int']['input'];
};

export type CreateUserInput = {
  bio?: InputMaybe<Scalars['String']['input']>;
  displayName: Scalars['String']['input'];
};

export type FavoriteHub = {
  __typename?: 'FavoriteHub';
  hubId: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type Hub = {
  __typename?: 'Hub';
  createdAt: Scalars['AWSDateTime']['output'];
  createdBy: Scalars['ID']['output'];
  description: Scalars['String']['output'];
  geohash: Scalars['String']['output'];
  hubId: Scalars['ID']['output'];
  hubType: HubType | '%future added value';
  isActive: Scalars['Boolean']['output'];
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
  memberCount: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  radius: Scalars['Int']['output'];
  updatedAt: Scalars['AWSDateTime']['output'];
};

export enum HubType {
  Private = 'PRIVATE',
  Public = 'PUBLIC'
}

export enum LocationSharing {
  Off = 'OFF',
  On = 'ON'
}

export type Membership = {
  __typename?: 'Membership';
  hubId: Scalars['ID']['output'];
  joinedAt: Scalars['AWSDateTime']['output'];
  lastSeen: Scalars['AWSDateTime']['output'];
  userId: Scalars['ID']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addMember: Membership;
  createHub: Hub;
  createUser: User;
  deleteHub: Scalars['Boolean']['output'];
  removeMember: Scalars['Boolean']['output'];
  updateProfile: UserProfile;
  updateUserPreferences: UserPreferences;
};


export type MutationAddMemberArgs = {
  input: AddMemberInput;
};


export type MutationCreateHubArgs = {
  input: CreateHubInput;
};


export type MutationCreateUserArgs = {
  input: CreateUserInput;
};


export type MutationDeleteHubArgs = {
  hubId: Scalars['ID']['input'];
};


export type MutationRemoveMemberArgs = {
  input: RemoveMemberInput;
};


export type MutationUpdateProfileArgs = {
  input: UpdateProfileInput;
};


export type MutationUpdateUserPreferencesArgs = {
  input: UpdateUserPreferencesInput;
};

export enum ProfileVisibility {
  Friends = 'FRIENDS',
  Private = 'PRIVATE',
  Public = 'PUBLIC'
}

export type Query = {
  __typename?: 'Query';
  getHub?: Maybe<Hub>;
  getMe?: Maybe<User>;
  getNearbyHubs: Array<Hub>;
  getUserProfile?: Maybe<UserProfile>;
};


export type QueryGetHubArgs = {
  hubId: Scalars['ID']['input'];
};


export type QueryGetNearbyHubsArgs = {
  hubType?: InputMaybe<HubType>;
  latitude: Scalars['Float']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  longitude: Scalars['Float']['input'];
  radiusKm?: InputMaybe<Scalars['Float']['input']>;
};


export type QueryGetUserProfileArgs = {
  userId: Scalars['ID']['input'];
};

export type RemoveMemberInput = {
  hubId: Scalars['ID']['input'];
};

export enum Theme {
  Auto = 'AUTO',
  Dark = 'DARK',
  Light = 'LIGHT'
}

export type UpdateProfileInput = {
  bio?: InputMaybe<Scalars['String']['input']>;
  displayName?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUserPreferencesInput = {
  isAnonymous?: InputMaybe<Scalars['Boolean']['input']>;
  locationSharing?: InputMaybe<LocationSharing | '%future added value'>;
  notifications?: InputMaybe<Scalars['Boolean']['input']>;
  profileVisibility?: InputMaybe<ProfileVisibility | '%future added value'>;
  theme?: InputMaybe<Theme | '%future added value'>;
};

export type User = {
  __typename?: 'User';
  blockedUsers?: Maybe<Array<Scalars['String']['output']>>;
  currentHub?: Maybe<Scalars['String']['output']>;
  favoriteHubs: Array<FavoriteHub>;
  joinedAt: Scalars['AWSDateTime']['output'];
  preferences: UserPreferences;
  profile: UserProfile;
  updatedAt: Scalars['AWSDateTime']['output'];
  userId: Scalars['ID']['output'];
};

export type UserPreferences = {
  __typename?: 'UserPreferences';
  isAnonymous: Scalars['Boolean']['output'];
  locationSharing: LocationSharing | '%future added value';
  notifications: Scalars['Boolean']['output'];
  profileVisibility: ProfileVisibility | '%future added value';
  theme: Theme | '%future added value';
};

export type UserProfile = {
  __typename?: 'UserProfile';
  bio?: Maybe<Scalars['String']['output']>;
  displayName?: Maybe<Scalars['String']['output']>;
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = Record<PropertyKey, never>, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;





/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  AWSDateTime: ResolverTypeWrapper<Scalars['AWSDateTime']['output']>;
  AWSEmail: ResolverTypeWrapper<Scalars['AWSEmail']['output']>;
  AWSJSON: ResolverTypeWrapper<Scalars['AWSJSON']['output']>;
  AWSPhone: ResolverTypeWrapper<Scalars['AWSPhone']['output']>;
  AWSURL: ResolverTypeWrapper<Scalars['AWSURL']['output']>;
  AddMemberInput: AddMemberInput;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  CreateHubInput: CreateHubInput;
  CreateUserInput: CreateUserInput;
  FavoriteHub: ResolverTypeWrapper<FavoriteHub>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  Hub: ResolverTypeWrapper<Hub>;
  HubType: HubType;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  LocationSharing: LocationSharing;
  Membership: ResolverTypeWrapper<Membership>;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  ProfileVisibility: ProfileVisibility;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  RemoveMemberInput: RemoveMemberInput;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Theme: Theme;
  UpdateProfileInput: UpdateProfileInput;
  UpdateUserPreferencesInput: UpdateUserPreferencesInput;
  User: ResolverTypeWrapper<User>;
  UserPreferences: ResolverTypeWrapper<UserPreferences>;
  UserProfile: ResolverTypeWrapper<UserProfile>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  AWSDateTime: Scalars['AWSDateTime']['output'];
  AWSEmail: Scalars['AWSEmail']['output'];
  AWSJSON: Scalars['AWSJSON']['output'];
  AWSPhone: Scalars['AWSPhone']['output'];
  AWSURL: Scalars['AWSURL']['output'];
  AddMemberInput: AddMemberInput;
  Boolean: Scalars['Boolean']['output'];
  CreateHubInput: CreateHubInput;
  CreateUserInput: CreateUserInput;
  FavoriteHub: FavoriteHub;
  Float: Scalars['Float']['output'];
  Hub: Hub;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  Membership: Membership;
  Mutation: Record<PropertyKey, never>;
  Query: Record<PropertyKey, never>;
  RemoveMemberInput: RemoveMemberInput;
  String: Scalars['String']['output'];
  UpdateProfileInput: UpdateProfileInput;
  UpdateUserPreferencesInput: UpdateUserPreferencesInput;
  User: User;
  UserPreferences: UserPreferences;
  UserProfile: UserProfile;
};

export interface AwsDateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['AWSDateTime'], any> {
  name: 'AWSDateTime';
}

export interface AwsEmailScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['AWSEmail'], any> {
  name: 'AWSEmail';
}

export interface AwsjsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['AWSJSON'], any> {
  name: 'AWSJSON';
}

export interface AwsPhoneScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['AWSPhone'], any> {
  name: 'AWSPhone';
}

export interface AwsurlScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['AWSURL'], any> {
  name: 'AWSURL';
}

export type FavoriteHubResolvers<ContextType = AppSyncContext, ParentType extends ResolversParentTypes['FavoriteHub'] = ResolversParentTypes['FavoriteHub']> = {
  hubId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type HubResolvers<ContextType = AppSyncContext, ParentType extends ResolversParentTypes['Hub'] = ResolversParentTypes['Hub']> = {
  createdAt?: Resolver<ResolversTypes['AWSDateTime'], ParentType, ContextType>;
  createdBy?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  geohash?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  hubId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  hubType?: Resolver<ResolversTypes['HubType'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  latitude?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  longitude?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  memberCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  radius?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['AWSDateTime'], ParentType, ContextType>;
};

export type MembershipResolvers<ContextType = AppSyncContext, ParentType extends ResolversParentTypes['Membership'] = ResolversParentTypes['Membership']> = {
  hubId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  joinedAt?: Resolver<ResolversTypes['AWSDateTime'], ParentType, ContextType>;
  lastSeen?: Resolver<ResolversTypes['AWSDateTime'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
};

export type MutationResolvers<ContextType = AppSyncContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  addMember?: Resolver<ResolversTypes['Membership'], ParentType, ContextType, RequireFields<MutationAddMemberArgs, 'input'>>;
  createHub?: Resolver<ResolversTypes['Hub'], ParentType, ContextType, RequireFields<MutationCreateHubArgs, 'input'>>;
  createUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationCreateUserArgs, 'input'>>;
  deleteHub?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteHubArgs, 'hubId'>>;
  removeMember?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveMemberArgs, 'input'>>;
  updateProfile?: Resolver<ResolversTypes['UserProfile'], ParentType, ContextType, RequireFields<MutationUpdateProfileArgs, 'input'>>;
  updateUserPreferences?: Resolver<ResolversTypes['UserPreferences'], ParentType, ContextType, RequireFields<MutationUpdateUserPreferencesArgs, 'input'>>;
};

export type QueryResolvers<ContextType = AppSyncContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  getHub?: Resolver<Maybe<ResolversTypes['Hub']>, ParentType, ContextType, RequireFields<QueryGetHubArgs, 'hubId'>>;
  getMe?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  getNearbyHubs?: Resolver<Array<ResolversTypes['Hub']>, ParentType, ContextType, RequireFields<QueryGetNearbyHubsArgs, 'latitude' | 'limit' | 'longitude' | 'radiusKm'>>;
  getUserProfile?: Resolver<Maybe<ResolversTypes['UserProfile']>, ParentType, ContextType, RequireFields<QueryGetUserProfileArgs, 'userId'>>;
};

export type UserResolvers<ContextType = AppSyncContext, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  blockedUsers?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  currentHub?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  favoriteHubs?: Resolver<Array<ResolversTypes['FavoriteHub']>, ParentType, ContextType>;
  joinedAt?: Resolver<ResolversTypes['AWSDateTime'], ParentType, ContextType>;
  preferences?: Resolver<ResolversTypes['UserPreferences'], ParentType, ContextType>;
  profile?: Resolver<ResolversTypes['UserProfile'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['AWSDateTime'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
};

export type UserPreferencesResolvers<ContextType = AppSyncContext, ParentType extends ResolversParentTypes['UserPreferences'] = ResolversParentTypes['UserPreferences']> = {
  isAnonymous?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  locationSharing?: Resolver<ResolversTypes['LocationSharing'], ParentType, ContextType>;
  notifications?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  profileVisibility?: Resolver<ResolversTypes['ProfileVisibility'], ParentType, ContextType>;
  theme?: Resolver<ResolversTypes['Theme'], ParentType, ContextType>;
};

export type UserProfileResolvers<ContextType = AppSyncContext, ParentType extends ResolversParentTypes['UserProfile'] = ResolversParentTypes['UserProfile']> = {
  bio?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  displayName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type Resolvers<ContextType = AppSyncContext> = {
  AWSDateTime?: GraphQLScalarType;
  AWSEmail?: GraphQLScalarType;
  AWSJSON?: GraphQLScalarType;
  AWSPhone?: GraphQLScalarType;
  AWSURL?: GraphQLScalarType;
  FavoriteHub?: FavoriteHubResolvers<ContextType>;
  Hub?: HubResolvers<ContextType>;
  Membership?: MembershipResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  UserPreferences?: UserPreferencesResolvers<ContextType>;
  UserProfile?: UserProfileResolvers<ContextType>;
};

