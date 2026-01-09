const state = {
  sheetList: [],
  sheetId: "",
  questions: [],
};

const elements = {
  sheetTabs: document.getElementById("sheetTabs"),
  notesSearch: document.getElementById("notesSearch"),
  starredSearch: document.getElementById("starredSearch"),
  notesList: document.getElementById("notesList"),
  starredList: document.getElementById("starredList"),
  notesCount: document.getElementById("notesCount"),
  starredCount: document.getElementById("starredCount"),
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
  renderLists();
}

function formatMeta(question) {
  const unit = question.unit || question.step || "Unassigned";
  const chapter = question.chapter || question.lesson || question.group || "General";
  const sr = question.order ? `#${question.order}` : "#-";
  return `${sr} · ${unit} / ${chapter}`;
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

function renderNotesList(notes, query) {
  if (!elements.notesList) return;
  elements.notesList.innerHTML = "";
  const filtered = query
    ? notes.filter((q) => {
        const text = (q.notes || "").toLowerCase();
        return q.title.toLowerCase().includes(query) || text.includes(query);
      })
    : notes;
  if (elements.notesCount) {
    elements.notesCount.textContent = `${filtered.length} notes`;
  }
  if (!filtered.length) {
    elements.notesList.innerHTML =
      '<div class="detail-empty">No notes yet. Add notes on any question.</div>';
    return;
  }
  filtered.forEach((question) => {
    elements.notesList.appendChild(buildNotesItem(question));
  });
}

function renderStarredList(starred, query) {
  if (!elements.starredList) return;
  elements.starredList.innerHTML = "";
  const filtered = query
    ? starred.filter((q) => {
        const unit = (q.unit || q.step || "").toLowerCase();
        return q.title.toLowerCase().includes(query) || unit.includes(query);
      })
    : starred;
  if (elements.starredCount) {
    elements.starredCount.textContent = `${filtered.length} starred`;
  }
  if (!filtered.length) {
    elements.starredList.innerHTML =
      '<div class="detail-empty">No bookmarked questions yet.</div>';
    return;
  }
  filtered.forEach((question) => {
    elements.starredList.appendChild(buildStarredItem(question));
  });
}

function renderLists() {
  const notesQuery = elements.notesSearch
    ? elements.notesSearch.value.trim().toLowerCase()
    : "";
  const starredQuery = elements.starredSearch
    ? elements.starredSearch.value.trim().toLowerCase()
    : "";

  const notes = state.questions.filter((q) => q.notes && q.notes.trim());
  const starred = state.questions.filter((q) => q.starred);

  notes.sort((a, b) => (a.order || 10 ** 9) - (b.order || 10 ** 9));
  starred.sort((a, b) => (a.order || 10 ** 9) - (b.order || 10 ** 9));

  renderNotesList(notes, notesQuery);
  renderStarredList(starred, starredQuery);
}

function bindEvents() {
  if (elements.notesSearch) {
    elements.notesSearch.addEventListener("input", renderLists);
  }
  if (elements.starredSearch) {
    elements.starredSearch.addEventListener("input", renderLists);
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
