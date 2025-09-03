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
    cdk.Tags.of(this).add('Project', 'KoolHubz');
    cdk.Tags.of(this).add('Environment', props.stage);
    cdk.Tags.of(this).add('Owner', 'Anthony');
  }
}
