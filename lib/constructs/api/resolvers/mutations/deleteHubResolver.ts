import { Construct } from 'constructs'
import * as appsync from 'aws-cdk-lib/aws-appsync'
import { LAMBDA_PASSTHROUGH_CODE } from '../resolverConstants'

export default function deleteHubResolver(
  construct: Construct,
  deleteHubDataSource: appsync.LambdaDataSource,
  api: appsync.GraphqlApi
) {
  return new appsync.Resolver(construct, 'DeleteHubResolver', {
    api,
    typeName: 'Mutation',
    fieldName: 'deleteHub',
    dataSource: deleteHubDataSource,
    code: appsync.Code.fromInline(LAMBDA_PASSTHROUGH_CODE),
    runtime: appsync.FunctionRuntime.JS_1_0_0
  })
}