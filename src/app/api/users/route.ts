import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser, upsertUser } from '@/lib/store';
import { getUserId, AuthError } from '@/lib/auth';
import { UserProfile } from '@/lib/types';

export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = await getUserId(req); } catch (e) {
    return NextResponse.json({ error: (e as AuthError).message }, { status: 401 });
  }
  const user = await getOrCreateUser(userId);
  return NextResponse.json({ user });
}

export async function PUT(req: NextRequest) {
  let userId: string;
  try { userId = await getUserId(req); } catch (e) {
    return NextResponse.json({ error: (e as AuthError).message }, { status: 401 });
  }

  const body = await req.json();
  const user = await getOrCreateUser(userId);

  const allowed: (keyof UserProfile)[] = [
    'displayName', 'targetJLPT', 'theme', 'timezone', 'studyGoal',
  ];
  const updates: Partial<UserProfile> = {};
  for (const key of allowed) {
    if (key in body) (updates as Record<string, unknown>)[key] = body[key];
  }

  const updated = { ...user, ...updates };
  await upsertUser(updated);
  return NextResponse.json({ user: updated });
}
