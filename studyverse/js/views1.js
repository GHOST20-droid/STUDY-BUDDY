/* Views: Dashboard, My Subjects, Notes Library (+ community). Actions registered on SV.A / SV.C. */
(function (SV) {
  const { esc, ic, bar, pill, uid, dkey, daysUntil, fdate, ago, subj, score, ui } = SV;
  const S = () => SV.S; const V = SV.V = SV.V || {}; const A = SV.A = SV.A || {}; const C = SV.C = SV.C || {};
  const sc = id => { const v = score(id); return v == null ? 'Not started' : v + '%'; };
  const tone = v => v == null ? '' : v >= 80 ? 'good' : v >= 50 ? '' : 'bad';
  const goPage = (v) => { location.hash = v; };
  SV.goPage = goPage;
  const empty = (h, p, btn) => `<div class="empty"><h4>${h}</h4><p>${p}</p>${btn || ''}</div>`;

  /* ---------- Dashboard ---------- */
  V.dashboard = function () {
    const st = SV.streak(), hrs = SV.totalHours(), nx = SV.nextTopic(), weak = SV.weakTopics(4), D = S();
    const exams = D.exams.filter(e => daysUntil(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date));
    const today = dkey(), mins = SV.dayMin(today), solved = D.doubts.filter(d => d.status === 'resolved' && d.resolvedDay === today).length, qs = D.attempts.filter(a => dkey(a.ts) === today).length;
    const goals = [['Study time', Math.round(mins), D.goals.min, 'min'], ['Doubts resolved', solved, D.goals.doubts, ''], ['Practice questions', qs, D.goals.q, '']];
    const recent = D.docs.slice().sort((a, b) => b.added - a.added).slice(0, 4), last = D.last && SV.topicInfo(D.last.topicId);
    return `<div class="page-h"><div><h1>Welcome back</h1><p>${nx ? 'Your next best step is ready.' : 'Create a subject and upload notes to begin.'}</p></div>
      <div class="row"><button class="btn soft" data-act="nav" data-a="professor">${ic('cap')} Open AI Professor</button><button class="btn" data-act="nav" data-a="exam">${ic('cal')} Exam prep</button></div></div>
    <div class="grid g4" style="margin-bottom:16px">
      <div class="card kpi">${ic('flame')}<b>${st} day${st === 1 ? '' : 's'}</b><span>Learning streak</span></div>
      <div class="card kpi">${ic('clock')}<b>${hrs.toFixed(1)} h</b><span>Total study time</span></div>
      <div class="card kpi">${ic('book')}<b>${D.subjects.length}</b><span>Subjects in progress</span></div>
      <div class="card kpi">${ic('help')}<b>${SV.openDoubts().length}</b><span>Unresolved doubts</span></div></div>
    <div class="grid g-main">
      <div class="stack">
        <div class="card raised"><h3>Continue learning</h3>
          ${nx ? `<div class="row sp"><div><div class="muted sm">Recommended next topic</div><div style="font-weight:600;font-size:17px">${esc(nx.x.title)}</div>
            <div class="muted sm">${esc(nx.x.subject.name)} · ${esc(nx.x.chapter.title)} · mastery ${nx.sc == null ? 'not started' : nx.sc + '%'}${nx.days != null ? ' · exam in ' + nx.days + ' days' : ''}</div></div>
            <button class="btn primary" data-act="learn" data-a="${nx.x.id}">${ic('play')} Start</button></div>` : empty('Nothing to recommend yet', 'Add a subject with topics and your next step will appear here.')}
          ${last && D.last.lessonPoint ? `<div class="resume" style="margin-top:12px"><span>Paused in <b>${esc(last.title)}</b> at: ${esc(D.last.lessonPoint)}</span><button class="btn s" data-act="learn" data-a="${last.id}">Resume</button></div>` : ''}</div>
        <div class="card"><h3>Subjects</h3>${D.subjects.length ? D.subjects.map(s => `<div class="item"><span class="sw" style="background:${s.color}"></span><div class="grow"><div class="t">${esc(s.name)}</div>${bar(SV.subjScore(s))}</div><span class="mono sm">${SV.subjScore(s)}%</span><button class="btn s ghost" data-act="openSubject" data-a="${s.id}">${ic('chev')}</button></div>`).join('') : empty('No subjects yet', 'Create your first subject.', '<button class="btn primary" data-act="nav" data-a="subjects">Create subject</button>')}</div>
        <div class="card"><h3>Recently uploaded notes <button class="btn s ghost" data-act="nav" data-a="notes">View all</button></h3>
          ${recent.length ? recent.map(d => `<div class="item">${ic('file')}<div class="grow"><div class="t">${esc(d.name)}</div><div class="muted sm">${esc((subj(d.subjectId) || {}).name || '')} · ${d.pages.length} ${d.type === 'pptx' ? 'slides' : 'pages'} · ${ago(d.added)}</div></div>${d.sample ? pill('Sample', 'acc') : ''}</div>`).join('') : empty('No notes uploaded', 'Upload a PDF, PPTX, DOCX or TXT file to start learning from your own material.', '<button class="btn primary" data-act="nav" data-a="notes">Upload notes</button>')}</div></div>
      <div class="stack">
        <div class="card"><h3>Upcoming examinations</h3>${exams.length ? exams.slice(0, 3).map(e => `<div class="item"><div class="grow"><div class="t">${esc((subj(e.subjectId) || {}).name || 'Subject')}</div><div class="muted sm">${fdate(e.date)} · ${e.hours} h/day</div></div>${pill(daysUntil(e.date) + ' days', daysUntil(e.date) <= 3 ? 'bad' : 'acc')}</div>`).join('') + `<div class="row" style="margin-top:10px"><button class="btn s" data-act="nav" data-a="exam">Open planner</button></div>` : empty('No exams set', 'Add an exam date to get a day-by-day plan.', '<button class="btn" data-act="nav" data-a="exam">Add exam</button>')}</div>
        <div class="card"><h3>Weak topics</h3>${weak.length ? weak.map(w => `<div class="item"><div class="grow"><div class="t">${esc(w.x.title)}</div><div class="muted sm">${esc(w.x.subject.name)}</div></div>${pill(w.sc + '%', 'bad')}<button class="btn s" data-act="practiceTopic" data-a="${w.x.id}">Practise</button></div>`).join('') : '<p class="muted">No weak topics detected yet. They appear after you practise.</p>'}</div>
        <div class="card"><h3>Daily goals</h3>${goals.map(g => `<div style="margin-bottom:10px"><div class="row sp sm"><span>${g[0]}</span><span class="mono">${g[1]} / ${g[2]} ${g[3]}</span></div>${bar(Math.min(100, g[1] / g[2] * 100), g[1] >= g[2] ? 'good' : '')}</div>`).join('')}</div>
      </div></div>`;
  };

  /* ---------- My Subjects ---------- */
  V.subjects = function () {
    const D = S(), sel = subj(ui.subjectSel);
    const head = `<div class="page-h"><div><h1>My Subjects</h1><p>Organise chapters and topics, and see what you have mastered.</p></div></div>`;
    const create = `<div class="card"><h3>Create a subject</h3><div class="row" style="align-items:flex-end"><div class="field" style="flex:1;min-width:200px"><label for="ns-name">Subject name</label><input type="text" id="ns-name" placeholder="e.g. Operations Management"></div><div class="field"><label for="ns-col">Colour</label><input type="color" id="ns-col" value="#4F46E5" style="width:54px;height:36px;border:1px solid var(--line);border-radius:9px;background:var(--surface)"></div><button class="btn primary" data-act="addSubject">${ic('plus')} Create</button></div></div>`;
    if (!sel) return head + `<div class="grid g3" style="margin-bottom:16px">${D.subjects.map(s => { const tps = s.chapters.flatMap(c => c.topics), m = tps.filter(t => (score(t.id) || 0) >= 80).length; return `<div class="card raised"><div class="row"><span class="sw" style="background:${s.color}"></span><b>${esc(s.name)}</b></div><div class="muted sm" style="margin:6px 0 10px">${s.chapters.length} chapters · ${tps.length} topics · ${D.docs.filter(d => d.subjectId === s.id).length} files</div>${bar(SV.subjScore(s))}<div class="row sp sm" style="margin-top:6px"><span>${SV.subjScore(s)}% mastery</span><span class="muted">${m} mastered</span></div><div class="row" style="margin-top:12px"><button class="btn s" data-act="openSubject" data-a="${s.id}">Open</button><button class="btn s soft" data-act="learn" data-a="${(tps[0] || {}).id}">Learn</button></div></div>`; }).join('') || ''}</div>${D.subjects.length ? '' : empty('No subjects yet', 'Create one below.')}${create}`;
    return `<div class="page-h"><div><button class="btn s ghost" data-act="openSubject" data-a="">← All subjects</button><h1 style="margin-top:6px">${esc(sel.name)}</h1></div><div class="row"><button class="btn" data-act="nav" data-a="notes">${ic('upload')} Upload notes</button><button class="btn danger" data-act="${ui.confirm === 'delsub' ? 'delSubject' : 'askDelSubject'}">${ic('trash')} ${ui.confirm === 'delsub' ? 'Confirm delete' : 'Delete'}</button></div></div>
      ${sel.chapters.map(c => `<div class="card" style="margin-bottom:14px"><h3><span>${esc(c.title)}</span><span class="mono sm muted">${SV.chapScore(c)}%</span></h3>${bar(SV.chapScore(c))}
        <div style="margin-top:8px">${c.topics.map(t => { const v = score(t.id), docs = D.docs.filter(d => d.subjectId === sel.id && (d.chapterId === c.id || d.pages.some(p => p.topicId === t.id))).length; return `<div class="item"><div class="grow"><div class="t">${esc(t.title)}</div><div class="muted sm">${docs} source file${docs === 1 ? '' : 's'}</div></div>${pill(v == null ? 'Not started' : v >= 80 ? 'Mastered' : v < 50 ? 'Needs work' : 'Learning', v == null ? '' : v >= 80 ? 'good' : v < 50 ? 'bad' : 'acc')}<span class="mono sm" style="width:44px;text-align:right">${sc(t.id) === 'Not started' ? '–' : sc(t.id)}</span><button class="btn s" data-act="learn" data-a="${t.id}">Learn</button></div>`; }).join('')}</div>
        <div class="row" style="margin-top:10px"><input type="text" id="nt-${c.id}" placeholder="Add a topic to this chapter" style="max-width:300px"><button class="btn s" data-act="addTopic" data-a="${c.id}">${ic('plus')} Add topic</button></div></div>`).join('')}
      <div class="card"><h3>Add a chapter</h3><div class="row"><input type="text" id="nc-title" placeholder="Chapter title" style="max-width:320px"><button class="btn" data-act="addChapter">${ic('plus')} Add chapter</button></div></div>`;
  };
  A.openSubject = el => { ui.subjectSel = el.dataset.a || null; ui.confirm = null; goPage('subjects'); SV.render(); };
  A.addSubject = () => { const n = SV.$('#ns-name').value.trim(); if (!n) return SV.toast('Enter a subject name'); S().subjects.push({ id: 's' + uid(), name: n, color: SV.$('#ns-col').value, chapters: [] }); S().sample = S().sample; SV.save(); SV.render(); SV.toast('Subject created'); };
  A.askDelSubject = () => { ui.confirm = 'delsub'; SV.render(); };
  A.delSubject = () => { const id = ui.subjectSel; const D = S(); D.subjects = D.subjects.filter(s => s.id !== id); D.docs = D.docs.filter(d => d.subjectId !== id); D.exams = D.exams.filter(e => e.subjectId !== id); ui.subjectSel = null; ui.confirm = null; SV.save(); SV.render(); };
  A.addChapter = () => { const s = subj(ui.subjectSel), n = SV.$('#nc-title').value.trim(); if (!s || !n) return SV.toast('Enter a chapter title'); s.chapters.push({ id: 'c' + uid(), title: n, topics: [] }); SV.save(); SV.render(); };
  A.addTopic = el => { const s = subj(ui.subjectSel), c = s.chapters.find(x => x.id === el.dataset.a), n = SV.$('#nt-' + el.dataset.a).value.trim(); if (!n) return SV.toast('Enter a topic name'); c.topics.push({ id: 't' + uid(), title: n }); SV.save(); SV.render(); };

  /* ---------- Notes Library ---------- */
  const TYPE = { pdf: 'PDF', pptx: 'PPTX', docx: 'DOCX', txt: 'TXT', md: 'TXT', csv: 'TXT', paste: 'Pasted' };
  V.notes = function () {
    const D = S(), subs = D.subjects, sid = ui.upSub && subj(ui.upSub) ? ui.upSub : (subs[0] || {}).id, s = subj(sid);
    const q = ui.q.trim(), hits = q ? D.docs.flatMap(d => SV.chunksOf(d)).filter(c => c.text.toLowerCase().includes(q.toLowerCase())).slice(0, 12) : [];
    const head = `<div class="page-h"><div><h1>Notes Library</h1><p>Your files are the primary source for every explanation.</p></div><div class="tabs"><button class="${ui.notesTab === 'mine' ? 'on' : ''}" data-act="notesTab" data-a="mine">My notes</button><button class="${ui.notesTab === 'community' ? 'on' : ''}" data-act="notesTab" data-a="community">Community</button></div></div>`;
    if (ui.notesTab === 'community') return head + communityHtml();
    const ups = ui.uploads.map(u => `<div class="item"><div class="grow"><div class="t">${esc(u.name)}</div>${u.err ? `<div class="sm" style="color:var(--bad)">${esc(u.err)}</div>` : bar(u.pct)}</div><span class="mono sm">${u.err ? 'Failed' : u.pct + '%'}</span></div>`).join('');
    const form = !subs.length ? empty('Create a subject first', 'Notes belong to a subject.', '<button class="btn primary" data-act="nav" data-a="subjects">Create subject</button>') : `<div class="card"><h3>Add notes</h3><div class="grid g2" style="margin-bottom:12px"><div class="field"><label for="up-sub">Subject</label><select id="up-sub" data-chg="upSub">${subs.map(x => `<option value="${x.id}" ${x.id === sid ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div><div class="field"><label for="up-chap">Chapter</label><select id="up-chap">${(s ? s.chapters : []).map(c => `<option value="${c.id}">${esc(c.title)}</option>`).join('') || '<option value="">No chapters yet</option>'}</select></div></div>
      <div class="field" style="margin-bottom:12px"><label for="up-vis">Visibility</label><select id="up-vis"><option value="private">Private (only you)</option><option value="shared">Share with classmates</option></select></div>
      <div class="dz" id="dz" data-act="pick">${ic('upload')}<div style="font-weight:600;margin-top:6px">Drop files or click to upload</div><div class="muted sm">PDF, PPTX, DOCX, TXT. Parsed in your browser; text, page and slide numbers are kept.</div></div>
      <input type="file" id="fileIn" data-chg="files" multiple accept=".pdf,.pptx,.docx,.txt,.md,.csv" hidden>
      ${ups ? `<div style="margin-top:12px">${ups}</div>` : ''}
      <details style="margin-top:12px"><summary class="sm" style="cursor:pointer">Or paste text instead</summary><div class="stack" style="margin-top:8px"><input type="text" id="paste-name" placeholder="Title, e.g. Lecture 4 summary"><textarea id="paste-text" placeholder="Paste your notes here"></textarea><div><button class="btn" data-act="pasteSave">Save pasted notes</button></div></div></details></div>`;
    const mine = D.docs.filter(d => !ui.fSub || d.subjectId === ui.fSub);
    const groups = {}; mine.forEach(d => { const k = d.subjectId + '|' + d.chapterId; (groups[k] = groups[k] || []).push(d); });
    const list = mine.length ? Object.keys(groups).map(k => { const [si, ci] = k.split('|'), su = subj(si), ch = su && su.chapters.find(c => c.id === ci); return `<div class="card" style="margin-bottom:12px"><h3><span>${esc(su ? su.name : 'Subject')} · ${esc(ch ? ch.title : 'Unsorted')}</span></h3>${groups[k].map(d => `<div class="item">${ic('file')}<div class="grow"><div class="t">${esc(d.name)}</div><div class="muted sm">${pill(TYPE[d.type] || d.type)} ${d.pages.length} ${d.type === 'pptx' ? 'slides' : 'sections'} · ${(d.size / 1024).toFixed(0)} KB · ${ago(d.added)} ${d.vis === 'shared' ? pill('Shared', 'acc') : pill(ic('lock') + ' Private')} ${d.sample ? pill('Sample', 'acc') : ''}</div></div>
        <label class="sm row" style="gap:6px;cursor:pointer"><input type="checkbox" data-chg="docOn" data-a="${d.id}" ${d.on ? 'checked' : ''}> Use in AI</label>
        <button class="btn s" data-act="previewDoc" data-a="${d.id}">${ic('eye')}</button><button class="btn s" data-act="shareDoc" data-a="${d.id}" title="Toggle sharing">${ic('share')}</button>
        <button class="btn s" data-act="replaceDoc" data-a="${d.id}">${ic('refresh')}</button><button class="btn s danger" data-act="${ui.confirm === 'doc' + d.id ? 'delDoc' : 'askDelDoc'}" data-a="${d.id}">${ui.confirm === 'doc' + d.id ? 'Confirm' : ic('trash')}</button></div>`).join('')}</div>`; }).join('') : empty('No notes yet', 'Upload your first file. The AI Professor will teach from it and cite the page or slide.');
    const search = `<div class="card" style="margin-bottom:16px"><div class="row"><span class="muted">${ic('search')}</span><input type="text" id="nq" value="${esc(ui.q)}" placeholder="Search inside all your notes" data-inp="noteQ" style="flex:1"></div>${q ? (hits.length ? hits.map(h => `<div class="item"><div class="grow sm"><b>${esc(h.docName)}</b> · ${esc(h.loc)}<div class="muted">${esc(h.text.slice(0, 190))}…</div></div></div>`).join('') : '<p class="muted sm" style="margin-top:8px">No matches.</p>') : ''}</div>`;
    return head + search + `<div class="grid g-main"><div>${list}</div><div>${form}</div></div><input type="file" id="repIn" data-chg="replace" accept=".pdf,.pptx,.docx,.txt,.md,.csv" hidden>`;
  };
  function communityHtml() {
    const D = S(), q = ui.cq || '';
    const live = SV.cloud && SV.cloud.state === 'on', src = live ? SV.cloud.notes : D.shared.concat(D.userShared), rows = src.filter(x => !D.reported[x.id] && (!q || (x.title + x.subject + x.chapter).toLowerCase().includes(q.toLowerCase())));
    return `<div class="banner warn"><span><b>Student-contributed, unverified.</b> ${live ? 'These notes were shared by students using this site. They are not checked for accuracy. Report anything wrong or inappropriate.' : 'These are sample entries. Real sharing between students needs the cloud connection, which is not active right now.'}</span></div>
      <div class="card" style="margin-bottom:16px"><div class="row"><span class="muted">${ic('search')}</span><input type="text" value="${esc(q)}" placeholder="Search by subject or chapter" data-inp="commQ" style="flex:1"></div></div>
      ${rows.length ? `<div class="grid g2">${rows.map(x => `<div class="card"><div class="row sp"><b>${esc(x.title)}</b>${pill('Student-contributed', 'warn')}</div><div class="muted sm" style="margin:4px 0 8px">${esc(x.subject)} · ${esc(x.chapter)} · by ${esc(x.by)}</div><p class="sm">${esc(x.note || '')}</p><div class="row" style="margin-top:12px">${x.mine ? pill('Shared by you', 'acc') : D.saved.includes(x.id) ? pill('Saved to your library', 'good') : `<button class="btn s soft" data-act="saveShared" data-a="${x.id}">${ic('plus')} Save to my library</button>`}${x.mine ? '' : `<button class="btn s" data-act="reportShared" data-a="${x.id}">${ic('flag')} Report</button>`}</div></div>`).join('')}</div>` : empty('No shared notes match', 'Try another search, or share one of your own files from My notes.')}`;
  }
  A.notesTab = el => { ui.notesTab = el.dataset.a; SV.render(); };
  A.pick = () => SV.$('#fileIn').click();
  C.upSub = el => { ui.upSub = el.value; SV.render(); };
  C.docOn = el => { const d = S().docs.find(x => x.id === el.dataset.a); d.on = el.checked; SV.save(); };
  SV.inp = SV.inp || {}; SV.inp.noteQ = el => { ui.q = el.value; clearTimeout(ui.qt); ui.qt = setTimeout(() => { SV.render(); const i = SV.$('#nq'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250); };
  SV.inp.commQ = el => { ui.cq = el.value; clearTimeout(ui.qt); ui.qt = setTimeout(() => { SV.render(); const i = SV.$('input[data-inp=commQ]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250); };
  async function ingest(files) {
    const sid = SV.$('#up-sub').value, cid = (SV.$('#up-chap') || {}).value || null, vis = SV.$('#up-vis').value;
    for (const f of files) {
      const u = { name: f.name, pct: 5 }; ui.uploads.push(u); SV.render();
      try {
        const r = await SV.parseFile(f, p => { u.pct = p; SV.render(); });
        S().docs.push({ id: 'd' + uid(), subjectId: sid, chapterId: cid, name: f.name, type: r.type, size: f.size, vis, on: true, added: Date.now(), pages: r.pages.map(p => Object.assign(p, { chapterId: cid })) });
        u.pct = 100; S().sample = S().sample; SV.save(); SV.toast('Indexed ' + f.name);
      } catch (e) { u.err = e.message || 'Could not read this file'; }
      SV.render();
    }
    setTimeout(() => { ui.uploads = ui.uploads.filter(u => u.err); SV.render(); }, 1800);
  }
  C.files = el => { const f = [...el.files]; el.value = ''; if (f.length) ingest(f); };
  A.pasteSave = () => { const t = SV.$('#paste-text').value.trim(); if (!t) return SV.toast('Paste some text first'); const n = SV.$('#paste-name').value.trim() || 'Pasted notes'; const cid = (SV.$('#up-chap') || {}).value || null; S().docs.push({ id: 'd' + uid(), subjectId: SV.$('#up-sub').value, chapterId: cid, name: n, type: 'paste', size: t.length, vis: SV.$('#up-vis').value, on: true, added: Date.now(), pages: [{ loc: '§1', text: t, chapterId: cid }].concat([]) }); const d = S().docs[S().docs.length - 1]; d.pages = (function () { const out = [], paras = t.split(/\n{2,}/); let cur = '', k = 1; paras.forEach(p => { if ((cur + p).length > 1500 && cur) { out.push({ loc: '§' + k++, text: cur, chapterId: cid }); cur = p; } else cur += (cur ? '\n' : '') + p; }); if (cur) out.push({ loc: '§' + k, text: cur, chapterId: cid }); return out; })(); SV.save(); SV.render(); SV.toast('Notes saved'); };
  A.previewDoc = el => { const d = S().docs.find(x => x.id === el.dataset.a); ui.modal = `<h3 style="font-family:var(--f-display);font-size:20px">${esc(d.name)}</h3><p class="muted sm" style="margin:4px 0 12px">This is the text the AI reads, with the locations it cites.</p>${d.pages.map(p => `<div class="item" style="align-items:flex-start"><span class="pill acc">${esc(p.loc)}</span><div class="grow sm">${esc(p.text)}</div></div>`).join('')}<div class="row" style="margin-top:14px"><button class="btn" data-act="closeModal">Close</button></div>`; SV.render(); };
  A.shareDoc = async el => {
    const d = S().docs.find(x => x.id === el.dataset.a), live = SV.cloud && SV.cloud.state === 'on';
    if (d.vis === 'shared') { try { if (live) await SV.cloud.unshare(d); } catch (e) { return SV.toast('Could not unshare: ' + e.message); } d.vis = 'private'; S().userShared = S().userShared.filter(x => x.docId !== d.id); SV.save(); SV.render(); return SV.toast('Now private'); }
    if (live && ui.confirm !== 'share' + d.id) { ui.confirm = 'share' + d.id; ui.modal = `<h3 style="font-family:var(--f-display);font-size:20px">Share this file with all students?</h3><p class="sm" style="margin:10px 0">The full text of <b>${esc(d.name)}</b> will be visible to every student on this site, with the label "student-contributed, unverified". Only share notes you wrote or have the right to share. You can make it private again at any time.</p><div class="row"><button class="btn primary" data-act="shareDoc" data-a="${d.id}">Share publicly</button><button class="btn" data-act="cancelShare">Cancel</button></div>`; return SV.render(); }
    ui.confirm = null; ui.modal = null;
    try { if (live) await SV.cloud.share(d); } catch (e) { SV.render(); return SV.toast('Could not share: ' + e.message); }
    d.vis = 'shared'; if (!live) { const su = subj(d.subjectId), ch = su && su.chapters.find(c => c.id === d.chapterId); S().userShared = S().userShared.filter(x => x.docId !== d.id); S().userShared.push({ id: 'u' + d.id, docId: d.id, title: d.name, subject: su ? su.name : '', chapter: ch ? ch.title : '', by: 'You', note: 'Shared by you. Only visible to you while cloud sharing is off.' }); }
    SV.save(); SV.render(); SV.toast(live ? 'Shared with all students' : 'Marked as shared. Other students see it only when cloud sharing is on.');
  };
  A.cancelShare = () => { ui.confirm = null; ui.modal = null; SV.render(); };
  A.askDelDoc = el => { ui.confirm = 'doc' + el.dataset.a; SV.render(); };
  A.delDoc = el => { S().docs = S().docs.filter(d => d.id !== el.dataset.a); ui.confirm = null; SV.save(); SV.render(); SV.toast('File deleted'); };
  A.replaceDoc = el => { ui.repId = el.dataset.a; SV.$('#repIn').click(); };
  C.replace = async el => { const f = el.files[0]; el.value = ''; if (!f) return; try { const r = await SV.parseFile(f, () => { }); const d = S().docs.find(x => x.id === ui.repId); d.name = f.name; d.type = r.type; d.size = f.size; d.pages = r.pages.map(p => Object.assign(p, { chapterId: d.chapterId })); d.added = Date.now(); d.sample = false; SV.save(); SV.render(); SV.toast('File replaced'); } catch (e) { SV.toast(e.message); } };
  A.saveShared = el => { const x = (SV.cloud && SV.cloud.state === 'on' ? SV.cloud.notes : S().shared.concat(S().userShared)).find(v => v.id === el.dataset.a); let su = S().subjects.find(s => s.name === x.subject); if (!su) { su = { id: 's' + uid(), name: x.subject, color: '#7C3AED', chapters: [] }; S().subjects.push(su); } let ch = su.chapters.find(c => c.title === x.chapter); if (!ch) { ch = { id: 'c' + uid(), title: x.chapter, topics: [] }; su.chapters.push(ch); } if (x.text) S().docs.push({ id: 'd' + uid(), subjectId: su.id, chapterId: ch.id, name: x.title + ' (student-contributed)', type: 'txt', size: x.text.length, vis: 'private', on: true, added: Date.now(), community: true, pages: [{ loc: '§1', text: x.text, chapterId: ch.id }] }); S().saved.push(x.id); SV.save(); SV.render(); SV.toast('Saved. Marked as student-contributed.'); };
  A.reportShared = async el => { const id = el.dataset.a; try { if (SV.cloud && SV.cloud.state === 'on') await SV.cloud.report(id); } catch (e) { return SV.toast('Could not send the report: ' + e.message); } S().reported[id] = true; SV.save(); SV.render(); SV.toast('Reported. Hidden from your view.'); };
  A.closeModal = () => { ui.modal = null; SV.render(); };
})(window.SV);
