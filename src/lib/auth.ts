/**
 * Cognito JWT authentication.
 *
 * Required env vars:
 *   COGNITO_USER_POOL_ID   e.g. us-east-1_AbCdEfGhI
 *   COGNITO_CLIENT_ID      e.g. 1a2b3c4d5e6f7g8h9i0j
 *   AWS_REGION             defaults to us-east-1
 *
 * When COGNITO_USER_POOL_ID is not set, falls back to demo-user so
 * local dev works without AWS credentials.
 */

import { NextRequest } from 'next/server';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

const DEMO_USER = 'demo-user';

let _verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

function getVerifier() {
  if (!_verifier) {
    const userPoolId = process.env.COGNITO_USER_POOL_ID!;
    // aws-jwt-verify derives the JWKS URL from the userPoolId prefix,
    // so no explicit region needed — but we set it anyway for clarity.
    _verifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: 'access',
      clientId: process.env.COGNITO_CLIENT_ID!,
    });
  }
  return _verifier;
}

/** Returns the Cognito sub for the request. Falls back to demo-user in local dev. */
export async function getUserId(req: NextRequest): Promise<string> {
  if (!process.env.COGNITO_USER_POOL_ID) {
    // Local dev fallback
    return req.nextUrl.searchParams.get('userId') ?? DEMO_USER;
  }

  // Accept token from Authorization header or token cookie (browser sessions)
  const authHeader = req.headers.get('authorization') ?? '';
  const cookieToken = req.cookies.get('access_token')?.value ?? '';
  const raw = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken;

  if (!raw) {
    throw new AuthError('Missing or invalid Authorization header');
  }

  try {
    const payload = await getVerifier().verify(raw);
    return payload.sub;
  } catch {
    throw new AuthError('Invalid or expired JWT');
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
