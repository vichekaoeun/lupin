/**
 * Store adapter — routes to DynamoDB (production) or in-memory (local dev).
 *
 * Set DYNAMODB_TABLE_NAME in your environment to enable DynamoDB.
 * Leave it unset for the local in-memory fallback.
 */

import * as memory from './store-memory';
import * as dynamo from './dynamo';

const USE_DYNAMO = !!process.env.DYNAMODB_TABLE_NAME;
const db = USE_DYNAMO ? dynamo : memory;

export const getUser           = db.getUser;
export const upsertUser        = db.upsertUser;
export const getOrCreateUser   = db.getOrCreateUser;
export const getCard           = db.getCard;
export const saveCard          = db.saveCard;
export const getCardsByUser    = db.getCardsByUser;
export const getDueCards       = db.getDueCards;
export const deleteCard        = db.deleteCard;
export const saveReviewLog     = db.saveReviewLog;
export const getReviewLogs     = db.getReviewLogs;
export const updateStreak      = db.updateStreak;
export const getDashboardData  = db.getDashboardData;
