import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CognitoConstruct } from './constructs/foundation/cognito-construct';
import { HubsTableConstruct } from './constructs/data/hubs-table-construct';
import { HubsLambdaConstruct } from './constructs/compute/hubs-lambda-construct';
import { AppSyncConstruct } from './constructs/api/appsync-construct';

interface KoolHubzStackProps extends cdk.StackProps {
  stage: string;
}

export class KoolHubzStack extends cdk.Stack {
  public readonly cognito: CognitoConstruct
  public readonly hubsTable: HubsTableConstruct
  public readonly appSync: AppSyncConstruct
  public readonly hubsLambda: HubsLambdaConstruct

  constructor(scope: Construct, id: string, props: KoolHubzStackProps) {
    super(scope, id, props);

    this.cognito = new CognitoConstruct(this, "Cognito", {
      stage: props.stage
    })

    this.hubsTable = new HubsTableConstruct(this, "HubsTable", {
      stage: props.stage
    });

    // Make sure this line exists and comes BEFORE the AppSync creation
    this.hubsLambda = new HubsLambdaConstruct(this, "HubsLambda", {
      stage: props.stage,
      hubsTable: this.hubsTable.table
    });

    // GraphQL API
    this.appSync = new AppSyncConstruct(this, "AppSync", {
      stage: props.stage,
      hubsTable: this.hubsTable.table,
      userPool: this.cognito.userPool,
      createHubFunction: this.hubsLambda.createHubFunction,
      getNearbyHubsFunction: this.hubsLambda.getNearbyHubsFunction,
      getHubFunction: this.hubsLambda.getHubFunction,
      deleteHubFunction: this.hubsLambda.deleteHubFunction
    });

    // Tag all resources
    const baseTags = {
      'Project': 'KoolHubz',
      'Environment': props.stage,
      'Owner': 'Anthony', 
      'CreatedBy': 'CDK',
      'CostCenter': props.stage === 'prod' ? 'Production' : 'Development',
      'Version': '1.0',
      'DeployedAt': new Date().toISOString().split('T')[0] // YYYY-MM-DD
    };

    Object.entries(baseTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });
  }
}
