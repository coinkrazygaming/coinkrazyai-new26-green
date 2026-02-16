import { RequestHandler } from "express";
import * as dbQueries from "../db/queries";
import { query } from "../db/connection";
import { BingoService } from "../services/bingo-service";

// Game configuration
let gameConfig = {
  rtp: 85,
  minTicketPrice: 0.5,
  maxTicketPrice: 50,
  houseCommission: 15, // percentage
};

// Generate a bingo card
function generateBingoCard(): number[][] {
  const card: number[][] = [[], [], [], [], []];
  const ranges = [
    [1, 15], [16, 30], [31, 45], [46, 60], [61, 75]
  ];

  for (let i = 0; i < 5; i++) {
    const [min, max] = ranges[i];
    const nums = new Set<number>();
    while (nums.size < 5) {
      nums.add(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    card[i] = Array.from(nums).sort((a, b) => a - b);
  }

  // Free space in middle
  card[2][2] = 0;
  return card;
}

// Get active bingo games
export const handleGetBingoRooms: RequestHandler = async (req, res) => {
  try {
    const result = await dbQueries.getBingoGames();

    const games = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      pattern: row.pattern,
      players: row.players,
      ticket_price: row.ticket_price,
      jackpot: row.jackpot,
      status: row.status
    }));

    res.json({
      success: true,
      data: games
    });
  } catch (error) {
    console.error('[Bingo] Get games error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get bingo games'
    });
  }
};

// Buy a bingo ticket
export const handleBuyBingoTicket: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { game_id } = req.body;

    if (!game_id) {
      return res.status(400).json({
        success: false,
        error: 'Game ID required'
      });
    }

    // Get game details
    const gameResult = await query(
      'SELECT * FROM bingo_games WHERE id = $1',
      [game_id]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }

    const game = gameResult.rows[0];

    // Check player balance
    const player = await dbQueries.getPlayerById(req.user.playerId);
    if (player.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    const playerData = player.rows[0];
    if (playerData.gc_balance < game.ticket_price) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient gold coins'
      });
    }

    // Deduct ticket price
    await dbQueries.recordWalletTransaction(
      req.user.playerId,
      'bingo_ticket',
      -game.ticket_price,
      0,
      `Bingo ticket for: ${game.name}`
    );

    // Generate bingo card
    const card = generateBingoCard();

    // Increment player count
    await query(
      'UPDATE bingo_games SET players = players + 1 WHERE id = $1',
      [game_id]
    );

    // Get updated wallet
    const updatedPlayer = await dbQueries.getPlayerById(req.user.playerId);
    const updatedWallet = updatedPlayer.rows[0];

    res.json({
      success: true,
      data: {
        message: `Bought ticket for ${game.name}`,
        game_id,
        game_name: game.name,
        ticket_price: game.ticket_price,
        card,
        wallet: {
          goldCoins: updatedWallet.gc_balance,
          sweepsCoins: updatedWallet.sc_balance
        }
      }
    });
  } catch (error) {
    console.error('[Bingo] Buy ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to buy ticket'
    });
  }
};

// Mark a number on the card
export const handleMarkNumber: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { game_id, number } = req.body;

    if (!game_id || !number) {
      return res.status(400).json({
        success: false,
        error: 'Game ID and number required'
      });
    }

    // Mark the number on the player's card
    const hasBingo = BingoService.markNumber(game_id, req.user.playerId, number);

    const gameState = BingoService.getGameState(game_id);

    res.json({
      success: true,
      data: {
        message: hasBingo ? 'BINGO! You won!' : `Marked number ${number}`,
        game_id,
        number,
        hasBingo,
        gameState
      }
    });
  } catch (error) {
    console.error('[Bingo] Mark number error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark number'
    });
  }
};

// Report bingo win
export const handleBingoWin: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { game_id, pattern } = req.body;

    if (!game_id || !pattern) {
      return res.status(400).json({
        success: false,
        error: 'Game ID and pattern required'
      });
    }

    // Get game info
    const gameResult = await query(
      'SELECT * FROM bingo_games WHERE id = $1',
      [game_id]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }

    const game = gameResult.rows[0];
    const winnings = game.jackpot;

    // Add winnings to player wallet
    await dbQueries.recordWalletTransaction(
      req.user.playerId,
      'bingo_win',
      winnings,
      0,
      `Bingo win: ${pattern} pattern - ${game.name}`
    );

    // Record the result
    await dbQueries.recordBingoResult(
      req.user.playerId,
      game_id,
      game.ticket_price,
      winnings,
      pattern
    );

    // Get updated wallet
    const player = await dbQueries.getPlayerById(req.user.playerId);
    const updatedWallet = player.rows[0];

    res.json({
      success: true,
      data: {
        message: 'Congratulations! You won!',
        pattern,
        winnings,
        wallet: {
          goldCoins: updatedWallet.gc_balance,
          sweepsCoins: updatedWallet.sc_balance
        }
      }
    });
  } catch (error) {
    console.error('[Bingo] Win error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process bingo win'
    });
  }
};

// Get game configuration
export const handleGetConfig: RequestHandler = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        minTicketPrice: gameConfig.minTicketPrice,
        maxTicketPrice: gameConfig.maxTicketPrice,
        houseCommission: gameConfig.houseCommission,
        rtp: gameConfig.rtp
      }
    });
  } catch (error) {
    console.error('[Bingo] Get config error:', error);
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

    const { minTicketPrice, maxTicketPrice, houseCommission, rtp } = req.body;

    if (minTicketPrice !== undefined && minTicketPrice > 0) {
      gameConfig.minTicketPrice = minTicketPrice;
    }

    if (maxTicketPrice !== undefined && maxTicketPrice > gameConfig.minTicketPrice) {
      gameConfig.maxTicketPrice = maxTicketPrice;
    }

    if (houseCommission !== undefined && houseCommission >= 0 && houseCommission <= 100) {
      gameConfig.houseCommission = houseCommission;
    }

    if (rtp !== undefined && rtp > 0 && rtp <= 100) {
      gameConfig.rtp = rtp;
    }

    res.json({
      success: true,
      data: gameConfig
    });
  } catch (error) {
    console.error('[Bingo] Update config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update configuration'
    });
  }
};
