/**
 * FBSN local server.
 *
 * Runs entirely on your own machine — no cloud, no Vercel, no Supabase.
 *   node server.js       →  http://localhost:3456
 *
 * Responsibilities:
 *   1. Serve /public as static files.
 *   2. Proxy three POST endpoints to the Anthropic API so the browser
 *      can call Claude without exposing your key:
 *        POST /api/extract    — extract perspectives from raw text
 *        POST /api/factcheck  — fact-check a single statement
 *        POST /api/cynefin    — classify challenges / expert advice
 *      These are used by the "Extract with AI" and "Fact Check" buttons
 *      in the FBSN exercise and by the Cynefin Navigator page. If the
 *      ANTHROPIC_API_KEY environment variable isn't set, those buttons
 *      just return a friendly error and the rest of the app keeps
 *      working.
 *
 * Configuration:
 *   - .env in the project root:  ANTHROPIC_API_KEY=sk-ant-...
 *   - Override the port with:    FBSN_PORT=4000 node server.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

/* ── Load .env ─────────────────────────────────────────── */
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = (m[2] || '').replace(/^['"]|['"]$/g, '');
  });
}

const PORT       = parseInt(process.env.FBSN_PORT, 10) || 3456;
const API_KEY    = process.env.ANTHROPIC_API_KEY;
const AI_MODEL   = process.env.FBSN_AI_MODEL || 'claude-sonnet-5';
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.pdf':  'application/pdf',
  '.txt':  'text/plain; charset=utf-8'
};

/* ── AI prompts ────────────────────────────────────────── */
function extractPrompt(rawText, context) {
  const ctx = context ? '\n\nContext for this exercise: ' + context : '';
  return `You are helping facilitate a strategic exercise called "Facts, Beliefs, Signals, Noise" (FBSN).

Given the following raw information, extract 8-15 distinct, opinionated perspectives that a team could debate and categorize. Each perspective should be a concise statement (1-2 sentences max) that could reasonably be classified as either a fact or a belief, and as either a signal or noise.

Make the perspectives sharp and debatable — not bland summaries. They should represent real strategic viewpoints or assumptions that would spark discussion.${ctx}

RAW INFORMATION:
${rawText}

Return ONLY a JSON array of strings, each being one perspective. No other text or explanation.
Example: ["Perspective one here", "Perspective two here"]`;
}

function factcheckPrompt(statement, context) {
  const ctx = context ? '\n\nContext: ' + context : '';
  return `You are a fact-checker. Evaluate the following statement and determine how factual it is.${ctx}

STATEMENT: "${statement}"

Respond with a JSON object (no other text) with these fields:
- "verdict": one of "Fact", "Mostly True", "Mixed", "Mostly Opinion", "Opinion/Belief", or "Unverifiable"
- "confidence": a percentage (e.g. "85%") representing how confident you are
- "explanation": 2-3 sentences explaining your reasoning, citing specific evidence or noting what makes it hard to verify
- "sources": a brief note on what kind of sources would confirm or deny this (e.g. "Government statistics", "Industry reports", "No reliable source available")`;
}

function cynefinPrompt(body) {
  const { action, challenge, context, hypothesis } = body;
  if (action === 'classify') {
    return `You are an expert in the Cynefin framework by Dave Snowden. Given the following challenges, classify each one into the most appropriate Cynefin domain.

The five domains are:
- CLEAR: The relationship between cause and effect is obvious. Best practices exist. Sense-Categorize-Respond.
- COMPLICATED: The relationship between cause and effect requires analysis or expertise. Good practices exist but need expert analysis. Sense-Analyze-Respond.
- COMPLEX: Cause and effect can only be deduced in retrospect. Emergent practice. Probe-Sense-Respond. Requires safe-to-fail experiments.
- CHAOTIC: No relationship between cause and effect at systems level. Novel practice. Act-Sense-Respond. Requires immediate action to establish order.
- CONFUSED: Not yet categorized. The state of not knowing which domain you are in.

${context ? 'Context: ' + context + '\n\n' : ''}CHALLENGES:
${challenge}

Return ONLY a JSON array of objects, each with:
- "challenge": the challenge text
- "domain": one of "clear", "complicated", "complex", "chaotic", or "confused"
- "reasoning": 1-2 sentences explaining why this domain fits
- "approach": 1 sentence on the recommended approach pattern`;
  }
  if (action === 'expert-clear') {
    return `You are a world-class expert consultant. A team has identified the following challenge as being in the CLEAR domain of the Cynefin framework — meaning the relationship between cause and effect is obvious and well-established best practices exist.

CHALLENGE: "${challenge}"${context ? '\nContext: ' + context : ''}

Provide expert guidance as a JSON object (no other text) with:
- "bestPractice": The established best practice for addressing this (2-3 sentences)
- "steps": An array of 3-5 concrete steps to implement the best practice
- "pitfalls": An array of 2-3 common mistakes to avoid
- "timeframe": Expected timeframe for resolution
- "confidence": How confident you are this is in the Clear domain ("high", "medium", "low") with a brief note if it might actually belong elsewhere`;
  }
  if (action === 'expert-complicated') {
    return `You are a world-class expert consultant with deep domain expertise. A team has identified the following challenge as being in the COMPLICATED domain of the Cynefin framework — meaning the relationship between cause and effect exists but requires expert analysis to understand. There may be multiple right answers.

CHALLENGE: "${challenge}"${context ? '\nContext: ' + context : ''}

Provide expert analysis as a JSON object (no other text) with:
- "analysis": Deep expert analysis of the challenge (3-4 sentences covering the key dynamics at play)
- "options": An array of 2-3 viable approaches, each with "name", "description" (2-3 sentences), "pros" (array of strings), and "cons" (array of strings)
- "recommendation": Which option you'd recommend and why (2-3 sentences)
- "expertiseNeeded": What specific expertise the team should seek out (array of strings)
- "keyQuestions": 3-4 diagnostic questions the team should investigate further
- "warning": Any signs that this might actually be a Complex challenge requiring experimentation instead of analysis`;
  }
  if (action === 'experiment-complex') {
    return `You are an expert in complexity science and the design of safe-to-fail experiments (probes). A team has identified the following challenge as being in the COMPLEX domain of the Cynefin framework — meaning cause and effect can only be understood in retrospect, and the team needs to probe the system through experiments.

CHALLENGE: "${challenge}"
HYPOTHESIS: "${hypothesis}"${context ? '\nContext: ' + context : ''}

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
  return null;
}

async function callAnthropic(prompt, maxTokens) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: maxTokens || 2048,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  return r;
}

/* ── HTTP handling ─────────────────────────────────────── */
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, obj) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(obj));
}

async function handleAi(req, res, kind) {
  if (!API_KEY) return sendJson(res, 500, { error: 'ANTHROPIC_API_KEY not set — AI features are disabled locally' });
  let body;
  try { body = await readJsonBody(req); }
  catch (e) { return sendJson(res, 400, { error: 'Invalid JSON body' }); }

  let prompt, maxTokens;
  if (kind === 'extract') {
    prompt = extractPrompt(body.rawText || '', body.context || '');
    maxTokens = 2048;
  } else if (kind === 'factcheck') {
    prompt = factcheckPrompt(body.statement || '', body.context || '');
    maxTokens = 1024;
  } else if (kind === 'cynefin') {
    prompt = cynefinPrompt(body);
    if (!prompt) return sendJson(res, 400, { error: 'Invalid action' });
    maxTokens = 2048;
  }

  try {
    const upstream = await callAnthropic(prompt, maxTokens);
    const data = await upstream.json();
    if (!upstream.ok) return sendJson(res, upstream.status, { error: (data.error && data.error.message) || 'Anthropic API error' });
    return sendJson(res, 200, data);
  } catch (e) {
    return sendJson(res, 500, { error: e.message });
  }
}

function serveStatic(req, res) {
  const url = new URL(req.url, 'http://localhost');
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';

  // Prevent path traversal.
  const fp = path.join(PUBLIC_DIR, pathname);
  if (!fp.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('forbidden'); }

  fs.stat(fp, (err, st) => {
    if (err || !st.isFile()) {
      // Fall back to .html-less URLs (e.g. /clients → /clients.html).
      const alt = fp + '.html';
      fs.stat(alt, (e2, s2) => {
        if (!e2 && s2.isFile()) return streamFile(alt, res);
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('not found');
      });
      return;
    }
    streamFile(fp, res);
  });
}

function streamFile(fp, res) {
  const ext = path.extname(fp).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(fp).pipe(res);
}

const server = http.createServer(async (req, res) => {
  // CORS preflight for /api/*
  if (req.method === 'OPTIONS' && req.url.startsWith('/api/')) {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  if (req.method === 'POST') {
    if (req.url === '/api/extract')   return handleAi(req, res, 'extract');
    if (req.url === '/api/factcheck') return handleAi(req, res, 'factcheck');
    if (req.url === '/api/cynefin')   return handleAi(req, res, 'cynefin');
    return sendJson(res, 404, { error: 'not found' });
  }

  if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(req, res);
  res.writeHead(405); res.end('method not allowed');
});

server.listen(PORT, () => {
  console.log('FBSN running at  http://localhost:' + PORT);
  if (!API_KEY) console.log('  (ANTHROPIC_API_KEY not set — AI-assisted features are disabled)');
});
