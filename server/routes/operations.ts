import { RequestHandler } from 'express';
import { query } from '../db/connection';
import { SlackService } from '../services/slack-service';

// SECURITY MANAGEMENT
export const listSecurityAlerts: RequestHandler = async (req, res) => {
  try {
    const status = (req.query.status as string) || '';
    let whereClause = '';

    if (status) {
      whereClause = `WHERE status = '${status}'`;
    }

    const result = await query(
      `SELECT sa.*, p.email, p.username FROM security_alerts sa
      LEFT JOIN players p ON sa.player_id = p.id
      ${whereClause}
      ORDER BY sa.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('List security alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch security alerts' });
  }
};

export const resolveSecurityAlert: RequestHandler = async (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolution } = req.body;

    const result = await query(
      'UPDATE security_alerts SET status = $1, resolved_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      ['resolved', alertId]
    );

    // Log action
    await query(
      'INSERT INTO system_logs (admin_id, action, resource_type, resource_id) VALUES ($1, $2, $3, $4)',
      [req.user?.playerId, `Resolved security alert: ${resolution}`, 'security_alert', alertId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Resolve security alert error:', error);
    res.status(500).json({ error: 'Failed to resolve security alert' });
  }
};

// CONTENT MANAGEMENT
export const listCMSPages: RequestHandler = async (req, res) => {
  try {
    const status = (req.query.status as string) || '';
    let whereClause = '';

    if (status) {
      whereClause = `WHERE status = '${status}'`;
    }

    const result = await query(
      `SELECT * FROM cms_pages ${whereClause} ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('List CMS pages error:', error);
    res.status(500).json({ error: 'Failed to fetch CMS pages' });
  }
};

export const createCMSPage: RequestHandler = async (req, res) => {
  try {
    const { title, slug, content, pageType, metaDescription, featuredImage } = req.body;

    const result = await query(
      `INSERT INTO cms_pages (title, slug, content, page_type, meta_description, featured_image, created_by) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, slug, content, pageType, metaDescription, featuredImage, req.user?.playerId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create CMS page error:', error);
    res.status(500).json({ error: 'Failed to create CMS page' });
  }
};

export const updateCMSPage: RequestHandler = async (req, res) => {
  try {
    const { pageId } = req.params;
    const { title, content, status, metaDescription, featuredImage } = req.body;

    const result = await query(
      `UPDATE cms_pages SET title = $1, content = $2, status = $3, meta_description = $4, 
      featured_image = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *`,
      [title, content, status, metaDescription, featuredImage, pageId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update CMS page error:', error);
    res.status(500).json({ error: 'Failed to update CMS page' });
  }
};

export const deleteCMSPage: RequestHandler = async (req, res) => {
  try {
    const { pageId } = req.params;
    await query('DELETE FROM cms_pages WHERE id = $1', [pageId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete CMS page error:', error);
    res.status(500).json({ error: 'Failed to delete CMS page' });
  }
};

// BANNERS
export const listCMSBanners: RequestHandler = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM cms_banners WHERE enabled = true ORDER BY display_order'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('List CMS banners error:', error);
    res.status(500).json({ error: 'Failed to fetch CMS banners' });
  }
};

export const createCMSBanner: RequestHandler = async (req, res) => {
  try {
    const { title, imageUrl, linkUrl, placement, startDate, endDate, displayOrder } = req.body;

    const result = await query(
      `INSERT INTO cms_banners (title, image_url, link_url, placement, start_date, end_date, display_order, created_by) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, imageUrl, linkUrl, placement, startDate, endDate, displayOrder, req.user?.playerId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create CMS banner error:', error);
    res.status(500).json({ error: 'Failed to create CMS banner' });
  }
};

// CASINO SETTINGS
export const getCasinoSettings: RequestHandler = async (req, res) => {
  try {
    const result = await query('SELECT * FROM casino_settings');
    
    const settings: Record<string, any> = {};
    result.rows.forEach(row => {
      let value: any = row.setting_value;
      if (row.data_type === 'boolean') {
        value = value === 'true' || value === true;
      } else if (row.data_type === 'number') {
        value = parseFloat(value);
      }
      settings[row.setting_key] = value;
    });

    res.json(settings);
  } catch (error) {
    console.error('Get casino settings error:', error);
    res.status(500).json({ error: 'Failed to fetch casino settings' });
  }
};

export const updateCasinoSettings: RequestHandler = async (req, res) => {
  try {
    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      const dataType = typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string';
      
      await query(
        `INSERT INTO casino_settings (setting_key, setting_value, data_type, updated_by, updated_at) 
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2, data_type = $3, updated_by = $4, updated_at = CURRENT_TIMESTAMP`,
        [key, String(value), dataType, req.user?.playerId]
      );
    }

    await SlackService.notifyAdminAction(req.user?.email || 'admin', 'Updated casino settings', `${Object.keys(settings).length} settings updated`);

    res.json({ success: true });
  } catch (error) {
    console.error('Update casino settings error:', error);
    res.status(500).json({ error: 'Failed to update casino settings' });
  }
};

// SOCIAL MANAGEMENT
export const listSocialGroups: RequestHandler = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM social_groups ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('List social groups error:', error);
    res.status(500).json({ error: 'Failed to fetch social groups' });
  }
};

export const getSocialGroupMembers: RequestHandler = async (req, res) => {
  try {
    const { groupId } = req.params;

    const result = await query(
      `SELECT p.id, p.username, p.email, sgm.joined_at FROM social_group_members sgm
      JOIN players p ON sgm.player_id = p.id
      WHERE sgm.group_id = $1
      ORDER BY sgm.joined_at DESC`,
      [groupId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get social group members error:', error);
    res.status(500).json({ error: 'Failed to fetch group members' });
  }
};

// PLAYER RETENTION
export const listRetentionCampaigns: RequestHandler = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM retention_campaigns ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('List retention campaigns error:', error);
    res.status(500).json({ error: 'Failed to fetch retention campaigns' });
  }
};

export const createRetentionCampaign: RequestHandler = async (req, res) => {
  try {
    const { name, triggerEvent, description, rewardType, rewardAmount } = req.body;

    const result = await query(
      `INSERT INTO retention_campaigns (name, trigger_event, description, reward_type, reward_amount, created_by) 
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, triggerEvent, description, rewardType, rewardAmount, req.user?.playerId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create retention campaign error:', error);
    res.status(500).json({ error: 'Failed to create retention campaign' });
  }
};

export const updateRetentionCampaign: RequestHandler = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { name, triggerEvent, description, rewardType, rewardAmount, enabled } = req.body;

    const result = await query(
      `UPDATE retention_campaigns SET name = $1, trigger_event = $2, description = $3, 
      reward_type = $4, reward_amount = $5, enabled = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *`,
      [name, triggerEvent, description, rewardType, rewardAmount, enabled, campaignId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update retention campaign error:', error);
    res.status(500).json({ error: 'Failed to update retention campaign' });
  }
};
