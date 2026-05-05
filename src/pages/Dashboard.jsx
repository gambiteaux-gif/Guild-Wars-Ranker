import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, HeartPulse, Shield, Swords, TreePalm, Trophy, Users } from 'lucide-react';
import { api } from '../api.js';
import { ROLES } from '../constants.js';
import MetricCard from '../components/MetricCard.jsx';
import RankBadge from '../components/RankBadge.jsx';

export default function Dashboard({ players, wars, roleCounts }) {
  const [role, setRole] = useState('All');
  const [warId, setWarId] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    api.leaderboard({ role, warId }).then(setLeaderboard);
  }, [role, warId]);

  const categoryBest = useMemo(() => {
    const allStats = wars.flatMap((war) => war.stats.map((stat) => ({ ...stat, war: war.opponent })));
    return {
      damage: allStats.toSorted((a, b) => b.damage - a.damage)[0],
      healing: allStats.toSorted((a, b) => b.healing - a.healing)[0],
      funCoins: allStats.toSorted((a, b) => b.funCoins - a.funCoins)[0]
    };
  }, [wars]);

  const roleGroups = useMemo(() => {
    return ROLES.map((item) => ({
      role: item,
      players: leaderboard.filter((player) => player.role === item).slice(0, 4)
    }));
  }, [leaderboard]);

  const roleIcons = { DPS: Swords, Tank: Shield, Healer: HeartPulse, Jungler: TreePalm };

  return (
    <div className="space-y-6">
      <section className="hero-panel p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-gold/80">Where Winds Meet</p>
            <h2 className="mt-2 font-display text-4xl text-stone-50 md:text-5xl">Guild Wars Performance Tracker</h2>
            <p className="mt-4 max-w-3xl text-stone-300">
              Martial-role evaluation for wars: DPS pressure, tank survival, healer sustain, and jungler Fun Coin control.
            </p>
          </div>
          <Link to="/wars" className="button-primary">
            <Swords className="h-5 w-5" />
            Create War
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Roster" value={players.length} icon={Users} />
        <MetricCard label="Wars Logged" value={wars.length} icon={Trophy} />
        <MetricCard label="Junglers" value={roleCounts.Jungler || 0} icon={TreePalm} tone="jade" />
        <MetricCard label="Healers" value={roleCounts.Healer || 0} icon={HeartPulse} tone="jade" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="panel p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-2xl text-gold">Sect Leaderboard</p>
              <p className="text-sm text-stone-400">Average score from role-aware ranking, not raw stat padding.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select className="input" value={role} onChange={(event) => setRole(event.target.value)}>
                <option>All</option>
                {ROLES.map((item) => <option key={item}>{item}</option>)}
              </select>
              <select className="input" value={warId} onChange={(event) => setWarId(event.target.value)}>
                <option value="">All wars</option>
                {wars.map((war) => <option key={war.id} value={war.id}>{war.opponent}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Role</th>
                  <th>Avg Score</th>
                  <th>Latest Rank</th>
                  <th>Wars</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((player) => (
                  <tr key={player.id}>
                    <td><Link className="link" to={`/players/${player.id}`}>{player.name}</Link></td>
                    <td>{player.role}</td>
                    <td>{player.averageScore}</td>
                    <td><RankBadge compact rank={player.latestRank} /></td>
                    <td>{player.wars}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {role === 'All' && (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {roleGroups.map(({ role: item, players: rolePlayers }) => {
                const Icon = roleIcons[item];
                return (
                  <div key={item} className="rounded-lg border border-gold/10 bg-[#0B0F14]/45 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gold" />
                        <p className="font-display text-lg text-gold">{item}</p>
                      </div>
                      <span className="text-xs text-stone-500">{roleCounts[item] || 0} rostered</span>
                    </div>
                    <div className="space-y-2">
                      {rolePlayers.length ? rolePlayers.map((player) => (
                        <Link key={player.id} to={`/players/${player.id}`} className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm transition hover:bg-gold/10">
                          <span className="truncate text-stone-200">{player.name}</span>
                          <span className="text-gold">{player.averageScore}</span>
                        </Link>
                      )) : <p className="px-2 py-2 text-sm text-stone-500">No war scores yet.</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="panel p-5">
          <p className="font-display text-2xl text-gold">Best Forms</p>
          <div className="mt-5 space-y-4">
            {[
              ['Damage Peak', categoryBest.damage, 'damage', Swords],
              ['Healing Peak', categoryBest.healing, 'healing', HeartPulse],
              ['Fun Coin Control', categoryBest.funCoins, 'funCoins', Award]
            ].map(([label, stat, key, Icon]) => (
              <div key={label} className="rounded-lg border border-gold/10 bg-[#0B0F14]/45 p-4 transition hover:border-gold/35 hover:bg-gold/5">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-gold" />
                  <div>
                    <p className="text-sm text-stone-400">{label}</p>
                    <p className="font-medium">{stat?.playerName || 'No data'}</p>
                  </div>
                </div>
                <p className="mt-3 font-display text-2xl">{stat ? Number(stat[key]).toLocaleString() : 0}</p>
                {stat && <p className="text-xs text-stone-500">{stat.war}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
