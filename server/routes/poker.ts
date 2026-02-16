import { RequestHandler } from "express";
import * as dbQueries from "../db/queries";
import { query } from "../db/connection";
import { PokerService } from "../services/poker-service";

// Game configuration
let gameConfig = {
  rtp: 95,
  minBuyIn: 10,
  maxBuyIn: 10000,
  houseCommission: 5, // percentage
};

// Get all poker tables
export const handleGetPokerTables: RequestHandler = async (req, res) => {
  try {
    const result = await dbQueries.getPokerTables();

    const tables = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      stakes: row.stakes,
      max_players: row.max_players,
      current_players: row.current_players,
      buy_in_min: row.buy_in_min,
      buy_in_max: row.buy_in_max,
      status: row.status,
      available_seats: row.max_players - row.current_players
    }));

    res.json({
      success: true,
      data: tables
    });
  } catch (error) {
    console.error('[Poker] Get tables error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get poker tables'
    });
  }
};

// Join a poker table
export const handleJoinTable: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { table_id, buy_in } = req.body;

    if (!table_id || !buy_in || buy_in <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Table ID and buy-in amount required'
      });
    }

    // Get table details
    const tableResult = await query(
      'SELECT * FROM poker_tables WHERE id = $1',
      [table_id]
    );

    if (tableResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Table not found'
      });
    }

    const table = tableResult.rows[0];

    // Check if table is full
    if (table.current_players >= table.max_players) {
      return res.status(400).json({
        success: false,
        error: 'Table is full'
      });
    }

    // Validate buy-in amount
    if (buy_in < table.buy_in_min || buy_in > table.buy_in_max) {
      return res.status(400).json({
        success: false,
        error: `Buy-in must be between ${table.buy_in_min} and ${table.buy_in_max}`
      });
    }

    // Check player's balance
    const player = await dbQueries.getPlayerById(req.user.playerId);
    if (player.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    const playerData = player.rows[0];
    if (playerData.gc_balance < buy_in) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient gold coins'
      });
    }

    // Deduct buy-in from player's balance
    await dbQueries.recordWalletTransaction(
      req.user.playerId,
      'poker_buy_in',
      -buy_in,
      0,
      `Poker table buy-in: ${table.name}`
    );

    // Increment player count on table
    const newPlayerCount = table.current_players + 1;
    await query(
      'UPDATE poker_tables SET current_players = $1 WHERE id = $2',
      [newPlayerCount, table_id]
    );

    // Get updated player wallet
    const updatedPlayer = await dbQueries.getPlayerById(req.user.playerId);
    const updatedWallet = updatedPlayer.rows[0];

    // In a real system, you would create a session record for the player at the table
    // For now, just return success with table info
    res.json({
      success: true,
      data: {
        message: `Joined ${table.name}`,
        table_id: table.id,
        table_name: table.name,
        buy_in,
        seat: newPlayerCount,
        wallet: {
          goldCoins: updatedWallet.gc_balance,
          sweepsCoins: updatedWallet.sc_balance
        }
      }
    });
  } catch (error) {
    console.error('[Poker] Join table error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join table'
    });
  }
};

// Player folds
export const handleFold: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { table_id } = req.body;

    if (!table_id) {
      return res.status(400).json({
        success: false,
        error: 'Table ID required'
      });
    }

    // Process fold in game service
    const folded = PokerService.playerFold(table_id, req.user.playerId);

    if (!folded) {
      return res.status(400).json({
        success: false,
        error: 'Failed to process fold - invalid game or player state'
      });
    }

    const tableState = PokerService.getTableState(table_id);

    res.json({
      success: true,
      data: {
        message: 'Fold recorded',
        table_id,
        tableState
      }
    });
  } catch (error) {
    console.error('[Poker] Fold error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process fold'
    });
  }
};

// Cash out from table
export const handleCashOut: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { table_id, cash_out_amount } = req.body;

    if (!table_id || !cash_out_amount || cash_out_amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Table ID and cash out amount required'
      });
    }

    // Add winnings back to wallet
    await dbQueries.recordWalletTransaction(
      req.user.playerId,
      'poker_cash_out',
      cash_out_amount,
      0,
      `Poker table cash out`
    );

    // Decrement player count
    await query(
      'UPDATE poker_tables SET current_players = current_players - 1 WHERE id = $1',
      [table_id]
    );

    // Get updated wallet
    const player = await dbQueries.getPlayerById(req.user.playerId);
    const updatedWallet = player.rows[0];

    res.json({
      success: true,
      data: {
        message: 'Successfully cashed out',
        cash_out_amount,
        wallet: {
          goldCoins: updatedWallet.gc_balance,
          sweepsCoins: updatedWallet.sc_balance
        }
      }
    });
  } catch (error) {
    console.error('[Poker] Cash out error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cash out'
    });
  }
};

// Get game configuration
export const handleGetConfig: RequestHandler = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        minBuyIn: gameConfig.minBuyIn,
        maxBuyIn: gameConfig.maxBuyIn,
        houseCommission: gameConfig.houseCommission,
        rtp: gameConfig.rtp
      }
    });
  } catch (error) {
    console.error('[Poker] Get config error:', error);
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

    const { minBuyIn, maxBuyIn, houseCommission } = req.body;

    if (minBuyIn !== undefined && minBuyIn > 0) {
      gameConfig.minBuyIn = minBuyIn;
    }

    if (maxBuyIn !== undefined && maxBuyIn > gameConfig.minBuyIn) {
      gameConfig.maxBuyIn = maxBuyIn;
    }

    if (houseCommission !== undefined && houseCommission >= 0 && houseCommission <= 100) {
      gameConfig.houseCommission = houseCommission;
    }

    res.json({
      success: true,
      data: gameConfig
    });
  } catch (error) {
    console.error('[Poker] Update config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update configuration'
    });
  }
};
