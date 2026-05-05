# Guild Wars Performance Tracker

A martial-arts / wuxia themed full-stack tracker for Where Winds Meet guild wars. It evaluates players by role execution instead of raw stat totals, with jungler Fun Coins treated as the primary control/resource metric.

## Stack

- React + Vite
- Node.js + Express
- SQLite through `better-sqlite3`, with automatic JSON persistence fallback
- TailwindCSS
- Recharts

## Run

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:4177`

For production:

```bash
npm run build
npm start
```

The Express server serves `dist/` and all `/api` routes.
