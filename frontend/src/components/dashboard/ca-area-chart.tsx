'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

interface Point {
  mois: string; // "YYYY-MM"
  montantHT: number;
}

function moisCourt(iso: string): string {
  const [y, m] = iso.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  const label = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(d).replace('.', '');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function CaAreaChart({ data }: { data: Point[] }) {
  const points = data.map((d) => ({ ...d, label: moisCourt(d.mois) }));

  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={points} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="caGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5a524" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#f5a524" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          stroke="#64748b"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          interval={1}
          padding={{ left: 16, right: 16 }}
        />
        <Tooltip
          cursor={{ stroke: 'rgba(255,255,255,0.15)' }}
          contentStyle={{
            background: '#10152a',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            fontSize: 12,
          }}
          labelStyle={{ color: '#f1f5f9' }}
          formatter={(value: number) => [`${value.toLocaleString('fr-FR')} €`, 'CA']}
        />
        <Area type="monotone" dataKey="montantHT" stroke="#f5a524" strokeWidth={2} fill="url(#caGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
