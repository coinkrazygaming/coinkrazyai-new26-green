import { RequestHandler } from 'express';
import * as dbQueries from '../db/queries';

export const handleRecordSale: RequestHandler = async (req, res) => {
  try {
    const playerId = req.user?.id;
    const { gameType, designId, purchaseCostSc, winAmountSc } = req.body;

    if (!playerId) return res.status(401).json({ error: 'Unauthorized' });
    if (!gameType || !purchaseCostSc) {
      return res.status(400).json({ error: 'Game type and purchase cost required' });
    }

    const result = await dbQueries.recordSalesTransaction(
      playerId,
      gameType,
      designId || null,
      purchaseCostSc,
      winAmountSc || 0
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error recording sale:', error);
    res.status(500).json({ error: 'Failed to record sale' });
  }
};

export const handleGetSalesStats: RequestHandler = async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : null;

    const result = await dbQueries.getSalesStats(startDate, endDate);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sales stats:', error);
    res.status(500).json({ error: 'Failed to fetch sales stats' });
  }
};

export const handleGetTotalRevenue: RequestHandler = async (req, res) => {
  try {
    const result = await dbQueries.query(`
      SELECT
        SUM(purchase_cost_sc) as total_revenue_sc,
        SUM(win_amount_sc) as total_payouts_sc,
        SUM(purchase_cost_sc - win_amount_sc) as net_profit_sc,
        COUNT(*) as total_transactions
      FROM sales_transactions
    `);

    res.json({
      totalRevenueScPerDay: result.rows[0].total_revenue_sc || 0,
      totalPayoutsScPerDay: result.rows[0].total_payouts_sc || 0,
      netProfitScPerDay: result.rows[0].net_profit_sc || 0,
      totalTransactions: result.rows[0].total_transactions || 0
    });
  } catch (error) {
    console.error('Error fetching total revenue:', error);
    res.status(500).json({ error: 'Failed to fetch revenue' });
  }
};

export const handleGetGameTypeStats: RequestHandler = async (req, res) => {
  try {
    const result = await dbQueries.query(`
      SELECT
        game_type,
        COUNT(*) as total_sales,
        SUM(purchase_cost_sc) as total_revenue_sc,
        SUM(win_amount_sc) as total_payouts_sc,
        SUM(purchase_cost_sc - win_amount_sc) as net_profit_sc,
        AVG(purchase_cost_sc) as avg_purchase_cost,
        AVG(win_amount_sc) as avg_win_amount
      FROM sales_transactions
      GROUP BY game_type
      ORDER BY total_revenue_sc DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching game type stats:', error);
    res.status(500).json({ error: 'Failed to fetch game stats' });
  }
};

export const handleGetPlayerSalesHistory: RequestHandler = async (req, res) => {
  try {
    const playerId = req.user?.id;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!playerId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await dbQueries.query(
      `SELECT * FROM sales_transactions
       WHERE player_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [playerId, limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching player sales history:', error);
    res.status(500).json({ error: 'Failed to fetch sales history' });
  }
};

export const handleGetDailyRevenueSummary: RequestHandler = async (req, res) => {
  try {
    const result = await dbQueries.query(`
      SELECT
        DATE(created_at) as date,
        game_type,
        COUNT(*) as transactions,
        SUM(purchase_cost_sc) as revenue_sc,
        SUM(win_amount_sc) as payouts_sc,
        SUM(purchase_cost_sc - win_amount_sc) as profit_sc
      FROM sales_transactions
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at), game_type
      ORDER BY DATE(created_at) DESC, game_type
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching daily revenue:', error);
    res.status(500).json({ error: 'Failed to fetch daily revenue' });
  }
};

export const handleGetTopPerformingGames: RequestHandler = async (req, res) => {
  try {
    const result = await dbQueries.query(`
      SELECT
        game_type,
        design_id,
        COUNT(*) as purchases,
        SUM(purchase_cost_sc) as revenue_sc,
        SUM(purchase_cost_sc - win_amount_sc) as profit_sc,
        AVG(win_amount_sc) as avg_win_amount
      FROM sales_transactions
      WHERE design_id IS NOT NULL
      GROUP BY game_type, design_id
      ORDER BY revenue_sc DESC
      LIMIT 20
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching top performing games:', error);
    res.status(500).json({ error: 'Failed to fetch top games' });
  }
};
