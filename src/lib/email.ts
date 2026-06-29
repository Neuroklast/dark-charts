import { logger } from '@/lib/logger';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? 'Dark Charts <noreply@darkcharts.de>';

  if (!apiKey) {
    logger.info('[email-dev] Verification email (RESEND_API_KEY not set)', {
      to: params.to,
      subject: params.subject,
      preview: params.html.slice(0, 200),
    });
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to send email: ${response.status} ${body}`);
  }
}

export async function sendVerificationEmail(email: string, verifyUrl: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'Dark Charts — E-Mail bestätigen',
    html: `
      <p>Willkommen bei Dark Charts!</p>
      <p>Bitte bestätige deine E-Mail-Adresse, um abstimmen zu können:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>Der Link ist 24 Stunden gültig.</p>
    `,
  });
}