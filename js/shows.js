import { PLATFORMS, CHIP_COLORS, STATUS_LABELS, PLATFORM_NAMES } from './constants.js';

// ── Helpers ──────────────────────────────────────────────

export function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export function buildColorMap(shows) {
  const map = {};
  shows.forEach((show, i) => { map[show.id] = i % CHIP_COLORS.length; });
  return map;
}

// ── Sidebar ──────────────────────────────────────────────

export function renderSidebar(shows, filter, listEl, tabsEl, onCardClick) {
  renderFilterTabs(tabsEl, filter);
  renderShowList(shows, filter, listEl, onCardClick);
}

function renderFilterTabs(el, activeFilter) {
  const filters = [
    { key: 'all',           label: 'All' },
    { key: 'watching',      label: 'Watching' },
    { key: 'completed',     label: 'Done' },
    { key: 'plan_to_watch', label: 'Plan' },
    { key: 'dropped',       label: 'Dropped' },
  ];
  el.innerHTML = filters
    .map(f => `<div class="filter-tab${activeFilter === f.key ? ' active' : ''}" data-filter="${f.key}">${f.label}</div>`)
    .join('');
}

function renderShowList(shows, filter, el, onCardClick) {
  const filtered = filter === 'all' ? shows : shows.filter(s => s.status === filter);
  if (filtered.length === 0) {
    el.innerHTML = `<p style="color:var(--text-muted);font-size:12px;padding:8px 0">No shows here yet.</p>`;
    return;
  }
  const colorMap = buildColorMap(shows);
  el.innerHTML = '';
  filtered.forEach(show => el.appendChild(buildCard(show, colorMap, onCardClick)));
}

function buildCard(show, colorMap, onCardClick) {
  const platform   = PLATFORMS[show.platform] || PLATFORMS['Other'];
  const pct        = show.totalEpisodes ? Math.round((show.watchedEpisodes / show.totalEpisodes) * 100) : 0;
  const chipColor  = CHIP_COLORS[colorMap[show.id] ?? 0];
  const statusClass = `status-${show.status}`;

  const card = document.createElement('div');
  card.className = 'show-card';
  card.dataset.showId = show.id;
  card.innerHTML = `
    <div class="card-top">
      <div class="platform-badge" style="background:${platform.color};color:#fff;width:18px;height:18px;font-size:9px">${platform.badge}</div>
      <div class="card-title">${escHtml(show.title)}</div>
    </div>
    <div class="card-meta">
      <span class="card-eps">Ep ${show.watchedEpisodes ?? 0} / ${show.totalEpisodes ?? '?'}</span>
      <span class="status-badge ${statusClass}">${STATUS_LABELS[show.status] ?? show.status}</span>
    </div>
    <div class="progress-bar-wrap">
      <div class="progress-bar" style="width:${pct}%;background:${chipColor.text}"></div>
    </div>
  `;
  card.addEventListener('click', () => onCardClick(show));
  return card;
}

// ── Modal ─────────────────────────────────────────────────

let _onSave = null;

export function openModal(show = null, onSave) {
  _onSave = onSave;
  document.getElementById('modal-box').innerHTML = buildModalHtml(show);
  document.getElementById('modal-overlay').classList.remove('hidden');
  wireModal(show);
}

export function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

function buildModalHtml(show) {
  const isEdit = !!show;
  const s = show || { status: 'plan_to_watch', airDays: [], watchedEpisodes: 0 };

  const statusOptions = Object.entries(STATUS_LABELS)
    .map(([k, v]) => `<div class="pill${s.status === k ? ' active' : ''}" data-status="${k}">${v}</div>`)
    .join('');

  const platformOptions = PLATFORM_NAMES
    .map(p => `<option value="${p}"${s.platform === p ? ' selected' : ''}>${p}</option>`)
    .join('');

  const dayToggles = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
    .map(d => `<div class="day-toggle${(s.airDays||[]).includes(d) ? ' active' : ''}" data-day="${d}">${d[0]}</div>`)
    .join('');

  return `
    <h2 style="font-size:18px;font-weight:700;color:var(--text);margin-bottom:20px">${isEdit ? 'Edit Show' : 'Add Show'}</h2>

    <div class="section-label">MyDramaList (optional)</div>
    <div class="mdl-row" style="margin-bottom:4px">
      <div class="field">
        <input id="mdl-url-input" type="text" placeholder="https://mydramalist.com/…" value="${escHtml(s.mdlUrl||'')}">
      </div>
      <button id="pull-data-btn" class="btn-pull">Pull Data</button>
    </div>
    <div class="mdl-hint">Paste the MDL URL and click Pull Data to auto-fill fields below.</div>
    <div id="mdl-error" class="mdl-error hidden"></div>

    <hr class="divider">
    <div class="section-label">Show details</div>

    <div class="field">
      <label>Title</label>
      <input id="field-title" type="text" placeholder="Show name" value="${escHtml(s.title||'')}">
    </div>

    <div class="field">
      <label>Status</label>
      <div id="status-pills" class="pill-group">${statusOptions}</div>
    </div>

    <div class="field-row">
      <div class="field">
        <label>Episodes watched</label>
        <input id="field-watched" type="number" min="0" value="${s.watchedEpisodes ?? 0}">
      </div>
      <div class="field">
        <label>Total episodes</label>
        <input id="field-total" type="number" min="0" value="${s.totalEpisodes || ''}">
      </div>
    </div>

    <div class="field">
      <label>Platform</label>
      <select id="field-platform">${platformOptions}</select>
    </div>

    <div class="field-row">
      <div class="field">
        <label>Air start date</label>
        <input id="field-start" type="date" value="${s.airStartDate||''}">
      </div>
      <div class="field">
        <label>Air end date</label>
        <input id="field-end" type="date" value="${s.airEndDate||''}">
      </div>
    </div>

    <div class="field">
      <label>Airs on</label>
      <div id="day-toggles" class="day-toggles">${dayToggles}</div>
    </div>
    <div id="date-error" class="validation-error hidden">End date must be after start date.</div>

    <div class="modal-footer">
      <button id="modal-cancel" class="btn-cancel">Cancel</button>
      <button id="modal-save" class="btn-save">Save Show</button>
    </div>
  `;
}

function wireModal(existingShow) {
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target.id === 'modal-overlay') closeModal();
  });

  document.getElementById('status-pills').addEventListener('click', e => {
    const pill = e.target.closest('.pill');
    if (!pill) return;
    document.querySelectorAll('#status-pills .pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
  });

  document.getElementById('day-toggles').addEventListener('click', e => {
    const t = e.target.closest('.day-toggle');
    if (t) t.classList.toggle('active');
  });

  document.getElementById('pull-data-btn').addEventListener('click', async () => {
    const url   = document.getElementById('mdl-url-input').value.trim();
    const errEl = document.getElementById('mdl-error');
    errEl.classList.add('hidden');
    if (!url) return;
    const btn = document.getElementById('pull-data-btn');
    btn.disabled = true; btn.textContent = 'Pulling…';
    try {
      const { fetchMdlData } = await import('./mdl.js');
      const data = await fetchMdlData(url);
      if (data.title)         document.getElementById('field-title').value   = data.title;
      if (data.totalEpisodes) document.getElementById('field-total').value   = data.totalEpisodes;
    } catch {
      errEl.textContent = "Couldn't reach MDL — fill fields manually.";
      errEl.classList.remove('hidden');
    } finally {
      btn.disabled = false; btn.textContent = 'Pull Data';
    }
  });

  document.getElementById('modal-save').addEventListener('click', async () => {
    const start = document.getElementById('field-start').value;
    const end   = document.getElementById('field-end').value;
    const errEl = document.getElementById('date-error');
    if (start && end && end < start) { errEl.classList.remove('hidden'); return; }
    errEl.classList.add('hidden');

    const title = document.getElementById('field-title').value.trim();
    if (!title) {
      document.getElementById('field-title').style.borderColor = '#ff4444';
      return;
    }

    const show = {
      id:              existingShow?.id || crypto.randomUUID(),
      title,
      status:          document.querySelector('#status-pills .pill.active')?.dataset.status || 'plan_to_watch',
      watchedEpisodes: parseInt(document.getElementById('field-watched').value) || 0,
      totalEpisodes:   parseInt(document.getElementById('field-total').value)   || 0,
      platform:        document.getElementById('field-platform').value,
      airDays:         [...document.querySelectorAll('#day-toggles .day-toggle.active')].map(el => el.dataset.day),
      airStartDate:    start,
      airEndDate:      end,
      mdlUrl:          document.getElementById('mdl-url-input').value.trim() || undefined,
      // preserve MDL fields if editing
      ...(existingShow ? {
        synopsis: existingShow.synopsis,
        genres:   existingShow.genres,
        country:  existingShow.country,
        network:  existingShow.network,
        rating:   existingShow.rating,
      } : {}),
    };

    const saveBtn = document.getElementById('modal-save');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';
    try {
      await _onSave(show, !!existingShow);
      closeModal();
    } catch {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Show';
    }
  });
}
