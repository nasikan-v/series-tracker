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

refresh();
