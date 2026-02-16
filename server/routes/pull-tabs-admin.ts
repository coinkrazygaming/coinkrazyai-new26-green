import { RequestHandler } from 'express';
import { query } from '../db/connection';
import { MIN_BET_SC, MAX_BET_SC, MAX_WIN_SC } from '../../shared/constants';

// ===== ADMIN ROUTES =====

/**
 * Get all pull tab designs (admin)
 */
export const getDesigns: RequestHandler = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const result = await query(
      `SELECT ptd.*, au.name as created_by_name
       FROM pull_tab_designs ptd
       LEFT JOIN admin_users au ON ptd.created_by = au.id
       ORDER BY ptd.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Failed to get designs:', error);
    res.status(500).json({ error: 'Failed to get designs' });
  }
};

/**
 * Get a single pull tab design (admin)
 */
export const getDesign: RequestHandler = async (req, res) => {
  try {
    const { designId } = req.params;

    const result = await query(`SELECT * FROM pull_tab_designs WHERE id = $1`, [designId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Design not found' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Failed to get design:', error);
    res.status(500).json({ error: 'Failed to get design' });
  }
};

/**
 * Create a new pull tab design (admin)
 */
export const createDesign: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      name,
      description,
      cost_sc,
      tab_count,
      win_probability,
      prize_min_sc,
      prize_max_sc,
      image_url,
      background_color,
      winning_tab_text,
      losing_tab_text,
      enabled,
    } = req.body;

    // Validate required fields
    if (!name || cost_sc === undefined || tab_count === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Enforce platform-wide limits
    if (cost_sc < MIN_BET_SC || cost_sc > MAX_BET_SC) {
      return res.status(400).json({ error: `Ticket cost must be between ${MIN_BET_SC} and ${MAX_BET_SC} SC` });
    }

    if (prize_max_sc > MAX_WIN_SC) {
      return res.status(400).json({ error: `Maximum prize cannot exceed ${MAX_WIN_SC} SC` });
    }

    const result = await query(
      `INSERT INTO pull_tab_designs (
        name, description, cost_sc, tab_count, win_probability,
        prize_min_sc, prize_max_sc, image_url, background_color,
        winning_tab_text, losing_tab_text, enabled, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING *`,
      [
        name,
        description || null,
        cost_sc,
        tab_count,
        win_probability || 20,
        prize_min_sc || 1,
        prize_max_sc || 20,
        image_url || null,
        background_color || '#FF6B35',
        winning_tab_text || 'WINNER!',
        losing_tab_text || 'TRY AGAIN',
        enabled !== false,
        req.user.playerId,
      ]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Failed to create design:', error);
    res.status(500).json({ error: 'Failed to create design' });
  }
};

/**
 * Update a pull tab design (admin)
 */
export const updateDesign: RequestHandler = async (req, res) => {
  try {
    const { designId } = req.params;
    const {
      name,
      description,
      cost_sc,
      tab_count,
      win_probability,
      prize_min_sc,
      prize_max_sc,
      image_url,
      background_color,
      winning_tab_text,
      losing_tab_text,
      enabled,
    } = req.body;

    // Enforce platform-wide limits on update
    if (cost_sc !== undefined && (cost_sc < MIN_BET_SC || cost_sc > MAX_BET_SC)) {
      return res.status(400).json({ error: `Ticket cost must be between ${MIN_BET_SC} and ${MAX_BET_SC} SC` });
    }

    if (prize_max_sc !== undefined && prize_max_sc > MAX_WIN_SC) {
      return res.status(400).json({ error: `Maximum prize cannot exceed ${MAX_WIN_SC} SC` });
    }

    const result = await query(
      `UPDATE pull_tab_designs SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        cost_sc = COALESCE($3, cost_sc),
        tab_count = COALESCE($4, tab_count),
        win_probability = COALESCE($5, win_probability),
        prize_min_sc = COALESCE($6, prize_min_sc),
        prize_max_sc = COALESCE($7, prize_max_sc),
        image_url = COALESCE($8, image_url),
        background_color = COALESCE($9, background_color),
        winning_tab_text = COALESCE($10, winning_tab_text),
        losing_tab_text = COALESCE($11, losing_tab_text),
        enabled = COALESCE($12, enabled),
        updated_at = NOW()
      WHERE id = $13
      RETURNING *`,
      [
        name || null,
        description || null,
        cost_sc || null,
        tab_count || null,
        win_probability || null,
        prize_min_sc || null,
        prize_max_sc || null,
        image_url || null,
        background_color || null,
        winning_tab_text || null,
        losing_tab_text || null,
        enabled !== undefined ? enabled : null,
        designId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Design not found' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Failed to update design:', error);
    res.status(500).json({ error: 'Failed to update design' });
  }
};

/**
 * Delete a pull tab design (admin)
 */
export const deleteDesign: RequestHandler = async (req, res) => {
  try {
    const { designId } = req.params;

    const result = await query(`DELETE FROM pull_tab_designs WHERE id = $1 RETURNING *`, [designId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Design not found' });
    }

    res.json({
      success: true,
      message: 'Design deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete design:', error);
    res.status(500).json({ error: 'Failed to delete design' });
  }
};

/**
 * Get pull tab statistics (admin)
 */
export const getStatistics: RequestHandler = async (req, res) => {
  try {
    const result = await query(`
      SELECT
        COUNT(DISTINCT pkt.player_id) as total_players,
        COUNT(pkt.id) as total_tickets_purchased,
        SUM(CASE WHEN ptr.won = true THEN 1 ELSE 0 END) as winning_tickets,
        ROUND(100.0 * SUM(CASE WHEN ptr.won = true THEN 1 ELSE 0 END) / NULLIF(COUNT(pkt.id), 0), 2) as win_percentage,
        SUM(ptr.prize_amount) as total_prizes_awarded,
        SUM(ptd.cost_sc) as total_sc_spent,
        AVG(ptr.prize_amount) as avg_prize_amount
      FROM pull_tab_tickets pkt
      LEFT JOIN pull_tab_results ptr ON pkt.id = ptr.ticket_id
      LEFT JOIN pull_tab_designs ptd ON pkt.design_id = ptd.id
    `);

    res.json({
      success: true,
      data: result.rows[0] || {},
    });
  } catch (error) {
    console.error('Failed to get statistics:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
};

/**
 * Get pull tab transaction history (admin)
 */
export const getTransactionHistory: RequestHandler = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const result = await query(
      `SELECT ptt.*, p.username, p.name as player_name, ptd.name as design_name
       FROM pull_tab_transactions ptt
       JOIN players p ON ptt.player_id = p.id
       LEFT JOIN pull_tab_tickets pkt ON ptt.ticket_id = pkt.id
       LEFT JOIN pull_tab_designs ptd ON pkt.design_id = ptd.id
       ORDER BY ptt.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Failed to get transaction history:', error);
    res.status(500).json({ error: 'Failed to get transaction history' });
  }
};

/**
 * Get pull tab results/outcomes (admin)
 */
export const getResults: RequestHandler = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const result = await query(
      `SELECT ptr.*, p.username, p.name as player_name, ptd.name as design_name
       FROM pull_tab_results ptr
       JOIN players p ON ptr.player_id = p.id
       JOIN pull_tab_designs ptd ON ptr.design_id = ptd.id
       ORDER BY ptr.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Failed to get results:', error);
    res.status(500).json({ error: 'Failed to get results' });
  }
};
