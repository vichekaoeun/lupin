// CDK stack — provisions all AWS resources for Lupin.

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as events from 'aws-cdk-lib/aws-events';
import * as amplify from 'aws-cdk-lib/aws-amplify';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface SakuraStackProps extends cdk.StackProps {
  env_name: 'dev' | 'staging' | 'prod';
  googleClientId?: string;
  googleClientSecret?: string;
  githubToken?: string;
  githubOwner?: string;
  githubRepo?: string;
}

export class SakuraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SakuraStackProps) {
    super(scope, id, props);

    const { env_name } = props;
    const isProd = env_name === 'prod';

    // ── DynamoDB ──────────────────────────────────────────────────────────────
    const table = new dynamodb.Table(this, 'SakuraTable', {
      tableName: `sakura-srs-${env_name}`,
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: isProd },
      timeToLiveAttribute: 'ttl',
      removalPolicy: isProd
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    // GSI1: cards by nextReview
    table.addGlobalSecondaryIndex({
      indexName: 'GSI1-nextReview',
      partitionKey: { name: 'gsi1pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'gsi1sk', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    new cdk.CfnOutput(this, 'DynamoTableName', { value: table.tableName });

    // ── Cognito ───────────────────────────────────────────────────────────────
    const userPool = new cognito.UserPool(this, 'SakuraUserPool', {
      userPoolName: `sakura-srs-${env_name}`,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireDigits: true,
        requireLowercase: true,
        requireUppercase: false,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = userPool.addClient('SakuraWebClient', {
      userPoolClientName: `sakura-srs-web-${env_name}`,
      authFlows: {
        userSrp: true,
        userPassword: false,
      },
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
        callbackUrls: isProd
          ? ['https://sakura-srs.example.com/auth/callback']
          : [`http://localhost:3000/auth/callback`],
        logoutUrls: isProd
          ? ['https://sakura-srs.example.com']
          : ['http://localhost:3000'],
      },
      accessTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      idTokenValidity: cdk.Duration.hours(1),
    });

    // Google OAuth federation
    if (props.googleClientId && props.googleClientSecret) {
      const googleProvider = new cognito.UserPoolIdentityProviderGoogle(
        this, 'GoogleProvider', {
          userPool,
          clientId: props.googleClientId,
          clientSecretValue: cdk.SecretValue.unsafePlainText(props.googleClientSecret),
          scopes: ['email', 'profile', 'openid'],
          attributeMapping: {
            email: cognito.ProviderAttribute.GOOGLE_EMAIL,
            givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
            familyName: cognito.ProviderAttribute.GOOGLE_FAMILY_NAME,
            profilePicture: cognito.ProviderAttribute.GOOGLE_PICTURE,
          },
        }
      );
      userPool.registerIdentityProvider(googleProvider);
    }

    userPool.addDomain('SakuraDomain', {
      cognitoDomain: { domainPrefix: `sakura-srs-${env_name}` },
    });

    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });

    // ── S3 ────────────────────────────────────────────────────────────────────
    const mediaBucket = new s3.Bucket(this, 'SakuraMediaBucket', {
      bucketName: `sakura-srs-${env_name}-media`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'archive-exports',
          prefix: 'exports/',
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: !isProd,
    });

    new cdk.CfnOutput(this, 'MediaBucketName', { value: mediaBucket.bucketName });

    // ── SNS — daily review reminders ─────────────────────────────────────────
    const notificationTopic = new sns.Topic(this, 'SakuraNotificationTopic', {
      topicName: `sakura-srs-notifications-${env_name}`,
      displayName: 'Lupin Daily Review Reminder',
    });

    new cdk.CfnOutput(this, 'NotificationTopicArn', { value: notificationTopic.topicArn });
    new cdk.CfnOutput(this, 'SnsTopicArnPrefix', {
      value: notificationTopic.topicArn.replace(/[^:]+$/, 'lupin-'),
    });

    // ── EventBridge — daily scheduler cron ───────────────────────────────────
    const schedulerRule = new events.Rule(this, 'DailySchedulerRule', {
      ruleName: `sakura-srs-daily-${env_name}`,
      description: 'Lupin daily review reminder scheduler',
      schedule: events.Schedule.cron({ minute: '0', hour: '0' }),
    });

    new cdk.CfnOutput(this, 'SchedulerRuleName', { value: schedulerRule.ruleName });

    // ── IAM role for Amplify app — least-privilege ────────────────────────────
    const appRole = new iam.Role(this, 'SakuraAppRole', {
      roleName: `sakura-srs-app-${env_name}`,
      assumedBy: new iam.ServicePrincipal('amplify.amazonaws.com'),
    });

    table.grantReadWriteData(appRole);
    mediaBucket.grantReadWrite(appRole);
    notificationTopic.grantPublish(appRole);
    appRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
        ],
        resources: [
          `arn:aws:bedrock:*::foundation-model/anthropic.claude-sonnet-4-20250514-v1:0`,
          `arn:aws:bedrock:*:*:inference-profile/us.anthropic.claude-sonnet-4-20250514-v1:0`,
        ],
      })
    );
    appRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['polly:SynthesizeSpeech'],
        resources: ['*'],
      })
    );

    // ── Amplify Hosting ───────────────────────────────────────────────────────
    if (props.githubToken && props.githubOwner && props.githubRepo) {
      const amplifyApp = new amplify.CfnApp(this, 'SakuraAmplifyApp', {
        name: `sakura-srs-${env_name}`,
        repository: `https://github.com/${props.githubOwner}/${props.githubRepo}`,
        accessToken: props.githubToken,
        buildSpec: [
          'version: 1',
          'frontend:',
          '  phases:',
          '    preBuild:',
          '      commands:',
          '        - npm ci',
          '    build:',
          '      commands:',
          '        - npm run build',
          '  artifacts:',
          '    baseDirectory: .next',
          '    files:',
          '      - "**/*"',
          '  cache:',
          '    paths:',
          '      - node_modules/**/*',
        ].join('\n'),
        environmentVariables: [
          { name: 'DYNAMODB_TABLE_NAME', value: table.tableName },
          { name: 'COGNITO_USER_POOL_ID', value: userPool.userPoolId },
          { name: 'COGNITO_CLIENT_ID', value: userPoolClient.userPoolClientId },
          { name: 'S3_BUCKET_NAME', value: mediaBucket.bucketName },
          { name: 'SNS_TOPIC_ARN_PREFIX', value: notificationTopic.topicArn.replace(/[^:]+$/, 'lupin-') },
          { name: 'USE_BEDROCK', value: 'true' },
          { name: 'BEDROCK_REGION', value: 'us-east-1' },
          { name: 'POLLY_REGION', value: 'us-east-1' },
          { name: 'NEXT_PUBLIC_APP_ENV', value: env_name },
        ],
      });

      const mainBranch = new amplify.CfnBranch(this, 'MainBranch', {
        appId: amplifyApp.attrAppId,
        branchName: 'main',
        enableAutoBuild: true,
        stage: isProd ? 'PRODUCTION' : 'DEVELOPMENT',
      });

      new cdk.CfnOutput(this, 'AmplifyAppId', { value: amplifyApp.attrAppId });
      new cdk.CfnOutput(this, 'AmplifyDefaultDomain', {
        value: `https://main.${amplifyApp.attrDefaultDomain}`,
      });
    }
  }
}
