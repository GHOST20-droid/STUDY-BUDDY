/* Router, shell rendering, and event delegation. */
(function (SV) {
  const { ic, ui, $ } = SV; const V = SV.V, A = SV.A, C = SV.C, INP = SV.inp = SV.inp || {};
  const NAV = [['dashboard', 'Dashboard', 'home'], ['subjects', 'My Subjects', 'book'], ['notes', 'Notes Library', 'file'], ['professor', 'AI Professor', 'cap'], ['practice', 'Practice', 'target'], ['exam', 'Exam Prep', 'cal'], ['progress', 'Progress', 'chart'], ['profile', 'Profile', 'users']];
  const MOBILE = ['dashboard', 'professor', 'practice', 'exam', 'progress'];
  const valid = v => NAV.some(n => n[0] === v) || v === 'admin';
  function route() { const h = (location.hash || '').replace('#', ''); ui.view = valid(h) ? h : 'dashboard'; if (ui.view !== 'subjects') ui.confirm = null; }

  function render() {
    const app = $('#app'); if (!app) return;
    const keep = document.activeElement && document.activeElement.id, selStart = document.activeElement && document.activeElement.selectionStart;
    const draft = $('#msg'); if (draft && ui.view === 'professor') ui.draft = draft.value;
    let body; try { body = (V[ui.view] || V.dashboard)(); } catch (e) { console.error(e); body = `<div class="empty"><h4>Something went wrong on this page</h4><p>${SV.esc(e.message)}</p><button class="btn" data-act="resetDemo">Restore demo data</button></div>`; }
    const side = `<aside class="side"><div class="logo"><i>${ic('cap')}</i>StudyVerse</div><nav class="nav">${NAV.map(n => `<a data-act="nav" data-a="${n[0]}" class="${ui.view === n[0] ? 'on' : ''}" tabindex="0" role="link">${ic(n[2])}${n[1]}</a>`).join('')}</nav>
      <div class="side-foot"><div class="card" style="padding:12px"><div class="row sm" style="gap:6px"><span class="dot ${ui.demo ? 'off' : ''}"></span><b>${ui.demo ? 'Demo mode' : 'Live AI on'}</b></div><div class="muted sm" style="margin-top:4px">${ui.demo ? 'Professor replies are a labelled script. Notes retrieval, practice, plans and analytics are real.' : 'The Professor is answering with a live model.'}</div></div>
      ${SV.cloud && SV.cloud.state !== 'off' ? `<div class="muted sm" style="padding:0 4px">${ui.cloudDot ? '' : ''}Cloud sync: <b>${{ on: 'on', connecting: 'connecting…', error: 'unavailable' }[SV.cloud.state]}</b>${SV.cloud.state === 'error' ? '<div title="' + SV.esc(SV.cloud.err || '') + '">Saving on this device only.</div>' : ''}</div>` : ''}
      <a class="nav sm" style="padding:6px 10px;color:var(--ink-3);cursor:pointer" data-act="nav" data-a="admin">Admin (demo view)</a></div></aside>`;
    const bnav = `<nav class="bnav">${NAV.filter(n => MOBILE.includes(n[0])).map(n => `<a data-act="nav" data-a="${n[0]}" class="${ui.view === n[0] ? 'on' : ''}">${ic(n[2])}<span>${n[1].replace('AI ', '').replace('My ', '')}</span></a>`).join('')}<a data-act="nav" data-a="notes" class="${ui.view === 'notes' ? 'on' : ''}">${ic('file')}<span>Notes</span></a></nav>`;
    app.innerHTML = `<div class="shell">${side}<main class="main" id="main">${body}</main></div>${bnav}`;
    $('#overlay').innerHTML = ui.modal ? `<div class="overlay" data-act="closeModalBg"><div class="modal" role="dialog" aria-modal="true">${ui.modal}</div></div>` : '';
    if (keep) { const el = document.getElementById(keep); if (el && el.tagName !== 'BUTTON') { el.focus(); try { if (selStart != null) el.setSelectionRange(selStart, selStart); } catch (e) { } } }
    if (ui.view === 'professor') { const ch = $('#chat'); if (ch) ch.scrollTop = ch.scrollHeight; }
  }
  SV.render = render;

  A.nav = el => { const v = el.dataset.a; if (location.hash.replace('#', '') === v) { route(); render(); } else location.hash = v; window.scrollTo(0, 0); };
  A.closeModalBg = (el, e) => { if (e.target === el) { ui.modal = null; render(); } };

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
    if (el.tagName === 'INPUT' && el.type === 'checkbox') return;
    const fn = A[el.dataset.act]; if (fn) { try { fn(el, e); } catch (err) { console.error(err); SV.toast('That action failed: ' + err.message); } }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.matches('[role=link]')) { e.target.click(); return; }
    if (e.key === 'Enter' && !e.shiftKey && e.target.id === 'msg') { e.preventDefault(); A.send(); }
    if (e.key === 'Escape' && ui.modal) { ui.modal = null; render(); }
  });
  document.addEventListener('change', e => { const el = e.target.closest('[data-chg]'); if (el && C[el.dataset.chg]) try { C[el.dataset.chg](el, e); } catch (err) { console.error(err); SV.toast(err.message); } });
  document.addEventListener('input', e => { const el = e.target.closest('[data-inp]'); if (el && INP[el.dataset.inp]) INP[el.dataset.inp](el, e); });
  const dz = e => e.target.closest && e.target.closest('#dz');
  document.addEventListener('dragover', e => { const z = dz(e); if (z) { e.preventDefault(); z.classList.add('over'); } });
  document.addEventListener('dragleave', e => { const z = dz(e); if (z) z.classList.remove('over'); });
  document.addEventListener('drop', e => { const z = dz(e); if (z) { e.preventDefault(); z.classList.remove('over'); const f = [...e.dataTransfer.files]; if (f.length) { const inp = $('#fileIn'); const dt = new DataTransfer(); f.forEach(x => dt.items.add(x)); inp.files = dt.files; inp.dispatchEvent(new Event('change', { bubbles: true })); } } });
  window.addEventListener('hashchange', () => { route(); render(); });
  window.addEventListener('error', e => { const a = $('#app'); if (a && !a.innerHTML.trim()) a.innerHTML = '<div class="empty" style="margin:40px"><h4>The app failed to start</h4><p>' + SV.esc(e.message) + '</p></div>'; });

  route(); render(); SV.initSample(); if (SV.cloud && SV.cloud.init) SV.cloud.init();
  // Log a little study time while the Professor is open and the student is active
  setInterval(() => { if (document.visibilityState === 'visible' && ui.view === 'professor' && SV.session().messages.length) SV.addLog(ui.profSub, 1); }, 60000);
})(window.SV);
