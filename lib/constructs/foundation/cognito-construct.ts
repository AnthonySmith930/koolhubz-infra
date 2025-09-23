import * as cdk from 'aws-cdk-lib'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import { Construct } from 'constructs'

interface CognitoConstructProps {
  stage: string
}

export class CognitoConstruct extends Construct {
  public readonly userPool: cognito.UserPool
  public readonly userPoolClient: cognito.UserPoolClient

  constructor(scope: Construct, id: string, props: CognitoConstructProps) {
    super(scope, id)

    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `KoolHubz-${props.stage}-UserPool`,
      signInAliases: { email: true, username: false },
      selfSignUpEnabled: true,
      userVerification: {
        emailSubject: 'Welcome to KoolHubz - Verify Your Email',
        emailBody: 'Welcome to KoolHubz! Your verification code is {####}',
        emailStyle: cognito.VerificationEmailStyle.CODE
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false
      },
      standardAttributes: {
        email: { required: true, mutable: true }
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy:
        props.stage === 'prod'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY
    })

    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: `KoolHubz-${props.stage}-Client`,
      authFlows: {
        userSrp: true,
        userPassword: true
      },
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      generateSecret: false,
      preventUserExistenceErrors: true,
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO
      ]
    })

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: `KoolHubz-${props.stage}-UserPoolId`
    })

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: `KoolHubz-${props.stage}-UserPoolClientId`
    })
  }
}
