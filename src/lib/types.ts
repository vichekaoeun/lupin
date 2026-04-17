export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'unknown';
export type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'adverb' | 'expression';
export type SubcultureTheme =
  | 'anime'
  | 'gaming'
  | 'idol groups'
  | 'manga'
  | 'street fashion'
  | 'general';

export interface ExampleSentence {
  japanese: string;
  furigana: string;
  english: string;
  context?: string;
}

export interface CulturalReference {
  title: string;   // e.g. "Naruto", "Final Fantasy VII", "AKB48"
  type: 'anime' | 'manga' | 'game' | 'artist' | 'film' | 'show' | 'other';
  usage: string;   // 1-sentence note on how the word appears in that work
}

export interface ChatMessage {
  speaker: string;  // character name
  text: string;     // message in Japanese
  furigana?: string;
  english?: string;
}

export interface ChatScene {
  setting: string;          // 1-sentence scene description
  speakers: [string, string];
  messages: ChatMessage[];  // 4-6 messages
}

export interface Card {
  id: string;
  userId: string;
  word: string;
  theme?: SubcultureTheme;
  reading: string;
  meaning: string;
  jlptLevel: JLPTLevel;
  partOfSpeech: PartOfSpeech;
  sentences: ExampleSentence[];
  mnemonic: string;
  collocations: string[];
  culturalReferences?: CulturalReference[];
  chatScene?: ChatScene;
  // SM-2 fields
  interval: number;       // days until next review
  easeFactor: number;     // default 2.5
  repetitions: number;    // times reviewed successfully
  nextReview: string;     // YYYY-MM-DD
  failCount: number;      // cumulative failed recalls (quality < 3)
  suspended: boolean;     // leech card: suspended after 8 fails
  // Meta
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  enrichmentStatus: 'pending' | 'complete' | 'error';
}

export interface ReviewLog {
  id: string;
  userId: string;
  cardId: string;
  quality: number;        // 0-5
  newInterval: number;
  newEase: number;
  reviewedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  targetJLPT: JLPTLevel;
  theme: SubcultureTheme;
  timezone: string;
  studyGoal: number;      // cards/day
  streak: number;
  lastStudiedDate: string | null;
  createdAt: string;
}

export interface DeckStats {
  userId: string;
  month: string;          // YYYY-MM
  cardsAdded: number;
  cardsReviewed: number;
  retentionRate: number;
}

export interface DashboardData {
  totalCards: number;
  cardsDueToday: number;
  streak: number;
  retentionRate: number;
  activityHeatmap: Record<string, number>; // YYYY-MM-DD -> reviews count
  retentionByJLPT: Partial<Record<JLPTLevel, number>>;
}
