
interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? 'Dark Charts <noreply@darkcharts.de>';

  if (!apiKey || !apiKey.startsWith('re_')) {
    // Never leak verification/recovery URLs to production logs.
    throw new Error('Email delivery is not configured');
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
    throw new Error(`Email provider rejected the request (${response.status})`);
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