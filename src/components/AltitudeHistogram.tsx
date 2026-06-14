import { useMemo } from "react";
import type { Dataset } from "../type";

const BUCKETS = 8;
const H = 32;
const BAR_W = 10;
const GAP = 2;

type Props = {
  datasets: Dataset[];
  filterMin: string;
  filterMax: string;
  onBucketClick?: (min: number, max: number) => void;
};

export const AltitudeHistogram = ({ datasets, filterMin, filterMax, onBucketClick }: Props) => {
  const { counts, globalMin, bucketSize } = useMemo(() => {
    if (datasets.length === 0) return { counts: [] as number[], globalMin: 0, bucketSize: 0 };

    let gMin = Infinity;
    let gMax = -Infinity;
    for (const d of datasets) {
      if (d.altitudeMin < gMin) gMin = d.altitudeMin;
      if (d.altitudeMax > gMax) gMax = d.altitudeMax;
    }

    const span = gMax - gMin;
    if (span <= 0) return { counts: [] as number[], globalMin: gMin, bucketSize: 0 };

    const bSize = span / BUCKETS;
    const cnts = Array<number>(BUCKETS).fill(0);

    for (const d of datasets) {
      for (let i = 0; i < BUCKETS; i++) {
        const bMin = gMin + i * bSize;
        const bMax = bMin + bSize;
        if (d.altitudeMin < bMax && d.altitudeMax >= bMin) {
          cnts[i]++;
        }
      }
    }

    return { counts: cnts, globalMin: gMin, bucketSize: bSize };
  }, [datasets]);

  if (counts.length === 0) return null;

  const maxCount = Math.max(...counts, 1);
  const fMin = Number.parseInt(filterMin, 10);
  const fMax = Number.parseInt(filterMax, 10);
  const hasFilter = !Number.isNaN(fMin) || !Number.isNaN(fMax);

  const inFilter = (bMin: number, bMax: number) => {
    if (!hasFilter) return true;
    if (!Number.isNaN(fMin) && bMax <= fMin) return false;
    if (!Number.isNaN(fMax) && bMin >= fMax) return false;
    return true;
  };

  return (
    <svg
      viewBox={`0 0 ${BUCKETS * BAR_W} ${H}`}
      preserveAspectRatio="none"
      style={{ display: "block", width: "100%", height: H, cursor: onBucketClick ? "pointer" : undefined }}
      aria-label="Altitude distribution"
    >
      {counts.map((count, i) => {
        const bMin = globalMin + i * bucketSize;
        const bMax = bMin + bucketSize;
        const barH = count > 0 ? Math.max(2, (count / maxCount) * (H - 2)) : 0;
        const active = inFilter(bMin, bMax);

        return (
          <rect
            key={i}
            x={i * BAR_W + GAP / 2}
            y={H - barH}
            width={BAR_W - GAP}
            height={barH || 1}
            fill={active ? "var(--accent)" : "var(--muted)"}
            opacity={count === 0 ? 0.15 : active ? 0.85 : 0.3}
            rx={1}
            onClick={() => onBucketClick?.(Math.round(bMin), Math.round(bMax))}
          >
            <title>{`${Math.round(bMin)}–${Math.round(bMax)} m · ${count} dataset${count !== 1 ? "s" : ""}`}</title>
          </rect>
        );
      })}
    </svg>
  );
};
