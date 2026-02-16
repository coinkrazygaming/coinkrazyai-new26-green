import { RequestHandler } from "express";
import * as dbQueries from "../db/queries";
import { query } from "../db/connection";

import { MIN_BET_SC, MAX_BET_SC, MAX_WIN_SC } from "../../shared/constants";

// Game configuration
let gameConfig = {
  rtp: 92,
  minBet: MIN_BET_SC,
  maxBet: MAX_BET_SC,
  minParlay: 2,
  maxParlay: 10,
  houseCommission: 8, // percentage
};

// Get live sports events
export const handleGetLiveGames: RequestHandler = async (req, res) => {
  try {
    const result = await dbQueries.getSportsEvents();

    const events = result.rows.map(row => ({
      id: row.id,
      sport: row.sport,
      event_name: row.event_name,
      event_date: row.event_date,
      status: row.status,
      total_bets: row.total_bets,
      line_movement: row.line_movement,
      locked: row.locked
    }));

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('[Sportsbook] Get games error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get live games'
    });
  }
};

// Place a single bet
export const handleSingleBet: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { event_id, bet_type, amount, odds } = req.body;

    if (!event_id || !amount || !odds || amount <= 0 || odds <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Event ID, amount, and odds required'
      });
    }

    if (amount < gameConfig.minBet || amount > gameConfig.maxBet) {
      return res.status(400).json({
        success: false,
        error: `Bet must be between ${gameConfig.minBet} SC and ${gameConfig.maxBet} SC`
      });
    }

    // Get event
    const eventResult = await query(
      'SELECT * FROM sports_events WHERE id = $1',
      [event_id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    const event = eventResult.rows[0];

    if (event.locked) {
      return res.status(400).json({
        success: false,
        error: 'Event is locked for betting'
      });
    }

    // Check player balance
    const player = await dbQueries.getPlayerById(req.user.playerId);
    if (player.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    const playerData = player.rows[0];
    if (playerData.sc_balance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient Sweeps Coins'
      });
    }

    // Deduct bet from player wallet (using SC)
    await dbQueries.recordWalletTransaction(
      req.user.playerId,
      'sports_bet',
      0,
      -amount,
      `Sports bet on ${event.event_name}`
    );

    // Record bet
    let potentialWinnings = amount * odds;

    // Apply platform-wide max win cap ($20)
    if (potentialWinnings > MAX_WIN_SC) {
      potentialWinnings = MAX_WIN_SC;
      console.log(`[Sportsbook] Potential winnings capped at ${MAX_WIN_SC} SC for player ${req.user.playerId}`);
    }

    const betResult = await dbQueries.recordSportsBet(
      req.user.playerId,
      event_id,
      bet_type || 'single',
      amount,
      odds,
      potentialWinnings
    );

    // Update event total bets
    await query(
      'UPDATE sports_events SET total_bets = total_bets + $1 WHERE id = $2',
      [amount, event_id]
    );

    // Get updated wallet
    const updatedPlayer = await dbQueries.getPlayerById(req.user.playerId);
    const updatedWallet = updatedPlayer.rows[0];

    res.json({
      success: true,
      data: {
        message: 'Bet placed successfully',
        bet_id: betResult.rows[0].id,
        event_name: event.event_name,
        bet_amount: amount,
        odds,
        potential_winnings: potentialWinnings,
        wallet: {
          goldCoins: updatedWallet.gc_balance,
          sweepsCoins: updatedWallet.sc_balance
        }
      }
    });
  } catch (error) {
    console.error('[Sportsbook] Bet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to place bet'
    });
  }
};

// Place a parlay bet
export const handlePlaceParlay: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { event_ids, amount, odds_list } = req.body;

    if (!event_ids || !Array.isArray(event_ids) || event_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one event required'
      });
    }

    if (event_ids.length < gameConfig.minParlay || event_ids.length > gameConfig.maxParlay) {
      return res.status(400).json({
        success: false,
        error: `Parlay must have between ${gameConfig.minParlay} and ${gameConfig.maxParlay} picks`
      });
    }

    if (!amount || amount <= 0 || amount < gameConfig.minBet || amount > gameConfig.maxBet) {
      return res.status(400).json({
        success: false,
        error: `Bet must be between ${gameConfig.minBet} SC and ${gameConfig.maxBet} SC`
      });
    }

    // Check player balance
    const player = await dbQueries.getPlayerById(req.user.playerId);
    if (player.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    const playerData = player.rows[0];
    if (playerData.sc_balance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient Sweeps Coins'
      });
    }

    // Calculate parlay odds (product of all odds)
    let parlayOdds = 1;
    if (odds_list && Array.isArray(odds_list)) {
      parlayOdds = odds_list.reduce((acc, o) => acc * o, 1);
    } else {
      // Default fallback
      parlayOdds = Math.pow(2, event_ids.length);
    }

    // Deduct bet (using SC)
    await dbQueries.recordWalletTransaction(
      req.user.playerId,
      'parlay_bet',
      0,
      -amount,
      `Parlay bet on ${event_ids.length} events`
    );

    // Record bet as parlay
    let potentialWinnings = amount * parlayOdds;

    // Apply platform-wide max win cap ($20)
    if (potentialWinnings > MAX_WIN_SC) {
      potentialWinnings = MAX_WIN_SC;
      console.log(`[Sportsbook] Parlay potential winnings capped at ${MAX_WIN_SC} SC for player ${req.user.playerId}`);
    }

    const betResult = await dbQueries.recordSportsBet(
      req.user.playerId,
      event_ids[0], // Primary event
      'parlay',
      amount,
      parlayOdds,
      potentialWinnings
    );

    // Get updated wallet
    const updatedPlayer = await dbQueries.getPlayerById(req.user.playerId);
    const updatedWallet = updatedPlayer.rows[0];

    res.json({
      success: true,
      data: {
        message: `Parlay placed on ${event_ids.length} events`,
        bet_id: betResult.rows[0].id,
        bet_type: 'parlay',
        bet_amount: amount,
        parlay_odds: parlayOdds,
        potential_winnings: potentialWinnings,
        wallet: {
          goldCoins: updatedWallet.gc_balance,
          sweepsCoins: updatedWallet.sc_balance
        }
      }
    });
  } catch (error) {
    console.error('[Sportsbook] Parlay error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to place parlay'
    });
  }
};

// Get game configuration
export const handleGetConfig: RequestHandler = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        minBet: gameConfig.minBet,
        maxBet: gameConfig.maxBet,
        minParlay: gameConfig.minParlay,
        maxParlay: gameConfig.maxParlay,
        houseCommission: gameConfig.houseCommission,
        rtp: gameConfig.rtp
      }
    });
  } catch (error) {
    console.error('[Sportsbook] Get config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get configuration'
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

    const { minBet, maxBet, minParlay, maxParlay, houseCommission } = req.body;

    if (minBet !== undefined && minBet > 0) {
      gameConfig.minBet = minBet;
    }

    if (maxBet !== undefined && maxBet > gameConfig.minBet) {
      gameConfig.maxBet = maxBet;
    }

    if (minParlay !== undefined && minParlay >= 2) {
      gameConfig.minParlay = minParlay;
    }

    if (maxParlay !== undefined && maxParlay > gameConfig.minParlay) {
      gameConfig.maxParlay = maxParlay;
    }

    if (houseCommission !== undefined && houseCommission >= 0 && houseCommission <= 100) {
      gameConfig.houseCommission = houseCommission;
    }

    res.json({
      success: true,
      data: gameConfig
    });
  } catch (error) {
    console.error('[Sportsbook] Update config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update configuration'
    });
  }
};
