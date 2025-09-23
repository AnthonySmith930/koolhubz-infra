import { Construct } from 'constructs'
import * as appsync from 'aws-cdk-lib/aws-appsync'
import { LAMBDA_PASSTHROUGH_CODE } from '../resolverConstants'

export default function createUserResolver(
  construct: Construct,
  createUserDataSource: appsync.LambdaDataSource,
  api: appsync.GraphqlApi
) {
  return new appsync.Resolver(construct, 'CreateUserResolver', {
    api,
    typeName: 'Mutation',
    fieldName: 'createUser',
    dataSource: createUserDataSource,
    code: appsync.Code.fromInline(LAMBDA_PASSTHROUGH_CODE),
    runtime: appsync.FunctionRuntime.JS_1_0_0
  })
}