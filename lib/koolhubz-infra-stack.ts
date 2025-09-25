import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { CognitoConstruct } from './constructs/foundation/cognito-construct'
import { HubsTableConstruct } from './constructs/data/hubs-table-construct'
import { HubsLambdaConstruct } from './constructs/compute/lambda/hubs-lambda-construct'
import { UsersLambdaConstruct } from './constructs/compute/lambda/users-lambda-construct'
import { AppSyncConstruct } from './constructs/api/appsync-construct'
import { UsersTableConstruct } from './constructs/data/users-table-construct'
import { MembersTableConstruct } from './constructs/data/members-table-construct'
import { MonitoringConstruct } from './constructs/foundation/monitoring-construct'
import { MemberCleanupLambdaConstruct } from './constructs/compute/lambda/member-cleanup-lambda-construct'
import { MemberCountUpdateLambdaConstruct } from './constructs/compute/lambda/member-count-update-lambda-construct'

interface KoolHubzStackProps extends cdk.StackProps {
  stage: string
  alertEmails?: string[]
}

export class KoolHubzStack extends cdk.Stack {
  public readonly cognito: CognitoConstruct
  public readonly hubsTable: HubsTableConstruct
  public readonly appSync: AppSyncConstruct
  public readonly hubsLambda: HubsLambdaConstruct
  public readonly usersLambda: UsersLambdaConstruct
  public readonly memberCleanupLambda: MemberCleanupLambdaConstruct
  public readonly memberCountUpdateLambda: MemberCountUpdateLambdaConstruct
  public readonly usersTable: UsersTableConstruct
  public readonly membersTable: MembersTableConstruct
  public readonly membersMonitoring: MonitoringConstruct
  public readonly hubsMonitoring: MonitoringConstruct
  public readonly usersMonitoring: MonitoringConstruct

  constructor(scope: Construct, id: string, props: KoolHubzStackProps) {
    super(scope, id, props)

    this.cognito = new CognitoConstruct(this, 'Cognito', {
      stage: props.stage
    })

    this.hubsTable = new HubsTableConstruct(this, 'HubsTable', {
      stage: props.stage
    })

    this.usersTable = new UsersTableConstruct(this, 'UsersTable', {
      stage: props.stage
    })

    this.membersTable = new MembersTableConstruct(this, 'MembersTable', {
      stage: props.stage
    })

    // Create lambdas before creating AppSync constructs ---------------
    this.hubsLambda = new HubsLambdaConstruct(this, 'HubsLambda', {
      stage: props.stage,
      hubsTable: this.hubsTable.table
    })

    this.usersLambda = new UsersLambdaConstruct(this, 'UsersLambda', {
      stage: props.stage,
      usersTable: this.usersTable.table
    })

    this.memberCleanupLambda = new MemberCleanupLambdaConstruct(
      this,
      'MemberCleanup',
      {
        stage: props.stage,
        membersTable: this.membersTable.table
      }
    )

    this.memberCountUpdateLambda = new MemberCountUpdateLambdaConstruct(
      this,
      'MemberCountUpdate',
      {
        stage: props.stage,
        membersTable: this.membersTable.table,
        hubsTable: this.hubsTable.table
      }
    )
    // -----------------------------------------------------------------

    // GraphQL API
    this.appSync = new AppSyncConstruct(this, 'AppSync', {
      stage: props.stage,
      hubsTable: this.hubsTable.table,
      usersTable: this.usersTable.table,
      userPool: this.cognito.userPool,
      createHubFunction: this.hubsLambda.createHubFunction,
      getNearbyHubsFunction: this.hubsLambda.getNearbyHubsFunction,
      getHubFunction: this.hubsLambda.getHubFunction,
      deleteHubFunction: this.hubsLambda.deleteHubFunction,
      createUserFunction: this.usersLambda.createUserFunction,
      getUserProfileFunction: this.usersLambda.getUserProfileFunction,
      getMeFunction: this.usersLambda.getMeFunction,
      updateProfileFunction: this.usersLambda.updateProfileFunction,
      updateUserPreferencesFunction:
        this.usersLambda.updateUserPreferencesFunction
    })

    // Monitoring
    this.membersMonitoring = new MonitoringConstruct(
      this,
      'MembersMonitoring',
      {
        stage: props.stage,
        serviceName: 'Members',
        enableSnsAlerts: true,
        alertEmails: ['antsmithdev@gmail.com'],
        createDashboard: true,
        functions: [
          {
            function: this.memberCleanupLambda.cleanupFunction,
            id: 'MemberCleanup'
          },
          {
            function: this.memberCountUpdateLambda.memberCountUpdateFunction,
            id: 'MemberCountUpdate'
          }
        ],
        customMetrics: [
          {
            namespace: 'KoolHubz/MemberCountUpdates',
            metricName: 'HubUpdateFailures'
          },
          {
            namespace: 'KoolHubz/MemberCleanup',
            metricName: 'CleanupFailures'
          },
          {
            namespace: 'KoolHubz/MemberCleanup',
            metricName: 'MembersCleanedUp'
          }
        ]
      }
    )

    this.hubsMonitoring = new MonitoringConstruct(this, 'HubsMonitoring', {
      stage: props.stage,
      serviceName: 'Hubs',
      createDashboard: true,
      enableSnsAlerts: false, // TODO: Maybe enable when can afford
      functions: [
        {
          function: this.hubsLambda.createHubFunction,
          id: 'CreateHub'
        },
        {
          function: this.hubsLambda.getHubFunction,
          id: 'GetHub'
        },
        {
          function: this.hubsLambda.deleteHubFunction,
          id: 'DeleteHub'
        },
        {
          function: this.hubsLambda.getNearbyHubsFunction,
          id: 'GetNearbyHubs'
        }
      ]
    })

    this.usersMonitoring = new MonitoringConstruct(this, 'UsersMonitoring', {
      stage: props.stage,
      serviceName: 'Users',
      createDashboard: true,
      enableSnsAlerts: false, // TODO: Maybe enable when can afford
      functions: [
        {
          function: this.usersLambda.createUserFunction,
          id: 'CreateUser'
        },
        {
          function: this.usersLambda.getUserProfileFunction,
          id: 'GetUserProfile'
        },
        {
          function: this.usersLambda.getMeFunction,
          id: 'GetMe'
        },
        {
          function: this.usersLambda.updateProfileFunction,
          id: 'UpdateProfile'
        },
        {
          function: this.usersLambda.updateUserPreferencesFunction,
          id: 'UpdateUserPreferences'
        }
      ]
    })

    // Tag all resources
    const baseTags = {
      Project: 'KoolHubz',
      Environment: props.stage,
      Owner: 'Anthony',
      CreatedBy: 'CDK',
      CostCenter: props.stage === 'prod' ? 'Production' : 'Development',
      Version: '1.0',
      DeployedAt: new Date().toISOString().split('T')[0] // YYYY-MM-DD
    }

    Object.entries(baseTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value)
    })
  }
}
