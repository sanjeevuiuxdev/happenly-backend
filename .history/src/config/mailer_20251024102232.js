import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const {
  SMTP_HOST,
  SMTP_PORT = 587,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM = 'Happenly <no-reply@happenly.dev>',
} = process.env;

export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: Number(SMTP_PORT) === 465, 
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

export async function sendMail({ to, subject, html, text }) {
  if (!to) throw new Error('No recipients defined');
  const info = await transporter.sendMail({ from: MAIL_FROM, to, subject, html, text });
  
  console.log(`[mail] sent -> id=${info.messageId} accepted=${(info.accepted||[]).join(',')}`);
  return info;
}


transporter.verify().then(
  () => console.log(`[mail] SMTP verified: ${SMTP_HOST}:${SMTP_PORT}`),
  (e) => console.warn('[mail] SMTP verify failed:', e.message)
);
