import * as cdk from 'aws-cdk-lib'
import * as appsync from 'aws-cdk-lib/aws-appsync'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as path from 'path'
import { Construct } from 'constructs'
import createHubResolver from './resolvers/mutations/hubs/createHubResolver'
import getHubResolver from './resolvers/queries/hubs/getHubResolver'
import deleteHubResolver from './resolvers/mutations/hubs/deleteHubResolver'
import getNearbyHubsResolver from './resolvers/queries/hubs/getNearbyHubsResolver'
import createUserResolver from './resolvers/mutations/users/createUserResolver'
import getUserProfileResolver from './resolvers/queries/users/getUserProfileResolver'
import getMeResolver from './resolvers/queries/users/getMeResolver'
import updateProfileResolver from './resolvers/mutations/users/updateProfileResolver'
import updateUserPreferencesResolver from './resolvers/mutations/users/updateUserPreferencesResolver'
import addMemberResolver from './resolvers/mutations/memberships/addMemberResolver'
import removeMemberResolver from './resolvers/mutations/memberships/removeMemberResolver'

interface AppSyncConstructProps {
  stage: string
  hubsTable: dynamodb.Table
  usersTable: dynamodb.Table
  userPool: cognito.UserPool
  createHubFunction: lambda.Function
  getNearbyHubsFunction: lambda.Function
  getHubFunction: lambda.Function
  deleteHubFunction: lambda.Function
  createUserFunction: lambda.Function
  getUserProfileFunction: lambda.Function
  getMeFunction: lambda.Function
  updateProfileFunction: lambda.Function
  updateUserPreferencesFunction: lambda.Function
  addMemberFunction: lambda.Function
  removeMemberFunction: lambda.Function
}

export class AppSyncConstruct extends Construct {
  public readonly api: appsync.GraphqlApi

  // Hub datasources
  public readonly hubsDataSource: appsync.DynamoDbDataSource
  public readonly createHubDataSource: appsync.LambdaDataSource
  public readonly getNearbyHubsDataSource: appsync.LambdaDataSource
  public readonly getHubDataSource: appsync.LambdaDataSource
  public readonly deleteHubDataSource: appsync.LambdaDataSource

  // User datasources
  public readonly createUserDataSource: appsync.LambdaDataSource
  public readonly getUserProfileDataSource: appsync.LambdaDataSource
  public readonly getMeDataSource: appsync.LambdaDataSource
  public readonly updateProfileDataSource: appsync.LambdaDataSource
  public readonly updateUserPreferencesDataSource: appsync.LambdaDataSource

  // Member datasources
  public readonly addMemberDataSource: appsync.LambdaDataSource
  public readonly removeMemberDataSource: appsync.LambdaDataSource

  constructor(scope: Construct, id: string, props: AppSyncConstructProps) {
    super(scope, id)

    this.api = new appsync.GraphqlApi(this, 'KoolHubzApi', {
      name: `KoolHubz-${props.stage}-API`,

      // Schema from external file
      definition: appsync.Definition.fromFile(
        path.join(__dirname, 'schema', 'schema.graphql')
      ),

      // Authentication configuration
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool: props.userPool,
            defaultAction: appsync.UserPoolDefaultAction.ALLOW
          }
        }
      },

      // Simplified logging configuration
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
        excludeVerboseContent: false
      },

      xrayEnabled: props.stage === 'prod'
    })

    // Hub data sources
    this.createHubDataSource = this.api.addLambdaDataSource(
      'CreateHubDataSource',
      props.createHubFunction,
      {
        name: 'CreateHubLambda',
        description: 'Lambda data source for hub creation with geohash indexing'
      }
    )

    this.getHubDataSource = this.api.addLambdaDataSource(
      'GetHubDataSource',
      props.getHubFunction,
      {
        name: 'GetHubLambda',
        description:
          'Lambda data source for single hub lookup with access control'
      }
    )

    this.deleteHubDataSource = this.api.addLambdaDataSource(
      'DeleteHubDataSource',
      props.deleteHubFunction,
      {
        name: 'DeleteHubLambda',
        description:
          'Lambda data source for hub deletion with ownership verification'
      }
    )

    this.getNearbyHubsDataSource = this.api.addLambdaDataSource(
      'GetNearbyHubsDataSource',
      props.getNearbyHubsFunction,
      {
        name: 'GetNearbyHubsLambda',
        description: 'Lambda data source for geospatial hub queries'
      }
    )

    // User data sources
    this.createUserDataSource = this.api.addLambdaDataSource(
      'CreateUserDataSource',
      props.createUserFunction,
      {
        name: 'CreateUserLambda',
        description: 'Lambda data source for user profile creation'
      }
    )

    this.getMeDataSource = this.api.addLambdaDataSource(
      'GetMeDataSource',
      props.getMeFunction,
      {
        name: 'GetMeLambda',
        description: 'Lambda data source to get user data'
      }
    )

    this.getUserProfileDataSource = this.api.addLambdaDataSource(
      'GetUserProfileDataSource',
      props.getUserProfileFunction,
      {
        name: 'GetUserProfileLambda',
        description: 'Lambda data source to get user profile'
      }
    )

    this.updateProfileDataSource = this.api.addLambdaDataSource(
      'UpdateProfileDataSource',
      props.updateProfileFunction,
      {
        name: 'UpdateProfileLambda',
        description: 'Lambda data source to update user profile'
      }
    )

    this.updateUserPreferencesDataSource = this.api.addLambdaDataSource(
      'UpdateUserPreferencesDataSource',
      props.updateUserPreferencesFunction,
      {
        name: 'UpdateUserPreferencesLambda',
        description: 'Lambda data source to update user preferences'
      }
    )

    // Membership datasources
    this.addMemberDataSource = this.api.addLambdaDataSource(
      'AddMemberDataSource',
      props.addMemberFunction,
      {
        name: 'AddMemberLambda',
        description: 'Lambda data source to add a member to a hub'
      }
    )

    this.removeMemberDataSource = this.api.addLambdaDataSource(
      'RemoveMemberDataSource',
      props.removeMemberFunction,
      {
        name: 'RemoveMemberLambda',
        description: 'Lambda data source to remove a member from a hub'
      }
    )

    this.createResolvers()

    this.createOutputs(props.stage)
  }

  private createResolvers(): void {
    // Hub resolvers
    createHubResolver(this, this.createHubDataSource, this.api)
    getHubResolver(this, this.getHubDataSource, this.api)
    deleteHubResolver(this, this.deleteHubDataSource, this.api)
    getNearbyHubsResolver(this, this.getNearbyHubsDataSource, this.api)

    // User resolvers
    createUserResolver(this, this.createUserDataSource, this.api)
    getUserProfileResolver(this, this.getUserProfileDataSource, this.api)
    getMeResolver(this, this.getMeDataSource, this.api)
    updateProfileResolver(this, this.updateProfileDataSource, this.api)
    updateUserPreferencesResolver(
      this,
      this.updateUserPreferencesDataSource,
      this.api
    )

    // Member resolvers
    addMemberResolver(this, this.addMemberDataSource, this.api)
    removeMemberResolver(this, this.removeMemberDataSource, this.api)
  }

  private createOutputs(stage: string): void {
    new cdk.CfnOutput(this, 'GraphQLApiEndpoint', {
      value: this.api.graphqlUrl,
      description: 'GraphQL API Endpoint',
      exportName: `KoolHubz-${stage}-GraphQLEndpoint`
    })

    new cdk.CfnOutput(this, 'GraphQLApiKey', {
      value: this.api.apiKey || 'No API Key',
      description: 'GraphQL API Key for testing',
      exportName: `KoolHubz-${stage}-GraphQLApiKey`
    })

    new cdk.CfnOutput(this, 'GraphQLApiId', {
      value: this.api.apiId,
      description: 'GraphQL API ID',
      exportName: `KoolHubz-${stage}-GraphQLApiId`
    })

    new cdk.CfnOutput(this, 'GraphQLRegion', {
      value: cdk.Stack.of(this).region,
      description: 'AWS Region for GraphQL API',
      exportName: `KoolHubz-${stage}-GraphQLRegion`
    })
  }
}
