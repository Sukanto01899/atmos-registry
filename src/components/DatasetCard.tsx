import { useMemo, useState } from "react";
import type { Dataset, DatasetCardProps } from "../type";

const previewSeeds = (seed: number, index: number) =>
  Math.abs((seed * (index + 3) * 37 + index * 71) % 100);

const buildDatasetPreview = (
  dataset: Dataset,
  formatCoord: (value: number) => string,
) => {
  const lowerType = dataset.dataType.toLowerCase();
  const baseType = lowerType.includes("image") || lowerType.includes("sat")
    ? "imagery"
    : lowerType.includes("sensor")
      ? "sensor"
      : lowerType.includes("model")
        ? "model"
        : "geo";
  const seed = dataset.id * 9301 + (dataset.collectionDate % 1000);
  const rowCount = 120_000 + previewSeeds(seed, 1) * 4_500;
  const partitionCount = 4 + (previewSeeds(seed, 2) % 6);
  const updatedLabel = `Block ${dataset.createdAt}`;
  const spark = Array.from({ length: 14 }, (_, index) =>
    30 + (previewSeeds(seed, index) % 70),
  );

  if (baseType === "imagery") {
    return {
      title: "Imagery sample",
      summary: `${5} columns · ${rowCount.toLocaleString()} rows · ${partitionCount} partitions`,
      updatedLabel,
      columns: ["image_id", "lat", "lon", "cloud_pct", "resolution"],
      rows: [
        [
          `img-${dataset.id}-a`,
          formatCoord(dataset.latitude),
          formatCoord(dataset.longitude),
          `${previewSeeds(seed, 3)}%`,
          `${10 + previewSeeds(seed, 4)}cm`,
        ],
        [
          `img-${dataset.id}-b`,
          formatCoord(dataset.latitude + 1200),
          formatCoord(dataset.longitude - 900),
          `${previewSeeds(seed, 5)}%`,
          `${10 + previewSeeds(seed, 6)}cm`,
        ],
      ],
      spark,
    };
  }

  if (baseType === "model") {
    return {
      title: "Model output sample",
      summary: `${5} columns · ${rowCount.toLocaleString()} rows · ${partitionCount} partitions`,
      updatedLabel,
      columns: ["timestamp", "grid_id", "lat", "lon", "prediction"],
      rows: [
        [
          `t-${dataset.collectionDate}`,
          `cell-${dataset.id}-${previewSeeds(seed, 2)}`,
          formatCoord(dataset.latitude),
          formatCoord(dataset.longitude),
          (previewSeeds(seed, 3) / 10).toFixed(2),
        ],
        [
          `t-${dataset.collectionDate + 1200}`,
          `cell-${dataset.id}-${previewSeeds(seed, 4)}`,
          formatCoord(dataset.latitude + 1500),
          formatCoord(dataset.longitude - 1200),
          (previewSeeds(seed, 5) / 10).toFixed(2),
        ],
      ],
      spark,
    };
  }

  if (baseType === "sensor") {
    return {
      title: "Sensor stream sample",
      summary: `${5} columns · ${rowCount.toLocaleString()} rows · ${partitionCount} partitions`,
      updatedLabel,
      columns: ["timestamp", "lat", "lon", "alt_m", "value"],
      rows: [
        [
          `t-${dataset.collectionDate}`,
          formatCoord(dataset.latitude),
          formatCoord(dataset.longitude),
          `${dataset.altitudeMax}m`,
          `${(previewSeeds(seed, 3) + 10) / 10}`,
        ],
        [
          `t-${dataset.collectionDate + 1200}`,
          formatCoord(dataset.latitude + 1000),
          formatCoord(dataset.longitude - 1200),
          `${dataset.altitudeMin}m`,
          `${(previewSeeds(seed, 4) + 10) / 10}`,
        ],
      ],
      spark,
    };
  }

  return {
    title: "Geo sample",
    summary: `${5} columns · ${rowCount.toLocaleString()} rows · ${partitionCount} partitions`,
    updatedLabel,
    columns: ["timestamp", "lat", "lon", "field_a", "field_b"],
    rows: [
      [
        `t-${dataset.collectionDate}`,
        formatCoord(dataset.latitude),
        formatCoord(dataset.longitude),
        `${previewSeeds(seed, 2)}`,
        `${previewSeeds(seed, 3)}`,
      ],
      [
        `t-${dataset.collectionDate + 1200}`,
        formatCoord(dataset.latitude + 800),
        formatCoord(dataset.longitude - 700),
        `${previewSeeds(seed, 4)}`,
        `${previewSeeds(seed, 5)}`,
      ],
    ],
    spark,
  };
};

export function DatasetCard({
  dataset,
  statusClass,
  rank,
  qualityScore,
  notePreview,
  stewardshipSignal,
  isStewardStaked,
  compareActive,
  watchActive,
  pinActive,
  formatCoord,
  onCopySummary,
  onCopyDatasetJson,
  onCloneToRegister,
  onCopyId,
  onCopyOwner,
  onLoadOwnerDatasets,
  onFilterOwner,
  onCopyCoords,
  onCopyIpfs,
  onCopyIpfsGatewayUrl,
  onCopyLink,
  onOpenIpfs,
  onCheckIpfs,
  onCopyOwnerExplorerUrl,
  onOpenOwnerExplorer,
  onOpenMap,
  onCopyMapUrl,
  onOpenDetail,
  onAudit,
  onToggleCompare,
  onToggleWatch,
  onTogglePin,
}: DatasetCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const preview = useMemo(
    () => buildDatasetPreview(dataset, formatCoord),
    [dataset, formatCoord],
  );
  const previewId = `dataset-preview-${dataset.id}`;

  return (
    <article
      className={`dataset-card ${previewOpen ? "preview-open" : ""}`}
    >
      <div className="dataset-header">
        <div>
          <div className="dataset-title">{dataset.name}</div>
          <div className="dataset-tags">
            <span className="tag">{dataset.dataType}</span>
            <span
              className={`tag ${dataset.isPublic ? "tag--public" : "tag--private"}`}
            >
              {dataset.isPublic ? "Public" : "Private"}
            </span>
            {dataset.metadataFrozen && (
              <span className="tag tag--frozen">Frozen</span>
            )}
            {isStewardStaked && (
              <span className="tag tag--staked">Steward staked</span>
            )}
            {notePreview && <span className="tag tag--note">Private note</span>}
          </div>
        </div>
        <span className={`status-pill ${statusClass}`}>{dataset.status}</span>
      </div>
      <div className="dataset-rank">
        Rank #{rank} | Quality {qualityScore}/100
      </div>
      {isStewardStaked && stewardshipSignal && (
        <div className="dataset-rank dataset-rank--stake">
          {stewardshipSignal}
        </div>
      )}
      <p className="dataset-description">{dataset.description}</p>
      {notePreview && (
        <div className="dataset-note-preview" title={notePreview}>
          <span>Private note</span>
          <strong>{notePreview}</strong>
        </div>
      )}
      <div className="dataset-meta">
        <div>
          <span>Owner</span>
          <strong>{dataset.owner}</strong>
        </div>
        <div>
          <span>Location</span>
          <strong>
            {formatCoord(dataset.latitude)} deg,{" "}
            {formatCoord(dataset.longitude)} deg
          </strong>
        </div>
        <div>
          <span>Altitude</span>
          <strong>
            {dataset.altitudeMin}-{dataset.altitudeMax} m
          </strong>
        </div>
        {dataset.verified && (
          <div>
            <span>Verified by</span>
            <strong>{dataset.verifiedBy || "validator"}</strong>
          </div>
        )}
      </div>
      <div className="dataset-preview" id={previewId}>
        <div className="dataset-preview__head">
          <div>
            <span className="dataset-preview__label">Quick preview</span>
            <strong className="dataset-preview__title">{preview.title}</strong>
          </div>
          <div className="dataset-preview__meta">{preview.summary}</div>
        </div>
        <div className="dataset-preview__content">
          <div className="dataset-preview__schema">
            <span>Schema</span>
            <div className="dataset-preview__chips">
              {preview.columns.map((column) => (
                <span className="dataset-preview__chip" key={column}>
                  {column}
                </span>
              ))}
            </div>
          </div>
          <div className="dataset-preview__spark">
            <div className="dataset-preview__spark-head">
              <span>Last updated signal</span>
              <strong>{preview.updatedLabel}</strong>
            </div>
            <div className="dataset-preview__sparkline">
              {preview.spark.map((value, index) => (
                <span
                  key={`spark-${dataset.id}-${index}`}
                  style={{ height: `${value}%` }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="dataset-preview__table">
          <div className="dataset-preview__row dataset-preview__row--head">
            {preview.columns.map((column) => (
              <span key={`head-${column}`}>{column}</span>
            ))}
          </div>
          {preview.rows.map((row, rowIndex) => (
            <div
              className="dataset-preview__row"
              key={`row-${dataset.id}-${rowIndex}`}
            >
              {row.map((value, index) => (
                <span key={`cell-${dataset.id}-${rowIndex}-${index}`}>
                  {value}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="dataset-foot">
        <span>Collection date: {dataset.collectionDate}</span>
        <span>Record height: {dataset.createdAt}</span>
        <span className="hash">IPFS: {dataset.ipfsHash || "n/a"}</span>
        {onCopySummary && (
          <button
            className="ghost-btn dataset-foot__action dataset-foot__action--compare"
            type="button"
            onClick={onCopySummary}
          >
            Copy summary
          </button>
        )}
        {onCopyDatasetJson && (
          <button
            className="ghost-btn dataset-foot__action dataset-foot__action--compare"
            type="button"
            onClick={onCopyDatasetJson}
          >
            Copy JSON
          </button>
        )}
        {onCloneToRegister && (
          <button
            className="ghost-btn dataset-foot__action dataset-foot__action--compare"
            type="button"
            onClick={onCloneToRegister}
          >
            Clone to register
          </button>
        )}
        <button
          className="ghost-btn dataset-foot__action dataset-foot__action--compare"
          type="button"
          onClick={onCopyId}
        >
          Copy ID
        </button>
        <button
          className="ghost-btn dataset-foot__action dataset-foot__action--compare"
          type="button"
          onClick={onCopyOwner}
        >
          Copy owner
        </button>
        {onLoadOwnerDatasets && (
          <button
            className="ghost-btn dataset-foot__action dataset-foot__action--compare"
            type="button"
            onClick={onLoadOwnerDatasets}
          >
            Load owner datasets
          </button>
        )}
        {onFilterOwner && (
          <button
            className="ghost-btn dataset-foot__action dataset-foot__action--compare"
            type="button"
            onClick={onFilterOwner}
          >
            Filter owner
          </button>
        )}
        {onOpenOwnerExplorer && (
          <button
            className="ghost-btn dataset-foot__action dataset-foot__action--compare"
            type="button"
            onClick={onOpenOwnerExplorer}
          >
            Open owner
          </button>
        )}
        {onCopyOwnerExplorerUrl && (
          <button
            className="ghost-btn dataset-foot__action dataset-foot__action--compare"
            type="button"
            onClick={onCopyOwnerExplorerUrl}
          >
            Copy owner URL
          </button>
        )}
        {onCopyCoords && (
          <button
            className="ghost-btn dataset-foot__action dataset-foot__action--compare"
            type="button"
            onClick={onCopyCoords}
          >
            Copy coords
          </button>
        )}
        {onOpenMap && (
          <button
            className="ghost-btn dataset-foot__action dataset-foot__action--compare"
            type="button"
            onClick={onOpenMap}
          >
            Open map
          </button>
        )}
        {onCopyMapUrl && (
          <button
            className="ghost-btn dataset-foot__action dataset-foot__action--compare"
            type="button"
            onClick={onCopyMapUrl}
          >
            Copy map URL
          </button>
        )}
        <button
          className="ghost-btn dataset-foot__action dataset-foot__action--compare"
          type="button"
          onClick={onCopyIpfs}
        >
          Copy IPFS
        </button>
        {dataset.ipfsHash?.trim() && onCopyIpfsGatewayUrl && (
          <button
            className="ghost-btn dataset-foot__action dataset-foot__action--compare"
            type="button"
            onClick={onCopyIpfsGatewayUrl}
          >
            Copy IPFS URL
          </button>
        )}
        {onCopyLink && (
          <button
            className="ghost-btn dataset-foot__action dataset-foot__action--compare"
            type="button"
            onClick={onCopyLink}
          >
            Copy link
          </button>
        )}
        {dataset.ipfsHash?.trim() && onOpenIpfs && (
          <button
            className="ghost-btn dataset-foot__action dataset-foot__action--compare"
            type="button"
            onClick={onOpenIpfs}
          >
            Open IPFS
          </button>
        )}
        {dataset.ipfsHash?.trim() && onCheckIpfs && (
          <button
            className="ghost-btn dataset-foot__action dataset-foot__action--compare"
            type="button"
            onClick={onCheckIpfs}
          >
            Check IPFS
          </button>
        )}
        <button
          className="ghost-btn dataset-foot__action"
          type="button"
          onClick={onOpenDetail}
        >
          Open detail
        </button>
        <button
          className="ghost-btn dataset-foot__action"
          type="button"
          onClick={onAudit}
        >
          Audit this
        </button>
        <button
          className={`ghost-btn dataset-foot__action dataset-foot__action--compare ${
            previewOpen ? "active" : ""
          }`}
          type="button"
          onClick={() => setPreviewOpen((prev) => !prev)}
          aria-expanded={previewOpen}
          aria-controls={previewId}
        >
          {previewOpen ? "Hide preview" : "Quick preview"}
        </button>
        <button
          className={`ghost-btn dataset-foot__action dataset-foot__action--compare ${
            compareActive ? "active" : ""
          }`}
          type="button"
          onClick={onToggleCompare}
        >
          {compareActive ? "Remove compare" : "Compare"}
        </button>
        <button
          className={`ghost-btn dataset-foot__action dataset-foot__action--compare ${
            watchActive ? "active" : ""
          }`}
          type="button"
          onClick={onToggleWatch}
        >
          {watchActive ? "Watching" : "Watch"}
        </button>
        <button
          className={`ghost-btn dataset-foot__action dataset-foot__action--compare ${
            pinActive ? "active" : ""
          }`}
          type="button"
          onClick={onTogglePin}
        >
          {pinActive ? "Pinned" : "Pin"}
        </button>
      </div>
    </article>
  );
}
