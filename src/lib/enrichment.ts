/**
 * Enrichment router:
 *   USE_BEDROCK=true  →  Amazon Bedrock (claude-3-sonnet via bedrock-runtime)
 *   ANTHROPIC_API_KEY →  Direct Anthropic SDK (claude-sonnet-4-6)
 *   neither           →  Mock data (local dev, no keys)
 */

import Anthropic from '@anthropic-ai/sdk';
import { Card, JLPTLevel, PartOfSpeech, SubcultureTheme, ExampleSentence, ChatScene } from './types';
import { enrichWithBedrock, EnrichmentResult } from './bedrock';

// ─── Direct Anthropic SDK (when USE_BEDROCK is not set) ───────────────────────

let _anthropic: Anthropic | null = null;
function getAnthropicClient() {
  if (!_anthropic) _anthropic = new Anthropic();
  return _anthropic;
}

function mockEnrichment(word: string): EnrichmentResult {
  return {
    reading: `[${word}の読み方]`,
    meaning: `[Add ANTHROPIC_API_KEY or set USE_BEDROCK=true in .env.local]`,
    jlptLevel: 'N3',
    partOfSpeech: 'noun',
    sentences: [
      {
        japanese: `${word}はとても面白い言葉です。`,
        furigana: `${word}はとてもおもしろいことばです。`,
        english: `${word} is a very interesting word.`,
        context: 'Configure an AI key in .env.local for real enrichment.',
      },
    ],
    mnemonic: 'Set ANTHROPIC_API_KEY or USE_BEDROCK=true to get a real mnemonic.',
    collocations: [`${word}する`, `${word}的`],
    culturalReferences: [],
    chatScene: { setting: '', speakers: ['A', 'B'], messages: [] },
  };
}

async function enrichWithAnthropic(
  word: string,
  theme: SubcultureTheme,
  targetJLPT: JLPTLevel
): Promise<EnrichmentResult> {
  const systemPrompt = `You are a Japanese language tutor specialising in ${theme} culture.
When given a Japanese word or phrase, return a JSON object with:
  reading: string // hiragana/katakana reading
  meaning: string // concise English meaning (max 12 words)
  jlptLevel: string // 'N5'|'N4'|'N3'|'N2'|'N1'|'unknown'
  partOfSpeech: string // 'noun'|'verb'|'adjective'|'adverb'|'expression'
  sentences: [{
    japanese: string,
    furigana: string,
    english: string,
    context: string
  }] // exactly 3 sentences
  mnemonic: string
  collocations: string[] // 2-3 common companion words
  culturalReferences: [{
    title: string,  // specific work or artist name, e.g. "Naruto", "AKB48"
    type: string,   // 'anime'|'manga'|'game'|'artist'|'film'|'show'|'other'
    usage: string   // 1-sentence note on how the word appears in that work
  }] // 2-3 real examples from ${theme} culture
  chatScene: {
    setting: string,  // 1-sentence scene description (where/when)
    speakers: [string, string],  // two character names from ${theme} culture
    messages: [{
      speaker: string,  // must match one of the two speakers
      text: string,     // natural Japanese, use the word at least once across all messages
      furigana: string, // full furigana reading
      english: string   // natural English translation
    }]  // exactly 5 messages, casual texting/speech register
  }

Ground all examples in ${theme} culture.
Target difficulty: ${targetJLPT}.
Return ONLY valid JSON. No markdown, no preamble, no trailing text.`;

  const message = await getAnthropicClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3200,
    temperature: 0.7,
    system: systemPrompt,
    messages: [{ role: 'user', content: word }],
  });

  const text = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('');

  const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  try {
    return JSON.parse(clean);
  } catch {
    throw new Error(`Failed to parse enrichment JSON: ${text.slice(0, 200)}`);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function enrichCard(
  word: string,
  theme: SubcultureTheme,
  targetJLPT: JLPTLevel
): Promise<EnrichmentResult> {
  if (process.env.USE_BEDROCK === 'true') {
    return enrichWithBedrock(word, theme, targetJLPT);
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return enrichWithAnthropic(word, theme, targetJLPT);
  }
  return mockEnrichment(word);
}

export function applyEnrichment(card: Card, result: EnrichmentResult): Card {
  return {
    ...card,
    reading: result.reading,
    meaning: result.meaning,
    jlptLevel: result.jlptLevel,
    partOfSpeech: result.partOfSpeech,
    sentences: result.sentences,
    mnemonic: result.mnemonic,
    collocations: result.collocations,
    culturalReferences: result.culturalReferences ?? [],
    chatScene: result.chatScene,
    enrichmentStatus: 'complete',
    updatedAt: new Date().toISOString(),
  };
}
