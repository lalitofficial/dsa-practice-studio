const state = {
  sheetList: [],
  sheetId: "",
  questions: [],
  focusQueue: [],
  focusIndex: 0,
};

const elements = {
  sheetTabs: document.getElementById("sheetTabs"),
  revisionSearch: document.getElementById("revisionSearch"),
  revisionView: document.getElementById("revisionView"),
  revisionUnit: document.getElementById("revisionUnit"),
  revisionDifficulty: document.getElementById("revisionDifficulty"),
  revisionStatus: document.getElementById("revisionStatus"),
  revisionClearBtn: document.getElementById("revisionClearBtn"),
  revisionLibrary: document.getElementById("revisionLibrary"),
  notesCard: document.getElementById("notesCard"),
  starredCard: document.getElementById("starredCard"),
  notesList: document.getElementById("notesList"),
  starredList: document.getElementById("starredList"),
  notesCount: document.getElementById("notesCount"),
  starredCount: document.getElementById("starredCount"),
  revisionNotesTotal: document.getElementById("revisionNotesTotal"),
  revisionStarredTotal: document.getElementById("revisionStarredTotal"),
  revisionTodoTotal: document.getElementById("revisionTodoTotal"),
  revisionLastDone: document.getElementById("revisionLastDone"),
  focusMode: document.getElementById("focusMode"),
  focusSort: document.getElementById("focusSort"),
  focusLimit: document.getElementById("focusLimit"),
  focusCount: document.getElementById("focusCount"),
  focusCard: document.getElementById("focusCard"),
  focusQueue: document.getElementById("focusQueue"),
  focusPrevBtn: document.getElementById("focusPrevBtn"),
  focusNextBtn: document.getElementById("focusNextBtn"),
  focusDoneBtn: document.getElementById("focusDoneBtn"),
  focusStarBtn: document.getElementById("focusStarBtn"),
  focusShuffleBtn: document.getElementById("focusShuffleBtn"),
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

function withSheet(url, sheetIdOverride) {
  const sheetId = sheetIdOverride || state.sheetId;
  if (!sheetId) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}sheet=${encodeURIComponent(sheetId)}`;
}

function getUnitName(question) {
  return question.unit || question.step || "Unassigned";
}

function getChapterName(question) {
  return question.chapter || question.lesson || question.group || "General";
}

function normalizeDifficulty(value) {
  if (!value) return "Unrated";
  const text = String(value).trim().toLowerCase();
  if (!text) return "Unrated";
  if (text.startsWith("e")) return "Easy";
  if (text.startsWith("m")) return "Medium";
  if (text.startsWith("h")) return "Hard";
  return String(value).trim();
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

async function fetchSheetList() {
  try {
    const response = await fetch("/api/sheets");
    if (!response.ok) return [...DEFAULT_SHEETS];
    const data = await response.json();
    const sheets = Array.isArray(data.sheets) ? data.sheets : [];
    const list = sheets.map((sheet) => ({
      id: sheet.id,
      label: sheet.label || sheet.id,
    }));
    return list.length ? list : [...DEFAULT_SHEETS];
  } catch (error) {
    return [...DEFAULT_SHEETS];
  }
}

async function fetchActiveSheet() {
  try {
    const response = await fetch("/api/active-sheet");
    if (!response.ok) return "";
    const data = await response.json();
    return data.sheet || "";
  } catch (error) {
    return "";
  }
}

async function saveActiveSheet(sheetId) {
  try {
    await fetch("/api/active-sheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheet: sheetId }),
    });
  } catch (error) {
    // Ignore network errors.
  }
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

function setActiveSheet(sheetId) {
  const normalized = slugifySheet(sheetId || "");
  if (!normalized) return;
  state.sheetId = normalized;
  saveActiveSheet(normalized);
  renderSheetTabs();
  fetchQuestions();
}

async function fetchQuestions() {
  const response = await fetch(withSheet("/api/questions"));
  if (!response.ok) {
    state.questions = [];
    renderLists();
    return;
  }
  const data = await response.json();
  state.questions = data.questions || [];
  buildUnitOptions(state.questions);
  buildDifficultyOptions(state.questions);
  renderLists();
}

function formatMeta(question) {
  const unit = getUnitName(question);
  const chapter = getChapterName(question);
  const difficulty = normalizeDifficulty(question.difficulty);
  const sr = question.order ? `#${question.order}` : "#-";
  const parts = [`${sr}`, `${unit} / ${chapter}`];
  if (difficulty && difficulty !== "Unrated") {
    parts.push(difficulty);
  }
  if (question.done) {
    parts.push("Done");
  }
  return parts.join(" · ");
}

function makeLink(label, href) {
  if (!href) {
    const span = document.createElement("span");
    span.className = "link-icon disabled";
    span.textContent = label;
    return span;
  }
  const link = document.createElement("a");
  link.className = "link-icon";
  link.textContent = label;
  link.href = href;
  link.target = "_blank";
  link.rel = "noreferrer";
  return link;
}

function buildLinkRow(question) {
  const wrap = document.createElement("div");
  wrap.className = "link-icons";
  wrap.appendChild(makeLink("LC", question.leetcode_url || question.url || ""));
  wrap.appendChild(makeLink("YT", question.youtube_url || ""));
  wrap.appendChild(makeLink("WB", question.resource_url || ""));
  return wrap;
}

function buildNotesItem(question) {
  const item = document.createElement("div");
  item.className = "revision-item";

  const header = document.createElement("div");
  header.className = "revision-item-header";
  const title = document.createElement("div");
  title.className = "revision-item-title";
  title.textContent = question.title;
  const meta = document.createElement("div");
  meta.className = "revision-item-meta";
  meta.textContent = formatMeta(question);
  header.appendChild(title);
  header.appendChild(meta);

  const body = document.createElement("div");
  body.className = "revision-item-body";
  body.textContent = question.notes || "";

  const actions = document.createElement("div");
  actions.className = "revision-item-actions";
  actions.appendChild(buildLinkRow(question));

  item.appendChild(header);
  item.appendChild(body);
  item.appendChild(actions);
  return item;
}

function buildStarredItem(question) {
  const item = document.createElement("div");
  item.className = "revision-item";

  const header = document.createElement("div");
  header.className = "revision-item-header";
  const title = document.createElement("div");
  title.className = "revision-item-title";
  title.textContent = question.title;
  const meta = document.createElement("div");
  meta.className = "revision-item-meta";
  meta.textContent = formatMeta(question);
  header.appendChild(title);
  header.appendChild(meta);

  const actions = document.createElement("div");
  actions.className = "revision-item-actions";
  actions.appendChild(buildLinkRow(question));

  const unstar = document.createElement("button");
  unstar.type = "button";
  unstar.className = "btn slim";
  unstar.textContent = "Unstar";
  unstar.addEventListener("click", () => updateStar(question.id, false));
  actions.appendChild(unstar);

  item.appendChild(header);
  item.appendChild(actions);
  return item;
}

async function updateStar(id, starred) {
  const response = await fetch(withSheet(`/api/questions/${encodeURIComponent(id)}/star`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ starred }),
  });
  if (!response.ok) return;
  const data = await response.json();
  if (data.question) {
    const index = state.questions.findIndex((q) => q.id === data.question.id);
    if (index >= 0) state.questions[index] = data.question;
  }
  renderLists();
}

async function updateDone(id, done) {
  const response = await fetch(withSheet(`/api/questions/${encodeURIComponent(id)}/done`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ done }),
  });
  if (!response.ok) return;
  const data = await response.json();
  if (data.question) {
    const index = state.questions.findIndex((q) => q.id === data.question.id);
    if (index >= 0) state.questions[index] = data.question;
  }
  renderLists();
}

function buildUnitOptions(questions) {
  if (!elements.revisionUnit) return;
  const selected = elements.revisionUnit.value || "all";
  const units = new Set();
  questions.forEach((question) => units.add(getUnitName(question)));
  const options = Array.from(units).sort((a, b) => a.localeCompare(b));
  elements.revisionUnit.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All units";
  elements.revisionUnit.appendChild(allOption);

  options.forEach((unit) => {
    const option = document.createElement("option");
    option.value = unit;
    option.textContent = unit;
    elements.revisionUnit.appendChild(option);
  });

  elements.revisionUnit.value = options.includes(selected) ? selected : "all";
}

function buildDifficultyOptions(questions) {
  if (!elements.revisionDifficulty) return;
  const selected = elements.revisionDifficulty.value || "all";
  const difficulties = new Set();
  questions.forEach((question) => difficulties.add(normalizeDifficulty(question.difficulty)));
  const order = ["Easy", "Medium", "Hard", "Unrated"];
  const options = order.filter((level) => difficulties.has(level));
  const extras = Array.from(difficulties)
    .filter((level) => !order.includes(level))
    .sort((a, b) => a.localeCompare(b));
  options.push(...extras);

  elements.revisionDifficulty.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All difficulty";
  elements.revisionDifficulty.appendChild(allOption);

  options.forEach((difficulty) => {
    const option = document.createElement("option");
    option.value = difficulty;
    option.textContent = difficulty;
    elements.revisionDifficulty.appendChild(option);
  });

  elements.revisionDifficulty.value = options.includes(selected) ? selected : "all";
}

function getFilterState() {
  return {
    query: elements.revisionSearch ? elements.revisionSearch.value.trim().toLowerCase() : "",
    view: elements.revisionView ? elements.revisionView.value : "all",
    unit: elements.revisionUnit ? elements.revisionUnit.value : "all",
    difficulty: elements.revisionDifficulty ? elements.revisionDifficulty.value : "all",
    status: elements.revisionStatus ? elements.revisionStatus.value : "all",
  };
}

function applyFilters(questions, filters) {
  let filtered = [...questions];
  if (filters.query) {
    filtered = filtered.filter((question) => {
      const unit = getUnitName(question).toLowerCase();
      const chapter = getChapterName(question).toLowerCase();
      const difficulty = normalizeDifficulty(question.difficulty).toLowerCase();
      const notes = (question.notes || "").toLowerCase();
      const title = (question.title || "").toLowerCase();
      const text = `${title} ${unit} ${chapter} ${difficulty} ${notes}`;
      return text.includes(filters.query);
    });
  }
  if (filters.unit && filters.unit !== "all") {
    filtered = filtered.filter((question) => getUnitName(question) === filters.unit);
  }
  if (filters.difficulty && filters.difficulty !== "all") {
    filtered = filtered.filter(
      (question) => normalizeDifficulty(question.difficulty) === filters.difficulty
    );
  }
  if (filters.status === "done") {
    filtered = filtered.filter((question) => question.done);
  } else if (filters.status === "todo") {
    filtered = filtered.filter((question) => !question.done);
  }
  return filtered;
}

function setLibraryView(view) {
  if (!elements.notesCard || !elements.starredCard) return;
  const showNotes = view === "all" || view === "notes";
  const showStarred = view === "all" || view === "starred";
  elements.notesCard.style.display = showNotes ? "" : "none";
  elements.starredCard.style.display = showStarred ? "" : "none";
}

function renderSummary(base, notes, starred) {
  if (elements.revisionNotesTotal) {
    elements.revisionNotesTotal.textContent = String(notes.length);
  }
  if (elements.revisionStarredTotal) {
    elements.revisionStarredTotal.textContent = String(starred.length);
  }
  if (elements.revisionTodoTotal) {
    const todoCount = base.filter((question) => !question.done).length;
    elements.revisionTodoTotal.textContent = String(todoCount);
  }
  if (elements.revisionLastDone) {
    const latest = base
      .filter((question) => question.last_done_at)
      .sort((a, b) => String(b.last_done_at).localeCompare(String(a.last_done_at)))[0];
    elements.revisionLastDone.textContent = latest ? formatDate(latest.last_done_at) : "-";
  }
}

function sortQuestions(questions, sortMode) {
  const sorted = [...questions];
  if (sortMode === "alpha") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortMode === "recent") {
    sorted.sort((a, b) => {
      const aKey = a.last_done_at || "";
      const bKey = b.last_done_at || "";
      if (aKey === bKey) {
        return (a.order || 10 ** 9) - (b.order || 10 ** 9);
      }
      return String(bKey).localeCompare(String(aKey));
    });
  } else {
    sorted.sort((a, b) => (a.order || 10 ** 9) - (b.order || 10 ** 9));
  }
  return sorted;
}

function buildFocusQueue(base) {
  const mode = elements.focusMode ? elements.focusMode.value : "mixed";
  let focusItems = [];
  if (mode === "notes") {
    focusItems = base.filter((question) => question.notes && question.notes.trim());
  } else if (mode === "starred") {
    focusItems = base.filter((question) => question.starred);
  } else {
    const map = new Map();
    base.forEach((question) => {
      if ((question.notes && question.notes.trim()) || question.starred) {
        map.set(question.id, question);
      }
    });
    focusItems = Array.from(map.values());
  }

  const sortMode = elements.focusSort ? elements.focusSort.value : "order";
  const limit = elements.focusLimit ? Number(elements.focusLimit.value) || 10 : 10;
  return sortQuestions(focusItems, sortMode).slice(0, limit);
}

function renderFocusCard() {
  if (!elements.focusCard) return;
  const current = state.focusQueue[state.focusIndex];
  elements.focusCard.innerHTML = "";
  if (!current) {
    elements.focusCard.innerHTML =
      '<div class="focus-empty">No focus items yet. Add notes or bookmark questions.</div>';
    if (elements.focusDoneBtn) elements.focusDoneBtn.disabled = true;
    if (elements.focusStarBtn) elements.focusStarBtn.disabled = true;
    if (elements.focusPrevBtn) elements.focusPrevBtn.disabled = true;
    if (elements.focusNextBtn) elements.focusNextBtn.disabled = true;
    if (elements.focusShuffleBtn) elements.focusShuffleBtn.disabled = true;
    return;
  }

  if (elements.focusDoneBtn) {
    elements.focusDoneBtn.disabled = false;
    elements.focusDoneBtn.textContent = current.done ? "Mark todo" : "Mark done";
  }
  if (elements.focusStarBtn) {
    elements.focusStarBtn.disabled = false;
    elements.focusStarBtn.textContent = current.starred ? "Unstar" : "Star";
  }
  if (elements.focusPrevBtn) elements.focusPrevBtn.disabled = false;
  if (elements.focusNextBtn) elements.focusNextBtn.disabled = false;
  if (elements.focusShuffleBtn) elements.focusShuffleBtn.disabled = false;

  const title = document.createElement("div");
  title.className = "focus-title";
  title.textContent = current.title;

  const meta = document.createElement("div");
  meta.className = "focus-meta";
  meta.textContent = formatMeta(current);

  const badges = document.createElement("div");
  badges.className = "focus-badges";
  const difficulty = normalizeDifficulty(current.difficulty);
  if (difficulty && difficulty !== "Unrated") {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = difficulty;
    badges.appendChild(badge);
  }
  if (current.starred) {
    const badge = document.createElement("span");
    badge.className = "badge badge-accent";
    badge.textContent = "Starred";
    badges.appendChild(badge);
  }
  if (current.notes && current.notes.trim()) {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = "Notes";
    badges.appendChild(badge);
  }
  if (current.done) {
    const badge = document.createElement("span");
    badge.className = "badge badge-success";
    badge.textContent = "Done";
    badges.appendChild(badge);
  }

  const notes = document.createElement("div");
  notes.className = "focus-notes";
  notes.textContent = current.notes && current.notes.trim() ? current.notes : "No notes yet.";

  const links = document.createElement("div");
  links.className = "focus-links";
  links.appendChild(buildLinkRow(current));

  elements.focusCard.appendChild(title);
  elements.focusCard.appendChild(meta);
  elements.focusCard.appendChild(badges);
  elements.focusCard.appendChild(notes);
  elements.focusCard.appendChild(links);
}

function renderFocusQueue() {
  if (!elements.focusQueue) return;
  elements.focusQueue.innerHTML = "";
  if (elements.focusCount) {
    elements.focusCount.textContent = `${state.focusQueue.length} items`;
  }
  if (!state.focusQueue.length) {
    elements.focusQueue.innerHTML =
      '<div class="focus-empty">Focus queue is empty for the current filters.</div>';
    return;
  }

  state.focusQueue.forEach((question, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "focus-queue-item" + (index === state.focusIndex ? " active" : "");
    item.addEventListener("click", () => {
      state.focusIndex = index;
      renderFocusQueue();
      renderFocusCard();
    });

    const title = document.createElement("div");
    title.className = "focus-queue-title";
    title.textContent = question.title;

    const meta = document.createElement("div");
    meta.className = "focus-queue-meta";
    meta.textContent = formatMeta(question);

    item.appendChild(title);
    item.appendChild(meta);
    elements.focusQueue.appendChild(item);
  });
}

function renderNotesList(notes) {
  if (!elements.notesList) return;
  elements.notesList.innerHTML = "";
  if (elements.notesCount) {
    elements.notesCount.textContent = `${notes.length} notes`;
  }
  if (!notes.length) {
    elements.notesList.innerHTML =
      '<div class="detail-empty">No notes yet. Add notes on any question.</div>';
    return;
  }
  notes.forEach((question) => {
    elements.notesList.appendChild(buildNotesItem(question));
  });
}

function renderStarredList(starred) {
  if (!elements.starredList) return;
  elements.starredList.innerHTML = "";
  if (elements.starredCount) {
    elements.starredCount.textContent = `${starred.length} starred`;
  }
  if (!starred.length) {
    elements.starredList.innerHTML =
      '<div class="detail-empty">No bookmarked questions yet.</div>';
    return;
  }
  starred.forEach((question) => {
    elements.starredList.appendChild(buildStarredItem(question));
  });
}

function renderLists() {
  const filters = getFilterState();
  const base = applyFilters(state.questions, filters);
  const notes = base.filter((question) => question.notes && question.notes.trim());
  const starred = base.filter((question) => question.starred);

  notes.sort((a, b) => (a.order || 10 ** 9) - (b.order || 10 ** 9));
  starred.sort((a, b) => (a.order || 10 ** 9) - (b.order || 10 ** 9));

  renderSummary(base, notes, starred);
  setLibraryView(filters.view);
  renderNotesList(notes);
  renderStarredList(starred);

  const currentFocusId = state.focusQueue[state.focusIndex]
    ? state.focusQueue[state.focusIndex].id
    : "";
  state.focusQueue = buildFocusQueue(base);
  const nextIndex = currentFocusId
    ? state.focusQueue.findIndex((question) => question.id === currentFocusId)
    : -1;
  state.focusIndex = nextIndex >= 0 ? nextIndex : 0;
  renderFocusQueue();
  renderFocusCard();
}

function handleFocusStep(direction) {
  if (!state.focusQueue.length) return;
  const total = state.focusQueue.length;
  state.focusIndex = (state.focusIndex + direction + total) % total;
  renderFocusQueue();
  renderFocusCard();
}

function handleFocusShuffle() {
  if (!state.focusQueue.length) return;
  const shuffled = [...state.focusQueue];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  state.focusQueue = shuffled;
  state.focusIndex = 0;
  renderFocusQueue();
  renderFocusCard();
}

function bindEvents() {
  if (elements.revisionSearch) {
    elements.revisionSearch.addEventListener("input", renderLists);
  }
  if (elements.revisionView) {
    elements.revisionView.addEventListener("change", renderLists);
  }
  if (elements.revisionUnit) {
    elements.revisionUnit.addEventListener("change", renderLists);
  }
  if (elements.revisionDifficulty) {
    elements.revisionDifficulty.addEventListener("change", renderLists);
  }
  if (elements.revisionStatus) {
    elements.revisionStatus.addEventListener("change", renderLists);
  }
  if (elements.revisionClearBtn) {
    elements.revisionClearBtn.addEventListener("click", () => {
      if (elements.revisionSearch) elements.revisionSearch.value = "";
      if (elements.revisionView) elements.revisionView.value = "all";
      if (elements.revisionUnit) elements.revisionUnit.value = "all";
      if (elements.revisionDifficulty) elements.revisionDifficulty.value = "all";
      if (elements.revisionStatus) elements.revisionStatus.value = "all";
      renderLists();
    });
  }
  if (elements.focusMode) {
    elements.focusMode.addEventListener("change", renderLists);
  }
  if (elements.focusSort) {
    elements.focusSort.addEventListener("change", renderLists);
  }
  if (elements.focusLimit) {
    elements.focusLimit.addEventListener("change", renderLists);
  }
  if (elements.focusPrevBtn) {
    elements.focusPrevBtn.addEventListener("click", () => handleFocusStep(-1));
  }
  if (elements.focusNextBtn) {
    elements.focusNextBtn.addEventListener("click", () => handleFocusStep(1));
  }
  if (elements.focusShuffleBtn) {
    elements.focusShuffleBtn.addEventListener("click", handleFocusShuffle);
  }
  if (elements.focusDoneBtn) {
    elements.focusDoneBtn.addEventListener("click", () => {
      const current = state.focusQueue[state.focusIndex];
      if (!current) return;
      updateDone(current.id, !current.done);
    });
  }
  if (elements.focusStarBtn) {
    elements.focusStarBtn.addEventListener("click", () => {
      const current = state.focusQueue[state.focusIndex];
      if (!current) return;
      updateStar(current.id, !current.starred);
    });
  }
}

async function init() {
  state.sheetList = await fetchSheetList();
  const urlSheet = new URLSearchParams(window.location.search).get("sheet");
  const savedSheet = await fetchActiveSheet();
  state.sheetId = slugifySheet(urlSheet || savedSheet || "");
  if (!state.sheetId || !state.sheetList.find((sheet) => sheet.id === state.sheetId)) {
    state.sheetId = state.sheetList.length ? state.sheetList[0].id : "striver";
  }
  renderSheetTabs();
  bindEvents();
  fetchQuestions();
}

init();
