/**
 * SNS notification layer — daily review reminders.
 *
 * Required env vars:
 *   SNS_TOPIC_ARN_PREFIX   e.g. arn:aws:sns:us-east-1:123456789012:lupin-
 *   AWS_REGION             e.g. us-east-1
 *
 * One topic per user: lupin-<userId>
 * When SNS_TOPIC_ARN_PREFIX is not set, notifications are silently skipped.
 */

import { SNSClient, PublishCommand, CreateTopicCommand } from '@aws-sdk/client-sns';

const REGION = process.env.AWS_REGION ?? 'us-east-1';

let _sns: SNSClient | null = null;
function getSNS(): SNSClient | null {
  if (!process.env.SNS_TOPIC_ARN_PREFIX) return null;
  if (!_sns) _sns = new SNSClient({ region: REGION });
  return _sns;
}

function topicArn(userId: string): string {
  return `${process.env.SNS_TOPIC_ARN_PREFIX}${userId}`;
}

/** Send the daily review reminder. Silently skips if no cards are due. */
export async function sendDailyReminder(
  userId: string,
  cardsDue: number
): Promise<void> {
  const client = getSNS();
  if (!client || cardsDue === 0) return;

  const count = `${cardsDue} card${cardsDue !== 1 ? 's' : ''}`;
  const message = `You have ${count} due for review today on Lupin. Keep your streak going!`;

  try {
    await client.send(
      new PublishCommand({
        TopicArn: topicArn(userId),
        Subject: `Lupin — ${count} due today`,
        Message: message,
      })
    );
  } catch (err) {
    console.warn('[SNS] Failed to send reminder:', err);
  }
}

/**
 * Ensure an SNS topic exists for a user (called on sign-up).
 * Returns the topic ARN.
 */
export async function ensureUserTopic(userId: string): Promise<string | null> {
  const client = getSNS();
  if (!client) return null;
  try {
    const res = await client.send(
      new CreateTopicCommand({ Name: `lupin-${userId}` })
    );
    return res.TopicArn ?? null;
  } catch (err) {
    console.warn('[SNS] Failed to create topic:', err);
    return null;
  }
}
