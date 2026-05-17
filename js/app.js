import { loadShows, addShow, updateShow, deleteShow } from './storage.js';
import { renderCalendar, formatMonthTitle } from './calendar.js';
import { renderSidebar, openModal, closeModal, openPanel, closePanel } from './shows.js';

const state = {
  year:        new Date().getFullYear(),
  month:       new Date().getMonth(),
  filter:      'all',
  sidebarOpen: true,
};

const els = {
  monthTitle:   document.getElementById('month-title'),
  calendarGrid: document.getElementById('calendar-grid'),
  dayHeaders:   document.getElementById('day-headers'),
  prevBtn:      document.getElementById('prev-month'),
  nextBtn:      document.getElementById('next-month'),
  loadingBar:   document.getElementById('loading-bar'),
  main:         document.getElementById('main'),
  filterTabs:   document.getElementById('filter-tabs'),
  showList:     document.getElementById('show-list'),
  addShowBtn:   document.getElementById('add-show-btn'),
  sidebarToggle: document.getElementById('sidebar-toggle'),
};

function setLoading(on) {
  els.loadingBar.classList.toggle('hidden', !on);
}

async function refresh() {
  setLoading(true);
  try {
    const shows = await loadShows();
    els.monthTitle.textContent = formatMonthTitle(state.year, state.month);
    renderCalendar(state.year, state.month, shows, els.calendarGrid, els.dayHeaders);
    renderSidebar(shows, state.filter, els.showList, els.filterTabs, onCardClick);
  } catch (e) {
    console.error('Failed to load shows:', e);
    els.monthTitle.textContent = 'Error loading data';
  } finally {
    setLoading(false);
  }
}

function onCardClick(show) {
  openPanel(
    show,
    async (id, patch) => { await updateShow(id, patch); await refresh(); },
    (editTarget) => openModal(editTarget, async (updated) => { await updateShow(updated.id, updated); await refresh(); }),
    async (id) => { await deleteShow(id); await refresh(); }
  );
}

els.prevBtn.addEventListener('click', () => {
  if (state.month === 0) { state.month = 11; state.year--; }
  else state.month--;
  refresh();
});

els.nextBtn.addEventListener('click', () => {
  if (state.month === 11) { state.month = 0; state.year++; }
  else state.month++;
  refresh();
});

els.filterTabs.addEventListener('click', e => {
  const tab = e.target.closest('.filter-tab');
  if (!tab) return;
  state.filter = tab.dataset.filter;
  refresh();
});

els.addShowBtn.addEventListener('click', () => {
  openModal(null, async (show) => {
    setLoading(true);
    try { await addShow(show); await refresh(); }
    finally { setLoading(false); }
  });
});

els.sidebarToggle.addEventListener('click', () => {
  state.sidebarOpen = !state.sidebarOpen;
  els.main.classList.toggle('sidebar-open', state.sidebarOpen);
  els.sidebarToggle.classList.toggle('active', state.sidebarOpen);
});

els.main.classList.toggle('sidebar-open', state.sidebarOpen);
els.sidebarToggle.classList.toggle('active', state.sidebarOpen);

// ── Setup / Settings ──────────────────────��──────────────

function isConfigured() {
  return !!(localStorage.getItem('st_gist_id') && localStorage.getItem('st_github_token'));
}

function openSetup(isEdit = false) {
  const gistId = localStorage.getItem('st_gist_id') || '';
  const token  = localStorage.getItem('st_github_token') || '';
  document.getElementById('setup-box').innerHTML = `
    <div style="background:var(--surface);border-radius:var(--radius-lg);padding:28px;width:460px;border:1px solid var(--border);box-shadow:0 8px 40px rgba(0,0,0,.6)">
      <h2 style="font-size:18px;font-weight:700;color:var(--text);margin-bottom:6px">${isEdit ? '⚙ Settings' : 'Welcome to Series Tracker'}</h2>
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:20px;line-height:1.6">${isEdit
        ? 'Update your GitHub Gist credentials.'
        : 'Connect your GitHub Gist to store your shows. Data is saved to your private Gist and syncs across all devices you set up here.'}</p>

      <div class="field">
        <label>Gist ID</label>
        <input id="setup-gist-id" type="text" placeholder="e.g. b1106c6580ef2a6f6f30a34b76ae5d14" value="${gistId}" style="font-family:monospace">
        <div style="font-size:10px;color:var(--text-muted);margin-top:4px">Found in the URL of your Gist: gist.github.com/username/<strong>GIST_ID</strong></div>
      </div>
      <div class="field">
        <label>GitHub Token</label>
        <input id="setup-token" type="password" placeholder="ghp_…" value="${token}">
        <div style="font-size:10px;color:var(--text-muted);margin-top:4px">Personal access token with <strong>gist</strong> scope. Never committed or sent anywhere except GitHub's API.</div>
      </div>
      <div id="setup-error" style="font-size:11px;color:#ff8888;margin-bottom:12px;display:none"></div>
      <div style="display:flex;justify-content:flex-end;gap:8px;padding-top:16px;border-top:1px solid var(--border)">
        ${isEdit ? '<button id="setup-cancel" class="btn-cancel">Cancel</button>' : ''}
        <button id="setup-save" class="btn-save">Save & Connect</button>
      </div>
    </div>
  `;
  document.getElementById('setup-overlay').classList.remove('hidden');

  document.getElementById('setup-save').addEventListener('click', async () => {
    const gistId = document.getElementById('setup-gist-id').value.trim();
    const token  = document.getElementById('setup-token').value.trim();
    const errEl  = document.getElementById('setup-error');
    errEl.style.display = 'none';
    if (!gistId || !token) { errEl.textContent = 'Both fields are required.'; errEl.style.display = 'block'; return; }

    const btn = document.getElementById('setup-save');
    btn.disabled = true; btn.textContent = 'Connecting…';
    try {
      const res = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' },
      });
      if (!res.ok) throw new Error(res.status === 401 ? 'Invalid token.' : res.status === 404 ? 'Gist not found.' : `GitHub returned ${res.status}.`);
      localStorage.setItem('st_gist_id', gistId);
      localStorage.setItem('st_github_token', token);
      document.getElementById('setup-overlay').classList.add('hidden');
      refresh();
    } catch (e) {
      errEl.textContent = e.message;
      errEl.style.display = 'block';
      btn.disabled = false; btn.textContent = 'Save & Connect';
    }
  });

  const cancelBtn = document.getElementById('setup-cancel');
  if (cancelBtn) cancelBtn.addEventListener('click', () => document.getElementById('setup-overlay').classList.add('hidden'));
}

document.getElementById('settings-btn').addEventListener('click', () => openSetup(true));

if (!isConfigured()) {
  openSetup(false);
} else {
  refresh();
}
