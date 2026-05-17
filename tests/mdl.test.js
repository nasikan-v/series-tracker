import { test, assert, assertEqual, summary } from './harness.js';
import { extractSlug, mapMdlResponse } from '../js/mdl.js';

test('extractSlug pulls slug from standard MDL URL', () => {
  assertEqual(extractSlug('https://mydramalist.com/738281-queen-of-tears'), '738281-queen-of-tears');
});

test('extractSlug strips trailing slash', () => {
  assertEqual(extractSlug('https://mydramalist.com/738281-queen-of-tears/'), '738281-queen-of-tears');
});

test('extractSlug returns null for invalid URL', () => {
  assertEqual(extractSlug('not-a-url'), null);
});

test('mapMdlResponse maps all expected fields', () => {
  // API returns episodes/rating as strings; title may include "(year)" suffix
  const raw = { title: 'Queen of Tears (2024)', episodes: '16', synopsis: 'A story.', genres: ['Romance'], country: 'South Korea', original_network: 'tvN', rating: '8.8' };
  const m = mapMdlResponse(raw);
  assertEqual(m.title, 'Queen of Tears');     // year suffix stripped
  assertEqual(m.totalEpisodes, 16);            // parsed to number
  assertEqual(m.synopsis, 'A story.');
  assertEqual(m.genres[0], 'Romance');
  assertEqual(m.country, 'South Korea');
  assertEqual(m.network, 'tvN');
  assertEqual(m.rating, 8.8);                 // parsed to number
});

test('mapMdlResponse handles missing fields gracefully', () => {
  const m = mapMdlResponse({});
  assert(m.title === undefined, 'title should be undefined');
  assert(m.totalEpisodes === undefined, 'episodes should be undefined');
});

summary();
