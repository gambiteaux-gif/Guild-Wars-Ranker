export default function MetricCard({ label, value, icon: Icon, tone = 'gold' }) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-stone-400">{label}</p>
          <p className="mt-2 font-display text-3xl text-stone-50">{value}</p>
        </div>
        {Icon && (
          <div className={`grid h-11 w-11 place-items-center rounded border ${tone === 'jade' ? 'border-jade/35 bg-jade/10 text-jade' : 'border-gold/35 bg-gold/10 text-gold'}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
