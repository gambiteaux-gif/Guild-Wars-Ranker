import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { rankScale } from '../constants.js';

export default function TrendChart({ history }) {
  const data = history.map((entry) => ({
    name: entry.opponent,
    date: entry.date,
    score: entry.scoring.score,
    rankValue: rankScale[entry.scoring.rank],
    damage: entry.damage,
    healing: entry.healing,
    deaths: entry.deaths
  }));

  return (
    <div className="panel h-96 p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="font-display text-2xl text-gold">Performance Path</p>
          <p className="text-sm text-stone-400">Score trend shows improvement or decline across wars.</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="82%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid stroke="rgba(213,168,76,0.12)" />
          <XAxis dataKey="date" stroke="#a8a29e" tick={{ fontSize: 12 }} />
          <YAxis stroke="#a8a29e" tick={{ fontSize: 12 }} domain={[0, 100]} />
          <Tooltip
            contentStyle={{ background: '#120b0a', border: '1px solid rgba(213,168,76,0.28)', color: '#f5f5f4' }}
            labelStyle={{ color: '#d5a84c' }}
          />
          <Line type="monotone" dataKey="score" name="Role score" stroke="#d5a84c" strokeWidth={3} dot={{ r: 5 }} />
          <Line type="monotone" dataKey="rankValue" name="Rank scale" stroke="#67c6a3" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="deaths" name="Deaths" stroke="#c2412d" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
