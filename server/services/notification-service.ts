import { query, createSecurityAlert } from '../db/queries';

export class NotificationService {
  /**
   * Send an email notification to a player (Mock)
   * In a real app, this would use nodemailer, SendGrid, etc.
   */
  static async sendEmail(to: string, subject: string, content: string) {
    console.log(`[EMAIL] Sending email to ${to}`);
    console.log(`[EMAIL] Subject: ${subject}`);
    console.log(`[EMAIL] Content: ${content}`);
    // Simulate email sending
    return true;
  }

  /**
   * Notify a player of a purchase
   */
  static async notifyPurchase(playerId: number, email: string, amount: number, currency: string, item: string) {
    const subject = `Purchase Confirmation - CoinKrazy`;
    const content = `
      Hello!
      
      This is a confirmation of your purchase on CoinKrazy.
      
      Item: ${item}
      Amount: ${amount} ${currency}
      Date: ${new Date().toLocaleString()}
      
      Thank you for playing with us!
    `;
    
    await this.sendEmail(email, subject, content);

    // Also create an admin alert if it's SC spending
    if (currency === 'SC') {
      await createSecurityAlert(
        'PURCHASE',
        'low',
        'SC Purchase Notification',
        `Player ID ${playerId} spent ${amount} SC on ${item}`
      );
    }
  }
}
