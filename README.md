# Lupin

A Japanese vocabulary app powered by spaced repetition and AI. Add any word and get a full flashcard — reading, meaning, example sentences, cultural references, and a native audio pronunciation. Review on a schedule that adapts to what you know.

---

## The problem

Learning Japanese vocabulary with traditional flashcard apps is tedious. You find a word, look up the reading, find example sentences, figure out the JLPT level, hunt for a mnemonic — then repeat for every single word. And the examples are generic, with no connection to the media or culture you actually care about.

Lupin collapses all of that into one step. Type a word, pick a theme, and get a card that's grounded in the context you're learning Japanese for.

---

## How it works

Type a Japanese word or phrase and pick a cultural theme (anime, gaming, idol groups, manga, street fashion). Lupin sends it to Claude, which generates a complete card:

- Reading (hiragana/katakana) and concise English meaning
- JLPT level and part of speech
- 3 example sentences with furigana and English translation
- A mnemonic image to make it memorable
- 2–3 real cultural references from the theme you picked (specific anime, games, artists)
- A short 5-message dialogue between two characters using the word naturally
- Native Japanese audio via AWS Polly (Kazuha neural voice)

Cards are then scheduled using the **SM-2 spaced repetition algorithm** — the same one behind Anki. After each review, rate your recall on a 0–5 scale and the next review date shifts accordingly. Cards you keep failing get suspended after 8 cumulative failures (leech detection) so they don't block your queue.

---

## Architecture

```
Browser → Next.js API routes (Vercel) → AWS services
                                       ├── DynamoDB   (cards, reviews, users)
                                       ├── Cognito    (auth)
                                       ├── Polly      (TTS)
                                       ├── S3         (exports)
                                       └── SNS        (daily reminders)
                                      → Anthropic API (card enrichment)
```

**Frontend** — Next.js 16 App Router with React server and client components. Dark themed UI with CSS 3D card flips, portal-based kanji tooltips, and furigana rendering.

**Data layer** — Single-table DynamoDB design. One table handles users, cards, and review logs using composite keys (`USER#<id>` / `CARD#<id>`). A GSI on `nextReview` date powers the due-card query without a scan.

**Auth** — Cognito user pool with JWT verification on every API route via `aws-jwt-verify`. Access token stored in an `httpOnly` cookie. Local dev falls back to a demo user so AWS credentials aren't required.

**Enrichment** — Claude generates structured JSON for each card (reading, meaning, sentences, mnemonic, cultural references, chat scene). The prompt is theme-aware — asking for anime culture gives you Naruto references, gaming gives you Final Fantasy. Output is validated and stored atomically.

**TTS** — AWS Polly neural voice (Kazuha, `ja-JP`). Responses are cached 24 h via HTTP `Cache-Control` headers so the same word doesn't trigger a Polly call twice.

**Rate limiting** — Fixed-window rate limiting on all expensive endpoints. Uses Redis when available, falls back to an in-process Map for local dev. Login is limited per IP; card creation and TTS per authenticated user.

**Infra** — AWS CDK provisions DynamoDB, Cognito, S3, SNS, and an EventBridge daily cron rule. The app is hosted on Vercel; AWS resources live in `ca-central-1`.

---

## Features

- **AI card generation** — one word in, full flashcard out in ~5 seconds
- **Spaced repetition** — SM-2 scheduling with leech detection
- **Cultural grounding** — examples and references tied to the theme you pick
- **Native audio** — neural TTS for every card
- **Kanji breakdown** — hover any kanji to see its readings and meanings inline
- **Dashboard** — streak, retention rate by JLPT level, 90-day activity heatmap
- **Card browser** — filter by JLPT level, inline editing, re-enrich stale cards
- **Free review mode** — review any card regardless of schedule
- **CSV export** — take your deck to Anki or anywhere else

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Hosting | Vercel |
| Database | AWS DynamoDB (single-table) |
| Auth | AWS Cognito |
| AI | Anthropic Claude Sonnet 4 |
| TTS | AWS Polly (Kazuha neural) |
| Storage | AWS S3 |
| Notifications | AWS SNS |
| Infra | AWS CDK |
| Rate limiting | Redis / in-memory fallback |
