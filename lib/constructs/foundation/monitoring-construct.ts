import * as cdk from 'aws-cdk-lib'
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions'
import { Construct } from 'constructs'
import {
  MetricConfig,
  AlarmConfig,
  DashboardWidgetConfig,
  MonitoringConstructProps
} from './types/monitoringTypes'

export class MonitoringConstruct extends Construct {
  public readonly alertTopic?: sns.Topic
  public readonly dashboard?: cloudwatch.Dashboard
  public readonly metrics: Map<string, cloudwatch.Metric> = new Map()
  public readonly alarms: cloudwatch.Alarm[] = []

  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id)

    // Create SNS topic if needed
    if (props.enableSnsAlerts) {
      this.alertTopic = this.createSnsAlerts(
        props.stage,
        props.serviceName,
        props.alertEmails
      )
    }

    // Create custom metrics
    if (props.customMetrics) {
      this.createCustomMetrics(props.customMetrics)
    }

    // Create Lambda function metrics if provided
    if (props.lambdaFunction) {
      this.createLambdaMetrics(props.lambdaFunction)
    }

    // Create dashboard if requested
    if (props.createDashboard) {
      this.dashboard = this.createDashboard(
        props.stage,
        props.serviceName,
        props.dashboardWidgets
      )
    }

    // Create alarms
    if (props.alarms) {
      this.createAlarms(props.alarms, props.stage, props.serviceName)
    }

    // Create outputs
    this.createOutputs(props.stage, props.serviceName)
  }

  private createSnsAlerts(
    stage: string,
    serviceName: string,
    emails?: string[]
  ): sns.Topic {
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `KoolHubz-${stage}-${serviceName}-Alerts`,
      displayName: `KoolHubz ${serviceName} Alerts`
    })

    // Add email subscriptions if provided
    if (emails) {
      emails.forEach((email, index) => {
        alertTopic.addSubscription(
          new snsSubscriptions.EmailSubscription(email, {
            json: false // Plain text emails
          })
        )
      })
    }

    return alertTopic
  }

  private createCustomMetrics(metricConfigs: MetricConfig[]): void {
    metricConfigs.forEach((config) => {
      const metric = new cloudwatch.Metric({
        namespace: config.namespace,
        metricName: config.metricName,
        statistic: config.statistic || 'Sum',
        period: config.period || cdk.Duration.minutes(5)
      })

      this.metrics.set(config.metricName, metric)
    })
  }

  private createLambdaMetrics(lambdaFunction: cdk.aws_lambda.Function): void {
    // Standard Lambda metrics
    const errorMetric = lambdaFunction.metricErrors({
      period: cdk.Duration.minutes(5)
    })

    const durationMetric = lambdaFunction.metricDuration({
      period: cdk.Duration.minutes(5)
    })

    const invocationMetric = lambdaFunction.metricInvocations({
      period: cdk.Duration.minutes(5)
    })

    const throttleMetric = lambdaFunction.metricThrottles({
      period: cdk.Duration.minutes(5)
    })

    this.metrics.set('LambdaErrors', errorMetric)
    this.metrics.set('LambdaDuration', durationMetric)
    this.metrics.set('LambdaInvocations', invocationMetric)
    this.metrics.set('LambdaThrottles', throttleMetric)
  }

  private createDashboard(
    stage: string,
    serviceName: string,
    widgetConfigs?: DashboardWidgetConfig[]
  ): cloudwatch.Dashboard {
    const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `KoolHubz-${stage}-${serviceName}-Monitoring`
    })

    const widgets: cloudwatch.IWidget[] = []

    // Add custom widgets if provided
    if (widgetConfigs) {
      widgetConfigs.forEach((config) => {
        const metricsForWidget: cloudwatch.Metric[] = config.metricNames
          .map((name) => this.metrics.get(name))
          .filter((metric): metric is cloudwatch.Metric => metric !== undefined)

        const widget = new cloudwatch.GraphWidget({
          title: config.title,
          left: metricsForWidget,
          width: config.width || 12,
          height: config.height || 6
        })
        widgets.push(widget)
      })
    }

    // Add default Lambda widgets if we have Lambda metrics
    if (this.metrics.has('LambdaErrors')) {
      widgets.push(
        new cloudwatch.GraphWidget({
          title: 'Lambda Errors & Invocations',
          left: [
            this.metrics.get('LambdaErrors')!,
            this.metrics.get('LambdaInvocations')!
          ],
          width: 12,
          height: 6
        }),
        new cloudwatch.GraphWidget({
          title: 'Lambda Performance',
          left: [this.metrics.get('LambdaDuration')!],
          right: [this.metrics.get('LambdaThrottles')!],
          width: 12,
          height: 6
        })
      )
    }

    if (widgets.length > 0) {
      dashboard.addWidgets(...widgets)
    }

    return dashboard
  }

  private createAlarms(
    alarmConfigs: AlarmConfig[],
    stage: string,
    serviceName: string
  ): void {
    alarmConfigs.forEach((config) => {
      const metricForAlarm = this.metrics.get(config.metricName)
      if (metricForAlarm) {
        const alarm = new cloudwatch.Alarm(this, `${config.name}Alarm`, {
          alarmName: `KoolHubz-${stage}-${serviceName}-${config.name}`,
          alarmDescription: config.description,
          metric: metricForAlarm,
          threshold: config.threshold,
          evaluationPeriods: config.evaluationPeriods || 1,
          comparisonOperator:
            config.comparisonOperator ||
            cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
          treatMissingData:
            config.treatMissingData || cloudwatch.TreatMissingData.NOT_BREACHING
        })

        // Connect to SNS if available
        if (this.alertTopic) {
          alarm.addAlarmAction(
            new cdk.aws_cloudwatch_actions.SnsAction(this.alertTopic)
          )
        }

        this.alarms.push(alarm)
      }
    })
  }

  private createOutputs(stage: string, serviceName: string): void {
    if (this.dashboard) {
      new cdk.CfnOutput(this, 'DashboardUrl', {
        value: `https://console.aws.amazon.com/cloudwatch/home?region=${cdk.Stack.of(this).region}#dashboards:name=${this.dashboard.dashboardName}`,
        description: `CloudWatch Dashboard for ${serviceName} Monitoring`,
        exportName: `KoolHubz-${stage}-${serviceName}-DashboardUrl`
      })
    }

    if (this.alertTopic) {
      new cdk.CfnOutput(this, 'AlertTopicArn', {
        value: this.alertTopic.topicArn,
        description: `SNS Topic ARN for ${serviceName} Alerts`,
        exportName: `KoolHubz-${stage}-${serviceName}-AlertTopicArn`
      })
    }
  }

  public addDashboardWidget(title: string, metrics: cloudwatch.Metric[], options?: {
    width?: number
    height?: number
  }): void {
    if (this.dashboard) {
      const widget = new cloudwatch.GraphWidget({
        title,
        left: metrics,
        width: options?.width || 12,
        height: options?.height || 6
      })
      this.dashboard.addWidgets(widget)
    }
  }
}
