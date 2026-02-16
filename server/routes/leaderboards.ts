import { RequestHandler } from "express";
import * as dbQueries from "../db/queries";

// Get leaderboard by type and period
export const handleGetLeaderboard: RequestHandler = async (req, res) => {
  try {
    const { type = 'wins', period = 'all_time' } = req.query;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    if (!type || typeof type !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Leaderboard type required'
      });
    }

    const validTypes = ['wins', 'wagered', 'streak', 'biggest_win'];
    const validPeriods = ['daily', 'weekly', 'monthly', 'all_time'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid leaderboard type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    if (!validPeriods.includes(period as string)) {
      return res.status(400).json({
        success: false,
        error: `Invalid period. Must be one of: ${validPeriods.join(', ')}`
      });
    }

    const result = await dbQueries.getLeaderboard(type, period as string, limit);

    const entries = result.rows.map(row => ({
      rank: row.rank,
      player_id: row.player_id,
      username: row.username,
      name: row.name,
      score: row.score,
      period: row.period,
      gc_balance: row.gc_balance // Current balance
    }));

    res.json({
      success: true,
      data: {
        type,
        period,
        entries
      }
    });
  } catch (error) {
    console.error('[Leaderboards] Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get leaderboard'
    });
  }
};

// Get player's rank
export const handleGetPlayerRank: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { type = 'wins' } = req.query;

    if (!type || typeof type !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Leaderboard type required'
      });
    }

    // Get player rank across all periods
    const allTimeResult = await dbQueries.getLeaderboard(type, 'all_time', 1000);
    const playerRank = allTimeResult.rows.find(row => row.player_id === req.user?.playerId);

    if (!playerRank) {
      return res.json({
        success: true,
        data: {
          rank: null,
          score: 0,
          message: 'Not ranked yet'
        }
      });
    }

    res.json({
      success: true,
      data: {
        rank: playerRank.rank,
        score: playerRank.score,
        type,
        period: 'all_time'
      }
    });
  } catch (error) {
    console.error('[Leaderboards] Get player rank error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get player rank'
    });
  }
};

// Update leaderboards (admin endpoint, can be called via cron)
export const handleUpdateLeaderboards: RequestHandler = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    // Update leaderboard entries
    await dbQueries.updateLeaderboardEntries();

    res.json({
      success: true,
      message: 'Leaderboards updated successfully'
    });
  } catch (error) {
    console.error('[Leaderboards] Update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update leaderboards'
    });
  }
};
