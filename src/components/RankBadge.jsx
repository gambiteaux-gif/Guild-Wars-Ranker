const styles = {
  S: 'border-gold bg-gold/20 text-gold shadow-gold',
  A: 'border-blood/70 bg-blood/25 text-red-100',
  B: 'border-jade/60 bg-jade/15 text-jade',
  C: 'border-sky-300/50 bg-sky-300/10 text-sky-100',
  D: 'border-stone-400/50 bg-stone-400/10 text-stone-200',
  E: 'border-red-900/70 bg-red-950/50 text-red-200',
  '-': 'border-stone-700 bg-stone-900 text-stone-400'
};

export default function RankBadge({ rank = '-', title, score, compact = false }) {
  return (
    <div className={`rank-badge ${styles[rank] || styles['-']} ${compact ? 'px-2 py-1' : 'px-3 py-2'}`}>
      <span className={`${compact ? 'text-sm' : 'text-xl'} font-display leading-none`}>{rank}</span>
      {!compact && (
        <span className="min-w-0">
          <span className="block truncate text-xs uppercase tracking-[0.18em] opacity-80">{title || 'Unranked'}</span>
          {typeof score === 'number' && <span className="block text-xs opacity-80">{score}/100</span>}
        </span>
      )}
    </div>
  );
}
