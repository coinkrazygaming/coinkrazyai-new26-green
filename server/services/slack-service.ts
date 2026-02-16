import axios from 'axios';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const SLACK_ADMIN_CHANNEL = process.env.SLACK_ADMIN_CHANNEL || '#admin-notifications';
const SLACK_ALERTS_CHANNEL = process.env.SLACK_ALERTS_CHANNEL || '#security-alerts';
const SLACK_BOT_NAME = 'CoinKrazy Bot';

interface SlackMessage {
  channel?: string;
  username?: string;
  text?: string;
  attachments?: any[];
}

export class SlackService {
  static async sendMessage(message: SlackMessage) {
    try {
      if (!SLACK_WEBHOOK_URL) {
        console.warn('Slack webhook URL not configured');
        return { success: true, skipped: true };
      }

      const payload = {
        username: SLACK_BOT_NAME,
        channel: message.channel || SLACK_ADMIN_CHANNEL,
        ...message,
      };

      await axios.post(SLACK_WEBHOOK_URL, payload);
      return { success: true };
    } catch (error) {
      console.error('Slack message error:', error);
      return { success: false, error: String(error) };
    }
  }

  static async notifyAdminAction(admin: string, action: string, details: string) {
    return this.sendMessage({
      channel: SLACK_ADMIN_CHANNEL,
      attachments: [
        {
          color: 'good',
          title: '📋 Admin Action',
          fields: [
            { title: 'Admin', value: admin, short: true },
            { title: 'Action', value: action, short: true },
            { title: 'Details', value: details, short: false },
            { title: 'Timestamp', value: new Date().toISOString(), short: true },
          ],
        },
      ],
    });
  }

  static async notifySecurityAlert(playerEmail: string, alertType: string, details: string) {
    return this.sendMessage({
      channel: SLACK_ALERTS_CHANNEL,
      attachments: [
        {
          color: 'danger',
          title: '🚨 Security Alert',
          fields: [
            { title: 'Player', value: playerEmail, short: true },
            { title: 'Alert Type', value: alertType, short: true },
            { title: 'Details', value: details, short: false },
            { title: 'Timestamp', value: new Date().toISOString(), short: true },
          ],
        },
      ],
    });
  }

  static async notifyLargeWithdrawal(playerEmail: string, amount: number, currency: string) {
    return this.sendMessage({
      channel: SLACK_ALERTS_CHANNEL,
      attachments: [
        {
          color: 'warning',
          title: '💰 Large Withdrawal Request',
          fields: [
            { title: 'Player', value: playerEmail, short: true },
            { title: 'Amount', value: `${amount} ${currency}`, short: true },
            { title: 'Timestamp', value: new Date().toISOString(), short: true },
          ],
        },
      ],
    });
  }

  static async notifyFraudDetection(playerEmail: string, pattern: string, severity: string) {
    const color = severity === 'high' ? 'danger' : severity === 'medium' ? 'warning' : 'good';
    return this.sendMessage({
      channel: SLACK_ALERTS_CHANNEL,
      attachments: [
        {
          color,
          title: '🚩 Fraud Detection Alert',
          fields: [
            { title: 'Player', value: playerEmail, short: true },
            { title: 'Pattern', value: pattern, short: true },
            { title: 'Severity', value: severity.toUpperCase(), short: true },
            { title: 'Timestamp', value: new Date().toISOString(), short: true },
          ],
        },
      ],
    });
  }

  static async notifySystemError(errorMessage: string, context: string) {
    return this.sendMessage({
      channel: SLACK_ALERTS_CHANNEL,
      attachments: [
        {
          color: 'danger',
          title: '⚠️ System Error',
          fields: [
            { title: 'Error', value: errorMessage, short: false },
            { title: 'Context', value: context, short: false },
            { title: 'Timestamp', value: new Date().toISOString(), short: true },
          ],
        },
      ],
    });
  }

  static async notifyDailyReport(reportData: Record<string, any>) {
    return this.sendMessage({
      channel: SLACK_ADMIN_CHANNEL,
      attachments: [
        {
          color: 'good',
          title: '📊 Daily Report',
          fields: Object.entries(reportData).map(([key, value]) => ({
            title: key.charAt(0).toUpperCase() + key.slice(1),
            value: String(value),
            short: true,
          })),
        },
      ],
    });
  }

  static async notifyHighValuePlayer(playerEmail: string, totalWagered: number, vipTier: string) {
    return this.sendMessage({
      channel: SLACK_ADMIN_CHANNEL,
      attachments: [
        {
          color: 'good',
          title: '⭐ VIP Player Activity',
          fields: [
            { title: 'Player', value: playerEmail, short: true },
            { title: 'VIP Tier', value: vipTier, short: true },
            { title: 'Total Wagered', value: `$${totalWagered.toFixed(2)}`, short: true },
            { title: 'Timestamp', value: new Date().toISOString(), short: true },
          ],
        },
      ],
    });
  }

  static async notifyGameIssue(gameName: string, issue: string, severity: string) {
    const color = severity === 'critical' ? 'danger' : 'warning';
    return this.sendMessage({
      channel: SLACK_ALERTS_CHANNEL,
      attachments: [
        {
          color,
          title: '🎮 Game Issue Alert',
          fields: [
            { title: 'Game', value: gameName, short: true },
            { title: 'Severity', value: severity.toUpperCase(), short: true },
            { title: 'Issue', value: issue, short: false },
            { title: 'Timestamp', value: new Date().toISOString(), short: true },
          ],
        },
      ],
    });
  }

  static async notifyWithdrawalApproval(playerEmail: string, amount: number, approved: boolean) {
    const title = approved ? '✅ Withdrawal Approved' : '❌ Withdrawal Rejected';
    const color = approved ? 'good' : 'danger';
    return this.sendMessage({
      channel: SLACK_ADMIN_CHANNEL,
      attachments: [
        {
          color,
          title,
          fields: [
            { title: 'Player', value: playerEmail, short: true },
            { title: 'Amount', value: `$${amount.toFixed(2)}`, short: true },
            { title: 'Timestamp', value: new Date().toISOString(), short: true },
          ],
        },
      ],
    });
  }
}
