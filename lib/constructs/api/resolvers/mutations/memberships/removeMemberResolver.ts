import { Construct } from 'constructs'
import * as appsync from 'aws-cdk-lib/aws-appsync'
import { LAMBDA_PASSTHROUGH_CODE } from '../../resolverConstants'

export default function removeMemberResolver(
  construct: Construct,
  removeMemberDataSource: appsync.LambdaDataSource,
  api: appsync.GraphqlApi
) {
  return new appsync.Resolver(construct, 'RemoveMemberResolver', {
    api,
    typeName: 'Mutation',
    fieldName: 'removeMember',
    dataSource: removeMemberDataSource,
    code: appsync.Code.fromInline(LAMBDA_PASSTHROUGH_CODE),
    runtime: appsync.FunctionRuntime.JS_1_0_0
  })
}