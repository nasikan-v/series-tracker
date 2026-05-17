const FILENAME = 'series-tracker.json';

function getConfig() {
  const gistId = localStorage.getItem('st_gist_id');
  const token  = localStorage.getItem('st_github_token');
  if (!gistId || !token) throw new Error('NOT_CONFIGURED');
  return {
    url:     `https://api.github.com/gists/${gistId}`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept':        'application/vnd.github+json',
      'Content-Type':  'application/json',
    },
  };
}

export async function loadShows() {
  const { url, headers } = getConfig();
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Gist fetch failed: ${res.status}`);
  const gist = await res.json();
  return JSON.parse(gist.files[FILENAME].content);
}

export async function saveShows(shows) {
  const { url, headers } = getConfig();
  const res = await fetch(url, {
    method: 'PATCH',
    headers,
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
