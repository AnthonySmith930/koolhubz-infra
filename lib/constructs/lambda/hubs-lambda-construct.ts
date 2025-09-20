import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

interface HubsLambdaConstructProps {
  stage: string;
  hubsTable: dynamodb.Table;
}

export class HubsLambdaConstruct extends Construct {
  public readonly createHubFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: HubsLambdaConstructProps) {
    super(scope, id);

    // CreateHub Lambda Function
    this.createHubFunction = new nodejs.NodejsFunction(this, 'CreateHubFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      functionName: `KoolHubz-${props.stage}-CreateHub`,
      entry: path.resolve(process.cwd(), 'lib/constructs/lambda/functions/createHub/index.ts'),
      description: 'Creates a new hub with geohash indexing and validation',
      environment: {
        HUBS_TABLE_NAME: props.hubsTable.tableName,
        NODE_OPTIONS: '--enable-source-maps',
        STAGE: props.stage,
      },
      retryAttempts: 2,
      bundling: {
        minify: props.stage === 'prod',
        sourceMap: true,
        target: 'node20',
        nodeModules: ['uuid', 'ngeohash'],
        externalModules: [
          '@aws-sdk/client-dynamodb',
          '@aws-sdk/lib-dynamodb',
        ],
      },
    });

    // Grant DynamoDB permissions to CreateHub function
    this.grantDynamoDBPermissions(this.createHubFunction, props.hubsTable);

    // // Create CloudWatch Log Group with retention
    // new cdk.aws_logs.LogGroup(this, 'CreateHubLogGroup', {
    //   logGroupName: `/aws/lambda/${this.createHubFunction.functionName}`,
    //   retention: props.stage === 'prod' 
    //     ? cdk.aws_logs.RetentionDays.ONE_MONTH 
    //     : cdk.aws_logs.RetentionDays.ONE_WEEK,
    //   removalPolicy: props.stage === 'prod' 
    //     ? cdk.RemovalPolicy.RETAIN 
    //     : cdk.RemovalPolicy.DESTROY,
    // });

    // Outputs for debugging
    new cdk.CfnOutput(this, 'CreateHubFunctionName', {
      value: this.createHubFunction.functionName,
      description: 'CreateHub Lambda Function Name',
      exportName: `KoolHubz-${props.stage}-CreateHubFunctionName`,
    });

    new cdk.CfnOutput(this, 'CreateHubFunctionArn', {
      value: this.createHubFunction.functionArn,
      description: 'CreateHub Lambda Function ARN',
      exportName: `KoolHubz-${props.stage}-CreateHubFunctionArn`,
    });
  }

  /**
   * Grant necessary DynamoDB permissions to a Lambda function
   */
  private grantDynamoDBPermissions(lambdaFunction: lambda.Function, table: dynamodb.Table): void {
    // Grant read/write permissions to the main table
    table.grantReadWriteData(lambdaFunction);

    // Grant permissions to query GSIs
    lambdaFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:Query',
          'dynamodb:Scan',
        ],
        resources: [
          `${table.tableArn}/index/*`, // All GSIs
        ],
      })
    );

    // Grant permissions for conditional writes (prevent overwrites)
    lambdaFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:ConditionCheckItem',
        ],
        resources: [table.tableArn],
      })
    );
  }
}