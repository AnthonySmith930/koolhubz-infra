import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'
import { createLambdaFunction } from './helpers/lambdaHelpers'

interface MembershipsLambdaConstructProps {
  stage: string
  membershipsTable: dynamodb.Table
  hubsTable: dynamodb.Table
}

export class MembershipsLambdaConstruct extends Construct {
  public readonly addMemberFunction: lambda.Function

  constructor(
    scope: Construct,
    id: string,
    props: MembershipsLambdaConstructProps
  ) {
    super(scope, id)

    // AddMember Lambda Function
    this.addMemberFunction = createLambdaFunction({
      construct: this,
      id: 'AddMemberFunction',
      timeoutDuration: 30,
      stageName: props.stage,
      functionName: 'AddMember',
      entryPath:
        'lib/constructs/compute/lambda/functions/memberships/addMember/index.ts',
      description:
        'Adds a user to a hub with validation and duplicate checking',
      environment: {
        MEMBERSHIP_TABLE_NAME: props.membershipsTable.tableName,
        HUBS_TABLE_NAME: props.hubsTable.tableName,
        NODE_OPTIONS: '--enable-source-maps',
        STAGE: props.stage
      },
      table: props.membershipsTable // Helper grants read/write permissions
    })

    // Grant additional permissions for hub validation
    props.hubsTable.grantReadData(this.addMemberFunction)

    // Outputs for debugging
    new cdk.CfnOutput(this, 'AddMemberFunctionName', {
      value: this.addMemberFunction.functionName,
      description: 'AddMember Lambda Function Name',
      exportName: `KoolHubz-${props.stage}-AddMemberFunctionName`
    })

    new cdk.CfnOutput(this, 'AddMemberFunctionArn', {
      value: this.addMemberFunction.functionArn,
      description: 'AddMember Lambda Function ARN',
      exportName: `KoolHubz-${props.stage}-AddMemberFunctionArn`
    })
  }
}
