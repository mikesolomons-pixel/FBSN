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
    const { action, challenge, domain, context, hypothesis } = req.body;
    let prompt = '';

    if (action === 'classify') {
      prompt = `You are an expert in the Cynefin framework by Dave Snowden. Given the following challenges, classify each one into the most appropriate Cynefin domain.

The five domains are:
- CLEAR: The relationship between cause and effect is obvious. Best practices exist. Sense-Categorize-Respond.
- COMPLICATED: The relationship between cause and effect requires analysis or expertise. Good practices exist but need expert analysis. Sense-Analyze-Respond.
- COMPLEX: Cause and effect can only be deduced in retrospect. Emergent practice. Probe-Sense-Respond. Requires safe-to-fail experiments.
- CHAOTIC: No relationship between cause and effect at systems level. Novel practice. Act-Sense-Respond. Requires immediate action to establish order.
- CONFUSED: Not yet categorized. The state of not knowing which domain you are in.

${context ? `Context: ${context}\n\n` : ''}CHALLENGES:
${challenge}

Return ONLY a JSON array of objects, each with:
- "challenge": the challenge text
- "domain": one of "clear", "complicated", "complex", "chaotic", or "confused"
- "reasoning": 1-2 sentences explaining why this domain fits
- "approach": 1 sentence on the recommended approach pattern

Example: [{"challenge": "...", "domain": "complex", "reasoning": "...", "approach": "..."}]`;
    }

    else if (action === 'expert-clear') {
      prompt = `You are a world-class expert consultant. A team has identified the following challenge as being in the CLEAR domain of the Cynefin framework — meaning the relationship between cause and effect is obvious and well-established best practices exist.

CHALLENGE: "${challenge}"
${context ? `\nContext: ${context}` : ''}

Provide expert guidance as a JSON object (no other text) with:
- "bestPractice": The established best practice for addressing this (2-3 sentences)
- "steps": An array of 3-5 concrete steps to implement the best practice
- "pitfalls": An array of 2-3 common mistakes to avoid
- "timeframe": Expected timeframe for resolution
- "confidence": How confident you are this is in the Clear domain ("high", "medium", "low") with a brief note if it might actually belong elsewhere`;
    }

    else if (action === 'expert-complicated') {
      prompt = `You are a world-class expert consultant with deep domain expertise. A team has identified the following challenge as being in the COMPLICATED domain of the Cynefin framework — meaning the relationship between cause and effect exists but requires expert analysis to understand. There may be multiple right answers.

CHALLENGE: "${challenge}"
${context ? `\nContext: ${context}` : ''}

Provide expert analysis as a JSON object (no other text) with:
- "analysis": Deep expert analysis of the challenge (3-4 sentences covering the key dynamics at play)
- "options": An array of 2-3 viable approaches, each with "name", "description" (2-3 sentences), "pros" (array of strings), and "cons" (array of strings)
- "recommendation": Which option you'd recommend and why (2-3 sentences)
- "expertiseNeeded": What specific expertise the team should seek out (array of strings)
- "keyQuestions": 3-4 diagnostic questions the team should investigate further
- "warning": Any signs that this might actually be a Complex challenge requiring experimentation instead of analysis`;
    }

    else if (action === 'experiment-complex') {
      prompt = `You are an expert in complexity science and the design of safe-to-fail experiments (probes). A team has identified the following challenge as being in the COMPLEX domain of the Cynefin framework — meaning cause and effect can only be understood in retrospect, and the team needs to probe the system through experiments.

CHALLENGE: "${challenge}"
HYPOTHESIS: "${hypothesis}"
${context ? `\nContext: ${context}` : ''}

Design safe-to-fail experiments based on this hypothesis. Return a JSON object (no other text) with:
- "hypothesisAssessment": Brief assessment of the hypothesis quality and any refinements suggested (2-3 sentences)
- "experiments": An array of 2-3 safe-to-fail experiments, each with:
  - "name": Short experiment name
  - "description": What the experiment involves (2-3 sentences)
  - "probeAction": The specific action to take (what to do)
  - "sensingMechanism": How the team will sense what happens (what to watch for)
  - "amplifySignals": What would indicate this is working and should be amplified
  - "dampenSignals": What would indicate this is failing and should be dampened
  - "timeframe": How long to run the experiment
  - "resources": What's needed to run it
  - "safetyBounds": What makes this safe-to-fail (the boundaries that limit downside)
- "portfolioNote": A note on how these experiments work together as a portfolio (2 sentences)
- "emergentIndicators": 2-3 things to watch for that might indicate the domain is shifting (e.g., becoming Complicated as patterns emerge)`;
    }

    else {
      return res.status(400).json({ error: 'Invalid action' });
    }

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
        messages: [{ role: 'user', content: prompt }]
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
