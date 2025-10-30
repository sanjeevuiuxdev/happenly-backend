import { Router } from 'express';
import { transporter, sendMail } from '../config/mailer.js';

const r = Router();

r.get('/verify', async (req, res) => {
  try {
    const ok = await transporter.verify();
    res.json({ ok, host: transporter.options.host, port: transporter.options.port, secure: transporter.options.secure });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

r.post('/send', async (req, res) => {
  try {
    const to = process.env.SMTP_USER; // send to yourself (Mailtrap will catch it)
    const info = await sendMail({
      to,
      subject: 'Happenly test',
      html: '<b>Mail works 🎉</b>',
    });
    res.json({ messageId: info.messageId, accepted: info.accepted, response: info.response });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default r;
