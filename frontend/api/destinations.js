// Vercel serverless function: AI-generated destination ideas.
// Calls the Anthropic API server-side so the API key stays secret.
// Requires the ANTHROPIC_API_KEY environment variable set in the Vercel project.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'AI ideas are not configured (missing ANTHROPIC_API_KEY).' });
    return;
  }

  try {
    const { countryName = 'somewhere', monthName = '', tripDays = 7, existing = [] } = req.body || {};

    const prompt = `You are a seasoned travel advisor. Suggest 4 vacation destinations for someone who lives in ${countryName} taking a ${tripDays}-day trip in ${monthName}.

Rules:
- Pick places where ${monthName} is genuinely a great time to visit (weather, season, events).
- Match the trip length: a ${tripDays}-day trip ${tripDays <= 4 ? 'should stay relatively close to home' : tripDays >= 10 ? 'can be a far, bucket-list journey' : 'can be medium-haul'}.
- Favour destinations that are popular and practical for travellers from ${countryName}.
- Do NOT repeat any of these already-suggested places: ${existing.length ? existing.join(', ') : '(none)'}.

Respond with ONLY a JSON array, no prose, in exactly this shape:
[{"city":"City name","country":"Country","flag":"🇫🇷","vibe":"🏖️ short vibe","why":"One vivid sentence on why it's great for this month and trip length."}]`;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      res.status(502).json({ error: `Anthropic API error (${resp.status})`, detail });
      return;
    }

    const data = await resp.json();
    const text = (data.content || []).map(b => b.text || '').join('').trim();

    // Strip markdown fences if the model wrapped the JSON.
    const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
    let ideas;
    try {
      ideas = JSON.parse(cleaned);
    } catch {
      const m = cleaned.match(/\[[\s\S]*\]/);
      ideas = m ? JSON.parse(m[0]) : [];
    }

    res.status(200).json({ ideas: Array.isArray(ideas) ? ideas.slice(0, 4) : [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate ideas', detail: String(err) });
  }
}
