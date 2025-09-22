import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface UsersTableConstructProps {
  stage: string;
}

export class UsersTableConstruct extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: UsersTableConstructProps) {
    super(scope, id);

    this.table = new dynamodb.Table(this, 'UsersTable', {
      tableName: `KoolHubz-${props.stage}-Users`,
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: props.stage === 'prod'
      },
      
      deletionProtection: props.stage === 'prod',
      
      removalPolicy: props.stage === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,

      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Outputs for debugging and cross-stack references
    new cdk.CfnOutput(this, 'UsersTableName', {
      value: this.table.tableName,
      description: 'DynamoDB Users Table Name',
      exportName: `KoolHubz-${props.stage}-UsersTableName`
    });

    new cdk.CfnOutput(this, 'UsersTableArn', {
      value: this.table.tableArn,
      description: 'DynamoDB Users Table ARN',
      exportName: `KoolHubz-${props.stage}-UsersTableArn`
    });
  }
}