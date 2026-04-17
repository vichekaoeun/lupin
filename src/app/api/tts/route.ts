import { NextRequest } from 'next/server';
import { PollyClient, SynthesizeSpeechCommand, VoiceId } from '@aws-sdk/client-polly';
import { rateLimit, tooManyRequests } from '@/lib/ratelimit';
import { getUserId } from '@/lib/auth';

// AWS Polly — uses the same IAM credentials as Bedrock/DynamoDB.
// Neural voices: Kazuha (female), Takumi (male)
// Free tier: 1M neural chars/month for 12 months, then $16/1M chars.
//
// Optional env vars:
//   POLLY_VOICE_ID — default 'Kazuha'
//   POLLY_REGION   — default AWS_REGION or 'us-east-1'

const REGION = process.env.POLLY_REGION ?? process.env.AWS_REGION ?? 'us-east-1';
const VOICE = (process.env.POLLY_VOICE_ID ?? 'Kazuha') as VoiceId;

let _client: PollyClient | null = null;
function getClient() {
  if (!_client) _client = new PollyClient({ region: REGION });
  return _client;
}

export async function GET(request: NextRequest) {
  // Rate limit: 500 TTS requests per day per user (falls back to IP for unauthenticated)
  let rateLimitKey: string;
  try {
    const userId = await getUserId(request);
    rateLimitKey = `tts:user:${userId}`;
  } catch {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
    rateLimitKey = `tts:ip:${ip}`;
  }
  const { allowed } = await rateLimit(rateLimitKey, 500, 60 * 60 * 24);
  if (!allowed) return tooManyRequests(60 * 60 * 24);

  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  if (!text) return Response.json({ error: 'text is required' }, { status: 400 });

  try {
    const command = new SynthesizeSpeechCommand({
      Text: text,
      VoiceId: VOICE,
      OutputFormat: 'mp3',
      Engine: 'neural',
      LanguageCode: 'ja-JP',
    });

    const res = await getClient().send(command);
    if (!res.AudioStream) throw new Error('No audio stream returned');

    // AudioStream is a web ReadableStream in the AWS SDK v3
    const bytes = await res.AudioStream.transformToByteArray();

    return new Response(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400', // cache a word for 24h
      },
    });
  } catch (err) {
    console.error('Polly TTS error:', err);
    return Response.json({ error: 'TTS unavailable' }, { status: 503 });
  }
}
