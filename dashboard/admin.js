const state = {
  sheets: [],
};

const elements = {
  createSheetForm: document.getElementById("createSheetForm"),
  newSheetName: document.getElementById("newSheetName"),
  sheetStatus: document.getElementById("sheetStatus"),
  sheetTableBody: document.getElementById("sheetTableBody"),
  sheetImportForm: document.getElementById("sheetImportForm"),
  sheetImportName: document.getElementById("sheetImportName"),
  sheetNameList: document.getElementById("sheetNameList"),
  sheetImportFormat: document.getElementById("sheetImportFormat"),
  sheetImportFile: document.getElementById("sheetImportFile"),
  sheetImportDelimiter: document.getElementById("sheetImportDelimiter"),
  sheetImportHeader: document.getElementById("sheetImportHeader"),
  sheetImportBtn: document.getElementById("sheetImportBtn"),
  sheetImportStatus: document.getElementById("sheetImportStatus"),
  sheetExportForm: document.getElementById("sheetExportForm"),
  sheetExportSelect: document.getElementById("sheetExportSelect"),
  sheetExportFormat: document.getElementById("sheetExportFormat"),
  sheetExportBtn: document.getElementById("sheetExportBtn"),
  sheetExportStatus: document.getElementById("sheetExportStatus"),
  summaryTotalSheets: document.getElementById("summaryTotalSheets"),
  summarySampleSheets: document.getElementById("summarySampleSheets"),
  summaryCustomSheets: document.getElementById("summaryCustomSheets"),
  summaryTotalQuestions: document.getElementById("summaryTotalQuestions"),
  summaryDoneQuestions: document.getElementById("summaryDoneQuestions"),
  summaryCompletion: document.getElementById("summaryCompletion"),
  summaryCompletionMeta: document.getElementById("summaryCompletionMeta"),
  summaryProgress: document.getElementById("summaryProgress"),
  summaryDifficultyBar: document.getElementById("summaryDifficultyBar"),
  summaryDifficultyLegend: document.getElementById("summaryDifficultyLegend"),
  renameForm: document.getElementById("renameForm"),
  renameSheet: document.getElementById("renameSheet"),
  renameScope: document.getElementById("renameScope"),
  renameFrom: document.getElementById("renameFrom"),
  renameTo: document.getElementById("renameTo"),
  renameStatus: document.getElementById("renameStatus"),
  difficultyForm: document.getElementById("difficultyForm"),
  difficultySheet: document.getElementById("difficultySheet"),
  difficultyUnit: document.getElementById("difficultyUnit"),
  difficultyChapter: document.getElementById("difficultyChapter"),
  difficultyValue: document.getElementById("difficultyValue"),
  difficultyOnlyMissing: document.getElementById("difficultyOnlyMissing"),
  difficultyStatus: document.getElementById("difficultyStatus"),
  labelItem: document.getElementById("labelItem"),
  labelUnit: document.getElementById("labelUnit"),
  labelChapter: document.getElementById("labelChapter"),
  settingsExportBtn: document.getElementById("settingsExportBtn"),
  settingsImportFile: document.getElementById("settingsImportFile"),
  settingsImportBtn: document.getElementById("settingsImportBtn"),
  settingsStatus: document.getElementById("settingsStatus"),
  toggleHeaderSync: document.getElementById("toggleHeaderSync"),
  toggleHeaderRandom: document.getElementById("toggleHeaderRandom"),
  toggleHeaderImport: document.getElementById("toggleHeaderImport"),
  toggleHeaderExport: document.getElementById("toggleHeaderExport"),
  toggleHeaderSettings: document.getElementById("toggleHeaderSettings"),
  toggleHeaderAdmin: document.getElementById("toggleHeaderAdmin"),
  toggleHeaderSheets: document.getElementById("toggleHeaderSheets"),
  toggleHeaderSearch: document.getElementById("toggleHeaderSearch"),
  toggleHeaderFilters: document.getElementById("toggleHeaderFilters"),
  toggleHeaderLastSync: document.getElementById("toggleHeaderLastSync"),
  toggleCompactAdmin: document.getElementById("toggleCompactAdmin"),
  toggleUnitsAdmin: document.getElementById("toggleUnitsAdmin"),
  toggleProgressAdmin: document.getElementById("toggleProgressAdmin"),
  toggleSrAdmin: document.getElementById("toggleSrAdmin"),
  toggleNotesAdmin: document.getElementById("toggleNotesAdmin"),
  toggleDifficultyAdmin: document.getElementById("toggleDifficultyAdmin"),
  toggleZebraAdmin: document.getElementById("toggleZebraAdmin"),
  themeAccent: document.getElementById("themeAccent"),
  themeAccentWarm: document.getElementById("themeAccentWarm"),
  themeSurface: document.getElementById("themeSurface"),
  themeBackground: document.getElementById("themeBackground"),
  resetTheme: document.getElementById("resetTheme"),
  toggleLinkFallback: document.getElementById("toggleLinkFallback"),
  toggleLinkDifficulty: document.getElementById("toggleLinkDifficulty"),
  toggleLinkLeet: document.getElementById("toggleLinkLeet"),
  toggleLinkYT: document.getElementById("toggleLinkYT"),
  toggleLinkWeb: document.getElementById("toggleLinkWeb"),
  leetSuffix: document.getElementById("leetSuffix"),
  ytSuffix: document.getElementById("ytSuffix"),
  webSuffix: document.getElementById("webSuffix"),
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

function normalizeSettings(parsed) {
  const next = parsed ? { ...parsed } : {};
  if (next.showNotes !== undefined && next.showNotesColumn === undefined) {
    next.showNotesColumn = next.showNotes;
  }
  return {
    ...defaultSettings,
    ...next,
    header: { ...defaultSettings.header, ...(next.header || {}) },
    theme: { ...defaultSettings.theme, ...(next.theme || {}) },
    linkFallback: { ...defaultSettings.linkFallback, ...(next.linkFallback || {}) },
    labels: { ...defaultSettings.labels, ...(next.labels || {}) },
  };
}

async function fetchUiSettings() {
  try {
    const response = await fetch("/api/ui-settings");
    if (!response.ok) return { ...defaultSettings };
    const data = await response.json();
    return normalizeSettings(data.settings || {});
  } catch (error) {
    return { ...defaultSettings };
  }
}

let settingsSaveTimer = null;
function scheduleSettingsSave() {
  if (settingsSaveTimer) clearTimeout(settingsSaveTimer);
  settingsSaveTimer = setTimeout(() => {
    persistUiSettings();
  }, 200);
}

async function persistUiSettings() {
  try {
    await fetch("/api/ui-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: uiSettings }),
    });
  } catch (error) {
    // Ignore network errors; settings stay in memory until next save.
  }
}

function saveSettings(settings) {
  uiSettings = settings;
  scheduleSettingsSave();
}

let uiSettings = { ...defaultSettings };
let adminPanelButtons = [];
let adminPanels = [];

async function fetchAdminPanel() {
  try {
    const response = await fetch("/api/admin-state");
    if (!response.ok) return "";
    const data = await response.json();
    return data.panel || "";
  } catch (error) {
    return "";
  }
}

async function saveAdminPanel(panelId) {
  try {
    await fetch("/api/admin-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ panel: panelId }),
    });
  } catch (error) {
    // Ignore network errors; state will sync next time.
  }
}

function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
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

function syncAppearanceForm() {
  const header = uiSettings.header || {};
  if (elements.toggleHeaderSync) elements.toggleHeaderSync.checked = !!header.showSync;
  if (elements.toggleHeaderRandom) elements.toggleHeaderRandom.checked = !!header.showRandom;
  if (elements.toggleHeaderImport) elements.toggleHeaderImport.checked = !!header.showImport;
  if (elements.toggleHeaderExport) elements.toggleHeaderExport.checked = !!header.showExport;
  if (elements.toggleHeaderSettings) elements.toggleHeaderSettings.checked = !!header.showSettings;
  if (elements.toggleHeaderAdmin) elements.toggleHeaderAdmin.checked = !!header.showAdmin;
  if (elements.toggleHeaderSheets) elements.toggleHeaderSheets.checked = !!header.showSheets;
  if (elements.toggleHeaderSearch) elements.toggleHeaderSearch.checked = !!header.showSearch;
  if (elements.toggleHeaderFilters) elements.toggleHeaderFilters.checked = !!header.showFilters;
  if (elements.toggleHeaderLastSync) elements.toggleHeaderLastSync.checked = !!header.showLastSync;

  if (elements.toggleCompactAdmin) elements.toggleCompactAdmin.checked = uiSettings.compact;
  if (elements.toggleUnitsAdmin) elements.toggleUnitsAdmin.checked = uiSettings.showUnits;
  if (elements.toggleProgressAdmin) elements.toggleProgressAdmin.checked = uiSettings.showProgress;
  if (elements.toggleSrAdmin) elements.toggleSrAdmin.checked = uiSettings.showSr;
  if (elements.toggleNotesAdmin) elements.toggleNotesAdmin.checked = uiSettings.showNotesColumn;
  if (elements.toggleDifficultyAdmin) elements.toggleDifficultyAdmin.checked = uiSettings.showDifficulty;
  if (elements.toggleZebraAdmin) elements.toggleZebraAdmin.checked = uiSettings.zebra;

  if (elements.themeAccent) elements.themeAccent.value = uiSettings.theme.accent || getCssVar("--accent");
  if (elements.themeAccentWarm)
    elements.themeAccentWarm.value = uiSettings.theme.accentWarm || getCssVar("--accent-warm");
  if (elements.themeSurface) elements.themeSurface.value = uiSettings.theme.surface || getCssVar("--surface");
  if (elements.themeBackground)
    elements.themeBackground.value = uiSettings.theme.background || getCssVar("--bg");

  if (elements.toggleLinkFallback) elements.toggleLinkFallback.checked = uiSettings.linkFallback.enabled;
  if (elements.toggleLinkDifficulty)
    elements.toggleLinkDifficulty.checked = uiSettings.linkFallback.includeDifficulty;
  if (elements.toggleLinkLeet) elements.toggleLinkLeet.checked = uiSettings.linkFallback.leetcode;
  if (elements.toggleLinkYT) elements.toggleLinkYT.checked = uiSettings.linkFallback.youtube;
  if (elements.toggleLinkWeb) elements.toggleLinkWeb.checked = uiSettings.linkFallback.web;
  if (elements.leetSuffix) elements.leetSuffix.value = uiSettings.linkFallback.leetcodeSuffix || "";
  if (elements.ytSuffix) elements.ytSuffix.value = uiSettings.linkFallback.youtubeSuffix || "";
  if (elements.webSuffix) elements.webSuffix.value = uiSettings.linkFallback.webSuffix || "";

  if (elements.labelItem) elements.labelItem.value = uiSettings.labels.item || "";
  if (elements.labelUnit) elements.labelUnit.value = uiSettings.labels.unit || "";
  if (elements.labelChapter) elements.labelChapter.value = uiSettings.labels.chapter || "";

  if (elements.sheetImportDelimiter) {
    elements.sheetImportDelimiter.value = ",";
  }

  applyTheme();
}

async function fetchSheets() {
  const response = await fetch("/api/sheets");
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return Array.isArray(data.sheets) ? data.sheets : [];
}

function setSheetStatus(message, isError = false) {
  if (!elements.sheetStatus) return;
  elements.sheetStatus.textContent = message;
  elements.sheetStatus.style.color = isError ? "#ff7b7b" : "";
}

function setRenameStatus(message, isError = false) {
  if (!elements.renameStatus) return;
  elements.renameStatus.textContent = message;
  elements.renameStatus.style.color = isError ? "#ff7b7b" : "";
}

function setSheetImportStatus(message, isError = false) {
  if (!elements.sheetImportStatus) return;
  elements.sheetImportStatus.textContent = message;
  elements.sheetImportStatus.style.color = isError ? "#ff7b7b" : "";
}

function setSheetExportStatus(message, isError = false) {
  if (!elements.sheetExportStatus) return;
  elements.sheetExportStatus.textContent = message;
  elements.sheetExportStatus.style.color = isError ? "#ff7b7b" : "";
}

function setSettingsStatus(message, isError = false) {
  if (!elements.settingsStatus) return;
  elements.settingsStatus.textContent = message;
  elements.settingsStatus.style.color = isError ? "#ff7b7b" : "";
}

function confirmTwice(message) {
  if (!confirm(message)) return false;
  return confirm("Please confirm once more to continue.");
}

function setDifficultyStatus(message, isError = false) {
  if (!elements.difficultyStatus) return;
  elements.difficultyStatus.textContent = message;
  elements.difficultyStatus.style.color = isError ? "#ff7b7b" : "";
}

function renderSheetTable() {
  if (!elements.sheetTableBody) return;
  elements.sheetTableBody.innerHTML = "";
  state.sheets.forEach((sheet) => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    const nameWrap = document.createElement("div");
    nameWrap.className = "admin-form";
    const labelInput = document.createElement("input");
    labelInput.className = "admin-input";
    labelInput.value = sheet.label || sheet.id;
    const idNote = document.createElement("div");
    idNote.className = "admin-note";
    idNote.textContent = `ID: ${sheet.id}`;
    nameWrap.appendChild(labelInput);
    nameWrap.appendChild(idNote);
    nameCell.appendChild(nameWrap);

    const countCell = document.createElement("td");
    countCell.textContent = sheet.stats ? sheet.stats.total : 0;

    const progressCell = document.createElement("td");
    const done = sheet.stats ? sheet.stats.done : 0;
    const total = sheet.stats ? sheet.stats.total : 0;
    progressCell.textContent = total ? `${done}/${total}` : "0";

    const difficultyCell = document.createElement("td");
    const diff = sheet.stats ? sheet.stats.difficulty || {} : {};
    const easy = diff.Easy || 0;
    const medium = diff.Medium || 0;
    const hard = diff.Hard || 0;
    const unknown = diff.Unknown || 0;
    difficultyCell.textContent = `E:${easy} M:${medium} H:${hard} U:${unknown}`;

    const actionsCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "admin-actions";

    const openBtn = document.createElement("a");
    openBtn.className = "btn ghost";
    openBtn.href = `/?sheet=${encodeURIComponent(sheet.id)}`;
    openBtn.textContent = "Open";

    const saveBtn = document.createElement("button");
    saveBtn.className = "btn ghost";
    saveBtn.type = "button";
    saveBtn.textContent = "Rename";
    saveBtn.addEventListener("click", async () => {
      const newName = labelInput.value.trim();
      if (!newName) return;
      const response = await fetch(`/api/sheets/${encodeURIComponent(sheet.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (response.ok) {
        await refreshSheets();
      }
    });

    const duplicateBtn = document.createElement("button");
    duplicateBtn.className = "btn ghost";
    duplicateBtn.type = "button";
    duplicateBtn.textContent = "Duplicate";
    duplicateBtn.addEventListener("click", async () => {
      const name = prompt("New sheet name", `${sheet.label || sheet.id} copy`);
      if (!name) return;
      await fetch(`/api/sheets/${encodeURIComponent(sheet.id)}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      await refreshSheets();
    });

    const resetBtn = document.createElement("button");
    resetBtn.className = "btn ghost";
    resetBtn.type = "button";
    resetBtn.textContent = "Reset Progress";
    resetBtn.addEventListener("click", async () => {
      if (!confirmTwice(`Reset progress for ${sheet.label || sheet.id}?`)) return;
      await fetch(`/api/sheets/${encodeURIComponent(sheet.id)}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clear_done: true, clear_notes: false }),
      });
      await refreshSheets();
    });

    const clearNotesBtn = document.createElement("button");
    clearNotesBtn.className = "btn ghost";
    clearNotesBtn.type = "button";
    clearNotesBtn.textContent = "Clear Notes";
    clearNotesBtn.addEventListener("click", async () => {
      if (!confirmTwice(`Clear notes for ${sheet.label || sheet.id}?`)) return;
      await fetch(`/api/sheets/${encodeURIComponent(sheet.id)}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clear_done: false, clear_notes: true }),
      });
      await refreshSheets();
    });

    const regenBtn = document.createElement("button");
    regenBtn.className = "btn ghost";
    regenBtn.type = "button";
    regenBtn.textContent = "Regenerate";
    regenBtn.disabled = sheet.source !== "sample";
    regenBtn.addEventListener("click", async () => {
      if (!confirmTwice(`Rebuild ${sheet.label || sheet.id} from HTML?`)) return;
      await fetch(`/api/sheets/${encodeURIComponent(sheet.id)}/regenerate`, { method: "POST" });
      await refreshSheets();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn ghost";
    deleteBtn.type = "button";
    deleteBtn.textContent = "Delete";
    deleteBtn.disabled = sheet.source === "sample";
    deleteBtn.addEventListener("click", async () => {
      if (!confirmTwice(`Delete ${sheet.label || sheet.id}? This cannot be undone.`)) return;
      await fetch(`/api/sheets/${encodeURIComponent(sheet.id)}`, { method: "DELETE" });
      await refreshSheets();
    });

    actions.appendChild(openBtn);
    actions.appendChild(saveBtn);
    actions.appendChild(duplicateBtn);
    actions.appendChild(resetBtn);
    actions.appendChild(clearNotesBtn);
    actions.appendChild(regenBtn);
    actions.appendChild(deleteBtn);
    actionsCell.appendChild(actions);

    row.appendChild(nameCell);
    row.appendChild(countCell);
    row.appendChild(progressCell);
    row.appendChild(difficultyCell);
    row.appendChild(actionsCell);
    elements.sheetTableBody.appendChild(row);
  });
}

function renderSummary() {
  const totalSheets = state.sheets.length;
  const sampleSheets = state.sheets.filter((sheet) => sheet.source === "sample").length;
  const customSheets = totalSheets - sampleSheets;
  const totalQuestions = state.sheets.reduce(
    (acc, sheet) => acc + (sheet.stats?.total || 0),
    0
  );
  const doneQuestions = state.sheets.reduce(
    (acc, sheet) => acc + (sheet.stats?.done || 0),
    0
  );
  const completion = totalQuestions ? Math.round((doneQuestions / totalQuestions) * 100) : 0;
  const difficulty = { Easy: 0, Medium: 0, Hard: 0, Unknown: 0 };
  state.sheets.forEach((sheet) => {
    const diff = sheet.stats?.difficulty || {};
    difficulty.Easy += diff.Easy || 0;
    difficulty.Medium += diff.Medium || 0;
    difficulty.Hard += diff.Hard || 0;
    difficulty.Unknown += diff.Unknown || 0;
  });

  if (elements.summaryTotalSheets) elements.summaryTotalSheets.textContent = totalSheets;
  if (elements.summarySampleSheets) {
    elements.summarySampleSheets.textContent = `${sampleSheets} samples`;
  }
  if (elements.summaryCustomSheets) {
    elements.summaryCustomSheets.textContent = `${customSheets} custom`;
  }
  if (elements.summaryTotalQuestions) {
    elements.summaryTotalQuestions.textContent = totalQuestions;
  }
  if (elements.summaryDoneQuestions) {
    elements.summaryDoneQuestions.textContent = `${doneQuestions} done`;
  }
  if (elements.summaryCompletion) {
    elements.summaryCompletion.textContent = `${completion}%`;
  }
  if (elements.summaryCompletionMeta) {
    elements.summaryCompletionMeta.textContent = `${doneQuestions} of ${totalQuestions}`;
  }
  if (elements.summaryProgress) {
    elements.summaryProgress.style.width = `${completion}%`;
  }

  if (elements.summaryDifficultyBar) {
    const totalDiff =
      difficulty.Easy + difficulty.Medium + difficulty.Hard + difficulty.Unknown;
    const segments = [
      { key: "Easy", className: "diff-easy" },
      { key: "Medium", className: "diff-medium" },
      { key: "Hard", className: "diff-hard" },
      { key: "Unknown", className: "diff-unknown" },
    ];
    segments.forEach((segment) => {
      const span = elements.summaryDifficultyBar.querySelector(`.${segment.className}`);
      if (!span) return;
      const value = difficulty[segment.key] || 0;
      const width = totalDiff ? (value / totalDiff) * 100 : 0;
      span.style.width = `${width}%`;
      span.title = `${segment.key}: ${value}`;
    });
  }

  if (elements.summaryDifficultyLegend) {
    elements.summaryDifficultyLegend.innerHTML = "";
    [
      ["Easy", difficulty.Easy, "diff-easy"],
      ["Medium", difficulty.Medium, "diff-medium"],
      ["Hard", difficulty.Hard, "diff-hard"],
      ["Unknown", difficulty.Unknown, "diff-unknown"],
    ].forEach(([label, value, className]) => {
      const item = document.createElement("span");
      item.className = `difficulty-pill ${className}`;
      item.textContent = `${label}: ${value}`;
      elements.summaryDifficultyLegend.appendChild(item);
    });
  }
}

function renderSheetSelects() {
  const selects = [
    elements.renameSheet,
    elements.difficultySheet,
    elements.sheetExportSelect,
  ].filter(Boolean);
  selects.forEach((select) => {
    select.innerHTML = "";
    state.sheets.forEach((sheet) => {
      const option = document.createElement("option");
      option.value = sheet.id;
      option.textContent = sheet.label || sheet.id;
      select.appendChild(option);
    });
  });
}

function renderSheetNameList() {
  if (!elements.sheetNameList) return;
  elements.sheetNameList.innerHTML = "";
  state.sheets.forEach((sheet) => {
    const option = document.createElement("option");
    option.value = sheet.label || sheet.id;
    elements.sheetNameList.appendChild(option);
  });
}

function normalizeDelimiter(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return ",";
  if (trimmed === "\\t" || trimmed.toLowerCase() === "tab") return "\t";
  return trimmed;
}

async function handleSheetImport() {
  if (!elements.sheetImportName || !elements.sheetImportFile) return;
  const nameValue = elements.sheetImportName.value.trim();
  if (!nameValue) {
    setSheetImportStatus("Enter a sheet name to import into.", true);
    return;
  }
  let sheetId = null;
  const match = state.sheets.find(
    (sheet) =>
      sheet.id.toLowerCase() === nameValue.toLowerCase() ||
      (sheet.label || "").toLowerCase() === nameValue.toLowerCase()
  );
  if (match) {
    sheetId = match.id;
    if (!confirmTwice(`Import into existing sheet ${match.label || match.id}?`)) {
      return;
    }
  } else {
    const response = await fetch("/api/sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameValue }),
    });
    if (!response.ok) {
      setSheetImportStatus("Could not create the sheet.", true);
      return;
    }
    const entry = await response.json();
    sheetId = entry.id;
  }

  const files = elements.sheetImportFile.files;
  if (!files || !files.length) {
    setSheetImportStatus("Choose a CSV or Excel file.", true);
    return;
  }
  const formatChoice = elements.sheetImportFormat ? elements.sheetImportFormat.value : "auto";
  const filename = files[0].name.toLowerCase();
  let warning = "";
  if (
    formatChoice === "csv" &&
    !filename.endsWith(".csv") &&
    !filename.endsWith(".tsv")
  ) {
    warning = "Format set to CSV but file is not .csv.";
  }
  if (
    formatChoice === "excel" &&
    !filename.endsWith(".xlsx") &&
    !filename.endsWith(".xlsm")
  ) {
    warning = "Format set to Excel but file is not .xlsx.";
  }
  const formData = new FormData();
  formData.append("file", files[0]);
  if (elements.sheetImportDelimiter) {
    formData.append("delimiter", normalizeDelimiter(elements.sheetImportDelimiter.value));
  }
  if (elements.sheetImportHeader) {
    formData.append("header", elements.sheetImportHeader.value);
  }
  setSheetImportStatus("Importing...");
  const response = await fetch(`/api/import-table?sheet=${encodeURIComponent(sheetId)}`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    setSheetImportStatus("Import failed.", true);
    return;
  }
  setSheetImportStatus(warning ? `Import complete. ${warning}` : "Import complete.");
  if (elements.sheetImportFile) elements.sheetImportFile.value = "";
  await refreshSheets();
}

async function downloadSheetExport(formatOverride) {
  if (!elements.sheetExportSelect) return;
  const sheetId = elements.sheetExportSelect.value;
  if (!sheetId) return;
  const format =
    formatOverride ||
    (elements.sheetExportFormat ? elements.sheetExportFormat.value : "csv");
  const response = await fetch(`/api/export?format=${format}&sheet=${encodeURIComponent(sheetId)}`);
  if (!response.ok) return;
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const sheet = state.sheets.find((item) => item.id === sheetId);
  const label = sheet?.label || sheetId;
  const fileBase = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  link.href = url;
  link.download = `${fileBase}-export.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setSheetExportStatus(`Exported ${label}.`);
}

async function refreshSheets() {
  state.sheets = await fetchSheets();
  renderSheetTable();
  renderSheetSelects();
  renderSheetNameList();
  renderSummary();
}

function bindEvents() {
  if (elements.createSheetForm) {
    elements.createSheetForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = elements.newSheetName ? elements.newSheetName.value.trim() : "";
      if (!name) {
        setSheetStatus("Enter a sheet name.", true);
        return;
      }
      const response = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        setSheetStatus("Failed to create sheet.", true);
        return;
      }
      setSheetStatus("Sheet created.");
      if (elements.newSheetName) elements.newSheetName.value = "";
      await refreshSheets();
    });
  }

  if (elements.renameForm) {
    elements.renameForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const sheet = elements.renameSheet ? elements.renameSheet.value : "";
      const scope = elements.renameScope ? elements.renameScope.value : "unit";
      const from = elements.renameFrom ? elements.renameFrom.value.trim() : "";
      const to = elements.renameTo ? elements.renameTo.value.trim() : "";
      if (!from || !to) {
        setRenameStatus("Provide both current and new names.", true);
        return;
      }
      const response = await fetch("/api/refactor/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheet, scope, from, to }),
      });
      if (!response.ok) {
        setRenameStatus("Rename failed.", true);
        return;
      }
      setRenameStatus("Rename applied.");
      if (elements.renameFrom) elements.renameFrom.value = "";
      if (elements.renameTo) elements.renameTo.value = "";
    });
  }

  if (elements.difficultyForm) {
    elements.difficultyForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const sheet = elements.difficultySheet ? elements.difficultySheet.value : "";
      const unit = elements.difficultyUnit ? elements.difficultyUnit.value.trim() : "";
      const chapter = elements.difficultyChapter ? elements.difficultyChapter.value.trim() : "";
      const difficulty = elements.difficultyValue ? elements.difficultyValue.value : "";
      const onlyMissing = elements.difficultyOnlyMissing
        ? elements.difficultyOnlyMissing.checked
        : false;
      if (!difficulty) {
        setDifficultyStatus("Select a difficulty.", true);
        return;
      }
      const response = await fetch("/api/refactor/difficulty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheet, unit, chapter, difficulty, only_missing: onlyMissing }),
      });
      if (!response.ok) {
        setDifficultyStatus("Difficulty update failed.", true);
        return;
      }
      setDifficultyStatus("Difficulty updated.");
      await refreshSheets();
    });
  }

  if (elements.sheetImportBtn) {
    elements.sheetImportBtn.addEventListener("click", handleSheetImport);
  }

  if (elements.sheetExportBtn) {
    elements.sheetExportBtn.addEventListener("click", () => {
      downloadSheetExport();
    });
  }

  const headerBindings = [
    [elements.toggleHeaderSync, "showSync"],
    [elements.toggleHeaderRandom, "showRandom"],
    [elements.toggleHeaderImport, "showImport"],
    [elements.toggleHeaderExport, "showExport"],
    [elements.toggleHeaderSettings, "showSettings"],
    [elements.toggleHeaderAdmin, "showAdmin"],
    [elements.toggleHeaderSheets, "showSheets"],
    [elements.toggleHeaderSearch, "showSearch"],
    [elements.toggleHeaderFilters, "showFilters"],
    [elements.toggleHeaderLastSync, "showLastSync"],
  ];

  headerBindings.forEach(([el, key]) => {
    if (!el) return;
    el.addEventListener("change", () => {
      uiSettings.header[key] = el.checked;
      saveSettings(uiSettings);
      applyTheme();
    });
  });

  const toggleBindings = [
    [elements.toggleCompactAdmin, "compact"],
    [elements.toggleUnitsAdmin, "showUnits"],
    [elements.toggleProgressAdmin, "showProgress"],
    [elements.toggleSrAdmin, "showSr"],
    [elements.toggleNotesAdmin, "showNotesColumn"],
    [elements.toggleDifficultyAdmin, "showDifficulty"],
    [elements.toggleZebraAdmin, "zebra"],
  ];

  toggleBindings.forEach(([el, key]) => {
    if (!el) return;
    el.addEventListener("change", () => {
      uiSettings[key] = el.checked;
      saveSettings(uiSettings);
      applyTheme();
    });
  });

  const themeBindings = [
    [elements.themeAccent, "accent"],
    [elements.themeAccentWarm, "accentWarm"],
    [elements.themeSurface, "surface"],
    [elements.themeBackground, "background"],
  ];

  themeBindings.forEach(([el, key]) => {
    if (!el) return;
    el.addEventListener("input", () => {
      uiSettings.theme[key] = el.value;
      saveSettings(uiSettings);
      applyTheme();
    });
  });

  if (elements.resetTheme) {
    elements.resetTheme.addEventListener("click", () => {
      uiSettings.theme = { ...defaultSettings.theme };
      saveSettings(uiSettings);
      applyTheme();
      syncAppearanceForm();
    });
  }

  if (elements.toggleLinkFallback) {
    elements.toggleLinkFallback.addEventListener("change", () => {
      uiSettings.linkFallback.enabled = elements.toggleLinkFallback.checked;
      saveSettings(uiSettings);
    });
  }

  if (elements.toggleLinkDifficulty) {
    elements.toggleLinkDifficulty.addEventListener("change", () => {
      uiSettings.linkFallback.includeDifficulty = elements.toggleLinkDifficulty.checked;
      saveSettings(uiSettings);
    });
  }

  if (elements.toggleLinkLeet) {
    elements.toggleLinkLeet.addEventListener("change", () => {
      uiSettings.linkFallback.leetcode = elements.toggleLinkLeet.checked;
      saveSettings(uiSettings);
    });
  }

  if (elements.toggleLinkYT) {
    elements.toggleLinkYT.addEventListener("change", () => {
      uiSettings.linkFallback.youtube = elements.toggleLinkYT.checked;
      saveSettings(uiSettings);
    });
  }

  if (elements.toggleLinkWeb) {
    elements.toggleLinkWeb.addEventListener("change", () => {
      uiSettings.linkFallback.web = elements.toggleLinkWeb.checked;
      saveSettings(uiSettings);
    });
  }

  if (elements.leetSuffix) {
    elements.leetSuffix.addEventListener("input", () => {
      uiSettings.linkFallback.leetcodeSuffix = elements.leetSuffix.value;
      saveSettings(uiSettings);
    });
  }

  if (elements.ytSuffix) {
    elements.ytSuffix.addEventListener("input", () => {
      uiSettings.linkFallback.youtubeSuffix = elements.ytSuffix.value;
      saveSettings(uiSettings);
    });
  }

  if (elements.webSuffix) {
    elements.webSuffix.addEventListener("input", () => {
      uiSettings.linkFallback.webSuffix = elements.webSuffix.value;
      saveSettings(uiSettings);
    });
  }

  const labelBindings = [
    [elements.labelItem, "item"],
    [elements.labelUnit, "unit"],
    [elements.labelChapter, "chapter"],
  ];
  labelBindings.forEach(([el, key]) => {
    if (!el) return;
    el.addEventListener("input", () => {
      uiSettings.labels[key] = el.value.trim() || defaultSettings.labels[key];
      saveSettings(uiSettings);
    });
  });

  adminPanelButtons = Array.from(document.querySelectorAll(".admin-nav-btn"));
  adminPanels = Array.from(document.querySelectorAll(".admin-panel"));
  adminPanelButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActivePanel(button.dataset.panel, adminPanelButtons, adminPanels);
    });
  });

  document.querySelectorAll("[data-panel-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      setActivePanel(button.dataset.panelJump, adminPanelButtons, adminPanels);
    });
  });

  if (elements.settingsExportBtn) {
    elements.settingsExportBtn.addEventListener("click", () => {
      const payload = JSON.stringify(uiSettings, null, 2);
      const blob = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "dsa-practice-settings.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setSettingsStatus("Settings exported.");
    });
  }

  if (elements.settingsImportBtn) {
    elements.settingsImportBtn.addEventListener("click", () => {
      if (elements.settingsImportFile) {
        elements.settingsImportFile.click();
      }
    });
  }

  if (elements.settingsImportFile) {
    elements.settingsImportFile.addEventListener("change", async () => {
      const file = elements.settingsImportFile.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        uiSettings = {
          ...defaultSettings,
          ...parsed,
          header: { ...defaultSettings.header, ...(parsed.header || {}) },
          theme: { ...defaultSettings.theme, ...(parsed.theme || {}) },
          linkFallback: { ...defaultSettings.linkFallback, ...(parsed.linkFallback || {}) },
          labels: { ...defaultSettings.labels, ...(parsed.labels || {}) },
        };
        saveSettings(uiSettings);
        syncAppearanceForm();
        setSettingsStatus("Settings imported.");
      } catch (error) {
        setSettingsStatus("Invalid settings file.", true);
      } finally {
        elements.settingsImportFile.value = "";
      }
    });
  }
}

function setActivePanel(panelId, buttons, panels) {
  if (!panelId) return;
  const hasPanel = Array.from(panels).some((panel) => panel.dataset.panel === panelId);
  const activeId = hasPanel ? panelId : panels[0]?.dataset.panel;
  if (!activeId) return;
  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === activeId);
  });
  buttons.forEach((button) => {
    button.classList.toggle("active", button.dataset.panel === activeId);
  });
  saveAdminPanel(activeId);
}

async function init() {
  uiSettings = await fetchUiSettings();
  syncAppearanceForm();
  bindEvents();
  const savedPanel = await fetchAdminPanel();
  if (savedPanel && adminPanelButtons.length && adminPanels.length) {
    setActivePanel(savedPanel, adminPanelButtons, adminPanels);
  }
  await refreshSheets();
}

init();
