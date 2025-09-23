import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { KoolHubzStage } from '../lib/koolhubz-infra-stage'

const app = new cdk.App()

// Development stage
new KoolHubzStage(app, 'Dev', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  },
  stageName: 'dev'
})

// Staging stage
// new KoolHubzStage(app, 'Staging', {
//   env: {
//     account: process.env.CDK_DEFAULT_ACCOUNT,
//     region: 'us-west-1'
//   },
//   stageName: 'staging'
// });
