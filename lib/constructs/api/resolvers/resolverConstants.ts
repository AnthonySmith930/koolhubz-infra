export const LAMBDA_PASSTHROUGH_CODE = `
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
`