/**
 * practices.js — Dynamic practices management for VCT
 * Fetches practices and play_practices from Supabase,
 * exposes helpers for admin-console.html and (future) dynamic play pages.
 */
(function () {
  /* ── Supabase helper ───────────────────────────────────── */
  async function getClient() {
    for (let i = 0; i < 30; i++) {
      if (window.supabaseClient) return window.supabaseClient;
      await new Promise(r => setTimeout(r, 100));
    }
    return null;
  }

  /* ── CRUD: practices ──────────────────────────────────── */
  async function fetchPractices() {
    const sb = await getClient();
    if (!sb) return [];
    const { data, error } = await sb.from('practices').select('*').order('title');
    if (error) { console.warn('practices fetch error', error); return []; }
    return data || [];
  }

  async function createPractice(practice) {
    const sb = await getClient();
    if (!sb) return null;
    const { data, error } = await sb.from('practices').insert([practice]).select();
    if (error) { console.error('practice insert error', error); alert('Failed to create practice: ' + error.message); return null; }
    return data?.[0];
  }

  async function updatePractice(id, updates) {
    const sb = await getClient();
    if (!sb) return null;
    updates.updated_at = new Date().toISOString();
    const { data, error } = await sb.from('practices').update(updates).eq('id', id).select();
    if (error) { console.error('practice update error', error); alert('Failed to update practice: ' + error.message); return null; }
    return data?.[0];
  }

  async function deletePractice(id) {
    const sb = await getClient();
    if (!sb) return false;
    const { error } = await sb.from('practices').delete().eq('id', id);
    if (error) { console.error('practice delete error', error); alert('Failed to delete practice: ' + error.message); return false; }
    return true;
  }

  /* ── CRUD: play_practices junction ─────────────────────── */
  async function fetchPlayPractices() {
    const sb = await getClient();
    if (!sb) return [];
    const { data, error } = await sb.from('play_practices').select('*').order('sort_order');
    if (error) { console.warn('play_practices fetch error', error); return []; }
    return data || [];
  }

  async function assignPracticeToPlay(playNumber, practiceId, sortOrder) {
    const sb = await getClient();
    if (!sb) return null;
    const { data, error } = await sb.from('play_practices')
      .insert([{ play_number: playNumber, practice_id: practiceId, sort_order: sortOrder || 0 }])
      .select();
    if (error) { console.error('assign error', error); alert('Failed to assign: ' + error.message); return null; }
    return data?.[0];
  }

  async function unassignPracticeFromPlay(junctionId) {
    const sb = await getClient();
    if (!sb) return false;
    const { error } = await sb.from('play_practices').delete().eq('id', junctionId);
    if (error) { console.error('unassign error', error); return false; }
    return true;
  }

  async function updateSortOrder(junctionId, newOrder) {
    const sb = await getClient();
    if (!sb) return false;
    const { error } = await sb.from('play_practices').update({ sort_order: newOrder }).eq('id', junctionId);
    if (error) { console.error('sort order error', error); return false; }
    return true;
  }

  /* ── Play metadata ────────────────────────────────────── */
  const PLAY_NAMES = {
    1: 'Sensemaking',
    2: 'Imagining',
    3: 'Navigating',
    4: 'Collaborating',
    5: 'Value Creating'
  };
  const PLAY_COLORS = {
    1: '#00897B',
    2: '#7C5CBF',
    3: '#E07A5F',
    4: '#D4A843',
    5: '#1B2A4A'
  };

  /* ── Expose ────────────────────────────────────────────── */
  window.VCTPractices = {
    fetchPractices,
    createPractice,
    updatePractice,
    deletePractice,
    fetchPlayPractices,
    assignPracticeToPlay,
    unassignPracticeFromPlay,
    updateSortOrder,
    PLAY_NAMES,
    PLAY_COLORS
  };
})();
