import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedData } from './seed.js';
import { scoreStats } from './scoring.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localDataDir = path.join(__dirname, 'data');
const runtimeDataDir = process.env.VERCEL || process.env.NETLIFY
  ? path.join('/tmp', 'guild-wars-performance-tracker')
  : localDataDir;
const jsonPath = path.join(runtimeDataDir, 'guildwars.json');
const sqlitePath = path.join(runtimeDataDir, 'guildwars.sqlite');

fs.mkdirSync(runtimeDataDir, { recursive: true });

function nextId(items) {
  return items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1;
}

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

function withScores(war, players) {
  const stats = war.stats.map((stat) => {
    const player = players.find((candidate) => candidate.id === stat.playerId);
    const role = stat.role || player?.role || 'DPS';
    return {
      ...stat,
      role,
      playerName: player?.name || 'Unknown Disciple',
      scoring: scoreStats(role, stat)
    };
  });
  return { ...war, stats };
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

class JsonStore {
  constructor() {
    if (!fs.existsSync(jsonPath)) {
      fs.writeFileSync(jsonPath, JSON.stringify(seedData, null, 2));
    }
  }

  read() {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  }

  write(data) {
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
  }

  getPlayers() {
    return this.read().players;
  }

  createPlayer(player) {
    const data = this.read();
    const created = { id: nextId(data.players), name: player.name, role: player.role };
    data.players.push(created);
    this.write(data);
    return created;
  }

  updatePlayer(id, patch) {
    const data = this.read();
    data.players = data.players.map((player) => (player.id === Number(id) ? { ...player, ...patch, id: player.id } : player));
    this.write(data);
    return data.players.find((player) => player.id === Number(id));
  }

  deletePlayer(id) {
    const data = this.read();
    data.players = data.players.filter((player) => player.id !== Number(id));
    data.wars = data.wars.map((war) => ({
      ...war,
      stats: war.stats.filter((stat) => stat.playerId !== Number(id))
    }));
    this.write(data);
  }

  deleteWar(id) {
    const data = this.read();
    data.wars = data.wars.filter((war) => war.id !== Number(id));
    this.write(data);
  }

  getWars() {
    const data = this.read();
    return data.wars.map((war) => withScores(war, data.players));
  }

  getWar(id) {
    const data = this.read();
    const war = data.wars.find((candidate) => candidate.id === Number(id));
    return war ? withScores(war, data.players) : null;
  }

  createWar(war) {
    const data = this.read();
    const players = data.players;
    const created = {
      id: nextId(data.wars),
      opponent: war.opponent,
      date: war.date,
      notes: war.notes || '',
      stats: (war.playerIds || []).map((playerId) => {
        const player = players.find((candidate) => candidate.id === Number(playerId));
        return normalizeStats({ playerId, role: player?.role || 'DPS' });
      })
    };
    data.wars.push(created);
    this.write(data);
    return withScores(created, players);
  }

  updateWar(id, patch) {
    const data = this.read();
    data.wars = data.wars.map((war) => (war.id === Number(id) ? { ...war, ...patch, id: war.id } : war));
    this.write(data);
    return this.getWar(id);
  }

  upsertWarStats(id, stats) {
    const data = this.read();
    const war = data.wars.find((candidate) => candidate.id === Number(id));
    if (!war) return null;
    war.stats = stats.map(normalizeStats);
    this.write(data);
    return this.getWar(id);
  }

  getLeaderboard({ role, warId } = {}) {
    const data = this.read();
    const wars = warId ? data.wars.filter((war) => war.id === Number(warId)) : data.wars;
    return aggregate(data.players, wars)
      .filter((player) => !role || role === 'All' || player.role === role)
      .sort((a, b) => b.averageScore - a.averageScore);
  }

  getPlayerHistory(id) {
    const data = this.read();
    const player = data.players.find((candidate) => candidate.id === Number(id));
    if (!player) return null;
    const history = data.wars
      .map((war) => {
        const stat = war.stats.find((entry) => entry.playerId === Number(id));
        if (!stat) return null;
        const scoring = scoreStats(stat.role || player.role, stat);
        return { warId: war.id, opponent: war.opponent, date: war.date, ...stat, scoring };
      })
      .filter(Boolean);
    return { player, history };
  }
}

class SqliteStore extends JsonStore {
  constructor(Database) {
    super();
    this.db = new Database(sqlitePath);
    this.db.pragma('journal_mode = WAL');
    this.init();
  }

  init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS wars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        opponent TEXT NOT NULL,
        date TEXT NOT NULL,
        notes TEXT DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS war_stats (
        war_id INTEGER NOT NULL,
        player_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        kills INTEGER DEFAULT 0,
        assists INTEGER DEFAULT 0,
        deaths INTEGER DEFAULT 0,
        damage INTEGER DEFAULT 0,
        healing INTEGER DEFAULT 0,
        siege_damage INTEGER DEFAULT 0,
        fun_coins INTEGER DEFAULT 0,
        PRIMARY KEY (war_id, player_id)
      );
    `);
    const count = this.db.prepare('SELECT COUNT(*) as count FROM players').get().count;
    if (!count) this.seedSqlite();
  }

  seedSqlite() {
    const insertPlayer = this.db.prepare('INSERT INTO players (id, name, role) VALUES (?, ?, ?)');
    const insertWar = this.db.prepare('INSERT INTO wars (id, opponent, date, notes) VALUES (?, ?, ?, ?)');
    const insertStat = this.db.prepare(`
      INSERT INTO war_stats
      (war_id, player_id, role, kills, assists, deaths, damage, healing, siege_damage, fun_coins)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const seed = this.db.transaction(() => {
      seedData.players.forEach((player) => insertPlayer.run(player.id, player.name, player.role));
      seedData.wars.forEach((war) => {
        insertWar.run(war.id, war.opponent, war.date, war.notes);
        war.stats.forEach((stat) => insertStat.run(
          war.id,
          stat.playerId,
          stat.role,
          stat.kills,
          stat.assists,
          stat.deaths,
          stat.damage,
          stat.healing,
          stat.siegeDamage,
          stat.funCoins
        ));
      });
    });
    seed();
  }

  rowsToWars(rows = this.db.prepare('SELECT * FROM wars ORDER BY date DESC, id DESC').all()) {
    const players = this.getPlayers();
    const stats = this.db.prepare('SELECT * FROM war_stats WHERE war_id = ? ORDER BY player_id');
    return rows.map((war) => withScores({
      id: war.id,
      opponent: war.opponent,
      date: war.date,
      notes: war.notes,
      stats: stats.all(war.id).map((stat) => ({
        playerId: stat.player_id,
        role: stat.role,
        kills: stat.kills,
        assists: stat.assists,
        deaths: stat.deaths,
        damage: stat.damage,
        healing: stat.healing,
        siegeDamage: stat.siege_damage,
        funCoins: stat.fun_coins
      }))
    }, players));
  }

  getPlayers() {
    return this.db.prepare('SELECT id, name, role FROM players ORDER BY name').all();
  }

  createPlayer(player) {
    const result = this.db.prepare('INSERT INTO players (name, role) VALUES (?, ?)').run(player.name, player.role);
    return { id: Number(result.lastInsertRowid), name: player.name, role: player.role };
  }

  updatePlayer(id, patch) {
    const existing = this.db.prepare('SELECT * FROM players WHERE id = ?').get(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch };
    this.db.prepare('UPDATE players SET name = ?, role = ? WHERE id = ?').run(updated.name, updated.role, id);
    return { id: Number(id), name: updated.name, role: updated.role };
  }

  deletePlayer(id) {
    this.db.prepare('DELETE FROM war_stats WHERE player_id = ?').run(id);
    this.db.prepare('DELETE FROM players WHERE id = ?').run(id);
  }

  deleteWar(id) {
    const remove = this.db.transaction(() => {
      this.db.prepare('DELETE FROM war_stats WHERE war_id = ?').run(id);
      this.db.prepare('DELETE FROM wars WHERE id = ?').run(id);
    });
    remove();
  }

  getWars() {
    return this.rowsToWars();
  }

  getWar(id) {
    const row = this.db.prepare('SELECT * FROM wars WHERE id = ?').get(id);
    return row ? this.rowsToWars([row])[0] : null;
  }

  createWar(war) {
    const result = this.db.prepare('INSERT INTO wars (opponent, date, notes) VALUES (?, ?, ?)').run(war.opponent, war.date, war.notes || '');
    const id = Number(result.lastInsertRowid);
    const players = this.getPlayers();
    const insert = this.db.prepare(`
      INSERT INTO war_stats
      (war_id, player_id, role, kills, assists, deaths, damage, healing, siege_damage, fun_coins)
      VALUES (?, ?, ?, 0, 0, 0, 0, 0, 0, 0)
    `);
    (war.playerIds || []).forEach((playerId) => {
      const player = players.find((candidate) => candidate.id === Number(playerId));
      insert.run(id, playerId, player?.role || 'DPS');
    });
    return this.getWar(id);
  }

  updateWar(id, patch) {
    const current = this.db.prepare('SELECT * FROM wars WHERE id = ?').get(id);
    if (!current) return null;
    this.db.prepare('UPDATE wars SET opponent = ?, date = ?, notes = ? WHERE id = ?')
      .run(patch.opponent ?? current.opponent, patch.date ?? current.date, patch.notes ?? current.notes, id);
    return this.getWar(id);
  }

  upsertWarStats(id, stats) {
    if (!this.getWar(id)) return null;
    const clear = this.db.prepare('DELETE FROM war_stats WHERE war_id = ?');
    const insert = this.db.prepare(`
      INSERT INTO war_stats
      (war_id, player_id, role, kills, assists, deaths, damage, healing, siege_damage, fun_coins)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const save = this.db.transaction(() => {
      clear.run(id);
      stats.map(normalizeStats).forEach((stat) => insert.run(
        id,
        stat.playerId,
        stat.role,
        stat.kills,
        stat.assists,
        stat.deaths,
        stat.damage,
        stat.healing,
        stat.siegeDamage,
        stat.funCoins
      ));
    });
    save();
    return this.getWar(id);
  }

  getLeaderboard({ role, warId } = {}) {
    const players = this.getPlayers();
    const wars = warId ? [this.getWar(Number(warId))].filter(Boolean) : this.getWars();
    return aggregate(players, wars)
      .filter((player) => !role || role === 'All' || player.role === role)
      .sort((a, b) => b.averageScore - a.averageScore);
  }

  getPlayerHistory(id) {
    const player = this.db.prepare('SELECT id, name, role FROM players WHERE id = ?').get(id);
    if (!player) return null;
    const rows = this.db.prepare(`
      SELECT
        w.id as war_id,
        w.opponent,
        w.date,
        s.player_id,
        s.role,
        s.kills,
        s.assists,
        s.deaths,
        s.damage,
        s.healing,
        s.siege_damage,
        s.fun_coins
      FROM wars w
      JOIN war_stats s ON s.war_id = w.id
      WHERE s.player_id = ?
      ORDER BY w.date ASC, w.id ASC
    `).all(id);
    const history = rows.map((row) => {
      const stat = {
        warId: row.war_id,
        opponent: row.opponent,
        date: row.date,
        playerId: row.player_id,
        role: row.role,
        kills: row.kills,
        assists: row.assists,
        deaths: row.deaths,
        damage: row.damage,
        healing: row.healing,
        siegeDamage: row.siege_damage,
        funCoins: row.fun_coins
      };
      return { ...stat, scoring: scoreStats(stat.role || player.role, stat) };
    });
    return { player, history };
  }
}

export async function createStore() {
  try {
    const { default: Database } = await import('better-sqlite3');
    const store = new SqliteStore(Database);
    store.kind = 'sqlite';
    return store;
  } catch (error) {
    const store = new JsonStore();
    store.kind = 'json';
    store.sqliteError = error.message;
    return store;
  }
}
