import { loadShows } from './storage.js';
import { renderCalendar, formatMonthTitle } from './calendar.js';

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
  } catch (e) {
    console.error('Failed to load shows:', e);
    els.monthTitle.textContent = 'Error loading data';
  } finally {
    setLoading(false);
  }
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

refresh();
