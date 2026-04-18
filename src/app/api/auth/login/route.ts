import { NextRequest, NextResponse } from 'next/server';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { rateLimit, tooManyRequests } from '@/lib/ratelimit';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION ?? process.env.AWS_REGION ?? 'ca-central-1',
});

export async function POST(req: NextRequest) {
  // Brute-force protection: 10 attempts per 15 minutes per IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const { allowed } = await rateLimit(`login:${ip}`, 10, 60 * 15);
  if (!allowed) return tooManyRequests(60 * 15);

  if (!process.env.COGNITO_USER_POOL_ID) {
    const res = NextResponse.json({ ok: true, redirect: '/dashboard' });
    res.cookies.set('access_token', 'demo', { httpOnly: true, path: '/', sameSite: 'lax' });
    return res;
  }

  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  try {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.COGNITO_CLIENT_ID!,
      AuthParameters: { USERNAME: email, PASSWORD: password },
    });
    const result = await cognitoClient.send(command);
    const accessToken = result.AuthenticationResult?.AccessToken;
    if (!accessToken) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true, redirect: '/dashboard' });
    res.cookies.set('access_token', accessToken, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 3600,
    });
    return res;
  } catch (err) {
    const message = (err as Error).message ?? 'Authentication failed';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
