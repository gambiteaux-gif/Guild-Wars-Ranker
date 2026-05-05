export default function ScoreBreakdown({ scoring }) {
  if (!scoring) return null;
  return (
    <div className="space-y-3">
      <p className="text-sm italic text-gold/90">{scoring.roleQuestion}</p>
      {scoring.breakdown.map((part) => (
        <div key={part.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
            <span className="font-medium text-stone-200">{part.label}</span>
            <span className={part.penalty ? 'text-red-300' : 'text-stone-400'}>
              {part.penalty ? part.value : `${part.value}/100`}
            </span>
          </div>
          {!part.penalty && (
            <div className="h-2 overflow-hidden rounded bg-stone-900">
              <div className="h-full rounded bg-gradient-to-r from-ember to-gold" style={{ width: `${Math.max(0, Math.min(100, part.value))}%` }} />
            </div>
          )}
          <p className="mt-1 text-xs text-stone-500">{part.note}</p>
        </div>
      ))}
    </div>
  );
}
