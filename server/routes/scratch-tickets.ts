import { RequestHandler } from 'express';
import { ScratchTicketService } from '../services/scratch-ticket-service';
import { query } from '../db/connection';

// Helper to ensure param is a string
const getStringParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0];
  return param || '';
};

// ===== PLAYER ROUTES =====

/**
 * Get available scratch ticket designs
 */
export const getAvailableDesigns: RequestHandler = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, description, cost_sc, slot_count, prize_min_sc, prize_max_sc, image_url, background_color
       FROM scratch_ticket_designs
       WHERE enabled = true
       ORDER BY created_at DESC`
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
 * Purchase a scratch ticket
 */
export const purchaseTicket: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { designId } = req.body;

    if (!designId) {
      return res.status(400).json({ error: 'Design ID required' });
    }

    const result = await ScratchTicketService.purchaseTicket(req.user.playerId, designId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: result.ticket,
    });
  } catch (error) {
    console.error('Failed to purchase ticket:', error);
    res.status(500).json({ error: 'Failed to purchase ticket' });
  }
};

/**
 * Reveal a slot on a scratch ticket
 */
export const revealSlot: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { ticketId, slotIndex } = req.body;

    if (!ticketId || slotIndex === undefined) {
      return res.status(400).json({ error: 'Ticket ID and slot index required' });
    }

    const result = await ScratchTicketService.revealSlot(ticketId, slotIndex, req.user.playerId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: {
        slot: result.slot,
        prize: result.prize,
      },
    });
  } catch (error) {
    console.error('Failed to reveal slot:', error);
    res.status(500).json({ error: 'Failed to reveal slot' });
  }
};

/**
 * Claim prize for a winning ticket
 */
export const claimPrize: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { ticketId } = req.body;

    if (!ticketId) {
      return res.status(400).json({ error: 'Ticket ID required' });
    }

    const result = await ScratchTicketService.claimPrize(ticketId, req.user.playerId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: {
        prizeAmount: result.prizeAmount,
        message: `🎉 You Won ${result.prizeAmount} SC!`,
      },
    });
  } catch (error) {
    console.error('Failed to claim prize:', error);
    res.status(500).json({ error: 'Failed to claim prize' });
  }
};

/**
 * Get a specific ticket
 */
export const getTicket: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const ticketId = getStringParam(req.params.ticketId);

    const ticket = await ScratchTicketService.getTicket(parseInt(ticketId), req.user.playerId);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error('Failed to get ticket:', error);
    res.status(500).json({ error: 'Failed to get ticket' });
  }
};

/**
 * Get all tickets for the current player
 */
export const getMyTickets: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const tickets = await ScratchTicketService.getPlayerTickets(req.user.playerId, limit);

    res.json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    console.error('Failed to get tickets:', error);
    res.status(500).json({ error: 'Failed to get tickets' });
  }
};

/**
 * Get scratch ticket transaction history
 */
export const getTransactionHistory: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const result = await query(
      `SELECT stt.*, std.name as design_name, st.ticket_number
       FROM scratch_ticket_transactions stt
       LEFT JOIN scratch_ticket_designs std ON stt.ticket_id IS NOT NULL
       LEFT JOIN scratch_tickets st ON stt.ticket_id = st.id
       WHERE stt.player_id = $1
       ORDER BY stt.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.playerId, limit, offset]
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
