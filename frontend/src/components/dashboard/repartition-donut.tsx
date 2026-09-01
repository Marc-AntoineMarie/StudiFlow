'use client';

import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

interface RepartitionDonutProps {
  partIntermittence: number;
  partFreelance: number;
}

export function RepartitionDonut({ partIntermittence, partFreelance }: RepartitionDonutProps) {
  const total = partIntermittence + partFreelance;

  if (total <= 0) {
    return <p className="text-sm text-fg-muted">Pas encore de mission comptabilisée.</p>;
  }

  const data = [
    { name: 'Intermittence', value: partIntermittence, color: '#3b82f6' },
    { name: 'Freelance', value: partFreelance, color: '#f5a524' },
  ];

  return (
    <div className="flex items-center gap-6">
      <div className="h-32 w-32 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={38} outerRadius={56} paddingAngle={3} stroke="none">
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex-1 space-y-3 text-sm">
        {data.map((d) => (
          <li key={d.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-fg-muted">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              {d.name}
            </span>
            <span className="font-medium text-fg">{Math.round(d.value * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
