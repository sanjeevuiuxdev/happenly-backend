import express from 'express';
import axios from 'axios';

const router = express.Router();

// POST /api/v1/ai/ask
router.post('/ask', async (req, res) => {
  const { question } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({ message: 'question required' });
  }

  try {
    const resp = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant for a college events portal. Answer clearly in plain English. Do not include code fences unless user asked for code.'
          },
          {
            role: 'user',
            content: question
          }
        ],
        max_tokens: 300
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiText =
      resp.data?.choices?.[0]?.message?.content?.trim() ||
      'Sorry, I could not generate an answer.';

    return res.json({ answer: aiText });
  } catch (err) {
    console.error('[ai] error talking to OpenAI:', err?.response?.data || err.message);

    return res
      .status(500)
      .json({ message: 'AI service failed. Please try again later.' });
  }
});

export default router;
