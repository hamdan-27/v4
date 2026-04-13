const fs = require('fs');
const path = require('path');

const ABOUT_TEXT = `Hey there! I'm Hamdan, a driven software engineering student, passionate about AI and web development with hands-on experience gained through internships and personal projects. My technical toolkit spans Python, JavaScript, and DevOps, allowing me to tackle complex challenges in backend development, NLP, and ML. I'm eager to leverage my diverse skill set to create innovative technological solutions and make meaningful contributions in the AI and software engineering landscape.

Skills I've been working with recently: Python, LangChain, FastAPI, PostgreSQL, Flask, MySQL, React, MongoDB, Node.js, AWS, Express.js`;

function readDirRecursive(dir, filePaths = []) {
  if (!fs.existsSync(dir)) {
    return filePaths;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      readDirRecursive(full, filePaths);
    } else if (entry.name.endsWith('.md')) {
      filePaths.push(full);
    }
  }
  return filePaths;
}

function buildKnowledgeBase() {
  const root = path.join(__dirname, '..');
  const sections = [];

  sections.push(`=== ABOUT ME ===\n${ABOUT_TEXT}`);

  const jobFiles = readDirRecursive(path.join(root, 'content', 'jobs'));
  if (jobFiles.length) {
    const jobsContent = jobFiles.map(f => fs.readFileSync(f, 'utf8').trim()).join('\n\n---\n\n');
    sections.push(`=== WORK EXPERIENCE ===\n${jobsContent}`);
  }

  const featuredFiles = readDirRecursive(path.join(root, 'content', 'featured'));
  if (featuredFiles.length) {
    const featuredContent = featuredFiles
      .map(f => fs.readFileSync(f, 'utf8').trim())
      .join('\n\n---\n\n');
    sections.push(`=== FEATURED PROJECTS ===\n${featuredContent}`);
  }

  const projectFiles = readDirRecursive(path.join(root, 'content', 'projects'));
  if (projectFiles.length) {
    const projectsContent = projectFiles
      .map(f => fs.readFileSync(f, 'utf8').trim())
      .join('\n\n---\n\n');
    sections.push(`=== OTHER PROJECTS ===\n${projectsContent}`);
  }

  const cvPath = path.join(root, 'content', 'cv.md');
  if (fs.existsSync(cvPath)) {
    const cvContent = fs.readFileSync(cvPath, 'utf8').trim();
    if (cvContent) {
      sections.push(`=== CV / ADDITIONAL INFO ===\n${cvContent}`);
    }
  }

  return sections.join('\n\n');
}

// Build once at cold start
const knowledgeBase = buildKnowledgeBase();

const SYSTEM_PROMPT = `You are Hamdan Mohammad. A visitor is interviewing you through your portfolio website. Respond in first person, naturally and professionally, as if you're in a real job interview or a casual technical conversation with a recruiter or fellow developer. Be concise, personable, and enthusiastic. Use "I", "my", "me". Try to be as concise as possible and avoid answering with more than fifty words. Only speak to what you actually know from your profile below. If asked something outside your experience, respond honestly as Hamdan would — don't make things up.

${knowledgeBase}`;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  // Cap history to last 20 messages to avoid token bloat
  const recentMessages = messages.slice(-20);

  let upstream;
  try {
    upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://hamdan.app',
        'X-Title': 'Hamdan Portfolio Chatbot',
      },
      body: JSON.stringify({
        model: process.env.CHAT_MODEL || 'openai/gpt-4o-mini',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...recentMessages],
        stream: true,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach AI provider' });
  }

  if (!upstream.ok) {
    const text = await upstream.text();
    return res.status(upstream.status).json({ error: text });
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const reader = upstream.body?.getReader();
  const decoder = new TextDecoder();

  try {
    let chunk = await reader.read();
    while (!chunk.done) {
      res.write(decoder.decode(chunk.value, { stream: true }));
      chunk = await reader.read();
    }
  } finally {
    res.end();
  }
};
