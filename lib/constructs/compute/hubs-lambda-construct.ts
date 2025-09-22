import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { createLambdaFunction } from '../../helpers/lambdaHelpers';

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
    this.createHubFunction = createLambdaFunction({
      construct: this,
      id: 'CreateHubFunction',
      timeoutDuration: 30,
      stageName: props.stage,
      functionName: 'CreateHub',
      entryPath: 'lib/constructs/compute/lambda/functions/hubs/createHub/index.ts',
      description: 'Creates a new hub with geohash indexing and validation',
      nodeModules: ['uuid', 'ngeohash'],
      envTable: {
        HUBS_TABLE_NAME: props.hubsTable.tableName
      },
      table: props.hubsTable
    })

    // GetHub Lambda Function
    this.getHubFunction = createLambdaFunction({
      construct: this,
      id: 'GetHubFunction',
      timeoutDuration: 30,
      stageName: props.stage,
      functionName: 'GetHub',
      entryPath: 'lib/constructs/compute/lambda/functions/hubs/getHub/index.ts',
      description: 'Gets a single hub by ID with access control',
      envTable: {
        HUBS_TABLE_NAME: props.hubsTable.tableName
      },
      table: props.hubsTable,
    })

    // DeleteHub Lambda Function  
    this.deleteHubFunction = createLambdaFunction({
      construct: this,
      id: 'DeleteHubFunction',
      timeoutDuration: 30,
      stageName: props.stage,
      functionName: 'DeleteHub',
      entryPath: 'lib/constructs/compute/lambda/functions/hubs/deleteHub/index.ts',
      description: 'Deletes a hub with ownership verification',
      envTable: {
        HUBS_TABLE_NAME: props.hubsTable.tableName
      },
      table: props.hubsTable,
    })

    // GetNearbyHubs Lambda Function
    this.getNearbyHubsFunction = createLambdaFunction({
      construct: this,
      id: 'GetNearbyHubsFunction',
      timeoutDuration: 30,
      stageName: props.stage,
      functionName: 'GetNearbyHubs',
      entryPath: 'lib/constructs/compute/lambda/functions/hubs/getNearbyHubs/index.ts',
      description: 'Gets hubs near a specific location using geospatial queries',
      table: props.hubsTable,
      nodeModules: ['ngeohash', 'geolib'],
      envTable: {
        HUBS_TABLE_NAME: props.hubsTable.tableName
      },
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