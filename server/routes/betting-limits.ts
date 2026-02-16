import { RequestHandler } from 'express';
import * as dbQueries from '../db/queries';

// Default limits
const DEFAULT_LIMITS = {
  slots: { minBetSc: 0.01, maxBetSc: 5.00, maxWinPerSpinSc: 20.00, minRedemptionSc: 100.00 },
  casino: { minBetSc: 0.01, maxBetSc: 5.00, maxWinPerSpinSc: 20.00, minRedemptionSc: 100.00 },
  scratch: { minBetSc: 0.01, maxBetSc: 5.00, maxWinPerSpinSc: 20.00, minRedemptionSc: 100.00 },
  pull_tabs: { minBetSc: 0.01, maxBetSc: 5.00, maxWinPerSpinSc: 20.00, minRedemptionSc: 100.00 },
  sportsbook: { minBetSc: 0.01, maxBetSc: 5.00, maxWinPerSpinSc: 20.00, minRedemptionSc: 100.00 }
};

export const handleGetBettingLimits: RequestHandler = async (req, res) => {
  try {
    const gameType = req.query.gameType as string || null;

    const result = await dbQueries.getBettingLimits(gameType);
    
    if (result.rows.length === 0) {
      // Return default limits
      if (gameType) {
        return res.json(DEFAULT_LIMITS[gameType as keyof typeof DEFAULT_LIMITS] || DEFAULT_LIMITS.slots);
      }
      return res.json(DEFAULT_LIMITS);
    }

    if (gameType) {
      return res.json(result.rows[0]);
    }

    // Convert to object keyed by game type
    const limitsMap: any = {};
    result.rows.forEach(row => {
      limitsMap[row.game_type] = {
        minBetSc: parseFloat(row.min_bet_sc),
        maxBetSc: parseFloat(row.max_bet_sc),
        maxWinPerSpinSc: parseFloat(row.max_win_per_spin_sc),
        minRedemptionSc: parseFloat(row.min_redemption_sc)
      };
    });

    res.json(limitsMap);
  } catch (error) {
    console.error('Error fetching betting limits:', error);
    res.status(500).json({ error: 'Failed to fetch betting limits' });
  }
};

export const handleUpdateBettingLimits: RequestHandler = async (req, res) => {
  try {
    const { gameType, minBetSc, maxBetSc, maxWinPerSpinSc, minRedemptionSc } = req.body;

    if (!gameType) return res.status(400).json({ error: 'Game type required' });

    // Validate limits
    if (minBetSc >= maxBetSc) {
      return res.status(400).json({ error: 'Minimum bet must be less than maximum bet' });
    }

    if (maxWinPerSpinSc < maxBetSc) {
      return res.status(400).json({ error: 'Maximum win must be at least equal to maximum bet' });
    }

    if (minRedemptionSc < maxWinPerSpinSc) {
      return res.status(400).json({ error: 'Minimum redemption must be at least equal to maximum win' });
    }

    const limits = {
      minBetSc,
      maxBetSc,
      maxWinPerSpinSc,
      minRedemptionSc
    };

    const result = await dbQueries.updateBettingLimits(gameType, limits);
    res.json({
      success: true,
      gameType,
      limits: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating betting limits:', error);
    res.status(500).json({ error: 'Failed to update betting limits' });
  }
};

export const handleValidateBet: RequestHandler = async (req, res) => {
  try {
    const { gameType, betAmount } = req.body;

    if (!gameType || !betAmount) {
      return res.status(400).json({ error: 'Game type and bet amount required' });
    }

    const limitsResult = await dbQueries.getBettingLimits(gameType);
    let limits = limitsResult.rows[0];

    if (!limits) {
      limits = DEFAULT_LIMITS[gameType as keyof typeof DEFAULT_LIMITS] || DEFAULT_LIMITS.slots;
    }

    const minBet = parseFloat(limits.min_bet_sc || limits.minBetSc);
    const maxBet = parseFloat(limits.max_bet_sc || limits.maxBetSc);

    if (betAmount < minBet) {
      return res.json({
        valid: false,
        error: `Minimum bet is ${minBet} SC`,
        minBet,
        maxBet
      });
    }

    if (betAmount > maxBet) {
      return res.json({
        valid: false,
        error: `Maximum bet is ${maxBet} SC`,
        minBet,
        maxBet
      });
    }

    res.json({
      valid: true,
      betAmount,
      minBet,
      maxBet
    });
  } catch (error) {
    console.error('Error validating bet:', error);
    res.status(500).json({ error: 'Failed to validate bet' });
  }
};

export const handleValidateWin: RequestHandler = async (req, res) => {
  try {
    const { gameType, winAmount } = req.body;

    if (!gameType || winAmount === undefined) {
      return res.status(400).json({ error: 'Game type and win amount required' });
    }

    const limitsResult = await dbQueries.getBettingLimits(gameType);
    let limits = limitsResult.rows[0];

    if (!limits) {
      limits = DEFAULT_LIMITS[gameType as keyof typeof DEFAULT_LIMITS] || DEFAULT_LIMITS.slots;
    }

    const maxWinPerSpin = parseFloat(limits.max_win_per_spin_sc || limits.maxWinPerSpinSc);

    let adjustedWin = winAmount;
    let capped = false;

    if (winAmount > maxWinPerSpin) {
      adjustedWin = maxWinPerSpin;
      capped = true;
    }

    res.json({
      originalWin: winAmount,
      adjustedWin,
      maxWinPerSpin,
      capped,
      message: capped ? `Win capped at ${maxWinPerSpin} SC` : 'Win is within limits'
    });
  } catch (error) {
    console.error('Error validating win:', error);
    res.status(500).json({ error: 'Failed to validate win' });
  }
};

export const handleValidateRedemption: RequestHandler = async (req, res) => {
  try {
    const { gameType, redemptionAmount } = req.body;

    if (!gameType || !redemptionAmount) {
      return res.status(400).json({ error: 'Game type and redemption amount required' });
    }

    const limitsResult = await dbQueries.getBettingLimits(gameType);
    let limits = limitsResult.rows[0];

    if (!limits) {
      limits = DEFAULT_LIMITS[gameType as keyof typeof DEFAULT_LIMITS] || DEFAULT_LIMITS.slots;
    }

    const minRedemption = parseFloat(limits.min_redemption_sc || limits.minRedemptionSc);

    if (redemptionAmount < minRedemption) {
      return res.json({
        valid: false,
        error: `Minimum redemption is ${minRedemption} SC`,
        minRedemption,
        amount: redemptionAmount
      });
    }

    res.json({
      valid: true,
      amount: redemptionAmount,
      minRedemption
    });
  } catch (error) {
    console.error('Error validating redemption:', error);
    res.status(500).json({ error: 'Failed to validate redemption' });
  }
};
