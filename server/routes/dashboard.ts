import { RequestHandler } from 'express';
import { query } from '../db/connection';

export const getAdminDashboardStats: RequestHandler = async (req, res) => {
  try {
    // Total players and active players
    const playersResult = await query(
      'SELECT COUNT(*) as total, SUM(CASE WHEN status = $1 THEN 1 ELSE 0 END) as active FROM players',
      ['Active']
    );
    const totalPlayers = parseInt(playersResult.rows[0]?.total || '0');
    const activePlayers = parseInt(playersResult.rows[0]?.active || '0');

    // Total revenue
    const revenueResult = await query(
      'SELECT COALESCE(SUM(amount_usd), 0) as total_revenue FROM purchases WHERE status = $1',
      ['Completed']
    );
    const totalRevenue = parseFloat(revenueResult.rows[0]?.total_revenue || '0');

    // Total wagered and winnings
    const wagerResult = await query(
      'SELECT COALESCE(SUM(total_wagered), 0) as total_wagered, COALESCE(SUM(total_won), 0) as total_won FROM player_stats'
    );
    const totalWagered = parseFloat(wagerResult.rows[0]?.total_wagered || '0');
    const totalWon = parseFloat(wagerResult.rows[0]?.total_won || '0');

    // Average player value
    const avgPlayerValueResult = await query(
      'SELECT COALESCE(AVG(gc_balance + sc_balance), 0) as avg_balance FROM players'
    );
    const averagePlayerValue = parseFloat(avgPlayerValueResult.rows[0]?.avg_balance || '0');

    // Games played today
    const gamesPlayedResult = await query(
      'SELECT COUNT(*) as games FROM slots_results WHERE DATE(created_at) = CURRENT_DATE'
    );
    const gamesToday = parseInt(gamesPlayedResult.rows[0]?.games || '0');

    // New players today
    const newPlayersResult = await query(
      'SELECT COUNT(*) as new_players FROM players WHERE DATE(created_at) = CURRENT_DATE'
    );
    const newPlayersToday = parseInt(newPlayersResult.rows[0]?.new_players || '0');

    // Pending KYC
    const pendingKycResult = await query(
      'SELECT COUNT(*) as pending FROM kyc_documents WHERE status = $1',
      ['pending']
    );
    const pendingKyc = parseInt(pendingKycResult.rows[0]?.pending || '0');

    // Pending withdrawals
    const pendingWithdrawalsResult = await query(
      'SELECT COUNT(*) as pending, COALESCE(SUM(amount), 0) as amount FROM redemption_requests WHERE status = $1',
      ['pending']
    );
    const pendingWithdrawals = parseInt(pendingWithdrawalsResult.rows[0]?.pending || '0');
    const pendingWithdrawalAmount = parseFloat(pendingWithdrawalsResult.rows[0]?.amount || '0');

    // Open support tickets
    const openTicketsResult = await query(
      'SELECT COUNT(*) as open_tickets FROM support_tickets WHERE status = $1',
      ['open']
    );
    const openTickets = parseInt(openTicketsResult.rows[0]?.open_tickets || '0');

    // Active security alerts
    const alertsResult = await query(
      'SELECT COUNT(*) as alerts FROM security_alerts WHERE status = $1',
      ['pending']
    );
    const activeAlerts = parseInt(alertsResult.rows[0]?.alerts || '0');

    res.json({
      totalPlayers,
      activePlayers,
      totalRevenue,
      totalWagered,
      totalWon,
      averagePlayerValue,
      gamesToday,
      newPlayersToday,
      pendingKyc,
      pendingWithdrawals,
      pendingWithdrawalAmount,
      openTickets,
      activeAlerts,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

export const getDailyMetrics: RequestHandler = async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    
    const metricsResult = await query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT CASE WHEN event_type = 'deposit' THEN player_id END) as deposits,
        COUNT(DISTINCT CASE WHEN event_type = 'withdrawal' THEN player_id END) as withdrawals,
        COUNT(DISTINCT player_id) as active_users,
        COALESCE(SUM(CASE WHEN event_type = 'deposit' THEN CAST(event_data->>'amount' AS DECIMAL) ELSE 0 END), 0) as deposit_volume
      FROM analytics_events
      WHERE created_at > NOW() - INTERVAL '1 day' * $1
      GROUP BY DATE(created_at)
      ORDER BY date DESC`,
      [days]
    );

    res.json(metricsResult.rows);
  } catch (error) {
    console.error('Daily metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch daily metrics' });
  }
};

export const getSystemHealth: RequestHandler = async (req, res) => {
  try {
    const dbConnectionResult = await query('SELECT 1');
    const dbStatus = dbConnectionResult.rows.length > 0 ? 'healthy' : 'unhealthy';

    const performanceResult = await query(
      'SELECT AVG(response_time_ms) as avg_response_time FROM api_usage WHERE created_at > NOW() - INTERVAL \'1 hour\''
    );
    const avgResponseTime = parseFloat(performanceResult.rows[0]?.avg_response_time || '0');

    const errorsResult = await query(
      'SELECT COUNT(*) as errors FROM api_usage WHERE response_code >= 500 AND created_at > NOW() - INTERVAL \'1 hour\''
    );
    const recentErrors = parseInt(errorsResult.rows[0]?.errors || '0');

    res.json({
      databaseStatus: dbStatus,
      averageResponseTime: avgResponseTime,
      recentErrors,
      timestamp: new Date().toISOString(),
      status: dbStatus === 'healthy' && recentErrors < 10 ? 'healthy' : 'degraded',
    });
  } catch (error) {
    console.error('System health error:', error);
    res.status(500).json({ error: 'Failed to fetch system health' });
  }
};

export const getRevenueAnalytics: RequestHandler = async (req, res) => {
  try {
    const timeframe = (req.query.timeframe as string) || 'month';
    let dateFilter = "DATE(created_at) >= CURRENT_DATE - INTERVAL '30 days'";
    
    if (timeframe === 'week') {
      dateFilter = "DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (timeframe === 'year') {
      dateFilter = "DATE(created_at) >= CURRENT_DATE - INTERVAL '365 days'";
    }

    const revenueResult = await query(
      `SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(amount_usd), 0) as revenue,
        COUNT(*) as transactions,
        COUNT(DISTINCT player_id) as unique_players
      FROM purchases
      WHERE status = 'Completed' AND ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date DESC`
    );

    const totalResult = await query(
      `SELECT 
        COALESCE(SUM(amount_usd), 0) as total_revenue,
        COUNT(*) as total_transactions,
        COUNT(DISTINCT player_id) as total_unique_players,
        AVG(amount_usd) as avg_transaction_value
      FROM purchases
      WHERE status = 'Completed' AND ${dateFilter}`
    );

    res.json({
      daily: revenueResult.rows,
      summary: {
        totalRevenue: parseFloat(totalResult.rows[0]?.total_revenue || '0'),
        totalTransactions: parseInt(totalResult.rows[0]?.total_transactions || '0'),
        totalUniquePlayers: parseInt(totalResult.rows[0]?.total_unique_players || '0'),
        avgTransactionValue: parseFloat(totalResult.rows[0]?.avg_transaction_value || '0'),
      },
    });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
};

export const getPlayerDemographics: RequestHandler = async (req, res) => {
  try {
    // By country
    const byCountryResult = await query(
      'SELECT country, COUNT(*) as count FROM players WHERE country IS NOT NULL GROUP BY country ORDER BY count DESC LIMIT 20'
    );

    // By signup date
    const bySignupResult = await query(
      `SELECT DATE(created_at) as date, COUNT(*) as count FROM players GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30`
    );

    // By status
    const byStatusResult = await query(
      'SELECT status, COUNT(*) as count FROM players GROUP BY status'
    );

    // By KYC level
    const byKycResult = await query(
      'SELECT kyc_level, COUNT(*) as count FROM players GROUP BY kyc_level'
    );

    res.json({
      byCountry: byCountryResult.rows,
      bySignupDate: bySignupResult.rows,
      byStatus: byStatusResult.rows,
      byKycLevel: byKycResult.rows,
    });
  } catch (error) {
    console.error('Player demographics error:', error);
    res.status(500).json({ error: 'Failed to fetch player demographics' });
  }
};
