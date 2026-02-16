import { RequestHandler } from "express";
import * as dbQueries from "../db/queries";
import { query } from "../db/connection";

interface SlotSymbol {
  id: string;
  name: string;
  value: number;
  weight: number;
}

const SYMBOLS: SlotSymbol[] = [
  { id: 'cherry', name: '🍒', value: 2, weight: 100 },
  { id: 'lemon', name: '🍋', value: 3, weight: 80 },
  { id: 'orange', name: '🍊', value: 4, weight: 60 },
  { id: 'plum', name: '🍇', value: 5, weight: 40 },
  { id: 'bell', name: '🔔', value: 10, weight: 20 },
  { id: 'diamond', name: '💎', value: 50, weight: 10 },
  { id: 'seven', name: '7️⃣', value: 100, weight: 5 },
];

import { MIN_BET_SC, MAX_BET_SC, MAX_WIN_SC, MAX_WIN_GC } from "../../shared/constants";

// Game configuration (in production, load from database)
let gameConfig = {
  rtp: 95, // Return to Player percentage
  minBet: 0.01,
  maxBet: 5.00, // Max bet 5.00 SC
  maxLineWinnings: MAX_WIN_SC, // Cap SC winnings
};

// Cryptographically secure RNG using crypto module
import * as crypto from 'crypto';

const getRandomSymbol = (): SlotSymbol => {
  const totalWeight = SYMBOLS.reduce((acc, s) => acc + s.weight, 0);
  
  // Use crypto for better randomness
  const randomBytes = crypto.randomBytes(4);
  const randomValue = randomBytes.readUInt32BE(0);
  let random = (randomValue / 0xffffffff) * totalWeight;

  for (const symbol of SYMBOLS) {
    if (random < symbol.weight) return symbol;
    random -= symbol.weight;
  }
  return SYMBOLS[0];
};

// Generate 3x3 reel grid
const generateReels = (): string[][] => {
  const reels: string[][] = [[], [], []];

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      reels[i][j] = getRandomSymbol().id;
    }
  }

  return reels;
};

// Calculate winnings based on matched lines
const calculateWinnings = (reels: string[][], betAmount: number): { winnings: number; winLines: string[][]; resultType: string } => {
  let winnings = 0;
  const winLines: string[][] = [];
  let resultType = 'loss';

  // Horizontal lines
  for (let row = 0; row < 3; row++) {
    const line = [reels[row][0], reels[row][1], reels[row][2]];
    if (line[0] === line[1] && line[1] === line[2]) {
      const symbol = SYMBOLS.find(s => s.id === line[0]);
      if (symbol) {
        const lineWinnings = Math.min(symbol.value * betAmount, gameConfig.maxLineWinnings);
        winnings += lineWinnings;
        winLines.push(line);
      }
    }
  }

  // Vertical lines
  for (let col = 0; col < 3; col++) {
    const line = [reels[0][col], reels[1][col], reels[2][col]];
    if (line[0] === line[1] && line[1] === line[2]) {
      const symbol = SYMBOLS.find(s => s.id === line[0]);
      if (symbol) {
        const lineWinnings = Math.min(symbol.value * betAmount, gameConfig.maxLineWinnings);
        winnings += lineWinnings;
        winLines.push(line);
      }
    }
  }

  // Diagonal lines
  const diag1 = [reels[0][0], reels[1][1], reels[2][2]];
  if (diag1[0] === diag1[1] && diag1[1] === diag1[2]) {
    const symbol = SYMBOLS.find(s => s.id === diag1[0]);
    if (symbol) {
      const lineWinnings = Math.min(symbol.value * betAmount, gameConfig.maxLineWinnings);
      winnings += lineWinnings;
      winLines.push(diag1);
    }
  }

  const diag2 = [reels[0][2], reels[1][1], reels[2][0]];
  if (diag2[0] === diag2[1] && diag2[1] === diag2[2]) {
    const symbol = SYMBOLS.find(s => s.id === diag2[0]);
    if (symbol) {
      const lineWinnings = Math.min(symbol.value * betAmount, gameConfig.maxLineWinnings);
      winnings += lineWinnings;
      winLines.push(diag2);
    }
  }

  if (winnings > 0) {
    resultType = winnings > betAmount * 5 ? 'big_win' : 'win';
  }

  return { winnings, winLines, resultType };
};

// Spin slots
export const handleSpin: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { bet_amount, game_id = 1 } = req.body;

    // Validate bet
    if (!bet_amount || bet_amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid bet amount'
      });
    }

    if (bet_amount < gameConfig.minBet || bet_amount > gameConfig.maxBet) {
      return res.status(400).json({
        success: false,
        error: `Bet must be between ${gameConfig.minBet} and ${gameConfig.maxBet}`
      });
    }

    // Get player wallet
    const player = await dbQueries.getPlayerById(req.user.playerId);
    if (player.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    const currentPlayer = player.rows[0];

    // Check sufficient balance (use SC for Pragmatic games)
    if (currentPlayer.sc_balance < bet_amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient sweeps coins'
      });
    }

    // Deduct bet from player's SC balance
    await dbQueries.recordWalletTransaction(
      req.user.playerId,
      'slots_bet',
      0,
      -bet_amount,
      `Slots spin bet: ${bet_amount} SC`
    );

    // Generate reels
    const reels = generateReels();

    // Calculate winnings
    let { winnings, winLines, resultType } = calculateWinnings(reels, bet_amount);

    // Apply platform-wide max win cap (for SC, using MAX_WIN_SC)
    if (winnings > MAX_WIN_SC) {
      winnings = MAX_WIN_SC;
      console.log(`[Slots] Win capped at ${MAX_WIN_SC} SC for player ${req.user.playerId}`);
    }

    // Add winnings to wallet if any (use SC)
    if (winnings > 0) {
      await dbQueries.recordWalletTransaction(
        req.user.playerId,
        'slots_win',
        0,
        winnings,
        `Slots spin win: ${winnings} SC (${winLines.length} lines)`
      );
    }

    // Record game result in database
    const reelString = JSON.stringify(reels);
    await dbQueries.recordSlotsResult(
      req.user.playerId,
      game_id,
      bet_amount,
      winnings,
      reelString
    );

    // Get updated wallet
    const updatedPlayer = await dbQueries.getPlayerById(req.user.playerId);
    const updatedWallet = updatedPlayer.rows[0];

    res.json({
      success: true,
      data: {
        reels,
        bet_amount,
        winnings,
        result_type: resultType,
        won: winnings > 0,
        win_lines: winLines,
        new_balance: updatedWallet.sc_balance,
        wallet: {
          goldCoins: updatedWallet.gc_balance,
          sweepsCoins: updatedWallet.sc_balance
        }
      }
    });
  } catch (error) {
    console.error('[Slots] Spin error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process spin'
    });
  }
};

// Get game configuration
export const handleGetConfig: RequestHandler = async (req, res) => {
  try {
    let rtp = gameConfig.rtp;

    // Try to get RTP from database, but fall back to defaults if it fails
    try {
      const gameResult = await query(
        'SELECT * FROM games WHERE category = $1 LIMIT 1',
        ['Slots']
      );
      if (gameResult.rows && gameResult.rows[0] && gameResult.rows[0].rtp) {
        rtp = gameResult.rows[0].rtp;
      }
    } catch (dbError) {
      console.warn('[Slots] Database error, using default config:', dbError);
      // Continue with default config
    }

    const config = {
      rtp,
      minBet: gameConfig.minBet,
      maxBet: gameConfig.maxBet,
      maxLineWinnings: gameConfig.maxLineWinnings,
      symbols: SYMBOLS
    };

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('[Slots] Get config error:', error);
    // Return default config even on error
    res.json({
      success: true,
      data: {
        rtp: gameConfig.rtp,
        minBet: gameConfig.minBet,
        maxBet: gameConfig.maxBet,
        maxLineWinnings: gameConfig.maxLineWinnings,
        symbols: SYMBOLS
      }
    });
  }
};

// Update game configuration (admin only)
export const handleUpdateConfig: RequestHandler = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { rtp, minBet, maxBet } = req.body;

    if (rtp !== undefined && rtp > 0 && rtp <= 100) {
      gameConfig.rtp = rtp;

      // Update in database if game exists
      await query(
        'UPDATE games SET rtp = $1 WHERE category = $2',
        [rtp, 'Slots']
      );
    }

    if (minBet !== undefined && minBet > 0) {
      gameConfig.minBet = minBet;
    }

    if (maxBet !== undefined && maxBet > gameConfig.minBet) {
      gameConfig.maxBet = maxBet;
    }

    res.json({
      success: true,
      data: {
        rtp: gameConfig.rtp,
        minBet: gameConfig.minBet,
        maxBet: gameConfig.maxBet
      }
    });
  } catch (error) {
    console.error('[Slots] Update config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update configuration'
    });
  }
};
