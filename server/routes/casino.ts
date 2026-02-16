import { RequestHandler } from 'express';
import * as dbQueries from '../db/queries';
import { query } from '../db/connection';
import { emitWalletUpdate } from '../socket';

export const handlePlayCasinoGame: RequestHandler = async (req, res) => {
  const { game_id, bet_amount: raw_bet_amount } = req.body;
  const playerId = (req as any).user?.playerId;
  const bet_amount = parseFloat(raw_bet_amount);

  if (!playerId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!game_id || isNaN(bet_amount) || bet_amount <= 0) {
    return res.status(400).json({ error: 'Invalid game_id or bet_amount' });
  }

  try {
    // Get current player
    const playerResult = await query(
      'SELECT sc_balance FROM players WHERE id = $1',
      [playerId]
    );

    if (!playerResult.rows.length) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const currentBalance = Number(playerResult.rows[0].sc_balance);

    // Check if player has enough balance
    if (currentBalance < bet_amount) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        current_balance: currentBalance,
        required: bet_amount
      });
    }

    // Determine if player wins (random 40% win rate)
    const wins = Math.random() < 0.4;
    let winnings = 0;

    if (wins) {
      // Calculate random winnings (1x to 5x bet)
      const multiplier = 1 + Math.random() * 4;
      winnings = Math.round(bet_amount * multiplier * 100) / 100;
    }

    // Calculate new balance
    const newBalance = currentBalance - bet_amount + winnings;

    // Deduct bet from balance
    await dbQueries.recordWalletTransaction(
      playerId,
      'Loss',
      0,
      -bet_amount,
      `Casino game spin (${game_id}): ${wins ? 'Win' : 'Loss'}`
    );

    // Add winnings if any
    if (winnings > 0) {
      await dbQueries.recordWalletTransaction(
        playerId,
        'Win',
        0,
        winnings,
        `Casino game winnings (${game_id})`
      );
    }

    // Track spin in casino_game_spins table
    try {
      await query(
        `INSERT INTO casino_game_spins 
        (player_id, game_id, game_name, provider, bet_amount, winnings, balance_before, balance_after, result) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          playerId,
          game_id,
          game_id, // game_name - use game_id for now, could be enhanced
          'Pragmatic', // provider - could be parameterized
          bet_amount,
          winnings,
          currentBalance,
          newBalance,
          wins ? 'win' : 'loss'
        ]
      );
    } catch (err: any) {
      console.error('[Casino] Failed to record spin:', err);
      // Don't fail the request if tracking fails
    }

    // Emit wallet update via Socket.io for real-time balance updates
    emitWalletUpdate(playerId, {
      userId: playerId,
      sweepsCoins: newBalance,
      goldCoins: 0,
      type: 'casino_game',
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      data: {
        game_id,
        bet_amount,
        winnings,
        result: wins ? 'win' : 'loss',
        new_balance: newBalance,
        wallet: {
          goldCoins: 0, // Keep this from context
          sweepsCoins: newBalance
        }
      }
    });
  } catch (err) {
    console.error('[Casino] Play game error:', err);
    return res.status(500).json({ error: 'Failed to process game' });
  }
};

export const handleGetSpinHistory: RequestHandler = async (req, res) => {
  const playerId = (req as any).user?.playerId;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  if (!playerId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Get spin history
    const spinsResult = await query(
      `SELECT id, game_id, game_name, provider, bet_amount, winnings, balance_before, balance_after, result, created_at
       FROM casino_game_spins
       WHERE player_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [playerId, limit, offset]
    );

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM casino_game_spins WHERE player_id = $1',
      [playerId]
    );

    return res.json({
      success: true,
      data: {
        spins: spinsResult.rows,
        total: parseInt(countResult.rows[0].total),
        limit,
        offset
      }
    });
  } catch (err) {
    console.error('[Casino] Get spin history error:', err);
    return res.status(500).json({ error: 'Failed to fetch spin history' });
  }
};

export const handleGetSpinStats: RequestHandler = async (req, res) => {
  const playerId = (req as any).user?.playerId;

  if (!playerId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Get stats
    const statsResult = await query(
      `SELECT 
        COUNT(*) as total_spins,
        SUM(bet_amount) as total_wagered,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as total_wins,
        SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as total_losses,
        SUM(winnings) as total_winnings,
        ROUND(AVG(CASE WHEN result = 'win' THEN winnings ELSE NULL END), 2) as avg_win,
        MAX(winnings) as max_win,
        COUNT(DISTINCT game_id) as games_played
      FROM casino_game_spins
      WHERE player_id = $1`,
      [playerId]
    );

    const stats = statsResult.rows[0];

    return res.json({
      success: true,
      data: {
        total_spins: parseInt(stats.total_spins),
        total_wagered: parseFloat(stats.total_wagered || 0),
        total_wins: parseInt(stats.total_wins),
        total_losses: parseInt(stats.total_losses),
        total_winnings: parseFloat(stats.total_winnings || 0),
        avg_win: parseFloat(stats.avg_win || 0),
        max_win: parseFloat(stats.max_win || 0),
        games_played: parseInt(stats.games_played),
        win_rate: stats.total_spins > 0 ? (parseInt(stats.total_wins) / parseInt(stats.total_spins) * 100).toFixed(2) : '0.00'
      }
    });
  } catch (err) {
    console.error('[Casino] Get spin stats error:', err);
    return res.status(500).json({ error: 'Failed to fetch spin stats' });
  }
};
