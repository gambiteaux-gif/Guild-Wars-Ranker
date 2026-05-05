import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import { api } from '../api.js';
import { STAT_FIELDS } from '../constants.js';
import RankBadge from '../components/RankBadge.jsx';
import ScoreBreakdown from '../components/ScoreBreakdown.jsx';

export default function WarDetail({ players, refresh }) {
  const { id } = useParams();
  const [war, setWar] = useState(null);
  const [stats, setStats] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const nextWar = await api.war(id);
    setWar(nextWar);
    setStats(nextWar.stats.map(({ scoring, playerName, ...stat }) => stat));
  };

  useEffect(() => {
    load();
  }, [id]);

  const update = (playerId, field, value) => {
    setStats((current) => current.map((stat) => (stat.playerId === playerId ? { ...stat, [field]: Number(value) } : stat)));
  };

  const save = async () => {
    setSaving(true);
    const nextWar = await api.updateWarStats(id, stats);
    setWar(nextWar);
    setStats(nextWar.stats.map(({ scoring, playerName, ...stat }) => stat));
    await refresh();
    setSaving(false);
  };

  if (!war) return <div className="panel p-6 text-gold">Loading war scroll...</div>;

  const scoredByPlayer = new Map(war.stats.map((stat) => [stat.playerId, stat]));

  return (
    <div className="space-y-6">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{war.date}</p>
          <h2>{war.opponent}</h2>
          {war.notes && <p className="mt-2 max-w-3xl text-stone-400">{war.notes}</p>}
        </div>
        <button className="button-primary" type="button" onClick={save} disabled={saving}>
          <Save className="h-5 w-5" />
          {saving ? 'Saving' : 'Save Stats'}
        </button>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Role</th>
                {STAT_FIELDS.map(([, label]) => <th key={label}>{label}</th>)}
                <th>Rank</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((stat) => {
                const player = players.find((candidate) => candidate.id === stat.playerId);
                const scored = scoredByPlayer.get(stat.playerId);
                return (
                  <tr key={stat.playerId}>
                    <td><Link className="link" to={`/players/${stat.playerId}`}>{player?.name || scored?.playerName}</Link></td>
                    <td>{stat.role}</td>
                    {STAT_FIELDS.map(([field]) => (
                      <td key={field}>
                        <input
                          className="stat-input"
                          type="number"
                          min="0"
                          value={stat[field]}
                          onChange={(event) => update(stat.playerId, field, event.target.value)}
                        />
                      </td>
                    ))}
                    <td>{scored && <RankBadge compact rank={scored.scoring.rank} />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {war.stats.toSorted((a, b) => b.scoring.score - a.scoring.score).map((stat) => (
          <div key={stat.playerId} className="panel p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Link to={`/players/${stat.playerId}`} className="link block truncate font-display text-2xl">{stat.playerName}</Link>
                <p className="text-sm text-stone-400">{stat.role}</p>
              </div>
              <RankBadge rank={stat.scoring.rank} title={stat.scoring.title} score={stat.scoring.score} />
            </div>
            <ScoreBreakdown scoring={stat.scoring} />
          </div>
        ))}
      </div>
    </div>
  );
}
