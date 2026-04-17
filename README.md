# Lupin

A Japanese vocabulary SRS app. Add a word, get AI-generated flashcards with example sentences, cultural references, a chat scene, and native audio. Review on a spaced-repetition schedule.

---

## What it does

- **Add words** — type any Japanese word or phrase, pick a theme (anime, gaming, idol groups, etc.), and Lupin generates a full card via Claude on Bedrock: reading, meaning, JLPT level, 3 example sentences with furigana, a mnemonic, cultural references, and a short two-person chat scene
- **Review** — SM-2 spaced repetition. Cards are graded 0–5; the next review date adjusts automatically. Cards that fail 8 times get suspended (leech detection)
- **Pronounce** — AWS Polly neural TTS (Kazuha voice), cached 24 h
- **Dashboard** — streak, retention rate, activity heatmap, retention by JLPT level
- **Export** — download your deck as CSV

---

## Tech stack

- Next.js (App Router) + TypeScript
- DynamoDB single-table
- Cognito (email/password + optional Google OAuth)
- Bedrock (Claude Sonnet 4) for card enrichment
- Polly neural TTS
- ElastiCache (Redis) for due-card caching and rate limiting
- CDK for infra

---

## Local dev

```bash
npm install
cp .env.local.example .env.local   # fill in your values
npm run dev
```

Without any AWS credentials the app runs entirely in memory with a mock enrichment response. Set one of the following to get real AI cards:

```
ANTHROPIC_API_KEY=sk-ant-...        # direct Anthropic API
USE_BEDROCK=true                    # use Bedrock instead (needs AWS creds)
```

### Full `.env.local` reference

```bash
# AI
ANTHROPIC_API_KEY=           # direct Anthropic API (local dev)
USE_BEDROCK=true             # use Bedrock in prod (set to 'true')
BEDROCK_REGION=us-east-1     # Bedrock region (Claude not in ca-central-1)

# Auth — leave blank to skip auth (demo mode)
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=

# Database — leave blank for in-memory store
DYNAMODB_TABLE_NAME=

# Redis — leave blank to disable caching/rate-limiting persistence
REDIS_HOST=
REDIS_PORT=6379
REDIS_TLS=true               # set for ElastiCache TLS

# Storage
S3_BUCKET_NAME=

# Notifications
SNS_TOPIC_ARN_PREFIX=        # arn:aws:sns:<region>:<acct>:lupin-
AWS_REGION=us-east-1

# Polly TTS
POLLY_VOICE_ID=Kazuha        # or Takumi for male voice
POLLY_REGION=us-east-1

# Scheduler
SCHEDULER_SECRET=            # shared secret for /api/scheduler
SCHEDULER_USER_IDS=          # comma-separated Cognito sub IDs
```

---

## Deploy to AWS

### Prerequisites

- AWS CLI configured (`aws configure`)
- Node.js 20+
- CDK CLI: `npm install -g aws-cdk`

### 1. Bootstrap CDK (once per account/region)

```bash
cd infra
npm install
npx cdk bootstrap aws://<account-id>/<region>
```

### 2. Deploy the dev stack

```bash
npx cdk deploy SakuraStack-dev
```

This provisions: DynamoDB table, Cognito user pool, S3 bucket, ElastiCache (Redis), SNS topic, EventBridge rule, IAM roles, and optionally Amplify hosting.

The deploy output prints the values you need for your environment variables:

```
Outputs:
SakuraStack-dev.DynamoTableName     = sakura-srs-dev
SakuraStack-dev.UserPoolId          = us-east-1_XXXXXXXXX
SakuraStack-dev.UserPoolClientId    = XXXXXXXXXXXXXXXXXXXXXXXXXX
SakuraStack-dev.MediaBucketName     = sakura-srs-dev-media
SakuraStack-dev.RedisHost           = sakura-srs-dev.xxxx.cache.amazonaws.com
SakuraStack-dev.NotificationTopicArn = arn:aws:sns:...
```

Copy these into your `.env.local` (or Amplify environment variables).

### 3. Enable Bedrock model access

Bedrock model access is not on by default. Go to the [AWS Console → Bedrock → Model access](https://console.aws.amazon.com/bedrock/home#/modelaccess) and request access for **Claude Sonnet 4** (`us.anthropic.claude-sonnet-4-20250514-v1:0`).

Also make sure your IAM user/role has `bedrock:InvokeModel` permission. The CDK stack adds this to the Amplify app role automatically.

### 4. (Optional) Amplify hosting with GitHub CI/CD

Pass these extra context values when deploying prod:

```bash
GITHUB_TOKEN=ghp_xxx \
GITHUB_OWNER=your-username \
GITHUB_REPO=lupin \
npx cdk deploy SakuraStack-prod
```

This creates an Amplify app that auto-deploys on every push to `main`. Add the CDK output env vars to the Amplify console under **App settings → Environment variables**.

### 5. Prod deploy

```bash
GOOGLE_CLIENT_ID=xxx \
GOOGLE_CLIENT_SECRET=xxx \
GITHUB_TOKEN=xxx \
GITHUB_OWNER=xxx \
GITHUB_REPO=lupin \
npx cdk deploy SakuraStack-prod
```

---

## Daily reminder scheduler

The EventBridge rule fires at 00:00 UTC and should hit `/api/scheduler`. To wire it up point the rule at an HTTP target or a Lambda that calls the endpoint. The route is protected by `SCHEDULER_SECRET`.

To test locally:

```bash
curl -X POST http://localhost:3000/api/scheduler \
  -H 'x-scheduler-secret: your-secret' \
  -H 'Content-Type: application/json' \
  -d '{"userIds": ["your-cognito-sub"]}'
```

---

## Rate limits

| Endpoint | Limit | Window |
|---|---|---|
| `POST /api/auth/login` | 10 | 15 min / IP |
| `POST /api/cards` | 25 | 24 h / user |
| `POST /api/cards/[id]/enrich` | 10 | 24 h / user |
| `GET /api/tts` | 500 | 24 h / user |

Uses Redis when `REDIS_HOST` is set, in-memory fallback otherwise.
