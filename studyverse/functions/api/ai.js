// Cloudflare Pages Function: POST /api/ai  (free tier). Keeps the model key on the server.
// Env vars (Cloudflare Pages > Settings > Environment variables, mark as Secret):
//   GEMINI_API_KEY  required. Free key from Google AI Studio.
//   GEMINI_MODEL    optional. Defaults below; confirm the current free-tier model name in AI Studio.
//   ALLOWED_ORIGIN  optional. Your site origin, e.g. https://studyverse.pages.dev. Blocks other sites from using your key.
const MAX_PROMPT = 14000;
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export async function onRequestGet({ env }) { return json({ ready: !!env.GEMINI_API_KEY }); }

export async function onRequestPost({ request, env }) {
  if (!env.GEMINI_API_KEY) return json({ error: 'AI is not configured on this deployment.' }, 503);
  const origin = request.headers.get('origin');
  if (env.ALLOWED_ORIGIN && origin !== env.ALLOWED_ORIGIN) return json({ error: 'Origin not allowed.' }, 403);
  let body; try { body = await request.json(); } catch { return json({ error: 'Invalid JSON.' }, 400); }
  const prompt = typeof body.prompt === 'string' ? body.prompt : '';
  if (!prompt || prompt.length > MAX_PROMPT) return json({ error: 'Prompt is empty or too long.' }, 400);
  const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const payload = { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4, maxOutputTokens: 1400, ...(body.json ? { responseMimeType: 'application/json' } : {}) } };
  const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY }, body: JSON.stringify(payload) });
  if (r.status === 429) return json({ error: 'The free AI quota is used up for now. Try again later.' }, 429);
  if (!r.ok) return json({ error: 'The AI provider returned an error (' + r.status + ').' }, 502);
  const d = await r.json();
  const text = (((d.candidates || [])[0] || {}).content || {}).parts?.map(p => p.text || '').join('') || '';
  if (!text) return json({ error: 'The AI returned an empty answer.' }, 502);
  return json({ text });
}
