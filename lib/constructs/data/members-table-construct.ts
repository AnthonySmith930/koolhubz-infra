import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as events from 'aws-cdk-lib/aws-events'
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as path from 'path'
import { Construct } from 'constructs'
import { MonitoringConstruct } from '../foundation/monitoring-construct'

interface MembersTableConstructProps {
  stage: string
  hubsTable: dynamodb.Table
  alertEmails?: string[]
}

export class MembersTableConstruct extends Construct {
  public readonly table: dynamodb.Table
  public readonly memberCountUpdateFunction: lambda.Function
  public readonly memberCleanupFunction: lambda.Function
  public readonly monitoring: MonitoringConstruct

  constructor(scope: Construct, id: string, props: MembersTableConstructProps) {
    super(scope, id)

    // Create DynamoDB table
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

    // Add GSIs
    this.table.addGlobalSecondaryIndex({
      indexName: 'UserIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'joinedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    })

    // Create Lambda functions
    // Member Count Update Lambda (handles DynamoDB Streams)
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

    // Member Cleanup Lambda (handles scheduled cleanup)
    this.memberCleanupFunction = new nodejs.NodejsFunction(
      this,
      'MemberCleanupFunction',
      {
        functionName: `KoolHubz-${props.stage}-MemberCleanupFunction`,
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
          MEMBERS_TABLE_NAME: this.table.tableName,
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
      }
    )

    // Grant permissions
    this.grantPermissions(props.hubsTable)

    // Set up triggers
    this.setupTriggers(props.stage)

    // Metric names
    const HUB_UPDATE_SUCCESSES = 'HubUpdateSuccesses'
    const HUB_UPDATE_FAILURES = 'HubUpdateFailures'
    const STREAM_PROCESSING_FAILURES = 'StreamProcessingFailures'
    const MEMBERS_CLEANED_UP = 'MembersCleanedUp'
    const CLEANUP_FAILURES = 'CleanupFailures'

    // Create monitoring
    this.monitoring = new MonitoringConstruct(this, 'Monitoring', {
      stage: props.stage,
      serviceName: 'MembersService',
      enableSnsAlerts: true,
      alertEmails: props.alertEmails,
      createDashboard: true,

      // Custom metrics from both Lambda functions
      customMetrics: [
        // Member count update metrics
        {
          namespace: 'KoolHubz/MemberCountUpdates',
          metricName: HUB_UPDATE_SUCCESSES
        },
        {
          namespace: 'KoolHubz/MemberCountUpdates',
          metricName: HUB_UPDATE_FAILURES
        },
        {
          namespace: 'KoolHubz/MemberCountUpdates',
          metricName: STREAM_PROCESSING_FAILURES
        },
        // Member cleanup metrics
        {
          namespace: 'KoolHubz/MemberCleanup',
          metricName: MEMBERS_CLEANED_UP
        },
        {
          namespace: 'KoolHubz/MemberCleanup',
          metricName: CLEANUP_FAILURES
        }
      ],

      // Monitor both Lambda functions
      dashboardWidgets: [
        {
          title: 'Member Count Updates',
          metricNames: [HUB_UPDATE_SUCCESSES, HUB_UPDATE_FAILURES]
        },
        {
          title: 'Member Cleanup Activity',
          metricNames: [MEMBERS_CLEANED_UP, CLEANUP_FAILURES]
        }
      ],

      // Alarms for both functions
      alarms: [
        {
          name: 'HighUpdateFailures',
          description: 'High failure rate in member count updates',
          metricName: HUB_UPDATE_FAILURES,
          threshold: 10,
          evaluationPeriods: 2
        },
        {
          name: 'CleanupFailures',
          description: 'Member cleanup process failing',
          metricName: CLEANUP_FAILURES,
          threshold: 1,
          evaluationPeriods: 1
        },
        {
          name: 'UnusualCleanupActivity',
          description: 'Unusually high member cleanup activity',
          metricName: MEMBERS_CLEANED_UP,
          threshold: 100, // Alert if >100 members cleaned in one run
          evaluationPeriods: 1
        }
      ]
    })

    // Add Lambda-specific monitoring for both functions
    this.monitoring.addDashboardWidget('Member Count Lambda Performance', [
      this.memberCountUpdateFunction.metricDuration(),
      this.memberCountUpdateFunction.metricErrors()
    ])

    this.monitoring.addDashboardWidget('Member Cleanup Lambda Performance', [
      this.memberCleanupFunction.metricDuration(),
      this.memberCleanupFunction.metricErrors()
    ])

    // Create outputs
    this.createOutputs(props.stage)
  }

  private grantPermissions(hubsTable: dynamodb.Table): void {
    // Member Count Update permissions
    this.table.grantReadData(this.memberCountUpdateFunction)
    this.table.grantStreamRead(this.memberCountUpdateFunction)
    hubsTable.grantWriteData(this.memberCountUpdateFunction)

    // Member Cleanup permissions
    this.table.grantReadWriteData(this.memberCleanupFunction)

    // CloudWatch permissions for both functions
    const cloudWatchPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['cloudwatch:PutMetricData'],
      resources: ['*']
    })

    this.memberCountUpdateFunction.addToRolePolicy(cloudWatchPolicy)
    this.memberCleanupFunction.addToRolePolicy(cloudWatchPolicy)
  }

  private setupTriggers(stage: string): void {
    // DynamoDB Stream trigger for member count updates
    this.memberCountUpdateFunction.addEventSourceMapping(
      'MembersStreamMapping',
      {
        eventSourceArn: this.table.tableStreamArn!,
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(5),
        parallelizationFactor: 2
      }
    )

    // EventBridge scheduled trigger for cleanup
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
      new eventsTargets.LambdaFunction(this.memberCleanupFunction, {
        event: events.RuleTargetInput.fromObject({
          source: 'hourly-cleanup',
          action: 'cleanup-inactive-members'
        })
      })
    )
  }

  private createOutputs(stage: string): void {
    new cdk.CfnOutput(this, 'MembersTableName', {
      value: this.table.tableName,
      description: 'DynamoDB Members Table Name',
      exportName: `KoolHubz-${stage}-MembersTableName`
    })

    new cdk.CfnOutput(this, 'MemberCountUpdateFunctionName', {
      value: this.memberCountUpdateFunction.functionName,
      description: 'Member Count Update Lambda Function Name',
      exportName: `KoolHubz-${stage}-MemberCountUpdateFunctionName`
    })

    new cdk.CfnOutput(this, 'MemberCleanupFunctionName', {
      value: this.memberCleanupFunction.functionName,
      description: 'Member Cleanup Lambda Function Name',
      exportName: `KoolHubz-${stage}-MemberCleanupFunctionName`
    })
  }
}
