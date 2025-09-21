import { Construct } from "constructs";
import * as appsync from 'aws-cdk-lib/aws-appsync';

export default function getNearbyHubsResolver(
    construct: Construct, 
    getNearbyHubsDataSource: appsync.LambdaDataSource, 
    api: appsync.GraphqlApi
) {
    return new appsync.Resolver(construct, 'GetNearbyHubsResolver', {
        api: api,
        typeName: 'Query',
        fieldName: 'getNearbyHubs',
        dataSource: getNearbyHubsDataSource,
        code: appsync.Code.fromInline(`
            import { util } from '@aws-appsync/utils';

            export function request(ctx) {
                return {
                    operation: 'Invoke',
                    payload: {
                    arguments: ctx.args,
                    fieldName: ctx.info.fieldName,
                    identity: ctx.identity,
                    }
                };
            }

            export function response(ctx) {
                if (ctx.error) {
                    util.error(ctx.error.message, ctx.error.type);
                }
                return ctx.result;
            }
        `),

        runtime: appsync.FunctionRuntime.JS_1_0_0
    });
}