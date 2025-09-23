import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { CognitoConstruct } from './constructs/foundation/cognito-construct'
import { HubsTableConstruct } from './constructs/data/hubs-table-construct'
import { HubsLambdaConstruct } from './constructs/compute/hubs-lambda-construct'
import { UsersLambdaConstruct } from './constructs/compute/users-lambda-construct'
import { AppSyncConstruct } from './constructs/api/appsync-construct'
import { UsersTableConstruct } from './constructs/data/users-table-construct'

interface KoolHubzStackProps extends cdk.StackProps {
  stage: string
}

export class KoolHubzStack extends cdk.Stack {
  public readonly cognito: CognitoConstruct
  public readonly hubsTable: HubsTableConstruct
  public readonly appSync: AppSyncConstruct
  public readonly hubsLambda: HubsLambdaConstruct
  public readonly usersLambda: UsersLambdaConstruct
  public readonly usersTable: UsersTableConstruct

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

    // Create lambdas before creating AppSync constructs --------------
    this.hubsLambda = new HubsLambdaConstruct(this, 'HubsLambda', {
      stage: props.stage,
      hubsTable: this.hubsTable.table
    })

    this.usersLambda = new UsersLambdaConstruct(this, 'UsersLambda', {
      stage: props.stage,
      usersTable: this.usersTable.table
    })
    // ---------------------------------------------------------------

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
      updateProfileFunction: this.usersLambda.updateProfileFunction
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
