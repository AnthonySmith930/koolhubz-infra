import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as events from 'aws-cdk-lib/aws-events'
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as path from 'path'
import { Construct } from 'constructs'

interface MemberCleanupLambdaConstructProps {
  stage: string
  membersTable: dynamodb.Table
}

export class MemberCleanupLambdaConstruct extends Construct {
  public readonly cleanupFunction: lambda.Function

  constructor(scope: Construct, id: string, props: MemberCleanupLambdaConstructProps) {
    super(scope, id)

    // Create Member Cleanup Lambda
    this.cleanupFunction = new nodejs.NodejsFunction(this, 'MemberCleanupFunction', {
      functionName: `KoolHubz-${props.stage}-MemberCleanup`,
      description: 'Hourly cleanup of inactive members - runs every hour',
      entry: path.resolve(
        process.cwd(),
        'lib/constructs/compute/lambda/functions/members/memberCleanup/index.ts'
      ),
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.minutes(5),
      memorySize: 256,
      retryAttempts: 2,
      environment: {
        MEMBERS_TABLE_NAME: props.membersTable.tableName,
        STAGE: props.stage,
        HEARTBEAT_TIMEOUT_MINUTES: '20'
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
    })

    this.grantPermissions(props.membersTable)

    this.setupScheduledTrigger(props.stage)

    this.createOutputs(props.stage)
  }

  private grantPermissions(membersTable: dynamodb.Table): void {
    membersTable.grantReadWriteData(this.cleanupFunction)

    this.cleanupFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*']
      })
    )
  }

  private setupScheduledTrigger(stage: string): void {
    const cleanupRule = new events.Rule(this, 'HourlyMemberCleanupRule', {
      ruleName: `KoolHubz-${stage}-HourlyMemberCleanup`,
      description: 'Hourly member cleanup at the top of every hour',
      schedule: events.Schedule.cron({
        minute: '0', // At minute 0 (top of hour)
        hour: '*', // Every hour (0-23)
        day: '*', // Every day
        month: '*', // Every month
        year: '*' // Every year
      })
    })

    cleanupRule.addTarget(
      new eventsTargets.LambdaFunction(this.cleanupFunction, {
        event: events.RuleTargetInput.fromObject({
          source: 'hourly-cleanup',
          action: 'cleanup-inactive-members'
        })
      })
    )
  }

  private createOutputs(stage: string): void {
    new cdk.CfnOutput(this, 'MemberCleanupFunctionName', {
      value: this.cleanupFunction.functionName,
      description: 'Member Cleanup Lambda Function Name',
      exportName: `KoolHubz-${stage}-MemberCleanupFunctionName`
    })

    new cdk.CfnOutput(this, 'MemberCleanupFunctionArn', {
      value: this.cleanupFunction.functionArn,
      description: 'Member Cleanup Lambda Function ARN',
      exportName: `KoolHubz-${stage}-MemberCleanupFunctionArn`
    })
  }
}