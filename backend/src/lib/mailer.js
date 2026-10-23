import nodemailer from 'nodemailer';
import { ApiError } from './api-error.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getTransport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  const port = Number(process.env.SMTP_PORT) || 587;
  const secure =
    process.env.SMTP_SECURE === 'true' ||
    (process.env.SMTP_SECURE !== 'false' && port === 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    ...(user && pass ? { auth: { user, pass } } : {})
  });
}

export async function sendVerificationEmail({ to, name, code, purpose }) {
  const isReset = purpose === 'reset';
  const subject = isReset
    ? 'Reset your LearnLoop password'
    : 'Verify your LearnLoop email';
  const title = isReset ? 'Reset your password' : 'Finish your LearnLoop signup';
  const intro = isReset
    ? 'Use this code to choose a new password. It expires in 10 minutes.'
    : `Welcome${name ? `, ${name}` : ''}. Use this code to verify your email and choose your password.`;

  const transport = getTransport();

  if (!transport) {
    if (process.env.NODE_ENV === 'production') {
      throw new ApiError(
        503,
        'Email delivery is not configured. Add SMTP_HOST and related email settings.'
      );
    }

    console.log(`\n[LearnLoop] ${purpose} code for ${to}: ${code}\n`);
    return { devCode: code };
  }

  await transport.sendMail({
    from: process.env.EMAIL_FROM || 'LearnLoop <no-reply@learnloop.dev>',
    to,
    subject,
    text: `${title}\n\n${intro}\n\nYour code: ${code}\n\nThis code expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; color: #14231f;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">LearnLoop</h1>
        <h2 style="font-size: 22px; margin-bottom: 12px;">${escapeHtml(title)}</h2>
        <p style="line-height: 1.6; color: #5c6b64;">${escapeHtml(intro)}</p>
        <div style="margin: 24px 0; padding: 18px; border-radius: 12px; background: #f6f2e9; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: 700;">
          ${code}
        </div>
        <p style="line-height: 1.6; color: #5c6b64;">This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
        <p style="font-size: 12px; color: #8a948e; margin-top: 28px;">LearnLoop · Learn deeply. Build boldly.</p>
      </div>
    `
  });

  return { devCode: null };
}
