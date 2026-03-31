import twilio from 'twilio';
import { logger } from '../utils/logger';

const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }
  return twilio(accountSid, authToken);
};

const E164_REGEX = /^\+[1-9]\d{1,14}$/;

export async function sendSms(to: string, body: string, from?: string): Promise<string> {
  if (!to || !E164_REGEX.test(to)) {
    throw new Error(`Invalid phone number format: ${to}`);
  }

  const client = getTwilioClient();
  const fromNumber = from || process.env.TWILIO_PHONE_NUMBER;
  if (!fromNumber) {
    throw new Error('Twilio phone number not configured');
  }

  logger.info('Sending SMS', { to, bodyLength: body.length });

  const message = await client.messages.create({
    to,
    from: fromNumber,
    body,
    statusCallback: process.env.APP_URL
      ? `${process.env.APP_URL}/smsStatusCallback`
      : undefined,
  });

  logger.info('SMS sent', { sid: message.sid, status: message.status });
  return message.sid;
}

export function validateTwilioSignature(
  req: { headers: Record<string, any>; protocol: string; get: (name: string) => string | undefined; originalUrl: string; body: any },
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return false;

  const signature = req.headers['x-twilio-signature'] as string;
  if (!signature) return false;

  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  return twilio.validateRequest(authToken, signature, url, req.body);
}
