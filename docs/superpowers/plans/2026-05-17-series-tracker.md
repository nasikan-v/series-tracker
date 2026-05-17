# Series Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a vanilla-JS monthly calendar web app for tracking Asian drama series, with a collapsible show sidebar, add/edit modal, expanded show panel, and optional MyDramaList data pull — data synced cross-device via a private GitHub Gist.

**Architecture:** Vanilla ES modules, no build step. `app.js` wires modules together and owns global state. `calendar.js` and `shows.js` render into DOM nodes. `storage.js` is the single point of contact with the GitHub Gist API — all its functions are async. `mdl.js` is a pure async utility with no DOM access. A gitignored `js/config.js` holds the Gist ID and GitHub token.

**Tech Stack:** HTML5, CSS custom properties, vanilla ES modules, GitHub Gist REST API, `crypto.randomUUID()`, `npx serve .` to run.

---

## One-Time Setup (do before Task 1)

These steps are done once by the user before any code is written.

1. **Create the Gist:**
   - Go to `https://gist.github.com`
   - Create a **private** Gist with filename `series-tracker.json` and content `[]`
   - Copy the Gist ID from the URL: `https://gist.github.com/{username}/{GIST_ID}`

2. **Create a GitHub Personal Access Token:**
   - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate a new token with only the **`gist`** scope
   - Copy the token (shown once)

3. **These credentials go into `js/config.js`** (created in Task 1, gitignored)

---

## File Map

| File | Responsibility |
|------|----------------|
| `index.html` | App shell, all DOM anchor points, module entry |
| `css/styles.css` | CSS variables (dark theme), layout, all component styles |
| `js/config.js` | GIST_ID + GITHUB_TOKEN — **gitignored, never committed** |
| `js/config.example.js` | Template for config.js — committed, safe to share |
| `js/constants.js` | PLATFORMS map, CHIP_COLORS, STATUS_LABELS, DAY_NAMES |
| `js/storage.js` | GitHub Gist read/write — only file that touches the API |
| `js/calendar.js` | Month grid rendering, `getShowsForDay()` pure logic |
| `js/shows.js` | Sidebar cards, add/edit modal, expanded panel, episode stepper |
| `js/mdl.js` | MDL URL slug extraction, API fetch, response mapping |
| `js/app.js` | Global state, event wiring, module orchestration |
| `tests/harness.js` | Minimal `test()` / `assert()` / `assertEqual()` utilities |
| `tests/storage.test.js` | Tests for storage functions (fetch mocked) |
| `tests/calendar.test.js` | Tests for `getShowsForDay()` |
| `tests/mdl.test.js` | Tests for `extractSlug()` and `mapMdlResponse()` |
| `tests/index.html` | Loads and runs all test files in the browser |

---

## Task 1: Project Scaffold

**Files:**
- Create: `index.html`
- Create: `css/styles.css`
- Create: `js/constants.js`
- Create: `js/config.js` (gitignored)
- Create: `js/config.example.js`
- Create: `js/app.js`

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Series Tracker</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <div id="app">
    <header id="header">
      <div class="header-left">
        <button id="prev-month" class="btn-nav">← Prev</button>
        <h1 id="month-title"></h1>
        <button id="next-month" class="btn-nav">Next →</button>
      </div>
      <div class="header-right">
        <button id="add-show-btn" class="btn-primary">+ Add Show</button>
        <button id="sidebar-toggle" class="btn-secondary">☰ My Shows</button>
      </div>
    </header>
    <div id="loading-bar" class="loading-bar hidden"></div>
    <main id="main" class="sidebar-open">
      <section id="calendar-section">
        <div id="day-headers"></div>
        <div id="calendar-grid"></div>
      </section>
      <aside id="sidebar">
        <div class="sidebar-label">My Shows</div>
        <div id="filter-tabs"></div>
        <div id="show-list"></div>
      </aside>
    </main>
  </div>
  <div id="modal-overlay" class="overlay hidden">
    <div id="modal-box"></div>
  </div>
  <div id="panel-overlay" class="overlay hidden">
    <div id="panel-box"></div>
  </div>
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `css/styles.css`**

```css
:root {
  --bg: #111;
  --surface: #1e1e1e;
  --surface-2: #161616;
  --surface-3: #1a1a1a;
  --border: #2a2a2a;
  --border-2: #333;
  --text: #eee;
  --text-2: #aaa;
  --text-muted: #666;
  --text-dim: #444;
  --accent: #6c63ff;
  --accent-dim: rgba(108,99,255,0.13);
  --accent-border: rgba(108,99,255,0.35);
  --today-border: rgba(108,99,255,0.55);
  --radius: 8px;
  --radius-lg: 14px;
  --sidebar-width: 280px;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 14px;
  min-height: 100vh;
}

#app { display: flex; flex-direction: column; height: 100vh; max-width: 1440px; margin: 0 auto; }

/* Header */
#header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-3);
  flex-shrink: 0;
}
.header-left { display: flex; align-items: center; gap: 14px; }
.header-right { display: flex; align-items: center; gap: 8px; }
#month-title { font-size: 18px; font-weight: 700; }

/* Loading bar */
.loading-bar {
  height: 2px;
  background: var(--accent);
  animation: loading 1s ease-in-out infinite alternate;
  flex-shrink: 0;
}
@keyframes loading { from { opacity: 0.4; } to { opacity: 1; } }

/* Buttons */
.btn-nav {
  background: transparent;
  border: 1px solid var(--border-2);
  color: var(--text-2);
  padding: 5px 14px;
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 13px;
}
.btn-nav:hover { border-color: #555; color: var(--text); }

.btn-primary {
  background: var(--accent);
  color: #fff;
  border: none;
  padding: 7px 18px;
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}
.btn-primary:hover { opacity: 0.9; }

.btn-secondary {
  background: transparent;
  border: 1px solid var(--border-2);
  color: var(--text-muted);
  padding: 7px 12px;
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 13px;
}
.btn-secondary:hover { border-color: #555; color: var(--text-2); }
.btn-secondary.active { border-color: var(--accent-border); color: #a89fff; }

/* Main layout */
#main { display: flex; flex: 1; overflow: hidden; }

#calendar-section { flex: 1; padding: 16px; overflow-y: auto; }

/* Sidebar */
#sidebar {
  width: var(--sidebar-width);
  border-left: 1px solid var(--border);
  background: var(--surface-2);
  padding: 16px;
  overflow-y: auto;
  flex-shrink: 0;
}
#main:not(.sidebar-open) #sidebar { display: none; }

/* Calendar grid */
#day-headers {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  margin-bottom: 6px;
}
.day-header { text-align: center; font-size: 12px; color: var(--text-muted); font-weight: 600; padding: 4px; }
#calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
.cal-cell { min-height: 100px; background: var(--surface); border-radius: var(--radius); padding: 8px; }
.cal-cell.empty { opacity: 0.2; background: #0d0d0d; }
.cal-cell.today { background: #1e1e2e; border: 1px solid var(--today-border); }
.day-num { font-size: 12px; color: var(--text-muted); font-weight: 500; margin-bottom: 5px; }
.today .day-num { color: #a89fff; }

/* Show chip */
.show-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  border-radius: 4px;
  padding: 3px 6px 3px 3px;
  margin-bottom: 3px;
  font-size: 11px;
  cursor: pointer;
}
.show-chip:hover { filter: brightness(1.2); }

/* Platform badge */
.platform-badge {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 7px;
  font-weight: 900;
  flex-shrink: 0;
  letter-spacing: -0.5px;
}

/* Sidebar */
.sidebar-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
#filter-tabs { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 12px; }
.filter-tab {
  font-size: 10px;
  padding: 3px 9px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid transparent;
  background: #222;
  color: var(--text-muted);
}
.filter-tab.active { background: var(--accent); color: #fff; }

/* Show card */
.show-card {
  background: var(--surface);
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 8px;
  cursor: pointer;
  border: 1px solid transparent;
}
.show-card:hover { border-color: var(--border-2); }
.card-top { display: flex; align-items: center; gap: 6px; margin-bottom: 5px; }
.card-title { font-size: 13px; font-weight: 600; color: var(--text); }
.card-meta { display: flex; justify-content: space-between; align-items: center; }
.card-eps { font-size: 11px; color: var(--text-muted); }
.status-badge { font-size: 10px; padding: 2px 7px; border-radius: 8px; }
.progress-bar-wrap { margin-top: 6px; background: #333; border-radius: 3px; height: 3px; }
.progress-bar { height: 3px; border-radius: 3px; }

/* Overlays */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.overlay.hidden { display: none; }

#modal-box {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: 24px;
  width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid var(--border);
  box-shadow: 0 8px 40px rgba(0,0,0,0.6);
}

#panel-overlay { align-items: flex-start; justify-content: flex-end; }
#panel-box {
  background: var(--surface-3);
  border-left: 1px solid var(--border);
  width: 420px;
  height: 100vh;
  overflow-y: auto;
  padding: 24px;
}

/* Form elements */
.field { margin-bottom: 16px; }
.field label { display: block; font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; }
.field input, .field select {
  width: 100%;
  background: #141414;
  border: 1px solid var(--border-2);
  color: var(--text);
  border-radius: var(--radius);
  padding: 9px 12px;
  font-size: 13px;
  font-family: inherit;
}
.field input:focus, .field select:focus { outline: none; border-color: var(--accent-border); }
.field-row { display: flex; gap: 12px; }
.field-row .field { flex: 1; }

.pill-group { display: flex; gap: 6px; flex-wrap: wrap; }
.pill { font-size: 11px; padding: 5px 12px; border-radius: 20px; cursor: pointer; border: 1px solid var(--border-2); color: var(--text-muted); background: #141414; }
.pill.active { background: var(--accent-dim); border-color: var(--accent-border); color: #a89fff; }

.day-toggles { display: flex; gap: 6px; }
.day-toggle {
  width: 34px; height: 34px; border-radius: var(--radius);
  border: 1px solid var(--border-2); background: #141414;
  color: var(--text-muted); font-size: 11px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.day-toggle.active { background: var(--accent-dim); border-color: var(--accent-border); color: #a89fff; font-weight: 700; }

.modal-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); }
.btn-cancel { background: transparent; border: 1px solid var(--border-2); color: var(--text-muted); padding: 8px 18px; border-radius: var(--radius); cursor: pointer; font-size: 13px; }
.btn-save { background: var(--accent); color: #fff; border: none; padding: 8px 20px; border-radius: var(--radius); cursor: pointer; font-size: 13px; font-weight: 600; }

.divider { border: none; border-top: 1px solid var(--border); margin: 18px 0; }
.section-label { font-size: 10px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }

.mdl-row { display: flex; gap: 8px; align-items: flex-end; }
.mdl-row .field { flex: 1; margin-bottom: 0; }
.btn-pull { background: var(--accent); color: #fff; border: none; padding: 9px 14px; border-radius: var(--radius); cursor: pointer; font-size: 12px; font-weight: 600; white-space: nowrap; }
.mdl-hint { font-size: 10px; color: #555; margin-top: 4px; }
.mdl-error { font-size: 11px; color: #ff8888; margin-top: 4px; }

/* Panel */
.panel-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
.poster-placeholder { width: 72px; height: 100px; background: var(--border); border-radius: var(--radius); display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
.panel-meta { flex: 1; }
.panel-title { font-size: 17px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
.panel-sub { font-size: 12px; color: var(--text-muted); margin-bottom: 8px; }
.panel-actions { display: flex; gap: 6px; margin-top: 10px; }
.btn-edit { font-size: 11px; background: #252525; border: 1px solid var(--border-2); color: var(--text-2); padding: 5px 12px; border-radius: 6px; cursor: pointer; }
.btn-delete { font-size: 11px; background: transparent; border: 1px solid rgba(255,68,68,0.2); color: #ff8888; padding: 5px 12px; border-radius: 6px; cursor: pointer; }
.btn-close { background: transparent; border: none; color: var(--text-muted); font-size: 18px; cursor: pointer; line-height: 1; flex-shrink: 0; }

.panel-section { margin-bottom: 20px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.info-item label { font-size: 10px; color: #555; display: block; margin-bottom: 2px; }
.info-item span { font-size: 13px; color: var(--text-2); }

.ep-controls { display: flex; align-items: center; gap: 8px; }
.ep-btn { width: 30px; height: 30px; background: #252525; border: 1px solid var(--border-2); border-radius: 6px; color: var(--text-2); font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.ep-label { font-size: 13px; color: var(--text); min-width: 80px; text-align: center; }
.ep-bar-wrap { background: #2a2a2a; border-radius: 4px; height: 6px; margin-bottom: 8px; }
.ep-bar { height: 6px; border-radius: 4px; background: var(--accent); }

.tag { display: inline-block; font-size: 10px; background: #252525; border: 1px solid var(--border-2); color: var(--text-muted); padding: 3px 8px; border-radius: 6px; margin: 0 4px 4px 0; }

.mdl-link { font-size: 12px; color: var(--accent); text-decoration: none; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.btn-refresh { font-size: 11px; background: var(--accent-dim); border: 1px solid var(--accent-border); color: #a89fff; padding: 5px 10px; border-radius: 6px; cursor: pointer; white-space: nowrap; }
.mdl-prompt { background: #141414; border: 1px dashed var(--border-2); border-radius: var(--radius); padding: 14px; text-align: center; }
.mdl-prompt p { font-size: 12px; color: #555; margin-bottom: 8px; }

/* Status colours */
.status-watching      { background: rgba(99,197,255,0.13); color: #9fddff; }
.status-completed     { background: rgba(99,255,159,0.13); color: #9fffcc; }
.status-plan_to_watch { background: rgba(255,204,99,0.13); color: #ffd98a; }
.status-dropped       { background: rgba(255,99,99,0.13);  color: #ff9f9f; }

.hidden { display: none !important; }
.validation-error { font-size: 11px; color: #ff8888; margin-top: 4px; }
.warning-banner { background: rgba(255,170,68,0.15); border: 1px solid rgba(255,170,68,0.3); color: #ffcc88; padding: 8px 16px; font-size: 12px; text-align: center; }
```

- [ ] **Step 3: Create `js/constants.js`**

```js
export const PLATFORMS = {
  'Netflix':       { badge: 'N',  color: '#E50914' },
  'Viki':          { badge: 'V',  color: '#1aacff' },
  'WeTV':          { badge: 'W',  color: '#00bd96' },
  'iQIYI':         { badge: 'iQ', color: '#00be06' },
  'Crunchyroll':   { badge: 'CR', color: '#F47521' },
  'Disney+':       { badge: 'D+', color: '#1133cc' },
  'Amazon Prime':  { badge: 'AP', color: '#FF9900' },
  'YouTube':       { badge: 'YT', color: '#FF0000' },
  'GagaOOLala':    { badge: 'GG', color: '#c9006b' },
  'Other':         { badge: '?',  color: '#555555' },
};

export const PLATFORM_NAMES = Object.keys(PLATFORMS);

export const CHIP_COLORS = [
  { bg: 'rgba(108,99,255,0.13)',  text: '#a89fff' },
  { bg: 'rgba(255,99,119,0.13)', text: '#ff9faa' },
  { bg: 'rgba(99,197,255,0.13)', text: '#9fddff'  },
  { bg: 'rgba(99,255,159,0.13)', text: '#9fffcc'  },
  { bg: 'rgba(255,170,68,0.13)', text: '#ffcc88'  },
  { bg: 'rgba(255,99,255,0.13)', text: '#ff9fff'  },
];

export const STATUS_LABELS = {
  plan_to_watch: 'Plan to Watch',
  watching:      'Watching',
  completed:     'Completed',
  dropped:       'Dropped',
};

export const DAY_NAMES    = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_DISPLAY  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
```

- [ ] **Step 4: Create `js/config.example.js`** (safe to commit — no real credentials)

```js
// Copy this file to js/config.js and fill in your values.
// js/config.js is gitignored and never committed.
export const GIST_ID     = 'YOUR_GIST_ID_HERE';
export const GITHUB_TOKEN = 'ghp_YOUR_TOKEN_HERE';
```

- [ ] **Step 5: Create `js/config.js`** with your real credentials (from the one-time setup)

```js
export const GIST_ID      = 'paste-your-gist-id-here';
export const GITHUB_TOKEN = 'paste-your-github-token-here';
```

- [ ] **Step 6: Create `.gitignore`**

```
js/config.js
.superpowers/
node_modules/
.DS_Store
```

- [ ] **Step 7: Create stub `js/app.js`**

```js
async function init() {
  document.getElementById('month-title').textContent = 'Loading…';
  console.log('Series Tracker initialising');
}

init();
```

- [ ] **Step 8: Start dev server and verify page loads**

```bash
cd /Users/valeryanasikan/series-tracker
npx serve .
```

Open `http://localhost:3000`. Expected: dark page with "Loading…" in the header, no JS errors in console.

- [ ] **Step 9: Commit scaffold**

```bash
git add index.html css/styles.css js/constants.js js/config.example.js js/app.js .gitignore
git commit -m "feat: project scaffold — HTML shell, CSS, constants, config template"
```

---

## Task 2: storage.js — GitHub Gist (TDD)

**Files:**
- Create: `js/storage.js`
- Create: `tests/harness.js`
- Create: `tests/storage.test.js`
- Create: `tests/index.html`

- [ ] **Step 1: Create `tests/harness.js`**

```js
let passed = 0;
let failed = 0;

export function test(name, fn) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      result
        .then(() => { console.log(`%c✓ ${name}`, 'color:#9fffcc'); passed++; })
        .catch(e => { console.error(`✗ ${name}: ${e.message}`); failed++; });
    } else {
      console.log(`%c✓ ${name}`, 'color:#9fffcc');
      passed++;
    }
  } catch (e) {
    console.error(`✗ ${name}: ${e.message}`);
    failed++;
  }
}

export function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

export function assertEqual(a, b, msg) {
  if (JSON.stringify(a) !== JSON.stringify(b))
    throw new Error(msg || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

export function summary() {
  setTimeout(() => console.log(`\nResults: ${passed} passed, ${failed} failed`), 200);
}
```

- [ ] **Step 2: Create `tests/storage.test.js` — write failing tests with fetch mocked**

```js
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
```

- [ ] **Step 3: Create `tests/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Tests</title>
<style>body{background:#111;color:#eee;font-family:monospace;padding:20px}</style>
</head>
<body>
  <h2>Open DevTools Console to see results</h2>
  <script type="module">
    import './storage.test.js';
    import './calendar.test.js';
    import './mdl.test.js';
  </script>
</body>
</html>
```

- [ ] **Step 4: Reload tests page — expect import error for `storage.js` (not yet created)**

Open `http://localhost:3000/tests/index.html`. Expected: error in console — `storage.js not found`.

- [ ] **Step 5: Create `js/storage.js`**

```js
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
```

- [ ] **Step 6: Run tests — all 6 should pass**

Reload `http://localhost:3000/tests/index.html`. Open DevTools Console. Expected:
```
✓ loadShows returns empty array when gist has []
✓ addShow persists a show and loadShows returns it
✓ addShow appends without overwriting existing shows
✓ updateShow merges patch into matching show
✓ deleteShow removes the show with matching id
✓ saveShows replaces all shows
Results: 6 passed, 0 failed
```

- [ ] **Step 7: Commit**

```bash
git add js/storage.js tests/harness.js tests/storage.test.js tests/index.html
git commit -m "feat: storage module — GitHub Gist CRUD, all tests passing"
```

---

## Task 3: Calendar Grid Rendering

**Files:**
- Create: `js/calendar.js`
- Create: `tests/calendar.test.js`

- [ ] **Step 1: Write failing tests in `tests/calendar.test.js`**

```js
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

test('show appears on airEndDate itself (2024-05-11, Saturday)', () => {
  assertEqual(getShowsForDay(new Date(2024, 4, 11), [show]).length, 1);
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
```

- [ ] **Step 2: Run tests — expect import error for `calendar.js`**

Reload `http://localhost:3000/tests/index.html`. Expected: import error.

- [ ] **Step 3: Create `js/calendar.js`**

```js
import { PLATFORMS, CHIP_COLORS, DAY_DISPLAY, DAY_NAMES } from './constants.js';

// ── Pure logic (testable without DOM) ───────────────────

export function getShowsForDay(date, shows) {
  const dayName = DAY_NAMES[date.getDay()];
  const d = ymd(date);
  return shows.filter(show => {
    if (!show.airStartDate || !show.airEndDate || !show.airDays?.length) return false;
    return d >= ymd(new Date(show.airStartDate))
        && d <= ymd(new Date(show.airEndDate))
        && show.airDays.includes(dayName);
  });
}

function ymd(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatMonthTitle(year, month) {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ── DOM rendering ────────────────────────────────────────

export function renderCalendar(year, month, shows, gridEl, headersEl) {
  renderDayHeaders(headersEl);
  renderGrid(year, month, shows, gridEl);
}

function renderDayHeaders(el) {
  el.innerHTML = DAY_DISPLAY.map(d => `<div class="day-header">${d}</div>`).join('');
}

function renderGrid(year, month, shows, el) {
  el.innerHTML = '';
  const today     = new Date();
  const firstDay  = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const colorMap  = buildColorMap(shows);

  // Monday-based offset
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  for (let i = 0; i < startOffset; i++) {
    const cell = document.createElement('div');
    cell.className = 'cal-cell empty';
    el.appendChild(cell);
  }

  for (let day = 1; day <= totalDays; day++) {
    const date    = new Date(year, month, day);
    const isToday = date.toDateString() === today.toDateString();
    const cell    = document.createElement('div');
    cell.className = 'cal-cell' + (isToday ? ' today' : '');

    const num = document.createElement('div');
    num.className = 'day-num';
    num.textContent = isToday ? `${day} ◉` : day;
    cell.appendChild(num);

    getShowsForDay(date, shows).forEach(show => {
      cell.appendChild(buildChip(show, colorMap));
    });

    el.appendChild(cell);
  }
}

function buildColorMap(shows) {
  const map = {};
  shows.forEach((show, i) => { map[show.id] = i % CHIP_COLORS.length; });
  return map;
}

export function buildChip(show, colorMap) {
  const platform = PLATFORMS[show.platform] || PLATFORMS['Other'];
  const color    = CHIP_COLORS[colorMap?.[show.id] ?? 0];

  const chip = document.createElement('div');
  chip.className = 'show-chip';
  chip.style.background = color.bg;
  chip.style.color = color.text;
  chip.dataset.showId = show.id;

  const badge = document.createElement('div');
  badge.className = 'platform-badge';
  badge.style.background = platform.color;
  badge.style.color = '#fff';
  badge.textContent = platform.badge;

  const title = document.createElement('span');
  title.textContent = show.title;

  chip.appendChild(badge);
  chip.appendChild(title);
  return chip;
}
```

- [ ] **Step 4: Run tests — all 7 calendar tests should pass**

Reload `http://localhost:3000/tests/index.html`. Expected: all calendar tests green.

- [ ] **Step 5: Wire calendar into `app.js`**

Replace `js/app.js`:

```js
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
```

- [ ] **Step 6: Verify in browser**

Open `http://localhost:3000`. Expected: loading bar pulses briefly, current month calendar renders, Prev/Next navigate months. Check the Network tab — should see a GET request to `api.github.com/gists/…` returning 200.

- [ ] **Step 7: Commit**

```bash
git add js/calendar.js js/app.js tests/calendar.test.js
git commit -m "feat: calendar grid with Gist-backed data load and air-day rendering"
```

---

## Task 4: Sidebar — Show Cards + Filter Tabs

**Files:**
- Create: `js/shows.js`
- Modify: `js/app.js`

- [ ] **Step 1: Create `js/shows.js` with sidebar rendering**

```js
import { PLATFORMS, CHIP_COLORS, STATUS_LABELS, PLATFORM_NAMES } from './constants.js';

// ── Helpers ──────────────────────────────────────────────

export function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export function buildColorMap(shows) {
  const map = {};
  shows.forEach((show, i) => { map[show.id] = i % CHIP_COLORS.length; });
  return map;
}

// ── Sidebar ──────────────────────────────────────────────

export function renderSidebar(shows, filter, listEl, tabsEl, onCardClick) {
  renderFilterTabs(tabsEl, filter);
  renderShowList(shows, filter, listEl, onCardClick);
}

function renderFilterTabs(el, activeFilter) {
  const filters = [
    { key: 'all',           label: 'All' },
    { key: 'watching',      label: 'Watching' },
    { key: 'completed',     label: 'Done' },
    { key: 'plan_to_watch', label: 'Plan' },
    { key: 'dropped',       label: 'Dropped' },
  ];
  el.innerHTML = filters
    .map(f => `<div class="filter-tab${activeFilter === f.key ? ' active' : ''}" data-filter="${f.key}">${f.label}</div>`)
    .join('');
}

function renderShowList(shows, filter, el, onCardClick) {
  const filtered = filter === 'all' ? shows : shows.filter(s => s.status === filter);
  if (filtered.length === 0) {
    el.innerHTML = `<p style="color:var(--text-muted);font-size:12px;padding:8px 0">No shows here yet.</p>`;
    return;
  }
  const colorMap = buildColorMap(shows);
  el.innerHTML = '';
  filtered.forEach(show => el.appendChild(buildCard(show, colorMap, onCardClick)));
}

function buildCard(show, colorMap, onCardClick) {
  const platform   = PLATFORMS[show.platform] || PLATFORMS['Other'];
  const pct        = show.totalEpisodes ? Math.round((show.watchedEpisodes / show.totalEpisodes) * 100) : 0;
  const chipColor  = CHIP_COLORS[colorMap[show.id] ?? 0];
  const statusClass = `status-${show.status}`;

  const card = document.createElement('div');
  card.className = 'show-card';
  card.dataset.showId = show.id;
  card.innerHTML = `
    <div class="card-top">
      <div class="platform-badge" style="background:${platform.color};color:#fff;width:18px;height:18px;font-size:9px">${platform.badge}</div>
      <div class="card-title">${escHtml(show.title)}</div>
    </div>
    <div class="card-meta">
      <span class="card-eps">Ep ${show.watchedEpisodes ?? 0} / ${show.totalEpisodes ?? '?'}</span>
      <span class="status-badge ${statusClass}">${STATUS_LABELS[show.status] ?? show.status}</span>
    </div>
    <div class="progress-bar-wrap">
      <div class="progress-bar" style="width:${pct}%;background:${chipColor.text}"></div>
    </div>
  `;
  card.addEventListener('click', () => onCardClick(show));
  return card;
}
```

- [ ] **Step 2: Wire sidebar into `app.js`**

Add import at top of `app.js`:

```js
import { renderSidebar } from './shows.js';
```

Add to `els` in `app.js`:

```js
filterTabs: document.getElementById('filter-tabs'),
showList:   document.getElementById('show-list'),
```

Replace `refresh()` in `app.js`:

```js
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
  console.log('card clicked:', show.title); // placeholder — wired in Task 6
}
```

Add filter tab listener after existing listeners:

```js
els.filterTabs.addEventListener('click', e => {
  const tab = e.target.closest('.filter-tab');
  if (!tab) return;
  state.filter = tab.dataset.filter;
  refresh();
});
```

- [ ] **Step 3: Add sample data via the browser console and verify**

```js
// Paste in DevTools console on http://localhost:3000
// This calls the real Gist API so it persists across devices
const { addShow } = await import('/js/storage.js');
await addShow({ id: crypto.randomUUID(), title: 'Queen of Tears', status: 'watching', watchedEpisodes: 8, totalEpisodes: 16, platform: 'Netflix', airDays: ['Fri','Sat'], airStartDate: '2024-03-23', airEndDate: '2024-05-12' });
await addShow({ id: crypto.randomUUID(), title: 'My Demon', status: 'completed', watchedEpisodes: 16, totalEpisodes: 16, platform: 'Viki', airDays: ['Sat','Sun'], airStartDate: '2023-11-25', airEndDate: '2024-01-21' });
location.reload();
```

Expected: both shows appear in the sidebar with progress bars and status badges. Navigate to Nov 2023 — My Demon chips appear on Saturdays and Sundays. Filter tabs work.

- [ ] **Step 4: Commit**

```bash
git add js/shows.js js/app.js
git commit -m "feat: sidebar show cards with status filter tabs"
```

---

## Task 5: Add / Edit Show Modal

**Files:**
- Modify: `js/shows.js`
- Modify: `js/app.js`

- [ ] **Step 1: Append modal functions to `js/shows.js`**

```js
// ── Modal ─────────────────────────────────────────────────

let _onSave = null;

export function openModal(show = null, onSave) {
  _onSave = onSave;
  document.getElementById('modal-box').innerHTML = buildModalHtml(show);
  document.getElementById('modal-overlay').classList.remove('hidden');
  wireModal(show);
}

export function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

function buildModalHtml(show) {
  const isEdit = !!show;
  const s = show || { status: 'plan_to_watch', airDays: [], watchedEpisodes: 0 };

  const statusOptions = Object.entries(STATUS_LABELS)
    .map(([k, v]) => `<div class="pill${s.status === k ? ' active' : ''}" data-status="${k}">${v}</div>`)
    .join('');

  const platformOptions = PLATFORM_NAMES
    .map(p => `<option value="${p}"${s.platform === p ? ' selected' : ''}>${p}</option>`)
    .join('');

  const dayToggles = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
    .map(d => `<div class="day-toggle${(s.airDays||[]).includes(d) ? ' active' : ''}" data-day="${d}">${d[0]}</div>`)
    .join('');

  return `
    <h2 style="font-size:18px;font-weight:700;color:var(--text);margin-bottom:20px">${isEdit ? 'Edit Show' : 'Add Show'}</h2>

    <div class="section-label">MyDramaList (optional)</div>
    <div class="mdl-row" style="margin-bottom:4px">
      <div class="field">
        <input id="mdl-url-input" type="text" placeholder="https://mydramalist.com/…" value="${escHtml(s.mdlUrl||'')}">
      </div>
      <button id="pull-data-btn" class="btn-pull">Pull Data</button>
    </div>
    <div class="mdl-hint">Paste the MDL URL and click Pull Data to auto-fill fields below.</div>
    <div id="mdl-error" class="mdl-error hidden"></div>

    <hr class="divider">
    <div class="section-label">Show details</div>

    <div class="field">
      <label>Title</label>
      <input id="field-title" type="text" placeholder="Show name" value="${escHtml(s.title||'')}">
    </div>

    <div class="field">
      <label>Status</label>
      <div id="status-pills" class="pill-group">${statusOptions}</div>
    </div>

    <div class="field-row">
      <div class="field">
        <label>Episodes watched</label>
        <input id="field-watched" type="number" min="0" value="${s.watchedEpisodes ?? 0}">
      </div>
      <div class="field">
        <label>Total episodes</label>
        <input id="field-total" type="number" min="0" value="${s.totalEpisodes || ''}">
      </div>
    </div>

    <div class="field">
      <label>Platform</label>
      <select id="field-platform">${platformOptions}</select>
    </div>

    <div class="field-row">
      <div class="field">
        <label>Air start date</label>
        <input id="field-start" type="date" value="${s.airStartDate||''}">
      </div>
      <div class="field">
        <label>Air end date</label>
        <input id="field-end" type="date" value="${s.airEndDate||''}">
      </div>
    </div>

    <div class="field">
      <label>Airs on</label>
      <div id="day-toggles" class="day-toggles">${dayToggles}</div>
    </div>
    <div id="date-error" class="validation-error hidden">End date must be after start date.</div>

    <div class="modal-footer">
      <button id="modal-cancel" class="btn-cancel">Cancel</button>
      <button id="modal-save" class="btn-save">Save Show</button>
    </div>
  `;
}

function wireModal(existingShow) {
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target.id === 'modal-overlay') closeModal();
  });

  document.getElementById('status-pills').addEventListener('click', e => {
    const pill = e.target.closest('.pill');
    if (!pill) return;
    document.querySelectorAll('#status-pills .pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
  });

  document.getElementById('day-toggles').addEventListener('click', e => {
    const t = e.target.closest('.day-toggle');
    if (t) t.classList.toggle('active');
  });

  document.getElementById('pull-data-btn').addEventListener('click', async () => {
    const url   = document.getElementById('mdl-url-input').value.trim();
    const errEl = document.getElementById('mdl-error');
    errEl.classList.add('hidden');
    if (!url) return;
    const btn = document.getElementById('pull-data-btn');
    btn.disabled = true; btn.textContent = 'Pulling…';
    try {
      const { fetchMdlData } = await import('./mdl.js');
      const data = await fetchMdlData(url);
      if (data.title)         document.getElementById('field-title').value   = data.title;
      if (data.totalEpisodes) document.getElementById('field-total').value   = data.totalEpisodes;
    } catch {
      errEl.textContent = "Couldn't reach MDL — fill fields manually.";
      errEl.classList.remove('hidden');
    } finally {
      btn.disabled = false; btn.textContent = 'Pull Data';
    }
  });

  document.getElementById('modal-save').addEventListener('click', () => {
    const start = document.getElementById('field-start').value;
    const end   = document.getElementById('field-end').value;
    const errEl = document.getElementById('date-error');
    if (start && end && end < start) { errEl.classList.remove('hidden'); return; }
    errEl.classList.add('hidden');

    const title = document.getElementById('field-title').value.trim();
    if (!title) {
      document.getElementById('field-title').style.borderColor = '#ff4444';
      return;
    }

    const show = {
      id:              existingShow?.id || crypto.randomUUID(),
      title,
      status:          document.querySelector('#status-pills .pill.active')?.dataset.status || 'plan_to_watch',
      watchedEpisodes: parseInt(document.getElementById('field-watched').value) || 0,
      totalEpisodes:   parseInt(document.getElementById('field-total').value)   || 0,
      platform:        document.getElementById('field-platform').value,
      airDays:         [...document.querySelectorAll('#day-toggles .day-toggle.active')].map(el => el.dataset.day),
      airStartDate:    start,
      airEndDate:      end,
      mdlUrl:          document.getElementById('mdl-url-input').value.trim() || undefined,
      // preserve MDL fields if editing
      ...(existingShow ? {
        synopsis: existingShow.synopsis,
        genres:   existingShow.genres,
        country:  existingShow.country,
        network:  existingShow.network,
        rating:   existingShow.rating,
      } : {}),
    };

    _onSave(show, !!existingShow);
    closeModal();
  });
}
```

- [ ] **Step 2: Wire Add Show button in `app.js`**

Add imports:

```js
import { renderSidebar, openModal, closeModal } from './shows.js';
import { loadShows, addShow, updateShow, deleteShow } from './storage.js';
```

Add to `els`:

```js
addShowBtn: document.getElementById('add-show-btn'),
```

Add listener:

```js
els.addShowBtn.addEventListener('click', () => {
  openModal(null, async (show) => {
    setLoading(true);
    try { await addShow(show); await refresh(); }
    finally { setLoading(false); }
  });
});
```

- [ ] **Step 3: Verify Add Show in browser**

Open `http://localhost:3000`. Click `+ Add Show`. Fill in a show with platform, air days, date range. Click Save. Expected: loading bar appears briefly while saving to Gist, then card appears in sidebar and chips on the calendar. Open the same URL on a different device / browser — the show is there.

- [ ] **Step 4: Commit**

```bash
git add js/shows.js js/app.js
git commit -m "feat: add/edit show modal with Gist persistence"
```

---

## Task 6: Expanded Show Panel + Episode Stepper

**Files:**
- Modify: `js/shows.js`
- Modify: `js/app.js`

- [ ] **Step 1: Append panel functions to `js/shows.js`**

```js
// ── Expanded Panel ────────────────────────────────────────

export function openPanel(show, onUpdate, onEdit, onDelete) {
  document.getElementById('panel-box').innerHTML = buildPanelHtml(show);
  document.getElementById('panel-overlay').classList.remove('hidden');
  wirePanel(show, onUpdate, onEdit, onDelete);
}

export function closePanel() {
  document.getElementById('panel-overlay').classList.add('hidden');
}

function buildPanelHtml(show) {
  const platform    = PLATFORMS[show.platform] || PLATFORMS['Other'];
  const pct         = show.totalEpisodes ? Math.round((show.watchedEpisodes / show.totalEpisodes) * 100) : 0;
  const statusClass = `status-${show.status}`;
  const meta        = [show.country, show.network, show.airStartDate?.slice(0,4)].filter(Boolean).join(' · ');

  const detailsHtml = (show.synopsis || show.rating || show.genres?.length) ? `
    <div class="panel-section">
      <div class="section-label">Details (from MyDramaList)</div>
      <div class="info-grid" style="margin-bottom:10px">
        ${show.rating  ? `<div class="info-item"><label>Rating</label><span>⭐ ${show.rating}</span></div>` : ''}
        ${show.country ? `<div class="info-item"><label>Country</label><span>${escHtml(show.country)}</span></div>` : ''}
        ${show.network ? `<div class="info-item"><label>Network</label><span>${escHtml(show.network)}</span></div>` : ''}
      </div>
      ${show.genres?.length ? `<div style="margin-bottom:10px">${show.genres.map(g=>`<span class="tag">${escHtml(g)}</span>`).join('')}</div>` : ''}
      ${show.synopsis ? `<div style="font-size:12px;color:var(--text-muted);line-height:1.6">${escHtml(show.synopsis)}</div>` : ''}
    </div>` : '';

  const mdlHtml = show.mdlUrl
    ? `<div class="panel-section">
        <div class="section-label">MyDramaList</div>
        <div style="display:flex;gap:8px;align-items:center">
          <a class="mdl-link" href="${escHtml(show.mdlUrl)}" target="_blank" rel="noopener">${escHtml(show.mdlUrl)}</a>
          <button id="refresh-mdl-btn" class="btn-refresh">↻ Refresh</button>
        </div>
        <div id="mdl-panel-error" class="mdl-error hidden"></div>
       </div>`
    : `<div class="panel-section">
        <div class="section-label">MyDramaList</div>
        <div class="mdl-prompt">
          <p>Add an MDL link to pull ratings, synopsis, and genres.</p>
          <button id="add-mdl-btn" class="btn-refresh">+ Add MDL Link</button>
        </div>
       </div>`;

  return `
    <div class="panel-header">
      <div class="poster-placeholder">🎬</div>
      <div class="panel-meta">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          <div class="platform-badge" style="background:${platform.color};color:#fff;width:18px;height:18px;font-size:9px">${platform.badge}</div>
          <div class="panel-title">${escHtml(show.title)}</div>
        </div>
        <div class="panel-sub">${meta || 'No extra details yet'}</div>
        <span class="status-badge ${statusClass}">${STATUS_LABELS[show.status] ?? show.status}</span>
        <div class="panel-actions">
          <button id="panel-edit-btn" class="btn-edit">Edit</button>
          <button id="panel-delete-btn" class="btn-delete">Delete</button>
        </div>
      </div>
      <button id="panel-close-btn" class="btn-close">✕</button>
    </div>

    <div class="panel-section">
      <div class="section-label">Progress</div>
      <div class="ep-bar-wrap"><div class="ep-bar" id="ep-bar" style="width:${pct}%"></div></div>
      <div class="ep-controls">
        <button class="ep-btn" id="ep-dec">−</button>
        <span class="ep-label" id="ep-label">Episode ${show.watchedEpisodes ?? 0} / ${show.totalEpisodes ?? '?'}</span>
        <button class="ep-btn" id="ep-inc">+</button>
      </div>
    </div>

    <div class="panel-section">
      <div class="section-label">Air Schedule</div>
      <div class="info-grid">
        <div class="info-item"><label>Airs on</label><span>${show.airDays?.join(' · ') || '—'}</span></div>
        <div class="info-item"><label>Platform</label><span>${show.platform || '—'}</span></div>
        <div class="info-item"><label>Start date</label><span>${show.airStartDate || '—'}</span></div>
        <div class="info-item"><label>End date</label><span>${show.airEndDate || '—'}</span></div>
      </div>
    </div>

    ${detailsHtml}
    ${mdlHtml}
  `;
}

function wirePanel(show, onUpdate, onEdit, onDelete) {
  const watched = { current: show.watchedEpisodes ?? 0 };

  document.getElementById('panel-close-btn').addEventListener('click', closePanel);
  document.getElementById('panel-overlay').addEventListener('click', e => {
    if (e.target.id === 'panel-overlay') closePanel();
  });

  document.getElementById('panel-edit-btn').addEventListener('click', () => {
    closePanel();
    onEdit(show);
  });

  document.getElementById('panel-delete-btn').addEventListener('click', () => {
    if (confirm(`Delete "${show.title}"?`)) { onDelete(show.id); closePanel(); }
  });

  function updateEp() {
    document.getElementById('ep-label').textContent = `Episode ${watched.current} / ${show.totalEpisodes ?? '?'}`;
    const pct = show.totalEpisodes ? Math.round((watched.current / show.totalEpisodes) * 100) : 0;
    document.getElementById('ep-bar').style.width = pct + '%';
    onUpdate(show.id, { watchedEpisodes: watched.current });
  }

  document.getElementById('ep-inc').addEventListener('click', () => {
    if (!show.totalEpisodes || watched.current < show.totalEpisodes) { watched.current++; updateEp(); }
  });
  document.getElementById('ep-dec').addEventListener('click', () => {
    if (watched.current > 0) { watched.current--; updateEp(); }
  });

  const refreshBtn = document.getElementById('refresh-mdl-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      const errEl = document.getElementById('mdl-panel-error');
      errEl.classList.add('hidden');
      refreshBtn.disabled = true; refreshBtn.textContent = '↻ Refreshing…';
      try {
        const { fetchMdlData } = await import('./mdl.js');
        const data = await fetchMdlData(show.mdlUrl);
        await onUpdate(show.id, data);
        closePanel();
      } catch {
        errEl.textContent = "Couldn't reach MDL — try again later.";
        errEl.classList.remove('hidden');
      } finally {
        refreshBtn.disabled = false; refreshBtn.textContent = '↻ Refresh';
      }
    });
  }

  const addMdlBtn = document.getElementById('add-mdl-btn');
  if (addMdlBtn) addMdlBtn.addEventListener('click', () => { closePanel(); onEdit(show); });
}
```

- [ ] **Step 2: Wire panel into `app.js`**

Update shows.js import to include panel functions:

```js
import { renderSidebar, openModal, closeModal, openPanel, closePanel } from './shows.js';
```

Replace `onCardClick` stub:

```js
function onCardClick(show) {
  openPanel(
    show,
    async (id, patch) => { await updateShow(id, patch); await refresh(); },
    (show) => openModal(show, async (updated) => { await updateShow(updated.id, updated); await refresh(); }),
    async (id) => { await deleteShow(id); await refresh(); }
  );
}
```

- [ ] **Step 3: Verify in browser**

Click a show card. Expected: panel slides in from the right. `+`/`−` update the progress bar instantly and save to Gist (check Network tab). Edit opens the pre-filled modal. Delete asks for confirmation, removes the show, closes panel.

- [ ] **Step 4: Commit**

```bash
git add js/shows.js js/app.js
git commit -m "feat: expanded show panel with episode stepper, edit, delete"
```

---

## Task 7: MDL API Integration

**Files:**
- Create: `js/mdl.js`
- Create: `tests/mdl.test.js`

- [ ] **Step 1: Check the API docs**

Open `https://my-drama-list-api-ten.vercel.app/static/index.html` in the browser. Note:
- The exact endpoint path for looking up a show by slug
- The JSON response field names (title, episodes/episode_count, synopsis/description, genres, country, network, rating)

Update the field mapping in Step 4 if the actual names differ from those assumed below.

- [ ] **Step 2: Write failing tests in `tests/mdl.test.js`**

```js
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
  const raw = { title: 'Queen of Tears', episodes: 16, synopsis: 'A story.', genres: ['Romance'], country: 'South Korea', network: 'tvN', rating: 8.8 };
  const m = mapMdlResponse(raw);
  assertEqual(m.title, 'Queen of Tears');
  assertEqual(m.totalEpisodes, 16);
  assertEqual(m.synopsis, 'A story.');
  assertEqual(m.genres[0], 'Romance');
  assertEqual(m.country, 'South Korea');
  assertEqual(m.network, 'tvN');
  assertEqual(m.rating, 8.8);
});

test('mapMdlResponse handles missing fields gracefully', () => {
  const m = mapMdlResponse({});
  assert(m.title === undefined, 'title should be undefined');
  assert(m.totalEpisodes === undefined, 'episodes should be undefined');
});

summary();
```

- [ ] **Step 3: Run tests — expect import error for `mdl.js`**

Reload `http://localhost:3000/tests/index.html`. Expected: import error.

- [ ] **Step 4: Create `js/mdl.js`**

```js
const MDL_API_BASE = 'https://my-drama-list-api-ten.vercel.app';

export function extractSlug(mdlUrl) {
  try {
    return new URL(mdlUrl).pathname.replace(/^\/|\/$/g, '') || null;
  } catch {
    return null;
  }
}

export function mapMdlResponse(raw) {
  // Adapt field names here if the real API differs from docs
  const m = {};
  if (raw.title       !== undefined) m.title         = raw.title;
  if (raw.episodes    !== undefined) m.totalEpisodes  = raw.episodes;
  if (raw.synopsis    !== undefined) m.synopsis       = raw.synopsis;
  if (raw.description !== undefined && m.synopsis === undefined) m.synopsis = raw.description;
  if (raw.genres      !== undefined) m.genres         = raw.genres;
  if (raw.country     !== undefined) m.country        = raw.country;
  if (raw.network     !== undefined) m.network        = raw.network;
  if (raw.rating      !== undefined) m.rating         = raw.rating;
  return m;
}

export async function fetchMdlData(mdlUrl) {
  const slug = extractSlug(mdlUrl);
  if (!slug) throw new Error('Invalid MDL URL');
  // Adapt endpoint path after checking the API docs in Step 1
  const res = await fetch(`${MDL_API_BASE}/api/show/${slug}`);
  if (!res.ok) throw new Error(`MDL API returned ${res.status}`);
  return mapMdlResponse(await res.json());
}
```

- [ ] **Step 5: Run all tests — all should pass**

Reload `http://localhost:3000/tests/index.html`. Expected:
```
✓ extractSlug pulls slug from standard MDL URL
✓ extractSlug strips trailing slash
✓ extractSlug returns null for invalid URL
✓ mapMdlResponse maps all expected fields
✓ mapMdlResponse handles missing fields gracefully
Results: 5 passed, 0 failed  (+ all storage + calendar tests)
```

- [ ] **Step 6: Manual test — Pull Data**

Open `http://localhost:3000`, click `+ Add Show`, paste a real MDL URL, click "Pull Data". Expected: title and episode count auto-fill. If you get a CORS error in the console, enable a CORS browser extension (e.g. "CORS Unblock") for testing, and note it in the README.

- [ ] **Step 7: Commit**

```bash
git add js/mdl.js tests/mdl.test.js
git commit -m "feat: MDL API integration — fetch, slug extraction, field mapping"
```

---

## Task 8: Sidebar Toggle

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Wire the sidebar toggle in `app.js`**

Add to `els`:

```js
sidebarToggle: document.getElementById('sidebar-toggle'),
```

Add listener after existing ones:

```js
els.sidebarToggle.addEventListener('click', () => {
  state.sidebarOpen = !state.sidebarOpen;
  els.main.classList.toggle('sidebar-open', state.sidebarOpen);
  els.sidebarToggle.classList.toggle('active', state.sidebarOpen);
});
```

Set initial state at the bottom of `app.js` before `refresh()`:

```js
els.main.classList.toggle('sidebar-open', state.sidebarOpen);
els.sidebarToggle.classList.toggle('active', state.sidebarOpen);
```

- [ ] **Step 2: Verify in browser**

Click `☰ My Shows`. Expected: sidebar hides, calendar expands full-width, button gets a purple tint. Click again — sidebar returns. Month navigation works in both states.

- [ ] **Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat: sidebar collapse/expand toggle"
```

---

## Task 9: Full Integration Check

- [ ] **Step 1: Walk through the full user journey**

1. Open `http://localhost:3000` — calendar renders current month, loading bar visible briefly
2. Click `+ Add Show` — modal opens with all fields
3. Add a show with air days and date range — Save — card in sidebar, chips on calendar
4. Open the same URL on a second device / browser — the show is already there (Gist sync)
5. Click the card — expanded panel opens
6. Click `+`/`−` — progress updates live, saves to Gist
7. Click Edit — modal pre-filled — change something — Save — panel/sidebar/calendar all update
8. Paste an MDL URL in the modal and click "Pull Data" — fields auto-fill
9. In the expanded panel, click `↻ Refresh` — MDL data refreshes
10. Click Delete — confirm — show removed from Gist and all views
11. Toggle `☰ My Shows` — sidebar collapses, calendar expands
12. Navigate Prev/Next — chips follow air dates across months
13. Filter tabs — sidebar list filters, calendar unaffected

- [ ] **Step 2: Verify date validation**

Open Add Show, set end date before start date, click Save. Expected: red error message, show not saved.

- [ ] **Step 3: Verify empty state**

Switch to a filter tab with no matching shows. Expected: "No shows here yet." message.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: series tracker complete — all features integrated"
```

---

## Running the App

```bash
cd /Users/valeryanasikan/series-tracker
npx serve .
# Open http://localhost:3000
```

## Running Tests

```bash
npx serve .
# Open http://localhost:3000/tests/index.html — check DevTools Console
```

## Sharing Between Devices

The Gist stores all data. Any device that has the `js/config.js` file with the correct `GIST_ID` and `GITHUB_TOKEN` will see and modify the same show list. Keep `config.js` out of any public repository.
