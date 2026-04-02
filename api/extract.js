export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const { rawText, context } = req.body;
    const contextClause = context ? `\n\nContext for this exercise: ${context}` : '';

    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: `You are helping facilitate a strategic exercise called "Facts, Beliefs, Signals, Noise" (FBSN).

Given the following raw information, extract 8-15 distinct, opinionated perspectives that a team could debate and categorize. Each perspective should be a concise statement (1-2 sentences max) that could reasonably be classified as either a fact or a belief, and as either a signal or noise.

Make the perspectives sharp and debatable — not bland summaries. They should represent real strategic viewpoints or assumptions that would spark discussion.${contextClause}

RAW INFORMATION:
${rawText}

Return ONLY a JSON array of strings, each being one perspective. No other text or explanation.
Example: ["Perspective one here", "Perspective two here"]`
        }]
      })
    });

    if (!apiRes.ok) {
      const err = await apiRes.json();
      return res.status(apiRes.status).json({ error: err.error?.message || 'API error' });
    }

    const data = await apiRes.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
