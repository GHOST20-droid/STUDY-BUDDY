/* Document ingestion, retrieval (in-browser BM25), and the exam plan builder. */
(function (SV) {
  const { S: _s, uid, dkey, addDays, daysUntil, score, allTopics, topicInfo } = SV;
  const S = () => SV.S;

  /* ---------- chunking + retrieval ---------- */
  function chunksOf(doc) {
    const out = [];
    (doc.pages || []).forEach(p => {
      const text = p.text.trim(); if (!text) return;
      const base = { docId: doc.id, docName: doc.name, loc: p.loc, chapterId: p.chapterId || doc.chapterId, topicId: p.topicId || null, sample: !!doc.sample };
      if (text.length <= 1100) { out.push(Object.assign({ text }, base)); return; }
      const sents = text.split(/(?<=[.!?])\s+/); let cur = '';
      sents.forEach(s => { if ((cur + ' ' + s).length > 800 && cur) { out.push(Object.assign({ text: cur.trim() }, base)); cur = s; } else cur += ' ' + s; });
      if (cur.trim()) out.push(Object.assign({ text: cur.trim() }, base));
    });
    return out;
  }
  const STOP = new Set('a an the of to and or in on for is are was were be it this that with as at by from how why what do does i me my we you your can will not about explain tell please'.split(' '));
  const tok = s => String(s).toLowerCase().replace(/[^a-z0-9%]+/g, ' ').split(' ').filter(w => w && !STOP.has(w));
  function retrieve(query, docIds, k, topicId) {
    const chunks = S().docs.filter(d => docIds.includes(d.id)).flatMap(chunksOf);
    if (!chunks.length) return [];
    const qt = tok(query), N = chunks.length, docs = chunks.map(c => tok(c.text));
    const avg = docs.reduce((a, d) => a + d.length, 0) / N || 1, df = {};
    docs.forEach(d => new Set(d).forEach(w => { df[w] = (df[w] || 0) + 1; }));
    const scored = chunks.map((c, i) => {
      const tf = {}; docs[i].forEach(w => { tf[w] = (tf[w] || 0) + 1; });
      let sc = 0; qt.forEach(w => { if (!tf[w]) return; const idf = Math.log(1 + (N - df[w] + .5) / (df[w] + .5)); sc += idf * (tf[w] * 2.2) / (tf[w] + 1.2 * (.25 + .75 * docs[i].length / avg)); });
      if (topicId && c.topicId === topicId) sc += 1.5;
      return { c, sc };
    }).filter(o => o.sc > 0).sort((a, b) => b.sc - a.sc).slice(0, k || 4);
    return scored.map(o => o.c);
  }

  /* ---------- file ingestion (runs in the browser) ---------- */
  const libs = {};
  function loadLib(url) { return libs[url] || (libs[url] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = url; s.onload = res; s.onerror = () => rej(new Error('Could not load parser library')); document.head.appendChild(s); })); }
  const readBuf = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsArrayBuffer(f); });
  const readTxt = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(f); });
  function paraPages(text, prefix) {
    const paras = text.split(/\n{2,}|\r\n{2,}/).map(s => s.trim()).filter(Boolean); const pages = []; let cur = '', n = 1;
    paras.forEach(p => { if ((cur + '\n' + p).length > 1500 && cur) { pages.push({ loc: prefix + n++, text: cur }); cur = p; } else cur += (cur ? '\n' : '') + p; });
    if (cur) pages.push({ loc: prefix + n, text: cur }); return pages;
  }
  async function parseFile(file, progress) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (['txt', 'md', 'csv'].includes(ext)) { progress(40); return { type: ext, pages: paraPages(await readTxt(file), '§') }; }
    if (ext === 'pdf') {
      await loadLib('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js'); progress(25);
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      const pdf = await pdfjsLib.getDocument({ data: await readBuf(file) }).promise; const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) { const pg = await pdf.getPage(i); const tc = await pg.getTextContent(); pages.push({ loc: 'p.' + i, text: tc.items.map(x => x.str).join(' ').replace(/\s+/g, ' ') }); progress(25 + Math.round(60 * i / pdf.numPages)); }
      if (!pages.some(p => p.text.length > 20)) throw new Error('This PDF has no text layer (it looks scanned). Paste the text instead, or upload a text-based PDF.');
      return { type: 'pdf', pages };
    }
    if (ext === 'docx') {
      await loadLib('https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js'); progress(30);
      const r = await mammoth.extractRawText({ arrayBuffer: await readBuf(file) }); progress(80); return { type: 'docx', pages: paraPages(r.value, '§') };
    }
    if (ext === 'pptx') {
      await loadLib('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'); progress(30);
      const zip = await JSZip.loadAsync(await readBuf(file));
      const names = Object.keys(zip.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => +a.match(/\d+/)[0] - +b.match(/\d+/)[0]); const pages = [];
      for (let i = 0; i < names.length; i++) { const xml = await zip.files[names[i]].async('string'); const txt = [...xml.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)].map(m => m[1]).join(' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'); pages.push({ loc: 'Slide ' + (+names[i].match(/\d+/)[0]), text: txt }); progress(30 + Math.round(55 * (i + 1) / names.length)); }
      return { type: 'pptx', pages };
    }
    throw new Error('Unsupported file type .' + ext + '. Use PDF, PPTX, DOCX or TXT.');
  }

  /* ---------- exam plan builder (deterministic; recomputed from live mastery) ---------- */
  function buildPlan(ex) {
    const left = daysUntil(ex.date);
    if (left < 0) return { status: 'past', days: [] };
    if (left === 0) return { status: 'today', days: [] };
    const subject = SV.subj(ex.subjectId); if (!subject) return { status: 'nosubject', days: [] };
    const chapters = subject.chapters.filter(c => ex.chapters.includes(c.id));
    const topics = chapters.flatMap(c => c.topics.map(t => ({ id: t.id, title: t.title, chapter: c.title }))).filter(t => !ex.completed[t.id]);
    const cap = Math.max(20, Math.round(ex.hours * 60)), nDays = left, express = left <= 3;
    const wt = t => { const m = score(t.id); return (1.15 - (m == null ? 0 : m) / 100) * (ex.important[t.id] ? 1.4 : 1) * (1 + (5 - ex.understanding) * 0.06); };
    topics.forEach(t => { t.w = wt(t); t.sc = score(t.id); });
    const total = cap * nDays, resDays = nDays >= 4 ? 2 : nDays >= 3 ? 1 : 0;
    const weak = topics.filter(t => t.sc != null && t.sc < 50);
    const revBudget = nDays >= 3 ? Math.round(total * .15) : Math.round(Math.min(cap * .3, 30));
    const mockBudget = nDays >= 4 ? Math.min(60, Math.round(total * .1)) : 0;
    const recBudget = weak.length && nDays >= 3 ? Math.round(total * .1) : 0;
    const learnBudget = Math.max(0, total - revBudget - mockBudget - recBudget);
    const order = express ? topics.slice().sort((a, b) => b.w - a.w) : topics;
    const sumW = order.reduce((a, t) => a + t.w, 0) || 1; const blocks = [];
    order.forEach(t => {
      const m = Math.max(10, Math.round(learnBudget * t.w / sumW)); const l = Math.max(6, Math.round(m * .7));
      const why = t.sc == null ? 'Not started' : t.sc < 50 ? 'Weak (' + t.sc + '%)' : t.sc < 80 ? 'Building (' + t.sc + '%)' : 'Strong (' + t.sc + '%)';
      blocks.push({ type: 'learn', topicId: t.id, title: t.title, min: l, why, imp: !!ex.important[t.id] });
      blocks.push({ type: 'practice', topicId: t.id, title: t.title, min: Math.max(4, m - l), why: '', imp: false });
    });
    weak.forEach(t => blocks.push({ type: 'recovery', topicId: t.id, title: t.title, min: Math.max(10, Math.round(recBudget / weak.length)), why: 'Weak-topic recovery (' + t.sc + '%)' }));
    const learnDays = Math.max(1, nDays - resDays), days = [];
    for (let i = 0; i < nDays; i++) days.push({ date: dkey(addDays(i)), blocks: [], used: 0, idx: i });
    let di = 0;
    blocks.forEach(b => { let rem = b.min; while (rem > 0) { if (di >= learnDays) di = learnDays - 1; const room = cap - days[di].used; if (room <= 0 && di < learnDays - 1) { di++; continue; } const take = room <= 0 ? rem : Math.min(rem, room); days[di].blocks.push(Object.assign({}, b, { min: take })); days[di].used += take; rem -= take; if (rem > 0 && di < learnDays - 1) di++; else if (rem > 0) { /* overflow on last learning day */ } } });
    const revDays = nDays >= 3 ? days.slice(learnDays) : [days[nDays - 1]];
    if (mockBudget && days[nDays - 2]) days[nDays - 2].blocks.push({ type: 'mock', topicId: null, title: 'Timed practice examination', min: mockBudget, why: 'Exam conditions' });
    revDays.forEach((d, i) => d.blocks.push({ type: 'revise', topicId: null, title: i === revDays.length - 1 ? 'Final rapid revision: formulas, mistakes, flashcards' : 'Rapid revision: formulas and flashcards', min: Math.max(10, Math.round(revBudget / revDays.length)), why: '' }));
    // Rebalance: push overflow from any day into the next day that has room; flag the plan as tight if the last day still overflows.
    let spill = false; const used = d => d.blocks.reduce((a, b) => a + b.min, 0);
    for (let i = 0; i < days.length; i++) {
      while (used(days[i]) > cap + 10) {
        const idx = days[i].blocks.map(b => b.type).lastIndexOf('practice') >= 0 ? days[i].blocks.map(b => b.type).lastIndexOf('practice') : days[i].blocks.map(b => b.type).findIndex(t => t === 'learn' || t === 'recovery');
        if (idx < 0 || i === days.length - 1) { spill = true; break; }
        const [mv] = days[i].blocks.splice(idx, 1); days[i + 1].blocks.unshift(mv);
      }
      days[i].used = used(days[i]);
    }
    const skip = topics.filter(t => t.sc != null && t.sc >= 80).map(t => t.title);
    return { status: 'ok', express, days, topics, cap, skip, tight: spill || learnBudget < topics.length * 20 };
  }

  Object.assign(SV, { chunksOf, retrieve, parseFile, buildPlan, tok });
})(window.SV);
