// Amazon Bedrock enrichment. Activated when USE_BEDROCK=true.
// Model: Claude Sonnet 4 cross-region inference profile

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { SubcultureTheme, JLPTLevel, ExampleSentence, PartOfSpeech, CulturalReference, ChatScene } from './types';

// Claude 3 Sonnet is Legacy — use the Claude Sonnet 4 cross-region inference profile
const BEDROCK_MODEL_ID = 'us.anthropic.claude-sonnet-4-20250514-v1:0';
// Bedrock uses its own region — Claude 3 Sonnet is not available in ca-central-1
// so BEDROCK_REGION defaults to us-east-1 independently of AWS_REGION.
const BEDROCK_REGION = process.env.BEDROCK_REGION ?? process.env.AWS_REGION ?? 'us-east-1';

let _client: BedrockRuntimeClient | null = null;
function getClient() {
  if (!_client) _client = new BedrockRuntimeClient({ region: BEDROCK_REGION });
  return _client;
}

export interface EnrichmentResult {
  reading: string;
  meaning: string;
  jlptLevel: JLPTLevel;
  partOfSpeech: PartOfSpeech;
  sentences: ExampleSentence[];
  mnemonic: string;
  collocations: string[];
  culturalReferences: CulturalReference[];
  chatScene: ChatScene;
}

function buildSystemPrompt(theme: SubcultureTheme, targetJLPT: JLPTLevel): string {
  return `You are a Japanese language tutor specialising in ${theme} culture.
When given a Japanese word or phrase, return a JSON object with:
  reading: string // hiragana/katakana reading
  meaning: string // concise English meaning (max 12 words)
  jlptLevel: string // 'N5'|'N4'|'N3'|'N2'|'N1'|'unknown'
  partOfSpeech: string // 'noun'|'verb'|'adjective'|'adverb'|'expression'
  sentences: [{
    japanese: string,  // natural sentence using the word
    furigana: string,  // full furigana reading of the sentence
    english: string,   // natural English translation
    context: string    // 1-sentence cultural note (optional)
  }] // exactly 3 sentences
  mnemonic: string  // memorable image or story for English speakers
  collocations: string[] // 2-3 common companion words/phrases
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
}

function parseEnrichment(text: string): EnrichmentResult {
  const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  try {
    return JSON.parse(clean);
  } catch {
    throw new Error(`Failed to parse Bedrock enrichment JSON: ${text.slice(0, 200)}`);
  }
}

export async function enrichWithBedrock(
  word: string,
  theme: SubcultureTheme,
  targetJLPT: JLPTLevel
): Promise<EnrichmentResult> {
  const body = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 3200,
    temperature: 0.7,
    top_p: 0.9,
    system: buildSystemPrompt(theme, targetJLPT),
    messages: [{ role: 'user', content: word }],
  };

  const command = new InvokeModelCommand({
    modelId: BEDROCK_MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: new TextEncoder().encode(JSON.stringify(body)),
  });

  const response = await getClient().send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  const text: string = responseBody.content?.[0]?.text ?? '';

  return parseEnrichment(text);
}
