import { RequestHandler } from 'express';
import { db } from '../db/connection';

/**
 * Generate unique referral code for player
 */
export const handleGenerateReferralCode: RequestHandler = async (req, res) => {
  const playerId = (req as any).playerId;

  if (!playerId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    // Check if player already has a referral link
    const existing = await db.query(
      `SELECT * FROM referral_links WHERE referrer_id = $1`,
      [playerId]
    );

    if (existing.rows.length > 0) {
      return res.json({
        success: true,
        data: existing.rows[0],
      });
    }

    // Generate unique code
    const code = `REF${playerId}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const result = await db.query(
      `INSERT INTO referral_links (referrer_id, unique_code)
       VALUES ($1, $2)
       RETURNING *`,
      [playerId, code]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Failed to generate referral code:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Track referral click
 */
export const handleTrackReferralClick: RequestHandler = async (req, res) => {
  const { code } = req.params;

  if (!code) {
    return res.status(400).json({ success: false, error: 'Missing referral code' });
  }

  try {
    // Update click count
    await db.query(
      `UPDATE referral_links 
       SET clicks = clicks + 1
       WHERE unique_code = $1`,
      [code]
    );

    // Get referral link info
    const result = await db.query(
      `SELECT * FROM referral_links WHERE unique_code = $1`,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Invalid referral code' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Failed to track referral:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Complete referral when new player signs up
 */
export const handleCompleteReferral: RequestHandler = async (req, res) => {
  const { code, referred_player_id } = req.body;

  if (!code || !referred_player_id) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    // Find referral link
    const refResult = await db.query(
      `SELECT * FROM referral_links WHERE unique_code = $1`,
      [code]
    );

    if (refResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Invalid referral code' });
    }

    const referralLink = refResult.rows[0];
    const referrer_id = referralLink.referrer_id;

    // Check if referred player exists
    const playerResult = await db.query(
      `SELECT * FROM players WHERE id = $1`,
      [referred_player_id]
    );

    if (playerResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    // Create referral claim
    const referralBonus_sc = 5.0; // $5 in SC
    const referralBonus_gc = 500; // 500 GC

    const claimResult = await db.query(
      `INSERT INTO referral_claims 
       (referrer_id, referred_player_id, referral_code, status, referral_bonus_sc, referral_bonus_gc, claimed_at)
       VALUES ($1, $2, $3, 'completed', $4, $5, NOW())
       ON CONFLICT (referrer_id, referred_player_id) DO UPDATE
       SET status = 'completed', claimed_at = NOW()
       RETURNING *`,
      [referrer_id, referred_player_id, code, referralBonus_sc, referralBonus_gc]
    );

    // Add bonus to referrer wallet
    await db.query(
      `UPDATE players 
       SET sc_balance = sc_balance + $1, gc_balance = gc_balance + $2, updated_at = NOW()
       WHERE id = $3`,
      [referralBonus_sc, referralBonus_gc, referrer_id]
    );

    // Record transaction
    await db.query(
      `INSERT INTO wallet_transactions (player_id, type, amount, description)
       VALUES ($1, 'Bonus', $2, $3)`,
      [referrer_id, referralBonus_sc, `Referral Bonus - New player signup`]
    );

    // Update referral link conversion count
    await db.query(
      `UPDATE referral_links 
       SET conversions = conversions + 1, total_referral_bonus = total_referral_bonus + $1
       WHERE referrer_id = $2`,
      [referralBonus_sc, referrer_id]
    );

    res.json({
      success: true,
      data: {
        claim: claimResult.rows[0],
        bonus_awarded: {
          sc: referralBonus_sc,
          gc: referralBonus_gc,
        },
      },
    });
  } catch (error: any) {
    console.error('Failed to complete referral:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get player's referral stats
 */
export const handleGetReferralStats: RequestHandler = async (req, res) => {
  const playerId = (req as any).playerId;

  if (!playerId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    // Get referral link
    const linkResult = await db.query(
      `SELECT * FROM referral_links WHERE referrer_id = $1`,
      [playerId]
    );

    // Get referral claims
    const claimsResult = await db.query(
      `SELECT * FROM referral_claims 
       WHERE referrer_id = $1
       ORDER BY claimed_at DESC`,
      [playerId]
    );

    res.json({
      success: true,
      data: {
        referral_link: linkResult.rows.length > 0 ? linkResult.rows[0] : null,
        referrals: claimsResult.rows,
        stats: {
          total_clicks: linkResult.rows.length > 0 ? linkResult.rows[0].clicks : 0,
          total_conversions: linkResult.rows.length > 0 ? linkResult.rows[0].conversions : 0,
          total_bonus_earned: linkResult.rows.length > 0 ? linkResult.rows[0].total_referral_bonus : 0,
        },
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch referral stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get global referral leaderboard
 */
export const handleGetReferralLeaderboard: RequestHandler = async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;

  try {
    const result = await db.query(
      `SELECT 
        p.id,
        p.username,
        p.name,
        rl.conversions,
        rl.total_referral_bonus,
        rl.clicks,
        ROW_NUMBER() OVER (ORDER BY rl.total_referral_bonus DESC) as rank
       FROM players p
       JOIN referral_links rl ON p.id = rl.referrer_id
       ORDER BY rl.total_referral_bonus DESC
       LIMIT $1`,
      [limit]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('Failed to fetch referral leaderboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
