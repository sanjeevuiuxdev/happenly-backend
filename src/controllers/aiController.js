import Event from '../models/Event.js';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// make a short context from events
function buildEventContext(events) {
  return events.map(e => {
    const start = e.startAt ? new Date(e.startAt).toLocaleString() : '';
    const loc =
      typeof e.location === 'string'
        ? (/<iframe/i.test(e.location) ? 'See map' : e.location)
        : (e.location?.name || 'TBA');

    return `
Event Title: ${e.title}
Date/Time: ${start}
Location: ${loc}
Department: ${e.department || '-'}
Type: ${e.type || '-'}
Description: ${e.description || '-'}
`.trim();
  }).join('\n\n---\n\n');
}

export async function askAi(req, res) {
  try {
    const { question } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'Question is required' });
    }

    // grab recent events so the AI can reference them if needed
    const events = await Event.find({})
      .sort({ startAt: -1, createdAt: -1 })
      .limit(20)
      .lean();

    const context = buildEventContext(events);

    // new prompt:
    const prompt = `
You are Happennly AI.

1. You are allowed to answer general questions using your own general/world knowledge.
   - Example: "what is contest?", "explain what coding means", "tell me a joke", "today is sunday" etc.
   - Answer normally in a short, friendly way.

2. BUT if the user's question is clearly about a specific Happennly event
   (for example they mention an event title, like "coding-6", "code round",
   or they ask "when is coding-6", "where is coding-6 happening"),
   then you MUST answer using ONLY the event data below.
   If something is missing, say you don't have that info instead of guessing.

EVENT DATA (use this ONLY if question is about these events):
${context}

USER QUESTION:
"${question}"

Now give your answer in plain, friendly language:
`;

    const completion = await client.responses.create({
      model: 'gpt-4o-mini',
      input: prompt,
      max_output_tokens: 250,
      temperature: 0.5
    });

    // extract text safely
    let aiText = '';
    try {
      aiText =
        completion.output?.[0]?.content?.[0]?.text?.trim() ||
        completion.output_text?.trim() ||
        '';
    } catch {
      aiText = '';
    }

    if (!aiText) {
      aiText = "Sorry, I couldn't generate an answer.";
    }

    return res.json({ answer: aiText });

  } catch (err) {
    console.error('[AI] error:', err);
    return res.status(500).json({ message: 'AI error' });
  }
}
