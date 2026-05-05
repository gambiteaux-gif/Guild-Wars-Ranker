// Guild Wars Role Analytics
// This file is intentionally plain, modular JavaScript so it is easy to edit.

const STORAGE_KEY = "guildWarsRoleAnalytics.v1";

// Simple IDs keep the data portable inside localStorage.
const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const els = {
  warSelect: document.querySelector("#warSelect"),
  filterWar: document.querySelector("#filterWar"),
  filterTeam: document.querySelector("#filterTeam"),
  filterRole: document.querySelector("#filterRole"),
  warForm: document.querySelector("#warForm"),
  playerForm: document.querySelector("#playerForm"),
  deleteWarBtn: document.querySelector("#deleteWarBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  seedDemoBtn: document.querySelector("#seedDemoBtn"),
  leaderboardBody: document.querySelector("#leaderboardBody"),
  breakdownBody: document.querySelector("#breakdownBody"),
  warCountBadge: document.querySelector("#warCountBadge"),
  activeWarBadge: document.querySelector("#activeWarBadge"),
  detailPanel: document.querySelector("#detailPanel"),
  emptyDetail: document.querySelector("#emptyDetail"),
  playerDetail: document.querySelector("#playerDetail"),
  detailTitle: document.querySelector("#detailTitle"),
  closeDetailBtn: document.querySelector("#closeDetailBtn"),
  chart: document.querySelector("#performanceChart"),
  showEfficiencyToggle: document.querySelector("#showEfficiencyToggle"),
  showFocusToggle: document.querySelector("#showFocusToggle"),
  siegeField: document.querySelector("#siegeField"),
  funCoinField: document.querySelector("#funCoinField")
};

const inputs = {
  warName: document.querySelector("#warNameInput"),
  enemyName: document.querySelector("#enemyNameInput"),
  warDate: document.querySelector("#warDateInput"),
  warTeam: document.querySelector("#warTeamInput"),
  playerName: document.querySelector("#playerNameInput"),
  role: document.querySelector("#roleInput"),
  team: document.querySelector("#teamInput"),
  jungler: document.querySelector("#junglerInput"),
  kills: document.querySelector("#killsInput"),
  assists: document.querySelector("#assistsInput"),
  deaths: document.querySelector("#deathsInput"),
  damage: document.querySelector("#damageInput"),
  tanking: document.querySelector("#tankingInput"),
  healing: document.querySelector("#healingInput"),
  siege: document.querySelector("#siegeInput"),
  funCoins: document.querySelector("#funCoinsInput")
};

let state = loadState();
let selectedWarId = state.wars[0]?.id || "";
let selectedPlayerName = "";

// Demo data covers offense, defense, all three roles, and objective junglers.
function createDemoState() {
  const warOne = {
    id: createId("war"),
    name: "Crystal Keep Clash",
    enemy: "Shadow Pact",
    date: "2026-04-18",
    teamType: "Offense",
    players: [
      player("Astra", "DPS", "Offense", false, 42, 18, 4, 1285000, 32000, 12000, 412000, 0),
      player("Kairo", "Tank", "Offense", false, 8, 34, 7, 228000, 945000, 38000, 188000, 0),
      player("Mira", "Healer", "Offense", false, 3, 54, 5, 82000, 48000, 885000, 42000, 0),
      player("Jun", "DPS", "Offense", true, 16, 20, 3, 498000, 28000, 9000, 72000, 126),
      player("Riven", "DPS", "Offense", true, 33, 11, 6, 820000, 20000, 6000, 36000, 28)
    ]
  };

  const warTwo = {
    id: createId("war"),
    name: "Moon Gate Hold",
    enemy: "Iron Lotus",
    date: "2026-04-25",
    teamType: "Defense",
    players: [
      player("Mira", "Healer", "Defense", false, 2, 62, 3, 64000, 36000, 1040000, 0, 0),
      player("Bram", "Tank", "Defense", false, 5, 41, 4, 146000, 1125000, 22000, 0, 0),
      player("Astra", "DPS", "Defense", false, 31, 24, 5, 975000, 26000, 8000, 0, 0),
      player("Talia", "Healer", "Defense", false, 1, 39, 8, 52000, 18000, 710000, 0, 0),
      player("Voss", "Tank", "Defense", false, 7, 29, 9, 180000, 860000, 16000, 0, 0)
    ]
  };

  return { wars: [warOne, warTwo] };
}

function player(name, role, team, isJungler, kills, assists, deaths, damage, tanking, healing, siegeDamage, funCoins) {
  return {
    id: createId("player"),
    name,
    role,
    team,
    isJungler,
    kills,
    assists,
    deaths,
    damage,
    tanking,
    healing,
    siegeDamage,
    funCoins
  };
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    const demo = createDemoState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
    return demo;
  }

  try {
    return JSON.parse(saved);
  } catch {
    return createDemoState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function numberValue(input) {
  return Math.max(0, Number(input.value || 0));
}

function getActiveWar() {
  return state.wars.find((war) => war.id === selectedWarId) || state.wars[0];
}

// The scoring rules below are the heart of the app.
// Each category only rewards the stats that matter to that job.
function scorePlayer(playerData) {
  if (playerData.isJungler && playerData.team === "Offense") {
    return scoreJungler(playerData);
  }

  const key = `${playerData.team}-${playerData.role}`;
  const rules = {
    "Defense-Healer": {
      used: ["Healing", "Assists", "Deaths"],
      focusValue: playerData.healing,
      ignoredValue: playerData.damage + playerData.kills * 16000 + playerData.siegeDamage + playerData.funCoins * 5000,
      score: playerData.healing * 0.018 + playerData.assists * 22 - playerData.deaths * 95
    },
    "Defense-Tank": {
      used: ["Tanking", "Assists", "Deaths"],
      focusValue: playerData.tanking,
      ignoredValue: playerData.damage + playerData.healing + playerData.kills * 12000,
      score: playerData.tanking * 0.022 + playerData.assists * 18 - playerData.deaths * 170
    },
    "Defense-DPS": {
      used: ["Damage", "Kills", "Deaths"],
      focusValue: playerData.damage,
      ignoredValue: playerData.healing + playerData.tanking + playerData.siegeDamage,
      score: playerData.damage * 0.020 + playerData.kills * 120 - playerData.deaths * 110
    },
    "Offense-DPS": {
      used: ["Damage", "Kills", "Siege Damage", "Deaths"],
      focusValue: playerData.damage + playerData.siegeDamage,
      ignoredValue: playerData.healing + playerData.tanking,
      score: playerData.damage * 0.026 + playerData.kills * 170 + playerData.siegeDamage * 0.024 - playerData.deaths * 115
    },
    "Offense-Tank": {
      used: ["Tanking", "Siege Damage", "Deaths"],
      focusValue: playerData.tanking + playerData.siegeDamage,
      ignoredValue: playerData.damage + playerData.healing,
      score: playerData.tanking * 0.024 + playerData.siegeDamage * 0.014 - playerData.deaths * 150
    },
    "Offense-Healer": {
      used: ["Healing", "Assists", "Deaths"],
      focusValue: playerData.healing + playerData.assists * 12000,
      ignoredValue: playerData.damage + playerData.siegeDamage + playerData.kills * 10000,
      score: playerData.healing * 0.022 + playerData.assists * 45 - playerData.deaths * 125
    }
  };

  const rule = rules[key];
  const efficiency = calculateEfficiency(rule.focusValue, rule.ignoredValue, playerData.deaths, false);
  return {
    score: Math.max(0, Math.round(rule.score * (0.75 + efficiency / 400))),
    efficiency,
    usedStats: rule.used,
    focusStat: rule.focusValue
  };
}

function scoreJungler(playerData) {
  const objectiveScore = playerData.funCoins * 170;
  const secondaryScore = playerData.kills * 55 + playerData.damage * 0.008;
  const combatPressure = playerData.kills * 18 + playerData.damage / 25000;
  let multiplier = 1;

  // Junglers are rewarded for collecting Fun Coins first.
  // High combat with low objective progress is treated as role drift.
  if (playerData.funCoins >= 90) multiplier = 1.22;
  if (playerData.funCoins < 45 && combatPressure > 55) multiplier = 0.68;

  const focusValue = playerData.funCoins * 18000;
  const ignoredValue = Math.max(0, playerData.damage - playerData.funCoins * 9000);

  return {
    score: Math.max(0, Math.round((objectiveScore + secondaryScore - playerData.deaths * 90) * multiplier)),
    efficiency: calculateEfficiency(focusValue, ignoredValue, playerData.deaths, true),
    usedStats: ["Fun Coins", "Kills", "Damage", "Deaths"],
    focusStat: playerData.funCoins
  };
}

function calculateEfficiency(focusValue, ignoredValue, deaths, isJungler) {
  const focusRatio = focusValue / Math.max(1, focusValue + ignoredValue);
  const deathPenalty = Math.min(28, deaths * (isJungler ? 4 : 5));
  return clamp(Math.round(focusRatio * 100 - deathPenalty), 0, 100);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Ranks are assigned inside each role + team category for each war.
function getRankedPlayers(war) {
  if (!war) return [];

  const enriched = war.players.map((entry) => ({
    ...entry,
    warId: war.id,
    warName: war.name,
    analysis: scorePlayer(entry),
    category: getCategory(entry)
  }));

  const groups = {};
  enriched.forEach((entry) => {
    groups[entry.category] ||= [];
    groups[entry.category].push(entry);
  });

  Object.values(groups).forEach((group) => {
    group.sort((a, b) => b.analysis.score - a.analysis.score);
    group.forEach((entry, index) => {
      entry.rank = rankForPosition(index, group.length);
    });
  });

  return enriched;
}

function getCategory(entry) {
  return entry.isJungler && entry.team === "Offense" ? "Offense-Jungler" : `${entry.team}-${entry.role}`;
}

function rankForPosition(index, total) {
  const percentile = (index + 1) / Math.max(1, total);
  if (index === 0) return "S";
  if (percentile <= 0.2) return "A";
  if (percentile <= 0.4) return "B";
  if (percentile <= 0.6) return "C";
  if (percentile <= 0.8) return "D";
  return "E";
}

function rankToPoints(rank) {
  return { S: 6, A: 5, B: 4, C: 3, D: 2, E: 1 }[rank] || 0;
}

function averageRank(entries) {
  if (!entries.length) return "-";
  const average = entries.reduce((sum, entry) => sum + rankToPoints(entry.rank), 0) / entries.length;
  const closest = Math.round(average);
  return Object.entries({ S: 6, A: 5, B: 4, C: 3, D: 2, E: 1 }).find(([, points]) => points === closest)?.[0] || "-";
}

function render() {
  renderWarSelectors();
  renderFieldVisibility();
  renderLeaderboard();

  if (selectedPlayerName) {
    renderPlayerDetail(selectedPlayerName);
  }
}

function renderWarSelectors() {
  const activeWar = getActiveWar();
  const previousFilterWar = els.filterWar.value || "All";
  selectedWarId = activeWar?.id || "";

  els.warSelect.innerHTML = state.wars.map((war) => `<option value="${war.id}">${war.name} vs ${war.enemy}</option>`).join("");
  els.filterWar.innerHTML = [
    `<option value="All">All Wars</option>`,
    ...state.wars.map((war) => `<option value="${war.id}">${war.name}</option>`)
  ].join("");

  els.warSelect.value = selectedWarId;
  els.filterWar.value = state.wars.some((war) => war.id === previousFilterWar) ? previousFilterWar : "All";
  els.deleteWarBtn.disabled = !activeWar;
  els.warCountBadge.textContent = `${state.wars.length} war${state.wars.length === 1 ? "" : "s"}`;
  els.activeWarBadge.textContent = activeWar ? `${activeWar.name} - ${activeWar.teamType}` : "No war selected";
}

function renderFieldVisibility() {
  const isOffense = inputs.team.value === "Offense";
  els.siegeField.classList.toggle("hidden", !isOffense);
  els.funCoinField.classList.toggle("hidden", !(isOffense && inputs.jungler.checked));
}

function getVisibleRows() {
  const warFilter = els.filterWar.value || "All";
  const teamFilter = els.filterTeam.value;
  const roleFilter = els.filterRole.value;

  return state.wars
    .filter((war) => warFilter === "All" || war.id === warFilter)
    .flatMap(getRankedPlayers)
    .filter((entry) => teamFilter === "All" || entry.team === teamFilter)
    .filter((entry) => {
      if (roleFilter === "All") return true;
      if (roleFilter === "Jungler") return entry.isJungler;
      return entry.role === roleFilter && !entry.isJungler;
    })
    .sort((a, b) => b.analysis.score - a.analysis.score);
}

function renderLeaderboard() {
  const rows = getVisibleRows();

  if (!rows.length) {
    els.leaderboardBody.innerHTML = `<tr><td class="empty-row" colspan="7">No players match these filters.</td></tr>`;
    return;
  }

  els.leaderboardBody.innerHTML = rows.map((entry) => `
    <tr>
      <td><button class="player-link" type="button" data-player="${escapeHtml(entry.name)}">${escapeHtml(entry.name)}</button></td>
      <td>${entry.isJungler ? "Jungler" : entry.role}</td>
      <td>${entry.team}</td>
      <td>${entry.analysis.score.toLocaleString()}</td>
      <td><span class="rank-pill rank-${entry.rank}">${entry.rank} Class</span></td>
      <td>${entry.analysis.efficiency}%</td>
      <td><button class="icon-btn danger-outline" type="button" data-delete-player="${entry.id}" data-war-id="${entry.warId}">Remove</button></td>
    </tr>
  `).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderPlayerDetail(playerName) {
  const history = state.wars
    .flatMap((war) => getRankedPlayers(war).filter((entry) => entry.name === playerName))
    .sort((a, b) => state.wars.findIndex((war) => war.id === a.warId) - state.wars.findIndex((war) => war.id === b.warId));

  if (!history.length) {
    closeDetail();
    return;
  }

  const latest = history[history.length - 1];
  selectedPlayerName = playerName;
  els.detailPanel.classList.remove("empty-state");
  els.emptyDetail.classList.add("hidden");
  els.playerDetail.classList.remove("hidden");
  els.detailTitle.textContent = playerName;
  document.querySelector("#summaryRole").textContent = latest.isJungler ? "Jungler" : latest.role;
  document.querySelector("#summaryTeam").textContent = latest.team;
  document.querySelector("#summaryEfficiency").textContent = `${Math.round(average(history.map((entry) => entry.analysis.efficiency)))}%`;
  document.querySelector("#summaryAverageRank").textContent = `${averageRank(history)} Class`;

  els.breakdownBody.innerHTML = history.map((entry) => `
    <tr>
      <td>${escapeHtml(entry.warName)}</td>
      <td>${entry.analysis.usedStats.join(", ")}</td>
      <td>${entry.analysis.score.toLocaleString()}</td>
      <td>${entry.analysis.efficiency}%</td>
    </tr>
  `).join("");

  drawChart(history);
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function closeDetail() {
  selectedPlayerName = "";
  els.detailPanel.classList.add("empty-state");
  els.emptyDetail.classList.remove("hidden");
  els.playerDetail.classList.add("hidden");
  els.detailTitle.textContent = "Select a Player";
}

function drawChart(history) {
  const ctx = els.chart.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const cssWidth = els.chart.clientWidth;
  const cssHeight = 360;
  els.chart.width = cssWidth * ratio;
  els.chart.height = cssHeight * ratio;
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const padding = 48;
  const width = cssWidth - padding * 2;
  const height = cssHeight - padding * 2;
  const maxScore = Math.max(...history.map((entry) => entry.analysis.score), 100);
  const maxFocus = Math.max(...history.map((entry) => entry.analysis.focusStat), 1);

  drawGrid(ctx, padding, width, height);
  drawLine(ctx, history, padding, width, height, maxScore, (entry) => entry.analysis.score, "#38e8ff", "Score");

  if (els.showEfficiencyToggle.checked) {
    drawLine(ctx, history, padding, width, height, 100, (entry) => entry.analysis.efficiency, "#54e28c", "Efficiency");
  }

  if (els.showFocusToggle.checked) {
    drawLine(ctx, history, padding, width, height, maxFocus, (entry) => entry.analysis.focusStat, "#ff4fd8", "Focus");
  }

  drawAxisLabels(ctx, history, padding, width, height);
}

function drawGrid(ctx, padding, width, height) {
  ctx.strokeStyle = "rgba(159, 190, 255, 0.16)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding + (height / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(padding + width, y);
    ctx.stroke();
  }

  ctx.fillStyle = "#91a8d0";
  ctx.font = "12px sans-serif";
  ctx.fillText("Role-based score", padding, 22);
}

function drawLine(ctx, history, padding, width, height, maxValue, valueGetter, color, label) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();

  history.forEach((entry, index) => {
    const x = padding + (history.length === 1 ? width / 2 : (width / (history.length - 1)) * index);
    const y = padding + height - (valueGetter(entry) / maxValue) * height;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();

  history.forEach((entry, index) => {
    const x = padding + (history.length === 1 ? width / 2 : (width / (history.length - 1)) * index);
    const y = padding + height - (valueGetter(entry) / maxValue) * height;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.font = "12px sans-serif";
  ctx.fillText(label, padding + 8, padding + 18 + ["Score", "Efficiency", "Focus"].indexOf(label) * 18);
}

function drawAxisLabels(ctx, history, padding, width, height) {
  ctx.fillStyle = "#cfdbf3";
  ctx.font = "12px sans-serif";
  history.forEach((entry, index) => {
    const x = padding + (history.length === 1 ? width / 2 : (width / (history.length - 1)) * index);
    const label = entry.warName.length > 16 ? `${entry.warName.slice(0, 15)}...` : entry.warName;
    ctx.fillText(label, clamp(x - 45, padding, padding + width - 90), padding + height + 30);
  });
}

function addWar(event) {
  event.preventDefault();
  const newWar = {
    id: createId("war"),
    name: inputs.warName.value.trim(),
    enemy: inputs.enemyName.value.trim(),
    date: inputs.warDate.value,
    teamType: inputs.warTeam.value,
    players: []
  };

  state.wars.push(newWar);
  selectedWarId = newWar.id;
  saveState();
  els.warForm.reset();
  render();
}

function addPlayer(event) {
  event.preventDefault();
  const war = getActiveWar();
  if (!war) return;

  war.players.push(player(
    inputs.playerName.value.trim(),
    inputs.role.value,
    inputs.team.value,
    inputs.jungler.checked && inputs.team.value === "Offense",
    numberValue(inputs.kills),
    numberValue(inputs.assists),
    numberValue(inputs.deaths),
    numberValue(inputs.damage),
    numberValue(inputs.tanking),
    numberValue(inputs.healing),
    inputs.team.value === "Offense" ? numberValue(inputs.siege) : 0,
    inputs.team.value === "Offense" && inputs.jungler.checked ? numberValue(inputs.funCoins) : 0
  ));

  saveState();
  els.playerForm.reset();
  inputs.team.value = war.teamType;
  render();
}

function deleteActiveWar() {
  const war = getActiveWar();
  if (!war) return;
  const confirmed = confirm(`Delete "${war.name}" and all of its player data?`);
  if (!confirmed) return;

  state.wars = state.wars.filter((entry) => entry.id !== war.id);
  selectedWarId = state.wars[0]?.id || "";
  selectedPlayerName = "";
  saveState();
  render();
}

function deletePlayer(warId, playerId) {
  const war = state.wars.find((entry) => entry.id === warId);
  if (!war) return;
  war.players = war.players.filter((entry) => entry.id !== playerId);
  saveState();
  render();
}

function resetAllData() {
  if (!confirm("Reset all wars and players?")) return;
  state = { wars: [] };
  selectedWarId = "";
  selectedPlayerName = "";
  saveState();
  render();
}

function reloadDemoData() {
  if (!confirm("Replace current data with the demo wars?")) return;
  state = createDemoState();
  selectedWarId = state.wars[0].id;
  selectedPlayerName = "";
  saveState();
  render();
}

els.warForm.addEventListener("submit", addWar);
els.playerForm.addEventListener("submit", addPlayer);
els.deleteWarBtn.addEventListener("click", deleteActiveWar);
els.resetBtn.addEventListener("click", resetAllData);
els.seedDemoBtn.addEventListener("click", reloadDemoData);
els.warSelect.addEventListener("change", () => {
  selectedWarId = els.warSelect.value;
  const war = getActiveWar();
  if (war) inputs.team.value = war.teamType;
  render();
});
els.filterWar.addEventListener("change", renderLeaderboard);
els.filterTeam.addEventListener("change", renderLeaderboard);
els.filterRole.addEventListener("change", renderLeaderboard);
inputs.team.addEventListener("change", renderFieldVisibility);
inputs.jungler.addEventListener("change", renderFieldVisibility);
els.showEfficiencyToggle.addEventListener("change", () => renderPlayerDetail(selectedPlayerName));
els.showFocusToggle.addEventListener("change", () => renderPlayerDetail(selectedPlayerName));
els.closeDetailBtn.addEventListener("click", closeDetail);
window.addEventListener("resize", () => selectedPlayerName && drawChart(
  state.wars.flatMap((war) => getRankedPlayers(war).filter((entry) => entry.name === selectedPlayerName))
));

els.leaderboardBody.addEventListener("click", (event) => {
  const playerButton = event.target.closest("[data-player]");
  const deleteButton = event.target.closest("[data-delete-player]");

  if (playerButton) renderPlayerDetail(playerButton.dataset.player);
  if (deleteButton) deletePlayer(deleteButton.dataset.warId, deleteButton.dataset.deletePlayer);
});

// Initialize date and default team values for a smoother first edit.
inputs.warDate.valueAsDate = new Date();
inputs.team.value = getActiveWar()?.teamType || "Offense";
render();
