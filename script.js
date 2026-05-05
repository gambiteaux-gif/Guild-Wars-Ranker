// These keys are used to save and load data from the browser's localStorage.
const PLAYERS_STORAGE_KEY = "windsMeetGuildWarsPlayers";
const WEIGHTS_STORAGE_KEY = "windsMeetGuildWarsWeights";

// Edit rank ranges here if your guild wants different class thresholds.
// maxScore is inclusive. Infinity means there is no upper limit.
const RANK_TIERS = [
  { name: "E Class", minScore: 0, maxScore: 999, cssClass: "rank-e" },
  { name: "D Class", minScore: 1000, maxScore: 2499, cssClass: "rank-d" },
  { name: "C Class", minScore: 2500, maxScore: 4999, cssClass: "rank-c" },
  { name: "B Class", minScore: 5000, maxScore: 7999, cssClass: "rank-b" },
  { name: "A Class", minScore: 8000, maxScore: 11999, cssClass: "rank-a" },
  { name: "S Class", minScore: 12000, maxScore: Infinity, cssClass: "rank-s" }
];

// Default scoring weights. These can be changed live in the Weights Panel.
const DEFAULT_WEIGHTS = {
  kills: 10,
  assists: 6,
  deaths: -8,
  funCoins: 1,
  damage: 0.002,
  tank: 0.002,
  heal: 0.002,
  siegeDamage: 0.003
};

// Labels keep the display text separate from the data names used in JavaScript.
const STAT_LABELS = {
  kills: "Kills",
  assists: "Assists",
  deaths: "Deaths",
  funCoins: "Fun Coins",
  damage: "Damage",
  tank: "Tank",
  heal: "Heal",
  siegeDamage: "Siege Damage"
};

const playerForm = document.getElementById("playerForm");
const weightsForm = document.getElementById("weightsForm");
const leaderboardBody = document.getElementById("leaderboardBody");
const resetButton = document.getElementById("resetButton");

let players = loadPlayers();
let weights = loadWeights();

buildWeightsPanel();
renderLeaderboard();

playerForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const formData = new FormData(playerForm);

  const player = {
    name: formData.get("name").trim(),
    kills: getNumberFromForm(formData, "kills"),
    assists: getNumberFromForm(formData, "assists"),
    deaths: getNumberFromForm(formData, "deaths"),
    funCoins: getNumberFromForm(formData, "funCoins"),
    damage: getNumberFromForm(formData, "damage"),
    tank: getNumberFromForm(formData, "tank"),
    heal: getNumberFromForm(formData, "heal"),
    siegeDamage: getNumberFromForm(formData, "siegeDamage")
  };

  players.push(player);
  savePlayers();
  renderLeaderboard();

  playerForm.reset();
  document.getElementById("playerName").focus();
});

resetButton.addEventListener("click", function () {
  const confirmed = confirm("Reset all saved players and weights?");

  if (!confirmed) {
    return;
  }

  players = [];
  weights = { ...DEFAULT_WEIGHTS };
  savePlayers();
  saveWeights();
  buildWeightsPanel();
  renderLeaderboard();
});

function buildWeightsPanel() {
  weightsForm.innerHTML = "";

  Object.keys(DEFAULT_WEIGHTS).forEach(function (statName) {
    const label = document.createElement("label");
    label.textContent = STAT_LABELS[statName];

    const input = document.createElement("input");
    input.type = "number";
    input.step = "any";
    input.value = weights[statName];
    input.dataset.weightName = statName;

    input.addEventListener("input", function () {
      const newValue = Number(input.value);
      weights[statName] = Number.isFinite(newValue) ? newValue : 0;
      saveWeights();
      renderLeaderboard();
    });

    label.appendChild(input);
    weightsForm.appendChild(label);
  });
}

function renderLeaderboard() {
  const playersWithScores = players
    .map(function (player) {
      const score = calculateScore(player);
      const rank = getRankTier(score);

      return {
        ...player,
        score,
        rank
      };
    })
    .sort(function (firstPlayer, secondPlayer) {
      return secondPlayer.score - firstPlayer.score;
    });

  leaderboardBody.innerHTML = "";

  if (playersWithScores.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="11" class="empty-state">No players added yet.</td>';
    leaderboardBody.appendChild(row);
    return;
  }

  playersWithScores.forEach(function (player) {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${escapeHtml(player.name)}</td>
      <td>${formatWholeNumber(player.kills)}</td>
      <td>${formatWholeNumber(player.assists)}</td>
      <td>${formatWholeNumber(player.deaths)}</td>
      <td>${formatWholeNumber(player.funCoins)}</td>
      <td>${formatWholeNumber(player.damage)}</td>
      <td>${formatWholeNumber(player.tank)}</td>
      <td>${formatWholeNumber(player.heal)}</td>
      <td>${formatWholeNumber(player.siegeDamage)}</td>
      <td class="score-cell">${formatScore(player.score)}</td>
      <td><span class="rank-badge ${player.rank.cssClass}">${player.rank.name}</span></td>
    `;

    leaderboardBody.appendChild(row);
  });
}

function calculateScore(player) {
  return (
    player.kills * weights.kills +
    player.assists * weights.assists +
    player.deaths * weights.deaths +
    player.funCoins * weights.funCoins +
    player.damage * weights.damage +
    player.tank * weights.tank +
    player.heal * weights.heal +
    player.siegeDamage * weights.siegeDamage
  );
}

function getRankTier(score) {
  const matchingTier = RANK_TIERS.find(function (tier) {
    return score >= tier.minScore && score <= tier.maxScore;
  });

  // Scores below zero still display as E Class instead of showing an empty rank.
  return matchingTier || RANK_TIERS[0];
}

function getNumberFromForm(formData, fieldName) {
  const value = Number(formData.get(fieldName));
  return Number.isFinite(value) ? value : 0;
}

function loadPlayers() {
  const savedPlayers = localStorage.getItem(PLAYERS_STORAGE_KEY);

  if (!savedPlayers) {
    return [];
  }

  try {
    return JSON.parse(savedPlayers);
  } catch (error) {
    console.warn("Could not load saved players.", error);
    return [];
  }
}

function savePlayers() {
  localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(players));
}

function loadWeights() {
  const savedWeights = localStorage.getItem(WEIGHTS_STORAGE_KEY);

  if (!savedWeights) {
    return { ...DEFAULT_WEIGHTS };
  }

  try {
    return {
      ...DEFAULT_WEIGHTS,
      ...JSON.parse(savedWeights)
    };
  } catch (error) {
    console.warn("Could not load saved weights.", error);
    return { ...DEFAULT_WEIGHTS };
  }
}

function saveWeights() {
  localStorage.setItem(WEIGHTS_STORAGE_KEY, JSON.stringify(weights));
}

function formatScore(score) {
  return score.toLocaleString(undefined, {
    maximumFractionDigits: 2
  });
}

function formatWholeNumber(number) {
  return number.toLocaleString(undefined, {
    maximumFractionDigits: 0
  });
}

// Prevent typed player names from being interpreted as HTML in the table.
function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
