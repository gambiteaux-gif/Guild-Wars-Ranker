import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, HeartPulse, Skull, Swords, TreePalm } from 'lucide-react';
import { api } from '../api.js';
import RankBadge from '../components/RankBadge.jsx';
import ScoreBreakdown from '../components/ScoreBreakdown.jsx';
import TrendChart from '../components/TrendChart.jsx';

export default function PlayerProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.playerHistory(id).then(setProfile);
  }, [id]);

  const trend = useMemo(() => {
    if (!profile?.history?.length) return 'No wars logged yet.';
    if (profile.history.length === 1) return 'One war logged. More battles will reveal the arc.';
    const first = profile.history[0].scoring.score;
    const last = profile.history.at(-1).scoring.score;
    if (last > first + 5) return 'Improving: their latest role score is climbing.';
    if (last < first - 5) return 'Declining: recent execution has slipped.';
    return 'Stable: performance is holding steady.';
  }, [profile]);

  if (!profile) return <div className="panel p-6 text-gold">Reading disciple record...</div>;

  const latest = profile.history.at(-1);
  const averages = profile.history.reduce((acc, stat, _index, list) => ({
    damage: acc.damage + stat.damage / list.length,
    healing: acc.healing + stat.healing / list.length,
    deaths: acc.deaths + stat.deaths / list.length,
    funCoins: acc.funCoins + stat.funCoins / list.length
  }), { damage: 0, healing: 0, deaths: 0, funCoins: 0 });

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-gold">
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <section className="hero-panel p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">{profile.player.role}</p>
            <h2 className="font-display text-4xl md:text-5xl">{profile.player.name}</h2>
            <p className="mt-3 text-lg text-gold">{trend}</p>
          </div>
          {latest && <RankBadge rank={latest.scoring.rank} title={latest.scoring.title} score={latest.scoring.score} />}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="panel p-4">
          <Swords className="h-5 w-5 text-gold" />
          <p className="mt-2 text-sm text-stone-400">Avg Damage</p>
          <p className="font-display text-2xl">{Math.round(averages.damage).toLocaleString()}</p>
        </div>
        <div className="panel p-4">
          <HeartPulse className="h-5 w-5 text-jade" />
          <p className="mt-2 text-sm text-stone-400">Avg Healing</p>
          <p className="font-display text-2xl">{Math.round(averages.healing).toLocaleString()}</p>
        </div>
        <div className="panel p-4">
          <TreePalm className="h-5 w-5 text-jade" />
          <p className="mt-2 text-sm text-stone-400">Avg Fun Coins</p>
          <p className="font-display text-2xl">{Math.round(averages.funCoins)}</p>
        </div>
        <div className="panel p-4">
          <Skull className="h-5 w-5 text-ember" />
          <p className="mt-2 text-sm text-stone-400">Avg Deaths</p>
          <p className="font-display text-2xl">{averages.deaths.toFixed(1)}</p>
        </div>
      </div>

      <TrendChart history={profile.history} />

      <div className="grid gap-4 lg:grid-cols-2">
        {profile.history.map((entry) => (
          <div key={entry.warId} className="panel p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <Link to={`/wars/${entry.warId}`} className="link font-display text-2xl">{entry.opponent}</Link>
                <p className="text-sm text-stone-400">{entry.date}</p>
              </div>
              <RankBadge rank={entry.scoring.rank} title={entry.scoring.title} score={entry.scoring.score} />
            </div>
            <ScoreBreakdown scoring={entry.scoring} />
          </div>
        ))}
      </div>
    </div>
  );
}
