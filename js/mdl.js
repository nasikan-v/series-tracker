const MDL_API_BASE = 'https://my-drama-list-api-ten.vercel.app';
const PROXY        = 'https://api.allorigins.win/get?url=';

async function proxyFetch(url) {
  const res = await fetch(PROXY + encodeURIComponent(url));
  if (!res.ok) throw new Error(`Proxy error ${res.status}`);
  const { contents } = await res.json();
  return JSON.parse(contents);
}

export function extractSlug(mdlUrl) {
  try {
    return new URL(mdlUrl).pathname.replace(/^\/|\/$/g, '') || null;
  } catch {
    return null;
  }
}

export function mapMdlResponse(raw) {
  const m = {};
  // Strip year suffix from title: "Queen of Tears (2024)" → "Queen of Tears"
  if (raw.title            !== undefined) m.title         = raw.title.replace(/\s*\(\d{4}\)\s*$/, '').trim();
  if (raw.episodes         !== undefined) m.totalEpisodes  = parseInt(raw.episodes, 10) || undefined;
  if (raw.synopsis         !== undefined) m.synopsis       = raw.synopsis;
  if (raw.description      !== undefined && m.synopsis === undefined) m.synopsis = raw.description;
  if (raw.genres           !== undefined) m.genres         = raw.genres;
  if (raw.country          !== undefined) m.country        = raw.country;
  if (raw.original_network !== undefined) m.network        = raw.original_network;
  if (raw.rating           !== undefined) m.rating         = parseFloat(raw.rating) || undefined;
  return m;
}

export async function fetchMdlData(mdlUrl) {
  const slug = extractSlug(mdlUrl);
  if (!slug) throw new Error('Invalid MDL URL');

  // Try the URL slug directly first
  let data = await proxyFetch(`${MDL_API_BASE}/api/id/${slug}`);

  // The unofficial API uses different numeric IDs than the MDL browser URL.
  // On 404, search by the text portion of the slug and use the first result.
  if (data.error) {
    const textPart = slug.replace(/^\d+-/, '').replace(/-/g, ' ');
    const search   = await proxyFetch(`${MDL_API_BASE}/api/search/q/${encodeURIComponent(textPart)}`);
    if (!search.results?.length) throw new Error('Show not found on MDL.');
    data = await proxyFetch(`${MDL_API_BASE}/api/id/${search.results[0].slug}`);
    if (data.error) throw new Error('Show not found on MDL.');
  }

  return mapMdlResponse(data);
}
