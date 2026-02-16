import { RequestHandler } from 'express';
import { gameAggregationService } from '../services/game-aggregation-service';
import { query } from '../db/connection';

// Get all available providers
export const getProviders: RequestHandler = async (req, res) => {
  try {
    const providers = gameAggregationService.getProviders();
    res.json({
      success: true,
      data: providers,
      count: providers.length
    });
  } catch (error) {
    console.error('[GameAgg] Get providers error:', error);
    res.status(500).json({ error: 'Failed to fetch providers', details: (error as Error).message });
  }
};

// Sync games from a specific provider
export const syncProvider: RequestHandler = async (req, res) => {
  try {
    const { providerId, forceRefresh } = req.body;

    if (!providerId) {
      return res.status(400).json({ error: 'providerId is required' });
    }

    console.log(`[GameAgg] Starting sync for provider: ${providerId}`);
    const result = await gameAggregationService.syncProviderGames(providerId, forceRefresh);

    // Log the sync action
    await query(
      `INSERT INTO system_logs (admin_id, action, details, status)
       VALUES ($1, $2, $3, $4)`,
      [
        req.user?.id || null,
        `GameAggregation: Synced ${providerId}`,
        JSON.stringify(result),
        'success'
      ]
    );

    res.json({
      success: true,
      message: `Synced games from ${providerId}`,
      data: result
    });
  } catch (error) {
    console.error('[GameAgg] Sync error:', error);
    res.status(500).json({ error: 'Failed to sync provider', details: (error as Error).message });
  }
};

// Sync all enabled providers
export const syncAllProviders: RequestHandler = async (req, res) => {
  try {
    const providers = gameAggregationService.getEnabledProviders();
    const results: Record<string, any> = {};
    let totalImported = 0;
    let totalUpdated = 0;

    for (const provider of providers) {
      try {
        const result = await gameAggregationService.syncProviderGames(provider.id);
        results[provider.id] = result;
        totalImported += result.imported;
        totalUpdated += result.updated;
      } catch (err) {
        results[provider.id] = { success: false, error: (err as Error).message };
      }
    }

    // Log the action
    await query(
      `INSERT INTO system_logs (admin_id, action, details, status)
       VALUES ($1, $2, $3, $4)`,
      [
        req.user?.id || null,
        'GameAggregation: Synced all providers',
        JSON.stringify({ providersCount: providers.length, results }),
        'success'
      ]
    );

    res.json({
      success: true,
      message: `Synced ${providers.length} providers`,
      data: {
        providersCount: providers.length,
        totalImported,
        totalUpdated,
        results
      }
    });
  } catch (error) {
    console.error('[GameAgg] Sync all error:', error);
    res.status(500).json({ error: 'Failed to sync providers', details: (error as Error).message });
  }
};

// Get aggregation statistics
export const getStats: RequestHandler = async (req, res) => {
  try {
    const stats = await gameAggregationService.getAggregationStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[GameAgg] Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats', details: (error as Error).message });
  }
};

// Bulk import games from JSON
export const bulkImportGames: RequestHandler = async (req, res) => {
  try {
    const { games } = req.body;

    if (!Array.isArray(games) || games.length === 0) {
      return res.status(400).json({ error: 'games array is required and must not be empty' });
    }

    const result = await gameAggregationService.bulkImportGames(games);

    // Log the action
    await query(
      `INSERT INTO system_logs (admin_id, action, details, status)
       VALUES ($1, $2, $3, $4)`,
      [
        req.user?.id || null,
        'GameAggregation: Bulk imported games',
        JSON.stringify({ imported: result.imported, updated: result.updated, errorCount: result.errors.length }),
        result.success ? 'success' : 'partial'
      ]
    );

    res.json({
      success: result.success,
      data: result,
      message: `Imported ${result.imported} new games, updated ${result.updated} games`
    });
  } catch (error) {
    console.error('[GameAgg] Bulk import error:', error);
    res.status(500).json({ error: 'Failed to bulk import games', details: (error as Error).message });
  }
};

// Export games to JSON
export const exportGames: RequestHandler = async (req, res) => {
  try {
    const { provider, category } = req.query;

    const games = await gameAggregationService.exportGames({
      provider: provider as string,
      category: category as string
    });

    // Return as downloadable JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="games-export-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(games);
  } catch (error) {
    console.error('[GameAgg] Export error:', error);
    res.status(500).json({ error: 'Failed to export games', details: (error as Error).message });
  }
};

// Get games by provider
export const getGamesByProvider: RequestHandler = async (req, res) => {
  try {
    const { provider } = req.params;

    const result = await query(
      'SELECT * FROM games WHERE provider = $1 AND enabled = true ORDER BY name',
      [provider]
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      provider
    });
  } catch (error) {
    console.error('[GameAgg] Get games by provider error:', error);
    res.status(500).json({ error: 'Failed to fetch games', details: (error as Error).message });
  }
};

// Delete games from provider
export const deleteProviderGames: RequestHandler = async (req, res) => {
  try {
    const { provider } = req.params;

    if (!provider) {
      return res.status(400).json({ error: 'provider is required' });
    }

    const result = await query(
      'UPDATE games SET enabled = false WHERE provider = $1',
      [provider]
    );

    // Log the action
    await query(
      `INSERT INTO system_logs (admin_id, action, details, status)
       VALUES ($1, $2, $3, $4)`,
      [
        req.user?.id || null,
        `GameAggregation: Deleted games from ${provider}`,
        JSON.stringify({ rowsAffected: result.rowCount }),
        'success'
      ]
    );

    res.json({
      success: true,
      message: `Deleted ${result.rowCount} games from ${provider}`,
      rowsAffected: result.rowCount
    });
  } catch (error) {
    console.error('[GameAgg] Delete provider games error:', error);
    res.status(500).json({ error: 'Failed to delete games', details: (error as Error).message });
  }
};
