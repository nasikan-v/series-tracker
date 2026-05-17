const MDL_API_BASE = 'https://my-drama-list-api-ten.vercel.app';

export function extractSlug(mdlUrl) {
  try {
    return new URL(mdlUrl).pathname.replace(/^\/|\/$/g, '') || null;
  } catch {
    return null;
  }
}

export function mapMdlResponse(raw) {
  const m = {};
  // Strip year suffix from title if present: "Queen of Tears (2024)" → "Queen of Tears"
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

  // Try the slug from the URL directly first
  let res = await fetch(`${MDL_API_BASE}/api/id/${slug}`);

  // The unofficial API uses different numeric IDs than the MDL website URL.
  // If the direct slug 404s, search by the text portion of the slug and use
  // the first result's slug instead.
  if (res.status === 404) {
    const textPart = slug.replace(/^\d+-/, '').replace(/-/g, ' ');
    const searchRes = await fetch(`${MDL_API_BASE}/api/search/q/${encodeURIComponent(textPart)}`);
    if (!searchRes.ok) throw new Error("Couldn't reach MDL — fill fields manually.");
    const { results } = await searchRes.json();
    if (!results?.length) throw new Error('Show not found on MDL.');
    res = await fetch(`${MDL_API_BASE}/api/id/${results[0].slug}`);
  }

  if (!res.ok) throw new Error(`MDL API returned ${res.status}`);
  return mapMdlResponse(await res.json());
}
