import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { createLambdaFunction } from '../../helpers/lambdaHelpers';

interface UsersLambdaConstructProps {
  stage: string;
  usersTable: dynamodb.Table;
}

export class UsersLambdaConstruct extends Construct {
  public readonly createUserFunction: lambda.Function;
  public readonly getUserFunction: lambda.Function;
  public readonly updateUserFunction: lambda.Function;
  public readonly updateUserPreferencesFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: UsersLambdaConstructProps) {
    super(scope, id);

    this.createUserFunction = createLambdaFunction({
      construct: this,
      id: 'CreateUserFunction',
      timeoutDuration: 30,
      stageName: props.stage,
      functionName: 'CreateUser',
      entryPath: 'lib/constructs/compute/lambda/functions/users/createUser/index.ts',
      description: 'Creates a new user profile after Cognito signup',
      nodeModules: ['uuid'],
      table: props.usersTable
    })

    // this.getUserFunction = createLambdaFunction({
    //   construct: this,
    //   id: 'GetUserFunction',
    //   timeoutDuration: 15,
    //   stageName: props.stage,
    //   functionName: 'GetUser',
    //   entryPath: 'lib/constructs/compute/lambda/functions/users/getUser/index.ts',
    //   description: 'Retrieves user data with privacy filtering',
    //   table: props.usersTable,
    //   readOnly: true
    // })

    // this.updateUserFunction = createLambdaFunction({
    //   construct: this,
    //   id: 'UpdateUserFunction',
    //   timeoutDuration: 30,
    //   stageName: props.stage,
    //   functionName: 'UpdateUser',
    //   entryPath: 'lib/constructs/compute/lambda/functions/users/updateUser/index.ts',
    //   description: 'Updates user profiles and handles optimistic locking',
    //   table: props.usersTable
    // })

    // this.updateUserPreferencesFunction = createLambdaFunction({
    //   construct: this,
    //   id: 'UpdateUserPreferencesFunction',
    //   timeoutDuration: 15,
    //   stageName: props.stage,
    //   functionName: 'UpdateUserPreferences',
    //   entryPath: 'lib/constructs/compute/lambda/functions/users/updateUserPreferences/index.ts',
    //   description: 'Updates user preferences quickly without full profile validation',
    //   table: props.usersTable
    // })

    // Outputs for debugging and integration
    new cdk.CfnOutput(this, 'CreateUserFunctionName', {
      value: this.createUserFunction.functionName,
      description: 'CreateUser Lambda Function Name',
      exportName: `KoolHubz-${props.stage}-CreateUserFunctionName`,
    });

    // new cdk.CfnOutput(this, 'GetUserFunctionName', {
    //   value: this.getUserFunction.functionName,
    //   description: 'GetUser Lambda Function Name',
    //   exportName: `KoolHubz-${props.stage}-GetUserFunctionName`,
    // });

    // new cdk.CfnOutput(this, 'UpdateUserFunctionName', {
    //   value: this.updateUserFunction.functionName,
    //   description: 'UpdateUser Lambda Function Name',
    //   exportName: `KoolHubz-${props.stage}-UpdateUserFunctionName`,
    // });

    // new cdk.CfnOutput(this, 'UpdateUserPreferencesFunctionName', {
    //   value: this.updateUserPreferencesFunction.functionName,
    //   description: 'UpdateUserPreferences Lambda Function Name',
    //   exportName: `KoolHubz-${props.stage}-UpdateUserPreferencesFunctionName`,
    // });
  }
}