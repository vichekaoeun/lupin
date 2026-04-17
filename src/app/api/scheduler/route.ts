// POST /api/scheduler
// Called by EventBridge daily cron (00:00 UTC). Protected by SCHEDULER_SECRET.
// For each user: fetches due cards, warms Redis cache, sends SNS reminder.
// EventBridge target: POST https://<domain>/api/scheduler
//   Header: x-scheduler-secret: <SCHEDULER_SECRET>

import { NextRequest, NextResponse } from 'next/server';
import { getDueCards } from '@/lib/store';
import { cacheDueCards } from '@/lib/redis';
import { sendDailyReminder } from '@/lib/sns';

// Simple secret to prevent unauthenticated calls
const SCHEDULER_SECRET = process.env.SCHEDULER_SECRET;

export async function POST(req: NextRequest) {
  if (SCHEDULER_SECRET) {
    const secret = req.headers.get('x-scheduler-secret');
    if (secret !== SCHEDULER_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const today = new Date().toISOString().split('T')[0];

  // In production this would list all USER#* PROFILE records from DynamoDB.
  // Here we accept an optional userIds array in the request body (for testing),
  // or read from the SCHEDULER_USER_IDS env var (comma-separated).
  let userIds: string[] = [];
  try {
    const body = await req.json().catch(() => ({}));
    if (Array.isArray(body.userIds)) userIds = body.userIds;
  } catch { /* body parse failure is non-fatal */ }

  if (userIds.length === 0 && process.env.SCHEDULER_USER_IDS) {
    userIds = process.env.SCHEDULER_USER_IDS.split(',').map((s) => s.trim()).filter(Boolean);
  }

  const results: Record<string, number> = {};

  await Promise.all(
    userIds.map(async (userId) => {
      try {
        const cards = await getDueCards(userId, today);
        await cacheDueCards(userId, today, cards);
        await sendDailyReminder(userId, cards.length);
        results[userId] = cards.length;
      } catch (err) {
        console.error(`[Scheduler] Error processing user ${userId}:`, err);
        results[userId] = -1;
      }
    })
  );

  return NextResponse.json({ date: today, processed: Object.keys(results).length, results });
}
