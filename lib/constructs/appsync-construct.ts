import * as cdk from 'aws-cdk-lib';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as path from 'path';

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
    new appsync.Resolver(this, 'CreateHubResolver', {
      api: this.api,
      typeName: 'Mutation',
      fieldName: 'createHub',
      dataSource: this.createHubDataSource,
      code: appsync.Code.fromInline(`
        import { util } from '@aws-appsync/utils';

        export function request(ctx) {
            return {
            operation: 'Invoke',
            payload: {
                arguments: ctx.args,
                fieldName: ctx.info.fieldName,
                identity: ctx.identity,
            }
            };
        }

        export function response(ctx) {
            if (ctx.error) {
            util.error(ctx.error.message, ctx.error.type);
            }
            return ctx.result;
        }
      `),
      runtime: appsync.FunctionRuntime.JS_1_0_0
    });

    new appsync.Resolver(this, 'GetHubResolver', {
      api: this.api,
      typeName: 'Query',
      fieldName: 'getHub',
      dataSource: this.getHubDataSource,
      code: appsync.Code.fromInline(`
        import { util } from '@aws-appsync/utils';

        export function request(ctx) {
          return {
            operation: 'Invoke',
            payload: {
              arguments: ctx.args,
              fieldName: ctx.info.fieldName,
              identity: ctx.identity,
            }
          };
        }

        export function response(ctx) {
          if (ctx.error) {
            util.error(ctx.error.message, ctx.error.type);
          }
          return ctx.result;
        }
      `),

      runtime: appsync.FunctionRuntime.JS_1_0_0
    });

    // Mutation: deleteHub (uses Lambda for ownership verification)
    new appsync.Resolver(this, 'DeleteHubResolver', {
      api: this.api,
      typeName: 'Mutation',
      fieldName: 'deleteHub',
      dataSource: this.deleteHubDataSource,
      code: appsync.Code.fromInline(`
        import { util } from '@aws-appsync/utils';

        export function request(ctx) {
          return {
            operation: 'Invoke',
            payload: {
              arguments: ctx.args,
              fieldName: ctx.info.fieldName,
              identity: ctx.identity,
            }
          };
        }

        export function response(ctx) {
        console.log('ctx.result type:', typeof ctx.result);
        console.log('ctx.result value:', JSON.stringify(ctx.result));
        
          if (ctx.error) {
            util.error(ctx.error.message, ctx.error.type);
          }
          return ctx.result;
        }
      `),
      runtime: appsync.FunctionRuntime.JS_1_0_0
    });

    new appsync.Resolver(this, 'GetNearbyHubsResolver', {
      api: this.api,
      typeName: 'Query',
      fieldName: 'getNearbyHubs',
      dataSource: this.getNearbyHubsDataSource,
      code: appsync.Code.fromInline(`
        import { util } from '@aws-appsync/utils';

        export function request(ctx) {
          return {
            operation: 'Invoke',
            payload: {
              arguments: ctx.args,
              fieldName: ctx.info.fieldName,
              identity: ctx.identity,
            }
          };
        }

        export function response(ctx) {
          if (ctx.error) {
            util.error(ctx.error.message, ctx.error.type);
          }
          return ctx.result;
        }
    `),

    runtime: appsync.FunctionRuntime.JS_1_0_0
    });

    // TODO: Add more resolvers as we implement them
    // Query: getHub (will use DynamoDB data source for simple lookup)
    // Query: getNearbyHubs (will use Lambda for geospatial queries)
    // Mutation: updateHub (might use DynamoDB data source)
    // Mutation: deleteHub (might use DynamoDB data source)
  }
}