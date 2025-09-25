import * as cdk from 'aws-cdk-lib'
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import {
  CustomMetric,
  DashboardWidget,
  MonitoringConstructProps
} from './types/monitoringTypes'

export class MonitoringConstruct extends Construct {
  public readonly dashboard?: cloudwatch.Dashboard
  public readonly alertTopic?: sns.Topic
  public readonly alarms: cloudwatch.Alarm[] = []

  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id)

    // Create SNS topic for alerts if enabled
    if (props.enableSnsAlerts) {
      this.alertTopic = this.createAlertTopic(props)
    }

    // Create CloudWatch dashboard if enabled
    if (props.createDashboard) {
      this.dashboard = this.createDashboard(props)
    }

    // Create alarms for Lambda functions
    if (props.functions && props.functions.length > 0) {
      this.createLambdaAlarms(props)
    }

    // Create custom alarms
    if (props.alarms && props.alarms.length > 0) {
      this.createCustomAlarms(props)
    }

    // Create outputs
    this.createOutputs(props.stage, props.serviceName)
  }

  private createAlertTopic(props: MonitoringConstructProps): sns.Topic {
    const topic = new sns.Topic(this, 'AlertTopic', {
      topicName: `KoolHubz-${props.stage}-${props.serviceName}-Alerts`,
      displayName: `${props.serviceName} Monitoring Alerts`,
      fifo: false
    })

    // Subscribe email addresses if provided
    if (props.alertEmails && props.alertEmails.length > 0) {
      props.alertEmails.forEach((email, index) => {
        topic.addSubscription(
          new snsSubscriptions.EmailSubscription(email, {
            filterPolicy: {} // Can add filtering later if needed
          })
        )
      })
    }

    return topic
  }

  private createDashboard(
    props: MonitoringConstructProps
  ): cloudwatch.Dashboard {
    const dashboard = new cloudwatch.Dashboard(this, 'ServiceDashboard', {
      dashboardName: `KoolHubz-${props.stage}-${props.serviceName}`,
      defaultInterval: cdk.Duration.hours(1)
    })

    // Add Lambda function widgets if functions are provided
    if (props.functions && props.functions.length > 0) {
      this.addLambdaWidgets(dashboard, props.functions)
    }

    // Add custom metric widgets
    if (props.customMetrics && props.customMetrics.length > 0) {
      this.addCustomMetricWidgets(dashboard, props.customMetrics)
    }

    // Add custom dashboard widgets
    if (props.dashboardWidgets && props.dashboardWidgets.length > 0) {
      this.addCustomWidgets(dashboard, props.dashboardWidgets)
    }

    return dashboard
  }

  private addLambdaWidgets(
    dashboard: cloudwatch.Dashboard,
    functions: Array<{
      function: lambda.Function
      id: string
    }>
  ): void {
    // Lambda Duration Widget
    const durationMetrics = functions.map((fn) => fn.function.metricDuration())
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Function Duration',
        left: durationMetrics,
        width: 12,
        height: 6
      })
    )

    // Lambda Errors Widget
    const errorMetrics = functions.map((fn) => fn.function.metricErrors())
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Function Errors',
        left: errorMetrics,
        width: 12,
        height: 6
      })
    )

    // Lambda Invocations Widget
    const invocationMetrics = functions.map((fn) =>
      fn.function.metricInvocations()
    )
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Function Invocations',
        left: invocationMetrics,
        width: 12,
        height: 6
      })
    )
  }

  private addCustomMetricWidgets(
    dashboard: cloudwatch.Dashboard,
    metrics: CustomMetric[]
  ): void {
    metrics.forEach((metric) => {
      const cloudwatchMetric = new cloudwatch.Metric({
        namespace: metric.namespace,
        metricName: metric.metricName,
        statistic: metric.statistic || cloudwatch.Stats.SUM,
        unit: metric.unit || cloudwatch.Unit.COUNT
      })

      dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: metric.metricName,
          left: [cloudwatchMetric],
          width: 6,
          height: 6
        })
      )
    })
  }

  private addCustomWidgets(
    dashboard: cloudwatch.Dashboard,
    widgets: DashboardWidget[]
  ): void {
    widgets.forEach((widget) => {
      const metrics = widget.metricNames.map(
        (metricName) =>
          new cloudwatch.Metric({
            namespace: widget.namespace || 'AWS/Lambda',
            metricName: metricName,
            statistic: cloudwatch.Stats.SUM
          })
      )

      dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: widget.title,
          left: metrics,
          width: 12,
          height: 6
        })
      )
    })
  }

  private createLambdaAlarms(props: MonitoringConstructProps): void {
    if (!props.functions) return

    props.functions.forEach(({ function: fn, id }) => {
      // High error rate alarm
      const errorAlarm = new cloudwatch.Alarm(
        this,
        id + '-HighErrors',
        {
          alarmName: `${props.serviceName}-${fn.functionName}-HighErrors`,
          alarmDescription: `High error rate for ${fn.functionName}`,
          metric: fn.metricErrors({
            period: cdk.Duration.minutes(5)
          }),
          threshold: 5,
          evaluationPeriods: 2,
          comparisonOperator:
            cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
        }
      )

      // High duration alarm
      const durationAlarm = new cloudwatch.Alarm(this, id + '-HighDuration', {
        alarmName: `${props.serviceName}-${fn.functionName}-HighDuration`,
        alarmDescription: `High duration for ${fn.functionName}`,
        metric: fn.metricDuration({
          period: cdk.Duration.minutes(5)
        }),
        threshold: 10000, // 10 seconds
        evaluationPeriods: 3,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
      })

      this.alarms.push(errorAlarm, durationAlarm)

      // Add SNS actions if alert topic exists
      if (this.alertTopic) {
        errorAlarm.addAlarmAction(
          new cdk.aws_cloudwatch_actions.SnsAction(this.alertTopic)
        )
        durationAlarm.addAlarmAction(
          new cdk.aws_cloudwatch_actions.SnsAction(this.alertTopic)
        )
      }
    })
  }

  private createCustomAlarms(props: MonitoringConstructProps): void {
    if (!props.alarms) return

    props.alarms.forEach((alarmConfig) => {
      const metric = new cloudwatch.Metric({
        namespace: alarmConfig.namespace || `KoolHubz/${props.serviceName}`,
        metricName: alarmConfig.metricName,
        statistic: alarmConfig.statistic || cloudwatch.Stats.SUM
      })

      const alarm = new cloudwatch.Alarm(
        this,
        `${props.serviceName}-${alarmConfig.name}`,
        {
          alarmName: `${props.serviceName}-${alarmConfig.name}`,
          alarmDescription: alarmConfig.description,
          metric: metric,
          threshold: alarmConfig.threshold,
          evaluationPeriods: alarmConfig.evaluationPeriods,
          comparisonOperator:
            alarmConfig.comparisonOperator ||
            cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
          treatMissingData:
            alarmConfig.treatMissingData ||
            cloudwatch.TreatMissingData.NOT_BREACHING
        }
      )

      this.alarms.push(alarm)

      // Add SNS action if alert topic exists
      if (this.alertTopic) {
        alarm.addAlarmAction(
          new cdk.aws_cloudwatch_actions.SnsAction(this.alertTopic)
        )
      }
    })
  }

  // Utility method to add additional dashboard widgets after construction
  public addDashboardWidget(
    title: string,
    metrics: cloudwatch.IMetric[]
  ): void {
    if (this.dashboard) {
      this.dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: title,
          left: metrics,
          width: 12,
          height: 6
        })
      )
    }
  }

  private createOutputs(stage: string, serviceName: string): void {
    if (this.dashboard) {
      new cdk.CfnOutput(this, 'DashboardUrl', {
        value: `https://${cdk.Stack.of(this).region}.console.aws.amazon.com/cloudwatch/home?region=${cdk.Stack.of(this).region}#dashboards:name=${this.dashboard.dashboardName}`,
        description: `${serviceName} CloudWatch Dashboard URL`,
        exportName: `KoolHubz-${stage}-${serviceName}-DashboardUrl`
      })
    }

    if (this.alertTopic) {
      new cdk.CfnOutput(this, 'AlertTopicArn', {
        value: this.alertTopic.topicArn,
        description: `${serviceName} SNS Alert Topic ARN`,
        exportName: `KoolHubz-${stage}-${serviceName}-AlertTopicArn`
      })
    }
  }
}
