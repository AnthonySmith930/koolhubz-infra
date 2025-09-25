import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'
import { MonitoringConstruct } from '../foundation/monitoring-construct'

interface MembersTableConstructProps {
  stage: string
}

export class MembersTableConstruct extends Construct {
  public readonly table: dynamodb.Table
  public readonly membersMonitoring: MonitoringConstruct

  constructor(scope: Construct, id: string, props: MembersTableConstructProps) {
    super(scope, id)

    this.table = new dynamodb.Table(this, 'MembersTable', {
      tableName: `KoolHubz-${props.stage}-Members`,
      partitionKey: {
        name: 'hubId',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: props.stage === 'prod'
      },
      removalPolicy:
        props.stage === 'prod'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY
    })

    // GSIs
    this.table.addGlobalSecondaryIndex({
      indexName: 'UserIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'joinedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    })

    // Outputs
    new cdk.CfnOutput(this, 'MembersTableName', {
      value: this.table.tableName,
      description: 'DynamoDB Members Table Name',
      exportName: `KoolHubz-${props.stage}-MembersTableName`
    })
  }
}
