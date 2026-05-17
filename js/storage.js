import { GIST_ID, GITHUB_TOKEN } from './config.js';

const FILENAME = 'series-tracker.json';
const GIST_URL = `https://api.github.com/gists/${GIST_ID}`;
const HEADERS  = {
  'Authorization': `Bearer ${GITHUB_TOKEN}`,
  'Accept':        'application/vnd.github+json',
  'Content-Type':  'application/json',
};

export async function loadShows() {
  const res = await fetch(GIST_URL, { headers: HEADERS });
  if (!res.ok) throw new Error(`Gist fetch failed: ${res.status}`);
  const gist = await res.json();
  return JSON.parse(gist.files[FILENAME].content);
}

export async function saveShows(shows) {
  const res = await fetch(GIST_URL, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify({
      files: { [FILENAME]: { content: JSON.stringify(shows) } },
    }),
  });
  if (!res.ok) throw new Error(`Gist save failed: ${res.status}`);
}

export async function addShow(show) {
  const shows = await loadShows();
  shows.push(show);
  await saveShows(shows);
}

export async function updateShow(id, patch) {
  const shows = await loadShows();
  const idx = shows.findIndex(s => s.id === id);
  if (idx !== -1) shows[idx] = { ...shows[idx], ...patch };
  await saveShows(shows);
}

export async function deleteShow(id) {
  const shows = await loadShows();
  await saveShows(shows.filter(s => s.id !== id));
}
