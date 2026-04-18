import { NextResponse } from 'next/server';

// Temporary debug endpoint — delete after diagnosing env var issue
export async function GET() {
  return NextResponse.json({
    USE_BEDROCK: process.env.USE_BEDROCK,
    HAS_ANTHROPIC_KEY: !!process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_KEY_PREFIX: process.env.ANTHROPIC_API_KEY?.slice(0, 10),
    DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME,
    DYNAMO_REGION: process.env.DYNAMO_REGION,
    COGNITO_REGION: process.env.COGNITO_REGION,
    BEDROCK_REGION: process.env.BEDROCK_REGION,
    AWS_REGION: process.env.AWS_REGION,
  });
}
