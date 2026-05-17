import { test, assert, assertEqual, summary } from './harness.js';

// ── Mock fetch ──────────────────────────────────────────
let _gistShows = [];

globalThis.fetch = async (url, opts = {}) => {
  const method = opts.method || 'GET';
  if (method === 'PATCH') {
    const body = JSON.parse(opts.body);
    _gistShows = JSON.parse(body.files['series-tracker.json'].content);
    return { ok: true, json: async () => ({}) };
  }
  // GET
  return {
    ok: true,
    json: async () => ({
      files: { 'series-tracker.json': { content: JSON.stringify(_gistShows) } },
    }),
  };
};

// ── Import AFTER mock is in place ──
const { loadShows, saveShows, addShow, updateShow, deleteShow } =
  await import('../js/storage.js');

function reset() { _gistShows = []; }

test('loadShows returns empty array when gist has []', async () => {
  reset();
  const shows = await loadShows();
  assertEqual(shows, []);
});

test('addShow persists a show and loadShows returns it', async () => {
  reset();
  const show = { id: 'test-1', title: 'My Demon', status: 'watching', watchedEpisodes: 5, totalEpisodes: 16, platform: 'Viki', airDays: ['Sat', 'Sun'], airStartDate: '2023-11-25', airEndDate: '2024-01-21' };
  await addShow(show);
  const shows = await loadShows();
  assertEqual(shows.length, 1);
  assertEqual(shows[0].title, 'My Demon');
});

test('addShow appends without overwriting existing shows', async () => {
  reset();
  await addShow({ id: 'a', title: 'Show A' });
  await addShow({ id: 'b', title: 'Show B' });
  assertEqual((await loadShows()).length, 2);
});

test('updateShow merges patch into matching show', async () => {
  reset();
  await addShow({ id: 'x1', title: 'Old Title', status: 'plan_to_watch', watchedEpisodes: 0 });
  await updateShow('x1', { title: 'New Title', watchedEpisodes: 3 });
  const show = (await loadShows()).find(s => s.id === 'x1');
  assertEqual(show.title, 'New Title');
  assertEqual(show.watchedEpisodes, 3);
  assertEqual(show.status, 'plan_to_watch');
});

test('deleteShow removes the show with matching id', async () => {
  reset();
  await addShow({ id: 'd1', title: 'Gone' });
  await addShow({ id: 'd2', title: 'Stays' });
  await deleteShow('d1');
  const shows = await loadShows();
  assertEqual(shows.length, 1);
  assertEqual(shows[0].id, 'd2');
});

test('saveShows replaces all shows', async () => {
  reset();
  await addShow({ id: 's1', title: 'Old' });
  await saveShows([{ id: 's2', title: 'New' }]);
  const shows = await loadShows();
  assertEqual(shows.length, 1);
  assertEqual(shows[0].id, 's2');
});

summary();
