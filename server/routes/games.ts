import { RequestHandler } from "express";
import * as db from "../db/queries";

// Mock games data for fallback when database is unavailable
const mockGames = [
  {
    id: 1,
    name: "Mega Spin Slots",
    type: "slots",
    category: "Slots",
    provider: "Internal",
    rtp: 96.5,
    volatility: "Medium",
    enabled: true,
    active_users: 42,
    description: "Classic slots with huge winning potential"
  },
  {
    id: 2,
    name: "Diamond Poker Pro",
    type: "poker",
    category: "Poker",
    provider: "Internal",
    rtp: 98.2,
    volatility: "Low",
    enabled: true,
    active_users: 28,
    description: "Professional poker tables with varying stakes"
  },
  {
    id: 3,
    name: "Bingo Bonanza",
    type: "bingo",
    category: "Bingo",
    provider: "Internal",
    rtp: 94.8,
    volatility: "High",
    enabled: true,
    active_users: 56,
    description: "High-energy bingo games with big prizes"
  },
  {
    id: 4,
    name: "Live Sports",
    type: "sportsbook",
    category: "Sportsbook",
    provider: "Internal",
    rtp: 97.0,
    volatility: "Medium",
    enabled: true,
    active_users: 89,
    description: "Bet on live sports events worldwide"
  }
];

// DEBUG: Get ALL games in DB
export const handleDebugGetGames: RequestHandler = async (req, res) => {
  try {
    const result = await db.getGames();
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// Get all enabled games
export const handleGetGames: RequestHandler = async (req, res) => {
  try {
    const result = await db.getGames();
    const allGamesFromDb = result.rows;
    console.log(`[Games] DB has ${allGamesFromDb.length} total games:`, allGamesFromDb.map(g => ({ name: g.name, category: g.category, enabled: g.enabled })));

    // Filter to only enabled games and ensure they have a 'type' field for the frontend
    const enabledGames = result.rows
      .filter(game => game.enabled !== false)
      .map(game => {
        const type = game.type || (game.category ? game.category.toLowerCase() : 'other');
        return {
          ...game,
          type: type
        };
      });

    console.log(`[Games] Returning ${enabledGames.length} enabled games. Games:`, enabledGames.map(g => ({ name: g.name, type: g.type, enabled: g.enabled })));

    res.json({
      success: true,
      data: enabledGames,
      count: enabledGames.length
    });
  } catch (error) {
    console.error("[Games] Error fetching games:", error);
    // Return mock data as fallback when database is unavailable
    console.log("[Games] Using mock data fallback due to database unavailability");
    res.json({
      success: true,
      data: mockGames,
      count: mockGames.length,
      _note: "Using fallback mock data - database unavailable"
    });
  }
};

// Get single game by ID
export const handleGetGameById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const gameId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id);

    const result = await db.getGameById(gameId);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Game not found"
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error("[Games] Error fetching game:", error);
    // Try to find game in mock data as fallback
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const game = mockGames.find(g => g.id === parseInt(idParam));
    if (game) {
      console.log("[Games] Using mock data fallback for game:", idParam);
      return res.json({
        success: true,
        data: game,
        _note: "Using fallback mock data - database unavailable"
      });
    }
    res.status(404).json({
      success: false,
      error: "Game not found"
    });
  }
};
