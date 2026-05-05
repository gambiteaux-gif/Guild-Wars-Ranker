import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { Activity, BadgePlus, BarChart3, ScrollText, Shield, Swords, Users } from 'lucide-react';
import { api } from './api.js';
import { ROLES } from './constants.js';
import Dashboard from './pages/Dashboard.jsx';
import Roster from './pages/Roster.jsx';
import Wars from './pages/Wars.jsx';
import WarDetail from './pages/WarDetail.jsx';
import PlayerProfile from './pages/PlayerProfile.jsx';

function Layout({ children, health }) {
  const nav = [
    { to: '/', label: 'Dashboard', icon: BarChart3 },
    { to: '/roster', label: 'Roster', icon: Users },
    { to: '/wars', label: 'Wars', icon: Swords }
  ];

  return (
    <div className="min-h-screen bg-ink text-stone-100">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(201,162,78,0.10),transparent_30rem),radial-gradient(circle_at_bottom_right,rgba(139,44,44,0.16),transparent_28rem),linear-gradient(135deg,#0B0F14_0%,#0E141B_55%,#111820_100%)]" />
      <aside className="fixed left-0 top-0 hidden h-full w-72 border-r border-gold/15 bg-[#0B0F14]/82 px-5 py-6 backdrop-blur xl:block">
        <Link to="/" className="group block">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded border border-gold/45 bg-slatepanel shadow-gold">
              <Shield className="h-6 w-6 text-gold" />
            </div>
            <div>
              <p className="font-display text-lg text-gold">Guild Wars</p>
              <h1 className="font-display text-2xl leading-tight">Performance Tracker</h1>
            </div>
          </div>
        </Link>
        <nav className="mt-10 space-y-2">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-10 rounded border border-gold/15 bg-slatepanel/80 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-gold/70">Doctrine</p>
          <p className="mt-2 text-sm leading-6 text-stone-300">
            Ranks answer one question: did this disciple perform their assigned role in the war?
          </p>
        </div>
        <div className="absolute bottom-5 left-5 right-5 text-xs text-stone-500">
          Persistence: <span className="text-jade">{health?.persistence || 'checking'}</span>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-gold/15 bg-ink/90 px-4 py-3 backdrop-blur xl:hidden">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-lg">
            <Shield className="h-5 w-5 text-gold" />
            Guild Wars Tracker
          </Link>
          <Link to="/wars" className="icon-button" title="Create war">
            <BadgePlus className="h-5 w-5" />
          </Link>
        </div>
        <nav className="mt-3 grid grid-cols-3 gap-2">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `mobile-nav ${isActive ? 'mobile-nav-active' : ''}`}>
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="px-4 py-6 xl:ml-72 xl:px-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}

export default function App() {
  const [players, setPlayers] = useState([]);
  const [wars, setWars] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const [nextPlayers, nextWars] = await Promise.all([api.players(), api.wars()]);
    setPlayers(nextPlayers);
    setWars(nextWars);
  };

  useEffect(() => {
    Promise.all([api.health(), refresh()])
      .then(([nextHealth]) => setHealth(nextHealth))
      .finally(() => setLoading(false));
  }, []);

  const roleCounts = useMemo(() => {
    return ROLES.reduce((counts, role) => ({ ...counts, [role]: players.filter((player) => player.role === role).length }), {});
  }, [players]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink text-gold">
        <div className="flex items-center gap-3 font-display text-2xl">
          <Activity className="h-6 w-6 animate-pulse" />
          Summoning war scrolls...
        </div>
      </div>
    );
  }

  return (
    <Layout health={health}>
      <Routes>
        <Route path="/" element={<Dashboard players={players} wars={wars} roleCounts={roleCounts} />} />
        <Route path="/roster" element={<Roster players={players} refresh={refresh} />} />
        <Route path="/wars" element={<Wars players={players} wars={wars} refresh={refresh} />} />
        <Route path="/wars/:id" element={<WarDetail players={players} refresh={refresh} />} />
        <Route path="/players/:id" element={<PlayerProfile />} />
        <Route path="*" element={<Dashboard players={players} wars={wars} roleCounts={roleCounts} />} />
      </Routes>
    </Layout>
  );
}
