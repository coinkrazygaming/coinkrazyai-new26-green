import { RequestHandler } from 'express';
import * as dbQueries from '../db/queries';

export const handleGetOnboardingProgress: RequestHandler = async (req, res) => {
  try {
    const playerId = req.user?.id;

    if (!playerId) return res.status(401).json({ error: 'Unauthorized' });

    let result = await dbQueries.getKYCOnboardingProgress(playerId);

    if (result.rows.length === 0) {
      // Create initial progress
      result = await dbQueries.createKYCOnboardingProgress(playerId);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting onboarding progress:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
};

export const handleUpdateOnboardingStep: RequestHandler = async (req, res) => {
  try {
    const playerId = req.user?.id;
    const { step, identityVerified, addressVerified, paymentVerified, emailVerified, phoneVerified } = req.body;

    if (!playerId) return res.status(401).json({ error: 'Unauthorized' });
    if (!step) return res.status(400).json({ error: 'Step required' });

    const verificationData = {
      identityVerified: identityVerified || false,
      addressVerified: addressVerified || false,
      paymentVerified: paymentVerified || false,
      emailVerified: emailVerified || false,
      phoneVerified: phoneVerified || false
    };

    const result = await dbQueries.updateKYCOnboardingStep(playerId, step, verificationData);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating onboarding step:', error);
    res.status(500).json({ error: 'Failed to update step' });
  }
};

export const handleCompleteOnboarding: RequestHandler = async (req, res) => {
  try {
    const playerId = req.user?.id;

    if (!playerId) return res.status(401).json({ error: 'Unauthorized' });

    // Mark all steps as verified
    const verificationData = {
      identityVerified: true,
      addressVerified: true,
      paymentVerified: true,
      emailVerified: true,
      phoneVerified: true
    };

    const result = await dbQueries.updateKYCOnboardingStep(playerId, 5, verificationData);

    // Also update player's KYC status
    await dbQueries.updateKYCStatus(playerId, 'Full', true);

    res.json({
      success: true,
      progress: result.rows[0],
      message: 'KYC onboarding completed successfully!'
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
};

export const handleSkipOnboarding: RequestHandler = async (req, res) => {
  try {
    const playerId = req.user?.id;

    if (!playerId) return res.status(401).json({ error: 'Unauthorized' });

    // Skip for now but keep tracking
    const result = await dbQueries.query(
      `UPDATE kyc_onboarding_progress
       SET last_prompted_at = NOW(), updated_at = NOW()
       WHERE player_id = $1
       RETURNING *`,
      [playerId]
    );

    res.json({
      success: true,
      progress: result.rows[0],
      message: 'KYC skipped for now. You can complete it later from your profile.'
    });
  } catch (error) {
    console.error('Error skipping onboarding:', error);
    res.status(500).json({ error: 'Failed to skip onboarding' });
  }
};

export const handleGetOnboardingSteps = (req: any, res: any) => {
  const steps = [
    {
      step: 1,
      title: 'Identity Verification',
      description: 'Verify your identity with a government-issued ID',
      aiMessage: 'Hi! I\'m LuckyAI. Let\'s start by verifying your identity. Please upload a clear photo of your government-issued ID.',
      fields: ['idType', 'idNumber', 'expiryDate']
    },
    {
      step: 2,
      title: 'Address Verification',
      description: 'Confirm your residential address',
      aiMessage: 'Great! Now let\'s verify your address. Please upload a recent utility bill or bank statement showing your current address.',
      fields: ['address', 'city', 'state', 'zipCode']
    },
    {
      step: 3,
      title: 'Payment Verification',
      description: 'Add and verify your payment method',
      aiMessage: 'Perfect! Now let\'s set up your payment method. You can add PayPal, Cash App, or a bank account.',
      fields: ['paymentMethod', 'accountDetails']
    },
    {
      step: 4,
      title: 'Email & Phone Verification',
      description: 'Verify your email and phone number',
      aiMessage: 'Almost done! Let\'s verify your email and phone number. We\'ll send you a verification code.',
      fields: ['email', 'phone']
    },
    {
      step: 5,
      title: 'Review & Confirm',
      description: 'Review your information and complete KYC',
      aiMessage: 'Excellent! Let\'s review everything. Once you confirm, your account will be fully verified and you\'ll unlock all features!',
      fields: []
    }
  ];

  res.json(steps);
};
