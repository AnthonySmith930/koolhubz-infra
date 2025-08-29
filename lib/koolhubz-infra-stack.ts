import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface KoolHubzStackProps extends cdk.StackProps {
  stage: string;
}

export class KoolHubzStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: KoolHubzStackProps) {
    super(scope, id, props);

    // Tag all resources
    cdk.Tags.of(this).add('Project', 'KoolHubz');
    cdk.Tags.of(this).add('Environment', props.stage);
    cdk.Tags.of(this).add('Owner', 'Anthony');
  }
}
