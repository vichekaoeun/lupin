import { NextRequest, NextResponse } from 'next/server';
import {
  CognitoIdentityProviderClient,
  ChangePasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { rateLimit, tooManyRequests } from '@/lib/ratelimit';
import { getUserId, AuthError } from '@/lib/auth';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION ?? process.env.AWS_REGION ?? 'ca-central-1',
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const { allowed } = await rateLimit(`change-password:${ip}`, 5, 60 * 15);
  if (!allowed) return tooManyRequests(60 * 15);

  try {
    await getUserId(req);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (!process.env.COGNITO_USER_POOL_ID) {
    return NextResponse.json({ ok: true });
  }

  const accessToken = req.cookies.get('access_token')?.value;
  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Current and new passwords required' }, { status: 400 });
  }

  try {
    await cognitoClient.send(new ChangePasswordCommand({
      AccessToken: accessToken,
      PreviousPassword: currentPassword,
      ProposedPassword: newPassword,
    }));
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = (err as Error).message ?? 'Password change failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
