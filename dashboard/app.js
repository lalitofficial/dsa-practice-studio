const state = {
  questions: [],
  filtered: [],
  stats: null,
  updatedAt: "",
  selectedId: null,
  unitStatus: {},
  unitIndex: { units: [], map: new Map() },
  notesOpen: false,
};

const elements = {
  searchInput: document.getElementById("searchInput"),
  stepFilter: document.getElementById("stepFilter"),
  chapterFilter: document.getElementById("chapterFilter"),
  statusFilter: document.getElementById("statusFilter"),
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
  syncBtn: document.getElementById("syncBtn"),
  randomBtn: document.getElementById("randomBtn"),
  settingsBtn: document.getElementById("settingsBtn"),
  settingsPanel: document.getElementById("settingsPanel"),
  toggleCompact: document.getElementById("toggleCompact"),
  toggleUnits: document.getElementById("toggleUnits"),
  toggleNotes: document.getElementById("toggleNotes"),
  toggleProgress: document.getElementById("toggleProgress"),
  toggleSr: document.getElementById("toggleSr"),
  toggleZebra: document.getElementById("toggleZebra"),
};

const defaultSettings = {
  compact: false,
  showUnits: true,
  showNotesColumn: true,
  showProgress: true,
  showSr: true,
  zebra: false,
};

let uiSettings = loadSettings();
applySettings();

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
    return { ...defaultSettings, ...parsed };
  } catch (error) {
    return { ...defaultSettings };
  }
}

function saveSettings() {
  localStorage.setItem("a2z_settings", JSON.stringify(uiSettings));
}

function applySettings() {
  document.body.classList.toggle("compact", uiSettings.compact);
  document.body.classList.toggle("hide-units", !uiSettings.showUnits);
  document.body.classList.toggle("hide-notes", !uiSettings.showNotesColumn);
  document.body.classList.toggle("hide-progress", !uiSettings.showProgress);
  document.body.classList.toggle("hide-sr", !uiSettings.showSr);
  document.body.classList.toggle("zebra-rows", uiSettings.zebra);
  if (elements.toggleCompact) elements.toggleCompact.checked = uiSettings.compact;
  if (elements.toggleUnits) elements.toggleUnits.checked = uiSettings.showUnits;
  if (elements.toggleNotes) elements.toggleNotes.checked = uiSettings.showNotesColumn;
  if (elements.toggleProgress) elements.toggleProgress.checked = uiSettings.showProgress;
  if (elements.toggleSr) elements.toggleSr.checked = uiSettings.showSr;
  if (elements.toggleZebra) elements.toggleZebra.checked = uiSettings.zebra;
  if (!uiSettings.showNotesColumn) closeNotes();
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
  let value = index;
  let letters = "";
  while (value > 0) {
    value -= 1;
    letters = String.fromCharCode(65 + (value % 26)) + letters;
    value = Math.floor(value / 26);
  }
  return letters;
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
  const response = await fetch("/api/questions");
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
  buildChapterOptions();
  applyFilters();
  renderStats();
  renderUnits();
  updateLastSync();
}

function buildUnitOptions() {
  const units = state.unitIndex.units;
  const current = elements.stepFilter.value || "all";
  elements.stepFilter.innerHTML = '<option value="all">All units</option>';
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
  elements.chapterFilter.innerHTML = '<option value="all">All chapters</option>';
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

function applyFilters() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const unitFilter = elements.stepFilter.value;
  const chapterFilter = elements.chapterFilter.value;
  const status = elements.statusFilter.value;

  state.filtered = state.questions.filter((q) => {
    const unit = q.unit || q.step;
    const chapter = q.chapter || q.lesson || q.group || "General";
    if (unitFilter !== "all" && unit !== unitFilter) return false;
    if (chapterFilter !== "all" && chapter !== chapterFilter) return false;
    if (status === "done" && !q.done) return false;
    if (status === "todo" && q.done) return false;
    if (query) {
      const inTitle = q.title.toLowerCase().includes(query);
      const inId = q.id.includes(query);
      return inTitle || inId;
    }
    return true;
  });

  state.filtered.sort((a, b) => (a.order || 10 ** 9) - (b.order || 10 ** 9));

  renderList();
  elements.resultCount.textContent = `${state.filtered.length} results`;
  elements.panelCount.textContent = String(state.filtered.length);
  updatePanelHeader(unitFilter, chapterFilter, status, query);
  updateListProgress();
}

function updatePanelHeader(unitFilter, chapterFilter, status, query) {
  if (!elements.panelTitle || !elements.panelSubtitle) return;

  let title = "Questions";
  const subtitleParts = [];

  if (query) {
    title = `Search: ${query}`;
    subtitleParts.push(`Search "${query}"`);
  }

  if (unitFilter !== "all") {
    const badge = getUnitBadge(unitFilter);
    const unitLabel = badge ? `Unit ${badge}` : "Unit";
    title = `Questions in ${unitLabel} · ${unitFilter}`;
    subtitleParts.push(unitLabel);
  }

  if (chapterFilter !== "all") {
    if (unitFilter !== "all") {
      title = `${title} / ${chapterFilter}`;
    } else {
      title = `Questions in Chapter ${chapterFilter}`;
    }
    subtitleParts.push(`Chapter ${chapterFilter}`);
  }

  if (status !== "all") {
    subtitleParts.push(`Status ${status}`);
  }

  elements.panelTitle.textContent = title;
  elements.panelSubtitle.textContent = subtitleParts.length
    ? subtitleParts.join(" · ")
    : "All questions from the sheet.";
}

function updateListProgress() {
  if (!elements.listProgressBar) return;
  const total = state.filtered.length;
  const done = state.filtered.filter((q) => q.done).length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  elements.listProgressBar.style.width = `${percent}%`;
}

function renderList() {
  elements.questionList.innerHTML = "";

  if (!state.filtered.length) {
    elements.questionList.innerHTML =
      '<div class="detail-empty">No questions match your filters.</div>';
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
  const shouldExpand =
    unitFilter !== "all" || chapterFilter !== "all" || status !== "all" || query;

  orderedUnits.forEach((unit) => {
    const group = unitMap.get(unit);
    if (!group) return;
    const details = document.createElement("details");
    details.className = "unit-group";
    details.open = shouldExpand || orderedUnits.length === 1;

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
    thead.innerHTML = `
      <tr>
        <th data-col="done">Done</th>
        <th data-col="sr">SR</th>
        <th>Question</th>
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
      chapterCell.colSpan = 5;
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

  const srCell = document.createElement("td");
  srCell.dataset.col = "sr";
  srCell.innerHTML = q.order ? `<span class="sr-badge">${q.order}</span>` : "-";

  const titleCell = document.createElement("td");
  titleCell.textContent = q.title;

  const linksCell = document.createElement("td");
  const links = document.createElement("div");
  links.className = "link-icons";
  links.appendChild(makeLink("LC", q.leetcode_url || q.url || ""));
  links.appendChild(makeLink("YT", q.youtube_url || ""));
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
  row.appendChild(srCell);
  row.appendChild(titleCell);
  row.appendChild(linksCell);
  row.appendChild(noteCell);

  return row;
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

function updateLastSync() {
  elements.lastSync.textContent = state.updatedAt
    ? `Last sync: ${formatDate(state.updatedAt)}`
    : "Last sync: -";
}

function renderStats() {
  updateListProgress();
}

async function updateDone(id, done) {
  const response = await fetch(`/api/questions/${encodeURIComponent(id)}/done`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ done }),
  });
  if (!response.ok) return;
  const data = await response.json();
  applyUpdate(data);
}

async function updateUnitStatus(unit, done) {
  const response = await fetch(`/api/units/${encodeURIComponent(unit)}/done`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ done }),
  });
  if (!response.ok) return;
  state.unitStatus[unit] = { done };
  renderUnits();
}

async function updateNote(id, note) {
  const response = await fetch(`/api/questions/${encodeURIComponent(id)}/note`, {
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
  const response = await fetch("/api/sync", { method: "POST" });
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

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.notesOpen) {
      closeNotes();
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

  if (elements.toggleZebra) {
    elements.toggleZebra.addEventListener("change", () => {
      uiSettings.zebra = elements.toggleZebra.checked;
      saveSettings();
      applySettings();
    });
  }
}

bindEvents();
fetchQuestions();
