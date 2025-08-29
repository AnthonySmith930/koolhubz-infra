// lib/koolhubz-stage.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { KoolHubzStack } from './koolhubz-infra-stack';

export interface KoolHubzStageProps extends cdk.StageProps {
  stageName: string;
}

export class KoolHubzStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: KoolHubzStageProps) {
    super(scope, id, props);

    new KoolHubzStack(this, 'KoolHubzStack', {
      stage: props.stageName,
    });

    // Later stacks for prod env:
    // new DatabaseStack(this, 'DatabaseStack', { stage: props.stageName });
    // new ApiStack(this, 'ApiStack', { stage: props.stageName });
  }
}