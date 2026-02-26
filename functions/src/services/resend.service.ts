import { Resend } from 'resend';
import { logger } from '../utils/logger';

let client: Resend | null = null;

function getClient(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY not configured');
    client = new Resend(apiKey);
  }
  return client;
}

function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || 'PropWise <noreply@propwise.ai>';
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  tags?: Array<{ name: string; value: string }>;
}

export async function sendEmail({ to, subject, html, tags }: SendEmailParams): Promise<{ id: string }> {
  const resend = getClient();

  logger.info('Sending email via Resend', { to, subject });

  const { data, error } = await resend.emails.send({
    from: getFromEmail(),
    to,
    subject,
    html,
    tags,
  });

  if (error) {
    logger.error('Resend send failed', { error });
    throw new Error(`Resend error: ${error.message}`);
  }

  logger.info('Email sent successfully', { id: data?.id });
  return { id: data?.id || '' };
}

export async function sendBatchEmails(
  emails: SendEmailParams[],
): Promise<Array<{ id: string }>> {
  const resend = getClient();

  logger.info('Sending batch emails via Resend', { count: emails.length });

  const { data, error } = await resend.batch.send(
    emails.map((e) => ({
      from: getFromEmail(),
      to: e.to,
      subject: e.subject,
      html: e.html,
      tags: e.tags,
    })),
  );

  if (error) {
    logger.error('Resend batch send failed', { error });
    throw new Error(`Resend batch error: ${error.message}`);
  }

  logger.info('Batch emails sent', { count: data?.data?.length });
  return data?.data?.map((d) => ({ id: d.id })) || [];
}
