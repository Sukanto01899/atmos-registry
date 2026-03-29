import { useEffect, useMemo, useRef } from "react";
import type { TrackedTx } from "../txTracker";

type Props = {
  open: boolean;
  chain: "mainnet" | "testnet";
  txs: TrackedTx[];
  onClose: () => void;
  onClear: () => void;
  onRemove: (txId: string) => void;
  onRefresh: () => void;
};

const formatWhen = (timestampMs: number) => {
  const deltaSec = Math.max(0, Math.round((Date.now() - timestampMs) / 1000));
  if (deltaSec < 60) return `${deltaSec}s ago`;
  const min = Math.round(deltaSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.round(hr / 24);
  return `${days}d ago`;
};

const statusLabel = (status: TrackedTx["status"]) => {
  if (status === "success") return "Confirmed";
  if (status === "failed") return "Failed";
  if (status === "pending") return "Pending";
  return "Submitted";
};

export function TxCenter({
  open,
  chain,
  txs,
  onClose,
  onClear,
  onRemove,
  onRefresh,
}: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const explorerBase = chain === "testnet" ? "https://explorer.hiro.so" : "https://explorer.hiro.so";

  const pendingCount = useMemo(
    () => txs.filter((t) => t.status !== "success" && t.status !== "failed").length,
    [txs],
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="tx-center-overlay" onClick={onClose}>
      <div
        className="tx-center-panel"
        ref={panelRef}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Transaction center"
      >
        <div className="tx-center-head">
          <div>
            <div className="tx-center-title">Transactions</div>
            <div className="tx-center-subtitle">
              {pendingCount ? `${pendingCount} pending` : "All caught up"}
            </div>
          </div>
          <div className="tx-center-actions">
            <button className="ghost-btn compact" type="button" onClick={onRefresh}>
              Refresh
            </button>
            <button className="ghost-btn compact" type="button" onClick={onClear}>
              Clear
            </button>
            <button className="ghost-btn compact" type="button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        {txs.length === 0 ? (
          <div className="tx-center-empty">No tracked transactions yet.</div>
        ) : (
          <div className="tx-center-list">
            {txs.map((tx) => {
              const short =
                tx.txId.length > 12 ? `${tx.txId.slice(0, 6)}…${tx.txId.slice(-6)}` : tx.txId;
              const href = `${explorerBase}/txid/${encodeURIComponent(tx.txId)}?chain=${encodeURIComponent(
                chain,
              )}`;
              return (
                <div key={tx.txId} className={`tx-item tx-item--${tx.status}`}>
                  <div className="tx-item-main">
                    <div className="tx-item-title">{tx.title}</div>
                    <div className="tx-item-meta">
                      <span className="tx-item-status">{statusLabel(tx.status)}</span>
                      <span className="tx-item-sep">•</span>
                      <span className="tx-item-when">{formatWhen(tx.createdAt)}</span>
                      <span className="tx-item-sep">•</span>
                      <a
                        className="tx-item-link"
                        href={href}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        {short}
                      </a>
                      {typeof tx.blockHeight === "number" && tx.blockHeight > 0 && (
                        <>
                          <span className="tx-item-sep">•</span>
                          <span className="tx-item-height">Block {tx.blockHeight}</span>
                        </>
                      )}
                    </div>
                    {tx.error && <div className="tx-item-error">{tx.error}</div>}
                    {tx.chainStatus && (
                      <div className="tx-item-chain">Chain: {tx.chainStatus}</div>
                    )}
                  </div>
                  <div className="tx-item-actions">
                    <button
                      className="ghost-btn compact"
                      type="button"
                      onClick={() => {
                        try {
                          navigator.clipboard?.writeText?.(tx.txId);
                        } catch {
                          // ignore
                        }
                      }}
                    >
                      Copy
                    </button>
                    <button
                      className="ghost-btn compact"
                      type="button"
                      onClick={() => onRemove(tx.txId)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

