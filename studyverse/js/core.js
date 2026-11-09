/* StudyVerse AI core: helpers, icons, state, seed data, mastery model. All modules share window.SV. */
window.SV = window.SV || {};
(function (SV) {
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 9);
  const dkey = (d) => { const x = new Date(d || Date.now()); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); };
  const addDays = (n, d) => { const x = new Date(d || Date.now()); x.setDate(x.getDate() + n); return x; };
  const daysUntil = iso => Math.round((new Date(iso + 'T00:00:00') - new Date(dkey() + 'T00:00:00')) / 864e5);
  const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
  const fdate = (iso, o) => new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', o || { weekday: 'short', day: 'numeric', month: 'short' });
  const ago = ts => { const m = Math.round((Date.now() - ts) / 60000); if (m < 1) return 'just now'; if (m < 60) return m + ' min ago'; const h = Math.round(m / 60); if (h < 24) return h + ' h ago'; return Math.round(h / 24) + ' d ago'; };

  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    book: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    cap: '<path d="M22 9 12 4 2 9l10 5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5M22 9v6"/>',
    cal: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2.5.6 4 2.6 4 5.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>', check: '<path d="M20 6 9 17l-5-5"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    flame: '<path d="M12 22c4 0 7-2.8 7-7 0-3-2-5-3-7-1 2-2 2.5-3 2.5 0-3-1-6-4-8 0 4-4 6-4 11 0 4.2 3 8.5 7 8.5z"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17.5v.01"/>', trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5"/>', pause: '<path d="M8 5v14M16 5v14"/>',
    play: '<path d="M7 4v16l13-8z"/>', star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>', chev: '<path d="m9 6 6 6-6 6"/>', lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>', layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17v.01"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m21 16-5-5-8 8"/>', eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    down: '<path d="m6 9 6 6 6-6"/>'
  };
  const ic = n => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;
  const bar = (v, cls) => `<div class="bar ${cls || ''}"><i style="width:${v == null ? 0 : Math.max(0, Math.min(100, v))}%"></i></div>`;
  const pill = (t, c) => `<span class="pill ${c || ''}">${t}</span>`;

  /* ---------- sample notes (illustrative demo content, written for this prototype) ---------- */
  const SAMPLE_PAGES = [
    { loc: 'p.1', chapterId: 'c-tvm', topicId: 'fv', text: 'Time value of money. A rupee received today is worth more than a rupee received a year from now, because today\'s rupee can be invested and earn interest. Compounding moves money forward in time: FV = PV × (1 + r)^n, where PV is the amount today, r is the interest rate per period and n is the number of periods. Example: ₹10,000 at 10% for 3 years gives FV = 10,000 × 1.10^3 = ₹13,310.' },
    { loc: 'p.2', chapterId: 'c-tvm', topicId: 'pv', text: 'Present value is the reverse of future value. Discounting moves a future amount back to today: PV = FV / (1 + r)^n. The rate used for discounting is called the discount rate. Example: ₹13,310 due in 3 years at 10% has PV = 13,310 / 1.331 = ₹10,000. Common error: multiplying instead of dividing. FV grows as time passes; PV shrinks as the time to the cash flow grows.' },
    { loc: 'p.3', chapterId: 'c-tvm', topicId: 'ear', text: 'Stated (nominal) rate and effective rate. A bank may state 12% per annum compounded quarterly. The money does not grow by exactly 12% in a year because interest is added to the balance every quarter. Effective annual rate: EAR = (1 + i/m)^m − 1, where i is the stated annual rate and m is the number of compounding periods per year. Example: 12% compounded quarterly gives EAR = (1 + 0.12/4)^4 − 1 = 1.03^4 − 1 = 12.55%. Use EAR to compare loans or deposits that compound at different frequencies.' },
    { loc: 'p.4', chapterId: 'c-tvm', topicId: 'ear', text: 'Compounding frequency. For a stated rate of 12%: annual compounding gives an EAR of 12.00%, half-yearly 12.36%, quarterly 12.55% and monthly 12.68%. The more often interest is compounded, the higher the EAR, but the gains get smaller each time.' },
    { loc: 'p.5', chapterId: 'c-tvm', topicId: 'annuity', text: 'Annuity: equal payments at equal intervals. Future value of an ordinary annuity (payments at the end of each period): FVA = P × [((1 + r)^n − 1) / r]. Present value: PVA = P × [(1 − (1 + r)^−n) / r]. Annuity due (payments at the start of each period): multiply the ordinary annuity value by (1 + r). Example: PV of ₹5,000 a year for 4 years at 10% = 5,000 × 3.1699 = ₹15,849.' },
    { loc: 'p.6', chapterId: 'c-tvm', topicId: 'perp', text: 'Perpetuity: equal payments that continue forever. PV = C / r, where C is the payment per period and r is the discount rate. Example: ₹2,000 a year forever at 8% gives PV = 2,000 / 0.08 = ₹25,000. Growing perpetuity: PV = C1 / (r − g), valid only when r is greater than g.' },
    { loc: 'p.7', chapterId: 'c-cb', topicId: 'npv', text: 'Capital budgeting: Net Present Value. NPV = Σ [CFt / (1 + k)^t] − Initial investment, where k is the cost of capital used as the discount rate. Decision rule: accept the project if NPV > 0, reject if NPV < 0. NPV measures the value a project adds to the firm in today\'s money. Example: invest ₹1,00,000; inflows of ₹40,000, ₹50,000 and ₹60,000 over 3 years at 10%. PV of inflows = 36,364 + 41,322 + 45,079 = ₹1,22,765, so NPV = ₹22,765.' },
    { loc: 'p.8', chapterId: 'c-cb', topicId: 'irr', text: 'Internal Rate of Return is the discount rate at which NPV equals zero. Decision rule: accept if IRR is greater than the cost of capital. IRR is found by trial and error or by interpolation between two rates. For a single inflow: IRR = (Inflow / Investment)^(1/n) − 1. Example: ₹1,000 invested returns ₹1,210 after 2 years, so IRR = (1.21)^(1/2) − 1 = 10%.' },
    { loc: 'Slide 12', chapterId: 'c-coc', topicId: 'coc', text: 'Cost of capital. WACC = Wd × Kd × (1 − T) + We × Ke, where Wd and We are the weights of debt and equity, Kd is the pre-tax cost of debt, T is the tax rate and Ke is the cost of equity. Debt is cheaper after tax because interest is tax deductible. Cost of equity by CAPM: Ke = Rf + β × (Rm − Rf). Example: Wd 40%, Kd 10%, T 30%, We 60%, Ke 15% gives WACC = 4 × 0.7 + 9 = 11.8%.' },
    { loc: 'Slide 15', chapterId: 'c-lev', topicId: 'lev', text: 'Leverage. Operating leverage: DOL = Contribution / EBIT. Financial leverage: DFL = EBIT / (EBIT − Interest). Combined leverage: DCL = DOL × DFL. A DOL of 2 means a 10% rise in sales raises EBIT by 20%. Higher fixed costs give higher operating leverage and higher business risk.' },
    { loc: 'Slide 18', chapterId: 'c-wc', topicId: 'wc', text: 'Working capital management. Operating cycle = inventory holding period + receivables collection period. Cash conversion cycle = operating cycle − payables deferral period. A shorter cash conversion cycle means less cash is tied up in operations. Example: inventory 45 days, receivables 30 days, payables 25 days gives CCC = 45 + 30 − 25 = 50 days.' }
  ];
  SV.SAMPLE_DOC_ID = 'doc-fm-sample';

  const SHARED_SEED = [
    { id: 'sh1', title: 'Annuity formulas cheat sheet', subject: 'Financial Management', chapter: 'Time Value of Money', by: 'Ananya R.', note: 'One page: ordinary annuity, annuity due, perpetuity, with a worked example each.', text: 'Ordinary annuity PV = P × [1 − (1 + r)^−n] / r. Annuity due = ordinary × (1 + r). Perpetuity PV = C / r. Worked example: ₹8,000 a year for 5 years at 12%: PV = 8,000 × 3.6048 = ₹28,838.' },
    { id: 'sh2', title: 'NPV vs IRR conflicts', subject: 'Financial Management', chapter: 'Capital Budgeting', by: 'Karthik S.', note: 'When NPV and IRR rank projects differently and why NPV is preferred.', text: 'NPV and IRR can disagree for mutually exclusive projects of different scale or timing. NPV assumes reinvestment at the cost of capital; IRR assumes reinvestment at the IRR itself. Prefer NPV when they conflict.' },
    { id: 'sh3', title: 'Motivation theories summary', subject: 'Human Resource Management', chapter: 'Motivation', by: 'Meera P.', note: 'Maslow, Herzberg, McClelland and Vroom in one table.', text: 'Maslow: hierarchy of needs. Herzberg: hygiene factors prevent dissatisfaction, motivators create satisfaction. McClelland: achievement, affiliation, power. Vroom: expectancy × instrumentality × valence.' },
    { id: 'sh4', title: 'STP one-pager', subject: 'Marketing Management', chapter: 'Segmentation, Targeting, Positioning', by: 'Rohan D.', note: 'Segmentation bases, targeting strategies and a positioning statement template.', text: 'Segmentation bases: demographic, geographic, psychographic, behavioural. Targeting: undifferentiated, differentiated, concentrated, micro-marketing. Positioning statement: For [target], [brand] is the [category] that [benefit] because [reason to believe].' }
  ];

  function seed() {
    const T = dkey(), now = Date.now();
    const subjects = [
      { id: 'fm', name: 'Financial Management', color: '#4F46E5', chapters: [
        { id: 'c-tvm', title: 'Time Value of Money', topics: [{ id: 'fv', title: 'Future value & compounding' }, { id: 'pv', title: 'Present value & discounting' }, { id: 'annuity', title: 'Annuities' }, { id: 'perp', title: 'Perpetuities' }, { id: 'ear', title: 'Effective rate of interest' }] },
        { id: 'c-cb', title: 'Capital Budgeting', topics: [{ id: 'npv', title: 'Net present value (NPV)' }, { id: 'irr', title: 'Internal rate of return (IRR)' }] },
        { id: 'c-coc', title: 'Cost of Capital', topics: [{ id: 'coc', title: 'WACC and cost of equity' }] },
        { id: 'c-lev', title: 'Leverage', topics: [{ id: 'lev', title: 'Operating & financial leverage' }] },
        { id: 'c-wc', title: 'Working Capital Management', topics: [{ id: 'wc', title: 'Operating & cash conversion cycle' }] }] },
      { id: 'mkt', name: 'Marketing Management', color: '#0F7B55', chapters: [
        { id: 'c-stp', title: 'Segmentation, Targeting, Positioning', topics: [{ id: 'm-seg', title: 'Segmentation bases' }, { id: 'm-pos', title: 'Positioning' }] }] }
    ];
    const mastery = {
      fv: { c: 85, f: 80, n: 75, cf: 0 }, pv: { c: 60, f: 55, n: 35, cf: 1 }, annuity: { c: 45, f: 40, n: null, cf: 0 },
      perp: { c: 70, f: 70, n: 60, cf: 0 }, ear: { c: 30, f: 25, n: 20, cf: 2 }, npv: { c: 55, f: 50, n: 40, cf: 0 }
    };
    const attempts = []; const mk = (t, ok, d, diag, conf) => attempts.push({ id: uid(), topicId: t, kind: 'num', correct: ok, ts: now - d * 864e5, diag: diag || null, conf: conf || 'unsure', source: 'generated' });
    [['fv', 1, 6], ['fv', 1, 6], ['fv', 0, 5, 'Used simple interest instead of compounding'], ['fv', 1, 4], ['pv', 0, 5, 'Compounded forward instead of discounting (PV/FV confusion)', 'sure'], ['pv', 0, 4, 'Compounded forward instead of discounting (PV/FV confusion)', 'sure'],
      ['pv', 1, 3], ['pv', 0, 2, 'Compounded forward instead of discounting (PV/FV confusion)'], ['ear', 0, 4, 'Used the stated rate as if it were the effective rate', 'sure'], ['ear', 0, 3, 'Used the stated rate as if it were the effective rate'],
      ['ear', 0, 2, 'Used the stated rate as if it were the effective rate'], ['ear', 1, 1], ['perp', 1, 3], ['perp', 1, 2], ['perp', 0, 2, 'Multiplied the payment by the rate instead of dividing'], ['npv', 1, 2], ['npv', 0, 1, 'Forgot to subtract the initial investment'], ['npv', 1, 1], ['annuity', 0, 1, 'Multiplied the payment by the number of years (ignored time value)']]
      .forEach(a => mk(a[0], !!a[1], a[2], a[3], a[4]));
    const log = {}; [[6, 45], [5, 70], [4, 35], [3, 60], [2, 50], [1, 40]].forEach(([d, m]) => { log[dkey(addDays(-d))] = { fm: m }; });
    log[T] = { fm: 12 };
    return {
      v: 1, sample: true, name: '', subjects,
      docs: [{ id: SV.SAMPLE_DOC_ID, subjectId: 'fm', chapterId: 'c-tvm', name: 'FM_Unit1-3_Notes (sample).pdf', type: 'pdf', size: 184320, vis: 'private', on: true, added: now - 2 * 864e5, sample: true, pages: SAMPLE_PAGES }],
      mastery, attempts, mistakes: [], missed: [], cards: {}, doubts: [
        { id: uid(), subjectId: 'fm', topicId: 'ear', text: 'Why is the effective rate higher than the stated rate?', status: 'open', ts: now - 86400e3 },
        { id: uid(), subjectId: 'fm', topicId: 'annuity', text: 'When do I use annuity due instead of ordinary annuity?', status: 'open', ts: now - 3 * 3600e3 }],
      sessions: {}, last: null, log, goals: { min: 45, doubts: 2, q: 8 },
      exams: [{ id: uid(), subjectId: 'fm', date: dkey(addDays(9)), hours: 3, understanding: 2, chapters: ['c-tvm', 'c-cb', 'c-coc', 'c-lev', 'c-wc'], completed: {}, important: { ear: true, npv: true }, done: {} }],
      shared: SHARED_SEED.map(s => Object.assign({}, s)), saved: [], reported: {}, userShared: []
    };
  }

  /* ---------- state ---------- */
  const KEY = 'studyverse.v1';
  let S;
  try { const raw = localStorage.getItem(KEY); S = raw ? JSON.parse(raw) : null; } catch (e) { S = null; }
  if (!S || !S.subjects) S = seed();
  let t = null;
  function save() { S._t = Date.now(); if (SV.onSave) SV.onSave(); clearTimeout(t); t = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { if (!save.warned) { save.warned = true; SV.toast('Storage is full. Changes last only for this session.'); } } }, 300); }
  function reset(fresh) { S = fresh ? { v: 1, sample: false, name: '', subjects: [], docs: [], mastery: {}, attempts: [], mistakes: [], missed: [], cards: {}, doubts: [], sessions: {}, last: null, log: {}, goals: { min: 45, doubts: 2, q: 8 }, exams: [], shared: SHARED_SEED.map(s => Object.assign({}, s)), saved: [], reported: {}, userShared: [] } : seed(); SV.S = S; save(); }
  function toast(msg) { const el = document.createElement('div'); el.className = 'toast'; el.textContent = msg; $('#toasts').appendChild(el); setTimeout(() => el.remove(), 2600); }

  /* ---------- lookups and mastery ---------- */
  const subj = id => S.subjects.find(s => s.id === id);
  const allTopics = () => { const o = []; S.subjects.forEach(s => s.chapters.forEach(c => c.topics.forEach(tp => o.push({ id: tp.id, title: tp.title, chapter: c, subject: s })))); return o; };
  const topicInfo = id => allTopics().find(x => x.id === id);
  const score = id => { const m = S.mastery[id]; if (!m) return null; let w = 0, tt = 0; [['c', .35], ['f', .25], ['n', .4]].forEach(([k, wt]) => { if (m[k] != null) { tt += m[k] * wt; w += wt; } }); return w ? Math.round(tt / w) : null; };
  const chapScore = c => { if (!c.topics.length) return 0; return Math.round(c.topics.reduce((a, x) => a + (score(x.id) || 0), 0) / c.topics.length); };
  const subjScore = s => { const ts = s.chapters.flatMap(c => c.topics); return ts.length ? Math.round(ts.reduce((a, x) => a + (score(x.id) || 0), 0) / ts.length) : 0; };
  const level = sc => sc == null || sc < 30 ? { id: 'basics', label: 'Starting from basics' } : sc < 55 ? { id: 'formulas', label: 'Building formula understanding' } : sc < 80 ? { id: 'numerical', label: 'Applying to numericals' } : { id: 'exam', label: 'Exam-level practice' };
  function bump(topicId, dim, signal) {
    if (!topicId || !dim || !signal || signal === 'none') return;
    const m = S.mastery[topicId] || (S.mastery[topicId] = { c: null, f: null, n: null, cf: 0 }); const cur = m[dim];
    if (signal === 'correct') m[dim] = cur == null ? 70 : Math.min(100, cur + 15);
    else if (signal === 'partial') m[dim] = cur == null ? 45 : Math.min(100, cur + 5);
    else if (signal === 'incorrect') { m[dim] = cur == null ? 25 : Math.max(0, cur - 20); m.cf = (m.cf || 0) + 1; }
    save();
  }
  function addLog(subjectId, min) { const k = dkey(); S.log[k] = S.log[k] || {}; S.log[k][subjectId || 'fm'] = (S.log[k][subjectId || 'fm'] || 0) + min; save(); }
  const dayMin = k => Object.values(S.log[k] || {}).reduce((a, b) => a + b, 0);
  const streak = () => { let n = 0, d = 0; if (!dayMin(dkey())) d = 1; for (; ; d++) { if (dayMin(dkey(addDays(-d))) >= 1) n++; else break; } return n; };
  const totalHours = () => Object.keys(S.log).reduce((a, k) => a + dayMin(k), 0) / 60;
  const openDoubts = sid => S.doubts.filter(d => d.status === 'open' && (!sid || d.subjectId === sid));
  const mistakeCounts = () => { const m = {}; S.attempts.filter(a => !a.correct && a.diag).forEach(a => { const k = a.topicId + '|' + a.diag; m[k] = (m[k] || { topicId: a.topicId, label: a.diag, n: 0 }); m[k].n++; }); S.mistakes.forEach(x => { const k = x.topicId + '|' + x.label; m[k] = (m[k] || { topicId: x.topicId, label: x.label, n: 0 }); m[k].n++; }); return Object.values(m).sort((a, b) => b.n - a.n); };
  function weakTopics(n) { return allTopics().map(x => ({ x, sc: score(x.id), cf: (S.mastery[x.id] || {}).cf || 0 })).filter(o => o.sc != null && (o.sc < 55 || o.cf >= 2)).sort((a, b) => a.sc - b.sc).slice(0, n || 5); }
  function nextTopic() {
    const ex = S.exams.filter(e => daysUntil(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))[0];
    const pool = allTopics().filter(x => !ex || x.subject.id === ex.subjectId).filter(x => !ex || !ex.completed[x.id]);
    if (!pool.length) return null;
    const pick = pool.map(x => ({ x, sc: score(x.id) })).sort((a, b) => (a.sc == null ? 0 : a.sc) - (b.sc == null ? 0 : b.sc))[0];
    return { x: pick.x, sc: pick.sc, days: ex ? daysUntil(ex.date) : null };
  }

  Object.assign(SV, { $, esc, uid, dkey, addDays, daysUntil, inr, fdate, ago, ic, bar, pill, save, reset, toast, subj, allTopics, topicInfo, score, chapScore, subjScore, level, bump, addLog, dayMin, streak, totalHours, openDoubts, mistakeCounts, weakTopics, nextTopic, SAMPLE_PAGES });
  Object.defineProperty(SV, 'S', { get: () => S, set: v => { S = v; }, configurable: true });
})(window.SV);
