import type { Dataset, DatasetCardProps } from "../type";

export function DatasetCard({
  dataset,
  statusClass,
  rank,
  qualityScore,
  stewardshipSignal,
  isStewardStaked,
  compareActive,
  watchActive,
  formatCoord,
  onCopyId,
  onCopyOwner,
  onCopyIpfs,
  onOpenDetail,
  onAudit,
  onToggleCompare,
  onToggleWatch,
}: DatasetCardProps) {
  return (
    <article className="dataset-card">
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
      <div className="dataset-foot">
        <span>Collection date: {dataset.collectionDate}</span>
        <span>Record height: {dataset.createdAt}</span>
        <span className="hash">IPFS: {dataset.ipfsHash || "n/a"}</span>
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
        <button
          className="ghost-btn dataset-foot__action dataset-foot__action--compare"
          type="button"
          onClick={onCopyIpfs}
        >
          Copy IPFS
        </button>
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
      </div>
    </article>
  );
}
