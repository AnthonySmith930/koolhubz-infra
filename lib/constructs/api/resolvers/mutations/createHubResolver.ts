import { Construct } from 'constructs'
import * as appsync from 'aws-cdk-lib/aws-appsync'
import { LAMBDA_PASSTHROUGH_CODE } from '../resolverConstants'

export default function createHubResolver(
  construct: Construct,
  createHubDataSource: appsync.LambdaDataSource,
  api: appsync.GraphqlApi
) {
  return new appsync.Resolver(construct, 'CreateHubResolver', {
    api,
    typeName: 'Mutation',
    fieldName: 'createHub',
    dataSource: createHubDataSource,
    code: appsync.Code.fromInline(LAMBDA_PASSTHROUGH_CODE),
    runtime: appsync.FunctionRuntime.JS_1_0_0
  })
}