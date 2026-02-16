/**
 * Platform-wide betting constraints
 */

export const MIN_BET_SC = 0.01;
export const MAX_BET_SC = 1.00;
export const MAX_WIN_SC = 20.00;

// Gold Coins equivalents (if applicable, though user specifically mentioned SC)
// We might want to keep GC higher or also constrain them.
// For now, let's focus on SC as requested.
export const MIN_BET_GC = 100; // Example default
export const MAX_BET_GC = 1000000; // Example default
export const MAX_WIN_GC = 20000000; // Example default

// Payment Configuration
export const GOOGLE_PAY_MERCHANT_ID = "4118-9661-9446";
