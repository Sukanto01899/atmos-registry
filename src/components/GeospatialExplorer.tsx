import { useEffect, useMemo, useState } from "react";
import type { Dataset, GeospatialExplorerProps } from "../type";

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

const toDegrees = (value: number) => value / 1_000_000;

const projectDataset = (dataset: Dataset) => {
  const longitude = toDegrees(dataset.longitude);
  const latitude = toDegrees(dataset.latitude);

  return {
    x: ((longitude + 180) / 360) * 100,
    y: ((90 - latitude) / 180) * 100,
    longitude,
    latitude,
  };
};

const getPointTone = (
  dataset: Dataset,
  selectedDatasetId: number | null,
  compareSelectionIds: string[],
  watchlistIds: string[],
) => {
  if (selectedDatasetId === dataset.id) return "selected";
  if (compareSelectionIds.includes(String(dataset.id))) return "compare";
  if (watchlistIds.includes(String(dataset.id))) return "watch";
  if (dataset.verified || dataset.status === "verified") return "verified";
  if (dataset.status === "pending") return "pending";
  return "default";
};

export function GeospatialExplorer({
  datasets,
  filteredCount,
  geoTimeBounds,
  geoTimeCutoff,
  geoTimePercent,
  selectedDataset,
  compareSelectionIds,
  watchlistIds,
  formatCoord,
  formatChainValue,
  onTimeChange,
  onSelectDataset,
  onOpenAudit,
  onOpenDetail,
  onToggleCompare,
  onToggleWatch,
}: GeospatialExplorerProps) {
  const [playbackActive, setPlaybackActive] = useState(false);

  useEffect(() => {
    if (!playbackActive || !geoTimeBounds) {
      return;
    }

    const timer = window.setInterval(() => {
      onTimeChange(geoTimePercent >= 100 ? 0 : geoTimePercent + 5);
    }, 1400);

    return () => window.clearInterval(timer);
  }, [geoTimeBounds, geoTimePercent, onTimeChange, playbackActive]);

  useEffect(() => {
    if (!geoTimeBounds) {
      setPlaybackActive(false);
    }
  }, [geoTimeBounds]);

  const points = useMemo(
    () =>
      datasets.map((dataset) => {
        const projected = projectDataset(dataset);
        return {
          dataset,
          ...projected,
          tone: getPointTone(
            dataset,
            selectedDataset?.id ?? null,
            compareSelectionIds,
            watchlistIds,
          ),
        };
      }),
    [compareSelectionIds, datasets, selectedDataset?.id, watchlistIds],
  );

  const hotspotGroups = useMemo(() => {
    const buckets = new Map<
      string,
      {
        id: string;
        label: string;
        count: number;
        datasets: Dataset[];
        avgLat: number;
        avgLon: number;
      }
    >();

    datasets.forEach((dataset) => {
      const lat = toDegrees(dataset.latitude);
      const lon = toDegrees(dataset.longitude);
      const latBucket = Math.max(0, Math.min(5, Math.floor((lat + 90) / 30)));
      const lonBucket = Math.max(0, Math.min(11, Math.floor((lon + 180) / 30)));
      const key = `${latBucket}-${lonBucket}`;
      const label = `${latBucket * 30 - 90} to ${(latBucket + 1) * 30 - 90} lat, ${
        lonBucket * 30 - 180
      } to ${(lonBucket + 1) * 30 - 180} lon`;
      const current = buckets.get(key);

      if (current) {
        current.count += 1;
        current.datasets.push(dataset);
        current.avgLat += lat;
        current.avgLon += lon;
        return;
      }

      buckets.set(key, {
        id: key,
        label,
        count: 1,
        datasets: [dataset],
        avgLat: lat,
        avgLon: lon,
      });
    });

    return Array.from(buckets.values())
      .map((bucket) => ({
        ...bucket,
        avgLat: bucket.avgLat / bucket.count,
        avgLon: bucket.avgLon / bucket.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [datasets]);

  const selectedSummary = useMemo(() => {
    if (!selectedDataset) {
      return null;
    }

    const peers = datasets.filter(
      (dataset) =>
        dataset.id !== selectedDataset.id &&
        dataset.dataType === selectedDataset.dataType,
    ).length;

    return {
      peers,
      projected: projectDataset(selectedDataset),
    };
  }, [datasets, selectedDataset]);

  const coverageSummary = useMemo(() => {
    if (!datasets.length) {
      return {
        types: 0,
        verified: 0,
        pending: 0,
      };
    }

    return {
      types: new Set(datasets.map((dataset) => dataset.dataType)).size,
      verified: datasets.filter(
        (dataset) => dataset.verified || dataset.status === "verified",
      ).length,
      pending: datasets.filter((dataset) => dataset.status === "pending").length,
    };
  }, [datasets]);

  const selectedCompareActive = selectedDataset
    ? compareSelectionIds.includes(String(selectedDataset.id))
    : false;
  const selectedWatchActive = selectedDataset
    ? watchlistIds.includes(String(selectedDataset.id))
    : false;

  return (
    <div className="geo-card">
      <div className="geo-header">
        <div>
          <h3>Geospatial explorer</h3>
          <p>
            Browse spatial coverage on a world grid, scrub collection time, and
            jump straight into compare, watch, detail, or audit flows.
          </p>
        </div>
        <div className="geo-summary">
          <span>
            Visible points: {datasets.length}/{filteredCount}
          </span>
          <span>Data types: {coverageSummary.types}</span>
          <span>Verified: {coverageSummary.verified}</span>
          {geoTimeCutoff && <span>Cutoff: {formatChainValue(geoTimeCutoff)}</span>}
        </div>
      </div>

      <div className="geo-toolbar">
        <div className="geo-timeline">
          <label htmlFor="geo-time-slider">Time window</label>
          <input
            id="geo-time-slider"
            type="range"
            min={0}
            max={100}
            value={geoTimePercent}
            onChange={(event) =>
              onTimeChange(
                clampPercent(
                  Number.parseInt(
                    (event.target as HTMLInputElement).value || "0",
                    10,
                  ) || 0,
                ),
              )
            }
            disabled={!geoTimeBounds}
          />
          <span>{geoTimePercent}%</span>
        </div>
        <div className="geo-controls">
          <button
            className="ghost-btn"
            type="button"
            onClick={() => onTimeChange(clampPercent(geoTimePercent - 10))}
            disabled={!geoTimeBounds}
          >
            Back 10%
          </button>
          <button
            className="ghost-btn"
            type="button"
            onClick={() => setPlaybackActive((prev) => !prev)}
            disabled={!geoTimeBounds}
          >
            {playbackActive ? "Pause playback" : "Play playback"}
          </button>
          <button
            className="ghost-btn"
            type="button"
            onClick={() => onTimeChange(clampPercent(geoTimePercent + 10))}
            disabled={!geoTimeBounds}
          >
            Forward 10%
          </button>
          <button
            className="ghost-btn"
            type="button"
            onClick={() => onTimeChange(100)}
            disabled={!geoTimeBounds}
          >
            Live view
          </button>
        </div>
      </div>

      <div className="geo-layout geo-layout--enhanced">
        <div className="geo-map-panel">
          <div className="geo-map geo-map--world">
            <div className="geo-map__grid" />
            <div className="geo-map__continent geo-map__continent--north-america" />
            <div className="geo-map__continent geo-map__continent--south-america" />
            <div className="geo-map__continent geo-map__continent--europe-africa" />
            <div className="geo-map__continent geo-map__continent--asia" />
            <div className="geo-map__continent geo-map__continent--australia" />
            <div className="geo-map__equator" />
            <div className="geo-map__prime" />
            {points.map((point) => (
              <button
                key={`geo-${point.dataset.id}`}
                className={`geo-point geo-point--${point.tone}`}
                title={`#${point.dataset.id} ${point.dataset.name}`}
                type="button"
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                onClick={() => onSelectDataset(point.dataset.id)}
              >
                <span className="sr-only">{point.dataset.name}</span>
              </button>
            ))}
            {datasets.length === 0 && (
              <div className="geo-empty">No points in the current time window.</div>
            )}
          </div>
          <div className="geo-legend">
            <span className="geo-legend__item">
              <i className="geo-legend__dot geo-legend__dot--selected" />
              Selected
            </span>
            <span className="geo-legend__item">
              <i className="geo-legend__dot geo-legend__dot--compare" />
              Compare
            </span>
            <span className="geo-legend__item">
              <i className="geo-legend__dot geo-legend__dot--watch" />
              Watchlist
            </span>
            <span className="geo-legend__item">
              <i className="geo-legend__dot geo-legend__dot--verified" />
              Verified
            </span>
            <span className="geo-legend__item">
              <i className="geo-legend__dot geo-legend__dot--pending" />
              Pending
            </span>
          </div>
        </div>

        <aside className="geo-sidepanel">
          <div className="geo-detail">
            {!selectedDataset || !selectedSummary ? (
              <p className="dataset-description">
                Select a point to inspect its spatial context and take action.
              </p>
            ) : (
              <>
                <div className="geo-detail__title">
                  #{selectedDataset.id} {selectedDataset.name}
                </div>
                <p className="dataset-description">{selectedDataset.description}</p>
                <div className="geo-detail__meta">
                  <span>
                    Lat/Lng: {formatCoord(selectedDataset.latitude)},{" "}
                    {formatCoord(selectedDataset.longitude)}
                  </span>
                  <span>
                    Altitude: {selectedDataset.altitudeMin}-
                    {selectedDataset.altitudeMax} m
                  </span>
                  <span>
                    Collected: {formatChainValue(selectedDataset.collectionDate)}
                  </span>
                  <span>Same type nearby view peers: {selectedSummary.peers}</span>
                  <span>
                    Map position: {selectedSummary.projected.latitude.toFixed(2)} lat,{" "}
                    {selectedSummary.projected.longitude.toFixed(2)} lon
                  </span>
                </div>
                <div className="geo-detail__actions">
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => onOpenAudit(selectedDataset.id)}
                  >
                    Open in audit
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => onOpenDetail(selectedDataset.id)}
                  >
                    Open detail
                  </button>
                  <button
                    className={`ghost-btn ${selectedCompareActive ? "active" : ""}`}
                    type="button"
                    onClick={() => onToggleCompare(selectedDataset.id)}
                  >
                    {selectedCompareActive ? "Remove compare" : "Add compare"}
                  </button>
                  <button
                    className={`ghost-btn ${selectedWatchActive ? "active" : ""}`}
                    type="button"
                    onClick={() => onToggleWatch(selectedDataset.id)}
                  >
                    {selectedWatchActive ? "Watching" : "Watch dataset"}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="geo-hotspots">
            <div className="geo-hotspots__head">
              <strong>Hotspot clusters</strong>
              <span>{coverageSummary.pending} pending in view</span>
            </div>
            {hotspotGroups.length === 0 && (
              <p className="dataset-description">
                Load datasets to inspect cluster density.
              </p>
            )}
            {hotspotGroups.map((group) => {
              const focusDataset = group.datasets[0];
              return (
                <button
                  key={group.id}
                  className="geo-hotspot"
                  type="button"
                  onClick={() => onSelectDataset(focusDataset.id)}
                >
                  <span className="geo-hotspot__count">{group.count}</span>
                  <span className="geo-hotspot__body">
                    <strong>{group.label}</strong>
                    <small>
                      Focus #{focusDataset.id} {focusDataset.name}
                    </small>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
