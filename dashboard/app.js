const state = {
  questions: [],
  filtered: [],
  stats: null,
  updatedAt: "",
  selectedId: null,
  unitStatus: {},
  unitIndex: { units: [], map: new Map() },
  notesOpen: false,
  notesHubOpen: false,
  openUnits: new Set(),
  sheetId: "",
  sheetList: [],
  lastRenderedSheetId: "",
};

const elements = {
  searchInput: document.getElementById("searchInput"),
  stepFilter: document.getElementById("stepFilter"),
  chapterFilter: document.getElementById("chapterFilter"),
  statusFilter: document.getElementById("statusFilter"),
  difficultyFilter: document.getElementById("difficultyFilter"),
  starFilter: document.getElementById("starFilter"),
  resultCount: document.getElementById("resultCount"),
  lastSync: document.getElementById("lastSync"),
  panelCount: document.getElementById("panelCount"),
  questionList: document.getElementById("questionList"),
  unitList: document.getElementById("unitList"),
  listProgressBar: document.getElementById("listProgressBar"),
  panelTitle: document.getElementById("panelTitle"),
  panelSubtitle: document.getElementById("panelSubtitle"),
  detailStep: document.getElementById("detailStep"),
  detailTitle: document.getElementById("detailTitle"),
  detailSr: document.getElementById("detailSr"),
  detailNotes: document.getElementById("detailNotes"),
  saveNoteBtn: document.getElementById("saveNoteBtn"),
  detailDoneAt: document.getElementById("detailDoneAt"),
  detailDifficulty: document.getElementById("detailDifficulty"),
  notesModal: document.getElementById("notesModal"),
  notesBackdrop: document.getElementById("notesBackdrop"),
  closeNotesBtn: document.getElementById("closeNotesBtn"),
  notesHubBtn: document.getElementById("notesHubBtn"),
  notesHubModal: document.getElementById("notesHubModal"),
  notesHubBackdrop: document.getElementById("notesHubBackdrop"),
  closeNotesHubBtn: document.getElementById("closeNotesHubBtn"),
  notesHubList: document.getElementById("notesHubList"),
  notesHubSearch: document.getElementById("notesHubSearch"),
  notesHubCount: document.getElementById("notesHubCount"),
  syncBtn: document.getElementById("syncBtn"),
  randomBtn: document.getElementById("randomBtn"),
  adminBtn: document.getElementById("adminBtn"),
  importBtn: document.getElementById("importBtn"),
  exportBtn: document.getElementById("exportBtn"),
  importModal: document.getElementById("importModal"),
  importBackdrop: document.getElementById("importBackdrop"),
  closeImportBtn: document.getElementById("closeImportBtn"),
  importSheetSelect: document.getElementById("importSheetSelect"),
  importSheetNameWrap: document.getElementById("importSheetNameWrap"),
  importSheetName: document.getElementById("importSheetName"),
  importFile: document.getElementById("importFile"),
  importDelimiter: document.getElementById("importDelimiter"),
  importHeaderMode: document.getElementById("importHeaderMode"),
  importSubmitBtn: document.getElementById("importSubmitBtn"),
  importStatus: document.getElementById("importStatus"),
  exportModal: document.getElementById("exportModal"),
  exportBackdrop: document.getElementById("exportBackdrop"),
  closeExportBtn: document.getElementById("closeExportBtn"),
  exportSheetSelect: document.getElementById("exportSheetSelect"),
  exportCsvSubmit: document.getElementById("exportCsvSubmit"),
  exportJsonSubmit: document.getElementById("exportJsonSubmit"),
  sheetTabs: document.getElementById("sheetTabs"),
  settingsBtn: document.getElementById("settingsBtn"),
  settingsPanel: document.getElementById("settingsPanel"),
  toggleCompact: document.getElementById("toggleCompact"),
  toggleUnits: document.getElementById("toggleUnits"),
  toggleNotes: document.getElementById("toggleNotes"),
  toggleDifficulty: document.getElementById("toggleDifficulty"),
  toggleProgress: document.getElementById("toggleProgress"),
  toggleSr: document.getElementById("toggleSr"),
  toggleZebra: document.getElementById("toggleZebra"),
  unitFilterLabel: document.getElementById("unitFilterLabel"),
  chapterFilterLabel: document.getElementById("chapterFilterLabel"),
  difficultyFilterLabel: document.getElementById("difficultyFilterLabel"),
  activeFilterCount: document.getElementById("activeFilterCount"),
  clearFiltersBtn: document.getElementById("clearFiltersBtn"),
};

const defaultSettings = {
  compact: false,
  showUnits: true,
  showNotesColumn: true,
  showProgress: true,
  showSr: true,
  showDifficulty: true,
  zebra: false,
  header: {
    showSync: true,
    showRandom: true,
    showImport: true,
    showExport: true,
    showSettings: true,
    showAdmin: true,
    showSheets: true,
    showSearch: true,
    showFilters: true,
    showLastSync: true,
  },
  theme: {
    accent: "",
    accentWarm: "",
    surface: "",
    background: "",
  },
  linkFallback: {
    enabled: false,
    leetcode: false,
    youtube: false,
    web: false,
    includeDifficulty: false,
    leetcodeSuffix: "leetcode",
    youtubeSuffix: "dsa leetcode",
    webSuffix: "dsa",
  },
  labels: {
    item: "Question",
    unit: "Unit",
    chapter: "Chapter",
  },
};

let uiSettings = loadSettings();
applySettings();

const SHEET_STORAGE_KEY = "a2z_sheet";
const SHEET_LIST_KEY = "a2z_sheet_list";
const VIEW_STATE_KEY = "a2z_view_state_v1";
const VIEW_STATE_DEFAULT = {
  openUnits: [],
  scrollY: 0,
  filters: {
    unit: "all",
    chapter: "all",
    status: "all",
    difficulty: "all",
    star: "all",
    query: "",
  },
};
const DEFAULT_SHEETS = [
  { id: "striver", label: "Sample: Striver" },
  { id: "algomaster", label: "Sample: AlgoMaster" },
];

function slugifySheet(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function loadSheetList() {
  try {
    const raw = localStorage.getItem(SHEET_LIST_KEY);
    if (!raw) return [...DEFAULT_SHEETS];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...DEFAULT_SHEETS];
    const byId = new Map(parsed.map((item) => [item.id, item]));
    DEFAULT_SHEETS.forEach((sheet) => {
      if (!byId.has(sheet.id)) byId.set(sheet.id, sheet);
    });
    return Array.from(byId.values());
  } catch (error) {
    return [...DEFAULT_SHEETS];
  }
}

function saveSheetList(list) {
  localStorage.setItem(SHEET_LIST_KEY, JSON.stringify(list));
}

function loadViewStateStore() {
  try {
    const raw = localStorage.getItem(VIEW_STATE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function loadViewState(sheetId) {
  if (!sheetId) return { ...VIEW_STATE_DEFAULT };
  const store = loadViewStateStore();
  const entry = store[sheetId];
  if (!entry || typeof entry !== "object") return { ...VIEW_STATE_DEFAULT };
  return {
    ...VIEW_STATE_DEFAULT,
    ...entry,
    filters: {
      ...VIEW_STATE_DEFAULT.filters,
      ...(entry.filters || {}),
    },
  };
}

function saveViewState(sheetId, patch) {
  if (!sheetId) return;
  const store = loadViewStateStore();
  const current = loadViewState(sheetId);
  const next = {
    ...current,
    ...(patch || {}),
    filters: {
      ...current.filters,
      ...((patch && patch.filters) || {}),
    },
  };
  store[sheetId] = next;
  localStorage.setItem(VIEW_STATE_KEY, JSON.stringify(store));
}

async function fetchSheetList() {
  try {
    const response = await fetch("/api/sheets");
    if (!response.ok) {
      return loadSheetList();
    }
    const data = await response.json();
    const sheets = Array.isArray(data.sheets) ? data.sheets : [];
    const list = sheets.map((sheet) => ({
      id: sheet.id,
      label: sheet.label || sheet.id,
    }));
    saveSheetList(list);
    return list.length ? list : loadSheetList();
  } catch (error) {
    return loadSheetList();
  }
}

function getSheetLabel(sheetId) {
  const sheet = state.sheetList.find((item) => item.id === sheetId);
  return sheet ? sheet.label : sheetId;
}

function ensureSheet(sheetId, label) {
  const id = slugifySheet(sheetId || "");
  if (!id) return null;
  const existing = state.sheetList.find((item) => item.id === id);
  if (!existing) {
    state.sheetList.push({ id, label: label || sheetId || id });
    saveSheetList(state.sheetList);
    renderSheetTabs();
  } else if (label && label.trim() && existing.label !== label) {
    existing.label = label;
    saveSheetList(state.sheetList);
    renderSheetTabs();
  }
  return id;
}

function getDefaultSheetId() {
  return state.sheetList.length ? state.sheetList[0].id : "striver";
}

function loadActiveSheet() {
  const params = new URLSearchParams(window.location.search);
  const urlSheet = params.get("sheet");
  if (urlSheet) {
    return slugifySheet(urlSheet);
  }
  const saved = localStorage.getItem(SHEET_STORAGE_KEY);
  return saved || getDefaultSheetId();
}

function renderSheetTabs() {
  if (!elements.sheetTabs) return;
  elements.sheetTabs.innerHTML = "";
  state.sheetList.forEach((sheet) => {
    const button = document.createElement("button");
    button.className = "sheet-tab" + (sheet.id === state.sheetId ? " active" : "");
    button.type = "button";
    button.dataset.sheet = sheet.id;
    button.textContent = sheet.label;
    button.addEventListener("click", () => setActiveSheet(sheet.id));
    elements.sheetTabs.appendChild(button);
  });
}

async function createSheet(name) {
  const response = await fetch("/api/sheets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    return null;
  }
  const entry = await response.json();
  if (!entry || !entry.id) {
    return null;
  }
  const existing = state.sheetList.find((item) => item.id === entry.id);
  if (!existing) {
    state.sheetList.push({ id: entry.id, label: entry.label || entry.id });
  } else if (entry.label) {
    existing.label = entry.label;
  }
  saveSheetList(state.sheetList);
  renderSheetTabs();
  return entry;
}

function setActiveSheet(sheetId, options = {}) {
  if (!sheetId) return;
  const normalized = slugifySheet(sheetId);
  if (!normalized) return;
  sheetId = normalized;
  if (state.sheetId && state.sheetId !== sheetId) {
    persistCurrentViewState();
  }
  ensureSheet(sheetId);
  const viewState = loadViewState(sheetId);
  state.openUnits = new Set(viewState.openUnits || []);
  if (state.notesOpen) {
    closeNotes();
  }
  state.sheetId = sheetId;
  localStorage.setItem(SHEET_STORAGE_KEY, sheetId);
  renderSheetTabs();
  if (!options.keepFilters) {
    elements.stepFilter.value = "all";
    elements.chapterFilter.value = "all";
  }
  fetchQuestions();
}

function withSheet(url, sheetIdOverride) {
  const sheetId = sheetIdOverride || state.sheetId;
  if (!sheetId) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}sheet=${encodeURIComponent(sheetId)}`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function loadSettings() {
  try {
    const raw = localStorage.getItem("a2z_settings");
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw);
    if (parsed.showNotes !== undefined && parsed.showNotesColumn === undefined) {
      parsed.showNotesColumn = parsed.showNotes;
    }
    return {
      ...defaultSettings,
      ...parsed,
      header: { ...defaultSettings.header, ...(parsed.header || {}) },
      theme: { ...defaultSettings.theme, ...(parsed.theme || {}) },
      linkFallback: { ...defaultSettings.linkFallback, ...(parsed.linkFallback || {}) },
      labels: { ...defaultSettings.labels, ...(parsed.labels || {}) },
    };
  } catch (error) {
    return { ...defaultSettings };
  }
}

function saveSettings() {
  localStorage.setItem("a2z_settings", JSON.stringify(uiSettings));
}

function applyTheme() {
  const root = document.documentElement;
  const theme = uiSettings.theme || {};
  const mappings = {
    "--accent": theme.accent,
    "--accent-warm": theme.accentWarm,
    "--surface": theme.surface,
    "--bg": theme.background,
  };
  Object.entries(mappings).forEach(([key, value]) => {
    if (value && value.trim()) {
      root.style.setProperty(key, value.trim());
    } else {
      root.style.removeProperty(key);
    }
  });
}

function applySettings() {
  document.body.classList.toggle("compact", uiSettings.compact);
  document.body.classList.toggle("hide-units", !uiSettings.showUnits);
  document.body.classList.toggle("hide-notes", !uiSettings.showNotesColumn);
  document.body.classList.toggle("hide-progress", !uiSettings.showProgress);
  document.body.classList.toggle("hide-sr", !uiSettings.showSr);
  document.body.classList.toggle("hide-difficulty", !uiSettings.showDifficulty);
  document.body.classList.toggle("zebra-rows", uiSettings.zebra);
  const header = uiSettings.header || {};
  document.body.classList.toggle("hide-sync", !header.showSync);
  document.body.classList.toggle("hide-random", !header.showRandom);
  document.body.classList.toggle("hide-import", !header.showImport);
  document.body.classList.toggle("hide-export", !header.showExport);
  document.body.classList.toggle("hide-settings", !header.showSettings);
  document.body.classList.toggle("hide-admin", !header.showAdmin);
  document.body.classList.toggle("hide-sheets", !header.showSheets);
  document.body.classList.toggle("hide-search", !header.showSearch);
  document.body.classList.toggle("hide-filters", !header.showFilters);
  document.body.classList.toggle("hide-last-sync", !header.showLastSync);
  if (elements.toggleCompact) elements.toggleCompact.checked = uiSettings.compact;
  if (elements.toggleUnits) elements.toggleUnits.checked = uiSettings.showUnits;
  if (elements.toggleNotes) elements.toggleNotes.checked = uiSettings.showNotesColumn;
  if (elements.toggleProgress) elements.toggleProgress.checked = uiSettings.showProgress;
  if (elements.toggleSr) elements.toggleSr.checked = uiSettings.showSr;
  if (elements.toggleDifficulty) elements.toggleDifficulty.checked = uiSettings.showDifficulty;
  if (elements.toggleZebra) elements.toggleZebra.checked = uiSettings.zebra;
  if (!uiSettings.showNotesColumn) closeNotes();
  applyTheme();
  applyLabels();
}

function getLabel(key, fallback) {
  const labels = uiSettings.labels || {};
  const value = String(labels[key] || "").trim();
  return value || fallback;
}

function pluralizeLabel(value) {
  if (!value) return value;
  return value.endsWith("s") ? value : `${value}s`;
}

function getItemLabel() {
  return getLabel("item", "Question");
}

function applyLabels() {
  if (elements.unitFilterLabel) {
    elements.unitFilterLabel.textContent = getLabel("unit", "Unit");
  }
  if (elements.chapterFilterLabel) {
    elements.chapterFilterLabel.textContent = getLabel("chapter", "Chapter");
  }
  if (elements.difficultyFilterLabel) {
    elements.difficultyFilterLabel.textContent = "Difficulty";
  }
}

function setLoadingMessage(message) {
  elements.questionList.innerHTML = `<div class="detail-empty">${message}</div>`;
}

function getUnitList(questions) {
  const unitOrder = new Map();
  questions.forEach((q) => {
    const unit = q.unit || q.step || "Unassigned";
    const order = typeof q.order === "number" ? q.order : Number.MAX_SAFE_INTEGER;
    if (!unitOrder.has(unit) || order < unitOrder.get(unit)) {
      unitOrder.set(unit, order);
    }
  });
  return Array.from(unitOrder.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([unit]) => unit);
}

function getChapterList(questions, unitFilter) {
  const chapters = [];
  const seen = new Set();
  questions.forEach((q) => {
    const unit = q.unit || q.step || "Unassigned";
    if (unitFilter !== "all" && unit !== unitFilter) return;
    const chapter = q.chapter || q.lesson || q.group || "General";
    if (!seen.has(chapter)) {
      seen.add(chapter);
      chapters.push(chapter);
    }
  });
  return chapters;
}

function indexToLetters(index) {
  return String(index);
}

function buildUnitIndex(questions) {
  const units = getUnitList(questions);
  const map = new Map();
  units.forEach((unit, idx) => {
    const index = idx + 1;
    map.set(unit, { index, code: indexToLetters(index) });
  });
  return { units, map };
}

function getUnitBadge(unit) {
  const info = state.unitIndex.map.get(unit);
  if (!info) return "";
  return info.code;
}

async function fetchQuestions() {
  setLoadingMessage("Loading questions...");
  const response = await fetch(withSheet("/api/questions"));
  if (!response.ok) {
    setLoadingMessage("Failed to load data.");
    return;
  }
  const data = await response.json();
  state.questions = data.questions || [];
  state.stats = data.stats || null;
  state.updatedAt = data.updated_at || "";
  state.unitStatus = data.unit_status || {};
  state.unitIndex = buildUnitIndex(state.questions);
  buildUnitOptions();
  buildDifficultyOptions();
  const viewState = loadViewState(state.sheetId);
  applyViewState(viewState);
  applyFilters();
  renderStats();
  renderUnits();
  updateLastSync();
  restoreScrollPosition(viewState.scrollY);
}

function buildUnitOptions() {
  const units = state.unitIndex.units;
  const current = elements.stepFilter.value || "all";
  const unitLabel = pluralizeLabel(getLabel("unit", "Unit"));
  elements.stepFilter.innerHTML = `<option value="all">All ${unitLabel}</option>`;
  units.forEach((unit) => {
    const badge = getUnitBadge(unit);
    const option = document.createElement("option");
    option.value = unit;
    option.textContent = badge ? `${badge} · ${unit}` : unit;
    elements.stepFilter.appendChild(option);
  });
  if (units.includes(current)) {
    elements.stepFilter.value = current;
  }
}

function buildChapterOptions() {
  const selectedUnit = elements.stepFilter.value;
  const chapters = getChapterList(state.questions, selectedUnit);
  const current = elements.chapterFilter.value || "all";
  const chapterLabel = pluralizeLabel(getLabel("chapter", "Chapter"));
  elements.chapterFilter.innerHTML = `<option value="all">All ${chapterLabel}</option>`;
  chapters.forEach((chapter) => {
    const option = document.createElement("option");
    option.value = chapter;
    option.textContent = chapter;
    elements.chapterFilter.appendChild(option);
  });
  if (chapters.includes(current)) {
    elements.chapterFilter.value = current;
  } else {
    elements.chapterFilter.value = "all";
  }
}

function normalizeDifficulty(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text || text === "unknown") return "Unknown";
  if (text.includes("easy")) return "Easy";
  if (text.includes("medium")) return "Medium";
  if (text.includes("hard")) return "Hard";
  return String(value || "Unknown");
}

function buildDifficultyOptions() {
  if (!elements.difficultyFilter) return;
  const current = elements.difficultyFilter.value || "all";
  const seen = new Set();
  state.questions.forEach((q) => {
    seen.add(normalizeDifficulty(q.difficulty));
  });
  const preferred = ["Easy", "Medium", "Hard", "Unknown"];
  const extras = Array.from(seen).filter((item) => !preferred.includes(item));
  const options = [
    "all",
    ...preferred.filter((item) => seen.has(item)),
    ...extras.sort(),
  ];
  elements.difficultyFilter.innerHTML = "";
  options.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value === "all" ? "All difficulties" : value;
    elements.difficultyFilter.appendChild(option);
  });
  if (options.includes(current)) {
    elements.difficultyFilter.value = current;
  } else {
    elements.difficultyFilter.value = "all";
  }
}

function getFilterState() {
  return {
    unit: elements.stepFilter.value || "all",
    chapter: elements.chapterFilter.value || "all",
    status: elements.statusFilter.value || "all",
    difficulty: elements.difficultyFilter ? elements.difficultyFilter.value : "all",
    star: elements.starFilter ? elements.starFilter.value : "all",
    query: elements.searchInput.value.trim(),
  };
}

function applyViewState(viewState) {
  if (!viewState) return;
  const filters = viewState.filters || {};
  if (elements.searchInput) {
    elements.searchInput.value = filters.query || "";
  }
  if (elements.stepFilter) {
    const desired = filters.unit || "all";
    elements.stepFilter.value = desired;
    if (elements.stepFilter.value !== desired) {
      elements.stepFilter.value = "all";
    }
  }
  buildChapterOptions();
  if (elements.chapterFilter) {
    const desired = filters.chapter || "all";
    elements.chapterFilter.value = desired;
    if (elements.chapterFilter.value !== desired) {
      elements.chapterFilter.value = "all";
    }
  }
  if (elements.statusFilter) {
    elements.statusFilter.value = filters.status || "all";
  }
  if (elements.difficultyFilter) {
    const desired = filters.difficulty || "all";
    elements.difficultyFilter.value = desired;
    if (elements.difficultyFilter.value !== desired) {
      elements.difficultyFilter.value = "all";
    }
  }
  if (elements.starFilter) {
    const desired = filters.star || "all";
    elements.starFilter.value = desired;
    if (elements.starFilter.value !== desired) {
      elements.starFilter.value = "all";
    }
  }
  state.openUnits = new Set(Array.isArray(viewState.openUnits) ? viewState.openUnits : []);
}

let filterSaveTimer = null;
function scheduleFilterSave() {
  if (!state.sheetId) return;
  if (filterSaveTimer) clearTimeout(filterSaveTimer);
  filterSaveTimer = setTimeout(() => {
    saveViewState(state.sheetId, { filters: getFilterState() });
  }, 200);
}

let scrollSaveTimer = null;
function scheduleScrollSave() {
  if (!state.sheetId) return;
  if (scrollSaveTimer) clearTimeout(scrollSaveTimer);
  scrollSaveTimer = setTimeout(() => {
    saveViewState(state.sheetId, { scrollY: window.scrollY || 0 });
  }, 200);
}

function persistCurrentViewState() {
  if (!state.sheetId) return;
  saveViewState(state.sheetId, {
    openUnits: Array.from(state.openUnits),
    scrollY: window.scrollY || 0,
    filters: getFilterState(),
  });
}

function restoreScrollPosition(scrollY) {
  const value = Number(scrollY);
  if (!Number.isFinite(value) || value <= 0) return;
  requestAnimationFrame(() => {
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({ top: Math.min(value, maxScroll), behavior: "auto" });
  });
}

function applyFilters() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const unitFilter = elements.stepFilter.value;
  const chapterFilter = elements.chapterFilter.value;
  const status = elements.statusFilter.value;
  const difficultyFilter = elements.difficultyFilter ? elements.difficultyFilter.value : "all";
  const starFilter = elements.starFilter ? elements.starFilter.value : "all";

  state.filtered = state.questions.filter((q) => {
    const unit = q.unit || q.step;
    const chapter = q.chapter || q.lesson || q.group || "General";
    if (unitFilter !== "all" && unit !== unitFilter) return false;
    if (chapterFilter !== "all" && chapter !== chapterFilter) return false;
    if (status === "done" && !q.done) return false;
    if (status === "todo" && q.done) return false;
    if (difficultyFilter !== "all") {
      const diff = normalizeDifficulty(q.difficulty);
      if (diff !== difficultyFilter) return false;
    }
    if (starFilter === "starred" && !q.starred) return false;
    if (starFilter === "unstarred" && q.starred) return false;
    if (query) {
      const inTitle = q.title.toLowerCase().includes(query);
      const inId = q.id.includes(query);
      return inTitle || inId;
    }
    return true;
  });

  state.filtered.sort((a, b) => (a.order || 10 ** 9) - (b.order || 10 ** 9));

  renderList();
  updateCounts({ unitFilter, chapterFilter, status, query, difficultyFilter, starFilter });
  updatePanelHeader(unitFilter, chapterFilter, status, query, difficultyFilter, starFilter);
  updateFilterActions({ unitFilter, chapterFilter, status, query, difficultyFilter, starFilter });
  updateListProgress();
  scheduleFilterSave();
}

function updateFilterActions({
  unitFilter,
  chapterFilter,
  status,
  query,
  difficultyFilter,
  starFilter,
}) {
  const active =
    (unitFilter !== "all" ? 1 : 0) +
    (chapterFilter !== "all" ? 1 : 0) +
    (status !== "all" ? 1 : 0) +
    (difficultyFilter !== "all" ? 1 : 0) +
    (starFilter !== "all" ? 1 : 0) +
    (query ? 1 : 0);
  if (elements.activeFilterCount) {
    elements.activeFilterCount.textContent = active ? `${active} active` : "All";
  }
  if (elements.clearFiltersBtn) {
    elements.clearFiltersBtn.disabled = active === 0;
    elements.clearFiltersBtn.classList.toggle("disabled", active === 0);
  }
}

function updateCounts({ unitFilter, chapterFilter, status, query, difficultyFilter, starFilter }) {
  const total = state.questions.length;
  const visible = state.filtered.length;
  const hasFilter =
    unitFilter !== "all" ||
    chapterFilter !== "all" ||
    status !== "all" ||
    difficultyFilter !== "all" ||
    starFilter !== "all" ||
    query;

  if (hasFilter) {
    elements.resultCount.textContent = `${visible} of ${total} results`;
    elements.panelCount.textContent = `${visible}/${total}`;
  } else {
    elements.resultCount.textContent = `${total} results`;
    elements.panelCount.textContent = String(total);
  }
}

function updatePanelHeader(unitFilter, chapterFilter, status, query, difficultyFilter, starFilter) {
  if (!elements.panelTitle || !elements.panelSubtitle) return;

  const itemLabel = getItemLabel();
  const itemPlural = pluralizeLabel(itemLabel);
  const unitLabel = getLabel("unit", "Unit");
  const chapterLabel = getLabel("chapter", "Chapter");
  let title = itemPlural;
  const subtitleParts = [];

  if (query) {
    title = `Search: ${query}`;
    subtitleParts.push(`Search "${query}"`);
  }

  if (unitFilter !== "all") {
    const badge = getUnitBadge(unitFilter);
    const unitBadge = badge ? `${unitLabel} ${badge}` : unitLabel;
    title = `${itemPlural} in ${unitBadge} · ${unitFilter}`;
    subtitleParts.push(unitLabel);
  }

  if (chapterFilter !== "all") {
    if (unitFilter !== "all") {
      title = `${title} / ${chapterFilter}`;
    } else {
      title = `${itemPlural} in ${chapterLabel} ${chapterFilter}`;
    }
    subtitleParts.push(`${chapterLabel} ${chapterFilter}`);
  }

  if (status !== "all") {
    subtitleParts.push(`Status ${status}`);
  }

  if (difficultyFilter !== "all") {
    subtitleParts.push(`Difficulty ${difficultyFilter}`);
  }
  if (starFilter === "starred") {
    subtitleParts.push("Starred only");
  }
  if (starFilter === "unstarred") {
    subtitleParts.push("Not starred");
  }

  elements.panelTitle.textContent = title;
  elements.panelSubtitle.textContent = subtitleParts.length
    ? subtitleParts.join(" · ")
    : `All ${itemPlural.toLowerCase()} from the sheet.`;
}

function updateListProgress() {
  if (!elements.listProgressBar) return;
  const total = state.filtered.length;
  const done = state.filtered.filter((q) => q.done).length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  elements.listProgressBar.style.width = `${percent}%`;
}

function captureOpenUnits() {
  const groups = document.querySelectorAll(".unit-group");
  if (!groups.length) return;
  const openUnits = new Set();
  groups.forEach((details) => {
    if (details.open) {
      const unit = details.dataset.unit || "";
      if (unit) openUnits.add(unit);
    }
  });
  state.openUnits = openUnits;
}

function renderList() {
  if (state.lastRenderedSheetId === state.sheetId) {
    captureOpenUnits();
  }
  elements.questionList.innerHTML = "";

  if (!state.filtered.length) {
    elements.questionList.innerHTML =
      '<div class="detail-empty">No questions match your filters.</div>';
    state.lastRenderedSheetId = state.sheetId;
    return;
  }

  const unitMap = new Map();
  state.filtered.forEach((q) => {
    const unit = q.unit || q.step || "Unassigned";
    const chapter = q.chapter || q.lesson || q.group || "General";
    if (!unitMap.has(unit)) {
      unitMap.set(unit, { chapters: new Map(), total: 0, done: 0 });
    }
    const group = unitMap.get(unit);
    if (!group.chapters.has(chapter)) {
      group.chapters.set(chapter, []);
    }
    group.chapters.get(chapter).push(q);
    group.total += 1;
    if (q.done) group.done += 1;
  });

  const orderedUnits = [];
  state.unitIndex.units.forEach((unit) => {
    if (unitMap.has(unit)) orderedUnits.push(unit);
  });
  unitMap.forEach((_value, unit) => {
    if (!orderedUnits.includes(unit)) orderedUnits.push(unit);
  });

  const query = elements.searchInput.value.trim().toLowerCase();
  const unitFilter = elements.stepFilter.value;
  const chapterFilter = elements.chapterFilter.value;
  const status = elements.statusFilter.value;
  const difficultyFilter = elements.difficultyFilter ? elements.difficultyFilter.value : "all";
  const starFilter = elements.starFilter ? elements.starFilter.value : "all";
  const hasActiveFilter =
    unitFilter !== "all" ||
    chapterFilter !== "all" ||
    status !== "all" ||
    difficultyFilter !== "all" ||
    starFilter !== "all" ||
    query;
  const hasStoredOpenUnits = state.openUnits.size > 0;
  const shouldExpand = hasActiveFilter && !hasStoredOpenUnits;

  orderedUnits.forEach((unit) => {
    const group = unitMap.get(unit);
    if (!group) return;
    const details = document.createElement("details");
    details.className = "unit-group";
    details.dataset.unit = unit;
    details.open =
      shouldExpand || state.openUnits.has(unit) || orderedUnits.length === 1;
    details.addEventListener("toggle", () => {
      if (details.open) {
        state.openUnits.add(unit);
      } else {
        state.openUnits.delete(unit);
      }
      saveViewState(state.sheetId, { openUnits: Array.from(state.openUnits) });
    });

    const summary = document.createElement("summary");
    summary.className = "unit-summary";

    const left = document.createElement("div");
    left.className = "unit-summary-left";

    const badge = getUnitBadge(unit);
    if (badge) {
      const badgeEl = document.createElement("span");
      badgeEl.className = "unit-badge";
      badgeEl.textContent = badge;
      left.appendChild(badgeEl);
    }

    const title = document.createElement("span");
    title.className = "unit-summary-title";
    title.textContent = unit;
    left.appendChild(title);

    const count = document.createElement("span");
    count.className = "unit-summary-count";
    count.textContent = `${group.done}/${group.total} done`;

    summary.appendChild(left);
    summary.appendChild(count);
    details.appendChild(summary);

    const body = document.createElement("div");
    body.className = "unit-body";

    const wrap = document.createElement("div");
    wrap.className = "table-wrap";

    const table = document.createElement("table");
    table.className = "question-table";

    const thead = document.createElement("thead");
    const itemLabel = getItemLabel();
    thead.innerHTML = `
      <tr>
        <th data-col="done">Done</th>
        <th data-col="star">Star</th>
        <th data-col="sr">SR</th>
        <th>${itemLabel}</th>
        <th data-col="difficulty">Difficulty</th>
        <th>Links</th>
        <th data-col="notes">Notes</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    group.chapters.forEach((questions, chapter) => {
      const chapterRow = document.createElement("tr");
      chapterRow.className = "chapter-row";
      const chapterCell = document.createElement("td");
      chapterCell.colSpan = 7;
      chapterCell.textContent = chapter;
      chapterRow.appendChild(chapterCell);
      tbody.appendChild(chapterRow);
      questions.forEach((q) => {
        tbody.appendChild(buildQuestionRow(q));
      });
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    body.appendChild(wrap);
    details.appendChild(body);

    elements.questionList.appendChild(details);
  });
  state.lastRenderedSheetId = state.sheetId;
}

function buildQuestionRow(q) {
  const row = document.createElement("tr");
  row.className = "question-row" + (q.id === state.selectedId ? " selected" : "");
  row.dataset.id = q.id;

  const doneCell = document.createElement("td");
  doneCell.dataset.col = "done";
  const check = document.createElement("input");
  check.type = "checkbox";
  check.className = "row-check";
  check.checked = q.done;
  check.addEventListener("click", (event) => event.stopPropagation());
  check.addEventListener("change", () => updateDone(q.id, check.checked));
  doneCell.appendChild(check);

  const starCell = document.createElement("td");
  starCell.dataset.col = "star";
  const starBtn = document.createElement("button");
  starBtn.type = "button";
  starBtn.className = "star-btn" + (q.starred ? " starred" : "");
  starBtn.textContent = q.starred ? "★" : "☆";
  starBtn.setAttribute("aria-label", q.starred ? "Unstar question" : "Star question");
  starBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    updateStar(q.id, !q.starred);
  });
  starCell.appendChild(starBtn);

  const srCell = document.createElement("td");
  srCell.dataset.col = "sr";
  srCell.innerHTML = q.order ? `<span class="sr-badge">${q.order}</span>` : "-";

  const titleCell = document.createElement("td");
  titleCell.textContent = q.title;

  const diffCell = document.createElement("td");
  diffCell.dataset.col = "difficulty";
  const diffValue = (q.difficulty || "").trim();
  if (diffValue) {
    let diffClass = diffValue.toLowerCase();
    if (diffClass.includes("easy")) diffClass = "easy";
    else if (diffClass.includes("medium")) diffClass = "medium";
    else if (diffClass.includes("hard")) diffClass = "hard";
    else diffClass = "unknown";
    const badge = document.createElement("span");
    badge.className = `difficulty-badge difficulty-${diffClass}`;
    badge.textContent = diffValue;
    diffCell.appendChild(badge);
  } else {
    diffCell.textContent = "-";
  }

  const linksCell = document.createElement("td");
  const links = document.createElement("div");
  links.className = "link-icons";
  const leetUrl = q.leetcode_url || q.url || "";
  const ytUrl = q.youtube_url || "";
  const webUrl = q.resource_url || "";
  const leetFallback = getFallbackLink(q, "leetcode");
  const ytFallback = getFallbackLink(q, "youtube");
  const webFallback = getFallbackLink(q, "web");
  links.appendChild(makeLink("LC", leetUrl || leetFallback, { fallback: !leetUrl && !!leetFallback }));
  links.appendChild(makeLink("YT", ytUrl || ytFallback, { fallback: !ytUrl && !!ytFallback }));
  links.appendChild(makeLink("WB", webUrl || webFallback, { fallback: !webUrl && !!webFallback }));
  linksCell.appendChild(links);

  const noteCell = document.createElement("td");
  noteCell.dataset.col = "notes";
  const noteBtn = document.createElement("button");
  noteBtn.className = "note-btn" + (q.notes ? " has-note" : "");
  noteBtn.textContent = q.notes ? "Notes" : "Add";
  noteBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    openNotes(q.id);
  });
  noteCell.appendChild(noteBtn);

  row.appendChild(doneCell);
  row.appendChild(starCell);
  row.appendChild(srCell);
  row.appendChild(titleCell);
  row.appendChild(diffCell);
  row.appendChild(linksCell);
  row.appendChild(noteCell);

  return row;
}

function getFallbackLink(question, type) {
  const fallback = uiSettings.linkFallback || {};
  if (!fallback.enabled || !fallback[type]) return "";
  const suffixKey = `${type}Suffix`;
  const suffix = fallback[suffixKey] ? ` ${fallback[suffixKey].trim()}` : "";
  const diff = fallback.includeDifficulty ? normalizeDifficulty(question.difficulty) : "";
  const diffToken = diff && diff !== "Unknown" ? ` ${diff}` : "";
  const query = `${question.title || ""}${diffToken}${suffix}`.trim();
  if (!query) return "";
  const encoded = encodeURIComponent(query);
  const templates = {
    leetcode: "https://leetcode.com/problemset/all/?search={query}",
    youtube: "https://www.youtube.com/results?search_query={query}",
    web: "https://www.google.com/search?q={query}",
  };
  const template = templates[type] || templates.web;
  return template.replace("{query}", encoded);
}

function makeLink(label, href, options = {}) {
  if (!href) {
    const span = document.createElement("span");
    span.className = "link-icon disabled";
    span.textContent = label;
    return span;
  }
  const link = document.createElement("a");
  link.className = "link-icon";
  if (options.fallback) {
    link.classList.add("link-fallback");
    link.title = "Search link";
  }
  link.textContent = label;
  link.href = href;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.addEventListener("click", (event) => event.stopPropagation());
  return link;
}

function renderUnits() {
  if (!elements.unitList) return;
  elements.unitList.innerHTML = "";
  const units = state.unitIndex.units;
  const statsMap = new Map();
  (state.stats?.by_unit || []).forEach((item) => statsMap.set(item.unit, item));

  units.forEach((unit) => {
    const stat = statsMap.get(unit);
    const done = stat ? stat.done : 0;
    const total = stat ? stat.total : 0;
    const percent = total ? Math.round((done / total) * 100) : 0;

    const card = document.createElement("div");
    card.className = "unit-card";

    const header = document.createElement("div");
    header.className = "unit-card-header";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "unit-check";
    checkbox.checked = Boolean(state.unitStatus?.[unit]?.done);
    checkbox.addEventListener("change", () => updateUnitStatus(unit, checkbox.checked));

    const badge = document.createElement("span");
    badge.className = "unit-badge";
    badge.textContent = getUnitBadge(unit);

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = unit;
    button.addEventListener("click", () => {
      elements.stepFilter.value = unit;
      buildChapterOptions();
      applyFilters();
    });

    header.appendChild(checkbox);
    header.appendChild(badge);
    header.appendChild(button);

    const meta = document.createElement("div");
    meta.className = "unit-meta";
    meta.textContent = `${done}/${total} done`;

    const progress = document.createElement("div");
    progress.className = "unit-progress";
    const bar = document.createElement("span");
    bar.style.width = `${percent}%`;
    progress.appendChild(bar);

    card.appendChild(header);
    card.appendChild(meta);
    card.appendChild(progress);
    elements.unitList.appendChild(card);
  });
}

function openNotes(id) {
  if (!elements.notesModal) return;
  const question = state.questions.find((q) => q.id === id);
  if (!question) return;
  state.selectedId = id;
  state.notesOpen = true;
  updateNotesModal(question);
  elements.notesModal.classList.remove("hidden");
}

function closeNotes() {
  if (!elements.notesModal) return;
  state.selectedId = null;
  state.notesOpen = false;
  elements.notesModal.classList.add("hidden");
}

function openNotesHub() {
  if (!elements.notesHubModal) return;
  state.notesHubOpen = true;
  renderNotesHub();
  elements.notesHubModal.classList.remove("hidden");
  if (elements.notesHubSearch) {
    elements.notesHubSearch.focus();
  }
}

function closeNotesHub() {
  if (!elements.notesHubModal) return;
  state.notesHubOpen = false;
  elements.notesHubModal.classList.add("hidden");
}

function renderNotesHub() {
  if (!elements.notesHubList) return;
  const query = elements.notesHubSearch
    ? elements.notesHubSearch.value.trim().toLowerCase()
    : "";
  const notes = state.questions.filter((q) => q.notes && q.notes.trim());
  const ordered = notes
    .slice()
    .sort((a, b) => (a.order || 10 ** 9) - (b.order || 10 ** 9));
  const filtered = query
    ? ordered.filter((q) => {
        const title = q.title.toLowerCase();
        const text = q.notes.toLowerCase();
        return title.includes(query) || text.includes(query);
      })
    : ordered;

  if (elements.notesHubCount) {
    elements.notesHubCount.textContent = `${filtered.length} notes`;
  }

  elements.notesHubList.innerHTML = "";
  if (!filtered.length) {
    elements.notesHubList.innerHTML =
      '<div class="detail-empty">No notes yet. Add notes on any question to see them here.</div>';
    return;
  }

  filtered.forEach((q) => {
    const item = document.createElement("div");
    item.className = "notes-item";

    const header = document.createElement("div");
    header.className = "notes-item-header";

    const titleWrap = document.createElement("div");
    titleWrap.className = "notes-item-title";
    const badge = getUnitBadge(q.unit || q.step || "");
    const badgeText = badge ? `${badge} · ` : "";
    titleWrap.textContent = `${badgeText}${q.title}`;

    const meta = document.createElement("div");
    meta.className = "notes-item-meta";
    const chapter = q.chapter || q.lesson || q.group || "General";
    const sr = q.order ? `#${q.order}` : "#-";
    meta.textContent = `${sr} · ${q.unit || q.step || "Unassigned"} / ${chapter}`;

    header.appendChild(titleWrap);
    header.appendChild(meta);

    const body = document.createElement("div");
    body.className = "notes-item-body";
    body.textContent = q.notes;

    const actions = document.createElement("div");
    actions.className = "notes-item-actions";
    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "btn slim";
    openBtn.textContent = "Open";
    openBtn.addEventListener("click", () => {
      closeNotesHub();
      openNotes(q.id);
    });
    actions.appendChild(openBtn);

    item.appendChild(header);
    item.appendChild(body);
    item.appendChild(actions);
    elements.notesHubList.appendChild(item);
  });
}

function updateNotesModal(question) {
  if (!question) return;
  const unit = question.unit || question.step || "Unassigned";
  const chapter = question.chapter || question.lesson || question.group || "General";
  const badge = getUnitBadge(unit);
  const prefix = badge ? `${badge} · ` : "";
  elements.detailStep.textContent = `${prefix}${unit} / ${chapter}`;
  elements.detailTitle.textContent = question.title;
  elements.detailSr.textContent = question.order ? `#${question.order}` : "#-";
  elements.detailNotes.value = question.notes || "";
  elements.detailDoneAt.textContent = question.last_done_at
    ? `Last done: ${formatDate(question.last_done_at)}`
    : "Last done: -";
  elements.detailDifficulty.textContent = question.difficulty
    ? `Difficulty: ${question.difficulty}`
    : "Difficulty: -";
}

function openImportModal() {
  if (!elements.importModal) return;
  elements.importModal.classList.remove("hidden");
  if (elements.importStatus) {
    elements.importStatus.textContent = "";
  }
  renderSheetSelect(elements.importSheetSelect, true);
  if (elements.importSheetSelect) {
    elements.importSheetSelect.value = "__new__";
  }
  if (elements.importSheetNameWrap) {
    elements.importSheetNameWrap.classList.remove("hidden");
  }
  if (elements.importSheetName) {
    elements.importSheetName.focus();
  }
}

function closeImportModal() {
  if (!elements.importModal) return;
  elements.importModal.classList.add("hidden");
  if (elements.importFile) {
    elements.importFile.value = "";
  }
  if (elements.importSheetName) {
    elements.importSheetName.value = "";
  }
}

function openExportModal() {
  if (!elements.exportModal) return;
  elements.exportModal.classList.remove("hidden");
  renderSheetSelect(elements.exportSheetSelect, false);
}

function closeExportModal() {
  if (!elements.exportModal) return;
  elements.exportModal.classList.add("hidden");
}

function setImportStatus(message, isError = false) {
  if (!elements.importStatus) return;
  elements.importStatus.textContent = message;
  elements.importStatus.style.color = isError ? "#ff7b7b" : "";
}

function normalizeDelimiter(value) {
  const trimmed = value.trim();
  if (!trimmed) return ",";
  if (trimmed === "\\t" || trimmed.toLowerCase() === "tab") return "\t";
  return trimmed;
}

async function handleImport() {
  if (!elements.importSheetSelect) return;
  let targetSheet = elements.importSheetSelect.value;
  if (targetSheet === "__new__") {
    const nameValue = elements.importSheetName ? elements.importSheetName.value.trim() : "";
    if (!nameValue) {
      setImportStatus("Enter a sheet name for the new sheet.", true);
      return;
    }
    const created = await createSheet(nameValue);
    if (!created) {
      setImportStatus("Could not create the sheet.", true);
      return;
    }
    targetSheet = created.id;
  }
  if (!elements.importFile || !elements.importFile.files.length) {
    setImportStatus("Select a CSV or Excel file to import.", true);
    return;
  }
  const file = elements.importFile.files[0];
  const formData = new FormData();
  formData.append("file", file);
  if (elements.importDelimiter) {
    formData.append("delimiter", normalizeDelimiter(elements.importDelimiter.value));
  }
  if (elements.importHeaderMode) {
    formData.append("header", elements.importHeaderMode.value);
  }
  setImportStatus("Importing...");
  const response = await fetch(withSheet("/api/import-table", targetSheet), {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    setImportStatus(payload.error || "Import failed.", true);
    return;
  }
  setImportStatus("Import complete.");
  setActiveSheet(targetSheet, { keepFilters: true });
  closeImportModal();
}

function renderSheetSelect(selectEl, includeNew) {
  if (!selectEl) return;
  selectEl.innerHTML = "";
  state.sheetList.forEach((sheet) => {
    const option = document.createElement("option");
    option.value = sheet.id;
    option.textContent = sheet.label;
    if (sheet.id === state.sheetId) option.selected = true;
    selectEl.appendChild(option);
  });
  if (includeNew) {
    const option = document.createElement("option");
    option.value = "__new__";
    option.textContent = "Create new sheet...";
    selectEl.appendChild(option);
  }
}

async function downloadExport(format, sheetIdOverride) {
  const response = await fetch(withSheet(`/api/export?format=${format}`, sheetIdOverride));
  if (!response.ok) return;
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const label = getSheetLabel(sheetIdOverride || state.sheetId);
  const rawName = label || sheetIdOverride || state.sheetId;
  const fileBase = rawName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  link.href = url;
  link.download = `${fileBase}-export.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function updateLastSync() {
  elements.lastSync.textContent = state.updatedAt
    ? `Last sync: ${formatDate(state.updatedAt)}`
    : "Last sync: -";
}

function renderStats() {
  updateListProgress();
}

async function updateDone(id, done) {
  const response = await fetch(withSheet(`/api/questions/${encodeURIComponent(id)}/done`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ done }),
  });
  if (!response.ok) return;
  const data = await response.json();
  applyUpdate(data);
}

async function updateStar(id, starred) {
  const response = await fetch(withSheet(`/api/questions/${encodeURIComponent(id)}/star`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ starred }),
  });
  if (!response.ok) return;
  const data = await response.json();
  applyUpdate(data);
}

async function updateUnitStatus(unit, done) {
  const response = await fetch(withSheet(`/api/units/${encodeURIComponent(unit)}/done`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ done }),
  });
  if (!response.ok) return;
  state.unitStatus[unit] = { done };
  renderUnits();
}

async function updateNote(id, note) {
  const response = await fetch(withSheet(`/api/questions/${encodeURIComponent(id)}/note`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });
  if (!response.ok) return;
  const data = await response.json();
  applyUpdate(data);
}

function applyUpdate(data) {
  if (data.question) {
    const index = state.questions.findIndex((q) => q.id === data.question.id);
    if (index >= 0) state.questions[index] = data.question;
  }
  if (data.stats) {
    state.stats = data.stats;
  }
  renderStats();
  renderUnits();
  applyFilters();
  if (state.notesOpen && state.selectedId) {
    const question = state.questions.find((q) => q.id === state.selectedId);
    if (question) updateNotesModal(question);
  }
  if (state.notesHubOpen) {
    renderNotesHub();
  }
}

function pickRandomTodo() {
  const pool = state.filtered.filter((q) => !q.done);
  const fallback = state.questions.filter((q) => !q.done);
  const list = pool.length ? pool : fallback;
  if (!list.length) return;
  const choice = list[Math.floor(Math.random() * list.length)];
  const row = document.querySelector(`[data-id="${choice.id}"]`);
  if (row) {
    const details = row.closest("details");
    if (details) details.open = true;
    row.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

async function syncData() {
  const response = await fetch(withSheet("/api/sync"), { method: "POST" });
  if (!response.ok) return;
  await fetchQuestions();
}

function bindEvents() {
  elements.searchInput.addEventListener("input", applyFilters);
  elements.stepFilter.addEventListener("change", () => {
    buildChapterOptions();
    applyFilters();
  });
  elements.chapterFilter.addEventListener("change", applyFilters);
  elements.statusFilter.addEventListener("change", applyFilters);
  if (elements.difficultyFilter) {
    elements.difficultyFilter.addEventListener("change", applyFilters);
  }
  if (elements.starFilter) {
    elements.starFilter.addEventListener("change", applyFilters);
  }

  if (elements.clearFiltersBtn) {
    elements.clearFiltersBtn.addEventListener("click", () => {
      elements.searchInput.value = "";
      elements.stepFilter.value = "all";
      buildChapterOptions();
      elements.chapterFilter.value = "all";
      elements.statusFilter.value = "all";
      if (elements.difficultyFilter) {
        elements.difficultyFilter.value = "all";
      }
      if (elements.starFilter) {
        elements.starFilter.value = "all";
      }
      applyFilters();
    });
  }
  elements.syncBtn.addEventListener("click", syncData);
  elements.randomBtn.addEventListener("click", pickRandomTodo);

  elements.saveNoteBtn.addEventListener("click", () => {
    if (!state.selectedId) return;
    updateNote(state.selectedId, elements.detailNotes.value.trim());
  });

  if (elements.closeNotesBtn) {
    elements.closeNotesBtn.addEventListener("click", closeNotes);
  }

  if (elements.notesBackdrop) {
    elements.notesBackdrop.addEventListener("click", closeNotes);
  }

  if (elements.notesHubBtn) {
    elements.notesHubBtn.addEventListener("click", openNotesHub);
  }

  if (elements.closeNotesHubBtn) {
    elements.closeNotesHubBtn.addEventListener("click", closeNotesHub);
  }

  if (elements.notesHubBackdrop) {
    elements.notesHubBackdrop.addEventListener("click", closeNotesHub);
  }

  if (elements.notesHubSearch) {
    elements.notesHubSearch.addEventListener("input", renderNotesHub);
  }

  if (elements.importBtn) {
    elements.importBtn.addEventListener("click", () => {
      openImportModal();
    });
  }

  if (elements.closeImportBtn) {
    elements.closeImportBtn.addEventListener("click", closeImportModal);
  }

  if (elements.importBackdrop) {
    elements.importBackdrop.addEventListener("click", closeImportModal);
  }

  if (elements.importSubmitBtn) {
    elements.importSubmitBtn.addEventListener("click", handleImport);
  }

  if (elements.importSheetSelect) {
    elements.importSheetSelect.addEventListener("change", () => {
      if (!elements.importSheetNameWrap) return;
      if (elements.importSheetSelect.value === "__new__") {
        elements.importSheetNameWrap.classList.remove("hidden");
      } else {
        elements.importSheetNameWrap.classList.add("hidden");
      }
    });
  }

  if (elements.exportBtn) {
    elements.exportBtn.addEventListener("click", () => {
      openExportModal();
    });
  }

  if (elements.closeExportBtn) {
    elements.closeExportBtn.addEventListener("click", closeExportModal);
  }

  if (elements.exportBackdrop) {
    elements.exportBackdrop.addEventListener("click", closeExportModal);
  }

  if (elements.exportCsvSubmit) {
    elements.exportCsvSubmit.addEventListener("click", () => {
      if (!elements.exportSheetSelect) return;
      const sheetId = elements.exportSheetSelect.value;
      downloadExport("csv", sheetId);
      closeExportModal();
    });
  }

  if (elements.exportJsonSubmit) {
    elements.exportJsonSubmit.addEventListener("click", () => {
      if (!elements.exportSheetSelect) return;
      const sheetId = elements.exportSheetSelect.value;
      downloadExport("json", sheetId);
      closeExportModal();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (state.notesOpen) closeNotes();
      if (state.notesHubOpen) closeNotesHub();
      if (elements.importModal && !elements.importModal.classList.contains("hidden")) {
        closeImportModal();
      }
      if (elements.exportModal && !elements.exportModal.classList.contains("hidden")) {
        closeExportModal();
      }
    }
  });

  if (elements.settingsBtn && elements.settingsPanel) {
    elements.settingsBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      elements.settingsPanel.classList.toggle("hidden");
    });
    document.addEventListener("click", (event) => {
      if (!elements.settingsPanel.classList.contains("hidden")) {
        const insidePanel = elements.settingsPanel.contains(event.target);
        const insideButton = elements.settingsBtn.contains(event.target);
        if (!insidePanel && !insideButton) {
          elements.settingsPanel.classList.add("hidden");
        }
      }
    });
  }

  if (elements.toggleCompact) {
    elements.toggleCompact.addEventListener("change", () => {
      uiSettings.compact = elements.toggleCompact.checked;
      saveSettings();
      applySettings();
    });
  }

  if (elements.toggleUnits) {
    elements.toggleUnits.addEventListener("change", () => {
      uiSettings.showUnits = elements.toggleUnits.checked;
      saveSettings();
      applySettings();
    });
  }

  if (elements.toggleNotes) {
    elements.toggleNotes.addEventListener("change", () => {
      uiSettings.showNotesColumn = elements.toggleNotes.checked;
      saveSettings();
      applySettings();
    });
  }

  if (elements.toggleProgress) {
    elements.toggleProgress.addEventListener("change", () => {
      uiSettings.showProgress = elements.toggleProgress.checked;
      saveSettings();
      applySettings();
    });
  }

  if (elements.toggleSr) {
    elements.toggleSr.addEventListener("change", () => {
      uiSettings.showSr = elements.toggleSr.checked;
      saveSettings();
      applySettings();
    });
  }

  if (elements.toggleDifficulty) {
    elements.toggleDifficulty.addEventListener("change", () => {
      uiSettings.showDifficulty = elements.toggleDifficulty.checked;
      saveSettings();
      applySettings();
    });
  }

  if (elements.toggleZebra) {
    elements.toggleZebra.addEventListener("change", () => {
      uiSettings.zebra = elements.toggleZebra.checked;
      saveSettings();
      applySettings();
    });
  }

  window.addEventListener(
    "scroll",
    () => {
      scheduleScrollSave();
    },
    { passive: true }
  );

  window.addEventListener("beforeunload", () => {
    persistCurrentViewState();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      persistCurrentViewState();
    }
  });
}

async function initApp() {
  state.sheetList = await fetchSheetList();
  renderSheetTabs();
  state.sheetId = loadActiveSheet();
  if (!state.sheetList.find((sheet) => sheet.id === state.sheetId)) {
    state.sheetId = getDefaultSheetId();
  }
  setActiveSheet(state.sheetId, { keepFilters: true });
  bindEvents();
}

initApp();
