import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { createHubLambdaFunction } from '../../helpers/lambdaHelpers';

interface HubsLambdaConstructProps {
  stage: string;
  hubsTable: dynamodb.Table;
}

export class HubsLambdaConstruct extends Construct {
  public readonly createHubFunction: lambda.Function;
  public readonly getNearbyHubsFunction: lambda.Function;
  public readonly getHubFunction: lambda.Function;
  public readonly deleteHubFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: HubsLambdaConstructProps) {
    super(scope, id);

    // CreateHub Lambda Function
    this.createHubFunction = createHubLambdaFunction({
      construct: this,
      id: 'CreateHubFunction',
      stageName: props.stage,
      functionName: 'CreateHub',
      tableName: props.hubsTable.tableName,
      entryPath: 'lib/constructs/compute/lambda/functions/createHub/index.ts',
      description: 'Creates a new hub with geohash indexing and validation',
      nodeModules: ['uuid', 'ngeohash'],
      hubsTable: props.hubsTable
    })

    // GetHub Lambda Function
    this.getHubFunction = createHubLambdaFunction({
      construct: this,
      id: 'GetHubFunction',
      stageName: props.stage,
      functionName: 'GetHub',
      tableName: props.hubsTable.tableName,
      entryPath: 'lib/constructs/compute/lambda/functions/getHub/index.ts',
      description: 'Gets a single hub by ID with access control',
      hubsTable: props.hubsTable,
    })

    // DeleteHub Lambda Function  
    this.deleteHubFunction = createHubLambdaFunction({
      construct: this,
      id: 'DeleteHubFunction',
      stageName: props.stage,
      functionName: 'DeleteHub',
      tableName: props.hubsTable.tableName,
      entryPath: 'lib/constructs/compute/lambda/functions/deleteHub/index.ts',
      description: 'Deletes a hub with ownership verification',
      hubsTable: props.hubsTable,
    })

    // GetNearbyHubs Lambda Function
    this.getNearbyHubsFunction = createHubLambdaFunction({
      construct: this,
      id: 'GetNearbyHubsFunction',
      stageName: props.stage,
      functionName: 'GetNearbyHubs',
      tableName: props.hubsTable.tableName,
      entryPath: 'lib/constructs/compute/lambda/functions/getNearbyHubs/index.ts',
      description: 'Gets hubs near a specific location using geospatial queries',
      hubsTable: props.hubsTable,
      nodeModules: ['ngeohash', 'geolib'],
      readOnly: true
    })

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