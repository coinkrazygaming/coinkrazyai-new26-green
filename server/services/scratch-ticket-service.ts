import { query, getClient } from '../db/connection';
import { WalletService } from './wallet-service';
import { NotificationService } from './notification-service';
import { MIN_BET_SC, MAX_BET_SC, MAX_WIN_SC } from '../../shared/constants';

interface ScratchTicketSlot {
  index: number;
  value: 'LOSS' | number; // Either 'LOSS' or a prize amount (1-10 SC)
  revealed: boolean;
}

interface ScratchTicketDesign {
  id: number;
  name: string;
  cost_sc: number;
  slot_count: number;
  win_probability: number;
  prize_min_sc: number;
  prize_max_sc: number;
  image_url?: string;
  background_color: string;
  enabled: boolean;
}

interface ScratchTicket {
  id: number;
  ticket_number: string;
  design_id: number;
  player_id: number;
  slots: ScratchTicketSlot[];
  status: 'active' | 'expired' | 'claimed';
  claim_status: 'unclaimed' | 'claimed';
  created_at: Date;
}

export class ScratchTicketService {
  /**
   * Generate slots for a scratch ticket with winning logic
   * Overall odds: 1 winning ticket out of every 6 tickets (16.67%)
   */
  static generateTicketSlots(design: ScratchTicketDesign): ScratchTicketSlot[] {
    const slotCount = design.slot_count;
    const slots: ScratchTicketSlot[] = [];
    
    // Determine if this ticket is a winner (1 out of 6)
    const isWinningTicket = Math.random() < (design.win_probability / 100);
    
    if (isWinningTicket) {
      // Generate one winning prize slot and rest are LOSS
      const winningSlotIndex = Math.floor(Math.random() * slotCount);
      let prizeAmount = Math.floor(
        Math.random() * (design.prize_max_sc - design.prize_min_sc + 1) + design.prize_min_sc
      );

      // Apply platform-wide max win cap
      if (prizeAmount > MAX_WIN_SC) {
        prizeAmount = MAX_WIN_SC;
      }

      for (let i = 0; i < slotCount; i++) {
        slots.push({
          index: i,
          value: i === winningSlotIndex ? prizeAmount : 'LOSS',
          revealed: false,
        });
      }
    } else {
      // All slots are LOSS
      for (let i = 0; i < slotCount; i++) {
        slots.push({
          index: i,
          value: 'LOSS',
          revealed: false,
        });
      }
    }
    
    return slots;
  }

  /**
   * Generate unique ticket number
   */
  static generateTicketNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 8).toUpperCase();
    return `CK-${timestamp}-${random}`;
  }

  /**
   * Create and purchase a new scratch ticket for a player
   */
  static async purchaseTicket(
    playerId: number,
    designId: number
  ): Promise<{ success: boolean; ticket?: ScratchTicket; error?: string }> {
    try {
      // Get design details
      const designResult = await query(
        `SELECT * FROM scratch_ticket_designs WHERE id = $1 AND enabled = true`,
        [designId]
      );

      if (designResult.rows.length === 0) {
        return { success: false, error: 'Ticket design not found or disabled' };
      }

      const design = designResult.rows[0] as ScratchTicketDesign;

      // Enforce platform-wide bet limits
      if (design.cost_sc < MIN_BET_SC || design.cost_sc > MAX_BET_SC) {
        return {
          success: false,
          error: `Ticket cost must be between ${MIN_BET_SC} and ${MAX_BET_SC} SC`
        };
      }

      // Get player's current balances
      const playerResult = await query(
        `SELECT gc_balance, sc_balance FROM players WHERE id = $1`,
        [playerId]
      );

      if (playerResult.rows.length === 0) {
        return { success: false, error: 'Player not found' };
      }

      const currentGcBalance = parseFloat(playerResult.rows[0].gc_balance);
      const currentScBalance = parseFloat(playerResult.rows[0].sc_balance);

      if (currentScBalance < design.cost_sc) {
        return { success: false, error: 'Insufficient Sweeps Coins' };
      }

      // Generate ticket slots (server-side, never client-side)
      const slots = this.generateTicketSlots(design);
      const ticketNumber = this.generateTicketNumber();

      // Start transaction
      const client = await getClient();

      try {
        await client.query('BEGIN');

        // Create ticket
        const ticketResult = await client.query(
          `INSERT INTO scratch_tickets (design_id, player_id, ticket_number, slots, status, claim_status)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [designId, playerId, ticketNumber, JSON.stringify(slots), 'active', 'unclaimed']
        );

        const ticket = ticketResult.rows[0];

        // Deduct SC from player balance
        const newScBalance = currentScBalance - design.cost_sc;
        await client.query(
          `UPDATE players SET sc_balance = $1 WHERE id = $2`,
          [newScBalance, playerId]
        );

        // Log transaction
        await client.query(
          `INSERT INTO scratch_ticket_transactions (player_id, ticket_id, transaction_type, amount_sc, balance_before, balance_after, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            playerId,
            ticket.id,
            'purchase',
            design.cost_sc,
            currentScBalance,
            newScBalance,
            `Purchased CoinKrazy Scratch Ticket - ${design.name}`,
          ]
        );

        // Log wallet transaction
        await client.query(
          `INSERT INTO wallet_ledger (player_id, transaction_type, sc_amount, sc_balance_after, description)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            playerId,
            'Scratch Ticket Purchase',
            -design.cost_sc,
            newScBalance,
            `Purchased CoinKrazy Scratch Ticket - ${design.name}`,
          ]
        );

        await client.query('COMMIT');

        // Notify wallet update via socket
        WalletService.notifyWalletUpdate(playerId, {
          goldCoins: currentGcBalance,
          sweepsCoins: newScBalance
        } as any);

        // Send notification/receipt
        const playerEmailResult = await query('SELECT email FROM players WHERE id = $1', [playerId]);
        if (playerEmailResult.rows.length > 0) {
          NotificationService.notifyPurchase(
            playerId,
            playerEmailResult.rows[0].email,
            design.cost_sc,
            'SC',
            `Scratch Ticket: ${design.name}`
          );
        }

        return {
          success: true,
          ticket: {
            id: ticket.id,
            ticket_number: ticket.ticket_number,
            design_id: ticket.design_id,
            player_id: ticket.player_id,
            slots: typeof ticket.slots === 'string' ? JSON.parse(ticket.slots) : ticket.slots,
            status: ticket.status,
            claim_status: ticket.claim_status,
            created_at: ticket.created_at,
          },
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Failed to purchase ticket:', error);
      return { success: false, error: 'Failed to purchase ticket' };
    }
  }

  /**
   * Reveal a specific slot on a ticket
   */
  static async revealSlot(
    ticketId: number,
    slotIndex: number,
    playerId: number
  ): Promise<{ success: boolean; slot?: any; prize?: number; error?: string }> {
    try {
      // Get ticket
      const ticketResult = await query(
        `SELECT * FROM scratch_tickets WHERE id = $1 AND player_id = $2`,
        [ticketId, playerId]
      );

      if (ticketResult.rows.length === 0) {
        return { success: false, error: 'Ticket not found' };
      }

      const ticket = ticketResult.rows[0];
      const slots: ScratchTicketSlot[] = typeof ticket.slots === 'string' ? JSON.parse(ticket.slots) : ticket.slots;

      // Check if ticket is still active
      if (ticket.status !== 'active') {
        return { success: false, error: 'Ticket is no longer active' };
      }

      // Check if already claimed
      if (ticket.claim_status === 'claimed') {
        return { success: false, error: 'Ticket already claimed' };
      }

      // Validate slot index
      if (slotIndex < 0 || slotIndex >= slots.length) {
        return { success: false, error: 'Invalid slot index' };
      }

      // Check if slot already revealed
      if (slots[slotIndex].revealed) {
        return { success: false, error: 'Slot already revealed' };
      }

      // Reveal the slot
      slots[slotIndex].revealed = true;
      const slotValue = slots[slotIndex].value;

      // Update ticket with revealed slot
      await query(
        `UPDATE scratch_tickets
         SET slots = $1, revealed_slots = array_append(revealed_slots, $2)
         WHERE id = $3`,
        [JSON.stringify(slots), slotIndex, ticketId]
      );

      // Check if this is a winning slot (has a number, not 'LOSS')
      const prize = typeof slotValue === 'number' ? slotValue : null;

      return {
        success: true,
        slot: {
          index: slotIndex,
          value: slotValue,
          revealed: true,
        },
        prize: prize || undefined,
      };
    } catch (error) {
      console.error('Failed to reveal slot:', error);
      return { success: false, error: 'Failed to reveal slot' };
    }
  }

  /**
   * Claim prize for a winning ticket
   * Server-side validation to prevent cheating
   */
  static async claimPrize(
    ticketId: number,
    playerId: number
  ): Promise<{ success: boolean; prizeAmount?: number; error?: string }> {
    try {
      // Get ticket with design info
      const ticketResult = await query(
        `SELECT st.*, std.name, std.cost_sc, std.slot_count
         FROM scratch_tickets st
         JOIN scratch_ticket_designs std ON st.design_id = std.id
         WHERE st.id = $1 AND st.player_id = $2`,
        [ticketId, playerId]
      );

      if (ticketResult.rows.length === 0) {
        return { success: false, error: 'Ticket not found' };
      }

      const ticket = ticketResult.rows[0];
      const slots: ScratchTicketSlot[] = typeof ticket.slots === 'string' ? JSON.parse(ticket.slots) : ticket.slots;

      // Check if already claimed
      if (ticket.claim_status === 'claimed') {
        return { success: false, error: 'Prize already claimed' };
      }

      // Find the winning slot (server-side validation)
      let prizeAmount = 0;
      let winningSlotIndex = -1;

      for (let i = 0; i < slots.length; i++) {
        const value = slots[i].value;
        if (typeof value === 'number' && value > 0) {
          prizeAmount = value;
          winningSlotIndex = i;
          break;
        }
      }

      // Apply platform-wide max win cap (double check)
      if (prizeAmount > MAX_WIN_SC) {
        prizeAmount = MAX_WIN_SC;
      }

      // No winning slot = no prize
      if (prizeAmount === 0 || winningSlotIndex === -1) {
        return { success: false, error: 'No prize on this ticket' };
      }

      // Get player's current balances
      const playerResult = await query(
        `SELECT gc_balance, sc_balance FROM players WHERE id = $1`,
        [playerId]
      );

      const currentGcBalance = parseFloat(playerResult.rows[0].gc_balance);
      const currentScBalance = parseFloat(playerResult.rows[0].sc_balance);
      const newScBalance = currentScBalance + prizeAmount;

      // Start transaction
      try {
        await query('BEGIN', []);

        // Update ticket claim status
        await query(
          `UPDATE scratch_tickets
           SET claim_status = $1, status = $2, claimed_at = NOW()
           WHERE id = $3`,
          ['claimed', 'active', ticketId]
        );

        // Credit prize to player
        await query(
          `UPDATE players SET sc_balance = $1 WHERE id = $2`,
          [newScBalance, playerId]
        );

        // Log winning result
        await query(
          `INSERT INTO scratch_ticket_results (ticket_id, design_id, player_id, won, prize_amount, winning_slot_index)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [ticketId, ticket.design_id, playerId, true, prizeAmount, winningSlotIndex]
        );

        // Log transaction
        await query(
          `INSERT INTO scratch_ticket_transactions (player_id, ticket_id, transaction_type, amount_sc, balance_before, balance_after, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            playerId,
            ticketId,
            'claim',
            prizeAmount,
            currentScBalance,
            newScBalance,
            `Claimed CoinKrazy Scratch Ticket Prize - ${prizeAmount} SC`,
          ]
        );

        // Log wallet transaction
        await query(
          `INSERT INTO wallet_ledger (player_id, transaction_type, sc_amount, sc_balance_after, description)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            playerId,
            'Scratch Ticket Prize Claim',
            prizeAmount,
            newScBalance,
            `Claimed CoinKrazy Scratch Ticket Prize - ${prizeAmount} SC`,
          ]
        );

        await query('COMMIT', []);

        // Notify wallet update via socket
        WalletService.notifyWalletUpdate(playerId, {
          goldCoins: currentGcBalance,
          sweepsCoins: newScBalance
        } as any);

        return { success: true, prizeAmount };
      } catch (error) {
        await query('ROLLBACK', []);
        throw error;
      }
    } catch (error) {
      console.error('Failed to claim prize:', error);
      return { success: false, error: 'Failed to claim prize' };
    }
  }

  /**
   * Get ticket details for a player
   */
  static async getTicket(
    ticketId: number,
    playerId: number
  ): Promise<ScratchTicket | null> {
    try {
      const result = await query(
        `SELECT * FROM scratch_tickets WHERE id = $1 AND player_id = $2`,
        [ticketId, playerId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        ticket_number: row.ticket_number,
        design_id: row.design_id,
        player_id: row.player_id,
        slots: typeof row.slots === 'string' ? JSON.parse(row.slots) : row.slots,
        status: row.status,
        claim_status: row.claim_status,
        created_at: row.created_at,
      };
    } catch (error) {
      console.error('Failed to get ticket:', error);
      return null;
    }
  }

  /**
   * Get all tickets for a player
   */
  static async getPlayerTickets(playerId: number, limit = 50): Promise<ScratchTicket[]> {
    try {
      const result = await query(
        `SELECT * FROM scratch_tickets
         WHERE player_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [playerId, limit]
      );

      return result.rows.map(row => ({
        id: row.id,
        ticket_number: row.ticket_number,
        design_id: row.design_id,
        player_id: row.player_id,
        slots: typeof row.slots === 'string' ? JSON.parse(row.slots) : row.slots,
        status: row.status,
        claim_status: row.claim_status,
        created_at: row.created_at,
      }));
    } catch (error) {
      console.error('Failed to get player tickets:', error);
      return [];
    }
  }
}
