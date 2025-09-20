import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';
import { createHubLambdaFunction } from '../../helpers/lambdaHelpers';

interface HubsLambdaConstructProps {
  stage: string;
  hubsTable: dynamodb.Table;
}

export class HubsLambdaConstruct extends Construct {
  public readonly createHubFunction: lambda.Function;
  public readonly getNearbyHubsFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: HubsLambdaConstructProps) {
    super(scope, id);

    // CreateHub Lambda Function
    this.createHubFunction = createHubLambdaFunction({
      construct: this,
      id: 'CreateHubFunction',
      stageName: props.stage,
      functionName: 'CreateHub',
      tableName: props.hubsTable.tableName,
      entryPath: 'lib/constructs/lambda/functions/createHub/index.ts',
      description: 'Creates a new hub with geohash indexing and validation',
      nodeModules: ['uuid', 'ngeohash'],
      hubsTable: props.hubsTable
    })

    // GetNearbyHubs Lambda Function
    this.getNearbyHubsFunction = createHubLambdaFunction({
      construct: this,
      id: 'GetNearbyHubsFunction',
      stageName: props.stage,
      functionName: 'GetNearbyHubs',
      tableName: props.hubsTable.tableName,
      entryPath: 'lib/constructs/lambda/functions/getNearbyHubs/index.ts',
      description: 'Gets hubs near a specific location using geospatial queries',
      nodeModules: ['ngeohash', 'geolib'],
      hubsTable: props.hubsTable,
      readOnly: true
    })

    // Create CloudWatch Log Group with retention
    new cdk.aws_logs.LogGroup(this, 'CreateHubManagedLogGroup', { // Changed ID
      logGroupName: `/aws/lambda/${this.createHubFunction.functionName}-managed`,
      retention: props.stage === 'prod' 
        ? cdk.aws_logs.RetentionDays.ONE_MONTH 
        : cdk.aws_logs.RetentionDays.ONE_WEEK,
      removalPolicy: props.stage === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
    });

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
}