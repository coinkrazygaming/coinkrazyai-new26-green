import { RequestHandler } from 'express';
import { query } from '../db/connection';
import { MIN_BET_SC, MAX_BET_SC, MAX_WIN_SC } from '../../shared/constants';

// Helper to ensure param is a string
const getStringParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0];
  return param || '';
};

// ===== ADMIN ROUTES =====

/**
 * Get all scratch ticket designs
 */
export const getDesigns: RequestHandler = async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM scratch_ticket_designs ORDER BY created_at DESC`
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
 * Get a specific design
 */
export const getDesign: RequestHandler = async (req, res) => {
  try {
    const designId = getStringParam(req.params.designId);

    const result = await query(
      `SELECT * FROM scratch_ticket_designs WHERE id = $1`,
      [parseInt(designId)]
    );

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
 * Create a new scratch ticket design
 */
export const createDesign: RequestHandler = async (req, res) => {
  try {
    const {
      name,
      description,
      cost_sc,
      slot_count,
      win_probability,
      prize_min_sc,
      prize_max_sc,
      image_url,
      background_color,
    } = req.body;

    // Validation
    if (!name || !cost_sc || !slot_count) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (slot_count < 6 || slot_count > 9) {
      return res.status(400).json({ error: 'Slot count must be between 6 and 9' });
    }

    if (cost_sc < MIN_BET_SC || cost_sc > MAX_BET_SC) {
      return res.status(400).json({ error: `Ticket cost must be between ${MIN_BET_SC} and ${MAX_BET_SC} SC` });
    }

    if (prize_max_sc > MAX_WIN_SC) {
      return res.status(400).json({ error: `Maximum prize cannot exceed ${MAX_WIN_SC} SC` });
    }

    if (prize_min_sc < 0.01 || prize_min_sc > prize_max_sc) {
      return res.status(400).json({ error: 'Invalid prize range' });
    }

    const result = await query(
      `INSERT INTO scratch_ticket_designs (
        name, description, cost_sc, slot_count, win_probability,
        prize_min_sc, prize_max_sc, image_url, background_color, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        name,
        description || '',
        parseFloat(cost_sc),
        parseInt(slot_count),
        parseFloat(win_probability) || 16.67,
        parseFloat(prize_min_sc) || 1,
        parseFloat(prize_max_sc) || 10,
        image_url || null,
        background_color || '#FFD700',
        req.user?.playerId || null,
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Failed to create design:', error);
    res.status(500).json({ error: 'Failed to create design' });
  }
};

/**
 * Update a scratch ticket design
 */
export const updateDesign: RequestHandler = async (req, res) => {
  try {
    const designId = getStringParam(req.params.designId);
    const {
      name,
      description,
      cost_sc,
      slot_count,
      win_probability,
      prize_min_sc,
      prize_max_sc,
      image_url,
      background_color,
      enabled,
    } = req.body;

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (cost_sc !== undefined) {
      const parsedCost = parseFloat(cost_sc);
      if (parsedCost < MIN_BET_SC || parsedCost > MAX_BET_SC) {
        return res.status(400).json({ error: `Ticket cost must be between ${MIN_BET_SC} and ${MAX_BET_SC} SC` });
      }
      updates.push(`cost_sc = $${paramIndex++}`);
      values.push(parsedCost);
    }
    if (slot_count !== undefined) {
      if (slot_count < 6 || slot_count > 9) {
        return res.status(400).json({ error: 'Slot count must be between 6 and 9' });
      }
      updates.push(`slot_count = $${paramIndex++}`);
      values.push(parseInt(slot_count));
    }
    if (win_probability !== undefined) {
      updates.push(`win_probability = $${paramIndex++}`);
      values.push(parseFloat(win_probability));
    }
    if (prize_min_sc !== undefined) {
      updates.push(`prize_min_sc = $${paramIndex++}`);
      values.push(parseFloat(prize_min_sc));
    }
    if (prize_max_sc !== undefined) {
      const parsedMaxPrize = parseFloat(prize_max_sc);
      if (parsedMaxPrize > MAX_WIN_SC) {
        return res.status(400).json({ error: `Maximum prize cannot exceed ${MAX_WIN_SC} SC` });
      }
      updates.push(`prize_max_sc = $${paramIndex++}`);
      values.push(parsedMaxPrize);
    }
    if (image_url !== undefined) {
      updates.push(`image_url = $${paramIndex++}`);
      values.push(image_url);
    }
    if (background_color !== undefined) {
      updates.push(`background_color = $${paramIndex++}`);
      values.push(background_color);
    }
    if (enabled !== undefined) {
      updates.push(`enabled = $${paramIndex++}`);
      values.push(enabled);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(parseInt(designId));

    const result = await query(
      `UPDATE scratch_ticket_designs
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
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
 * Delete a scratch ticket design
 */
export const deleteDesign: RequestHandler = async (req, res) => {
  try {
    const designId = getStringParam(req.params.designId);

    const result = await query(
      `DELETE FROM scratch_ticket_designs WHERE id = $1 RETURNING id`,
      [parseInt(designId)]
    );

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
 * Get scratch ticket statistics
 */
export const getStatistics: RequestHandler = async (req, res) => {
  try {
    // Total tickets sold
    const ticketsResult = await query(
      `SELECT COUNT(*) as total_tickets, SUM(std.cost_sc) as total_revenue
       FROM scratch_tickets st
       JOIN scratch_ticket_designs std ON st.design_id = std.id`
    );

    // Total winners
    const winnersResult = await query(
      `SELECT COUNT(*) as total_winners, SUM(prize_amount) as total_prizes
       FROM scratch_ticket_results
       WHERE won = true`
    );

    // Win rate
    const winRateResult = await query(
      `SELECT
       (SELECT COUNT(*) FROM scratch_ticket_results WHERE won = true) as wins,
       (SELECT COUNT(*) FROM scratch_tickets) as total_tickets`
    );

    // Top designs
    const topDesignsResult = await query(
      `SELECT std.name, COUNT(st.id) as sales_count, SUM(std.cost_sc) as revenue
       FROM scratch_tickets st
       JOIN scratch_ticket_designs std ON st.design_id = std.id
       GROUP BY std.id, std.name
       ORDER BY sales_count DESC
       LIMIT 10`
    );

    const tickets = ticketsResult.rows[0];
    const winners = winnersResult.rows[0];
    const winRate = winRateResult.rows[0];

    res.json({
      success: true,
      data: {
        total_tickets: parseInt(tickets.total_tickets) || 0,
        total_revenue: parseFloat(tickets.total_revenue) || 0,
        total_winners: parseInt(winners.total_winners) || 0,
        total_prizes: parseFloat(winners.total_prizes) || 0,
        win_rate:
          winRate.total_tickets > 0
            ? ((winRate.wins / winRate.total_tickets) * 100).toFixed(2) + '%'
            : '0%',
        top_designs: topDesignsResult.rows,
      },
    });
  } catch (error) {
    console.error('Failed to get statistics:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
};

/**
 * Get transaction history for all players
 */
export const getTransactionHistory: RequestHandler = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const transactionType = req.query.type as string | undefined;

    let whereClause = '';
    const params: any[] = [];

    if (transactionType) {
      whereClause = 'WHERE transaction_type = $1';
      params.push(transactionType);
      params.push(limit);
      params.push(offset);
    } else {
      params.push(limit);
      params.push(offset);
    }

    const result = await query(
      `SELECT stt.*, p.username, std.name as design_name, st.ticket_number
       FROM scratch_ticket_transactions stt
       LEFT JOIN players p ON stt.player_id = p.id
       LEFT JOIN scratch_ticket_designs std ON stt.ticket_id IS NOT NULL
       LEFT JOIN scratch_tickets st ON stt.ticket_id = st.id
       ${whereClause}
       ORDER BY stt.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
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
 * Get ticket results/outcomes
 */
export const getTicketResults: RequestHandler = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const result = await query(
      `SELECT str.*, p.username, std.name as design_name, st.ticket_number
       FROM scratch_ticket_results str
       LEFT JOIN players p ON str.player_id = p.id
       LEFT JOIN scratch_ticket_designs std ON str.design_id = std.id
       LEFT JOIN scratch_tickets st ON str.ticket_id = st.id
       ORDER BY str.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Failed to get ticket results:', error);
    res.status(500).json({ error: 'Failed to get ticket results' });
  }
};
