import { useEffect, useMemo, useRef, useState } from "react";
import {
  TrackedTx,
  addTrackedTx,
  clearTrackedTxs,
  fetchTxChainState,
  isFinalTxStatus,
  loadTrackedTxs,
  removeTrackedTx,
  saveTrackedTxs,
} from "./txTracker";

type Options = {
  apiBaseUrl: string;
  pollMs?: number;
};

export const useTxCenter = ({ apiBaseUrl, pollMs = 12_000 }: Options) => {
  const [txs, setTxs] = useState<TrackedTx[]>(() => loadTrackedTxs());
  const pollInFlightRef = useRef(false);
  const txsRef = useRef<TrackedTx[]>(txs);

  useEffect(() => {
    txsRef.current = txs;
  }, [txs]);

  useEffect(() => {
    saveTrackedTxs(txs);
  }, [txs]);

  const pendingCount = useMemo(
    () => txs.filter((t) => !isFinalTxStatus(t.status)).length,
    [txs],
  );

  const addTx = (txId: string, title: string) => {
    setTxs((prev) => addTrackedTx(prev, txId, title));
  };

  const removeTx = (txId: string) => {
    setTxs((prev) => removeTrackedTx(prev, txId));
  };

  const clearAll = () => {
    clearTrackedTxs();
    setTxs([]);
  };

  const refreshNow = async () => {
    if (pollInFlightRef.current) return;
    pollInFlightRef.current = true;
    try {
      const currentTxs = txsRef.current;
      const pending = currentTxs.filter((t) => !isFinalTxStatus(t.status));
      if (!pending.length) return;
      const updates = await Promise.all(
        pending.map(async (tx) => ({
          txId: tx.txId,
          result: await fetchTxChainState({ apiBaseUrl, txId: tx.txId }),
        })),
      );
      setTxs((prev) => {
        const map = new Map(prev.map((t) => [t.txId, t]));
        for (const update of updates) {
          const existing = map.get(update.txId);
          if (!existing) continue;
          map.set(update.txId, {
            ...existing,
            status:
              existing.status === "submitted" && update.result.status === "pending"
                ? "pending"
                : update.result.status,
            chainStatus: update.result.chainStatus ?? existing.chainStatus,
            blockHeight: update.result.blockHeight ?? existing.blockHeight,
            error: update.result.error,
            updatedAt: Date.now(),
          });
        }
        return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
      });
    } finally {
      pollInFlightRef.current = false;
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!txsRef.current.some((t) => !isFinalTxStatus(t.status))) return;
    const id = window.setInterval(() => {
      refreshNow();
    }, pollMs);
    refreshNow();
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBaseUrl, pollMs, pendingCount]);

  return { txs, pendingCount, addTx, removeTx, clearAll, refreshNow };
};
