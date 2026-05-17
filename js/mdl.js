const MDL_API_BASE = 'https://my-drama-list-api-ten.vercel.app';

export function extractSlug(mdlUrl) {
  try {
    return new URL(mdlUrl).pathname.replace(/^\/|\/$/g, '') || null;
  } catch {
    return null;
  }
}

export function mapMdlResponse(raw) {
  // Field names from API scraper.py: title, episodes, synopsis, genres,
  // country, original_network, rating
  const m = {};
  if (raw.title            !== undefined) m.title         = raw.title;
  if (raw.episodes         !== undefined) m.totalEpisodes  = raw.episodes;
  if (raw.synopsis         !== undefined) m.synopsis       = raw.synopsis;
  if (raw.description      !== undefined && m.synopsis === undefined) m.synopsis = raw.description;
  if (raw.genres           !== undefined) m.genres         = raw.genres;
  if (raw.country          !== undefined) m.country        = raw.country;
  if (raw.original_network !== undefined) m.network        = raw.original_network;
  if (raw.rating           !== undefined) m.rating         = raw.rating;
  return m;
}

export async function fetchMdlData(mdlUrl) {
  const slug = extractSlug(mdlUrl);
  if (!slug) throw new Error('Invalid MDL URL');
  const res = await fetch(`${MDL_API_BASE}/api/id/${slug}`);
  if (!res.ok) throw new Error(`MDL API returned ${res.status}`);
  return mapMdlResponse(await res.json());
}
