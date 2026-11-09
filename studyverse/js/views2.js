/* Views: AI Professor (chat, doubts, context panel) and Practice (numerical lab, quiz, flashcards, FM workspace). */
(function (SV) {
  const { esc, ic, bar, pill, uid, dkey, subj, score, ui, md } = SV;
  const S = () => SV.S; const V = SV.V, A = SV.A, C = SV.C;
  const empty = (h, p, btn) => `<div class="empty"><h4>${h}</h4><p>${p}</p>${btn || ''}</div>`;

  function ensureSel() {
    const D = S(); if (!subj(ui.profSub)) ui.profSub = (D.last && subj(D.last.subjectId) ? D.last.subjectId : (D.subjects[0] || {}).id) || null;
    const s = subj(ui.profSub); if (!s) return;
    if (!s.chapters.some(c => c.id === ui.profChap)) ui.profChap = (s.chapters[0] || {}).id || null;
    const c = s.chapters.find(x => x.id === ui.profChap);
    if (c && !c.topics.some(t => t.id === ui.profTopic)) ui.profTopic = (c.topics[0] || {}).id || null;
  }
  const AMODES = [['simpler', 'Explain this more simply', true], ['differently', 'Explain differently'], ['example', 'Give another example'], ['steps', 'Explain step by step'], ['formula', 'Show formula'], ['why', 'Why this formula?'], ['similar', 'Give a similar problem'], ['test', 'Test my understanding']];

  function msgHtml(m, i) {
    if (m.role === 'user') return `<div class="msg u"><div class="b">${esc(m.content)}${m.img ? `<div class="sm" style="opacity:.8;margin-top:4px">${ic('image')} ${esc(m.img)}</div>` : ''}</div></div>`;
    const srcs = (m.sources || []).map((s, k) => `<button class="chip" data-act="openSource" data-a="${k + 1}" data-b="${i}">S${k + 1} · ${esc(s.docName.replace(/\.[a-z]+$/i, ''))}, ${esc(s.loc)}</button>`).join('');
    const tag = m.live ? pill('Live AI', 'good') : m.demo ? pill('Demo script, not live AI', 'warn') : '';
    const out = m.outside ? pill('Includes material outside your notes', 'warn') : '';
    const blank = !m.content && ui.busy && i === S2().messages.length - 1;
    return `<div class="msg a"><div class="av">${ic('cap')}</div><div class="b">${blank ? '<span class="typing"><i></i><i></i><i></i></span>' : md(m.content, i)}
      <div class="row" style="margin-top:8px;gap:6px">${tag}${out}${m.doubtId ? pill('Doubt logged', 'acc') : ''}</div>
      ${srcs ? `<div class="src-row"><span class="muted sm">Sources:</span>${srcs}</div>` : (m.content && !m.error ? '<div class="muted sm" style="margin-top:8px">No passage in your notes matched this question.</div>' : '')}
      ${m.retry ? `<div style="margin-top:8px"><button class="btn s" data-act="retry" data-a="${i}">${ic('refresh')} Retry</button></div>` : ''}</div></div>`;
  }
  const S2 = () => SV.session();

  V.professor = function () {
    ensureSel(); const D = S();
    if (!D.subjects.length) return `<div class="page-h"><div><h1>AI Professor</h1></div></div>` + empty('Create a subject first', 'The Professor teaches from your subject notes.', '<button class="btn primary" data-act="nav" data-a="subjects">Create subject</button>');
    const s = subj(ui.profSub), ch = s.chapters.find(c => c.id === ui.profChap) || { topics: [], title: '' }, sess = S2(), info = SV.topicInfo(ui.profTopic), sc = score(ui.profTopic), lv = SV.level(sc), m = D.mastery[ui.profTopic] || {};
    const docs = D.docs.filter(d => d.subjectId === s.id), mastered = ch.topics.filter(t => (score(t.id) || 0) >= 80), attn = ch.topics.filter(t => score(t.id) != null && score(t.id) < 55), doubts = SV.openDoubts(s.id);
    const lastSrc = (sess.messages.slice().reverse().find(x => x.role === 'assistant' && x.sources && x.sources.length) || {}).sources || [];
    const paused = sess.lesson && sess.lesson.paused;
    const ctrls = `<div class="row" style="margin-bottom:12px;gap:8px"><div class="field" style="min-width:150px;flex:1"><label for="p-sub">Subject</label><select id="p-sub" data-chg="pSub">${D.subjects.map(x => `<option value="${x.id}" ${x.id === s.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
      <div class="field" style="min-width:150px;flex:1"><label for="p-chap">Chapter</label><select id="p-chap" data-chg="pChap">${s.chapters.map(c => `<option value="${c.id}" ${c.id === ui.profChap ? 'selected' : ''}>${esc(c.title)}</option>`).join('')}</select></div>
      <div class="field" style="min-width:150px;flex:1"><label for="p-top">Topic</label><select id="p-top" data-chg="pTop">${ch.topics.map(t => `<option value="${t.id}" ${t.id === ui.profTopic ? 'selected' : ''}>${esc(t.title)}</option>`).join('')}</select></div>
      <div class="field"><label>Teaching mode</label><div class="tabs"><button class="${ui.mode === 'deep' ? 'on' : ''}" data-act="mode" data-a="deep" title="Complete conceptual understanding from the basics">Deep Learning</button><button class="${ui.mode === 'express' ? 'on' : ''}" data-act="mode" data-a="express" title="Efficient exam preparation">Exam Express</button></div></div></div>`;
    const banner = ui.demo ? `<div class="banner warn"><span><b>Live AI is not connected here.</b> Replies come from a short scripted demo for the Financial Management sample topics and are labelled as such. Finding passages in your notes is real.</span>${ui.sample === null ? '' : ''}</div>` : '';
    const msgs = sess.messages.length ? sess.messages.map(msgHtml).join('') : `<div class="empty" style="margin:auto;max-width:520px"><div class="av" style="width:40px;height:40px">${ic('cap')}</div><h4>${info ? esc(info.title) : 'Choose a topic'}</h4><p>${docs.some(d => d.on) ? `Ready to teach from ${docs.filter(d => d.on).length} of your file${docs.filter(d => d.on).length === 1 ? '' : 's'}. ${esc(lv.label)}.` : 'No notes are selected for this subject. Upload or enable a file so answers can cite it.'}</p>
      <div class="row" style="justify-content:center"><button class="btn primary" data-act="teach">${ic('play')} Teach me this topic</button>${docs.length ? '' : '<button class="btn" data-act="nav" data-a="notes">Upload notes</button>'}</div></div>`;
    const prior = Object.values(D.sessions).filter(x => x.messages.length && !(x.subjectId === ui.profSub && x.chapterId === ui.profChap)).sort((a, b) => b.updated - a.updated).slice(0, 3);
    return `<div class="page-h"><div><h1>AI Professor</h1><p>Teaches from your notes, adapts to what you show you understand, and resolves doubts without losing your place.</p></div><div class="row"><button class="btn s" data-act="newSession">${ic('plus')} Fresh session</button><button class="btn s" data-act="toggleCtx">${ic('layers')} Context</button></div></div>${banner}${ctrls}
    <div class="prof"><div class="card chat-wrap raised">
      ${paused ? `<div class="resume" style="margin:12px 14px 0"><span>${ic('pause')} Lesson paused${sess.lesson.lessonPoint ? ' at: <b>' + esc(sess.lesson.lessonPoint) + '</b>' : ''}</span><button class="btn s primary" data-act="resume">Resume lesson</button></div>` : ''}
      <div class="chat" id="chat">${msgs}</div>
      <div class="composer">
        ${sess.messages.length ? `<div class="chips"><button class="chip main" data-act="aid" data-a="simpler">Explain this more simply</button>${AMODES.slice(1).map(a => `<button class="chip" data-act="aid" data-a="${a[0]}">${a[1]}</button>`).join('')}</div>` : ''}
        ${ui.attach ? `<div class="pill acc">${ic('image')} ${esc(ui.attach.name)} <button class="btn s ghost" data-act="rmAttach" style="padding:0 4px">${ic('x')}</button></div>` : ''}
        ${ui.doubtMode ? `<div class="pill warn">Doubt mode: the lesson pauses, I resolve this, then you resume.</div>` : ''}
        <div class="in"><label class="btn" title="${ui.imagesOK ? 'Attach a screenshot or handwritten page' : 'Image doubts need live AI with image support'}" style="padding:9px"><input type="file" id="imgIn" data-chg="attach" accept="image/*" hidden ${ui.imagesOK ? '' : 'disabled'}>${ic('image')}</label>
          <textarea id="msg" placeholder="${ui.doubtMode ? 'Type your doubt, for example: why do we divide by (1 + r)^n here?' : 'Ask about your notes, a formula, or a step in a solution'}" rows="1">${esc(ui.draft)}</textarea>
          <button class="btn ${ui.doubtMode ? 'soft' : ''}" data-act="doubt" title="Interrupt and ask a doubt">${ic('help')} Doubt</button>
          <button class="btn primary" data-act="send" ${ui.busy ? 'disabled' : ''}>${ic('send')}</button></div></div></div>
    <aside class="ctx stack ${ui.ctxOpen ? 'open' : ''}">
      <div class="card"><h3>Learning context</h3><div class="stack sm"><div class="row sp"><span class="muted">Subject</span><b>${esc(s.name)}</b></div><div class="row sp"><span class="muted">Chapter</span><b style="text-align:right">${esc(ch.title)}</b></div><div class="row sp"><span class="muted">Mode</span>${pill(ui.mode === 'deep' ? 'Deep Learning' : 'Exam Express', 'acc')}</div></div></div>
      <div class="card"><h3>Your level on this topic</h3><p class="sm" style="margin-bottom:8px">${esc(lv.label)}${sc == null ? ' (no evidence yet)' : ''}</p>${[['Concept', m.c], ['Formula', m.f], ['Numerical', m.n]].map(r => `<div class="sm" style="margin-bottom:7px"><div class="row sp"><span>${r[0]}</span><span class="mono">${r[1] == null ? '–' : r[1] + '%'}</span></div>${bar(r[1])}</div>`).join('')}<p class="muted sm">Updates only from answers you give. It can go up or down.</p></div>
      <div class="card"><h3>Mastered / needs attention</h3>${mastered.map(t => `<div class="sm" style="margin-bottom:4px">${pill(ic('check') + ' ' + esc(t.title), 'good')}</div>`).join('') || '<p class="muted sm">Nothing mastered in this chapter yet.</p>'}${attn.map(t => `<div class="sm" style="margin-top:4px">${pill(esc(t.title) + ' · ' + score(t.id) + '%', 'bad')}</div>`).join('')}</div>
      <div class="card"><h3>Unresolved doubts <span class="mono sm">${doubts.length}</span></h3>${doubts.slice(0, 4).map(d => `<div class="item"><div class="grow sm">${esc(d.text)}</div><button class="btn s" data-act="resolveDoubt" data-a="${d.id}">${ic('check')}</button></div>`).join('') || '<p class="muted sm">No open doubts.</p>'}${doubts.length ? `<button class="btn s" style="margin-top:8px" data-act="askDoubt" data-a="${doubts[0].id}">Revisit the latest</button>` : ''}</div>
      <div class="card"><h3>Sources</h3>${(lastSrc.length ? lastSrc.map((x, k) => `<div class="sm" style="margin-bottom:6px"><span class="pill acc">S${k + 1}</span> ${esc(x.docName)}, ${esc(x.loc)}</div>`).join('') : '') || docs.map(d => `<label class="sm row" style="gap:6px;margin-bottom:4px"><input type="checkbox" data-chg="docOn" data-a="${d.id}" ${d.on ? 'checked' : ''}> ${esc(d.name)}</label>`).join('') || '<p class="muted sm">No files in this subject.</p>'}</div>
      ${prior.length ? `<div class="card"><h3>Earlier sessions</h3>${prior.map(x => `<div class="item"><div class="grow sm"><b>${esc((subj(x.subjectId) || {}).name || '')}</b><div class="muted">${esc(((subj(x.subjectId) || { chapters: [] }).chapters.find(c => c.id === x.chapterId) || {}).title || '')}</div></div><button class="btn s" data-act="openSession" data-a="${x.subjectId}" data-b="${x.chapterId}">Resume</button></div>`).join('')}</div>` : ''}
    </aside></div>`;
  };
  SV.paintChat = function () { if (ui.view !== 'professor') return; const ch = SV.$('#chat'); if (!ch) return; const near = ch.scrollHeight - ch.scrollTop - ch.clientHeight < 120; const msgs = S2().messages; ch.innerHTML = msgs.map(msgHtml).join(''); if (near || ui.busy) ch.scrollTop = ch.scrollHeight; const b = SV.$('[data-act=send]'); if (b) b.disabled = ui.busy; };

  C.pSub = el => { ui.profSub = el.value; ui.profChap = null; ui.profTopic = null; SV.render(); };
  C.pChap = el => { ui.profChap = el.value; ui.profTopic = null; SV.render(); };
  C.pTop = el => { ui.profTopic = el.value; SV.render(); };
  A.mode = el => { ui.mode = el.dataset.a; SV.render(); };
  A.toggleCtx = () => { ui.ctxOpen = !ui.ctxOpen; SV.render(); };
  A.newSession = () => { delete S().sessions[ui.profSub + '|' + ui.profChap]; SV.save(); SV.render(); };
  A.teach = () => { const t = SV.topicInfo(ui.profTopic); SV.ask('Teach me ' + (t ? t.title : 'this topic') + '.', { intent: 'lesson', label: 'Teach me ' + (t ? t.title : 'this topic') }); };
  A.send = () => { const el = SV.$('#msg'), v = el.value.trim(); if (!v) return; ui.draft = ''; SV.ask(v); el.value = ''; };
  A.doubt = () => { ui.doubtMode = !ui.doubtMode; ui.draft = (SV.$('#msg') || {}).value || ''; SV.render(); const e = SV.$('#msg'); if (e) e.focus(); };
  A.aid = el => { const k = el.dataset.a, lab = (AMODES.find(a => a[0] === k) || [k, k])[1]; SV.ask(lab + '.', { intent: k, label: lab }); };
  A.resume = () => { const sess = S2(); sess.lesson.paused = false; SV.ask('Resume the lesson.', { intent: 'resume', label: 'Resume the lesson' }); };
  A.retry = el => { const sess = S2(), m = sess.messages[+el.dataset.a]; const r = m.retry; sess.messages.splice(+el.dataset.a - 1, 2); SV.ask(r.text, { intent: r.intent, label: r.label }); };
  A.rmAttach = () => { ui.attach = null; SV.render(); };
  C.attach = el => { const f = el.files[0]; if (f) { ui.attach = { name: f.name, blob: f }; SV.render(); } };
  A.openSource = el => { const m = S2().messages[+el.dataset.b], s = m && m.sources && m.sources[+el.dataset.a - 1]; if (!s) return; ui.modal = `<div class="row sp"><b>${esc(s.docName)}</b>${pill(esc(s.loc), 'acc')}</div><p class="sm" style="margin:12px 0">${esc(s.text)}</p>${s.sample ? '<p class="muted sm">This passage comes from the built-in sample notes, not your own upload.</p>' : ''}<button class="btn" data-act="closeModal">Close</button>`; SV.render(); };
  A.resolveDoubt = el => { const d = S().doubts.find(x => x.id === el.dataset.a); d.status = 'resolved'; d.resolvedDay = dkey(); SV.save(); SV.render(); SV.toast('Marked resolved'); };
  A.askDoubt = el => { const d = S().doubts.find(x => x.id === el.dataset.a); if (d.topicId) { const ti = SV.topicInfo(d.topicId); if (ti) { ui.profSub = ti.subject.id; ui.profChap = ti.chapter.id; ui.profTopic = d.topicId; } } ui.doubtMode = true; ui.draft = d.text; SV.render(); };
  A.openSession = el => { ui.profSub = el.dataset.a; ui.profChap = el.dataset.b; ui.profTopic = null; SV.render(); };
  A.learn = el => { const ti = SV.topicInfo(el.dataset.a); if (!ti) return SV.toast('Add a topic first'); ui.profSub = ti.subject.id; ui.profChap = ti.chapter.id; ui.profTopic = ti.id; location.hash = 'professor'; SV.render(); };

  /* ---------- Practice ---------- */
  V.practice = function () {
    const D = S(), pr = ui.pr || (ui.pr = { tab: 'numerical', q: null, sel: {}, picked: null, revealed: false, res: null, i: 0, flip: false, steps: 0, topics: null, session: [], done: false, aiBusy: false });
    const tabs = `<div class="tabs">${[['numerical', 'Numerical lab'], ['quiz', 'Quiz'], ['cards', 'Flashcards'], ['mistakes', 'Mistakes'], ['fm', 'FM workspace']].map(t => `<button class="${pr.tab === t[0] ? 'on' : ''}" data-act="prTab" data-a="${t[0]}">${t[1]}</button>`).join('')}</div>`;
    const tps = SV.allTopics(), tsel = `<div class="field" style="min-width:220px"><label for="pr-topic">Topic</label><select id="pr-topic" data-chg="prTopic"><option value="">All topics</option>${tps.map(t => `<option value="${t.id}" ${pr.topics === t.id ? 'selected' : ''}>${esc(t.title)}</option>`).join('')}</select></div>`;
    let body = '';
    if (pr.tab === 'numerical') body = numLab(pr, tsel); else if (pr.tab === 'quiz') body = quiz(pr, tsel); else if (pr.tab === 'cards') body = cards(pr, tsel); else if (pr.tab === 'mistakes') body = mistakes(); else body = fm();
    return `<div class="page-h"><div><h1>Practice</h1><p>Generated from the concepts in your notes. Generated questions are labelled and are never official exam questions.</p></div>${tabs}</div>${body}`;
  };
  function srcPill(q) { return q.source === 'notes' ? pill('From your notes' + (q.ref ? ' · ' + esc(q.ref) : ''), 'good') : q.source === 'ai' ? pill('AI-generated from your notes' + (q.ref ? ' · ' + esc(q.ref) : ''), 'acc') : pill('Generated from your notes\' concepts', 'acc'); }
  function numLab(pr, tsel) {
    const q = pr.q && pr.q.kind === 'num' ? pr.q : null;
    if (!q) return `<div class="card raised"><div class="row sp"><div><h3 style="margin:0">Numerical practice</h3><p class="muted sm">Each problem has verified values and a worked solution you reveal when ready.</p></div><div class="row">${tsel}<button class="btn primary" data-act="newNum">${ic('play')} New problem</button></div></div></div>`;
    const res = pr.res;
    return `<div class="card raised qbox"><div class="row sp">${srcPill(q)}${pill(esc(SV.topicInfo(q.topicId) ? SV.topicInfo(q.topicId).title : ''))}</div>
      <div style="font-size:16px;font-weight:500">${esc(q.prompt)}</div>
      <div class="given">${q.given.map(g => `<div><span>${esc(g[0])}</span><b>${esc(String(g[1]))}</b></div>`).join('')}</div>
      <div><div class="muted sm" style="margin-bottom:6px">1. Choose the formula</div><div class="stack">${q.formulas.map((f, i) => `<button class="opt ${pr.picked === i ? (res ? (i === q.fi ? 'ok' : 'no') : 'sel') : (res && i === q.fi ? 'ok' : '')}" data-act="pickF" data-a="${i}" ${res ? 'disabled' : ''}><span class="mono">${esc(f)}</span></button>`).join('')}</div></div>
      <div class="row" style="align-items:flex-end"><div class="field" style="max-width:240px"><label for="ans">2. Your answer (${q.unit === '₹' ? 'in ₹' : q.unit === '%' ? 'in %' : q.unit === 'days' ? 'in days' : 'as a number'})</label><input type="number" step="any" id="ans" ${res ? 'disabled' : ''} value="${res ? esc(res.val) : ''}"></div>
        <div class="field" style="min-width:150px"><label for="conf">Confidence</label><select id="conf" ${res ? 'disabled' : ''}><option value="sure">Sure</option><option value="unsure" selected>Unsure</option><option value="guess">Guessing</option></select></div>
        ${res ? '' : `<button class="btn primary" data-act="submitNum">Submit</button>`}</div>
      ${res ? `<div class="banner ${res.ok ? '' : 'warn'}" style="margin:0"><span>${res.ok ? '<b>Correct.</b> ' : '<b>Not quite.</b> '}The answer is ${esc(SV.fmtAns(q, q.answer))}.${res.diag ? ' Likely cause: ' + esc(res.diag) + '.' : (!res.ok && !res.fok ? ' The formula choice was wrong, so start there.' : '')}</span><div class="row"><button class="btn s" data-act="askStep">${ic('help')} Ask the Professor</button><button class="btn s primary" data-act="newNum">Next problem</button></div></div>` : ''}
      <div><button class="btn s" data-act="revealSteps">${pr.revealed ? 'Hide' : 'Reveal'} step-by-step solution</button>${pr.revealed ? `<ol class="steps" style="margin-top:10px">${q.steps.map((s, i) => `<li><div class="grow">${esc(s)}</div><button class="btn s ghost" data-act="stepDoubt" data-a="${i}">${ic('help')} Doubt</button></li>`).join('')}</ol>` : ''}</div></div>`;
  }
  function quiz(pr, tsel) {
    const qs = pr.session && pr.session.length && pr.tab === 'quiz' && pr.kind === 'mcq' ? pr.session : null;
    if (!qs) return `<div class="card raised"><div class="row sp"><div><h3 style="margin:0">Quick quiz</h3><p class="muted sm">Multiple-choice conceptual and formula questions.</p></div><div class="row">${tsel}<button class="btn primary" data-act="startQuiz">Start 5 questions</button>${ui.sample ? `<button class="btn" data-act="aiQuiz" ${pr.aiBusy ? 'disabled' : ''}>${pr.aiBusy ? 'Writing…' : 'AI-written from my notes'}</button>` : ''}</div></div>${pr.err ? `<p class="sm" style="color:var(--bad);margin-top:8px">${esc(pr.err)}</p>` : ''}${pr.last ? `<p class="sm" style="margin-top:10px">Last score: <b>${pr.last}</b></p>` : ''}</div>`;
    if (pr.done) return `<div class="card raised" style="text-align:center"><div class="count">${qs.filter(q => q.right).length}/${qs.length}</div><p class="muted" style="margin:8px 0 14px">Your topic mastery has been updated.</p><button class="btn primary" data-act="startQuiz">Another round</button></div>`;
    const q = qs[pr.i];
    return `<div class="card raised qbox"><div class="row sp"><span class="muted sm">Question ${pr.i + 1} of ${qs.length}</span>${srcPill(q)}</div><div style="font-size:16px;font-weight:500">${esc(q.prompt)}</div>
      <div class="stack">${q.opts.map((o, i) => `<button class="opt ${q.chosen == null ? '' : i === q.ai ? 'ok' : i === q.chosen ? 'no' : ''}" data-act="mcq" data-a="${i}" ${q.chosen != null ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>
      ${q.chosen != null ? `<div class="banner" style="margin:0"><span>${q.right ? '<b>Correct.</b>' : '<b>Not quite.</b>'} ${esc(q.why)}</span><button class="btn s primary" data-act="nextQ">${pr.i + 1 >= qs.length ? 'Finish' : 'Next'}</button></div>` : ''}</div>`;
  }
  function cards(pr, tsel) {
    const list = pr.cards || (pr.cards = SV.shuf(SV.CARDS.filter(c => !pr.topics || c.topicId === pr.topics)));
    if (!list.length) return `<div class="card">${tsel}${empty('No flashcards for this topic', 'Flashcards exist for the Financial Management formulas. Choose another topic.')}</div>`;
    const c = list[pr.ci || 0], seen = S().cards[c.id];
    return `<div class="stack"><div class="row sp"><span class="muted sm">${(pr.ci || 0) + 1} of ${list.length} · ${pill('Generated formula cards', 'acc')}</span>${tsel}</div><div class="card raised flash" data-act="flip">${pr.flip ? `<div><div class="muted sm" style="margin-bottom:8px">Answer</div>${esc(c.back)}</div>` : `<div><div class="muted sm" style="margin-bottom:8px">Question</div>${esc(c.front)}</div>`}</div>
      <div class="row" style="justify-content:center"><button class="btn" data-act="flip">${pr.flip ? 'Show question' : 'Show answer'}</button>${pr.flip ? `<button class="btn" data-act="cardRate" data-a="0">Missed it</button><button class="btn soft" data-act="cardRate" data-a="1">Got it</button>` : ''}</div>${seen ? `<p class="center muted sm" style="text-align:center">Last rating: ${seen.ok ? 'got it' : 'missed'}</p>` : ''}</div>`;
  }
  function mistakes() {
    const mc = SV.mistakeCounts();
    return `<div class="card raised"><h3>Mistake-based practice</h3>${mc.length ? mc.slice(0, 6).map(x => `<div class="item"><div class="grow"><div class="t">${esc(x.label)}</div><div class="muted sm">${esc((SV.topicInfo(x.topicId) || { title: '' }).title)} · seen ${x.n}×</div></div><button class="btn s primary" data-act="practiceTopic" data-a="${x.topicId}">Practise this</button></div>`).join('') : empty('No mistakes recorded yet', 'Mistakes appear here after practice. They are used to target your next questions, never to label you.')}</div>`;
  }
  function fm() {
    const items = [['Time Value of Money', 'fv', 'Money today is worth more than the same amount later. Compounding moves value forward, discounting moves it back.'], ['Present & Future Value', 'pv', 'FV = PV × (1 + r)^n and PV = FV ÷ (1 + r)^n.'], ['Annuities', 'annuity', 'Equal payments at equal intervals. Ordinary: end of period. Due: start of period.'], ['Perpetuities', 'perp', 'PV = C ÷ r. Growing: C1 ÷ (r − g).'], ['Effective Rate of Interest', 'ear', 'EAR = (1 + i/m)^m − 1. Compare deposits and loans on this basis.'], ['Capital Budgeting: NPV', 'npv', 'Accept when the PV of inflows exceeds the investment.'], ['IRR', 'irr', 'The rate that makes NPV zero.'], ['Cost of Capital', 'coc', 'WACC = Wd × Kd × (1 − T) + We × Ke.'], ['Leverage', 'lev', 'DOL, DFL and DCL measure sensitivity to sales and interest.'], ['Working Capital', 'wc', 'CCC = inventory + receivables − payables periods.']];
    return `<div class="banner"><span><b>Sample Financial Management workspace.</b> Illustrative content written for this demo. Real tutoring uses your own uploaded notes first.</span></div><div class="grid g2">${items.map(i => `<div class="card"><div class="row sp"><b>${i[0]}</b>${pill(SV.score(i[1]) == null ? 'Not started' : SV.score(i[1]) + '%', SV.score(i[1]) != null && SV.score(i[1]) < 50 ? 'bad' : 'acc')}</div><p class="sm muted" style="margin:6px 0 12px">${i[2]}</p><div class="row"><button class="btn s soft" data-act="learn" data-a="${i[1]}">Learn with Professor</button><button class="btn s" data-act="practiceTopic" data-a="${i[1]}">Practise</button></div></div>`).join('')}</div>`;
  }

  A.prTab = el => { ui.pr.tab = el.dataset.a; ui.pr.q = null; ui.pr.session = []; ui.pr.kind = null; ui.pr.cards = null; ui.pr.ci = 0; ui.pr.flip = false; SV.render(); };
  C.prTopic = el => { ui.pr.topics = el.value || null; ui.pr.cards = null; ui.pr.ci = 0; SV.render(); };
  A.practiceTopic = el => { ui.pr = null; V.practice(); ui.pr.topics = el.dataset.a; ui.pr.tab = 'numerical'; location.hash = 'practice'; A.newNum(); };
  A.newNum = () => { const pr = ui.pr, ids = pr.topics ? [pr.topics] : null, gen = ids ? ids.filter(i => SV.GEN[i]) : null; if (ids && !gen.length) { pr.q = null; SV.toast('Numerical generator not available for this topic yet. Try the quiz.'); return SV.render(); } pr.q = SV.numFor(gen, 1)[0]; pr.picked = null; pr.res = null; pr.revealed = false; SV.render(); };
  A.pickF = el => { ui.pr.picked = +el.dataset.a; SV.render(); const a = SV.$('#ans'); if (a) a.focus(); };
  A.revealSteps = () => { ui.pr.revealed = !ui.pr.revealed; SV.render(); };
  A.submitNum = () => {
    const pr = ui.pr, q = pr.q, v = parseFloat(SV.$('#ans').value); if (pr.picked == null) return SV.toast('Choose a formula first'); if (isNaN(v)) return SV.toast('Enter your answer');
    const ok = Math.abs(v - q.answer) <= q.tol, fok = pr.picked === q.fi; let diag = null; if (!ok) { const t = (q.traps || []).find(t => Math.abs(v - t.v) <= Math.max(q.tol, Math.abs(t.v) * .004)); diag = t ? t.l : (fok ? 'Arithmetic slip after choosing the right formula' : 'Chose a formula that does not fit this situation'); }
    pr.res = { ok, fok, diag, val: String(v) }; S().attempts.push({ id: uid(), topicId: q.topicId, kind: 'num', correct: ok, ts: Date.now(), diag, conf: SV.$('#conf').value, source: 'generated' });
    SV.bump(q.topicId, 'f', fok ? 'correct' : 'incorrect'); SV.bump(q.topicId, 'n', ok ? 'correct' : 'incorrect'); SV.addLog(SV.topicInfo(q.topicId) ? SV.topicInfo(q.topicId).subject.id : 'fm', 3); pr.revealed = !ok; SV.save(); SV.render();
  };
  A.askStep = () => { const q = ui.pr.q, ti = SV.topicInfo(q.topicId); ui.profSub = ti.subject.id; ui.profChap = ti.chapter.id; ui.profTopic = ti.id; ui.doubtMode = true; ui.draft = 'I got ' + ui.pr.res.val + ' for: "' + q.prompt + '" The answer is ' + SV.fmtAns(q, q.answer) + '. Where did I go wrong?'; location.hash = 'professor'; SV.render(); };
  A.stepDoubt = el => { const q = ui.pr.q, ti = SV.topicInfo(q.topicId); ui.profSub = ti.subject.id; ui.profChap = ti.chapter.id; ui.profTopic = ti.id; ui.doubtMode = true; ui.draft = 'In the problem "' + q.prompt + '", I do not understand this step: "' + q.steps[+el.dataset.a] + '"'; location.hash = 'professor'; SV.render(); };
  A.startQuiz = () => { const pr = ui.pr, ids = pr.topics ? [pr.topics] : null; pr.session = SV.mcqFor(ids, 5); if (!pr.session.length) { SV.toast('No quiz questions for that topic yet. Choose All topics.'); return SV.render(); } pr.kind = 'mcq'; pr.i = 0; pr.done = false; SV.render(); };
  A.aiQuiz = async () => { const pr = ui.pr; pr.aiBusy = true; pr.err = null; SV.render(); try { const t = pr.topics && SV.topicInfo(pr.topics); const qs = await SV.aiQuestions((t ? t.subject.id : S().subjects[0].id), t && t.title); if (!qs.length) throw new Error('The AI returned no usable questions. Try again.'); pr.session = qs; pr.kind = 'mcq'; pr.i = 0; pr.done = false; } catch (e) { pr.err = e.message || 'Could not generate questions.'; } pr.aiBusy = false; SV.render(); };
  A.mcq = el => { const pr = ui.pr, q = pr.session[pr.i], i = +el.dataset.a; q.chosen = i; q.right = i === q.ai; S().attempts.push({ id: uid(), topicId: q.topicId || 'fv', kind: 'mcq', correct: q.right, ts: Date.now(), diag: q.right ? null : (q.why || '').slice(0, 90), conf: 'unsure', source: q.source }); if (q.topicId) SV.bump(q.topicId, q.dim, q.right ? 'correct' : 'incorrect'); SV.addLog((SV.topicInfo(q.topicId) || { subject: { id: 'fm' } }).subject.id, 2); SV.save(); SV.render(); };
  A.nextQ = () => { const pr = ui.pr; if (pr.i + 1 >= pr.session.length) { pr.done = true; pr.last = pr.session.filter(q => q.right).length + '/' + pr.session.length; } else pr.i++; SV.render(); };
  A.flip = () => { ui.pr.flip = !ui.pr.flip; SV.render(); };
  A.cardRate = el => { const pr = ui.pr, c = pr.cards[pr.ci || 0], ok = el.dataset.a === '1'; S().cards[c.id] = { ok, ts: Date.now() }; if (c.topicId) SV.bump(c.topicId, 'f', ok ? 'correct' : 'incorrect'); pr.ci = ((pr.ci || 0) + 1) % pr.cards.length; pr.flip = false; SV.save(); SV.render(); };
})(window.SV);
