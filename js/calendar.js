import { PLATFORMS, CHIP_COLORS, DAY_DISPLAY, DAY_NAMES } from './constants.js';

// ── Pure logic (testable without DOM) ───────────────────

export function getShowsForDay(date, shows) {
  const dayName = DAY_NAMES[date.getDay()];
  const d = ymd(date);
  return shows.filter(show => {
    if (!show.airStartDate || !show.airEndDate || !show.airDays?.length) return false;
    return d >= parseDate(show.airStartDate)
        && d <= parseDate(show.airEndDate)
        && show.airDays.includes(dayName);
  });
}

function ymd(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatMonthTitle(year, month) {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ── DOM rendering ────────────────────────────────────────

export function renderCalendar(year, month, shows, gridEl, headersEl) {
  renderDayHeaders(headersEl);
  renderGrid(year, month, shows, gridEl);
}

function renderDayHeaders(el) {
  el.innerHTML = DAY_DISPLAY.map(d => `<div class="day-header">${d}</div>`).join('');
}

function renderGrid(year, month, shows, el) {
  el.innerHTML = '';
  const today     = new Date();
  const firstDay  = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const colorMap  = buildColorMap(shows);

  // Monday-based offset
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  for (let i = 0; i < startOffset; i++) {
    const cell = document.createElement('div');
    cell.className = 'cal-cell empty';
    el.appendChild(cell);
  }

  for (let day = 1; day <= totalDays; day++) {
    const date    = new Date(year, month, day);
    const isToday = date.toDateString() === today.toDateString();
    const cell    = document.createElement('div');
    cell.className = 'cal-cell' + (isToday ? ' today' : '');

    const num = document.createElement('div');
    num.className = 'day-num';
    num.textContent = isToday ? `${day} ◉` : day;
    cell.appendChild(num);

    getShowsForDay(date, shows).forEach(show => {
      cell.appendChild(buildChip(show, colorMap));
    });

    el.appendChild(cell);
  }
}

function buildColorMap(shows) {
  const map = {};
  shows.forEach((show, i) => { map[show.id] = i % CHIP_COLORS.length; });
  return map;
}

export function buildChip(show, colorMap) {
  const platform = PLATFORMS[show.platform] || PLATFORMS['Other'];
  const color    = CHIP_COLORS[colorMap?.[show.id] ?? 0];

  const chip = document.createElement('div');
  chip.className = 'show-chip';
  chip.style.background = color.bg;
  chip.style.color = color.text;
  chip.dataset.showId = show.id;

  const badge = document.createElement('div');
  badge.className = 'platform-badge';
  badge.style.background = platform.color;
  badge.style.color = '#fff';
  badge.textContent = platform.badge;

  const title = document.createElement('span');
  title.textContent = show.title;

  chip.appendChild(badge);
  chip.appendChild(title);
  return chip;
}
