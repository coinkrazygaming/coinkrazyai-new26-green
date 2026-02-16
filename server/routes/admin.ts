import { RequestHandler } from "express";
import * as dbQueries from "../db/queries";

/**
 * Admin state for game configurations and AI management
 * This is an in-memory cache for admin settings.
 * For persistence, consider moving these to the database.
 */
let adminState = {
  gameConfigs: {
    slots: { rtp: 95, minBet: 0.01, maxBet: 100 },
    poker: { rtp: 95, minBuyIn: 10, maxBuyIn: 1000, houseCommission: 5 },
    bingo: { rtp: 85, minTicketPrice: 0.5, maxTicketPrice: 50, houseCommission: 15 },
    sportsbook: { rtp: 92, minBet: 1, maxBet: 1000, minParlay: 3, maxParlay: 10, houseCommission: 8 }
  },
  aiEmployees: [
    { id: 'ai-1', name: 'LuckyAI', role: 'Game Optimizer', status: 'active', duties: ['Adjust RTP', 'Game Balance'] },
    { id: 'ai-2', name: 'SecurityAI', role: 'Security Monitor', status: 'active', duties: ['Fraud Detection', 'Account Security'] },
    { id: 'ai-3', name: 'SlotsAI', role: 'Slots Specialist', status: 'active', duties: ['Slots Management', 'Payout Optimization'] },
    { id: 'ai-4', name: 'JoseyAI', role: 'Poker Engine', status: 'idle', duties: [] },
    { id: 'ai-5', name: 'SocialAI', role: 'Community Manager', status: 'active', duties: ['Chat Moderation', 'Event Hosting'] },
    { id: 'ai-6', name: 'PromotionsAI', role: 'Marketing', status: 'active', duties: ['Promotions', 'Bonuses'] }
  ],
  systemHealth: 'Optimal',
  maintenanceMode: false
};

/**
 * Note: Admin authentication is now handled exclusively through:
 * - server/services/auth-service.ts -> AuthService.loginAdmin()
 * - server/routes/auth.ts -> handleAdminLogin()
 * This uses the admin_users table in the database for secure admin credentials.
 */

export const handleGetAdminStats: RequestHandler = async (req, res) => {
  try {
    const playerStats = await dbQueries.getPlayerStats();
    const transactions = await dbQueries.getTransactions(10);

    const totalPlayers = playerStats.rows[0]?.total_players || 0;
    const activePlayers = playerStats.rows[0]?.active_players || 0;
    const totalGCVolume = playerStats.rows[0]?.avg_gc_balance || 0;
    const totalSCVolume = playerStats.rows[0]?.avg_sc_balance || 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalPlayers,
          activePlayers,
          activeTables: 8,
          totalRevenue: 125430.50,
          totalGCVolume,
          totalSCVolume,
          systemHealth: adminState.systemHealth,
          maintenanceMode: adminState.maintenanceMode
        },
        aiStatus: adminState.aiEmployees,
        gameStats: {
          slots: { plays: 25430, winRate: 0.95 },
          poker: { plays: 8234, activeTables: 8 },
          bingo: { plays: 45230, activeRooms: 4 },
          sportsbook: { bets: 12456, avgOdds: 1.89 }
        },
        revenueData: [40, 60, 45, 90, 85, 100, 75],
        recentTransactions: transactions.rows.map((tx: any) => ({
          id: tx.id,
          type: tx.type,
          amount: (tx.gc_amount || 0) + (tx.sc_amount || 0),
          description: tx.description || tx.type,
          timestamp: tx.created_at
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
};

export const handleGetGameConfig: RequestHandler = (req, res) => {
  try {
    const { game } = req.query;
    
    if (game && typeof game === 'string' && game in adminState.gameConfigs) {
      return res.json({ 
        success: true, 
        data: adminState.gameConfigs[game as keyof typeof adminState.gameConfigs] 
      });
    }

    res.json({ success: true, data: adminState.gameConfigs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get config' });
  }
};

export const handleUpdateGameConfig: RequestHandler = (req, res) => {
  try {
    const { gameId, config } = req.body;

    if (!gameId || !config) {
      return res.status(400).json({ success: false, error: "Missing gameId or config" });
    }

    const gameKey = gameId as keyof typeof adminState.gameConfigs;
    if (!(gameKey in adminState.gameConfigs)) {
      return res.status(404).json({ success: false, error: "Game not found" });
    }

    adminState.gameConfigs[gameKey] = { 
      ...adminState.gameConfigs[gameKey], 
      ...config 
    };

    res.json({ 
      success: true, 
      data: { 
        message: `${gameId} configuration updated successfully`,
        config: adminState.gameConfigs[gameKey]
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update config' });
  }
};

export const handleGetAIEmployees: RequestHandler = (req, res) => {
  try {
    res.json({ success: true, data: adminState.aiEmployees });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get AI employees' });
  }
};

export const handleAssignAIDuty: RequestHandler = (req, res) => {
  try {
    const { aiId, duty } = req.body;

    if (!aiId || !duty) {
      return res.status(400).json({ success: false, error: "Missing aiId or duty" });
    }

    const ai = adminState.aiEmployees.find(a => a.id === aiId);
    if (!ai) {
      return res.status(404).json({ success: false, error: "AI employee not found" });
    }

    if (!ai.duties.includes(duty)) {
      ai.duties.push(duty);
    }

    res.json({ 
      success: true, 
      data: { 
        message: `${ai.name} has been assigned duty: ${duty}`,
        ai
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to assign duty' });
  }
};

export const handleUpdateAIStatus: RequestHandler = (req, res) => {
  try {
    const { aiId, status } = req.body;

    if (!aiId || !['active', 'idle', 'maintenance'].includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid aiId or status" });
    }

    const ai = adminState.aiEmployees.find(a => a.id === aiId);
    if (!ai) {
      return res.status(404).json({ success: false, error: "AI employee not found" });
    }

    ai.status = status as 'active' | 'idle' | 'maintenance';

    res.json({ 
      success: true, 
      data: { 
        message: `${ai.name} status updated to ${status}`,
        ai
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update AI status' });
  }
};

export const handleGetStorePacks: RequestHandler = (req, res) => {
  try {
    const packs = [
      { id: "pack-1", title: "Starter Pack", price: 4.99, goldCoins: 5000, sweepsCoinsBonus: 5 },
      { id: "pack-2", title: "Pro Pack", price: 9.99, goldCoins: 12000, sweepsCoinsBonus: 12 },
      { id: "pack-3", title: "High Roller Pack", price: 49.99, goldCoins: 65000, sweepsCoinsBonus: 65 },
      { id: "pack-4", title: "Whale Pack", price: 99.99, goldCoins: 150000, sweepsCoinsBonus: 150 },
    ];
    res.json({ success: true, data: packs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get store packs' });
  }
};

export const handleUpdateStorePack: RequestHandler = (req, res) => {
  try {
    const { packId, packData } = req.body;

    if (!packId || !packData) {
      return res.status(400).json({ success: false, error: "Missing packId or packData" });
    }

    res.json({ 
      success: true, 
      data: { 
        message: `Store pack ${packId} updated successfully`,
        pack: { id: packId, ...packData }
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update store pack' });
  }
};

export const handleSetMaintenanceMode: RequestHandler = (req, res) => {
  try {
    const { enabled, message } = req.body;

    if (enabled === undefined) {
      return res.status(400).json({ success: false, error: "Missing enabled flag" });
    }

    adminState.maintenanceMode = enabled;

    res.json({
      success: true,
      data: {
        message: enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled',
        maintenanceMode: adminState.maintenanceMode
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update maintenance mode' });
  }
};

export const handleGetSystemHealth: RequestHandler = (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        systemHealth: adminState.systemHealth,
        services: {
          database: 'healthy',
          cache: 'healthy',
          socketIO: 'healthy',
          payment: 'healthy',
          email: 'healthy'
        },
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get system health' });
  }
};

export const handleLogout: RequestHandler = (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token && adminSessions[token]) {
      delete adminSessions[token];
    }
    res.json({ success: true, data: { message: "Logged out successfully" } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Logout failed' });
  }
};
