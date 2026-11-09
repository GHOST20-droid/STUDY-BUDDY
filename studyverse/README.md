# StudyVerse AI

An adaptive AI professor that teaches from a student's own notes. Plain HTML, CSS and JavaScript: no build step, no framework, no paid service.

Students open the site and start. There is no student login. Admins sign in on a separate page (`/admin/`).

## What works, what is simulated, what needs setup

| Area | Status |
|---|---|
| Dashboard, subjects, chapters, topics, notes library, exam planner, progress, learning profile | **Working.** Data is saved in the student's own browser (localStorage). |
| Upload TXT, pasted text | **Working and tested.** Text is split into sections with locations. |
| Upload PDF, PPTX, DOCX | **Working and tested** with real generated files: page numbers, slide numbers and sections are kept, and a scanned PDF with no text layer is rejected with a clear message. Parsing runs in the browser using pdf.js, JSZip and mammoth, loaded from jsDelivr. Not tested: very large files, password-protected PDFs, or the live CDN fetch itself (the same library versions were tested from local copies). |
| Finding passages in notes (retrieval) | **Working.** In-browser keyword ranking (BM25). It is not vector search. |
| Citations, source selection, "use in AI" switch | **Working.** |
| Numerical practice (10 Financial Management generators) | **Working.** Answers are calculated by code, and each generator's answer matched its stated formula in testing. Wrong-answer diagnosis is rule-based. |
| Quiz, flashcards, mistake-based practice | **Working.** Questions are labelled "From your notes" or "Generated". Never labelled as official exam questions. |
| Exam planner | **Working.** Deterministic. Recomputed from live mastery each time you open it. Does not invent exam weightage. |
| Mastery model | **Working.** Updated from answers you give, per topic and per skill (concept, formula, numerical). |
| AI Professor replies | **Needs an AI key.** Without one, replies come from a short **labelled demo script** (Financial Management sample topics only). Every demo reply shows a "Demo script, not live AI" tag. |
| Admin moderation screen inside the app | **Demo view only. Not secure.** The real admin is `/admin/` (below). |
| Image doubts (screenshots, handwriting) | Works only when the AI provider supports images. The free proxy here does not. |
| Cloud saving across devices (Supabase) | **Wired and tested against a simulated Supabase server.** Not yet run against your real project: the first real check is on your deployed site (see below). Falls back to this-device-only saving if the cloud is unreachable. |
| Real community sharing and reporting | **Wired and tested against the simulated server.** Sharing asks for confirmation first. Three reports from different students hide a note until an admin reviews it. |
| Vector search with embeddings | **Not built.** The schema has the column and search function. The app still uses keyword search. |

## Run it on your computer

```
cd studyverse
python3 -m http.server 8000
```

Open http://localhost:8000. It starts with Financial Management sample data and demo mode. Use **Profile > Start empty** to clear it.

## Deploy for free (₹0)

1. Put this folder in a GitHub repository.
2. Cloudflare Pages: **Create project > Connect to Git**. Framework preset: none. Build command: empty. Output directory: `/`.
3. Add the live AI: get a free key from Google AI Studio. In the Pages project, **Settings > Environment variables**, add `GEMINI_API_KEY` (as a Secret), `ALLOWED_ORIGIN` (your `https://….pages.dev` address) and optionally `GEMINI_MODEL`. Redeploy. The sidebar then shows "Live AI on".
4. Protect your free quota. Anyone can reach the site, so anyone can trigger AI calls. In Cloudflare, add a rate limiting rule on the path `/api/ai` (the free plan includes one). The function already rejects other origins and oversize prompts.

Free-tier limits and model names change. Check the Google AI Studio and Cloudflare pricing pages before you rely on them. When the free AI quota runs out, the site shows a clear message and keeps everything else working.

## Admin login (separate and secure)

1. Create a Supabase project (free tier). Run `supabase/schema.sql` in the SQL editor.
2. **Authentication > Providers**: enable **Anonymous sign-ins** (used for students, no login screen). Turn off public email sign-ups, then test that anonymous sign-in still works.
3. **Authentication > Users > Add user**: create your admin with an email and a strong password. Turn on MFA for it.
4. Run the last line of `schema.sql` with your email to add yourself to `public.admins`.
5. Copy `admin/config.example.js` to `admin/config.js` and fill in the project URL and the public anon key. Never use the service role key anywhere in this site.
6. Open `/admin/` and sign in.

Why it is secure: the checks are in the database, not the page. Every admin action passes `public.is_admin()`, which requires a non-anonymous login whose user id is in `public.admins`. A student who finds `/admin/` cannot read or change anything.

`schema.sql` and `admin/index.html` were written carefully but **have not been run against a live Supabase project**. Expect to fix small things on first run.

## Cloud saving and sharing (Supabase)

`js/config.js` holds your project URL and public key (safe in the browser; never put the service role or secret key there). On first visit each student gets an anonymous identity with no login screen, and their data (subjects, notes, mastery, doubts, exams) saves to the `student_state` table, protected so each student can only reach their own row. Open the site on another device in the same browser profile or after clearing nothing, and the data follows the same anonymous identity. Clearing browser data creates a new anonymous student, so tell students that clearing site data starts them fresh.

If you set up your database before `student_state` existed, run `supabase/schema-addon.sql` once. Fresh installs already get it from `schema.sql`.

**First real check after deploying:** open the site, look for "Cloud sync: on" in the sidebar, change a daily goal in Profile, wait a few seconds, then in Supabase open Table Editor > `student_state` and confirm one row appeared. If the sidebar says "unavailable", hover the message for the reason and send it to me.

Not built: embeddings-based search. When you want it, generate embeddings with the free Gemini embedding model, store them in `document_chunks.embedding`, and call the `match_chunks` function. Supabase's free plan may pause a project after a period of inactivity, so check its current terms.

## How the code is organised

| File | Job |
|---|---|
| `js/core.js` | State, sample data, mastery model, streaks, weak-topic logic |
| `js/engine.js` | Document parsing, chunking, retrieval, exam plan builder |
| `js/gen.js` | Numerical, quiz and flashcard generators with verified answers |
| `js/ai.js` | Teaching orchestration: modular prompt blocks (persona, grounding, mode, level, doubt, format), demo script, provider fallback |
| `js/views1.js` `views2.js` `views3.js` | Pages |
| `js/cloud.js` | Anonymous sign-in, cloud saving, real community sharing and reports |
| `js/config.js` | Public Supabase URL and key |
| `js/main.js` | Router and events |
| `functions/api/ai.js` | Free serverless AI proxy that keeps the key off the browser |
| `supabase/schema.sql` | Database, security policies, storage rules |
| `admin/` | Separate admin login and moderation |

The grounding rules live in one block in `js/ai.js` (`M.grounding`): teach from the notes, cite `[S1]`, never claim something is in the notes when it is not, ask before substantial outside material, and label any short outside clarification.
