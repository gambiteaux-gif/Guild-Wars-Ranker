import { Check, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function RosterPicker({ players, selected, setSelected }) {
  const [query, setQuery] = useState('');
  const selectedSet = new Set(selected);
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return players.filter((player) => player.name.toLowerCase().includes(q) || player.role.toLowerCase().includes(q));
  }, [players, query]);

  const toggle = (id) => {
    setSelected(selectedSet.has(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  };

  return (
    <div className="panel p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-xl text-gold">Roster Scroll</p>
          <p className="text-sm text-stone-400">Click names to instantly add or remove them from this war.</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
          <input className="input pl-9" placeholder="Search roster" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((player) => {
          const active = selectedSet.has(player.id);
          return (
            <button key={player.id} type="button" onClick={() => toggle(player.id)} className={`select-tile ${active ? 'select-tile-active' : ''}`}>
              <span className="min-w-0 text-left">
                <span className="block truncate font-medium">{player.name}</span>
                <span className="text-xs text-stone-400">{player.role}</span>
              </span>
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded border ${active ? 'border-gold bg-gold text-black' : 'border-stone-700'}`}>
                {active && <Check className="h-4 w-4" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
