import twilio from 'twilio';

let client: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
  if (!client) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) {
      console.warn('Twilio credentials not configured - SMS features disabled');
    }
    client = twilio(accountSid, authToken);
  }
  return client;
}

const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';

export class TwilioService {
  static async sendSMS(phoneNumber: string, message: string) {
    try {
      const twilioClient = getTwilioClient();
      const result = await twilioClient.messages.create({
        body: message,
        from: TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });
      return { success: true, messageSid: result.sid };
    } catch (error) {
      console.error('Twilio SMS error:', error);
      return { success: false, error: String(error) };
    }
  }

  static async sendOTP(phoneNumber: string, otp: string) {
    const message = `Your verification code is: ${otp}. This code expires in 10 minutes.`;
    return this.sendSMS(phoneNumber, message);
  }

  static async send2FASms(phoneNumber: string, code: string) {
    const message = `Your two-factor authentication code is: ${code}. Do not share this code with anyone.`;
    return this.sendSMS(phoneNumber, message);
  }

  static async sendDepositConfirmation(phoneNumber: string, amount: number, currency: string = 'USD') {
    const message = `Your deposit of ${amount} ${currency} has been received. Your account is now credited. Thank you for playing!`;
    return this.sendSMS(phoneNumber, message);
  }

  static async sendWithdrawalNotification(phoneNumber: string, amount: number, currency: string = 'USD') {
    const message = `Your withdrawal request of ${amount} ${currency} is being processed. You will receive your funds within 1-3 business days.`;
    return this.sendSMS(phoneNumber, message);
  }

  static async sendWinNotification(
    phoneNumber: string,
    amount: number,
    gameName: string,
    currency: string = 'USD'
  ) {
    const message = `Congratulations! You won ${amount} ${currency} in ${gameName}! Your account has been credited.`;
    return this.sendSMS(phoneNumber, message);
  }

  static async sendSecurityAlert(phoneNumber: string, alertType: string, details: string) {
    const message = `Security Alert: ${alertType}. ${details}. If this wasn't you, please contact support immediately.`;
    return this.sendSMS(phoneNumber, message);
  }

  static async sendPromotion(phoneNumber: string, promoTitle: string, promoDetails: string) {
    const message = `${promoTitle}: ${promoDetails}. Play now to claim your reward!`;
    return this.sendSMS(phoneNumber, message);
  }

  static async initiateCall(phoneNumber: string, twimlUrl: string) {
    try {
      const twilioClient = getTwilioClient();
      const call = await twilioClient.calls.create({
        url: twimlUrl,
        to: phoneNumber,
        from: TWILIO_PHONE_NUMBER,
      });
      return { success: true, callSid: call.sid };
    } catch (error) {
      console.error('Twilio call error:', error);
      return { success: false, error: String(error) };
    }
  }

  static async getMessageStatus(messageSid: string) {
    try {
      const twilioClient = getTwilioClient();
      const message = await twilioClient.messages(messageSid).fetch();
      return message.status;
    } catch (error) {
      console.error('Twilio message status error:', error);
      throw error;
    }
  }
}
