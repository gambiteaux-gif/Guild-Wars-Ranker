// Guild Wars Ranking Dashboard
// Everything is persisted in localStorage so the app works by opening index.html.

const STORAGE_KEY = "guildWarsRankingSystem.v1";

// These keys are used by the player form, the score calculator, and the config UI.
const statKeys = ["kills", "assists", "deaths", "damage", "tanking", "healing", "siege", "funCoins"];
const roles = ["DPS", "Tank", "Healer", "Support", "Jungler/Roamer"];
const roleContributionStat = {
  DPS: "damage",
  Tank: "tanking",
  Healer: "healing",
  Support: "funCoins",
  "Jungler/Roamer": "siege"
};

const defaultWeights = {
  DPS: { kills: 12, assists: 3, deaths: -8, damage: 0.018, tanking: 0.002, healing: 0.002, siege: 0.006, funCoins: 1.2 },
  Tank: { kills: 4, assists: 5, deaths: -4, damage: 0.004, tanking: 0.02, healing: 0.003, siege: 0.006, funCoins: 1.1 },
  Healer: { kills: 2, assists: 10, deaths: -5, damage: 0.002, tanking: 0.003, healing: 0.024, siege: 0.002, funCoins: 1.2 },
  Support: { kills: 5, assists: 9, deaths: -6, damage: 0.007, tanking: 0.006, healing: 0.01, siege: 0.006, funCoins: 2.2 },
  "Jungler/Roamer": { kills: 9, assists: 8, deaths: -7, damage: 0.01, tanking: 0.004, healing: 0.003, siege: 0.016, funCoins: 1.4 }
};

const defaultThresholds = {
  S: 900,
  A: 700,
  B: 520,
  C: 340,
  D: 180,
  E: 0
};

let state = loadState();
let activeWarId = state.activeWarId || state.wars[0]?.id || null;

const elements = {
  resetAllBtn: document.getElementById("resetAllBtn"),
  warSelect: document.getElementById("warSelect"),
  deleteWarBtn: document.getElementById("deleteWarBtn"),
  warForm: document.getElementById("warForm"),
  warName: document.getElementById("warName"),
  enemyName: document.getElementById("enemyName"),
  warDate: document.getElementById("warDate"),
  activeWarTitle: document.getElementById("activeWarTitle"),
  activeWarDate: document.getElementById("activeWarDate"),
  activeEnemy: document.getElementById("activeEnemy"),
  playerCount: document.getElementById("playerCount"),
  topScore: document.getElementById("topScore"),
  averageScore: document.getElementById("averageScore"),
  playerForm: document.getElementById("playerForm"),
  editingPlayerId: document.getElementById("editingPlayerId"),
  playerName: document.getElementById("playerName"),
  playerRole: document.getElementById("playerRole"),
  kills: document.getElementById("kills"),
  assists: document.getElementById("assists"),
  deaths: document.getElementById("deaths"),
  damage: document.getElementById("damage"),
  tanking: document.getElementById("tanking"),
  healing: document.getElementById("healing"),
  siege: document.getElementById("siege"),
  funCoins: document.getElementById("funCoins"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  leaderboardBody: document.getElementById("leaderboardBody"),
  weightsConfig: document.getElementById("weightsConfig"),
  thresholdConfig: document.getElementById("thresholdConfig"),
  playerModal: document.getElementById("playerModal"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  modalPlayerName: document.getElementById("modalPlayerName"),
  modalPlayerRole: document.getElementById("modalPlayerRole"),
  modalAverageRank: document.getElementById("modalAverageRank"),
  modalMatches: document.getElementById("modalMatches"),
  modalBestWar: document.getElementById("modalBestWar"),
  performanceChart: document.getElementById("performanceChart"),
  playerDetailBody: document.getElementById("playerDetailBody")
};

function loadState() {
  // First launch gets sample data. Later launches restore the user's saved guild database.
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return createDemoState();
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      wars: Array.isArray(parsed.wars) && parsed.wars.length ? parsed.wars : createDemoWars(),
      weights: { ...structuredClone(defaultWeights), ...(parsed.weights || {}) },
      thresholds: { ...defaultThresholds, ...(parsed.thresholds || {}) },
      activeWarId: parsed.activeWarId || null
    };
  } catch (error) {
    console.warn("Saved data was unreadable, loading demo data.", error);
    return createDemoState();
  }
}

function createDemoState() {
  return {
    wars: createDemoWars(),
    weights: structuredClone(defaultWeights),
    thresholds: { ...defaultThresholds },
    activeWarId: null
  };
}

function createDemoWars() {
  return [
    {
      id: createId(),
      name: "Weekend War #1",
      enemy: "Nightfall Legion",
      date: "2026-04-25",
      players: [
        makePlayer("Astra", "DPS", 31, 9, 5, 42500, 4200, 900, 6500, 18),
        makePlayer("Bastion", "Tank", 8, 20, 7, 9800, 39200, 3200, 4200, 12),
        makePlayer("Mira", "Healer", 3, 33, 4, 4200, 6800, 36500, 1700, 22),
        makePlayer("Kade", "Support", 10, 27, 6, 11800, 10600, 14200, 5400, 31),
        makePlayer("Nyx", "Jungler/Roamer", 22, 18, 8, 25500, 7200, 2500, 18500, 16)
      ]
    },
    {
      id: createId(),
      name: "Citadel Clash",
      enemy: "Azure Vanguard",
      date: "2026-05-02",
      players: [
        makePlayer("Astra", "DPS", 38, 11, 4, 51200, 5100, 1000, 7800, 21),
        makePlayer("Bastion", "Tank", 6, 24, 5, 8600, 46200, 4100, 5200, 15),
        makePlayer("Mira", "Healer", 4, 37, 3, 5100, 5900, 44800, 2100, 26),
        makePlayer("Kade", "Support", 13, 31, 5, 14600, 11100, 15800, 6900, 36),
        makePlayer("Nyx", "Jungler/Roamer", 26, 23, 7, 28200, 7600, 3100, 22600, 19)
      ]
    }
  ];
}

function makePlayer(name, role, kills, assists, deaths, damage, tanking, healing, siege, funCoins) {
  return { id: createId(), name, role, kills, assists, deaths, damage, tanking, healing, siege, funCoins };
}

function createId() {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function saveState() {
  // Every meaningful data change calls this, keeping the app fully persistent.
  state.activeWarId = activeWarId;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getActiveWar() {
  return state.wars.find((war) => war.id === activeWarId) || state.wars[0] || null;
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculateScore(player) {
  // Score = each stat multiplied by that role's editable weight.
  const weights = state.weights[player.role] || defaultWeights.Support;
  const total = statKeys.reduce((sum, key) => sum + numberValue(player[key]) * numberValue(weights[key]), 0);
  return Math.max(0, Math.round(total));
}

function getRank(score) {
  // Thresholds are checked from highest to lowest so S Class wins first.
  const orderedRanks = ["S", "A", "B", "C", "D", "E"];
  return orderedRanks.find((rank) => score >= numberValue(state.thresholds[rank])) || "E";
}

function rankClass(rank) {
  return `rank-${rank.toLowerCase()}`;
}

function formatNumber(value) {
  return numberValue(value).toLocaleString();
}

function summarizeStats(player) {
  return `K ${player.kills} / A ${player.assists} / D ${player.deaths} | DMG ${formatNumber(player.damage)} | TNK ${formatNumber(player.tanking)} | HEAL ${formatNumber(player.healing)} | SIEGE ${formatNumber(player.siege)} | FC ${player.funCoins}`;
}

function render() {
  // Main redraw function. The app is small enough that simple rerendering is easiest to follow.
  const activeWar = getActiveWar();
  renderWarSwitcher();
  renderActiveWar(activeWar);
  renderLeaderboard(activeWar);
  renderConfig();
  saveState();
}

function renderWarSwitcher() {
  elements.warSelect.innerHTML = "";
  state.wars
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((war) => {
      const option = document.createElement("option");
      option.value = war.id;
      option.textContent = `${war.name} vs ${war.enemy}`;
      option.selected = war.id === activeWarId;
      elements.warSelect.appendChild(option);
    });
}

function renderActiveWar(war) {
  if (!war) {
    elements.activeWarTitle.textContent = "No War Selected";
    elements.activeWarDate.textContent = "";
    elements.activeEnemy.textContent = "Create a war to begin ranking players.";
    elements.playerCount.textContent = "0";
    elements.topScore.textContent = "0";
    elements.averageScore.textContent = "0";
    return;
  }

  const scores = war.players.map(calculateScore);
  const top = scores.length ? Math.max(...scores) : 0;
  const average = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;

  elements.activeWarTitle.textContent = war.name;
  elements.activeWarDate.textContent = war.date;
  elements.activeEnemy.textContent = `Enemy Team: ${war.enemy}`;
  elements.playerCount.textContent = war.players.length;
  elements.topScore.textContent = formatNumber(top);
  elements.averageScore.textContent = formatNumber(average);
}

function renderLeaderboard(war) {
  elements.leaderboardBody.innerHTML = "";

  if (!war || !war.players.length) {
    elements.leaderboardBody.innerHTML = '<tr><td class="empty-state" colspan="6">No player entries for this war yet.</td></tr>';
    return;
  }

  war.players
    .map((player) => ({ ...player, score: calculateScore(player) }))
    .sort((a, b) => b.score - a.score)
    .forEach((player) => {
      const rank = getRank(player.score);
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><button class="player-link" type="button" data-player-name="${escapeHtml(player.name)}">${escapeHtml(player.name)}</button></td>
        <td>${escapeHtml(player.role)}</td>
        <td>${escapeHtml(summarizeStats(player))}</td>
        <td>${formatNumber(player.score)}</td>
        <td><span class="rank-badge ${rankClass(rank)}">${rank} Class</span></td>
        <td>
          <div class="row-actions">
            <button class="mini-button" type="button" data-edit-player="${player.id}">Edit</button>
            <button class="mini-button" type="button" data-delete-player="${player.id}">Delete</button>
          </div>
        </td>
      `;
      elements.leaderboardBody.appendChild(row);
    });
}

function renderConfig() {
  elements.weightsConfig.innerHTML = "";
  roles.forEach((role) => {
    const card = document.createElement("div");
    card.className = "weight-card";
    card.innerHTML = `<h3>${escapeHtml(role)}</h3><div class="weight-fields"></div>`;
    const fields = card.querySelector(".weight-fields");

    statKeys.forEach((key) => {
      const label = document.createElement("label");
      label.textContent = prettyStatName(key);
      const input = document.createElement("input");
      input.type = "number";
      input.step = "0.001";
      input.value = state.weights[role][key];
      input.dataset.role = role;
      input.dataset.weightKey = key;
      label.appendChild(input);
      fields.appendChild(label);
    });

    elements.weightsConfig.appendChild(card);
  });

  elements.thresholdConfig.innerHTML = "";
  ["S", "A", "B", "C", "D", "E"].forEach((rank) => {
    const label = document.createElement("label");
    label.textContent = `${rank} Class minimum`;
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.value = state.thresholds[rank];
    input.dataset.rank = rank;
    label.appendChild(input);
    elements.thresholdConfig.appendChild(label);
  });
}

function prettyStatName(key) {
  const names = {
    kills: "Kills",
    assists: "Assists",
    deaths: "Deaths",
    damage: "Damage",
    tanking: "Tanking",
    healing: "Healing",
    siege: "Siege Damage",
    funCoins: "Fun Coins"
  };
  return names[key] || key;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clearPlayerForm() {
  elements.editingPlayerId.value = "";
  elements.playerForm.reset();
  statKeys.forEach((key) => {
    elements[key].value = 0;
  });
  elements.playerRole.value = "DPS";
}

function fillPlayerForm(player) {
  elements.editingPlayerId.value = player.id;
  elements.playerName.value = player.name;
  elements.playerRole.value = player.role;
  statKeys.forEach((key) => {
    elements[key].value = player[key];
  });
  elements.playerName.focus();
}

function openPlayerDetails(playerName) {
  // Clicking a name gathers that player's entries from every war, then draws the analytics view.
  const entries = getPlayerHistory(playerName);
  if (!entries.length) return;

  const bestEntry = entries.reduce((best, entry) => (entry.score > best.score ? entry : best), entries[0]);
  const averageScore = Math.round(entries.reduce((sum, entry) => sum + entry.score, 0) / entries.length);
  const averageRank = getRank(averageScore);
  const latestRole = entries[entries.length - 1].player.role;

  elements.modalPlayerName.textContent = playerName;
  elements.modalPlayerRole.textContent = latestRole;
  elements.modalAverageRank.textContent = `${averageRank} Class`;
  elements.modalAverageRank.className = rankClass(averageRank);
  elements.modalMatches.textContent = entries.length;
  elements.modalBestWar.textContent = `${bestEntry.war.name} (${formatNumber(bestEntry.score)})`;

  elements.playerDetailBody.innerHTML = "";
  entries.forEach((entry) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(entry.war.name)}</td>
      <td>${entry.war.date}</td>
      <td>${escapeHtml(entry.player.role)}</td>
      <td>${escapeHtml(summarizeStats(entry.player))}</td>
      <td>${formatNumber(entry.score)}</td>
      <td><span class="rank-badge ${rankClass(entry.rank)}">${entry.rank} Class</span></td>
    `;
    elements.playerDetailBody.appendChild(row);
  });

  elements.playerModal.classList.add("is-open");
  elements.playerModal.setAttribute("aria-hidden", "false");
  drawPerformanceChart(entries, latestRole);
}

function getPlayerHistory(playerName) {
  return state.wars
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .flatMap((war) => {
      return war.players
        .filter((player) => player.name.toLowerCase() === playerName.toLowerCase())
        .map((player) => {
          const score = calculateScore(player);
          return { war, player, score, rank: getRank(score) };
        });
    });
}

function drawPerformanceChart(entries, fallbackRole) {
  // Lightweight canvas chart: cyan = total score, pink = the role's key contribution stat.
  const canvas = elements.performanceChart;
  const context = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const padding = { top: 28, right: 34, bottom: 62, left: 70 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const scoreValues = entries.map((entry) => entry.score);
  const contributionStat = roleContributionStat[fallbackRole] || "damage";
  const contributionValues = entries.map((entry) => numberValue(entry.player[roleContributionStat[entry.player.role] || contributionStat]));
  const maxScore = Math.max(100, ...scoreValues);
  const maxContribution = Math.max(100, ...contributionValues);

  context.clearRect(0, 0, width, height);
  context.fillStyle = "rgba(5, 9, 23, 0.96)";
  context.fillRect(0, 0, width, height);

  drawGrid(context, padding, plotWidth, plotHeight, maxScore);
  drawLine(context, entries, scoreValues, maxScore, padding, plotWidth, plotHeight, "#55f2ff", "Score");
  drawLine(context, entries, contributionValues, maxContribution, padding, plotWidth, plotHeight, "#ff5fd7", "Role stat");
  drawLabels(context, entries, padding, plotWidth, height, maxScore, contributionStat);
}

function drawGrid(context, padding, plotWidth, plotHeight, maxScore) {
  context.strokeStyle = "rgba(255, 255, 255, 0.14)";
  context.lineWidth = 1;
  context.font = "14px Arial";
  context.fillStyle = "#aeb8d9";

  for (let i = 0; i <= 4; i++) {
    const y = padding.top + plotHeight - (plotHeight * i) / 4;
    const label = Math.round((maxScore * i) / 4);
    context.beginPath();
    context.moveTo(padding.left, y);
    context.lineTo(padding.left + plotWidth, y);
    context.stroke();
    context.fillText(label, 18, y + 5);
  }

  context.strokeStyle = "rgba(85, 242, 255, 0.6)";
  context.beginPath();
  context.moveTo(padding.left, padding.top);
  context.lineTo(padding.left, padding.top + plotHeight);
  context.lineTo(padding.left + plotWidth, padding.top + plotHeight);
  context.stroke();
}

function drawLine(context, entries, values, maxValue, padding, plotWidth, plotHeight, color, label) {
  const points = values.map((value, index) => {
    const x = padding.left + (entries.length === 1 ? plotWidth / 2 : (plotWidth * index) / (entries.length - 1));
    const y = padding.top + plotHeight - (numberValue(value) / maxValue) * plotHeight;
    return { x, y, value };
  });

  context.strokeStyle = color;
  context.lineWidth = 4;
  context.shadowColor = color;
  context.shadowBlur = 14;
  context.beginPath();
  points.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
  context.stroke();
  context.shadowBlur = 0;

  points.forEach((point) => {
    context.fillStyle = color;
    context.beginPath();
    context.arc(point.x, point.y, 6, 0, Math.PI * 2);
    context.fill();
  });

  context.fillStyle = color;
  context.font = "700 14px Arial";
  context.fillText(label, padding.left + 10, label === "Score" ? 24 : 44);
}

function drawLabels(context, entries, padding, plotWidth, height, maxScore, contributionStat) {
  context.font = "13px Arial";
  context.fillStyle = "#dce6ff";

  entries.forEach((entry, index) => {
    const x = padding.left + (entries.length === 1 ? plotWidth / 2 : (plotWidth * index) / (entries.length - 1));
    context.save();
    context.translate(x - 8, height - 22);
    context.rotate(-0.48);
    context.fillText(entry.war.name, 0, 0);
    context.restore();
  });

  context.fillStyle = "#aeb8d9";
  context.fillText(`Y-axis: player score. Pink line uses each war role's key contribution stat; latest role focus: ${prettyStatName(contributionStat)}.`, padding.left, height - 6);
}

function addEventListeners() {
  elements.warSelect.addEventListener("change", () => {
    activeWarId = elements.warSelect.value;
    clearPlayerForm();
    render();
  });

  elements.warForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const newWar = {
      id: createId(),
      name: elements.warName.value.trim(),
      enemy: elements.enemyName.value.trim(),
      date: elements.warDate.value,
      players: []
    };
    state.wars.push(newWar);
    activeWarId = newWar.id;
    elements.warForm.reset();
    render();
  });

  elements.deleteWarBtn.addEventListener("click", () => {
    const war = getActiveWar();
    if (!war) return;
    if (!confirm(`Delete "${war.name}" and all of its player entries?`)) return;
    state.wars = state.wars.filter((item) => item.id !== war.id);
    activeWarId = state.wars[0]?.id || null;
    clearPlayerForm();
    render();
  });

  elements.playerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const war = getActiveWar();
    if (!war) return;

    const player = {
      id: elements.editingPlayerId.value || createId(),
      name: elements.playerName.value.trim(),
      role: elements.playerRole.value,
      kills: numberValue(elements.kills.value),
      assists: numberValue(elements.assists.value),
      deaths: numberValue(elements.deaths.value),
      damage: numberValue(elements.damage.value),
      tanking: numberValue(elements.tanking.value),
      healing: numberValue(elements.healing.value),
      siege: numberValue(elements.siege.value),
      funCoins: numberValue(elements.funCoins.value)
    };

    const existingIndex = war.players.findIndex((item) => item.id === player.id);
    if (existingIndex >= 0) war.players[existingIndex] = player;
    else war.players.push(player);

    clearPlayerForm();
    render();
  });

  elements.cancelEditBtn.addEventListener("click", clearPlayerForm);

  elements.leaderboardBody.addEventListener("click", (event) => {
    const playerButton = event.target.closest("[data-player-name]");
    const editButton = event.target.closest("[data-edit-player]");
    const deleteButton = event.target.closest("[data-delete-player]");
    const war = getActiveWar();
    if (!war) return;

    if (playerButton) {
      openPlayerDetails(playerButton.dataset.playerName);
    }

    if (editButton) {
      const player = war.players.find((item) => item.id === editButton.dataset.editPlayer);
      if (player) fillPlayerForm(player);
    }

    if (deleteButton) {
      const player = war.players.find((item) => item.id === deleteButton.dataset.deletePlayer);
      if (!player || !confirm(`Delete ${player.name}'s entry from this war?`)) return;
      war.players = war.players.filter((item) => item.id !== player.id);
      clearPlayerForm();
      render();
    }
  });

  elements.weightsConfig.addEventListener("input", (event) => {
    const input = event.target.closest("[data-role][data-weight-key]");
    if (!input) return;
    state.weights[input.dataset.role][input.dataset.weightKey] = numberValue(input.value);
    renderActiveWar(getActiveWar());
    renderLeaderboard(getActiveWar());
    saveState();
  });

  elements.thresholdConfig.addEventListener("input", (event) => {
    const input = event.target.closest("[data-rank]");
    if (!input) return;
    state.thresholds[input.dataset.rank] = numberValue(input.value);
    renderLeaderboard(getActiveWar());
    saveState();
  });

  elements.resetAllBtn.addEventListener("click", () => {
    if (!confirm("Reset all wars, players, weights, and rank thresholds back to demo data?")) return;
    localStorage.removeItem(STORAGE_KEY);
    state = createDemoState();
    activeWarId = state.wars[0].id;
    clearPlayerForm();
    render();
  });

  elements.closeModalBtn.addEventListener("click", closeModal);
  elements.playerModal.addEventListener("click", (event) => {
    if (event.target === elements.playerModal) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });
}

function closeModal() {
  elements.playerModal.classList.remove("is-open");
  elements.playerModal.setAttribute("aria-hidden", "true");
}

addEventListeners();
render();
