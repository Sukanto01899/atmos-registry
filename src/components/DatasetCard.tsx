import { useMemo, useState } from "react";
import { createdAtAge, createdAtDateLabel, getAgeColorClass, getQualityBreakdown, relativeTimeAgo } from "../lib";
import type { Dataset, DatasetCardProps } from "../type";

const highlightText = (text: string, query: string) => {
  const q = query.trim();
  if (!q) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="search-highlight">{part}</mark> : part,
  );
};

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

const getCompleteness = (dataset: Dataset) => {
  const total = 6;
  let score = 0;

  if (dataset.description?.trim()) score += 1;
  if (dataset.dataType?.trim()) score += 1;
  if (dataset.collectionDate > 0) score += 1;
  if (dataset.latitude !== 0 && dataset.longitude !== 0) score += 1;
  if (Number.isFinite(dataset.altitudeMin) && Number.isFinite(dataset.altitudeMax)) {
    if (dataset.altitudeMax >= dataset.altitudeMin) score += 1;
  }
  if (dataset.ipfsHash?.trim()) score += 1;

  return { score, total };
};

export function DatasetCard({
  dataset,
  statusClass,
  rank,
  qualityScore,
  notePreview,
  stewardshipSignal,
  isStewardStaked,
  duplicateInfo,
  isStale,
  searchQuery,
  compareActive,
  watchActive,
  pinActive,
  formatCoord,
  onCopySummary,
  onCopyCitation,
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
  ipfsHealth,
  ipfsCheckedAt,
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
  const completeness = useMemo(() => getCompleteness(dataset), [dataset]);
  const breakdown = useMemo(() => getQualityBreakdown(dataset), [dataset]);
  const previewId = `dataset-preview-${dataset.id}`;

  return (
    <article
      className={`dataset-card ${previewOpen ? "preview-open" : ""}`}
      data-status={dataset.status}
    >
      <div className="dataset-header">
        <div>
          <div className="dataset-title">{highlightText(dataset.name, searchQuery ?? "")}</div>
          <div className="dataset-tags">
            <span className="tag">{dataset.dataType}</span>
            <span
              className={`tag tag--complete ${
                completeness.score === completeness.total ? "tag--complete-full" : ""
              }`}
              title="Field completeness: description, type, collection date, coordinates, altitude range, and IPFS hash"
            >
              Complete {completeness.score}/{completeness.total}
            </span>
            {dataset.ipfsHash?.trim() && (
              <span
                className={`tag tag--ipfs tag--ipfs-${ipfsHealth ?? "unchecked"}`}
                title={
                  ipfsCheckedAt && ipfsCheckedAt > 0
                    ? `IPFS gateway reachability · checked ${new Date(
                        ipfsCheckedAt * 1000,
                      ).toLocaleString()}`
                    : "IPFS gateway reachability (last check in this browser)"
                }
              >
                IPFS: {(ipfsHealth ?? "unchecked").toUpperCase()}
                {ipfsCheckedAt && ipfsCheckedAt > 0 &&
                ipfsHealth !== "checking" &&
                ipfsHealth !== "unchecked" ? (
                  <span className="tag-ipfs-checked">
                    {" "}
                    · {relativeTimeAgo(ipfsCheckedAt)}
                  </span>
                ) : null}
              </span>
            )}
            <span
              className={`tag ${dataset.isPublic ? "tag--public" : "tag--private"}`}
            >
              {dataset.isPublic ? "Public" : "Private"}
            </span>
            {pinActive && <span className="tag tag--pinned">Pinned</span>}
            {dataset.metadataFrozen && (
              <span className="tag tag--frozen">Frozen</span>
            )}
            {isStewardStaked && (
              <span className="tag tag--staked">Steward staked</span>
            )}
            {notePreview && <span className="tag tag--note">Private note</span>}
            {duplicateInfo && (
              <span
                className="tag tag--duplicate"
                title={
                  duplicateInfo.isCanonical
                    ? `Matches ${duplicateInfo.groupSize - 1} other dataset(s) on name, coordinates, and IPFS hash. This record was picked as the canonical one (highest quality/completeness).`
                    : `Matches ${duplicateInfo.groupSize - 1} other dataset(s) on name, coordinates, and IPFS hash. Another record in this group is the likely canonical one.`
                }
              >
                {duplicateInfo.isCanonical ? "Canonical" : "Possible duplicate"}
              </span>
            )}
            {isStale && (
              <span
                className="tag tag--stale"
                title="Unverified and older than 90 days. Consider re-verifying or refreshing this record."
              >
                Needs review
              </span>
            )}
            {dataset.createdAt > 0 && (
              <span
                className={`tag tag--age ${getAgeColorClass(dataset.createdAt)}`}
                title={
                  dataset.createdAt > 1_000_000_000
                    ? `Registered ${new Date(dataset.createdAt * 1000).toLocaleString()}`
                    : `Registered ~${createdAtDateLabel(dataset.createdAt)} · block ${dataset.createdAt} (estimated from block height)`
                }
              >
                {createdAtAge(dataset.createdAt)}
              </span>
            )}
          </div>
        </div>
        <span className={`status-pill ${statusClass}`}>{dataset.status}</span>
      </div>
      <div className="dataset-rank">
        <span className="dataset-rank__rank">#{rank}</span>
        <span className="dataset-rank__bar">
          <span
            className="dataset-rank__fill"
            style={{ width: `${Math.min(100, qualityScore)}%` }}
          />
        </span>
        <span className="dataset-rank__score-wrap">
          <span className="dataset-rank__score" tabIndex={0}>
            {qualityScore}/100
          </span>
          <div className="dataset-rank__breakdown" role="tooltip">
            <ul className="dataset-rank__breakdown-list">
              {breakdown.map(({ label, points, earned }) => (
                <li
                  key={label}
                  className={`dataset-rank__breakdown-row ${earned ? "dataset-rank__breakdown-row--earned" : "dataset-rank__breakdown-row--missing"}`}
                >
                  <span className="dataset-rank__breakdown-icon">
                    {earned ? "✓" : "✗"}
                  </span>
                  <span className="dataset-rank__breakdown-label">{label}</span>
                  <span className="dataset-rank__breakdown-pts">
                    {earned ? `+${points}` : `+0 / ${points}`}
                  </span>
                </li>
              ))}
            </ul>
            <div className="dataset-rank__breakdown-total">
              Total: <strong>{qualityScore}</strong> / 100
            </div>
          </div>
        </span>
      </div>
      {isStewardStaked && stewardshipSignal && (
        <div className="dataset-rank dataset-rank--stake">
          {stewardshipSignal}
        </div>
      )}
      <p className="dataset-description">{highlightText(dataset.description, searchQuery ?? "")}</p>
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
        <span title={`Block height: ${dataset.createdAt}`}>
          Record height: {dataset.createdAt}
          {dataset.createdAt > 0 && (
            <> · <span className="dataset-foot__age">{createdAtAge(dataset.createdAt)}</span></>
          )}
        </span>
        <span className="hash">IPFS: {dataset.ipfsHash || "n/a"}</span>
        <div className="dataset-foot__copies">
          {onCopySummary && (
            <button
              className="ghost-btn dataset-foot__action dataset-foot__action--compare"
              type="button"
              onClick={onCopySummary}
            >
              Copy summary
            </button>
          )}
          {onCopyCitation && (
            <button
              className="ghost-btn dataset-foot__action dataset-foot__action--compare"
              type="button"
              onClick={onCopyCitation}
            >
              Copy citation
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
        </div>
        <div className="dataset-foot__sep" aria-hidden="true" />
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
