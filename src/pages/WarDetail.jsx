import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Save, Trash2 } from 'lucide-react';
import { api } from '../api.js';
import { STAT_FIELDS } from '../constants.js';
import RankBadge from '../components/RankBadge.jsx';
import ScoreBreakdown from '../components/ScoreBreakdown.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';

export default function WarDetail({ players, refresh }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [war, setWar] = useState(null);
  const [stats, setStats] = useState([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [saveError, setSaveError] = useState('');

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
    setSaveError('');
    try {
      const nextWar = await api.updateWarStats(id, stats);
      setWar(nextWar);
      setStats(nextWar.stats.map(({ scoring, playerName, ...stat }) => stat));
      await refresh();
    } catch (error) {
      setSaveError(error.message || 'Unable to save stats.');
    } finally {
      setSaving(false);
    }
  };

  const deleteWar = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await api.deleteWar(id);
      await refresh();
      navigate('/wars');
    } catch (error) {
      setDeleteError(error.message || 'Delete failed. Please try again.');
    } finally {
      setDeleting(false);
    }
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
          {saveError && <p className="mt-2 text-sm text-red-200">{saveError}</p>}
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="button-danger" type="button" onClick={() => { setDeleteError(''); setConfirmDelete(true); }}>
            <Trash2 className="h-5 w-5" />
            Delete War
          </button>
          <button className="button-primary" type="button" onClick={save} disabled={saving}>
            <Save className="h-5 w-5" />
            {saving ? 'Saving' : 'Save Stats'}
          </button>
        </div>
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
      <ConfirmModal
        open={confirmDelete}
        title="Delete war?"
        message={`Are you sure you want to delete this war against ${war.opponent}? All related stat entries will be removed.`}
        error={deleteError}
        confirmLabel="Delete War"
        busy={deleting}
        onCancel={() => { setDeleteError(''); setConfirmDelete(false); }}
        onConfirm={deleteWar}
      />
    </div>
  );
}
