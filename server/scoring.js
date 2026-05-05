export const RANKS = [
  { rank: 'S', title: 'Heavenly Blade', min: 90 },
  { rank: 'A', title: 'Crimson Vanguard', min: 78 },
  { rank: 'B', title: 'Jade Adept', min: 64 },
  { rank: 'C', title: 'Iron Disciple', min: 48 },
  { rank: 'D', title: 'Frayed Sash', min: 32 },
  { rank: 'E', title: 'Broken Form', min: 0 }
];

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const norm = (value, target) => clamp((Number(value || 0) / target) * 100);
const survival = (deaths, softCap) => clamp(100 - Number(deaths || 0) * softCap);

export function rankFromScore(score) {
  return RANKS.find((entry) => score >= entry.min) || RANKS[RANKS.length - 1];
}

export function scoreStats(role, stats = {}) {
  const normalizedRole = role?.toLowerCase();
  const kills = Number(stats.kills || 0);
  const assists = Number(stats.assists || 0);
  const deaths = Number(stats.deaths || 0);
  const damage = Number(stats.damage || 0);
  const healing = Number(stats.healing || 0);
  const siegeDamage = Number(stats.siegeDamage || stats.siege_damage || 0);
  const funCoins = Number(stats.funCoins || stats.fun_coins || 0);

  let parts;
  let roleQuestion;

  if (normalizedRole === 'tank') {
    roleQuestion = 'Did they hold the front line and survive while enabling team fights?';
    parts = [
      { label: 'Survivability', value: survival(deaths, 17), weight: 0.52, note: 'Low deaths are the core tank signal.' },
      { label: 'Fight enablement', value: norm(assists, 18), weight: 0.28, note: 'Assists show frontline pressure and setup.' },
      { label: 'Pressure damage', value: norm(damage, 420000), weight: 0.20, note: 'Some damage matters, but it is not a DPS check.' }
    ];
  } else if (normalizedRole === 'healer') {
    roleQuestion = 'Did they keep the team alive effectively?';
    parts = [
      { label: 'Healing output', value: norm(healing, 900000), weight: 0.82, note: 'Healing is the decisive healer metric.' },
      { label: 'Positioning', value: survival(deaths, 9), weight: 0.18, note: 'Only excessive deaths meaningfully reduce score.' }
    ];
  } else if (normalizedRole === 'jungler') {
    roleQuestion = 'Did they generate resources and control efficiently?';
    const coinValue = norm(funCoins, 120);
    parts = [
      { label: 'Fun Coins', value: coinValue, weight: 0.56, note: 'Primary jungler metric: resource and control efficiency.' },
      { label: 'Skirmish impact', value: clamp(norm(kills, 18) * 0.58 + norm(assists, 20) * 0.42), weight: 0.20, note: 'Combat helps only after resources are handled.' },
      { label: 'Damage support', value: norm(damage, 520000), weight: 0.14, note: 'Damage is secondary to map/resource control.' },
      { label: 'Risk control', value: survival(deaths, 12), weight: 0.10, note: 'Deaths hurt more when Fun Coins are low.' }
    ];
    if (coinValue < 45 && kills >= 12) {
      parts.push({ label: 'Low coin override', value: -16, weight: 1, penalty: true, note: 'High kills cannot outrank poor Fun Coin generation.' });
    }
    if (coinValue < 35 && deaths >= 6) {
      parts.push({ label: 'Control collapse', value: -12, weight: 1, penalty: true, note: 'Low resources plus high deaths signals failed jungling.' });
    }
  } else {
    roleQuestion = 'Did they execute the damage role without feeding?';
    parts = [
      { label: 'Damage', value: norm(damage, 850000), weight: 0.42, note: 'Primary DPS contribution.' },
      { label: 'Kills', value: norm(kills, 24), weight: 0.28, note: 'Confirms finishing pressure.' },
      { label: 'Assists', value: norm(assists, 22), weight: 0.18, note: 'Rewards coordinated fight impact.' },
      { label: 'Survival', value: survival(deaths, 11), weight: 0.10, note: 'Deaths are a penalty, not the main DPS metric.' },
      { label: 'Siege chip', value: norm(siegeDamage, 260000), weight: 0.02, note: 'Low impact for DPS scoring.' }
    ];
  }

  const weighted = parts.reduce((sum, part) => {
    if (part.penalty) return sum + part.value;
    return sum + part.value * part.weight;
  }, 0);
  const score = Math.round(clamp(weighted));
  const rankInfo = rankFromScore(score);

  return {
    score,
    rank: rankInfo.rank,
    title: rankInfo.title,
    roleQuestion,
    breakdown: parts.map((part) => ({
      ...part,
      value: Math.round(part.value)
    }))
  };
}

export function rankNumeric(rank) {
  return { E: 1, D: 2, C: 3, B: 4, A: 5, S: 6 }[rank] || 0;
}
