'use client';

interface HeatMapProps {
  data: Record<string, number>;
}

function getDaysBefore(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function colorForCount(count: number): string {
  if (count === 0) return 'bg-gray-100';
  if (count < 5) return 'bg-pink-200';
  if (count < 15) return 'bg-pink-400';
  return 'bg-pink-600';
}

export default function HeatMap({ data }: HeatMapProps) {
  const days = getDaysBefore(91); // ~13 weeks
  const weeks: string[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day}
                title={`${day}: ${data[day] ?? 0} reviews`}
                className={`w-3 h-3 rounded-sm ${colorForCount(data[day] ?? 0)}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
        <span>Less</span>
        {['bg-gray-100', 'bg-pink-200', 'bg-pink-400', 'bg-pink-600'].map((cls) => (
          <div key={cls} className={`w-3 h-3 rounded-sm ${cls}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
