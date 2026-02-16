import { RequestHandler } from 'express';
import { query } from '../db/connection';
import { SlackService } from '../services/slack-service';

// BONUSES
export const listBonuses: RequestHandler = async (req, res) => {
  try {
    const result = await query('SELECT * FROM bonuses ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('List bonuses error:', error);
    res.status(500).json({ error: 'Failed to fetch bonuses' });
  }
};

export const createBonus: RequestHandler = async (req, res) => {
  try {
    const { name, type, amount, percentage, minDeposit, maxClaims, wageringMultiplier } = req.body;

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    // Use defaults for optional fields
    const minDepositValue = minDeposit !== undefined ? minDeposit : 0;
    const maxClaimsValue = maxClaims !== undefined ? maxClaims : 1;
    const wageringMultiplierValue = wageringMultiplier !== undefined ? wageringMultiplier : 35.0;

    const result = await query(
      `INSERT INTO bonuses (name, type, amount, percentage, min_deposit, max_claims, wagering_multiplier)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, type, amount ?? null, percentage ?? null, minDepositValue, maxClaimsValue, wageringMultiplierValue]
    );

    await SlackService.notifyAdminAction(req.user?.email || 'admin', 'Created bonus', `${name} - ${type}`);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create bonus error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to create bonus', details: errorMessage });
  }
};

export const updateBonus: RequestHandler = async (req, res) => {
  try {
    const { bonusId } = req.params;
    const { name, type, amount, percentage, minDeposit, maxClaims, wageringMultiplier, status } = req.body;

    const result = await query(
      `UPDATE bonuses SET name = $1, type = $2, amount = $3, percentage = $4, min_deposit = $5, max_claims = $6, 
      wagering_multiplier = $7, status = $8, updated_at = CURRENT_TIMESTAMP WHERE id = $9 RETURNING *`,
      [name, type, amount, percentage, minDeposit, maxClaims, wageringMultiplier, status, bonusId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update bonus error:', error);
    res.status(500).json({ error: 'Failed to update bonus' });
  }
};

export const deleteBonus: RequestHandler = async (req, res) => {
  try {
    const { bonusId } = req.params;
    await query('DELETE FROM bonuses WHERE id = $1', [bonusId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete bonus error:', error);
    res.status(500).json({ error: 'Failed to delete bonus' });
  }
};

// JACKPOTS
export const listJackpots: RequestHandler = async (req, res) => {
  try {
    const result = await query(
      `SELECT j.*, g.name as game_name, p.username as last_won_by_username 
      FROM jackpots j
      LEFT JOIN games g ON j.game_id = g.id
      LEFT JOIN players p ON j.last_won_by = p.id
      ORDER BY j.updated_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('List jackpots error:', error);
    res.status(500).json({ error: 'Failed to fetch jackpots' });
  }
};

export const createJackpot: RequestHandler = async (req, res) => {
  try {
    const { name, gameId, baseAmount, maxAmount, incrementPercentage } = req.body;

    const result = await query(
      `INSERT INTO jackpots (name, game_id, current_amount, base_amount, max_amount, increment_percentage) 
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, gameId, baseAmount, baseAmount, maxAmount, incrementPercentage]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create jackpot error:', error);
    res.status(500).json({ error: 'Failed to create jackpot' });
  }
};

export const updateJackpotAmount: RequestHandler = async (req, res) => {
  try {
    const { jackpotId } = req.params;
    const { newAmount } = req.body;

    const result = await query(
      'UPDATE jackpots SET current_amount = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [newAmount, jackpotId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update jackpot error:', error);
    res.status(500).json({ error: 'Failed to update jackpot' });
  }
};

export const recordJackpotWin: RequestHandler = async (req, res) => {
  try {
    const { jackpotId, playerId, amountWon } = req.body;

    // Record the win
    await query(
      'INSERT INTO jackpot_wins (jackpot_id, player_id, amount_won) VALUES ($1, $2, $3)',
      [jackpotId, playerId, amountWon]
    );

    // Update jackpot
    const jackpotResult = await query(
      `UPDATE jackpots SET current_amount = base_amount, last_won_by = $1, last_won_at = CURRENT_TIMESTAMP 
      WHERE id = $2 RETURNING *`,
      [playerId, jackpotId]
    );

    // Update player balance
    await query('UPDATE players SET gc_balance = gc_balance + $1 WHERE id = $2', [amountWon, playerId]);

    // Get player email for notification
    const playerResult = await query('SELECT email FROM players WHERE id = $1', [playerId]);
    if (playerResult.rows.length > 0) {
      await SlackService.notifyHighValuePlayer(playerResult.rows[0].email, amountWon, 'Jackpot Winner');
    }

    res.json({ success: true, jackpot: jackpotResult.rows[0] });
  } catch (error) {
    console.error('Record jackpot win error:', error);
    res.status(500).json({ error: 'Failed to record jackpot win' });
  }
};

// MAKE IT RAIN
export const listMakeItRainCampaigns: RequestHandler = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM make_it_rain_campaigns ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('List make it rain campaigns error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
};

export const createMakeItRainCampaign: RequestHandler = async (req, res) => {
  try {
    const { name, description, totalAmount, targetPlayers, startDate, endDate } = req.body;

    const result = await query(
      `INSERT INTO make_it_rain_campaigns (name, description, total_amount, target_players, start_date, end_date, created_by) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, description, totalAmount, targetPlayers, startDate, endDate, req.user?.playerId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create make it rain campaign error:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
};

export const distributeMakeItRainRewards: RequestHandler = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { playerIds, amountPerPlayer } = req.body;

    // Get campaign
    const campaignResult = await query('SELECT * FROM make_it_rain_campaigns WHERE id = $1', [campaignId]);
    if (campaignResult.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Create rewards for each player
    for (const playerId of playerIds) {
      await query(
        'INSERT INTO make_it_rain_rewards (campaign_id, player_id, amount) VALUES ($1, $2, $3)',
        [campaignId, playerId, amountPerPlayer]
      );

      // Update player balance
      await query('UPDATE players SET gc_balance = gc_balance + $1 WHERE id = $2', [amountPerPlayer, playerId]);
    }

    // Update campaign
    const totalDistributed = amountPerPlayer * playerIds.length;
    await query(
      'UPDATE make_it_rain_campaigns SET amount_distributed = amount_distributed + $1, players_participating = $2 WHERE id = $3',
      [totalDistributed, playerIds.length, campaignId]
    );

    res.json({ success: true, distributed: playerIds.length, amount: totalDistributed });
  } catch (error) {
    console.error('Distribute make it rain error:', error);
    res.status(500).json({ error: 'Failed to distribute rewards' });
  }
};

// REDEMPTIONS
export const listRedemptionRequests: RequestHandler = async (req, res) => {
  try {
    const status = (req.query.status as string) || '';
    let whereClause = '';

    if (status) {
      whereClause = `WHERE status = '${status}'`;
    }

    const result = await query(
      `SELECT r.*, p.email, p.username FROM redemption_requests r
      JOIN players p ON r.player_id = p.id
      ${whereClause}
      ORDER BY r.submitted_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('List redemption requests error:', error);
    res.status(500).json({ error: 'Failed to fetch redemption requests' });
  }
};

export const approveRedemption: RequestHandler = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { notes } = req.body;

    // Get request details
    const requestResult = await query(
      'SELECT * FROM redemption_requests WHERE id = $1',
      [requestId]
    );
    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Redemption request not found' });
    }

    const redemptionRequest = requestResult.rows[0];

    // Update request
    await query(
      'UPDATE redemption_requests SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP WHERE id = $3',
      ['approved', req.user?.playerId, requestId]
    );

    // Deduct from player balance
    await query(
      'UPDATE players SET sc_balance = sc_balance - $1 WHERE id = $2',
      [redemptionRequest.amount, redemptionRequest.player_id]
    );

    // Get player for notification
    const playerResult = await query('SELECT email FROM players WHERE id = $1', [redemptionRequest.player_id]);
    if (playerResult.rows.length > 0) {
      await SlackService.notifyWithdrawalApproval(playerResult.rows[0].email, redemptionRequest.amount, true);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Approve redemption error:', error);
    res.status(500).json({ error: 'Failed to approve redemption' });
  }
};

export const rejectRedemption: RequestHandler = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    const requestResult = await query(
      'SELECT * FROM redemption_requests WHERE id = $1',
      [requestId]
    );

    await query(
      'UPDATE redemption_requests SET status = $1, rejected_reason = $2 WHERE id = $3',
      ['rejected', reason, requestId]
    );

    // Get player for notification
    const playerResult = await query('SELECT email FROM players WHERE id = $1', [
      requestResult.rows[0].player_id,
    ]);
    if (playerResult.rows.length > 0) {
      await SlackService.notifyWithdrawalApproval(playerResult.rows[0].email, requestResult.rows[0].amount, false);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Reject redemption error:', error);
    res.status(500).json({ error: 'Failed to reject redemption' });
  }
};
