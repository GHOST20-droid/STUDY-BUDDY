/* AI teaching orchestration: modular prompt builders, live Claude call via the page's sample capability, labeled scripted demo fallback. */
(function (SV) {
  const { esc, uid, dkey, daysUntil } = SV;
  const S = () => SV.S;
  const ui = SV.ui = { view: 'dashboard', sample: undefined, demo: true, busy: false, ctxOpen: false, mode: 'deep', doubtMode: false, attach: null, draft: '', profSub: null, profChap: null, profTopic: null, notesTab: 'mine', q: '', uploads: [], subjectSel: null, pr: null, examSel: null, confirm: null, modal: null, imagesOK: false };

  /* ---------- markdown (small, escape-first) ---------- */
  function md(t, mi) {
    const pres = []; let h = esc(t).replace(/```([\s\S]*?)```/g, (m, c) => { pres.push(c.trim()); return '\u0000' + (pres.length - 1) + '\u0000'; });
    h = h.replace(/`([^`\n]+)`/g, '<code>$1</code>').replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>').replace(/\[S(\d)\]/g, (m, n) => `<button class="cite" data-act="openSource" data-a="${n}" data-b="${mi}">S${n}</button>`);
    const out = []; let list = null; const close = () => { if (list) { out.push('</' + list + '>'); list = null; } };
    h.split('\n').forEach(ln => {
      let m; if (/^\s*[-*] /.test(ln)) { if (list !== 'ul') { close(); out.push('<ul>'); list = 'ul'; } out.push('<li>' + ln.replace(/^\s*[-*] /, '') + '</li>'); }
      else if ((m = ln.match(/^\s*(\d+)[.)] (.*)/))) { if (list !== 'ol') { close(); out.push('<ol>'); list = 'ol'; } out.push('<li>' + m[2] + '</li>'); }
      else { close(); if (/^#{1,4} /.test(ln)) out.push('<h4>' + ln.replace(/^#+ /, '') + '</h4>'); else if (ln.trim()) out.push('<p>' + ln + '</p>'); }
    }); close();
    return out.join('').replace(/<p>\u0000(\d+)\u0000<\/p>/g, (m, i) => '<pre>' + pres[+i] + '</pre>').replace(/\u0000(\d+)\u0000/g, (m, i) => '<pre>' + pres[+i] + '</pre>');
  }

  /* ---------- sessions ---------- */
  const skey = () => ui.profSub + '|' + ui.profChap;
  function session() { const k = skey(); return S().sessions[k] || (S().sessions[k] = { subjectId: ui.profSub, chapterId: ui.profChap, messages: [], lesson: null, updated: Date.now() }); }
  function docIds() { return S().docs.filter(d => d.subjectId === ui.profSub && d.on).map(d => d.id); }

  /* ---------- modular instruction blocks ---------- */
  const M = {
    persona: 'You are StudyVerse, a patient and rigorous university professor tutoring one student. You never shame. You explain one idea at a time, in plain words, and you check understanding instead of assuming it.',
    grounding: 'GROUNDING RULES. The student\'s uploaded notes appear below as SOURCES labeled [S1], [S2]. (1) Teach from the SOURCES first and cite them like [S1] right after the claim. (2) Never say a formula or definition is in the notes unless it appears in a SOURCE. (3) If the notes do not cover something, say "Your uploaded notes don\'t cover this" and, before giving substantial outside material, ask permission. Short supplementary clarifications are allowed but must start with "Outside your notes:". (4) Keep the notation and conventions the notes use. (5) For numerical problems: keep the exact given values, name the formula, say why it applies, define variables, substitute, calculate step by step, explain the answer, and verify where possible.',
    deep: 'MODE: DEEP LEARNING. Start from fundamentals, say why the topic exists, introduce terminology gradually, explain why formulas work, give an example, then test.',
    express: 'MODE: EXAM EXPRESS. Be concise. Teach only what is needed for exam questions: the core idea, the formula, the solving pattern, common mistakes. No long preambles. Do not drop necessary understanding for speed. State the single most likely exam trap.',
    levels: { basics: 'LEVEL: the student is new to this topic. Avoid unexplained terms, use an everyday analogy, introduce one concept only.', formulas: 'LEVEL: the student knows basics. Introduce technical terms and the formula, connect concepts, give a simple example.', numerical: 'LEVEL: the student knows the formulas. Work numerical problems, vary the setup, point out common mistakes.', exam: 'LEVEL: the student is proficient. Use challenging exam-level questions and applications.' },
    doubt: 'DOUBT MODE: the student interrupted the lesson with a doubt. (1) Restate the exact doubt in one line. (2) Find the relevant concept or calculation. (3) Explain only what resolves it. (4) Connect back to their original problem. (5) Check understanding with one short question. Do not continue the lesson yet.',
    format: 'FORMAT: Markdown. Short paragraphs, small lists, formulas in backticks. End teaching replies with exactly one short check question for the student (unless they asked for a problem to solve). After your reply, append one line exactly like <state>{"topicId":"<id or null>","signal":"correct|partial|incorrect|none","dimension":"concept|formula|numerical|none","misconception":"short phrase or null","lessonPoint":"where the lesson stands, max 10 words","outside":true|false}</state>. "signal" grades the student\'s latest message only if it answered your previous check question; otherwise "none".'
  };
  const INTENT = {
    ask: '', simpler: 'The student did not follow your last explanation. Explain the same idea more simply: shorter sentences, one everyday analogy, no new jargon. Then one easy check question.',
    differently: 'Explain the same idea with a different method, not a rephrase (for example a timeline, a table in words, or a contrast with the idea they confuse it with).',
    example: 'Give another worked example with different numbers, using the notes\' formula and notation.', steps: 'Walk through it step by step with numbered steps and define every variable.',
    formula: 'State the formula exactly as the notes write it, define each variable, and say where in the sources it appears.', why: 'Explain why this formula applies here and why the alternatives do not.',
    similar: 'Give one similar practice problem with valid numbers. Do NOT reveal the solution yet.', test: 'Ask 2 or 3 short questions that test what was just taught. Do not give answers.',
    lesson: 'Teach this topic now, starting at the right level for the student.', resume: 'Resume the lesson exactly where it paused. One sentence recap, then continue. Do not repeat material already covered.'
  };
  function learnerBlock(topicId) {
    const m = S().mastery[topicId] || {}, sc = SV.score(topicId), mc = SV.mistakeCounts().filter(x => x.topicId === topicId).slice(0, 3);
    const ex = S().exams.filter(e => e.subjectId === ui.profSub && daysUntil(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))[0];
    return 'LEARNER (topic-specific, can change): mastery ' + (sc == null ? 'no evidence yet' : sc + '%') + '; concept ' + (m.c == null ? 'unknown' : m.c) + ', formula ' + (m.f == null ? 'unknown' : m.f) + ', numerical ' + (m.n == null ? 'unknown' : m.n) + '. Recurring mistakes: ' + (mc.length ? mc.map(x => x.label + ' (x' + x.n + ')').join('; ') : 'none recorded') + '. Open doubts in this subject: ' + SV.openDoubts(ui.profSub).length + '. ' + (ex ? 'Exam in ' + daysUntil(ex.date) + ' days.' : 'No exam date set.');
  }
  function buildPrompt(text, intent, sources, sess) {
    const info = SV.topicInfo(ui.profTopic), sc = SV.score(ui.profTopic), lv = SV.level(sc);
    const subject = SV.subj(ui.profSub), chap = subject && subject.chapters.find(c => c.id === ui.profChap);
    const ids = chap ? chap.topics.map(t => t.id).join(', ') : '';
    const hist = sess.messages.filter(m => !m.error).slice(-8).map(m => (m.role === 'user' ? 'STUDENT: ' : 'PROFESSOR: ') + m.content.replace(/<state>[\s\S]*?<\/state>/g, '').trim()).join('\n');
    const lastQ = (() => { const a = sess.messages.filter(m => m.role === 'assistant' && !m.error).slice(-1)[0]; if (!a) return ''; const t = a.content.replace(/<state>[\s\S]*?<\/state>/g, '').trim().split('\n').filter(Boolean); return t[t.length - 1] || ''; })();
    const src = sources.length ? sources.map((s, i) => `[S${i + 1}] (${s.docName}, ${s.loc})\n${s.text}`).join('\n\n') : '(No relevant passages were found in the uploaded notes.)';
    return [M.persona, M.grounding, ui.mode === 'deep' ? M.deep : M.express, M.levels[lv.id], ui.doubtMode ? M.doubt : '', M.format,
      `CONTEXT: subject "${subject ? subject.name : ''}", chapter "${chap ? chap.title : ''}", topic "${info ? info.title : 'not chosen'}". Valid topicId values: ${ids || 'null'}.`, learnerBlock(ui.profTopic),
      sess.lesson && sess.lesson.lessonPoint ? 'LESSON POINTER: ' + sess.lesson.lessonPoint : '', lastQ ? 'YOUR PREVIOUS CHECK QUESTION / LAST LINE: ' + lastQ : '', 'SOURCES:\n' + src,
      hist ? 'CONVERSATION SO FAR:\n' + hist : '', INTENT[intent] ? 'TASK: ' + INTENT[intent] : '', 'STUDENT NOW SAYS: ' + text].filter(Boolean).join('\n\n');
  }

  /* ---------- scripted demo (clearly labeled, never presented as AI output) ---------- */
  const DEMO = {
    ear: {
      lesson: 'Let\'s start with a simple question. If a bank says "12% per year, compounded quarterly", do you earn exactly 12% in a year?\n\nNot quite.\n\n**Stated rate vs effective rate**\n- The stated (nominal) rate is the label: 12% a year.\n- Interest is added every quarter (3% each time), and later quarters earn interest on interest from earlier ones.\n- So the money grows by slightly more than 12%. That real yearly growth is the **effective annual rate (EAR)**.\n\nYour notes give the formula [S1]: `EAR = (1 + i/m)^m − 1`, where i is the stated rate and m the compounding periods per year.\n\n**Worked example**\n1. i/m = 0.12 ÷ 4 = 0.03\n2. (1.03)^4 = 1.1255\n3. EAR = 1.1255 − 1 = 0.1255, so **12.55%**\n\nUse EAR when comparing loans or deposits that compound at different frequencies.\n\n**Check:** a deposit pays 12% compounded monthly. Will its EAR be higher or lower than 12.55%? Why?',
      simpler: 'Think of a bank that pays you 3 paise on every rupee at the end of each quarter, and then pays interest on the new total too.\n\n- After 1 quarter: ₹100 becomes ₹103.\n- After 2 quarters: ₹103 becomes ₹106.09. The second 3% was earned on ₹103, not ₹100.\n- After 4 quarters you hold ₹112.55.\n\nSo you earned **12.55%**, not 12%. That 12.55% is the effective rate [S1].\n\n**Check:** why is the extra 0.55% there at all?',
      example: 'Another example from the same formula [S1]. A loan is quoted at 10% compounded half-yearly.\n\n1. i/m = 0.10 ÷ 2 = 0.05\n2. (1.05)^2 = 1.1025\n3. EAR = 0.1025, so **10.25%**\n\n**Check:** which is cheaper to borrow, 10% compounded half-yearly or 10.2% compounded annually?',
      test: '1. A rate is stated as 8% compounded quarterly. What are i and m?\n2. Without calculating, will EAR be above or below 8%?\n3. Which rate would you use to compare two deposits with different compounding?'
    },
    fv: { lesson: 'Future value answers: if I invest money today, how much will it be worth later?\n\nYour notes [S1] give FV = PV × (1 + r)^n. The key idea is **compounding**: each year you earn interest on the interest you already earned.\n\nExample from your notes: ₹10,000 at 10% for 3 years.\n1. (1.10)^3 = 1.331\n2. FV = 10,000 × 1.331 = **₹13,310**\n\n**Check:** would simple interest give more or less than ₹13,310 here? Why?' },
    annuity: { lesson: 'An annuity is a stream of **equal payments at equal intervals**, like a fixed monthly instalment.\n\nYour notes [S1] give the present value of an ordinary annuity (payments at the end of each period): `PVA = P × [1 − (1 + r)^−n] ÷ r`.\n\nExample from your notes: ₹5,000 a year for 4 years at 10%. The bracket is 3.1699, so PV = 5,000 × 3.1699 = **₹15,849**.\n\nFor an annuity due (payments at the start), multiply by (1 + r).\n\n**Check:** why is the PV less than 4 × ₹5,000 = ₹20,000?' },
    perp: { lesson: 'A perpetuity is a payment that never ends. It sounds infinite, but far-off payments are worth almost nothing today, so the total is finite [S1].\n\n`PV = C ÷ r`\n\nExample: ₹2,000 a year forever at 8% gives 2,000 ÷ 0.08 = **₹25,000**.\n\n**Check:** if the rate falls to 5%, does the PV rise or fall?' },
    irr: { lesson: 'IRR is the discount rate at which a project\'s NPV is exactly zero [S1]. Accept the project if IRR is greater than the cost of capital.\n\nFor a single inflow: `IRR = (Inflow ÷ Investment)^(1/n) − 1`.\n\nExample from your notes: ₹1,000 returns ₹1,210 after 2 years. (1.21)^(1/2) − 1 = **10%**.\n\n**Check:** the cost of capital is 12%. Accept or reject this project?' },
    coc: { lesson: 'Cost of capital is the average return a firm must pay its financiers [S1]: `WACC = Wd × Kd × (1 − T) + We × Ke`.\n\nOnly debt gets (1 − T), because interest is tax deductible.\n\nExample from your notes: Wd 40%, Kd 10%, T 30%, We 60%, Ke 15%. Debt part = 4 × 0.7 = 2.8%, equity part = 9%. WACC = **11.8%**.\n\n**Check:** what happens to WACC if the tax rate rises?' },
    lev: { lesson: 'Leverage measures how much a small change in sales is magnified in profit [S1].\n\n- DOL = Contribution ÷ EBIT (fixed operating costs)\n- DFL = EBIT ÷ (EBIT − Interest) (fixed financing costs)\n- DCL = DOL × DFL\n\nA DOL of 2 means a 10% rise in sales raises EBIT by 20%.\n\n**Check:** a firm with no fixed operating costs has what DOL?' },
    wc: { lesson: 'Working capital management is about how long cash is tied up in running the business [S1].\n\n`CCC = inventory period + receivables period − payables period`\n\nExample from your notes: 45 + 30 − 25 = **50 days**.\n\n**Check:** if suppliers give you more time to pay, does CCC rise or fall?' },
    pv: { lesson: 'Present value answers one question: what is a future amount worth today?\n\nYour notes [S1] say PV = FV ÷ (1 + r)^n. We **divide**, because money received later is worth less today.\n\nExample from your notes: ₹13,310 due in 3 years at 10%.\n1. (1.10)^3 = 1.331\n2. PV = 13,310 ÷ 1.331 = **₹10,000**\n\n**Check:** if the discount rate rises to 12%, will PV be more or less than ₹10,000?' },
    npv: { lesson: 'NPV asks whether a project is worth more than it costs, measured in today\'s money [S1].\n\n1. Discount every future inflow back to today.\n2. Add them up.\n3. Subtract the initial investment.\n\nFrom your notes: invest ₹1,00,000, inflows ₹40,000 / ₹50,000 / ₹60,000, cost of capital 10%. PV of inflows = ₹1,22,765, so NPV = **₹22,765**. NPV > 0, so accept.\n\n**Check:** if the initial investment were ₹1,30,000, would you accept the project?' }
  };
  function demoReply(intent, sources, topicId) {
    const d = DEMO[topicId]; let text;
    if (d && (intent === 'lesson' || intent === 'ask' || intent === 'resume' || !d[intent])) text = d.lesson;
    else if (d && d[intent]) text = d[intent];
    else text = null;
    if (text && !sources.length) text = text.replace(/ ?\[S1\]/g, '') + '\n\n(No uploaded notes were found for this topic, so no citation is shown.)';
    if (text && sources.length) { const i = sources.findIndex(s => s.topicId === topicId); if (i > 0) sources.unshift(sources.splice(i, 1)[0]); }
    if (!text) text = sources.length ? 'Live AI is off, so I cannot teach this topic. The most relevant passage in your notes is below [S1].\n\n> ' + sources[0].text.slice(0, 420) + '…' : 'Live AI is off and your notes have no passage on this. Upload notes for this subject, or turn on live AI.';
    return text;
  }

  /* ---------- the main ask() ---------- */
  function parseState(raw) { const m = raw.match(/<state>([\s\S]*?)<\/state>/); let st = null; if (m) { try { st = JSON.parse(m[1]); } catch (e) { st = null; } } return { text: raw.replace(/<state>[\s\S]*?(<\/state>|$)/g, '').trim(), st }; }
  async function ask(text, o) {
    o = o || {}; if (ui.busy || !text.trim()) return;
    const intent = o.intent || 'ask', sess = session(), topic = ui.profTopic;
    const sources = SV.retrieve(text + ' ' + (SV.topicInfo(topic) ? SV.topicInfo(topic).title : ''), docIds(), 4, topic).map(c => ({ docName: c.docName, loc: c.loc, text: c.text, topicId: c.topicId, sample: c.sample }));
    const wasDoubt = ui.doubtMode, attach = ui.attach;
    sess.messages.push({ role: 'user', content: o.label || text, ts: Date.now(), img: attach ? attach.name : null });
    let doubtId = null;
    if (wasDoubt) { doubtId = uid(); S().doubts.unshift({ id: doubtId, subjectId: ui.profSub, topicId: topic, text: (o.label || text).slice(0, 160), status: 'open', ts: Date.now() }); sess.lesson = Object.assign(sess.lesson || {}, { paused: true }); }
    const a = { role: 'assistant', content: '', ts: Date.now(), sources, doubtId, live: false, demo: false };
    sess.messages.push(a); ui.busy = true; ui.doubtMode = false; ui.attach = null; sess.updated = Date.now(); S().last = { subjectId: ui.profSub, chapterId: ui.profChap, topicId: topic, lessonPoint: sess.lesson && sess.lesson.lessonPoint }; SV.render();
    try {
      if (!ui.sample) throw { code: 'demo' };
      ui.abort = new AbortController();
      const opts = { onText: r => { a.content = r.text; SV.paintChat(); }, signal: ui.abort.signal, cache: false };
      if (attach && ui.imagesOK) opts.images = [attach.blob];
      const prev = wasDoubt; ui.doubtMode = prev; const prompt = buildPrompt(text, intent, sources, sess); ui.doubtMode = false;
      const res = await ui.sample(prompt, opts); a.content = res.text; a.live = true;
    } catch (e) {
      if (e && (e.code === 'demo' || e.code === 'not_granted')) { a.demo = true; a.content = demoReply(intent, sources, topic); if (e.code === 'not_granted') { ui.demo = true; ui.sample = null; } }
      else if (e && e.code === 'rate_limited') { a.error = true; a.content = 'The AI is rate limited right now. Wait a moment and press Retry.'; }
      else { a.error = true; a.content = 'The AI call failed (' + ((e && (e.message || e.code)) || 'unknown error') + '). Press Retry.'; }
      if (e && e.text && !a.error) a.content = e.text;
    }
    const p = parseState(a.content); a.content = p.text; const st = p.st;
    if (st && !a.error) {
      a.state = st; const tid = SV.topicInfo(st.topicId) ? st.topicId : topic;
      if (st.signal && st.signal !== 'none' && st.dimension && st.dimension !== 'none') SV.bump(tid, { concept: 'c', formula: 'f', numerical: 'n' }[st.dimension], st.signal);
      if (st.misconception && st.misconception !== 'null' && st.signal === 'incorrect') S().mistakes.push({ topicId: tid, label: String(st.misconception).slice(0, 100), ts: Date.now() });
      if (st.lessonPoint) { sess.lesson = Object.assign(sess.lesson || {}, { topicId: tid, lessonPoint: String(st.lessonPoint).slice(0, 90) }); S().last.lessonPoint = sess.lesson.lessonPoint; }
      if (st.outside) a.outside = true;
    } else if (!a.error) { sess.lesson = Object.assign(sess.lesson || {}, { topicId: topic, lessonPoint: SV.topicInfo(topic) ? SV.topicInfo(topic).title : '' }); }
    if (a.error) a.retry = { text, intent, label: o.label };
    ui.busy = false; SV.save(); SV.render();
  }
  /* Free-tier deployment: POST /api/ai (Cloudflare Pages Function) holds the model key server-side. Returns null if the endpoint is absent. */
  async function proxyProvider() {
    try {
      const r = await fetch('/api/ai', { method: 'GET' }); if (!r.ok) return null; const j = await r.json(); if (!j || !j.ready) return null;
      const call = async (prompt, opts, wantJson) => {
        const res = await fetch('/api/ai', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt, json: !!wantJson }), signal: opts && opts.signal });
        const d = await res.json().catch(() => ({})); if (!res.ok) throw { code: res.status === 429 ? 'rate_limited' : 'error', message: d.error || ('HTTP ' + res.status) };
        if (opts && opts.onText) opts.onText({ text: d.text }); return d.text;
      };
      const f = async (prompt, opts) => ({ text: await call(prompt, opts, false), truncated: false });
      f.json = async (prompt, opts) => JSON.parse(await call(prompt, opts, true));
      f.limits = async () => ({ images: false });
      return f;
    } catch (e) { return null; }
  }
  async function initSample() {
    try {
      let s = window.claude && window.claude.use ? await window.claude.use('sample') : null;
      if (!s) s = await proxyProvider();
      ui.sample = s || null; ui.demo = !s; if (s && s.limits) { try { const l = await s.limits(); ui.imagesOK = !!(l && l.images); } catch (e) { } } } catch (e) { ui.sample = null; ui.demo = true; }
    if (ui.view === 'professor') SV.render();
  }
  async function aiQuestions(subjectId, topicTitle) {
    const ids = S().docs.filter(d => d.subjectId === subjectId && d.on).map(d => d.id), src = SV.retrieve(topicTitle || 'definition formula example', ids, 5);
    if (!src.length) throw new Error('No notes found for this subject. Upload notes first.');
    const prompt = 'Using ONLY the SOURCES, write 5 multiple-choice questions for a student. Return a JSON array. Each item: {"q":string,"options":[4 strings],"answer":index 0-3,"why":string,"loc":"source label like p.3"}. Do not invent facts that are not in the sources. If you include numbers, double-check the arithmetic.\n\nSOURCES:\n' + src.map(s => `(${s.docName}, ${s.loc})\n${s.text}`).join('\n\n');
    const arr = await ui.sample.json(prompt, { cache: false });
    return (Array.isArray(arr) ? arr : []).filter(x => x && x.q && Array.isArray(x.options) && x.options.length >= 2).slice(0, 5).map(x => ({ id: 'ai-' + uid(), topicId: null, kind: 'mcq', dim: 'c', source: 'ai', ref: x.loc || '', prompt: x.q, opts: x.options.map(String), ai: Math.max(0, Math.min(x.options.length - 1, +x.answer || 0)), why: x.why || '' }));
  }
  Object.assign(SV, { md, ask, session, docIds, initSample, aiQuestions, INTENT });
})(window.SV);
