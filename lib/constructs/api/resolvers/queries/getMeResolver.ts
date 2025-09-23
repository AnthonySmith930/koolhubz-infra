import { Construct } from 'constructs'
import * as appsync from 'aws-cdk-lib/aws-appsync'
import { LAMBDA_PASSTHROUGH_CODE } from '../resolverConstants'

export default function getMeResolver(
  construct: Construct,
  getMeDataSource: appsync.LambdaDataSource,
  api: appsync.GraphqlApi
) {
  return new appsync.Resolver(construct, 'GetMeResolver', {
    api,
    typeName: 'Query',
    fieldName: 'getMe',
    dataSource: getMeDataSource,
    code: appsync.Code.fromInline(LAMBDA_PASSTHROUGH_CODE),
    runtime: appsync.FunctionRuntime.JS_1_0_0
  })
}