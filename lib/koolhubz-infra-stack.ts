import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CognitoConstruct } from './constructs/cognito-construct';

interface KoolHubzStackProps extends cdk.StackProps {
  stage: string;
}

export class KoolHubzStack extends cdk.Stack {
  public readonly cognito: CognitoConstruct

  constructor(scope: Construct, id: string, props: KoolHubzStackProps) {
    super(scope, id, props);

    this.cognito = new CognitoConstruct(this, "Cognito", {
      stage: props.stage
    })

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
