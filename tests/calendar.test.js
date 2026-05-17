import { test, assert, assertEqual, summary } from './harness.js';
import { getShowsForDay } from '../js/calendar.js';

const show = {
  id: '1',
  title: 'Queen of Tears',
  airDays: ['Fri', 'Sat'],
  airStartDate: '2024-03-23',
  airEndDate: '2024-05-12',
};

test('show appears on a matching day within range', () => {
  // 2024-03-29 is a Friday
  const result = getShowsForDay(new Date(2024, 2, 29), [show]);
  assertEqual(result.length, 1);
  assertEqual(result[0].id, '1');
});

test('show does not appear on wrong day of week', () => {
  // 2024-03-25 is a Monday
  assertEqual(getShowsForDay(new Date(2024, 2, 25), [show]).length, 0);
});

test('show does not appear before airStartDate', () => {
  // 2024-03-22 is a Friday before start
  assertEqual(getShowsForDay(new Date(2024, 2, 22), [show]).length, 0);
});

test('show does not appear after airEndDate', () => {
  // 2024-05-18 is a Saturday after end
  assertEqual(getShowsForDay(new Date(2024, 4, 18), [show]).length, 0);
});

test('show appears on airEndDate itself (Saturday end date)', () => {
  const showEndingSat = { ...show, airEndDate: '2024-05-11' }; // May 11 is Saturday
  assertEqual(getShowsForDay(new Date(2024, 4, 11), [showEndingSat]).length, 1);
  // one day after end — should NOT appear
  assertEqual(getShowsForDay(new Date(2024, 4, 12), [showEndingSat]).length, 0);
});

test('show with empty airDays never appears', () => {
  assertEqual(getShowsForDay(new Date(2024, 2, 29), [{ ...show, airDays: [] }]).length, 0);
});

test('only shows matching the day are returned', () => {
  const show2 = { id: '2', airDays: ['Mon', 'Tue'], airStartDate: '2023-11-25', airEndDate: '2024-01-20' };
  // 2023-11-27 is a Monday
  const result = getShowsForDay(new Date(2023, 10, 27), [show, show2]);
  assertEqual(result.length, 1);
  assertEqual(result[0].id, '2');
});

summary();
