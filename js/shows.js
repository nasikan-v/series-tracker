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
