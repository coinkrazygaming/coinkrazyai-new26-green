import { RequestHandler } from 'express';
import * as dbQueries from '../db/queries';
import { emailService } from '../services/email-service';

const DAILY_BONUS_AMOUNTS = [
  { day: 1, sc: 0.5, gc: 100 },
  { day: 2, sc: 1, gc: 200 },
  { day: 3, sc: 1.5, gc: 300 },
  { day: 4, sc: 2, gc: 400 },
  { day: 5, sc: 2.5, gc: 500 },
  { day: 6, sc: 3, gc: 750 },
  { day: 7, sc: 5, gc: 1000 }, // 7th day bonus is better
];

export const handleGetDailyBonus: RequestHandler = async (req, res) => {
  try {
    const playerId = req.user?.id;

    if (!playerId) return res.status(401).json({ error: 'Unauthorized' });

    // Get the latest bonus record
    const result = await dbQueries.getDailyLoginBonus(playerId);
    const lastBonus = result.rows[0];

    if (!lastBonus) {
      // First time - create initial bonus
      const nextAvailableAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      const newBonus = await dbQueries.createDailyLoginBonus(playerId, 1, 0.5, 100, nextAvailableAt);
      return res.json({ ...newBonus.rows[0], canClaim: true });
    }

    // Check if bonus is available to claim
    const now = new Date();
    const nextAvailable = new Date(lastBonus.next_available_at);
    const canClaim = now >= nextAvailable && lastBonus.status === 'available';

    if (canClaim && lastBonus.claimed_at) {
      // Calculate next bonus day
      const nextDay = (lastBonus.bonus_day % 7) + 1;
      const nextBonusAmount = DAILY_BONUS_AMOUNTS[nextDay - 1];
      const nextAvailableAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      const newBonus = await dbQueries.createDailyLoginBonus(
        playerId,
        nextDay,
        nextBonusAmount.sc,
        nextBonusAmount.gc,
        nextAvailableAt
      );
      
      return res.json({ ...newBonus.rows[0], canClaim: true });
    }

    res.json({ ...lastBonus, canClaim });
  } catch (error) {
    console.error('Error getting daily bonus:', error);
    res.status(500).json({ error: 'Failed to get daily bonus' });
  }
};

export const handleClaimDailyBonus: RequestHandler = async (req, res) => {
  try {
    const playerId = req.user?.id;

    if (!playerId) return res.status(401).json({ error: 'Unauthorized' });

    // Get current bonus
    const result = await dbQueries.getDailyLoginBonus(playerId);
    const currentBonus = result.rows[0];

    if (!currentBonus) {
      return res.status(400).json({ error: 'No active bonus found' });
    }

    // Check if can claim
    const now = new Date();
    const nextAvailable = new Date(currentBonus.next_available_at);
    
    if (now < nextAvailable || currentBonus.status !== 'available') {
      return res.status(400).json({ error: 'Bonus not yet available to claim' });
    }

    // Claim the bonus
    const nextAvailableAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const claimResult = await dbQueries.claimDailyLoginBonus(playerId, nextAvailableAt);
    const claimedBonus = claimResult.rows[0];

    // Add bonus to player's wallet
    await dbQueries.recordWalletTransaction(
      playerId,
      'DailyLoginBonus',
      claimedBonus.amount_gc,
      claimedBonus.amount_sc,
      `Daily Login Bonus - Day ${claimedBonus.bonus_day}`
    );

    // Get player email for notification
    const playerResult = await dbQueries.getPlayerById(playerId);
    if (playerResult.rows[0]) {
      const player = playerResult.rows[0];
      const nextDay = (claimedBonus.bonus_day % 7) + 1;

      // Send email notification
      await emailService.sendDailyBonusClaimedNotification(
        player.email,
        player.name || player.username,
        claimedBonus.amount_sc,
        nextDay
      );
    }

    res.json({
      success: true,
      bonus: claimedBonus,
      message: `You claimed ${claimedBonus.amount_sc} SC and ${claimedBonus.amount_gc} GC!`
    });
  } catch (error) {
    console.error('Error claiming daily bonus:', error);
    res.status(500).json({ error: 'Failed to claim bonus' });
  }
};

export const handleGetBonusStreak: RequestHandler = async (req, res) => {
  try {
    const playerId = req.user?.id;

    if (!playerId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await dbQueries.getDailyLoginBonus(playerId);
    const bonus = result.rows[0];

    if (!bonus) {
      return res.json({ streak: 0, nextBonus: DAILY_BONUS_AMOUNTS[0] });
    }

    const nextDay = (bonus.bonus_day % 7) + 1;
    const nextBonus = DAILY_BONUS_AMOUNTS[nextDay - 1];

    res.json({
      currentDay: bonus.bonus_day,
      currentBonus: { sc: bonus.amount_sc, gc: bonus.amount_gc },
      nextDay,
      nextBonus,
      lastClaimedAt: bonus.claimed_at,
      nextAvailableAt: bonus.next_available_at
    });
  } catch (error) {
    console.error('Error getting streak:', error);
    res.status(500).json({ error: 'Failed to get streak' });
  }
};
