import { Construct } from 'constructs'
import * as appsync from 'aws-cdk-lib/aws-appsync'
import { LAMBDA_PASSTHROUGH_CODE } from '../resolverConstants'

export default function createGetHubResolver(
  construct: Construct,
  getHubDataSource: appsync.LambdaDataSource,
  api: appsync.GraphqlApi
) {
  return new appsync.Resolver(construct, 'GetHubResolver', {
    api,
    typeName: 'Query',
    fieldName: 'getHub',
    dataSource: getHubDataSource,
    code: appsync.Code.fromInline(LAMBDA_PASSTHROUGH_CODE),
    runtime: appsync.FunctionRuntime.JS_1_0_0
  })
}