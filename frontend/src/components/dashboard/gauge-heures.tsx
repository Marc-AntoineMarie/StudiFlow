interface GaugeHeuresProps {
  heures: number;
  seuil: number;
  pourcentage: number;
  restant: number;
}

/** Jauge circulaire SVG faite main (pas besoin de lib pour un seul anneau). */
export function GaugeHeures({ heures, seuil, pourcentage, restant }: GaugeHeuresProps) {
  const size = 168;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(Math.max(pourcentage, 0), 1);
  const dash = c * clamped;

  return (
    <div>
      <div className="relative mx-auto" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: 'var(--accent-blue-light)' }} />
              <stop offset="100%" style={{ stopColor: 'var(--accent-blue)' }} />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="url(#gaugeGradient)"
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${dash} ${c - dash}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-3xl font-semibold text-fg">{Math.round(heures)}</span>
          <span className="text-xs text-fg-dim">/ {seuil} h</span>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-fg-muted">Heures validées</span>
          <span className="font-medium text-fg">{Math.round(heures)} h</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-blue-light to-accent-blue"
            style={{ width: `${Math.round(clamped * 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-fg-muted">Seuil de référence : {seuil} h</span>
          <span className="font-medium text-accent-blue-light">{Math.round(pourcentage * 100)}%</span>
        </div>
      </div>

      <p className="mt-4 rounded-lg bg-white/5 px-3 py-2.5 text-sm text-fg-muted">
        Il vous reste <span className="font-medium text-fg">{Math.round(restant)} h</span> pour
        atteindre le seuil de référence.
      </p>
    </div>
  );
}
