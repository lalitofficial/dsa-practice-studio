const state = {
  sheets: [],
  insights: null,
  health: null,
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
  saveSheetNamesBtn: document.getElementById("saveSheetNamesBtn"),
  sheetBulkAction: document.getElementById("sheetBulkAction"),
  sheetBulkApply: document.getElementById("sheetBulkApply"),
  sheetSelectionCount: document.getElementById("sheetSelectionCount"),
  sheetSelectAll: document.getElementById("sheetSelectAll"),
  summaryTotalSheets: document.getElementById("summaryTotalSheets"),
  summarySampleSheets: document.getElementById("summarySampleSheets"),
  summaryCustomSheets: document.getElementById("summaryCustomSheets"),
  summaryTotalQuestions: document.getElementById("summaryTotalQuestions"),
  summaryDoneQuestions: document.getElementById("summaryDoneQuestions"),
  summaryCompletion: document.getElementById("summaryCompletion"),
  summaryCompletionMeta: document.getElementById("summaryCompletionMeta"),
  summaryLastActivity: document.getElementById("summaryLastActivity"),
  summaryFocusTotal: document.getElementById("summaryFocusTotal"),
  summaryStarred: document.getElementById("summaryStarred"),
  summaryNotes: document.getElementById("summaryNotes"),
  summaryTodo: document.getElementById("summaryTodo"),
  summaryProgress: document.getElementById("summaryProgress"),
  summaryDifficultyBar: document.getElementById("summaryDifficultyBar"),
  summaryDifficultyLegend: document.getElementById("summaryDifficultyLegend"),
  momentumChart: document.getElementById("momentumChart"),
  momentumMeta: document.getElementById("momentumMeta"),
  sheetHealth: document.getElementById("sheetHealth"),
  activityHeatmap: document.getElementById("activityHeatmap"),
  activityLegend: document.getElementById("activityLegend"),
  heatmapScope: document.getElementById("heatmapScope"),
  healthList: document.getElementById("healthList"),
  healthStatus: document.getElementById("healthStatus"),
  downloadDiagnosticsBtn: document.getElementById("downloadDiagnosticsBtn"),
  refreshHealthBtn: document.getElementById("refreshHealthBtn"),
  resetUiBtn: document.getElementById("resetUiBtn"),
  resetViewBtn: document.getElementById("resetViewBtn"),
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
  toggleWidgetClock: document.getElementById("toggleWidgetClock"),
  toggleWidgetTimer: document.getElementById("toggleWidgetTimer"),
  toggleWidgetStopwatch: document.getElementById("toggleWidgetStopwatch"),
  widgetTimerMinutes: document.getElementById("widgetTimerMinutes"),
  resetWidgetPosition: document.getElementById("resetWidgetPosition"),
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
  widgetSettings: {
    showClock: false,
    showTimer: false,
    showStopwatch: false,
    timerMinutes: 25,
    timerSeconds: 0,
  },
};
let settingsSaveTimer = null;
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
    widgetSettings: { ...defaultSettings.widgetSettings, ...(next.widgetSettings || {}) },
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
  if (elements.toggleWidgetClock)
    elements.toggleWidgetClock.checked = uiSettings.widgetSettings?.showClock ?? false;
  if (elements.toggleWidgetTimer)
    elements.toggleWidgetTimer.checked = uiSettings.widgetSettings?.showTimer ?? false;
  if (elements.toggleWidgetStopwatch)
    elements.toggleWidgetStopwatch.checked = uiSettings.widgetSettings?.showStopwatch ?? false;
  if (elements.widgetTimerMinutes) {
    elements.widgetTimerMinutes.value = String(
      uiSettings.widgetSettings?.timerMinutes || defaultSettings.widgetSettings.timerMinutes
    );
  }

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

async function fetchAdminInsights() {
  const response = await fetch("/api/admin/insights");
  if (!response.ok) {
    return null;
  }
  return response.json();
}

async function fetchHealth() {
  const response = await fetch("/api/health");
  if (!response.ok) {
    return null;
  }
  return response.json();
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
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

function setHealthStatus(message, isError = false) {
  if (!elements.healthStatus) return;
  elements.healthStatus.textContent = message;
  elements.healthStatus.style.color = isError ? "#ff7b7b" : "";
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

function createIconButton({ title, icon, onClick, href, disabled, className }) {
  const button = document.createElement(href ? "a" : "button");
  button.className = `btn icon-btn icon-sm${className ? ` ${className}` : ""}`;
  button.setAttribute("aria-label", title);
  button.setAttribute("title", title);
  if (href) {
    button.href = href;
  } else {
    button.type = "button";
  }
  if (icon) {
    button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg>`;
  }
  if (disabled) {
    button.setAttribute("disabled", "disabled");
  }
  if (onClick) {
    button.addEventListener("click", onClick);
  }
  return button;
}

function getSheetCheckboxes() {
  return Array.from(document.querySelectorAll(".sheet-select"));
}

function updateSelectionCount() {
  const checkboxes = getSheetCheckboxes();
  const selected = checkboxes.filter((input) => input.checked);
  if (elements.sheetSelectionCount) {
    elements.sheetSelectionCount.textContent = `${selected.length} selected`;
  }
  if (elements.sheetSelectAll) {
    elements.sheetSelectAll.checked = selected.length > 0 && selected.length === checkboxes.length;
    elements.sheetSelectAll.indeterminate =
      selected.length > 0 && selected.length < checkboxes.length;
  }
}

function renderSheetTable() {
  if (!elements.sheetTableBody) return;
  elements.sheetTableBody.innerHTML = "";
  state.sheets.forEach((sheet) => {
    const row = document.createElement("tr");

    const selectCell = document.createElement("td");
    const selectBox = document.createElement("input");
    selectBox.type = "checkbox";
    selectBox.className = "admin-checkbox sheet-select";
    selectBox.dataset.sheetId = sheet.id;
    selectBox.dataset.source = sheet.source || "custom";
    selectBox.addEventListener("change", updateSelectionCount);
    selectCell.appendChild(selectBox);

    const nameCell = document.createElement("td");
    const nameWrap = document.createElement("div");
    nameWrap.className = "admin-form";
    const labelInput = document.createElement("input");
    labelInput.className = "admin-input";
    labelInput.value = sheet.label || sheet.id;
    labelInput.dataset.sheetId = sheet.id;
    labelInput.dataset.originalLabel = sheet.label || sheet.id;
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

    const openBtn = createIconButton({
      title: "Open sheet",
      href: `/?sheet=${encodeURIComponent(sheet.id)}`,
      icon:
        '<path d="M14 4h6v6M10 14l10-10M20 14v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h6" />',
    });

    const duplicateBtn = createIconButton({
      title: "Duplicate sheet",
      icon:
        '<path d="M8 8h10v10H8z"/><path d="M4 4h10v10H4z" />',
      onClick: async () => {
        const name = prompt("New sheet name", `${sheet.label || sheet.id} copy`);
        if (!name) return;
        await fetch(`/api/sheets/${encodeURIComponent(sheet.id)}/duplicate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        await refreshSheets();
      },
    });

    const resetBtn = createIconButton({
      title: "Reset progress",
      icon:
        '<path d="M4 4v6h6" /><path d="M20 12a8 8 0 1 1-2.35-5.65L20 10" />',
      onClick: async () => {
        if (!confirmTwice(`Reset progress for ${sheet.label || sheet.id}?`)) return;
        await fetch(`/api/sheets/${encodeURIComponent(sheet.id)}/reset`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clear_done: true, clear_notes: false }),
        });
        await refreshSheets();
      },
    });

    const clearNotesBtn = createIconButton({
      title: "Clear notes",
      icon:
        '<path d="M7 4h10v16H7z" /><path d="M9 8h6M9 12h6" />',
      onClick: async () => {
        if (!confirmTwice(`Clear notes for ${sheet.label || sheet.id}?`)) return;
        await fetch(`/api/sheets/${encodeURIComponent(sheet.id)}/reset`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clear_done: false, clear_notes: true }),
        });
        await refreshSheets();
      },
    });

    const deleteBtn = createIconButton({
      title: "Delete sheet",
      icon: '<path d="M6 6l12 12M18 6l-12 12" />',
      disabled: sheet.source === "sample",
      className: "icon-danger",
      onClick: async () => {
        if (!confirmTwice(`Delete ${sheet.label || sheet.id}? This cannot be undone.`)) return;
        await fetch(`/api/sheets/${encodeURIComponent(sheet.id)}`, { method: "DELETE" });
        await refreshSheets();
      },
    });

    actions.appendChild(openBtn);
    actions.appendChild(duplicateBtn);
    actions.appendChild(resetBtn);
    actions.appendChild(clearNotesBtn);
    actions.appendChild(deleteBtn);
    actionsCell.appendChild(actions);

    row.appendChild(selectCell);
    row.appendChild(nameCell);
    row.appendChild(countCell);
    row.appendChild(progressCell);
    row.appendChild(difficultyCell);
    row.appendChild(actionsCell);
    elements.sheetTableBody.appendChild(row);
  });
  updateSelectionCount();
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

  const summary = state.insights && state.insights.summary ? state.insights.summary : null;
  const focusTotal = summary
    ? (summary.starred || 0) + (summary.notes || 0)
    : 0;
  if (elements.summaryFocusTotal) {
    elements.summaryFocusTotal.textContent = focusTotal;
  }
  if (elements.summaryStarred) {
    elements.summaryStarred.textContent = `${summary ? summary.starred || 0 : 0} starred`;
  }
  if (elements.summaryNotes) {
    elements.summaryNotes.textContent = `${summary ? summary.notes || 0 : 0} notes`;
  }
  if (elements.summaryTodo) {
    const todoCount = summary ? summary.todo || 0 : Math.max(totalQuestions - doneQuestions, 0);
    elements.summaryTodo.textContent = `${todoCount} todo`;
  }
  if (elements.summaryLastActivity) {
    const last = summary ? summary.last_done_at : "";
    elements.summaryLastActivity.textContent = last
      ? `Last activity: ${formatDate(last)}`
      : "Last activity: -";
  }
}

function renderInsights() {
  const insights = state.insights || {};
  renderMomentum(insights.activity || [], insights.summary || null);
  renderHeatmap(insights.activity_heatmap || [], insights.activity_max || 0);
  renderSheetHealth(insights.sheets || []);
}

function renderMomentum(activity, summary) {
  if (!elements.momentumChart) return;
  elements.momentumChart.innerHTML = "";
  const items = Array.isArray(activity) ? activity : [];
  if (!items.length) {
    elements.momentumChart.innerHTML =
      '<div class="detail-empty">No recent activity yet.</div>';
    if (elements.momentumMeta) elements.momentumMeta.textContent = "0 solved · 0 active days";
    return;
  }
  const maxCount = Math.max(...items.map((item) => item.count || 0), 0);
  if (!maxCount) {
    elements.momentumChart.innerHTML =
      '<div class="detail-empty">No recent activity yet.</div>';
    if (elements.momentumMeta) elements.momentumMeta.textContent = "0 solved · 0 active days";
    return;
  }
  items.forEach((item) => {
    const slot = document.createElement("div");
    slot.className = "spark-slot";
    const bar = document.createElement("div");
    bar.className = "spark-bar";
    const height = maxCount ? Math.max(12, Math.round((item.count / maxCount) * 100)) : 12;
    bar.style.height = `${height}%`;
    const dateLabel = item.date || "Unknown day";
    bar.title = `${dateLabel}: ${item.count} solved`;
    const label = document.createElement("div");
    label.className = "spark-label";
    label.textContent = item.date ? item.date.slice(5) : "--";
    slot.appendChild(bar);
    slot.appendChild(label);
    elements.momentumChart.appendChild(slot);
  });
  if (elements.momentumMeta) {
    const recent = summary ? summary.recent_done || 0 : 0;
    const active = summary ? summary.active_days || 0 : 0;
    elements.momentumMeta.textContent = `${recent} solved · ${active} active days`;
  }
}

function renderHeatmap(entries, maxCount) {
  if (!elements.activityHeatmap) return;
  elements.activityHeatmap.innerHTML = "";
  const items = Array.isArray(entries) ? entries : [];
  if (!items.length) {
    renderEmptyHeatmap();
    return;
  }

  const firstDate = new Date(items[0].date);
  const lastDate = new Date(items[items.length - 1].date);
  const msWeek = 7 * 24 * 60 * 60 * 1000;
  const weekCount = Number.isFinite(firstDate.getTime()) && Number.isFinite(lastDate.getTime())
    ? Math.floor((lastDate - firstDate) / msWeek) + 1
    : 12;
  elements.activityHeatmap.style.gridTemplateColumns = `repeat(${weekCount}, 12px)`;

  const peak = maxCount || Math.max(...items.map((item) => item.count || 0), 0);
  items.forEach((item) => {
    const date = new Date(item.date);
    const count = item.count || 0;
    const dateLabel = item.date || "Unknown day";
    if (!Number.isFinite(date.getTime())) return;
    const weekIndex = Math.floor((date - firstDate) / msWeek);
    const dayIndex = date.getDay();
    let level = 0;
    if (count > 0 && peak) {
      const ratio = Math.min(1, count / peak);
      level = Math.max(1, Math.ceil(Math.sqrt(ratio) * 4));
    }
    const cell = document.createElement("div");
    cell.className = `heat-cell level-${level}`;
    cell.style.gridColumnStart = weekIndex + 1;
    cell.style.gridRowStart = dayIndex + 1;
    cell.title = `${dateLabel}: ${count} solved`;
    elements.activityHeatmap.appendChild(cell);
  });

  if (elements.activityLegend) {
    renderHeatmapLegend();
  }
  if (elements.heatmapScope) {
    const scopeLabel = (state.insights && state.insights.heatmap_scope) || "All sheets";
    elements.heatmapScope.textContent = `Scope: ${scopeLabel} · last 12 weeks`;
  }
}

function renderEmptyHeatmap() {
  if (!elements.activityHeatmap) return;
  const weeks = 12;
  elements.activityHeatmap.style.gridTemplateColumns = `repeat(${weeks}, 12px)`;
  for (let i = 0; i < weeks * 7; i += 1) {
    const cell = document.createElement("div");
    cell.className = "heat-cell level-0";
    cell.style.gridColumnStart = Math.floor(i / 7) + 1;
    cell.style.gridRowStart = (i % 7) + 1;
    elements.activityHeatmap.appendChild(cell);
  }
  renderHeatmapLegend();
  if (elements.heatmapScope) {
    const scopeLabel = (state.insights && state.insights.heatmap_scope) || "All sheets";
    elements.heatmapScope.textContent = `Scope: ${scopeLabel} · last 12 weeks`;
  }
}

function renderHeatmapLegend() {
  if (!elements.activityLegend) return;
  elements.activityLegend.innerHTML = "";
  const less = document.createElement("span");
  less.className = "heat-label";
  less.textContent = "Less";
  elements.activityLegend.appendChild(less);
  for (let i = 0; i <= 4; i += 1) {
    const cell = document.createElement("span");
    cell.className = `heat-cell level-${i}`;
    elements.activityLegend.appendChild(cell);
  }
  const more = document.createElement("span");
  more.className = "heat-label";
  more.textContent = "More";
  elements.activityLegend.appendChild(more);
}

function renderSheetHealth(sheets) {
  if (!elements.sheetHealth) return;
  elements.sheetHealth.innerHTML = "";
  if (!Array.isArray(sheets) || !sheets.length) {
    elements.sheetHealth.innerHTML =
      '<div class="detail-empty">No sheets available yet.</div>';
    return;
  }
  sheets.forEach((sheet) => {
    const card = document.createElement("div");
    card.className = "sheet-health-card";

    const header = document.createElement("div");
    header.className = "sheet-health-header";
    const title = document.createElement("div");
    title.className = "sheet-health-title";
    title.textContent = sheet.label || sheet.id;
    const badge = document.createElement("span");
    badge.className = `sheet-pill ${sheet.source === "sample" ? "sample" : "custom"}`;
    badge.textContent = sheet.source === "sample" ? "Sample" : "Custom";
    header.appendChild(title);
    header.appendChild(badge);

    const meta = document.createElement("div");
    meta.className = "sheet-health-meta";
    meta.textContent = `${sheet.done}/${sheet.total} done · ${sheet.notes} notes · ${sheet.starred} starred`;

    const progress = document.createElement("div");
    progress.className = "progress-rail";
    const bar = document.createElement("span");
    bar.style.width = `${Math.round(sheet.percent || 0)}%`;
    progress.appendChild(bar);

    const gaps = [];
    if (sheet.missing_difficulty) gaps.push(`${sheet.missing_difficulty} missing difficulty`);
    if (sheet.missing_leetcode) gaps.push(`${sheet.missing_leetcode} missing LC`);
    if (sheet.missing_youtube) gaps.push(`${sheet.missing_youtube} missing YT`);
    if (sheet.missing_resource) gaps.push(`${sheet.missing_resource} missing web`);
    const gapText = document.createElement("div");
    gapText.className = "sheet-health-gaps";
    gapText.textContent = gaps.length ? gaps.join(" · ") : "Links and difficulty look healthy.";

    let focusText = null;
    if (Array.isArray(sheet.focus_units) && sheet.focus_units.length) {
      focusText = document.createElement("div");
      focusText.className = "sheet-health-focus";
      const picks = sheet.focus_units.slice(0, 2).map((unit) => {
        const pct = Number.isFinite(unit.percent) ? Math.round(unit.percent) : 0;
        return `${unit.unit} (${pct}%)`;
      });
      focusText.textContent = `Focus: ${picks.join(" · ")}`;
    }

    const footer = document.createElement("div");
    footer.className = "sheet-health-footer";
    footer.textContent = `Last activity: ${formatDate(sheet.last_done_at)}`;

    const actions = document.createElement("div");
    actions.className = "sheet-health-actions";
    const open = document.createElement("a");
    open.className = "btn ghost slim";
    open.href = `/?sheet=${encodeURIComponent(sheet.id)}`;
    open.textContent = "Open";
    actions.appendChild(open);

    card.appendChild(header);
    card.appendChild(meta);
    card.appendChild(progress);
    card.appendChild(gapText);
    if (focusText) card.appendChild(focusText);
    card.appendChild(footer);
    card.appendChild(actions);
    elements.sheetHealth.appendChild(card);
  });
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
  await refreshInsights();
  await refreshHealth();
  renderSummary();
}

async function refreshInsights() {
  state.insights = await fetchAdminInsights();
  renderInsights();
}

async function refreshHealth() {
  state.health = await fetchHealth();
  renderHealth();
}

function renderHealth() {
  if (!elements.healthList) return;
  elements.healthList.innerHTML = "";
  const health = state.health;
  if (!health) {
    elements.healthList.innerHTML = '<div class="detail-empty">Health data unavailable.</div>';
    return;
  }

  const exists = health.exists || {};
  const summary = state.insights && state.insights.summary ? state.insights.summary : null;
  const rows = [
    { label: "Storage root", value: health.data_dir || "-" },
    { label: "Legacy mode", value: health.legacy_mode ? "Yes" : "No" },
    {
      label: "DB file",
      value: exists.db ? "Ready" : "Missing",
    },
    {
      label: "Sheets registry",
      value: exists.sheets ? "Ready" : "Missing",
    },
    {
      label: "Questions JSON",
      value: exists.state ? "Ready" : "Missing",
    },
    {
      label: "Lessons JSON",
      value: exists.lessons ? "Ready" : "Missing",
    },
    summary
      ? {
          label: "Solved",
          value: `${summary.done || 0} of ${summary.total || 0}`,
        }
      : null,
    summary
      ? {
          label: "Last activity",
          value: summary.last_done_at ? formatDate(summary.last_done_at) : "-",
        }
      : null,
  ].filter(Boolean);

  rows.forEach((row) => {
    const item = document.createElement("div");
    item.className = "health-item";
    const label = document.createElement("span");
    label.className = "health-label";
    label.textContent = row.label;
    const value = document.createElement("span");
    value.className = "health-value";
    value.textContent = row.value;
    item.appendChild(label);
    item.appendChild(value);
    elements.healthList.appendChild(item);
  });
}

function getSelectedSheets() {
  const selected = getSheetCheckboxes().filter((input) => input.checked);
  return selected.map((input) => {
    const sheetId = input.dataset.sheetId;
    const sheet = state.sheets.find((item) => item.id === sheetId);
    return {
      id: sheetId,
      label: sheet?.label || sheetId,
      source: input.dataset.source || sheet?.source || "custom",
    };
  });
}

async function saveSheetNames() {
  if (!elements.sheetTableBody) return;
  const inputs = Array.from(
    elements.sheetTableBody.querySelectorAll("input.admin-input[data-sheet-id]")
  );
  const updates = inputs
    .map((input) => {
      const name = input.value.trim();
      const original = input.dataset.originalLabel || "";
      return { id: input.dataset.sheetId, name, original };
    })
    .filter((item) => item.name && item.name !== item.original);

  if (!updates.length) {
    setSheetStatus("No sheet names changed.");
    return;
  }

  let successCount = 0;
  setSheetStatus("Saving sheet names...");
  for (const update of updates) {
    const response = await fetch(`/api/sheets/${encodeURIComponent(update.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: update.name }),
    });
    if (response.ok) successCount += 1;
  }
  const hadErrors = successCount !== updates.length;
  setSheetStatus(
    `Saved ${successCount} of ${updates.length} sheet name${updates.length === 1 ? "" : "s"}.`,
    hadErrors
  );
  await refreshSheets();
}

async function applyBulkAction() {
  const action = elements.sheetBulkAction ? elements.sheetBulkAction.value : "";
  if (!action) {
    setSheetStatus("Choose a bulk action to apply.", true);
    return;
  }
  const selected = getSelectedSheets();
  if (!selected.length) {
    setSheetStatus("Select at least one sheet.", true);
    return;
  }

  if (action === "delete") {
    if (!confirmTwice(`Delete ${selected.length} sheet(s)? This cannot be undone.`)) return;
    const deletable = selected.filter((sheet) => sheet.source !== "sample");
    const blocked = selected.length - deletable.length;
    for (const sheet of deletable) {
      await fetch(`/api/sheets/${encodeURIComponent(sheet.id)}`, { method: "DELETE" });
    }
    if (blocked) {
      setSheetStatus(`Deleted ${deletable.length} sheets. ${blocked} sample sheet(s) skipped.`, true);
    } else {
      setSheetStatus(`Deleted ${deletable.length} sheets.`);
    }
    await refreshSheets();
    if (elements.sheetBulkAction) elements.sheetBulkAction.value = "";
    return;
  }

  if (action === "reset") {
    if (!confirmTwice(`Reset progress for ${selected.length} sheet(s)?`)) return;
    for (const sheet of selected) {
      await fetch(`/api/sheets/${encodeURIComponent(sheet.id)}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clear_done: true, clear_notes: false }),
      });
    }
    setSheetStatus(`Reset progress for ${selected.length} sheet(s).`);
    await refreshSheets();
    if (elements.sheetBulkAction) elements.sheetBulkAction.value = "";
    return;
  }

  if (action === "clear-notes") {
    if (!confirmTwice(`Clear notes for ${selected.length} sheet(s)?`)) return;
    for (const sheet of selected) {
      await fetch(`/api/sheets/${encodeURIComponent(sheet.id)}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clear_done: false, clear_notes: true }),
      });
    }
    setSheetStatus(`Cleared notes for ${selected.length} sheet(s).`);
    await refreshSheets();
    if (elements.sheetBulkAction) elements.sheetBulkAction.value = "";
  }
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

  if (elements.saveSheetNamesBtn) {
    elements.saveSheetNamesBtn.addEventListener("click", saveSheetNames);
  }

  if (elements.sheetBulkApply) {
    elements.sheetBulkApply.addEventListener("click", applyBulkAction);
  }

  if (elements.sheetSelectAll) {
    elements.sheetSelectAll.addEventListener("change", () => {
      const checked = elements.sheetSelectAll.checked;
      getSheetCheckboxes().forEach((input) => {
        input.checked = checked;
      });
      updateSelectionCount();
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

  const widgetBindings = [
    [elements.toggleWidgetClock, "showClock"],
    [elements.toggleWidgetTimer, "showTimer"],
    [elements.toggleWidgetStopwatch, "showStopwatch"],
  ];

  widgetBindings.forEach(([el, key]) => {
    if (!el) return;
    el.addEventListener("change", () => {
      uiSettings.widgetSettings = uiSettings.widgetSettings || { ...defaultSettings.widgetSettings };
      uiSettings.widgetSettings[key] = el.checked;
      saveSettings(uiSettings);
    });
  });

  if (elements.widgetTimerMinutes) {
    elements.widgetTimerMinutes.addEventListener("input", () => {
      const minutes = Math.max(1, Number(elements.widgetTimerMinutes.value) || 1);
      uiSettings.widgetSettings = uiSettings.widgetSettings || { ...defaultSettings.widgetSettings };
      uiSettings.widgetSettings.timerMinutes = minutes;
      uiSettings.widgetSettings.timerSeconds = 0;
      saveSettings(uiSettings);
    });
  }

  if (elements.resetWidgetPosition) {
    elements.resetWidgetPosition.addEventListener("click", () => {
      uiSettings.widgetSettings = uiSettings.widgetSettings || { ...defaultSettings.widgetSettings };
      uiSettings.widgetSettings.position = null;
      saveSettings(uiSettings);
      syncAppearanceForm();
    });
  }

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
          widgetSettings: { ...defaultSettings.widgetSettings, ...(parsed.widgetSettings || {}) },
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

  if (elements.downloadDiagnosticsBtn) {
    elements.downloadDiagnosticsBtn.addEventListener("click", () => {
      const payload = {
        generated_at: new Date().toISOString(),
        health: state.health,
        insights: state.insights,
        sheets: state.sheets,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "dsa-practice-diagnostics.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setHealthStatus("Diagnostics exported.");
    });
  }

  if (elements.refreshHealthBtn) {
    elements.refreshHealthBtn.addEventListener("click", async () => {
      setHealthStatus("Refreshing health...");
      await refreshHealth();
      setHealthStatus("Health refreshed.");
    });
  }

  if (elements.resetUiBtn) {
    elements.resetUiBtn.addEventListener("click", async () => {
      if (!confirmTwice("Reset UI settings to defaults?")) return;
      uiSettings = { ...defaultSettings };
      saveSettings(uiSettings);
      syncAppearanceForm();
      setHealthStatus("UI settings reset.");
    });
  }

  if (elements.resetViewBtn) {
    elements.resetViewBtn.addEventListener("click", async () => {
      if (!confirmTwice("Clear saved filters and view state?")) return;
      try {
        await fetch("/api/view-state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: {} }),
        });
        setHealthStatus("View state cleared.");
      } catch (error) {
        setHealthStatus("Failed to clear view state.", true);
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
  const normalizedPanel = savedPanel === "overview" ? "tracking" : savedPanel;
  if (normalizedPanel && adminPanelButtons.length && adminPanels.length) {
    setActivePanel(normalizedPanel, adminPanelButtons, adminPanels);
  }
  await refreshSheets();
}

init();
