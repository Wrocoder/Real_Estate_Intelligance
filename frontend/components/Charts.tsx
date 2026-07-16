export type LineChartPoint = {
  label: string;
  value: number;
  helper?: string;
};

export type DistributionBucket = {
  label: string;
  count: number;
};

type LineChartProps = {
  points: LineChartPoint[];
  ariaLabel: string;
  valueFormatter: (value: number) => string;
};

type DistributionBarChartProps = {
  buckets: DistributionBucket[];
  ariaLabel: string;
};

const CHART_WIDTH = 640;
const LINE_CHART_HEIGHT = 220;
const BAR_CHART_HEIGHT = 230;

export function LineChart({ points, ariaLabel, valueFormatter }: LineChartProps) {
  if (points.length === 0) {
    return <div className="empty-state">Нет данных для графика.</div>;
  }

  const orderedPoints = [...points];
  const values = orderedPoints.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || Math.max(maxValue, 1);
  const chart = {
    left: 52,
    right: 18,
    top: 24,
    bottom: 44,
  };
  const plotWidth = CHART_WIDTH - chart.left - chart.right;
  const plotHeight = LINE_CHART_HEIGHT - chart.top - chart.bottom;
  const coordinates = orderedPoints.map((point, index) => {
    const x =
      orderedPoints.length === 1
        ? chart.left + plotWidth / 2
        : chart.left + (index / (orderedPoints.length - 1)) * plotWidth;
    const y = chart.top + ((maxValue - point.value) / valueRange) * plotHeight;
    return { ...point, x, y };
  });
  const path = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
  const xLabelIndexes = compactLabelIndexes(orderedPoints.length);
  const firstValue = orderedPoints[0].value;
  const lastValue = orderedPoints[orderedPoints.length - 1].value;
  const change = lastValue - firstValue;

  return (
    <div className="chart-block">
      <svg
        className="chart-svg"
        role="img"
        aria-label={ariaLabel}
        viewBox={`0 0 ${CHART_WIDTH} ${LINE_CHART_HEIGHT}`}
      >
        <line
          className="chart-grid-line"
          x1={chart.left}
          x2={CHART_WIDTH - chart.right}
          y1={chart.top}
          y2={chart.top}
        />
        <line
          className="chart-grid-line"
          x1={chart.left}
          x2={CHART_WIDTH - chart.right}
          y1={chart.top + plotHeight}
          y2={chart.top + plotHeight}
        />
        <text className="chart-axis-label" x={8} y={chart.top + 4}>
          {valueFormatter(maxValue)}
        </text>
        <text className="chart-axis-label" x={8} y={chart.top + plotHeight + 4}>
          {valueFormatter(minValue)}
        </text>
        {orderedPoints.length > 1 ? <path className="chart-line" d={path} /> : null}
        {coordinates.map((point) => (
          <g key={`${point.label}-${point.value}`}>
            <circle className="chart-point" cx={point.x} cy={point.y} r="5" />
            <title>
              {point.label}: {valueFormatter(point.value)}
              {point.helper ? `, ${point.helper}` : ""}
            </title>
          </g>
        ))}
        {xLabelIndexes.map((index) => {
          const point = coordinates[index];
          return (
            <text
              className="chart-axis-label chart-x-label"
              key={`${point.label}-${index}`}
              textAnchor={xAnchor(index, orderedPoints.length)}
              x={point.x}
              y={LINE_CHART_HEIGHT - 14}
            >
              {compactDateLabel(point.label)}
            </text>
          );
        })}
      </svg>
      <div className="chart-summary-row">
        <span>{orderedPoints.length} points</span>
        <strong>{change === 0 ? "0" : valueFormatter(change)}</strong>
      </div>
    </div>
  );
}

export function DistributionBarChart({ buckets, ariaLabel }: DistributionBarChartProps) {
  if (buckets.length === 0) {
    return <div className="empty-state">Нет данных для графика.</div>;
  }

  const maxCount = Math.max(...buckets.map((bucket) => bucket.count), 1);
  const chart = {
    left: 24,
    right: 18,
    top: 24,
    bottom: 52,
  };
  const plotWidth = CHART_WIDTH - chart.left - chart.right;
  const plotHeight = BAR_CHART_HEIGHT - chart.top - chart.bottom;
  const gap = buckets.length > 6 ? 6 : 10;
  const barWidth = Math.max(14, (plotWidth - gap * (buckets.length - 1)) / buckets.length);

  return (
    <div className="chart-block">
      <svg
        className="chart-svg"
        role="img"
        aria-label={ariaLabel}
        viewBox={`0 0 ${CHART_WIDTH} ${BAR_CHART_HEIGHT}`}
      >
        <line
          className="chart-grid-line"
          x1={chart.left}
          x2={CHART_WIDTH - chart.right}
          y1={chart.top + plotHeight}
          y2={chart.top + plotHeight}
        />
        {buckets.map((bucket, index) => {
          const height = Math.max((bucket.count / maxCount) * plotHeight, bucket.count ? 4 : 0);
          const x = chart.left + index * (barWidth + gap);
          const y = chart.top + plotHeight - height;
          return (
            <g key={bucket.label}>
              <rect className="chart-bar" x={x} y={y} width={barWidth} height={height} rx="4" />
              <text className="chart-bar-value" x={x + barWidth / 2} y={Math.max(y - 7, 13)}>
                {bucket.count}
              </text>
              <text
                className="chart-axis-label chart-x-label"
                textAnchor="middle"
                x={x + barWidth / 2}
                y={BAR_CHART_HEIGHT - 16}
              >
                {shortBucketLabel(bucket.label)}
              </text>
              <title>
                {bucket.label}: {bucket.count}
              </title>
            </g>
          );
        })}
      </svg>
      <div className="chart-summary-row">
        <span>Total</span>
        <strong>{buckets.reduce((total, bucket) => total + bucket.count, 0)}</strong>
      </div>
    </div>
  );
}

function compactLabelIndexes(length: number) {
  if (length <= 1) return [0];
  if (length === 2) return [0, 1];
  return Array.from(new Set([0, Math.floor((length - 1) / 2), length - 1]));
}

function compactDateLabel(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  return `${match[3]}.${match[2]}`;
}

function shortBucketLabel(label: string) {
  return label.length > 12 ? `${label.slice(0, 11)}...` : label;
}

function xAnchor(index: number, length: number) {
  if (index === 0) return "start";
  if (index === length - 1) return "end";
  return "middle";
}
