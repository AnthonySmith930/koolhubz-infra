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
  public readonly getUserProfileFunction: lambda.Function;
  public readonly getMeFunction: lambda.Function;
  public readonly updateUserFunction: lambda.Function;
  public readonly updateUserPreferencesFunction: lambda.Function;
  public readonly updateProfileFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: UsersLambdaConstructProps) {
    super(scope, id);

    const envTableName = {
      USERS_TABLE_NAME: props.usersTable.tableName
    }

    this.createUserFunction = createLambdaFunction({
      construct: this,
      id: 'CreateUserFunction',
      timeoutDuration: 30,
      stageName: props.stage,
      functionName: 'CreateUser',
      entryPath: 'lib/constructs/compute/lambda/functions/users/createUser/index.ts',
      description: 'Creates a new user profile after Cognito signup',
      nodeModules: ['uuid'],
      envTableName,
      table: props.usersTable
    })

    this.getUserProfileFunction = createLambdaFunction({
      construct: this,
      id: 'GetUserProfileFunction',
      timeoutDuration: 15,
      stageName: props.stage,
      functionName: 'GetUserProfile',
      entryPath: 'lib/constructs/compute/lambda/functions/users/getUserProfile/index.ts',
      description: 'Retrieves user data for given userId with privacy filtering',
      envTableName,
      table: props.usersTable,
      readOnly: true
    })

    this.updateProfileFunction = createLambdaFunction({
      construct: this,
      id: 'UpdateProfileFunction',
      timeoutDuration: 30,
      stageName: props.stage,
      functionName: 'UpdateProfile',
      entryPath: 'lib/constructs/compute/lambda/functions/users/updateProfile/index.ts',
      description: 'Updates user profiles and handles optimistic locking',
      envTableName,
      table: props.usersTable
    })

    this.getMeFunction = createLambdaFunction({
      construct: this,
      id: 'GetMeFunction',
      timeoutDuration: 15,
      stageName: props.stage,
      functionName: 'GetMe',
      entryPath: 'lib/constructs/compute/lambda/functions/users/getMe/index.ts',
      description: 'Retrieves user data for current signed in user',
      envTableName,
      table: props.usersTable,
      readOnly: true
    })

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

    new cdk.CfnOutput(this, 'GetUserProfileFunctionName', {
      value: this.getUserProfileFunction.functionName,
      description: 'GetUserProfile Lambda Function Name',
      exportName: `KoolHubz-${props.stage}-GetUserProfileFunctionName`,
    });

    new cdk.CfnOutput(this, 'GetMeFunctionName', {
      value: this.getMeFunction.functionName,
      description: 'GetMe Lambda Function Name',
      exportName: `KoolHubz-${props.stage}-GetMeFunctionName`,
    });

    new cdk.CfnOutput(this, 'UpdateProfileFunctionName', {
      value: this.updateProfileFunction.functionName,
      description: 'UpdateProfile Lambda Function Name',
      exportName: `KoolHubz-${props.stage}-UpdateProfileFunctionName`,
    });

    // new cdk.CfnOutput(this, 'UpdateUserPreferencesFunctionName', {
    //   value: this.updateUserPreferencesFunction.functionName,
    //   description: 'UpdateUserPreferences Lambda Function Name',
    //   exportName: `KoolHubz-${props.stage}-UpdateUserPreferencesFunctionName`,
    // });
  }
}