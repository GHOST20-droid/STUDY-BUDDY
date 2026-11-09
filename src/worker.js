// Cloudflare Worker entry: serves the static site and handles POST/GET /api/ai (free tier). Keeps the model key on the server.
// Secrets / variables (Cloudflare > your project > Settings > Variables and Secrets):
//   GEMINI_API_KEY  required (Secret). Free key from Google AI Studio.
//   GEMINI_MODEL    optional. Defaults to gemini-2.5-flash. Confirm the current free model name in AI Studio.
//   ALLOWED_ORIGIN  optional. Your site origin, e.g. https://study-buddy.YOURNAME.workers.dev
const MAX_PROMPT = 14000;
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

async function handleAi(request, env) {
  if (request.method === 'GET') return json({ ready: !!env.GEMINI_API_KEY });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  if (!env.GEMINI_API_KEY) return json({ error: 'AI is not configured on this deployment.' }, 503);
  const origin = request.headers.get('origin');
  if (env.ALLOWED_ORIGIN && origin !== env.ALLOWED_ORIGIN) return json({ error: 'Origin not allowed.' }, 403);
  let body; try { body = await request.json(); } catch { return json({ error: 'Invalid JSON.' }, 400); }
  const prompt = typeof body.prompt === 'string' ? body.prompt : '';
  if (!prompt || prompt.length > MAX_PROMPT) return json({ error: 'Prompt is empty or too long.' }, 400);
  const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const payload = { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4, maxOutputTokens: 1400, ...(body.json ? { responseMimeType: 'application/json' } : {}) } };
  let r; try { r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY }, body: JSON.stringify(payload) }); } catch (e) { return json({ error: 'Could not reach the AI provider. Try again in a moment.' }, 502); }
  if (r.status === 429) return json({ error: 'The free AI quota is used up for now. Try again later.' }, 429);
  if (!r.ok) return json({ error: 'The AI provider returned an error (' + r.status + ').' }, 502);
  let d; try { d = await r.json(); } catch (e) { return json({ error: 'The AI provider sent an unreadable answer.' }, 502); }
  const text = (((d.candidates || [])[0] || {}).content || {}).parts?.map(p => p.text || '').join('') || '';
  if (!text) return json({ error: 'The AI returned an empty answer.' }, 502);
  return json({ text });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/ai') return handleAi(request, env);
    return env.ASSETS.fetch(request);
  }
};
