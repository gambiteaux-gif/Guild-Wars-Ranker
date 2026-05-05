import { seedData } from './seedData.js';
import { scoreStats } from './scoring.js';

const STORAGE_KEY = 'guild-wars-performance-tracker:v2';

const clone = (value) => JSON.parse(JSON.stringify(value));
const canUseLocalStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
const nextId = (items) => (items.length ? Math.max(...items.map((item) => Number(item.id))) + 1 : 1);

let memoryData = clone(seedData);

function normalizeStats(stat) {
  return {
    playerId: Number(stat.playerId),
    role: stat.role,
    kills: Number(stat.kills || 0),
    assists: Number(stat.assists || 0),
    deaths: Number(stat.deaths || 0),
    damage: Number(stat.damage || 0),
    healing: Number(stat.healing || 0),
    siegeDamage: Number(stat.siegeDamage || 0),
    funCoins: Number(stat.funCoins || 0)
  };
}

function readData() {
  if (!canUseLocalStorage()) return clone(memoryData);
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = clone(seedData);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      players: Array.isArray(parsed.players) ? parsed.players : [],
      wars: Array.isArray(parsed.wars) ? parsed.wars : []
    };
  } catch {
    const seeded = clone(seedData);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function writeData(data) {
  const clean = clone(data);
  memoryData = clean;
  if (canUseLocalStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent?.(new Event('guild-wars-data-change'));
  }
  return clean;
}

function withScores(war, players) {
  return {
    ...war,
    stats: war.stats.map((stat) => {
      const player = players.find((candidate) => candidate.id === stat.playerId);
      const role = stat.role || player?.role || 'DPS';
      return {
        ...stat,
        role,
        playerName: player?.name || 'Unknown Disciple',
        scoring: scoreStats(role, stat)
      };
    })
  };
}

function aggregate(players, wars) {
  return players.map((player) => {
    const appearances = wars
      .flatMap((war) => war.stats.map((stat) => ({ ...stat, war })))
      .filter((stat) => stat.playerId === player.id)
      .map((stat) => ({ ...stat, scoring: scoreStats(stat.role || player.role, stat) }));
    const averageScore = appearances.length
      ? Math.round(appearances.reduce((sum, stat) => sum + stat.scoring.score, 0) / appearances.length)
      : 0;
    const latest = appearances.at(-1);
    return {
      ...player,
      wars: appearances.length,
      averageScore,
      latestRank: latest?.scoring.rank || '-',
      bestScore: appearances.length ? Math.max(...appearances.map((stat) => stat.scoring.score)) : 0
    };
  });
}

function resolve(value) {
  return Promise.resolve(clone(value));
}

export const api = {
  health: () => resolve({ ok: true, persistence: 'browser localStorage' }),

  players: () => {
    const data = readData();
    return resolve(data.players.toSorted((a, b) => a.name.localeCompare(b.name)));
  },

  createPlayer: (body) => {
    const data = readData();
    const created = { id: nextId(data.players), name: body.name.trim(), role: body.role };
    writeData({ ...data, players: [...data.players, created] });
    return resolve(created);
  },

  updatePlayer: (id, body) => {
    const data = readData();
    const playerId = Number(id);
    const players = data.players.map((player) => (player.id === playerId ? { ...player, ...body, id: player.id } : player));
    writeData({ ...data, players });
    return resolve(players.find((player) => player.id === playerId));
  },

  deletePlayer: (id) => {
    const data = readData();
    const playerId = Number(id);
    const players = data.players.filter((player) => player.id !== playerId);
    const wars = data.wars.map((war) => ({
      ...war,
      stats: war.stats.filter((stat) => stat.playerId !== playerId)
    }));
    writeData({ players, wars });
    return resolve(null);
  },

  playerHistory: (id) => {
    const data = readData();
    const playerId = Number(id);
    const player = data.players.find((candidate) => candidate.id === playerId);
    if (!player) return Promise.reject(new Error('Player not found'));
    const history = data.wars
      .toSorted((a, b) => `${a.date}-${a.id}`.localeCompare(`${b.date}-${b.id}`))
      .map((war) => {
        const stat = war.stats.find((entry) => entry.playerId === playerId);
        if (!stat) return null;
        const role = stat.role || player.role;
        return {
          warId: war.id,
          opponent: war.opponent,
          date: war.date,
          ...stat,
          role,
          scoring: scoreStats(role, stat)
        };
      })
      .filter(Boolean);
    return resolve({ player, history });
  },

  wars: () => {
    const data = readData();
    return resolve(data.wars.toSorted((a, b) => `${b.date}-${b.id}`.localeCompare(`${a.date}-${a.id}`)).map((war) => withScores(war, data.players)));
  },

  war: (id) => {
    const data = readData();
    const war = data.wars.find((candidate) => candidate.id === Number(id));
    if (!war) return Promise.reject(new Error('War not found'));
    return resolve(withScores(war, data.players));
  },

  createWar: (body) => {
    const data = readData();
    const created = {
      id: nextId(data.wars),
      opponent: body.opponent.trim(),
      date: body.date,
      notes: body.notes || '',
      stats: (body.playerIds || []).map((playerId) => {
        const player = data.players.find((candidate) => candidate.id === Number(playerId));
        return normalizeStats({ playerId, role: player?.role || 'DPS' });
      })
    };
    writeData({ ...data, wars: [...data.wars, created] });
    return resolve(withScores(created, data.players));
  },

  deleteWar: (id) => {
    const data = readData();
    const warId = Number(id);
    writeData({ ...data, wars: data.wars.filter((war) => war.id !== warId) });
    return resolve(null);
  },

  updateWarStats: (id, stats) => {
    const data = readData();
    const warId = Number(id);
    const wars = data.wars.map((war) => (war.id === warId ? { ...war, stats: stats.map(normalizeStats) } : war));
    writeData({ ...data, wars });
    const war = wars.find((candidate) => candidate.id === warId);
    if (!war) return Promise.reject(new Error('War not found'));
    return resolve(withScores(war, data.players));
  },

  leaderboard: (params = {}) => {
    const data = readData();
    const wars = params.warId ? data.wars.filter((war) => war.id === Number(params.warId)) : data.wars;
    const players = aggregate(data.players, wars)
      .filter((player) => !params.role || params.role === 'All' || player.role === params.role)
      .sort((a, b) => b.averageScore - a.averageScore);
    return resolve(players);
  },

  resetDemoData: () => {
    writeData(clone(seedData));
    return resolve(null);
  }
};
