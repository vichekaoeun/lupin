import { NextRequest, NextResponse } from 'next/server';
import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { rateLimit, tooManyRequests } from '@/lib/ratelimit';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION ?? process.env.AWS_REGION ?? 'ca-central-1',
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const { allowed } = await rateLimit(`confirm:${ip}`, 10, 60 * 15);
  if (!allowed) return tooManyRequests(60 * 15);

  if (!process.env.COGNITO_USER_POOL_ID) {
    return NextResponse.json({ ok: true });
  }

  const { email, code } = await req.json();
  if (!email || !code) {
    return NextResponse.json({ error: 'Email and confirmation code required' }, { status: 400 });
  }

  try {
    await cognitoClient.send(new ConfirmSignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID!,
      Username: email,
      ConfirmationCode: code,
    }));
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = (err as Error).message ?? 'Confirmation failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
