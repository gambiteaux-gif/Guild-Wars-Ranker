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
const statValue = (stats, camel, snake = camel) => Number(stats?.[camel] ?? stats?.[snake] ?? 0);

export function rankFromScore(score) {
  return RANKS.find((entry) => score >= entry.min) || RANKS[RANKS.length - 1];
}

export function getBattlefieldSide(source = {}) {
  const raw = source.side
    ?? source.teamSide
    ?? source.assignment
    ?? source.battlefieldSide
    ?? source.warSide
    ?? source.context
    ?? source.team?.side
    ?? '';
  const normalized = String(raw).toLowerCase();
  if (normalized.includes('offense') || normalized === 'attack' || normalized === 'attacker') return 'offense';
  if (normalized.includes('defense') || normalized === 'defend' || normalized === 'defender') return 'defense';
  return 'neutral';
}

function finishScore(parts) {
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
    breakdown: parts.map((part) => ({
      ...part,
      value: Math.round(part.value)
    }))
  };
}

export function scoreStats(role, stats = {}, context = {}) {
  const normalizedRole = role?.toLowerCase();
  const merged = { ...context, ...stats };
  const side = getBattlefieldSide(merged);
  const kills = statValue(merged, 'kills');
  const assists = statValue(merged, 'assists');
  const deaths = statValue(merged, 'deaths');
  const damage = statValue(merged, 'damage');
  const healing = statValue(merged, 'healing');
  const siegeDamage = statValue(merged, 'siegeDamage', 'siege_damage');
  const funCoins = statValue(merged, 'funCoins', 'fun_coins');

  let parts;
  let roleQuestion;
  let contextNote = side === 'offense'
    ? 'Offense context: objective pressure matters, but role intent still leads player scoring.'
    : side === 'defense'
      ? 'Defense context: low siege is never punished; holding ground matters.'
      : 'Neutral context: ranking follows role execution.';

  if (normalizedRole === 'healer') {
    roleQuestion = 'Did they keep the team alive and survive long enough to keep healing?';
    parts = [
      { label: 'Healing output', value: norm(healing, 950000), weight: 0.78, note: 'Primary healer metric: keeping allies alive.' },
      { label: 'Survival', value: survival(deaths, 12), weight: 0.22, note: 'Low deaths keep healing uptime high.' }
    ];
    if (deaths >= 8) {
      parts.push({ label: 'Excessive death penalty', value: -10, weight: 1, penalty: true, note: 'Repeated deaths sharply reduce healer value.' });
    }
  } else if (normalizedRole === 'tank') {
    roleQuestion = 'Did they absorb pressure, survive, and enable team fights?';
    parts = [
      { label: 'Survivability', value: survival(deaths, 18), weight: 0.62, note: 'Primary tank metric: staying alive under pressure.' },
      { label: 'Fight enablement', value: norm(assists, 18), weight: 0.28, note: 'Assists show peel, setup, and frontline control.' },
      { label: 'Pressure damage', value: norm(damage, 500000), weight: 0.10, note: 'Minor contribution only; tanks are not DPS-checked.' }
    ];
  } else if (normalizedRole === 'jungler') {
    roleQuestion = 'Did they generate resources and control efficiently in this war?';
    const coinValue = norm(funCoins, 125);
    parts = [
      { label: 'Fun Coins', value: coinValue, weight: 0.62, note: 'Dominant jungler metric: coins define resource/control success.' },
      { label: 'Kills', value: norm(kills, 18), weight: 0.13, note: 'Combat matters, but never more than coins.' },
      { label: 'Damage', value: norm(damage, 560000), weight: 0.10, note: 'Secondary skirmish pressure.' },
      { label: 'Assists', value: norm(assists, 20), weight: 0.10, note: 'Rewards map pressure and coordinated control.' },
      { label: 'Survival', value: survival(deaths, 13), weight: 0.05, note: 'High deaths reduce control uptime.' }
    ];
    if (coinValue < 45 && kills >= 12) {
      parts.push({ label: 'Low coin override', value: -20, weight: 1, penalty: true, note: 'High kills cannot outrank poor Fun Coin generation.' });
    }
    if (coinValue < 35 && deaths >= 6) {
      parts.push({ label: 'Control collapse', value: -14, weight: 1, penalty: true, note: 'Low coins plus high deaths signals failed jungling.' });
    }
  } else {
    roleQuestion = side === 'offense'
      ? 'Did they create damage pressure, secure kills, and help break objectives efficiently?'
      : 'Did they create damage pressure and secure kills without feeding?';
    parts = side === 'offense'
      ? [
          { label: 'Damage', value: norm(damage, 850000), weight: 0.40, note: 'Primary DPS contribution.' },
          { label: 'Kills', value: norm(kills, 24), weight: 0.24, note: 'Confirms finishing pressure.' },
          { label: 'Objective pressure', value: norm(siegeDamage, 320000), weight: 0.16, note: 'Offense DPS gets credit for helping break structures.' },
          { label: 'Assists', value: norm(assists, 22), weight: 0.10, note: 'Rewards coordinated fight impact.' },
          { label: 'Survival', value: survival(deaths, 14), weight: 0.10, note: 'High deaths significantly reduce efficient DPS value.' }
        ]
      : [
          { label: 'Damage', value: norm(damage, 850000), weight: 0.48, note: 'Primary DPS contribution.' },
          { label: 'Kills', value: norm(kills, 24), weight: 0.27, note: 'Confirms finishing pressure.' },
          { label: 'Assists', value: norm(assists, 22), weight: 0.15, note: 'Rewards coordinated fight impact.' },
          { label: 'Survival', value: survival(deaths, 14), weight: 0.10, note: 'High deaths significantly reduce efficient DPS value.' }
        ];
  }

  const result = finishScore(parts);
  return {
    ...result,
    roleQuestion,
    context: side,
    contextNote
  };
}

export function scoreTeam(teamStats = [], context = {}) {
  const side = getBattlefieldSide(context);
  const totals = teamStats.reduce((sum, stat) => ({
    kills: sum.kills + statValue(stat, 'kills'),
    assists: sum.assists + statValue(stat, 'assists'),
    deaths: sum.deaths + statValue(stat, 'deaths'),
    damage: sum.damage + statValue(stat, 'damage'),
    healing: sum.healing + statValue(stat, 'healing'),
    siegeDamage: sum.siegeDamage + statValue(stat, 'siegeDamage', 'siege_damage'),
    funCoins: sum.funCoins + statValue(stat, 'funCoins', 'fun_coins')
  }), { kills: 0, assists: 0, deaths: 0, damage: 0, healing: 0, siegeDamage: 0, funCoins: 0 });
  const size = Math.max(teamStats.length, 1);
  const avgDeaths = totals.deaths / size;

  const parts = side === 'defense'
    ? [
        { label: 'Survival efficiency', value: survival(avgDeaths, 16), weight: 0.42, note: 'Defense is about holding ground and staying alive.' },
        { label: 'Kill denial', value: norm(totals.kills, size * 14), weight: 0.28, note: 'Enemy deaths relieve objective pressure.' },
        { label: 'Assist coordination', value: norm(totals.assists, size * 18), weight: 0.22, note: 'Coordinated defense shows through assists.' },
        { label: 'Hold pressure', value: norm(totals.damage, size * 520000), weight: 0.08, note: 'Damage helps hold, but siege is ignored on defense.' }
      ]
    : [
        { label: 'Siege contribution', value: norm(totals.siegeDamage, size * 260000), weight: 0.46, note: 'Primary offense metric: objective pressure.' },
        { label: 'Damage pressure', value: norm(totals.damage, size * 650000), weight: 0.22, note: 'Damage creates space for siege progress.' },
        { label: 'Kill conversion', value: norm(totals.kills, size * 16), weight: 0.20, note: 'Kills convert pressure into objective windows.' },
        { label: 'Survival balance', value: survival(avgDeaths, 14), weight: 0.12, note: 'Dead offense cannot keep pushing structures.' }
      ];

  const result = finishScore(parts);
  return {
    ...result,
    context: side === 'defense' ? 'defense' : 'offense',
    totals,
    roleQuestion: side === 'defense'
      ? 'Did this defense team survive, deny kills, coordinate, and hold ground?'
      : 'Did this offense team create siege pressure and convert fights into objective progress?'
  };
}

export function rankNumeric(rank) {
  return { E: 1, D: 2, C: 3, B: 4, A: 5, S: 6 }[rank] || 0;
}
