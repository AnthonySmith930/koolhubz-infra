import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as path from 'path'
import { Construct } from 'constructs'

interface MemberCountUpdateLambdaConstructProps {
  stage: string
  membersTable: dynamodb.Table
  hubsTable: dynamodb.Table
}

export class MemberCountUpdateLambdaConstruct extends Construct {
  public readonly memberCountUpdateFunction: lambda.Function

  constructor(
    scope: Construct,
    id: string,
    props: MemberCountUpdateLambdaConstructProps
  ) {
    super(scope, id)

    // Create Member Count Update Lambda
    this.memberCountUpdateFunction = new nodejs.NodejsFunction(
      this,
      'MemberCountUpdateFunction',
      {
        functionName: `KoolHubz-${props.stage}-MemberCountUpdate`,
        description: 'Updates hub member counts from DynamoDB Streams',
        entry: path.resolve(
          process.cwd(),
          'lib/constructs/compute/lambda/functions/members/memberCountUpdate/index.ts'
        ),
        runtime: lambda.Runtime.NODEJS_20_X,
        timeout: cdk.Duration.seconds(30),
        memorySize: 128,
        retryAttempts: 2,
        environment: {
          HUBS_TABLE_NAME: props.hubsTable.tableName,
          STAGE: props.stage
        },
        bundling: {
          minify: props.stage === 'prod',
          sourceMap: true,
          target: 'node20',
          externalModules: [
            '@aws-sdk/client-dynamodb',
            '@aws-sdk/lib-dynamodb',
            '@aws-sdk/client-cloudwatch'
          ]
        }
      }
    )

    this.grantPermissions(props.membersTable, props.hubsTable)

    this.setupStreamTrigger(props.membersTable)

    this.createOutputs(props.stage)
  }

  private grantPermissions(
    membersTable: dynamodb.Table,
    hubsTable: dynamodb.Table
  ): void {
    membersTable.grantReadData(this.memberCountUpdateFunction)
    membersTable.grantStreamRead(this.memberCountUpdateFunction)
    hubsTable.grantWriteData(this.memberCountUpdateFunction)

    this.memberCountUpdateFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*']
      })
    )
  }

  private setupStreamTrigger(membersTable: dynamodb.Table): void {
    this.memberCountUpdateFunction.addEventSourceMapping(
      'MembersStreamMapping',
      {
        eventSourceArn: membersTable.tableStreamArn!,
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(5),
        parallelizationFactor: 2
      }
    )
  }

  private createOutputs(stage: string): void {
    new cdk.CfnOutput(this, 'MemberCountUpdateFunctionName', {
      value: this.memberCountUpdateFunction.functionName,
      description: 'Member Count Update Lambda Function Name',
      exportName: `KoolHubz-${stage}-MemberCountUpdateFunctionName`
    })

    new cdk.CfnOutput(this, 'MemberCountUpdateFunctionArn', {
      value: this.memberCountUpdateFunction.functionArn,
      description: 'Member Count Update Lambda Function ARN',
      exportName: `KoolHubz-${stage}-MemberCountUpdateFunctionArn`
    })
  }
}
