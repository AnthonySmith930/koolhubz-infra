import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface HubsTableConstructProps {
  stage: string;
}

export class HubsTableConstruct extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: HubsTableConstructProps) {
    super(scope, id);

    this.table = new dynamodb.Table(this, 'HubsTable', {
      tableName: `KoolHubz-${props.stage}-Hubs`,
      partitionKey: {
        name: 'hubId',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: props.stage === 'prod'
      },
      
      removalPolicy: props.stage === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,

      // Enable DynamoDB Streams for real-time updates
      // commenting out for now. May add this when I 
      // need Dynamo steams for various reasons.
      // stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
    });

    // Global Secondary Index for location-based queries
    this.table.addGlobalSecondaryIndex({
      indexName: 'LocationIndex',
      partitionKey: {
        name: 'geohash',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'hubId',
        type: dynamodb.AttributeType.STRING
      },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // GSI for finding hubs by creator
    this.table.addGlobalSecondaryIndex({
      indexName: 'CreatorIndex',
      partitionKey: {
        name: 'creatorId',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING
      },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // Output the table name and ARN
    new cdk.CfnOutput(this, 'HubsTableName', {
      value: this.table.tableName,
      description: 'DynamoDB Hubs Table Name',
      exportName: `KoolHubz-${props.stage}-HubsTableName`
    });

    new cdk.CfnOutput(this, 'HubsTableArn', {
      value: this.table.tableArn,
      description: 'DynamoDB Hubs Table ARN',
      exportName: `KoolHubz-${props.stage}-HubsTableArn`
    });
  }
}