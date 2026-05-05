import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarPlus, ScrollText, Swords, Trash2 } from 'lucide-react';
import { api } from '../api.js';
import RosterPicker from '../components/RosterPicker.jsx';
import RankBadge from '../components/RankBadge.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';

export default function Wars({ players, wars, refresh }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    opponent: '',
    date: new Date().toISOString().slice(0, 10),
    notes: ''
  });
  const [selected, setSelected] = useState([]);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [formError, setFormError] = useState('');
  const selectedPlayers = useMemo(() => players.filter((player) => selected.includes(player.id)), [players, selected]);

  const submit = async (event) => {
    event.preventDefault();
    setFormError('');
    try {
      const war = await api.createWar({ ...form, playerIds: selected });
      await refresh();
      navigate(`/wars/${war.id}`);
    } catch (error) {
      setFormError(error.message || 'Unable to save war.');
    }
  };

  const removeWar = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.deleteWar(pendingDelete.id);
      await refresh();
      setPendingDelete(null);
    } catch (error) {
      setDeleteError(error.message || 'Delete failed. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-7">
      <div className="section-heading">
        <div>
          <p className="eyebrow">War Creation</p>
          <h2>Battle Scrolls</h2>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="panel grid gap-4 p-5 md:grid-cols-[1fr_12rem]">
          <input className="input" required placeholder="Opponent guild" value={form.opponent} onChange={(event) => setForm({ ...form, opponent: event.target.value })} />
          <input className="input" required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          <textarea className="input md:col-span-2" rows="3" placeholder="War notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
        </div>

        <RosterPicker players={players} selected={selected} setSelected={setSelected} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className={`text-sm ${formError ? 'text-red-200' : 'text-stone-400'}`}>{formError || `${selectedPlayers.length} players selected for this war.`}</p>
          <button className="button-primary" type="submit" disabled={!form.opponent || !selected.length}>
            <CalendarPlus className="h-5 w-5" />
            Save War
          </button>
        </div>
      </form>

      <div className="panel p-5">
        <div className="mb-5 flex items-center gap-3">
          <ScrollText className="h-5 w-5 text-gold" />
          <p className="font-display text-2xl text-gold">War History</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {wars.map((war) => {
            const top = war.stats.toSorted((a, b) => b.scoring.score - a.scoring.score)[0];
            return (
              <div key={war.id} className="war-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link to={`/wars/${war.id}`} className="link block truncate font-display text-xl text-stone-50">{war.opponent}</Link>
                    <p className="mt-1 text-sm text-stone-400">{war.date} - {war.stats.length} players</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Swords className="h-5 w-5 text-gold" />
                    <button type="button" className="icon-button danger-icon h-9 w-9" title="Delete war" onClick={() => { setDeleteError(''); setPendingDelete(war); }}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {top && (
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-sm text-stone-400">Top form: <span className="text-stone-100">{top.playerName}</span></span>
                    <RankBadge compact rank={top.scoring.rank} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="Delete war?"
        message={`Are you sure you want to delete this war${pendingDelete ? ` against ${pendingDelete.opponent}` : ''}? All related stat entries will be removed.`}
        error={deleteError}
        confirmLabel="Delete War"
        busy={deleting}
        onCancel={() => { setDeleteError(''); setPendingDelete(null); }}
        onConfirm={removeWar}
      />
    </div>
  );
}
