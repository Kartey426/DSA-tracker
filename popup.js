import { getAllProblems, addProblem, updateProblem, deleteProblem } from './lib/storage.js';
import { createProblem, markSolved, markRevision, markUnsolved, timeAgo, formatDateTime } from './lib/problems.js';
import { detectPlatform } from './lib/platforms.js';
import { exportToXLSX, exportToJSON, importFromJSON } from './lib/export.js';
import { computeStats } from './lib/stats.js';

let allProblems = [];
let activeFilter = 'all';
let searchQuery = '';
let sortAsc = false;
let expandedId = null;

// ── Boot ──────────────────────────────────────────────────────────────────────
async function init() {
  allProblems = await getAllProblems();
  await tryAutofill();
  render();
  bindEvents();
}

// ── Auto-fill from current tab ────────────────────────────────────────────────
async function tryAutofill() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['dsa_current_page'], (result) => {
      const page = result.dsa_current_page;

      if (!page) return resolve();

      if (Date.now() - page.timestamp > 10000)
        return resolve();

      const card = document.getElementById(
        'detected-problem'
      );

      if (!card) return resolve();

      card.style.display = 'block';

      document.getElementById(
        'detected-title'
      ).textContent = page.title || '';

      document.getElementById(
        'detected-difficulty'
      ).textContent = page.difficulty
        ? `Difficulty: ${page.difficulty}`
        : '';

      document.getElementById(
        'detected-topics'
      ).textContent =
        page.topics?.length
          ? page.topics.join(' • ')
          : '';

      resolve();
    });
  });
}

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
  renderStats();
  renderList();
}

function renderStats() {
  const stats = computeStats(allProblems);
  document.getElementById('stat-total').textContent = stats.total;
  document.getElementById('stat-solved').textContent = stats.solved;
  document.getElementById('stat-revision').textContent = stats.revision;
  document.getElementById('stat-streak').textContent = stats.streak;
}

function renderList() {
  let filtered = allProblems.filter((p) => {
    if (activeFilter === 'solved')   return p.status === 'solved';
    if (activeFilter === 'revision') return p.status === 'revision';
    if (activeFilter === 'unsolved') return p.status === 'unsolved';
    if (activeFilter === 'easy')     return p.difficulty === 'easy';
    if (activeFilter === 'medium')   return p.difficulty === 'medium';
    if (activeFilter === 'hard')     return p.difficulty === 'hard';
    return true;
  });

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.topics || []).some((t) => t.toLowerCase().includes(q)) ||
        (p.notes || '').toLowerCase().includes(q)
    );
  }

  filtered = [...filtered].sort((a, b) =>
    sortAsc ? a.createdAt - b.createdAt : b.createdAt - a.createdAt
  );

  const list = document.getElementById('problems-list');

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div>${
      searchQuery ? 'No problems match your search.' : 'No problems yet.<br/>Add one below or visit a problem page.'
    }</div>`;
    return;
  }

  list.innerHTML = filtered.map((p) => renderRow(p)).join('');

  // Restore expanded state
  if (expandedId) {
    const panel = document.getElementById(`panel-${expandedId}`);
    if (panel) panel.classList.add('open');
  }

  // Bind row events
  filtered.forEach((p) => {
    document.getElementById(`row-${p.id}`)?.addEventListener('click', (e) => {
      if (e.target.closest('.mini-btn')) return;
      toggleExpand(p.id);
    });
    document.getElementById(`btn-solve-${p.id}`)?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSolved(p.id);
    });
    document.getElementById(`btn-rev-${p.id}`)?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleRevision(p.id);
    });
    document.getElementById(`save-note-${p.id}`)?.addEventListener('click', () => saveNote(p.id));
    document.getElementById(`delete-${p.id}`)?.addEventListener('click', () => deleteProblemById(p.id));
    const link = document.getElementById(`open-link-${p.id}`);
    if (link) link.addEventListener('click', (e) => { e.stopPropagation(); });
  });
}

function renderRow(p) {
  const dotClass = p.status === 'solved' ? 'dot-solved' : p.status === 'revision' ? 'dot-revision' : 'dot-unsolved';
  const diffClass = `diff-${p.difficulty || 'medium'}`;
  const topicTags = (p.topics || []).slice(0, 2).map((t) => `<span class="topic-tag">${t}</span>`).join('');
  const solvedActive = p.status === 'solved' ? 'solved-active' : '';
  const revActive   = p.status === 'revision' ? 'rev-active' : '';
  const linkBtn = p.url
    ? `<a id="open-link-${p.id}" class="open-link-btn" href="${p.url}" target="_blank">↗ Open</a>`
    : '';

  return `
    <div class="problem-row" id="row-${p.id}">
      <div class="status-dot ${dotClass}"></div>
      <div class="prob-main">
        <div class="prob-name" title="${p.name}">${p.name}</div>
        <div class="prob-meta">
          <span class="diff-badge ${diffClass}">${p.difficulty || 'medium'}</span>
          ${topicTags}
          <span class="prob-time">${timeAgo(p.createdAt)}</span>
        </div>
      </div>
      <div class="prob-actions">
        <button class="mini-btn ${solvedActive}" id="btn-solve-${p.id}" title="Mark solved">✓</button>
        <button class="mini-btn ${revActive}" id="btn-rev-${p.id}" title="Mark for revision">🔖</button>
      </div>
    </div>
    <div class="note-panel" id="panel-${p.id}">
      <textarea class="note-textarea" id="note-${p.id}" placeholder="Notes, approach, time/space complexity…">${p.notes || ''}</textarea>
      <div class="note-actions">
        <button class="note-save-btn" id="save-note-${p.id}">Save note</button>
        ${linkBtn}
        <span style="font-size:10px;color:#aaa;margin-left:4px;">${p.solvedAt ? 'Solved ' + formatDateTime(p.solvedAt) : ''}</span>
        <button class="delete-btn" id="delete-${p.id}">Delete</button>
      </div>
    </div>`;
}

// ── Actions ───────────────────────────────────────────────────────────────────
function toggleExpand(id) {
  const panel = document.getElementById(`panel-${id}`);
  if (!panel) return;
  if (expandedId && expandedId !== id) {
    document.getElementById(`panel-${expandedId}`)?.classList.remove('open');
  }
  const opening = !panel.classList.contains('open');
  panel.classList.toggle('open');
  expandedId = opening ? id : null;
}

async function toggleSolved(id) {
  const p = allProblems.find((x) => x.id === id);
  if (!p) return;
  const updated = p.status === 'solved' ? markUnsolved(p) : markSolved(p);
  allProblems = await updateProblem(id, updated);
  toast(updated.status === 'solved' ? '✓ Marked as solved' : 'Marked as unsolved');
  render();
}

async function toggleRevision(id) {
  const p = allProblems.find((x) => x.id === id);
  if (!p) return;
  let updated;
  if (p.status === 'revision') {
    updated = { ...p, status: 'solved', nextRevisionDue: null };
  } else {
    updated = markRevision(p);
  }
  allProblems = await updateProblem(id, updated);
  toast(updated.status === 'revision' ? '🔖 Added to revision' : 'Removed from revision');
  render();
}

async function saveNote(id) {
  const textarea = document.getElementById(`note-${id}`);
  if (!textarea) return;
  allProblems = await updateProblem(id, { notes: textarea.value });
  toast('Note saved');
}

async function deleteProblemById(id) {
  if (!confirm('Delete this problem?')) return;
  allProblems = await deleteProblem(id);
  expandedId = null;
  toast('Problem deleted');
  render();
}

async function handleAdd() {
  const nameInput = document.getElementById('add-name');
  const raw = nameInput.value.trim();
  if (!raw) return;

  let name = raw;
  let url  = '';
  let platform = 'other';

  // If it looks like a URL, detect platform
  if (raw.startsWith('http')) {
    url = raw;
    const detected = detectPlatform(raw, raw);
    name = detected.name;
    platform = detected.platform;
  }

  const difficulty = document.getElementById('add-difficulty').value;
  const topicEl    = document.getElementById('add-topic');
  const topics     = topicEl.value ? [topicEl.value] : [];

  const problem = createProblem({ name, url, difficulty, topics, platform });
  allProblems = await addProblem(problem);

  nameInput.value = '';
  topicEl.value = '';
  document.getElementById('autofill-hint').textContent = '';
  toast('Problem added');
  render();
}
async function handleDetectedAdd() {
  const result = await chrome.storage.local.get([
    'dsa_current_page',
  ]);

  const page = result.dsa_current_page;

  if (!page || !page.title) {
    toast('No detected problem');
    return;
  }

  const duplicate = allProblems.find(
    (p) => p.url && p.url === page.url
  );

  if (duplicate) {
    toast('Already tracked');
    return;
  }

  const problem = createProblem({
    name: page.title,
    url: page.url,
    difficulty: page.difficulty || 'medium',
    topics: page.topics || [],
    platform: page.platform || 'other',
  });

  allProblems = await addProblem(problem);

  toast('✓ Problem added');

  render();
}
// ── Bind global events ────────────────────────────────────────────────────────
function bindEvents() {
  const detectedBtn =
  document.getElementById(
    'add-detected-btn'
  );

if (detectedBtn) {
  detectedBtn.addEventListener(
    'click',
    handleDetectedAdd
  );
}
  // Search
  document.getElementById('search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderList();
  });

  // Sort toggle
  document.getElementById('btn-sort').addEventListener('click', () => {
    sortAsc = !sortAsc;
    document.getElementById('btn-sort').textContent = sortAsc ? '↑' : '↓';
    renderList();
  });

  // Filter chips
  document.getElementById('filter-chips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    activeFilter = chip.dataset.filter;
    renderList();
  });

  // Add problem
  document.getElementById('btn-add').addEventListener('click', handleAdd);
  document.getElementById('add-name').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAdd();
  });

  // Export
  document.getElementById('btn-export-xlsx').addEventListener('click', () => {
    exportToXLSX(allProblems);
    toast('⬇ Exported to Excel (CSV)');
  });
  document.getElementById('btn-export-json').addEventListener('click', () => {
    exportToJSON(allProblems);
    toast('⬇ JSON backup downloaded');
  });

  // Import
  document.getElementById('import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const imported = await importFromJSON(file);
      // Merge: add only problems not already tracked (by name)
      const existingNames = new Set(allProblems.map((p) => p.name.toLowerCase()));
      const newOnes = imported.filter((p) => !existingNames.has(p.name.toLowerCase()));
      for (const p of newOnes) await addProblem(p);
      allProblems = await getAllProblems();
      render();
      toast(`✓ Imported ${newOnes.length} problems`);
    } catch {
      toast('❌ Import failed — check file format');
    }
    e.target.value = '';
  });

  // Stats / Settings pages
  document.getElementById('btn-stats').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('pages/stats.html') });
  });
  document.getElementById('btn-settings').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('pages/settings.html') });
  });
}

// ── Toast ─────────────────────────────────────────────────────────────────────
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2000);
}

// ── Start ─────────────────────────────────────────────────────────────────────
init();