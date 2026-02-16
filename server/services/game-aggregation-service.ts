import axios from 'axios';
import { query } from '../db/connection';

export interface GameProvider {
  id: string;
  name: string;
  description: string;
  apiUrl: string;
  apiKey?: string;
  enabled: boolean;
  type: 'slots' | 'table' | 'live' | 'all';
}

export interface AggregatedGame {
  provider_id: string;
  provider_name: string;
  external_id: string;
  name: string;
  description: string;
  category: 'Slots' | 'Table' | 'Live' | 'Other';
  rtp: number;
  volatility: 'Low' | 'Medium' | 'High';
  image_url: string;
  release_date?: string;
  provider_rating?: number;
  max_bet?: number;
  min_bet?: number;
  features: string[];
  themes: string[];
  enabled: boolean;
}

class GameAggregationService {
  // Provider configurations
  private providers: Map<string, GameProvider> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Pragmatic Play
    this.providers.set('pragmatic', {
      id: 'pragmatic',
      name: 'Pragmatic Play',
      description: 'Leading provider with 200+ games',
      apiUrl: 'https://api.pragmaticplay.com',
      apiKey: process.env.PRAGMATIC_API_KEY,
      enabled: true,
      type: 'all'
    });

    // NetEnt
    this.providers.set('netent', {
      id: 'netent',
      name: 'NetEnt',
      description: 'Premium games with stunning graphics',
      apiUrl: 'https://api.netent.com',
      apiKey: process.env.NETENT_API_KEY,
      enabled: true,
      type: 'all'
    });

    // Microgaming
    this.providers.set('microgaming', {
      id: 'microgaming',
      name: 'Microgaming',
      description: 'Iconic games and exclusive titles',
      apiUrl: 'https://api.microgaming.co.uk',
      apiKey: process.env.MICROGAMING_API_KEY,
      enabled: true,
      type: 'all'
    });

    // Play'n GO
    this.providers.set('playngo', {
      id: 'playngo',
      name: 'Play\'n GO',
      description: 'Mobile-first game developer',
      apiUrl: 'https://api.playngo.com',
      apiKey: process.env.PLAYNGO_API_KEY,
      enabled: true,
      type: 'slots'
    });

    // iSoftBet
    this.providers.set('isoftbet', {
      id: 'isoftbet',
      name: 'iSoftBet',
      description: 'Diverse game portfolio',
      apiUrl: 'https://api.isoftbet.com',
      apiKey: process.env.ISOFTBET_API_KEY,
      enabled: true,
      type: 'all'
    });

    // Yggdrasil
    this.providers.set('yggdrasil', {
      id: 'yggdrasil',
      name: 'Yggdrasil Gaming',
      description: 'Innovative gaming experiences',
      apiUrl: 'https://api.yggdrasil.com',
      apiKey: process.env.YGGDRASIL_API_KEY,
      enabled: true,
      type: 'slots'
    });
  }

  // Get all available providers
  getProviders(): GameProvider[] {
    return Array.from(this.providers.values());
  }

  // Get enabled providers
  getEnabledProviders(): GameProvider[] {
    return this.getProviders().filter(p => p.enabled);
  }

  // Sync games from a specific provider
  async syncProviderGames(providerId: string, forceRefresh: boolean = false): Promise<{
    success: boolean;
    imported: number;
    updated: number;
    errors: string[];
  }> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const errors: string[] = [];
    let imported = 0;
    let updated = 0;

    try {
      console.log(`[GameAgg] Syncing games from ${provider.name}...`);

      // Fetch games from provider API
      const games = await this.fetchGamesFromProvider(provider);
      console.log(`[GameAgg] Fetched ${games.length} games from ${provider.name}`);

      // Process and store games
      for (const game of games) {
        try {
          // Check if game already exists
          const existingResult = await query(
            'SELECT id FROM games WHERE external_id = $1 AND provider = $2',
            [game.external_id, provider.name]
          );

          if (existingResult.rows.length > 0) {
            // Update existing game
            await query(
              `UPDATE games SET 
               name = $1, description = $2, rtp = $3, volatility = $4,
               image_url = $5, updated_at = NOW()
               WHERE external_id = $6 AND provider = $7`,
              [game.name, game.description, game.rtp, game.volatility,
               game.image_url, game.external_id, provider.name]
            );
            updated++;
          } else {
            // Insert new game
            await query(
              `INSERT INTO games (name, description, category, provider, rtp, volatility, 
               image_url, external_id, enabled, features, themes)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              [game.name, game.description, game.category, provider.name, game.rtp,
               game.volatility, game.image_url, game.external_id, true,
               JSON.stringify(game.features), JSON.stringify(game.themes)]
            );
            imported++;
          }
        } catch (err) {
          errors.push(`Failed to process ${game.name}: ${(err as Error).message}`);
        }
      }

      console.log(`[GameAgg] Sync complete for ${provider.name}: ${imported} imported, ${updated} updated`);
      return { success: true, imported, updated, errors };
    } catch (error) {
      const errorMsg = (error as Error).message;
      console.error(`[GameAgg] Failed to sync ${provider.name}:`, errorMsg);
      throw error;
    }
  }

  // Fetch games from provider (placeholder - can be customized per provider)
  private async fetchGamesFromProvider(provider: GameProvider): Promise<AggregatedGame[]> {
    try {
      // In production, this would call the actual provider API
      // For now, returning mock data based on provider
      
      if (!provider.apiKey && provider.id !== 'pragmatic') {
        // Demo mode - return sample games
        return this.getMockGamesForProvider(provider);
      }

      // Try to call the actual API
      const response = await axios.get(`${provider.apiUrl}/games`, {
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      return this.parseProviderResponse(provider, response.data);
    } catch (error) {
      console.warn(`[GameAgg] Failed to fetch from ${provider.name} API, using mock data:`, (error as Error).message);
      return this.getMockGamesForProvider(provider);
    }
  }

  // Parse provider-specific API response
  private parseProviderResponse(provider: GameProvider, data: any): AggregatedGame[] {
    // This would be customized per provider
    // Placeholder implementation
    if (Array.isArray(data)) {
      return data.map(game => ({
        provider_id: provider.id,
        provider_name: provider.name,
        external_id: game.id || game.gameId,
        name: game.name || game.title,
        description: game.description || '',
        category: this.mapCategory(game.type || 'Slots'),
        rtp: parseFloat(game.rtp) || 95,
        volatility: this.mapVolatility(game.volatility || 'medium'),
        image_url: game.image || game.thumbnail || '',
        release_date: game.releaseDate,
        provider_rating: game.rating,
        max_bet: game.maxBet,
        min_bet: game.minBet,
        features: Array.isArray(game.features) ? game.features : [],
        themes: Array.isArray(game.themes) ? game.themes : [],
        enabled: true
      }));
    }
    return [];
  }

  // Generate mock games for testing/demo
  private getMockGamesForProvider(provider: GameProvider): AggregatedGame[] {
    const mockGames: AggregatedGame[] = [
      {
        provider_id: provider.id,
        provider_name: provider.name,
        external_id: `${provider.id}_game_1`,
        name: `${provider.name} Slots Classic`,
        description: `Classic slot experience from ${provider.name}`,
        category: 'Slots',
        rtp: 96.5,
        volatility: 'Medium',
        image_url: 'https://via.placeholder.com/300x200?text=' + provider.name,
        release_date: new Date().toISOString().split('T')[0],
        provider_rating: 4.5,
        max_bet: 100,
        min_bet: 0.01,
        features: ['Free Spins', 'Wild Symbol', 'Bonus Game'],
        themes: ['Classic', 'Fruit'],
        enabled: true
      },
      {
        provider_id: provider.id,
        provider_name: provider.name,
        external_id: `${provider.id}_game_2`,
        name: `${provider.name} Mega Win`,
        description: `High volatility game with massive potential wins`,
        category: 'Slots',
        rtp: 95.8,
        volatility: 'High',
        image_url: 'https://via.placeholder.com/300x200?text=' + provider.name + '+Mega',
        release_date: new Date().toISOString().split('T')[0],
        provider_rating: 4.8,
        max_bet: 500,
        min_bet: 0.05,
        features: ['Mega Jackpot', 'Multipliers', 'Scatter Pays'],
        themes: ['Adventure', 'Treasure'],
        enabled: true
      }
    ];
    return mockGames;
  }

  // Map category names
  private mapCategory(type: string): 'Slots' | 'Table' | 'Live' | 'Other' {
    const normalized = type.toLowerCase();
    if (normalized.includes('slot')) return 'Slots';
    if (normalized.includes('table')) return 'Table';
    if (normalized.includes('live')) return 'Live';
    return 'Other';
  }

  // Map volatility
  private mapVolatility(vol: string): 'Low' | 'Medium' | 'High' {
    const normalized = vol.toLowerCase();
    if (normalized.includes('low')) return 'Low';
    if (normalized.includes('high')) return 'High';
    return 'Medium';
  }

  // Get aggregated game stats
  async getAggregationStats(): Promise<{
    totalGames: number;
    gamesByProvider: Record<string, number>;
    lastSyncTime: string | null;
  }> {
    const gamesResult = await query('SELECT COUNT(*) as count FROM games');
    const totalGames = parseInt(gamesResult.rows[0]?.count || '0');

    const byProviderResult = await query(
      'SELECT provider, COUNT(*) as count FROM games GROUP BY provider'
    );
    const gamesByProvider: Record<string, number> = {};
    byProviderResult.rows.forEach(row => {
      gamesByProvider[row.provider] = parseInt(row.count);
    });

    // Get last sync time from system logs
    const lastSyncResult = await query(
      `SELECT created_at FROM system_logs 
       WHERE action LIKE '%game%sync%' OR action LIKE '%GameAgg%'
       ORDER BY created_at DESC LIMIT 1`
    );
    const lastSyncTime = lastSyncResult.rows[0]?.created_at || null;

    return { totalGames, gamesByProvider, lastSyncTime };
  }

  // Bulk import games from JSON
  async bulkImportGames(gamesData: AggregatedGame[]): Promise<{
    success: boolean;
    imported: number;
    updated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let imported = 0;
    let updated = 0;

    for (const game of gamesData) {
      try {
        const existingResult = await query(
          'SELECT id FROM games WHERE external_id = $1 AND provider = $2',
          [game.external_id, game.provider_name]
        );

        if (existingResult.rows.length > 0) {
          await query(
            `UPDATE games SET 
             name = $1, description = $2, rtp = $3, volatility = $4,
             image_url = $5, features = $6, updated_at = NOW()
             WHERE external_id = $7 AND provider = $8`,
            [game.name, game.description, game.rtp, game.volatility,
             game.image_url, JSON.stringify(game.features), game.external_id, game.provider_name]
          );
          updated++;
        } else {
          await query(
            `INSERT INTO games (name, description, category, provider, rtp, volatility,
             image_url, external_id, enabled, features, themes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [game.name, game.description, game.category, game.provider_name, game.rtp,
             game.volatility, game.image_url, game.external_id, true,
             JSON.stringify(game.features), JSON.stringify(game.themes)]
          );
          imported++;
        }
      } catch (err) {
        errors.push(`Failed to import ${game.name}: ${(err as Error).message}`);
      }
    }

    return { success: errors.length === 0, imported, updated, errors };
  }

  // Export games to JSON
  async exportGames(filters?: {
    provider?: string;
    category?: string;
  }): Promise<AggregatedGame[]> {
    let query_str = 'SELECT * FROM games WHERE enabled = true';
    const params: any[] = [];

    if (filters?.provider) {
      query_str += ` AND provider = $${params.length + 1}`;
      params.push(filters.provider);
    }
    if (filters?.category) {
      query_str += ` AND category = $${params.length + 1}`;
      params.push(filters.category);
    }

    const result = await query(query_str, params);
    return result.rows.map(row => ({
      provider_id: '',
      provider_name: row.provider,
      external_id: row.external_id,
      name: row.name,
      description: row.description,
      category: row.category,
      rtp: row.rtp,
      volatility: row.volatility,
      image_url: row.image_url,
      features: JSON.parse(row.features || '[]'),
      themes: JSON.parse(row.themes || '[]'),
      enabled: row.enabled
    }));
  }
}

export const gameAggregationService = new GameAggregationService();
