import { Construct } from 'constructs'
import * as appsync from 'aws-cdk-lib/aws-appsync'
import { LAMBDA_PASSTHROUGH_CODE } from '../../resolverConstants'

export default function getNearbyHubsResolver(
  construct: Construct,
  getNearbyHubsDataSource: appsync.LambdaDataSource,
  api: appsync.GraphqlApi
) {
  return new appsync.Resolver(construct, 'GetNearbyHubsResolver', {
    api,
    typeName: 'Query',
    fieldName: 'getNearbyHubs',
    dataSource: getNearbyHubsDataSource,
    code: appsync.Code.fromInline(LAMBDA_PASSTHROUGH_CODE),
    runtime: appsync.FunctionRuntime.JS_1_0_0
  })
}