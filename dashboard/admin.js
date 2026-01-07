const SETTINGS_KEY = "a2z_settings";

const state = {
  sheets: [],
};

const elements = {
  createSheetForm: document.getElementById("createSheetForm"),
  newSheetName: document.getElementById("newSheetName"),
  sheetStatus: document.getElementById("sheetStatus"),
  sheetTableBody: document.getElementById("sheetTableBody"),
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

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
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

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

let uiSettings = loadSettings();

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
      if (!confirm(`Reset progress for ${sheet.label || sheet.id}?`)) return;
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
      if (!confirm(`Clear notes for ${sheet.label || sheet.id}?`)) return;
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
      if (!confirm(`Rebuild ${sheet.label || sheet.id} from HTML?`)) return;
      await fetch(`/api/sheets/${encodeURIComponent(sheet.id)}/regenerate`, { method: "POST" });
      await refreshSheets();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn ghost";
    deleteBtn.type = "button";
    deleteBtn.textContent = "Delete";
    deleteBtn.disabled = sheet.source === "sample";
    deleteBtn.addEventListener("click", async () => {
      if (!confirm(`Delete ${sheet.label || sheet.id}? This cannot be undone.`)) return;
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

function renderSheetSelects() {
  const selects = [elements.renameSheet, elements.difficultySheet].filter(Boolean);
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

async function refreshSheets() {
  state.sheets = await fetchSheets();
  renderSheetTable();
  renderSheetSelects();
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

  const panelButtons = document.querySelectorAll(".admin-nav-btn");
  const panels = document.querySelectorAll(".admin-panel");
  const savedPanel = localStorage.getItem("admin_panel");
  if (savedPanel) {
    setActivePanel(savedPanel, panelButtons, panels);
  }
  panelButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActivePanel(button.dataset.panel, panelButtons, panels);
    });
  });
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
  localStorage.setItem("admin_panel", activeId);
}

async function init() {
  syncAppearanceForm();
  bindEvents();
  await refreshSheets();
}

init();
