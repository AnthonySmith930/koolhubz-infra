import { Duration, aws_lambda } from 'aws-cdk-lib'
import { Metric, ComparisonOperator, TreatMissingData} from 'aws-cdk-lib/aws-cloudwatch'

export interface MetricConfig {
  namespace: string
  metricName: string
  statistic?: string
  period?: Duration
  label?: string
}

export interface AlarmConfig {
  name: string
  description: string
  metricName: string
  threshold: number
  evaluationPeriods?: number
  comparisonOperator?: ComparisonOperator
  treatMissingData?: TreatMissingData
}

export interface DashboardWidgetConfig {
  title: string
  metricNames: string[]
  width?: number
  height?: number
  type?: 'line' | 'number'
}

export interface MonitoringConstructProps {
  stage: string
  serviceName: string // e.g., 'MemberCount', 'HubOperations', 'UserAuth'
  
  // Metrics to create
  customMetrics?: MetricConfig[]
  
  // Lambda function to monitor (optional)
  lambdaFunction?: aws_lambda.Function
  
  // Alarms to create
  alarms?: AlarmConfig[]
  
  // Dashboard widgets
  dashboardWidgets?: DashboardWidgetConfig[]
  
  // SNS configuration
  enableSnsAlerts?: boolean
  alertEmails?: string[]
  
  // Dashboard configuration
  createDashboard?: boolean
}