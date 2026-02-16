import { RequestHandler } from 'express';
import axios from 'axios';
import { query } from '../db/connection';
import { S3Service } from '../services/s3-service';
import { SlackService } from '../services/slack-service';

// GAME LIBRARY
export const listGames: RequestHandler = async (req, res) => {
  try {
    const category = (req.query.category as string) || '';
    const params: any[] = [true]; // enabled = true
    let whereClause = 'WHERE enabled = $1';

    if (category) {
      params.push(category);
      whereClause += ` AND category = $${params.length}`;
    }

    const result = await query(`SELECT * FROM games ${whereClause} ORDER BY name`, params);
    res.json(result.rows);
  } catch (error) {
    console.error('List games error:', error);
    res.status(500).json({ error: 'Failed to fetch games', details: (error as Error).message });
  }
};

export const createGame: RequestHandler = async (req, res) => {
  try {
    const { name, category, provider, rtp, volatility, description, image_url, imageUrl, enabled } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Game name is required' });
    }
    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }
    if (!image_url && !imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Use provided values or sensible defaults
    const finalImageUrl = image_url || imageUrl;
    const finalRtp = rtp !== undefined ? parseFloat(String(rtp)) : 95.0;
    const finalVolatility = volatility || 'Medium';
    const finalProvider = provider || 'Internal';
    const finalDescription = description || `${name} - ${category}`;
    const finalEnabled = enabled !== false;

    // Validate RTP is within reasonable bounds
    if (isNaN(finalRtp) || finalRtp < 70 || finalRtp > 98) {
      return res.status(400).json({ error: 'RTP must be between 70 and 98' });
    }

    const result = await query(
      `INSERT INTO games (name, category, provider, rtp, volatility, description, image_url, enabled)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, category, finalProvider, finalRtp, finalVolatility, finalDescription, finalImageUrl, finalEnabled]
    );

    await SlackService.notifyAdminAction(req.user?.email || 'admin', 'Created game', `${name} - ${category}`);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ error: 'Failed to create game', details: (error as Error).message });
  }
};

export const updateGame: RequestHandler = async (req, res) => {
  try {
    const { gameId } = req.params;
    const updates = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update provided' });
    }

    // Whitelist allowed fields to prevent injection
    const allowedFields = ['name', 'category', 'rtp', 'volatility', 'description', 'image_url', 'enabled'];
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    // Handle both camelCase and snake_case for image_url
    const dataWithSnakeCase: any = {};
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'imageUrl') {
        dataWithSnakeCase['image_url'] = value;
      } else {
        dataWithSnakeCase[key] = value;
      }
    }

    for (const field of allowedFields) {
      if (field in dataWithSnakeCase) {
        updateFields.push(`${field} = $${paramIndex}`);
        updateValues.push(dataWithSnakeCase[field]);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update provided' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(gameId);

    const sql = `UPDATE games SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await query(sql, updateValues);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({ error: 'Failed to update game' });
  }
};

export const deleteGame: RequestHandler = async (req, res) => {
  try {
    const { gameId } = req.params;
    const result = await query('UPDATE games SET enabled = false WHERE id = $1 RETURNING id', [gameId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({ error: 'Failed to delete game' });
  }
};

// POKER MANAGEMENT
export const listPokerTables: RequestHandler = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM poker_tables ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('List poker tables error:', error);
    res.status(500).json({ error: 'Failed to fetch poker tables' });
  }
};

export const createPokerTable: RequestHandler = async (req, res) => {
  try {
    const { name, stakes, maxPlayers, buyInMin, buyInMax } = req.body;

    const result = await query(
      `INSERT INTO poker_tables (name, stakes, max_players, buy_in_min, buy_in_max) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, stakes, maxPlayers, buyInMin, buyInMax]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create poker table error:', error);
    res.status(500).json({ error: 'Failed to create poker table' });
  }
};

export const updatePokerTable: RequestHandler = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { name, stakes, maxPlayers, buyInMin, buyInMax, active } = req.body;

    const result = await query(
      `UPDATE poker_tables SET name = $1, stakes = $2, max_players = $3, buy_in_min = $4, 
      buy_in_max = $5, active = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *`,
      [name, stakes, maxPlayers, buyInMin, buyInMax, active, tableId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update poker table error:', error);
    res.status(500).json({ error: 'Failed to update poker table' });
  }
};

export const getPokerStats: RequestHandler = async (req, res) => {
  try {
    const totalPlayersResult = await query('SELECT COUNT(DISTINCT player_id) as count FROM poker_sessions');
    const avgProfitResult = await query('SELECT AVG(profit) as avg_profit FROM poker_results');
    const totalHandsResult = await query('SELECT SUM(hands_played) as total FROM poker_results');

    res.json({
      totalPlayers: parseInt(totalPlayersResult.rows[0]?.count || '0'),
      averageProfit: parseFloat(avgProfitResult.rows[0]?.avg_profit || '0'),
      totalHandsPlayed: parseInt(totalHandsResult.rows[0]?.total || '0'),
    });
  } catch (error) {
    console.error('Get poker stats error:', error);
    res.status(500).json({ error: 'Failed to fetch poker stats' });
  }
};

// BINGO MANAGEMENT
export const listBingoGames: RequestHandler = async (req, res) => {
  try {
    const result = await query('SELECT * FROM bingo_games ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('List bingo games error:', error);
    res.status(500).json({ error: 'Failed to fetch bingo games' });
  }
};

export const createBingoGame: RequestHandler = async (req, res) => {
  try {
    const { name, pattern, ticketPrice, jackpot } = req.body;

    const result = await query(
      `INSERT INTO bingo_games (name, pattern, ticket_price, jackpot) 
      VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, pattern, ticketPrice, jackpot]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create bingo game error:', error);
    res.status(500).json({ error: 'Failed to create bingo game' });
  }
};

export const updateBingoGame: RequestHandler = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { name, pattern, ticketPrice, jackpot, status } = req.body;

    const result = await query(
      `UPDATE bingo_games SET name = $1, pattern = $2, ticket_price = $3, jackpot = $4, status = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *`,
      [name, pattern, ticketPrice, jackpot, status, gameId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update bingo game error:', error);
    res.status(500).json({ error: 'Failed to update bingo game' });
  }
};

export const getBingoStats: RequestHandler = async (req, res) => {
  try {
    const totalPlayersResult = await query('SELECT COUNT(DISTINCT player_id) as count FROM bingo_tickets');
    const totalJackpotsWonResult = await query('SELECT COUNT(*) as count FROM bingo_results WHERE winnings IS NOT NULL');
    const totalRevenue = await query('SELECT SUM(ticket_price) as total FROM bingo_results');

    res.json({
      totalPlayers: parseInt(totalPlayersResult.rows[0]?.count || '0'),
      totalGames: await query('SELECT COUNT(*) as count FROM bingo_games').then(r => parseInt(r.rows[0]?.count || '0')),
      jackpotsWon: parseInt(totalJackpotsWonResult.rows[0]?.count || '0'),
      totalRevenue: parseFloat(totalRevenue.rows[0]?.total || '0'),
    });
  } catch (error) {
    console.error('Get bingo stats error:', error);
    res.status(500).json({ error: 'Failed to fetch bingo stats' });
  }
};

// SPORTSBOOK MANAGEMENT
export const listSportsEvents: RequestHandler = async (req, res) => {
  try {
    const status = (req.query.status as string) || '';
    let whereClause = '';

    if (status) {
      whereClause = `WHERE status = '${status}'`;
    }

    const result = await query(
      `SELECT * FROM sports_events ${whereClause} ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('List sports events error:', error);
    res.status(500).json({ error: 'Failed to fetch sports events' });
  }
};

export const createSportsEvent: RequestHandler = async (req, res) => {
  try {
    const { sport, eventName, status } = req.body;

    const result = await query(
      `INSERT INTO sports_events (sport, event_name, status) 
      VALUES ($1, $2, $3) RETURNING *`,
      [sport, eventName, status]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create sports event error:', error);
    res.status(500).json({ error: 'Failed to create sports event' });
  }
};

export const updateSportsEvent: RequestHandler = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status, lineMovement } = req.body;

    const result = await query(
      `UPDATE sports_events SET status = $1, line_movement = $2, odds_update = CURRENT_TIMESTAMP, 
      updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
      [status, lineMovement, eventId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update sports event error:', error);
    res.status(500).json({ error: 'Failed to update sports event' });
  }
};

export const getSportsbookStats: RequestHandler = async (req, res) => {
  try {
    const totalBetsResult = await query('SELECT COUNT(*) as count, SUM(amount) as total FROM sports_bets');
    const totalWonResult = await query('SELECT COUNT(*) as count FROM sports_bets WHERE status = $1', ['Won']);
    const avgOdds = await query('SELECT AVG(odds) as avg_odds FROM sports_bets');

    res.json({
      totalBets: parseInt(totalBetsResult.rows[0]?.count || '0'),
      totalVolume: parseFloat(totalBetsResult.rows[0]?.total || '0'),
      betsWon: parseInt(totalWonResult.rows[0]?.count || '0'),
      averageOdds: parseFloat(avgOdds.rows[0]?.avg_odds || '0'),
    });
  } catch (error) {
    console.error('Get sportsbook stats error:', error);
    res.status(500).json({ error: 'Failed to fetch sportsbook stats' });
  }
};

// GAME INGESTION
export const ingestGameData: RequestHandler = async (req, res) => {
  try {
    const gameIdParam = req.params.gameId;
    const gameId = parseInt(gameIdParam, 10);
    const { data } = req.body;

    // Validate gameId
    if (isNaN(gameId) || gameId <= 0) {
      return res.status(400).json({ error: 'Invalid game ID provided' });
    }

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid data payload' });
    }

    // Validate game exists
    const gameResult = await query('SELECT * FROM games WHERE id = $1', [gameId]);
    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Store game data in config
    for (const [key, value] of Object.entries(data)) {
      await query(
        'INSERT INTO game_config (game_id, config_key, config_value) VALUES ($1, $2, $3) ON CONFLICT (game_id, config_key) DO UPDATE SET config_value = $3',
        [gameId, key, JSON.stringify(value)]
      );
    }

    res.json({ success: true, ingested: Object.keys(data).length });
  } catch (error) {
    console.error('Ingest game data error:', error);
    res.status(500).json({ error: 'Failed to ingest game data' });
  }
};

export const clearAllGames: RequestHandler = async (req, res) => {
  try {
    // Only allow admins to clear all games
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can clear all games' });
    }

    // Disable all games instead of deleting them
    await query('UPDATE games SET enabled = false');

    await SlackService.notifyAdminAction(
      req.user?.email || 'admin',
      'Cleared All Games',
      'All games have been disabled'
    );

    res.json({ success: true, message: 'All games have been cleared' });
  } catch (error) {
    console.error('Clear all games error:', error);
    res.status(500).json({ error: 'Failed to clear games' });
  }
};

export const crawlSlots: RequestHandler = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    console.log(`[Crawler] Starting crawl for: ${url}`);

    // Fetch HTML with a standard User-Agent to avoid simple blocks
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: (status) => status < 500 // Don't throw on 4xx, only on 5xx or connection errors
    });

    if (response.status !== 200) {
      console.warn(`[Crawler] Site returned status ${response.status} for ${url}`);
      return res.status(400).json({ error: `Target site returned status ${response.status}. It might be blocking automated access.` });
    }

    const html = response.data;
    if (!html || typeof html !== 'string') {
      return res.status(400).json({ error: 'Could not retrieve text content from the URL' });
    }

    // Extract Title (Game Name)
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    let name = titleMatch ? titleMatch[1].trim() : 'Crawled Game';

    // Clean up name: remove common separators and "Slot", "Online", etc if they are suffixes
    if (name.includes('|')) name = name.split('|')[0].trim();
    if (name.includes('-')) name = name.split('-')[0].trim();
    if (name.includes(':')) name = name.split(':')[0].trim();

    // Ensure name fits in VARCHAR(255)
    name = name.substring(0, 250);

    // Extract RTP (Return to Player)
    // Common pattern in slot review sites: "RTP: 96.5%"
    const rtpMatch = html.match(/RTP[:\s]+(\d{2,3}(\.\d{1,2})?)%/i) ||
                     html.match(/(\d{2,3}(\.\d{1,2})?)%[\s]*RTP/i) ||
                     html.match(/payout[\s]+percentage[:\s]+(\d{2,3}(\.\d{1,2})?)%/i);

    let rtp = rtpMatch ? parseFloat(rtpMatch[1]) : 96.0;
    // Ensure RTP is within sensible bounds for DECIMAL(5,2)
    if (isNaN(rtp) || rtp <= 0 || rtp > 100) rtp = 96.0;

    // Extract Volatility
    const volMatch = html.match(/(Low|Medium|High)[\s]+Volatility/i) ||
                     html.match(/Volatility[:\s]+(Low|Medium|High)/i);
    const volatility = volMatch ? volMatch[1].charAt(0).toUpperCase() + volMatch[1].slice(1).toLowerCase() : 'Medium';

    // Extract Description
    const metaDescMatch = html.match(/<meta name="description" content="(.*?)"/i) ||
                          html.match(/<meta property="og:description" content="(.*?)"/i);
    const description = metaDescMatch ? metaDescMatch[1].trim().substring(0, 500) : `Automatically crawled from ${url}`;

    // Create game in database
    console.log(`[Crawler] Inserting game into DB: "${name}" (RTP: ${rtp}%, Volatility: ${volatility})`);
    const dbResult = await query(
      `INSERT INTO games (name, category, provider, rtp, volatility, description, enabled)
       VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING *`,
      [name, 'Slots', 'External', rtp, volatility, description]
    );

    const game = dbResult.rows[0];

    // Notify admin channel
    try {
      await SlackService.notifyAdminAction(
        req.user?.email || 'admin',
        'Slots Crawl Successful',
        `Imported "${name}" (RTP: ${rtp}%, Volatility: ${volatility}) from ${url}`
      );
    } catch (slackErr) {
      console.error('[Crawler] Failed to send Slack notification:', slackErr);
    }

    res.json({
      success: true,
      message: `Successfully crawled and imported "${name}" with ${rtp}% RTP.`,
      data: game
    });
  } catch (error: any) {
    console.error('[Crawler] Error:', error.message);
    const message = error.code === 'ECONNABORTED' ? 'Request timed out' : error.message;

    // If it's an axios error, it's usually a bad URL or target site issue, so 400 is more appropriate
    if (error.isAxiosError || error.code?.startsWith('E')) {
      return res.status(400).json({ error: `Crawler could not reach the site: ${message}` });
    }

    res.status(500).json({ error: `Crawler failed: ${message}` });
  }
};
