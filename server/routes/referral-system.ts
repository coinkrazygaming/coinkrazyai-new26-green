import { RequestHandler } from 'express';
import * as dbQueries from '../db/queries';

const generateReferralCode = (playerId: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = `REF-${playerId}-`;
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const handleGetOrCreateReferralLink: RequestHandler = async (req, res) => {
  try {
    const playerId = req.user?.id;

    if (!playerId) return res.status(401).json({ error: 'Unauthorized' });

    // Check if referral link exists
    let linkResult = await dbQueries.getReferralLink(playerId);
    
    if (linkResult.rows.length === 0) {
      // Create new referral link
      const uniqueCode = generateReferralCode(playerId);
      linkResult = await dbQueries.createReferralLink(playerId, uniqueCode);
    }

    const link = linkResult.rows[0];
    res.json({
      ...link,
      referralUrl: `${process.env.FRONTEND_URL || 'https://coinkrazy.io'}/register?ref=${link.unique_code}`
    });
  } catch (error) {
    console.error('Error getting referral link:', error);
    res.status(500).json({ error: 'Failed to get referral link' });
  }
};

export const handleRegisterWithReferral: RequestHandler = async (req, res) => {
  try {
    const { referralCode, playerId } = req.body;

    if (!referralCode || !playerId) {
      return res.status(400).json({ error: 'Referral code and player ID required' });
    }

    // Find referrer
    const linkResult = await dbQueries.getReferralLinkByCode(referralCode);
    
    if (linkResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid referral code' });
    }

    const referralLink = linkResult.rows[0];
    const referrerId = referralLink.referrer_id;

    // Create referral claim
    const bonusSc = 2.5; // Reward for referrer
    const bonusGc = 500;
    
    const claimResult = await dbQueries.createReferralClaim(
      referrerId,
      playerId,
      referralCode,
      bonusSc,
      bonusGc
    );

    res.json({
      success: true,
      claim: claimResult.rows[0],
      referrerReward: { sc: bonusSc, gc: bonusGc }
    });
  } catch (error) {
    console.error('Error registering with referral:', error);
    res.status(500).json({ error: 'Failed to process referral' });
  }
};

export const handleCompleteReferralClaim: RequestHandler = async (req, res) => {
  try {
    const { claimId } = req.body;

    if (!claimId) return res.status(400).json({ error: 'Claim ID required' });

    // Get claim details
    const claimResult = await dbQueries.query(
      `SELECT * FROM referral_claims WHERE id = $1`,
      [claimId]
    );

    if (claimResult.rows.length === 0) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    const claim = claimResult.rows[0];

    // Complete the claim
    const completedResult = await dbQueries.completeReferralClaim(claimId);
    const completedClaim = completedResult.rows[0];

    // Award bonus to referrer
    if (completedClaim.status === 'completed') {
      await dbQueries.recordWalletTransaction(
        claim.referrer_id,
        'ReferralBonus',
        claim.referral_bonus_gc,
        claim.referral_bonus_sc,
        `Referral bonus for inviting ${claim.referred_player_id}`
      );
    }

    res.json({
      success: true,
      claim: completedClaim,
      bonusAwarded: {
        sc: claim.referral_bonus_sc,
        gc: claim.referral_bonus_gc
      }
    });
  } catch (error) {
    console.error('Error completing referral claim:', error);
    res.status(500).json({ error: 'Failed to complete claim' });
  }
};

export const handleGetReferralStats: RequestHandler = async (req, res) => {
  try {
    const playerId = req.user?.id;

    if (!playerId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await dbQueries.getReferralStats(playerId);
    
    if (result.rows.length === 0) {
      return res.json({
        uniqueCode: '',
        totalReferrals: 0,
        completedReferrals: 0,
        totalScEarned: 0,
        totalGcEarned: 0
      });
    }

    const stats = result.rows[0];
    res.json({
      uniqueCode: stats.unique_code,
      totalReferrals: stats.total_referrals || 0,
      completedReferrals: stats.completed_referrals || 0,
      totalScEarned: stats.total_sc_earned || 0,
      totalGcEarned: stats.total_gc_earned || 0
    });
  } catch (error) {
    console.error('Error getting referral stats:', error);
    res.status(500).json({ error: 'Failed to get referral stats' });
  }
};
