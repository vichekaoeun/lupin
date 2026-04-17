import { NextRequest, NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/store';
import { getUserId, AuthError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = await getUserId(req); } catch (e) {
    return NextResponse.json({ error: (e as AuthError).message }, { status: 401 });
  }
  const data = await getDashboardData(userId);
  return NextResponse.json(data);
}
