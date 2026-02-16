import { query, getClient } from '../db/connection';
import { WalletService } from './wallet-service';
import { NotificationService } from './notification-service';
import { MIN_BET_SC, MAX_BET_SC, MAX_WIN_SC } from '../../shared/constants';

interface PullTabTab {
  index: number;
  value: 'LOSS' | number;
  revealed: boolean;
}

interface PullTabDesign {
  id: number;
  name: string;
  cost_sc: number;
  tab_count: number;
  win_probability: number;
  prize_min_sc: number;
  prize_max_sc: number;
  image_url?: string;
  background_color: string;
  winning_tab_text: string;
  losing_tab_text: string;
  enabled: boolean;
}

interface PullTabTicket {
  id: number;
  ticket_number: string;
  design_id: number;
  player_id: number;
  tabs: PullTabTab[];
  status: 'active' | 'expired' | 'claimed';
  claim_status: 'unclaimed' | 'claimed';
  winning_tab_index: number | null;
  created_at: Date;
}

export class PullTabService {
  /**
   * Generate tabs for a pull tab ticket with winning logic
   * Overall odds: 1 winning ticket out of every 5 tickets (20%)
   */
  static generateTicketTabs(design: PullTabDesign): PullTabTab[] {
    const tabCount = design.tab_count;
    const tabs: PullTabTab[] = [];

    // Determine if this ticket is a winner based on win_probability
    const isWinningTicket = Math.random() < (design.win_probability / 100);

    if (isWinningTicket) {
      // Generate one winning prize tab and rest are LOSS
      const winningTabIndex = Math.floor(Math.random() * tabCount);
      let prizeAmount = Math.floor(
        Math.random() * (design.prize_max_sc - design.prize_min_sc + 1) + design.prize_min_sc
      );

      // Apply platform-wide max win cap
      if (prizeAmount > MAX_WIN_SC) {
        prizeAmount = MAX_WIN_SC;
      }

      for (let i = 0; i < tabCount; i++) {
        tabs.push({
          index: i,
          value: i === winningTabIndex ? prizeAmount : 'LOSS',
          revealed: false,
        });
      }
    } else {
      // All tabs are LOSS
      for (let i = 0; i < tabCount; i++) {
        tabs.push({
          index: i,
          value: 'LOSS',
          revealed: false,
        });
      }
    }

    return tabs;
  }

  /**
   * Generate unique ticket number
   */
  static generateTicketNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 8).toUpperCase();
    return `PT-${timestamp}-${random}`;
  }

  /**
   * Create and purchase a new pull tab ticket for a player
   */
  static async purchaseTicket(
    playerId: number,
    designId: number
  ): Promise<{ success: boolean; ticket?: PullTabTicket; error?: string }> {
    try {
      // Get design details
      const designResult = await query(
        `SELECT * FROM pull_tab_designs WHERE id = $1 AND enabled = true`,
        [designId]
      );

      if (designResult.rows.length === 0) {
        return { success: false, error: 'Ticket design not found or disabled' };
      }

      const design = designResult.rows[0] as PullTabDesign;

      // Enforce platform-wide bet limits
      if (design.cost_sc < MIN_BET_SC || design.cost_sc > MAX_BET_SC) {
        return {
          success: false,
          error: `Ticket cost must be between ${MIN_BET_SC} and ${MAX_BET_SC} SC`
        };
      }

      // Get player's current balances
      const playerResult = await query(`SELECT gc_balance, sc_balance FROM players WHERE id = $1`, [playerId]);

      if (playerResult.rows.length === 0) {
        return { success: false, error: 'Player not found' };
      }

      const currentGcBalance = parseFloat(playerResult.rows[0].gc_balance);
      const currentScBalance = parseFloat(playerResult.rows[0].sc_balance);

      if (currentScBalance < design.cost_sc) {
        return { success: false, error: 'Insufficient Sweeps Coins' };
      }

      // Generate ticket tabs (server-side, never client-side)
      const tabs = this.generateTicketTabs(design);
      const ticketNumber = this.generateTicketNumber();

      // Find the winning tab index if this is a winning ticket
      let winningTabIndex = null;
      for (let i = 0; i < tabs.length; i++) {
        if (typeof tabs[i].value === 'number' && tabs[i].value > 0) {
          winningTabIndex = i;
          break;
        }
      }

      // Start transaction
      const client = await getClient();
      try {
        await client.query('BEGIN');

        // Create ticket
        const ticketResult = await client.query(
          `INSERT INTO pull_tab_tickets (design_id, player_id, ticket_number, tabs, status, claim_status, winning_tab_index)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [designId, playerId, ticketNumber, JSON.stringify(tabs), 'active', 'unclaimed', winningTabIndex]
        );

        const ticket = ticketResult.rows[0];

        // Deduct SC from player balance
        const newScBalance = currentScBalance - design.cost_sc;
        await client.query(`UPDATE players SET sc_balance = $1 WHERE id = $2`, [newScBalance, playerId]);

        // Log transaction
        await client.query(
          `INSERT INTO pull_tab_transactions (player_id, ticket_id, transaction_type, amount_sc, balance_before, balance_after, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            playerId,
            ticket.id,
            'purchase',
            design.cost_sc,
            currentScBalance,
            newScBalance,
            `Purchased CoinKrazy Pull Tab Ticket - ${design.name}`,
          ]
        );

        // Log wallet transaction
        await client.query(
          `INSERT INTO wallet_ledger (player_id, transaction_type, sc_amount, sc_balance_after, description)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            playerId,
            'Pull Tab Purchase',
            -design.cost_sc,
            newScBalance,
            `Purchased CoinKrazy Pull Tab Ticket - ${design.name}`,
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
            `Pull Tab: ${design.name}`
          );
        }

        return {
          success: true,
          ticket: {
            id: ticket.id,
            ticket_number: ticket.ticket_number,
            design_id: ticket.design_id,
            player_id: ticket.player_id,
            tabs: typeof ticket.tabs === 'string' ? JSON.parse(ticket.tabs) : ticket.tabs,
            status: ticket.status,
            claim_status: ticket.claim_status,
            winning_tab_index: ticket.winning_tab_index,
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
   * Reveal a specific tab on a ticket
   */
  static async revealTab(
    ticketId: number,
    tabIndex: number,
    playerId: number
  ): Promise<{ success: boolean; tab?: any; prize?: number; error?: string }> {
    try {
      // Get ticket
      const ticketResult = await query(
        `SELECT * FROM pull_tab_tickets WHERE id = $1 AND player_id = $2`,
        [ticketId, playerId]
      );

      if (ticketResult.rows.length === 0) {
        return { success: false, error: 'Ticket not found' };
      }

      const ticket = ticketResult.rows[0];
      const tabs: PullTabTab[] = typeof ticket.tabs === 'string' ? JSON.parse(ticket.tabs) : ticket.tabs;

      // Check if ticket is still active
      if (ticket.status !== 'active') {
        return { success: false, error: 'Ticket is no longer active' };
      }

      // Check if already claimed
      if (ticket.claim_status === 'claimed') {
        return { success: false, error: 'Ticket already claimed' };
      }

      // Validate tab index
      if (tabIndex < 0 || tabIndex >= tabs.length) {
        return { success: false, error: 'Invalid tab index' };
      }

      // Check if tab already revealed
      if (tabs[tabIndex].revealed) {
        return { success: false, error: 'Tab already revealed' };
      }

      // Reveal the tab
      tabs[tabIndex].revealed = true;
      const tabValue = tabs[tabIndex].value;

      // Update ticket with revealed tab
      await query(
        `UPDATE pull_tab_tickets
         SET tabs = $1, revealed_tabs = array_append(revealed_tabs, $2)
         WHERE id = $3`,
        [JSON.stringify(tabs), tabIndex, ticketId]
      );

      // Check if this is a winning tab (has a number, not 'LOSS')
      const prize = typeof tabValue === 'number' ? tabValue : null;

      return {
        success: true,
        tab: {
          index: tabIndex,
          value: tabValue,
          revealed: true,
        },
        prize: prize || undefined,
      };
    } catch (error) {
      console.error('Failed to reveal tab:', error);
      return { success: false, error: 'Failed to reveal tab' };
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
        `SELECT pkt.*, ptd.name, ptd.cost_sc, ptd.tab_count
         FROM pull_tab_tickets pkt
         JOIN pull_tab_designs ptd ON pkt.design_id = ptd.id
         WHERE pkt.id = $1 AND pkt.player_id = $2`,
        [ticketId, playerId]
      );

      if (ticketResult.rows.length === 0) {
        return { success: false, error: 'Ticket not found' };
      }

      const ticket = ticketResult.rows[0];
      const tabs: PullTabTab[] = typeof ticket.tabs === 'string' ? JSON.parse(ticket.tabs) : ticket.tabs;

      // Check if already claimed
      if (ticket.claim_status === 'claimed') {
        return { success: false, error: 'Prize already claimed' };
      }

      // Find the winning tab (server-side validation)
      let prizeAmount = 0;
      let winningTabIndex = -1;

      for (let i = 0; i < tabs.length; i++) {
        const value = tabs[i].value;
        if (typeof value === 'number' && value > 0) {
          prizeAmount = value;
          winningTabIndex = i;
          break;
        }
      }

      // Apply platform-wide max win cap (double check)
      if (prizeAmount > MAX_WIN_SC) {
        prizeAmount = MAX_WIN_SC;
      }

      // No winning tab = no prize
      if (prizeAmount === 0 || winningTabIndex === -1) {
        return { success: false, error: 'No prize on this ticket' };
      }

      // Get player's current balance
      const playerResult = await query(`SELECT sc_balance FROM players WHERE id = $1`, [playerId]);

      const currentGcBalance = parseFloat(playerResult.rows[0].gc_balance);
      const currentScBalance = parseFloat(playerResult.rows[0].sc_balance);
      const newScBalance = currentScBalance + prizeAmount;

      // Start transaction
      try {
        await query('BEGIN', []);

        // Update ticket claim status
        await query(
          `UPDATE pull_tab_tickets
           SET claim_status = $1, status = $2, claimed_at = NOW()
           WHERE id = $3`,
          ['claimed', 'active', ticketId]
        );

        // Credit prize to player
        await query(`UPDATE players SET sc_balance = $1 WHERE id = $2`, [newScBalance, playerId]);

        // Log winning result
        await query(
          `INSERT INTO pull_tab_results (ticket_id, design_id, player_id, won, prize_amount, winning_tab_index)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [ticketId, ticket.design_id, playerId, true, prizeAmount, winningTabIndex]
        );

        // Log transaction
        await query(
          `INSERT INTO pull_tab_transactions (player_id, ticket_id, transaction_type, amount_sc, balance_before, balance_after, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            playerId,
            ticketId,
            'claim',
            prizeAmount,
            currentScBalance,
            newScBalance,
            `Claimed CoinKrazy Pull Tab Prize - ${prizeAmount} SC`,
          ]
        );

        // Log wallet transaction
        await query(
          `INSERT INTO wallet_ledger (player_id, transaction_type, sc_amount, sc_balance_after, description)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            playerId,
            'Pull Tab Prize Claim',
            prizeAmount,
            newScBalance,
            `Claimed CoinKrazy Pull Tab Prize - ${prizeAmount} SC`,
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
  static async getTicket(ticketId: number, playerId: number): Promise<PullTabTicket | null> {
    try {
      const result = await query(
        `SELECT * FROM pull_tab_tickets WHERE id = $1 AND player_id = $2`,
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
        tabs: typeof row.tabs === 'string' ? JSON.parse(row.tabs) : row.tabs,
        status: row.status,
        claim_status: row.claim_status,
        winning_tab_index: row.winning_tab_index,
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
  static async getPlayerTickets(playerId: number, limit = 50): Promise<PullTabTicket[]> {
    try {
      const result = await query(
        `SELECT * FROM pull_tab_tickets
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
        tabs: typeof row.tabs === 'string' ? JSON.parse(row.tabs) : row.tabs,
        status: row.status,
        claim_status: row.claim_status,
        winning_tab_index: row.winning_tab_index,
        created_at: row.created_at,
      }));
    } catch (error) {
      console.error('Failed to get player tickets:', error);
      return [];
    }
  }
}
