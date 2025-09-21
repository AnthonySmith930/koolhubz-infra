import * as cdk from 'aws-cdk-lib';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { Construct } from 'constructs';
import createHubResolver from './resolvers/mutations/createHubResolver';
import getHubResolver from './resolvers/queries/getHubResolver';
import deleteHubResolver from './resolvers/mutations/deleteHubResolver';
import getNearbyHubsResolver from './resolvers/queries/getNearbyHubsResolver';

interface AppSyncConstructProps {
  stage: string;
  hubsTable: dynamodb.Table;
  userPool: cognito.UserPool;
  createHubFunction: lambda.Function;
  getNearbyHubsFunction: lambda.Function;
  getHubFunction: lambda.Function;
  deleteHubFunction: lambda.Function;
}

export class AppSyncConstruct extends Construct {
  public readonly api: appsync.GraphqlApi;
  public readonly hubsDataSource: appsync.DynamoDbDataSource;
  public readonly createHubDataSource: appsync.LambdaDataSource;
  public readonly getNearbyHubsDataSource: appsync.LambdaDataSource;
  public readonly getHubDataSource: appsync.LambdaDataSource;
  public readonly deleteHubDataSource: appsync.LambdaDataSource;
  
  constructor(scope: Construct, id: string, props: AppSyncConstructProps) {
    super(scope, id);

    // Create the GraphQL API
    this.api = new appsync.GraphqlApi(this, 'KoolHubzApi', {
      name: `KoolHubz-${props.stage}-API`,
      
      // Schema from external file
      definition: appsync.Definition.fromFile(
        path.join(__dirname, 'schema', 'hubSchema.graphql')
      ),

      // Authentication configuration
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: cdk.Expiration.after(cdk.Duration.days(365)), // 1 year for development
            description: `KoolHubz ${props.stage} API Key`
          }
        },
        
        additionalAuthorizationModes: [
          {
            authorizationType: appsync.AuthorizationType.USER_POOL,
            userPoolConfig: {
              userPool: props.userPool,
              defaultAction: appsync.UserPoolDefaultAction.ALLOW
            }
          }
        ]
      },

      // Simplified logging configuration
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
        excludeVerboseContent: false
      },

      xrayEnabled: props.stage === 'prod'
    });

    // Create DynamoDB data source for Hubs table
    // TODO: Uncomment this when we add other resolvers that don't need lambda
    // this.hubsDataSource = this.api.addDynamoDbDataSource(
    //   'HubsDataSource',
    //   props.hubsTable,
    //   {
    //     name: 'HubsTable',
    //     description: 'DynamoDB data source for Hubs table'
    //   }
    // );

    // Create Lambda data source for CreateHub
    this.createHubDataSource = this.api.addLambdaDataSource(
      'CreateHubDataSource',
      props.createHubFunction,
      {
        name: 'CreateHubLambda',
        description: 'Lambda data source for hub creation with geohash indexing'
      }
    );

    // Create Lambda data source for GetHub
    this.getHubDataSource = this.api.addLambdaDataSource(
      'GetHubDataSource',
      props.getHubFunction,
      {
        name: 'GetHubLambda',
        description: 'Lambda data source for single hub lookup with access control'
      }
    );

    // Create Lambda data source for DeleteHub
    this.deleteHubDataSource = this.api.addLambdaDataSource(
      'DeleteHubDataSource',
      props.deleteHubFunction,
      {
        name: 'DeleteHubLambda',
        description: 'Lambda data source for hub deletion with ownership verification'
      }
    );

    // Create Lambda data source for GetNearbyHubs
    this.getNearbyHubsDataSource = this.api.addLambdaDataSource(
      'GetNearbyHubsDataSource',
      props.getNearbyHubsFunction,
      {
        name: 'GetNearbyHubsLambda',
        description: 'Lambda data source for geospatial hub queries'
      }
    );

    this.createResolvers()

    // Outputs for the mobile app and testing
    new cdk.CfnOutput(this, 'GraphQLApiEndpoint', {
      value: this.api.graphqlUrl,
      description: 'GraphQL API Endpoint',
      exportName: `KoolHubz-${props.stage}-GraphQLEndpoint`
    });

    new cdk.CfnOutput(this, 'GraphQLApiKey', {
      value: this.api.apiKey || 'No API Key',
      description: 'GraphQL API Key for testing',
      exportName: `KoolHubz-${props.stage}-GraphQLApiKey`
    });

    new cdk.CfnOutput(this, 'GraphQLApiId', {
      value: this.api.apiId,
      description: 'GraphQL API ID',
      exportName: `KoolHubz-${props.stage}-GraphQLApiId`
    });

    new cdk.CfnOutput(this, 'GraphQLRegion', {
      value: cdk.Stack.of(this).region,
      description: 'AWS Region for GraphQL API',
      exportName: `KoolHubz-${props.stage}-GraphQLRegion`
    });
  }

  /**
   * Create and attach resolvers to the GraphQL API
   */
  private createResolvers(): void {
    createHubResolver(this, this.createHubDataSource, this.api)
    getHubResolver(this, this.getHubDataSource, this.api)
    deleteHubResolver(this, this.deleteHubDataSource, this.api)
    getNearbyHubsResolver(this, this.getNearbyHubsDataSource, this.api)

    // TODO: Add more resolvers as we implement them
    // Mutation: updateHub (might use DynamoDB data source)
  }
}