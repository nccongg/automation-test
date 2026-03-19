/**
 * Trend Line Component
 * 
 * Displays trend indicator with icon, percentage, and progress bar
 * Used in KPI cards to show metrics trends
 */

import { TrendingDown, TrendingUp } from 'lucide-react';

/**
 * @param {Object} props
 * @param {'up'|'down'} props.direction - Trend direction
 * @param {string} props.percent - Percentage value
 * @param {string} props.text - Description text
 * @param {'emerald'|'red'|'sky'|'slate'} props.color - Color theme
 * @param {number} props.barWidth - Progress bar width percentage
 */
export default function TrendLine({
  direction,
  percent,
  text,
  color,
  barWidth,
}) {
  const icon =
    direction === 'up' ? (
      <TrendingUp className="size-4" />
    ) : (
      <TrendingDown className="size-4" />
    );

  const tone =
    color === 'emerald'
      ? { icon: 'text-emerald-600', bar: 'bg-emerald-500' }
      : color === 'red'
        ? { icon: 'text-red-600', bar: 'bg-red-500' }
        : color === 'sky'
          ? { icon: 'text-sky-600', bar: 'bg-sky-500' }
          : { icon: 'text-slate-600', bar: 'bg-slate-400' };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className={tone.icon}>{icon}</span>
        <span className="font-medium text-foreground">{percent}</span>
        <span>{text}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
        <div
          className={`h-full ${tone.bar}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}
