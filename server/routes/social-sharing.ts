import { RequestHandler } from 'express';
import * as dbQueries from '../db/queries';

export const handleRecordShare: RequestHandler = async (req, res) => {
  try {
    const { gameId, winAmount, gameName, platform, message, shareLink } = req.body;
    const playerId = req.user?.id;

    if (!playerId) return res.status(401).json({ error: 'Unauthorized' });
    if (!platform || !message) return res.status(400).json({ error: 'Platform and message required' });

    const result = await dbQueries.recordSocialShare(
      playerId,
      gameId || null,
      winAmount || 0,
      gameName || 'Unknown Game',
      platform,
      message,
      shareLink || null
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error recording social share:', error);
    res.status(500).json({ error: 'Failed to record share' });
  }
};

export const handleGetShareHistory: RequestHandler = async (req, res) => {
  try {
    const playerId = req.user?.id;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!playerId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await dbQueries.getSocialShareHistory(playerId, limit);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching share history:', error);
    res.status(500).json({ error: 'Failed to fetch share history' });
  }
};

export const handleRecordShareResponse: RequestHandler = async (req, res) => {
  try {
    const { socialShareId, responseType, responseData, respondentId } = req.body;

    if (!socialShareId || !responseType) {
      return res.status(400).json({ error: 'socialShareId and responseType required' });
    }

    const result = await dbQueries.recordSocialShareResponse(
      socialShareId,
      responseType,
      responseData || {},
      respondentId || null
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error recording share response:', error);
    res.status(500).json({ error: 'Failed to record response' });
  }
};

export const handleGetShareStats: RequestHandler = async (req, res) => {
  try {
    const result = await dbQueries.getSocialShareStats();
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching share stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

export const generateShareMessage = (gameName: string, winAmount: number): string => {
  return `🎉 I just won ${winAmount} SC playing ${gameName} on CoinKrazy Social Casino! 🎰 Join me and win big! 💰`;
};
