/* Optional cloud layer (Supabase free tier). Students get an anonymous identity (no login screen). If anything fails, the app keeps working locally. */
(function (SV) {
  const cfg = window.SV_CONFIG, cloud = SV.cloud = { state: 'off', err: null, notes: [] };
  if (!cfg || !cfg.url || !cfg.anonKey) return;
  let sb = null, timer = null, uid = null;
  const loadScript = u => new Promise((res, rej) => { const s = document.createElement('script'); s.src = u; s.onload = res; s.onerror = () => rej(new Error('Could not load the Supabase library')); document.head.appendChild(s); });
  const set = (st, err) => { cloud.state = st; cloud.err = err || null; if (SV.render && SV.ui) SV.render(); };

  async function pushNow() {
    if (!sb || !uid) return; const D = SV.S;
    try { const { error } = await sb.from('student_state').upsert({ user_id: uid, state: D, updated_at: new Date().toISOString() }); if (error) throw error; if (cloud.state !== 'on') set('on'); }
    catch (e) { set('error', e.message || 'Could not save to the cloud'); }
  }
  SV.onSave = () => { if (cloud.state !== 'on') return; clearTimeout(timer); timer = setTimeout(pushNow, 2500); };

  async function loadNotes() {
    if (!sb) return;
    const { data, error } = await sb.from('shared_notes').select('id,title,subject_name,chapter_name,description,body,contributor_name,contributor_id,status').eq('status', 'active').order('created_at', { ascending: false }).limit(100);
    if (error) { cloud.err = error.message; return; }
    cloud.notes = data.map(n => ({ id: n.id, title: n.title, subject: n.subject_name, chapter: n.chapter_name || 'General', by: n.contributor_id === uid ? 'You' : (n.contributor_name || 'A student'), note: n.description || '', text: n.body, mine: n.contributor_id === uid }));
  }
  cloud.loadNotes = async () => { await loadNotes(); if (SV.render) SV.render(); };
  cloud.share = async d => {
    const su = SV.subj(d.subjectId), ch = su && su.chapters.find(c => c.id === d.chapterId), body = d.pages.map(p => p.text).join('\n\n').slice(0, 60000);
    const { data, error } = await sb.from('shared_notes').insert({ title: d.name.slice(0, 160), subject_name: su ? su.name : 'General', chapter_name: ch ? ch.title : null, description: 'Shared by a student. Not checked for accuracy.', body }).select('id').single();
    if (error) throw error; d.cloudNoteId = data.id; await loadNotes();
  };
  cloud.unshare = async d => { if (!d.cloudNoteId) return; const { error } = await sb.from('shared_notes').delete().eq('id', d.cloudNoteId); if (error) throw error; delete d.cloudNoteId; await loadNotes(); };
  cloud.report = async id => { const { error } = await sb.from('note_reports').insert({ note_id: id, reason: 'Reported from the community tab' }); if (error && error.code !== '23505') throw error; };

  async function init() {
    try {
      set('connecting');
      await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js');
      sb = window.supabase.createClient(cfg.url, cfg.anonKey, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'sv-student-auth' } });
      let { data: { session } } = await sb.auth.getSession();
      if (!session) { const r = await sb.auth.signInAnonymously(); if (r.error) throw r.error; session = r.data.session; }
      uid = session.user.id;
      const { data, error } = await sb.from('student_state').select('state,updated_at').eq('user_id', uid).maybeSingle();
      if (error) throw error;
      const local = SV.S, remote = data && data.state;
      if (remote && remote.subjects && (remote._t || 0) > (local._t || 0)) { SV.S = remote; try { localStorage.setItem('studyverse.v1', JSON.stringify(remote)); } catch (e) { } }
      cloud.state = 'on'; await pushNow(); await loadNotes(); set('on');
    } catch (e) { set('error', (e && e.message) || 'Cloud connection failed'); }
  }
  cloud.init = init;
})(window.SV);
