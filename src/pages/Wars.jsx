import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarPlus, ScrollText, Swords } from 'lucide-react';
import { api } from '../api.js';
import RosterPicker from '../components/RosterPicker.jsx';
import RankBadge from '../components/RankBadge.jsx';

export default function Wars({ players, wars, refresh }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    opponent: '',
    date: new Date().toISOString().slice(0, 10),
    notes: ''
  });
  const [selected, setSelected] = useState([]);
  const selectedPlayers = useMemo(() => players.filter((player) => selected.includes(player.id)), [players, selected]);

  const submit = async (event) => {
    event.preventDefault();
    const war = await api.createWar({ ...form, playerIds: selected });
    await refresh();
    navigate(`/wars/${war.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="section-heading">
        <div>
          <p className="eyebrow">War Creation</p>
          <h2>Battle Scrolls</h2>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="panel grid gap-3 p-5 md:grid-cols-[1fr_12rem]">
          <input className="input" required placeholder="Opponent guild" value={form.opponent} onChange={(event) => setForm({ ...form, opponent: event.target.value })} />
          <input className="input" required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          <textarea className="input md:col-span-2" rows="3" placeholder="War notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
        </div>

        <RosterPicker players={players} selected={selected} setSelected={setSelected} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-stone-400">{selectedPlayers.length} players selected for this war.</p>
          <button className="button-primary" type="submit" disabled={!form.opponent || !selected.length}>
            <CalendarPlus className="h-5 w-5" />
            Save War
          </button>
        </div>
      </form>

      <div className="panel p-5">
        <div className="mb-4 flex items-center gap-3">
          <ScrollText className="h-5 w-5 text-gold" />
          <p className="font-display text-2xl text-gold">War History</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {wars.map((war) => {
            const top = war.stats.toSorted((a, b) => b.scoring.score - a.scoring.score)[0];
            return (
              <Link key={war.id} to={`/wars/${war.id}`} className="war-card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-xl text-stone-50">{war.opponent}</p>
                    <p className="text-sm text-stone-400">{war.date} · {war.stats.length} players</p>
                  </div>
                  <Swords className="h-5 w-5 text-gold" />
                </div>
                {top && (
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-sm text-stone-400">Top form: <span className="text-stone-100">{top.playerName}</span></span>
                    <RankBadge compact rank={top.scoring.rank} />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
