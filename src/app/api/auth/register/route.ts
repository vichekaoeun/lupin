import { NextRequest, NextResponse } from 'next/server';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { rateLimit, tooManyRequests } from '@/lib/ratelimit';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION ?? process.env.AWS_REGION ?? 'ca-central-1',
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const { allowed } = await rateLimit(`register:${ip}`, 5, 60 * 60);
  if (!allowed) return tooManyRequests(60 * 60);

  if (!process.env.COGNITO_USER_POOL_ID) {
    return NextResponse.json({ ok: true, needsConfirmation: false });
  }

  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  try {
    await cognitoClient.send(new SignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID!,
      Username: email,
      Password: password,
      UserAttributes: [{ Name: 'email', Value: email }],
    }));
    return NextResponse.json({ ok: true, needsConfirmation: true });
  } catch (err) {
    const message = (err as Error).message ?? 'Registration failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
