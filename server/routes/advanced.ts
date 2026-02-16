import { RequestHandler } from 'express';
import { query } from '../db/connection';
import crypto from 'crypto';

// VIP MANAGEMENT
export const listVIPTiers: RequestHandler = async (req, res) => {
  try {
    const result = await query('SELECT * FROM vip_tiers ORDER BY level ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('List VIP tiers error:', error);
    res.status(500).json({ error: 'Failed to fetch VIP tiers' });
  }
};

export const createVIPTier: RequestHandler = async (req, res) => {
  try {
    const { name, level, minWagered, monthlyReload, birthday, exclusiveGames, prioritySupport } = req.body;

    const result = await query(
      `INSERT INTO vip_tiers (name, level, min_wagered, reload_bonus_percentage, birthday_bonus, exclusive_games, priority_support) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, level, minWagered, monthlyReload, birthday, exclusiveGames, prioritySupport]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create VIP tier error:', error);
    res.status(500).json({ error: 'Failed to create VIP tier' });
  }
};

export const promotePlayerToVIP: RequestHandler = async (req, res) => {
  try {
    const { playerId, vipTierId } = req.body;

    const result = await query(
      `INSERT INTO player_vip (player_id, vip_tier_id, promoted_at) 
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (player_id) DO UPDATE SET vip_tier_id = $2, promoted_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [playerId, vipTierId]
    );

    res.json({ success: true, vipStatus: result.rows[0] });
  } catch (error) {
    console.error('Promote player to VIP error:', error);
    res.status(500).json({ error: 'Failed to promote player' });
  }
};

export const getVIPPlayers: RequestHandler = async (req, res) => {
  try {
    const result = await query(
      `SELECT p.id, p.username, p.email, pv.vip_tier_id, vt.name as tier_name, 
      pv.vip_points, pv.month_wagered, pv.promoted_at
      FROM player_vip pv
      JOIN players p ON pv.player_id = p.id
      JOIN vip_tiers vt ON pv.vip_tier_id = vt.id
      ORDER BY vt.level DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get VIP players error:', error);
    res.status(500).json({ error: 'Failed to fetch VIP players' });
  }
};

// FRAUD DETECTION
export const listFraudPatterns: RequestHandler = async (req, res) => {
  try {
    const result = await query('SELECT * FROM fraud_patterns ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('List fraud patterns error:', error);
    res.status(500).json({ error: 'Failed to fetch fraud patterns' });
  }
};

export const createFraudPattern: RequestHandler = async (req, res) => {
  try {
    const { patternName, description, ruleType, thresholdValue, action } = req.body;

    const result = await query(
      `INSERT INTO fraud_patterns (pattern_name, description, rule_type, threshold_value, action) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [patternName, description, ruleType, thresholdValue, action]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create fraud pattern error:', error);
    res.status(500).json({ error: 'Failed to create fraud pattern' });
  }
};

export const listFraudFlags: RequestHandler = async (req, res) => {
  try {
    const status = (req.query.status as string) || '';
    let whereClause = '';

    if (status) {
      whereClause = `WHERE ff.status = '${status}'`;
    }

    const result = await query(
      `SELECT ff.*, p.email, p.username, fp.pattern_name FROM fraud_flags ff
      JOIN players p ON ff.player_id = p.id
      LEFT JOIN fraud_patterns fp ON ff.pattern_id = fp.id
      ${whereClause}
      ORDER BY ff.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('List fraud flags error:', error);
    res.status(500).json({ error: 'Failed to fetch fraud flags' });
  }
};

export const resolveFraudFlag: RequestHandler = async (req, res) => {
  try {
    const { flagId } = req.params;
    const { resolution } = req.body;

    const result = await query(
      'UPDATE fraud_flags SET status = $1, resolved_by = $2, resolved_at = CURRENT_TIMESTAMP, resolution_notes = $3 WHERE id = $4 RETURNING *',
      ['resolved', req.user?.playerId, resolution, flagId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Resolve fraud flag error:', error);
    res.status(500).json({ error: 'Failed to resolve fraud flag' });
  }
};

// AFFILIATE MANAGEMENT
export const listAffiliatePartners: RequestHandler = async (req, res) => {
  try {
    const status = (req.query.status as string) || '';
    let whereClause = '';

    if (status) {
      whereClause = `WHERE status = '${status}'`;
    }

    const result = await query(
      `SELECT * FROM affiliate_partners ${whereClause} ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('List affiliate partners error:', error);
    res.status(500).json({ error: 'Failed to fetch affiliate partners' });
  }
};

export const createAffiliatePartner: RequestHandler = async (req, res) => {
  try {
    const { name, email, phone, website, commissionPercentage } = req.body;

    const result = await query(
      `INSERT INTO affiliate_partners (name, email, phone, website, commission_percentage) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, email, phone, website, commissionPercentage]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create affiliate partner error:', error);
    res.status(500).json({ error: 'Failed to create affiliate partner' });
  }
};

export const approveAffiliatePartner: RequestHandler = async (req, res) => {
  try {
    const { partnerId } = req.params;

    // Generate unique affiliate code
    const uniqueCode = `AFF_${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    // Update partner status
    await query('UPDATE affiliate_partners SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP WHERE id = $3', [
      'approved',
      req.user?.playerId,
      partnerId,
    ]);

    // Create affiliate link
    const linkResult = await query(
      'INSERT INTO affiliate_links (affiliate_id, unique_code) VALUES ($1, $2) RETURNING *',
      [partnerId, uniqueCode]
    );

    res.json({ success: true, link: linkResult.rows[0] });
  } catch (error) {
    console.error('Approve affiliate partner error:', error);
    res.status(500).json({ error: 'Failed to approve affiliate partner' });
  }
};

export const getAffiliateStats: RequestHandler = async (req, res) => {
  try {
    const { partnerId } = req.params;

    const referralsResult = await query(
      'SELECT COUNT(*) as count, SUM(total_wagered) as wagered, SUM(commission_earned) as earned FROM affiliate_referrals WHERE affiliate_id = $1',
      [partnerId]
    );

    const linkClicksResult = await query(
      'SELECT SUM(clicks) as clicks, SUM(conversions) as conversions FROM affiliate_links WHERE affiliate_id = $1',
      [partnerId]
    );

    res.json({
      totalReferrals: parseInt(referralsResult.rows[0]?.count || '0'),
      totalWagered: parseFloat(referralsResult.rows[0]?.wagered || '0'),
      totalEarned: parseFloat(referralsResult.rows[0]?.earned || '0'),
      totalClicks: parseInt(linkClicksResult.rows[0]?.clicks || '0'),
      totalConversions: parseInt(linkClicksResult.rows[0]?.conversions || '0'),
    });
  } catch (error) {
    console.error('Get affiliate stats error:', error);
    res.status(500).json({ error: 'Failed to fetch affiliate stats' });
  }
};

// SUPPORT & TICKETS
export const listSupportTickets: RequestHandler = async (req, res) => {
  try {
    const status = (req.query.status as string) || '';
    const priority = (req.query.priority as string) || '';
    let whereClause = '';
    const params: any[] = [];

    if (status) {
      params.push(status);
      whereClause += ` AND status = $${params.length}`;
    }

    if (priority) {
      params.push(priority);
      whereClause += ` AND priority = $${params.length}`;
    }

    const result = await query(
      `SELECT st.*, p.email, p.username FROM support_tickets st
      JOIN players p ON st.player_id = p.id
      WHERE 1=1 ${whereClause}
      ORDER BY st.created_at DESC`,
      params
    );

    res.json(result.rows);
  } catch (error) {
    console.error('List support tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
};

export const getTicketMessages: RequestHandler = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const result = await query(
      'SELECT * FROM ticket_messages WHERE ticket_id = $1 ORDER BY created_at ASC',
      [ticketId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get ticket messages error:', error);
    res.status(500).json({ error: 'Failed to fetch ticket messages' });
  }
};

export const assignTicket: RequestHandler = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { adminId } = req.body;

    const result = await query(
      'UPDATE support_tickets SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [adminId, ticketId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Assign ticket error:', error);
    res.status(500).json({ error: 'Failed to assign ticket' });
  }
};

export const closeTicket: RequestHandler = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const result = await query(
      'UPDATE support_tickets SET status = $1, resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      ['closed', ticketId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Close ticket error:', error);
    res.status(500).json({ error: 'Failed to close ticket' });
  }
};

// SYSTEM LOGS
export const listSystemLogs: RequestHandler = async (req, res) => {
  try {
    const action = (req.query.action as string) || '';
    const adminId = (req.query.adminId as string) || '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: any[] = [];

    if (action) {
      params.push(`%${action}%`);
      whereClause += ` AND action ILIKE $${params.length}`;
    }

    if (adminId) {
      params.push(adminId);
      whereClause += ` AND admin_id = $${params.length}`;
    }

    params.push(limit);
    params.push(offset);

    const result = await query(
      `SELECT sl.*, a.email as admin_email, p.email as player_email FROM system_logs sl
      LEFT JOIN admin_users a ON sl.admin_id = a.id
      LEFT JOIN players p ON sl.player_id = p.id
      WHERE 1=1 ${whereClause}
      ORDER BY sl.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      logs: result.rows,
      page,
      limit,
    });
  } catch (error) {
    console.error('List system logs error:', error);
    res.status(500).json({ error: 'Failed to fetch system logs' });
  }
};

// API MANAGEMENT
export const listAPIKeys: RequestHandler = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, key_name, key_hash, admin_id, rate_limit, status, last_used_at, created_at, expires_at FROM api_keys ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('List API keys error:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
};

export const createAPIKey: RequestHandler = async (req, res) => {
  try {
    const { keyName, permissions, rateLimit } = req.body;

    // Generate API key
    const apiKey = crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const result = await query(
      `INSERT INTO api_keys (key_name, key_hash, admin_id, permissions, rate_limit) 
      VALUES ($1, $2, $3, $4, $5) RETURNING id, key_name, created_at`,
      [keyName, keyHash, req.user?.playerId, JSON.stringify(permissions || []), rateLimit || 1000]
    );

    res.json({
      success: true,
      keyId: result.rows[0].id,
      apiKey: apiKey, // Only shown once
      message: 'Save this API key securely, it will not be shown again',
    });
  } catch (error) {
    console.error('Create API key error:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
};

export const revokeAPIKey: RequestHandler = async (req, res) => {
  try {
    const { keyId } = req.params;

    await query('UPDATE api_keys SET status = $1 WHERE id = $2', ['revoked', keyId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Revoke API key error:', error);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
};

// NOTIFICATIONS
export const listNotificationTemplates: RequestHandler = async (req, res) => {
  try {
    const result = await query('SELECT * FROM notification_templates ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('List notification templates error:', error);
    res.status(500).json({ error: 'Failed to fetch notification templates' });
  }
};

export const createNotificationTemplate: RequestHandler = async (req, res) => {
  try {
    const { name, type, subject, template, variables } = req.body;

    const result = await query(
      `INSERT INTO notification_templates (name, type, subject, template, variables) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, type, subject, template, JSON.stringify(variables || [])]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create notification template error:', error);
    res.status(500).json({ error: 'Failed to create notification template' });
  }
};

// COMPLIANCE
export const listComplianceLogs: RequestHandler = async (req, res) => {
  try {
    const result = await query(
      `SELECT cl.*, p.email FROM compliance_logs cl
      LEFT JOIN players p ON cl.player_id = p.id
      ORDER BY cl.created_at DESC LIMIT 100`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('List compliance logs error:', error);
    res.status(500).json({ error: 'Failed to fetch compliance logs' });
  }
};

export const listAMLChecks: RequestHandler = async (req, res) => {
  try {
    const result = await query(
      `SELECT ac.*, p.email FROM aml_checks ac
      JOIN players p ON ac.player_id = p.id
      ORDER BY ac.check_date DESC LIMIT 100`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('List AML checks error:', error);
    res.status(500).json({ error: 'Failed to fetch AML checks' });
  }
};

export const verifyAMLCheck: RequestHandler = async (req, res) => {
  try {
    const { checkId } = req.params;
    const { status, riskLevel } = req.body;

    const result = await query(
      'UPDATE aml_checks SET status = $1, risk_level = $2, verified_by = $3, verified_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [status, riskLevel, req.user?.playerId, checkId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Verify AML check error:', error);
    res.status(500).json({ error: 'Failed to verify AML check' });
  }
};
