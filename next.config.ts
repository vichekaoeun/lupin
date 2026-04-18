import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    USE_BEDROCK: process.env.USE_BEDROCK,
    BEDROCK_REGION: process.env.BEDROCK_REGION,
    DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME,
    COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
    COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    SNS_TOPIC_ARN_PREFIX: process.env.SNS_TOPIC_ARN_PREFIX,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_TLS: process.env.REDIS_TLS,
    POLLY_VOICE_ID: process.env.POLLY_VOICE_ID,
    POLLY_REGION: process.env.POLLY_REGION,
    SCHEDULER_SECRET: process.env.SCHEDULER_SECRET,
    SCHEDULER_USER_IDS: process.env.SCHEDULER_USER_IDS,
  },
};

export default nextConfig;
