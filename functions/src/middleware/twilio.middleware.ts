import { validateTwilioSignature } from '../services/twilio.service';
import { logger } from '../utils/logger';

export function requireTwilioSignature(
  req: { headers: Record<string, string | string[] | undefined>; protocol: string; get: (name: string) => string | undefined; originalUrl: string; body: Record<string, string> },
  res: { status: (code: number) => { send: (body: string) => void } },
): boolean {
  if (process.env.FUNCTIONS_EMULATOR === 'true') {
    logger.warn('Skipping Twilio signature validation in emulator');
    return true;
  }

  if (!validateTwilioSignature(req)) {
    logger.error('Invalid Twilio signature');
    res.status(403).send('Forbidden');
    return false;
  }
  return true;
}
