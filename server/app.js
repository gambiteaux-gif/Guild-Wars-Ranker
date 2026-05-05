import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStore } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function createApp({ serveStatic = false } = {}) {
  const app = express();
  const store = await createStore();

  app.set('persistence', store.kind);
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, persistence: store.kind });
  });

  app.get('/api/players', (_req, res) => {
    res.json(store.getPlayers());
  });

  app.post('/api/players', (req, res) => {
    if (!req.body?.name || !req.body?.role) {
      res.status(400).json({ error: 'name and role are required' });
      return;
    }
    res.status(201).json(store.createPlayer(req.body));
  });

  app.put('/api/players/:id', (req, res) => {
    const player = store.updatePlayer(Number(req.params.id), req.body);
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }
    res.json(player);
  });

  app.delete('/api/players/:id', (req, res) => {
    store.deletePlayer(Number(req.params.id));
    res.status(204).end();
  });

  app.get('/api/players/:id/history', (req, res) => {
    const history = store.getPlayerHistory(Number(req.params.id));
    if (!history) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }
    res.json(history);
  });

  app.get('/api/wars', (_req, res) => {
    res.json(store.getWars());
  });

  app.post('/api/wars', (req, res) => {
    if (!req.body?.opponent || !req.body?.date) {
      res.status(400).json({ error: 'opponent and date are required' });
      return;
    }
    res.status(201).json(store.createWar(req.body));
  });

  app.get('/api/wars/:id', (req, res) => {
    const war = store.getWar(Number(req.params.id));
    if (!war) {
      res.status(404).json({ error: 'War not found' });
      return;
    }
    res.json(war);
  });

  app.put('/api/wars/:id', (req, res) => {
    const war = store.updateWar(Number(req.params.id), req.body);
    if (!war) {
      res.status(404).json({ error: 'War not found' });
      return;
    }
    res.json(war);
  });

  app.delete('/api/wars/:id', (req, res) => {
    store.deleteWar(Number(req.params.id));
    res.status(204).end();
  });

  app.put('/api/wars/:id/stats', (req, res) => {
    if (!Array.isArray(req.body?.stats)) {
      res.status(400).json({ error: 'stats array is required' });
      return;
    }
    const war = store.upsertWarStats(Number(req.params.id), req.body.stats);
    if (!war) {
      res.status(404).json({ error: 'War not found' });
      return;
    }
    res.json(war);
  });

  app.get('/api/leaderboard', (req, res) => {
    res.json(store.getLeaderboard({ role: req.query.role, warId: req.query.warId }));
  });

  if (serveStatic) {
    const dist = path.join(__dirname, '..', 'dist');
    app.use(express.static(dist));
    app.get(/.*/, (_req, res) => {
      res.sendFile(path.join(dist, 'index.html'));
    });
  }

  return app;
}
