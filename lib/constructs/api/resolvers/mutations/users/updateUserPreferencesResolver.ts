import { Construct } from 'constructs'
import * as appsync from 'aws-cdk-lib/aws-appsync'
import { LAMBDA_PASSTHROUGH_CODE } from '../../resolverConstants'

export default function updateUserPreferencesResolver(
  construct: Construct,
  updateUserPreferencesDataSource: appsync.LambdaDataSource,
  api: appsync.GraphqlApi
) {
  return new appsync.Resolver(construct, 'UpdateUserPreferencesResolver', {
    api,
    typeName: 'Mutation',
    fieldName: 'updateUserPreferences',
    dataSource: updateUserPreferencesDataSource,
    code: appsync.Code.fromInline(LAMBDA_PASSTHROUGH_CODE),
    runtime: appsync.FunctionRuntime.JS_1_0_0
  })
}