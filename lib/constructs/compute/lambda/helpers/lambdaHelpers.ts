import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { Construct } from 'constructs';

interface CreateLambdaFunctionArgs {
    construct: Construct,
    id: string,
    timeoutDuration: number,
    stageName: string,
    functionName: string,
    entryPath: string,
    description: string,
    envTableName: {},
    table: dynamodb.Table,
    nodeModules?: string[],
    readOnly?: boolean
}

export function createLambdaFunction(args: CreateLambdaFunctionArgs) {
    const {
        construct,
        id,
        timeoutDuration,
        stageName,
        functionName,
        entryPath,
        description,
        nodeModules = [],
        envTableName,
        table,
        readOnly = false
    } = args

    const newFunction = new nodejs.NodejsFunction(construct, id, {
        runtime: lambda.Runtime.NODEJS_20_X,
        timeout: cdk.Duration.seconds(timeoutDuration),
        memorySize: 256,
        functionName: `KoolHubz-${stageName}-${functionName}`,
        entry: path.resolve(process.cwd(), entryPath),
        description: description,
        environment: {
            ...envTableName,
            NODE_OPTIONS: '--enable-source-maps',
            STAGE: stageName,
        },
        retryAttempts: 2,
        bundling: {
            minify: stageName === 'prod',
            sourceMap: true,
            target: 'node20',
            nodeModules: nodeModules,
            externalModules: [
                '@aws-sdk/client-dynamodb',
                '@aws-sdk/lib-dynamodb',
            ],
        },
    });
    
    if (readOnly) {
        grantDynamoDBReadPermissions(newFunction, table);
    } else {
        grantDynamoDBFullPermissions(newFunction, table);
    }

    return newFunction
}

function grantDynamoDBReadPermissions(lambdaFunction: lambda.Function, table: dynamodb.Table): void {
  table.grantReadData(lambdaFunction);
  
  lambdaFunction.addToRolePolicy(
    new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['dynamodb:Query', 'dynamodb:Scan'],
      resources: [`${table.tableArn}/index/*`],
    })
  );
}

function grantDynamoDBFullPermissions(lambdaFunction: lambda.Function, table: dynamodb.Table): void {
  table.grantReadWriteData(lambdaFunction);
  
  lambdaFunction.addToRolePolicy(
    new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['dynamodb:Query', 'dynamodb:Scan'],
      resources: [`${table.tableArn}/index/*`],
    })
  );
  
  lambdaFunction.addToRolePolicy(
    new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['dynamodb:ConditionCheckItem'],
      resources: [table.tableArn],
    })
  );
}