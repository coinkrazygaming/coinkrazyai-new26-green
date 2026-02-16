import nodemailer from 'nodemailer';

// Email service configuration - supports multiple providers
interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'mailgun';
  from: string;
  replyTo?: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig;

  constructor() {
    this.config = {
      provider: (process.env.EMAIL_PROVIDER || 'smtp') as 'smtp' | 'sendgrid' | 'mailgun',
      from: process.env.EMAIL_FROM || 'noreply@coinkrazy.io',
      replyTo: process.env.EMAIL_REPLY_TO || 'support@coinkrazy.io',
    };

    this.initializeTransporter();
  }

  private initializeTransporter() {
    if (this.config.provider === 'smtp') {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASSWORD || '',
        },
      });
    }
    // Note: SendGrid and Mailgun can be integrated by swapping the transporter
    // For now, we'll use SMTP as the default
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.transporter) {
        console.warn('Email transporter not configured');
        return false;
      }

      const info = await this.transporter.sendMail({
        from: this.config.from,
        replyTo: this.config.replyTo,
        ...options,
      });

      console.log(`[Email] Sent to ${options.to} - ${info.messageId}`);
      return true;
    } catch (error) {
      console.error(`[Email] Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  async sendDailyBonusReminder(playerEmail: string, playerName: string, bonusDay: number, bonusAmount: number): Promise<boolean> {
    const bonusEmojis = ['🎯', '⭐', '💫', '🌟', '✨', '🎁', '🏆'];
    const emoji = bonusEmojis[bonusDay - 1] || '🎉';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
            .content { padding: 30px; background: #f8f9fa; border-radius: 8px; margin: 20px 0; }
            .bonus-box { background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .button { background: #667eea; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${emoji} Your Daily Bonus Awaits!</h1>
              <p>Day ${bonusDay} of 7</p>
            </div>

            <div class="content">
              <p>Hi ${playerName},</p>
              
              <p>Your daily login bonus is ready to claim!</p>
              
              <div class="bonus-box">
                <h2 style="margin: 0; font-size: 24px;">🎁 ${bonusAmount} SC</h2>
                <p style="margin: 5px 0 0 0;">+ 500 GC Extra</p>
              </div>

              <p>Don't miss out on your Day ${bonusDay} reward. Streaks reset after 24 hours, so claim your bonus now to keep your winning streak alive!</p>

              <p style="text-align: center;">
                <a href="https://coinkrazy.io/daily-bonus" class="button" style="color: white; text-decoration: none;">
                  🎯 Claim Your Bonus Now
                </a>
              </p>

              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
                <p style="margin: 0; color: #856404;"><strong>💡 Pro Tip:</strong> Keep your streak to unlock bigger bonuses! Day 7 gives you 5 SC + 1000 GC!</p>
              </div>
            </div>

            <div class="footer">
              <p>This is an automated email from CoinKrazy. You're receiving this because you have daily bonus notifications enabled.</p>
              <p><a href="https://coinkrazy.io/settings/notifications" style="color: #667eea; text-decoration: none;">Manage Preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: playerEmail,
      subject: `${emoji} Your Day ${bonusDay} Daily Bonus is Ready! - CoinKrazy`,
      html,
      text: `Your daily bonus of ${bonusAmount} SC is ready to claim! Head to CoinKrazy to claim your reward.`,
    });
  }

  async sendDailyBonusClaimedNotification(playerEmail: string, playerName: string, bonusAmount: number, nextBonusDay: number): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #00c853 0%, #00897b 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
            .content { padding: 30px; background: #f8f9fa; border-radius: 8px; margin: 20px 0; }
            .success-box { background: #c8e6c9; padding: 15px; border-radius: 8px; border-left: 4px solid #00c853; margin: 20px 0; }
            .next-bonus { background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3; margin: 20px 0; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Bonus Claimed Successfully!</h1>
            </div>

            <div class="content">
              <p>Hi ${playerName},</p>
              
              <div class="success-box">
                <p style="margin: 0; color: #1b5e20;"><strong>✓ ${bonusAmount} SC has been added to your wallet!</strong></p>
              </div>

              <p>Your daily bonus claim has been processed and the coins are now available in your account.</p>

              <div class="next-bonus">
                <p style="margin: 0 0 10px 0; color: #1565c0;"><strong>🔥 Keep Your Streak Alive!</strong></p>
                <p style="margin: 0; color: #424242;">Come back tomorrow to claim your Day ${nextBonusDay} bonus. You're building momentum!</p>
              </div>

              <p style="text-align: center; margin-top: 30px;">
                <a href="https://coinkrazy.io" style="background: #667eea; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; display: inline-block;">
                  🎮 Play Now
                </a>
              </p>
            </div>

            <div class="footer">
              <p>This is an automated email from CoinKrazy. Keep winning and have fun!</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: playerEmail,
      subject: `🎉 Bonus Claimed! - CoinKrazy`,
      html,
      text: `Your ${bonusAmount} SC bonus has been claimed successfully!`,
    });
  }

  async sendStreakLostNotification(playerEmail: string, playerName: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff6f00 0%, #e65100 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
            .content { padding: 30px; background: #f8f9fa; border-radius: 8px; margin: 20px 0; }
            .warning-box { background: #ffe0b2; padding: 15px; border-radius: 8px; border-left: 4px solid #ff6f00; margin: 20px 0; }
            .button { background: #ff6f00; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Don't Lose Your Streak!</h1>
            </div>

            <div class="content">
              <p>Hi ${playerName},</p>
              
              <div class="warning-box">
                <p style="margin: 0; color: #e65100;"><strong>We noticed you missed your daily bonus!</strong></p>
              </div>

              <p>Your daily bonus streak has reset. Don't worry - you can start fresh today and work towards even bigger rewards!</p>

              <p>Remember, the 7-day streak includes increasingly better bonuses, with Day 7 offering up to 5 SC + 1000 GC!</p>

              <p style="text-align: center;">
                <a href="https://coinkrazy.io/daily-bonus" class="button" style="color: white; text-decoration: none;">
                  🎯 Restart Your Streak Today
                </a>
              </p>

              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
                <p style="margin: 0; color: #856404;"><strong>💡 Quick Tip:</strong> Set a daily reminder to log in and claim your bonus!</p>
              </div>
            </div>

            <div class="footer">
              <p>We hope to see you back soon at CoinKrazy!</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: playerEmail,
      subject: `⏰ Your Daily Streak Reset - Come Back Today! - CoinKrazy`,
      html,
      text: `Your daily bonus streak has reset. Come back today to restart and claim your bonus!`,
    });
  }
}

export const emailService = new EmailService();
