export type TrackedTxStatus = "submitted" | "pending" | "success" | "failed";

export type TrackedTx = {
  txId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  status: TrackedTxStatus;
  chainStatus?: string;
  blockHeight?: number;
  error?: string;
};

const STORAGE_KEY = "atmos.tx-center.v1";
const MAX_TXS = 25;

const nowMs = () => Date.now();

const sanitizeApiBase = (value: string) => value.replace(/\/+$/, "");

const isValidTxId = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^[0-9a-fA-F]{64}$/.test(trimmed) || /^0x[0-9a-fA-F]{64}$/.test(trimmed);
};

export const loadTrackedTxs = (): TrackedTx[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item: any) => {
        const txId = String(item?.txId ?? "").trim();
        const title = String(item?.title ?? "").trim();
        const createdAt = Number(item?.createdAt ?? 0);
        const updatedAt = Number(item?.updatedAt ?? createdAt ?? 0);
        const status = String(item?.status ?? "submitted") as TrackedTxStatus;
        if (!isValidTxId(txId) || !title || !Number.isFinite(createdAt)) return null;
        const normalizedStatus: TrackedTxStatus = (
          status === "pending" || status === "success" || status === "failed"
            ? status
            : "submitted"
        ) as TrackedTxStatus;
        const chainStatus = item?.chainStatus ? String(item.chainStatus) : undefined;
        const blockHeight = Number.isFinite(Number(item?.blockHeight))
          ? Number(item.blockHeight)
          : undefined;
        const error = item?.error ? String(item.error) : undefined;
        return {
          txId,
          title,
          createdAt,
          updatedAt: Number.isFinite(updatedAt) ? updatedAt : createdAt,
          status: normalizedStatus,
          chainStatus,
          blockHeight,
          error,
        } as TrackedTx;
      })
      .filter((value): value is TrackedTx => Boolean(value))
      .slice(0, MAX_TXS);
  } catch {
    return [];
  }
};

export const saveTrackedTxs = (txs: TrackedTx[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(txs.slice(0, MAX_TXS)));
  } catch {
    // ignore
  }
};

export const addTrackedTx = (
  txs: TrackedTx[],
  txId: string,
  title: string,
): TrackedTx[] => {
  const cleanTxId = String(txId ?? "").trim();
  const cleanTitle = String(title ?? "").trim();
  if (!isValidTxId(cleanTxId) || !cleanTitle) return txs;

  const createdAt = nowMs();
  const entry: TrackedTx = {
    txId: cleanTxId,
    title: cleanTitle,
    createdAt,
    updatedAt: createdAt,
    status: "submitted",
  };

  const rest = txs.filter((t) => t.txId !== cleanTxId);
  return [entry, ...rest].slice(0, MAX_TXS);
};

export const removeTrackedTx = (txs: TrackedTx[], txId: string) =>
  txs.filter((t) => t.txId !== txId);

export const clearTrackedTxs = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};

export const isFinalTxStatus = (status: TrackedTxStatus) =>
  status === "success" || status === "failed";

const mapChainStatus = (chainStatus: string | undefined): TrackedTxStatus => {
  const value = String(chainStatus ?? "").toLowerCase();
  if (value === "success") return "success";
  if (!value || value === "pending") return "pending";
  if (value.startsWith("abort")) return "failed";
  if (value === "dropped" || value === "failed") return "failed";
  return "pending";
};

export const fetchTxChainState = async ({
  apiBaseUrl,
  txId,
}: {
  apiBaseUrl: string;
  txId: string;
}): Promise<Pick<TrackedTx, "status" | "chainStatus" | "blockHeight" | "error">> => {
  const url = `${sanitizeApiBase(apiBaseUrl)}/extended/v1/tx/${encodeURIComponent(
    txId,
  )}`;
  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      return {
        status: "pending",
        chainStatus: undefined,
        blockHeight: undefined,
        error: `HTTP ${res.status}`,
      };
    }
    const json = (await res.json()) as any;
    const chainStatus = typeof json?.tx_status === "string" ? json.tx_status : undefined;
    const blockHeight = Number.isFinite(Number(json?.block_height))
      ? Number(json.block_height)
      : undefined;
    return {
      status: mapChainStatus(chainStatus),
      chainStatus,
      blockHeight,
      error: undefined,
    };
  } catch (error: any) {
    return {
      status: "pending",
      chainStatus: undefined,
      blockHeight: undefined,
      error: error?.message ? String(error.message) : "Network error",
    };
  }
};
