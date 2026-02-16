import { RequestHandler } from 'express';
import * as dbQueries from '../db/queries';
import * as crypto from 'crypto';

// Simple encryption for sensitive data (in production, use proper encryption)
const encryptData = (data: string): string => {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY || 'secret-key');
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const decryptData = (encrypted: string): string => {
  const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY || 'secret-key');
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

export const handleCreatePaymentMethod: RequestHandler = async (req, res) => {
  try {
    const playerId = req.user?.id;
    const { methodType, bankAccountHolder, bankName, accountNumber, routingNumber, accountType, paypalEmail, cashappHandle } = req.body;

    if (!playerId) return res.status(401).json({ error: 'Unauthorized' });
    if (!methodType) return res.status(400).json({ error: 'Method type required' });

    // Encrypt sensitive data
    const methodData = {
      bankAccountHolder,
      bankName,
      accountNumber: accountNumber ? encryptData(accountNumber) : null,
      routingNumber: routingNumber ? encryptData(routingNumber) : null,
      accountType,
      paypalEmail,
      cashappHandle
    };

    const result = await dbQueries.createPaymentMethod(playerId, methodType, methodData);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating payment method:', error);
    res.status(500).json({ error: 'Failed to create payment method' });
  }
};

export const handleGetPaymentMethods: RequestHandler = async (req, res) => {
  try {
    const playerId = req.user?.id;

    if (!playerId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await dbQueries.getPaymentMethods(playerId);
    
    // Don't return sensitive data in response
    const methods = result.rows.map(m => ({
      id: m.id,
      methodType: m.method_type,
      isPrimary: m.is_primary,
      isVerified: m.is_verified,
      lastDigits: m.method_type === 'bank' ? '****' : null,
      paypalEmail: m.paypal_email ? m.paypal_email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null,
      cashappHandle: m.cashapp_handle,
      bankName: m.bank_name,
      accountType: m.account_type,
      verifiedAt: m.verified_at,
      lastUsedAt: m.last_used_at,
      createdAt: m.created_at
    }));

    res.json(methods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
};

export const handleSetPrimaryPaymentMethod: RequestHandler = async (req, res) => {
  try {
    const playerId = req.user?.id;
    const { methodId } = req.body;

    if (!playerId) return res.status(401).json({ error: 'Unauthorized' });
    if (!methodId) return res.status(400).json({ error: 'Method ID required' });

    const result = await dbQueries.setPrimaryPaymentMethod(playerId, methodId);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error setting primary method:', error);
    res.status(500).json({ error: 'Failed to set primary method' });
  }
};

export const handleDeletePaymentMethod: RequestHandler = async (req, res) => {
  try {
    const playerId = req.user?.id;
    const { methodId } = req.body;

    if (!playerId) return res.status(401).json({ error: 'Unauthorized' });
    if (!methodId) return res.status(400).json({ error: 'Method ID required' });

    const result = await dbQueries.deletePaymentMethod(methodId, playerId);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    res.json({ success: true, message: 'Payment method deleted' });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ error: 'Failed to delete payment method' });
  }
};

export const handleVerifyPaymentMethod: RequestHandler = async (req, res) => {
  try {
    const playerId = req.user?.id;
    const { methodId, verificationCode } = req.body;

    if (!playerId) return res.status(401).json({ error: 'Unauthorized' });
    if (!methodId || !verificationCode) {
      return res.status(400).json({ error: 'Method ID and verification code required' });
    }

    // In production, verify with payment processor
    // For now, we'll just mark as verified
    const result = await dbQueries.query(
      `UPDATE player_payment_methods 
       SET is_verified = TRUE, verified_at = NOW()
       WHERE id = $1 AND player_id = $2
       RETURNING *`,
      [methodId, playerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    res.json({ 
      success: true, 
      message: 'Payment method verified',
      method: result.rows[0]
    });
  } catch (error) {
    console.error('Error verifying payment method:', error);
    res.status(500).json({ error: 'Failed to verify payment method' });
  }
};
