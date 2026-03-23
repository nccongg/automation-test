/**
 * KPI Card Component
 *
 * Displays key performance indicator with icon, value, and trend
 * Used on dashboard to show metrics
 */

import TrendLine from "./TrendLine";

/**
 * @param {Object} props
 * @param {string} props.label - KPI label
 * @param {string} props.value - KPI value
 * @param {string} props.iconBg - Icon background class
 * @param {string} props.iconText - Icon text color class
 * @param {string} props.iconEmoji - Icon emoji
 * @param {'up'|'down'} props.trendDirection - Trend direction
 * @param {string} props.trendPercent - Trend percentage
 * @param {string} props.trendText - Trend description
 * @param {'emerald'|'red'|'sky'|'slate'} props.barColor - Bar color theme
 * @param {number} props.trendBarWidth - Trend bar width percentage
 */
export default function KpiCard({
  label,
  value,
  iconBg,
  iconText,
  iconEmoji,
  trendDirection,
  trendPercent,
  trendText,
  barColor,
  trendBarWidth,
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border bg-white p-4 sm:p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight break-words">
            {value}
          </div>
        </div>
        <div
          className={`grid size-11 place-items-center rounded-full ${iconBg} text-sm ${iconText} flex-shrink-0`}
        >
          <span className="font-bold">{iconEmoji}</span>
        </div>
      </div>
      <div className="mt-5">
        <TrendLine
          direction={trendDirection}
          percent={trendPercent}
          text={trendText}
          color={barColor}
          barWidth={trendBarWidth}
        />
      </div>
    </div>
  );
}
