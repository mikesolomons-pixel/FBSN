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
    const { statement, context } = req.body;
    const contextClause = context ? `\n\nContext: ${context}` : '';

    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `You are a fact-checker. Evaluate the following statement and determine how factual it is.${contextClause}

STATEMENT: "${statement}"

Respond with a JSON object (no other text) with these fields:
- "verdict": one of "Fact", "Mostly True", "Mixed", "Mostly Opinion", "Opinion/Belief", or "Unverifiable"
- "confidence": a percentage (e.g. "85%") representing how confident you are
- "explanation": 2-3 sentences explaining your reasoning, citing specific evidence or noting what makes it hard to verify
- "sources": a brief note on what kind of sources would confirm or deny this (e.g. "Government statistics", "Industry reports", "No reliable source available")`
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
