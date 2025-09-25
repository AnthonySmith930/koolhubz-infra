import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch'
import * as lambda from 'aws-cdk-lib/aws-lambda'

export interface CustomMetric {
  namespace: string
  metricName: string
  statistic?: string
  unit?: cloudwatch.Unit
}

export interface DashboardWidget {
  title: string
  metricNames: string[]
  namespace?: string
}

interface AlarmConfig {
  name: string
  description: string
  metricName: string
  namespace?: string
  threshold: number
  evaluationPeriods: number
  comparisonOperator?: cloudwatch.ComparisonOperator
  statistic?: string
  treatMissingData?: cloudwatch.TreatMissingData
}

export interface MonitoringConstructProps {
  stage: string
  serviceName: string
  enableSnsAlerts?: boolean
  alertEmails?: string[]
  createDashboard?: boolean

  // Lambda functions to monitor
  functions?: Array<{
    function: lambda.Function
    id: string
  }>

  // Custom metrics specific to this service
  customMetrics?: CustomMetric[]

  // Custom dashboard widgets
  dashboardWidgets?: DashboardWidget[]

  // Custom alarms
  alarms?: AlarmConfig[]
}
