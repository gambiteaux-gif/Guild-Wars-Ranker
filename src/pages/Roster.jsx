import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../api.js';
import { ROLES } from '../constants.js';
import ConfirmModal from '../components/ConfirmModal.jsx';

export default function Roster({ players, refresh }) {
  const [form, setForm] = useState({ name: '', role: 'DPS' });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    await api.createPlayer(form);
    setForm({ name: '', role: 'DPS' });
    await refresh();
  };

  const remove = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.deletePlayer(pendingDelete.id);
      await refresh();
      setPendingDelete(null);
    } catch (error) {
      setDeleteError(error.message || 'Delete failed. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Roster System</p>
          <h2>War Disciples</h2>
        </div>
      </div>

      <form onSubmit={submit} className="panel grid gap-3 p-5 md:grid-cols-[1fr_12rem_auto]">
        <input className="input" placeholder="Player name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <select className="input" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
          {ROLES.map((role) => <option key={role}>{role}</option>)}
        </select>
        <button className="button-primary" type="submit">
          <Plus className="h-5 w-5" />
          Add
        </button>
      </form>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {players.map((player) => (
          <div key={player.id} className="panel p-4 transition duration-150 hover:-translate-y-1 hover:border-gold/40 hover:bg-gold/5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link to={`/players/${player.id}`} className="link block truncate font-display text-xl">{player.name}</Link>
                <p className="mt-1 text-sm text-stone-400">{player.role}</p>
              </div>
              <button className="icon-button danger-icon" onClick={() => { setDeleteError(''); setPendingDelete(player); }} title="Remove player" type="button">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="Delete player?"
        message={`Are you sure you want to delete this player${pendingDelete ? `: ${pendingDelete.name}` : ''}? This also removes them from all assigned wars.`}
        error={deleteError}
        confirmLabel="Delete Player"
        busy={deleting}
        onCancel={() => { setDeleteError(''); setPendingDelete(null); }}
        onConfirm={remove}
      />
    </div>
  );
}
