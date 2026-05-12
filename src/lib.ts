import { UserSession } from "@stacks/auth";
import { DEFAULT_PROVIDERS } from "@stacks/connect";
import { defineCustomElements } from "@stacks/connect-ui/loader";
import { bytesToHex } from "@stacks/common";
import {
  createContractCallPayload,
  cvToJSON,
  fetchFeeEstimateTransaction,
  fetchNonce,
  serializePayloadBytes,
  type ClarityValue,
} from "@stacks/transactions";
import { Dataset, DatasetFilters, SortMode, VersionStatus } from "./type";

export const SORT_MODES = [
  "quality-desc",
  "recent-desc",
  "recent-asc",
  "altitude-desc",
  "status-priority",
] as const;

export type UrlViewState = {
  activeTab: "explore" | "mine";
  filters: DatasetFilters;
  geoTimePercent: number;
  compareSelectionIds: string[];
  watchlistOnly: boolean;
  watchlistIds: string[];
  mutedAlertKinds: string[];
  sortMode: SortMode;
  lineageSelectionId: string;
  selectedGeoDatasetId: string;
  showDatasetDetail: boolean;
};

export const clampPercent = (value: number) =>
  Math.max(0, Math.min(100, value));

const parseUrlIdList = (value: string | null) =>
  Array.from(
    new Set(
      (value ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter((item) => /^[0-9]+$/.test(item)),
    ),
  );

const parseUrlStringList = (value: string | null) =>
  Array.from(
    new Set(
      (value ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter((item) => Boolean(item)),
    ),
  );

export const parseUrlViewState = (search: string): UrlViewState => {
  const params = new URLSearchParams(search);
  const tab = params.get("tab");
  const sort = params.get("sort");
  const geo = Number.parseInt(params.get("geo") ?? "", 10);
  const lineage = params.get("lineage");
  const geoId = params.get("geoId");
  const visibility = params.get("visibility");
  const verified = params.get("ver");
  const frozen = params.get("frozen");
  const ipfs = params.get("ipfs");

  return {
    activeTab: tab === "mine" ? "mine" : "explore",
    filters: {
      search: params.get("search") ?? "",
      status: params.get("status") ?? "all",
      visibility:
        visibility === "public" || visibility === "private"
          ? (visibility as "public" | "private")
          : "all",
      verified:
        verified === "verified" || verified === "unverified"
          ? (verified as "verified" | "unverified")
          : "all",
      frozen:
        frozen === "frozen" || frozen === "mutable"
          ? (frozen as "frozen" | "mutable")
          : "all",
      ipfs:
        ipfs === "has-ipfs" || ipfs === "no-ipfs"
          ? (ipfs as "has-ipfs" | "no-ipfs")
          : "all",
      dataType: params.get("type") ?? "all",
      owner: params.get("owner") ?? "",
      altitudeMin: params.get("amin") ?? "",
      altitudeMax: params.get("amax") ?? "",
      notedOnly: params.get("noted") === "1",
      pinnedOnly: params.get("pinned") === "1",
    },
    geoTimePercent: Number.isNaN(geo) ? 100 : clampPercent(geo),
    compareSelectionIds: parseUrlIdList(params.get("compare")),
    watchlistOnly: params.get("watchOnly") === "1",
    watchlistIds: parseUrlIdList(params.get("watch")),
    mutedAlertKinds: parseUrlStringList(params.get("mute")),
    sortMode: SORT_MODES.includes(sort as SortMode)
      ? (sort as SortMode)
      : "quality-desc",
    lineageSelectionId: lineage && /^\d+$/.test(lineage) ? lineage : "",
    selectedGeoDatasetId: geoId && /^\d+$/.test(geoId) ? geoId : "",
    showDatasetDetail: params.get("detail") === "1",
  };
};

export const buildUrlViewSearch = (state: UrlViewState) => {
  const params = new URLSearchParams();

  if (state.activeTab !== "explore") params.set("tab", state.activeTab);
  if (state.sortMode !== "quality-desc") params.set("sort", state.sortMode);
  if (state.filters.search) params.set("search", state.filters.search);
  if (state.filters.status !== "all") params.set("status", state.filters.status);
  if (state.filters.visibility !== "all") {
    params.set("visibility", state.filters.visibility);
  }
  if (state.filters.verified !== "all") params.set("ver", state.filters.verified);
  if (state.filters.frozen !== "all") params.set("frozen", state.filters.frozen);
  if (state.filters.ipfs !== "all") params.set("ipfs", state.filters.ipfs);
  if (state.filters.dataType !== "all") params.set("type", state.filters.dataType);
  if (state.filters.owner) params.set("owner", state.filters.owner);
  if (state.filters.altitudeMin) params.set("amin", state.filters.altitudeMin);
  if (state.filters.altitudeMax) params.set("amax", state.filters.altitudeMax);
  if (state.filters.notedOnly) params.set("noted", "1");
  if (state.filters.pinnedOnly) params.set("pinned", "1");
  if (state.geoTimePercent !== 100) {
    params.set("geo", String(clampPercent(state.geoTimePercent)));
  }
  if (state.compareSelectionIds.length) {
    params.set("compare", state.compareSelectionIds.join(","));
  }
  if (state.watchlistOnly) params.set("watchOnly", "1");
  if (state.watchlistIds.length) params.set("watch", state.watchlistIds.join(","));
  if (state.mutedAlertKinds.length) {
    params.set("mute", state.mutedAlertKinds.join(","));
  }
  if (state.lineageSelectionId) params.set("lineage", state.lineageSelectionId);
  if (state.selectedGeoDatasetId) params.set("geoId", state.selectedGeoDatasetId);
  if (state.showDatasetDetail) params.set("detail", "1");

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const unwrapResponseOk = (cv: unknown) => {
  const json = cvToJSON(cv as any) as any;
  if (json.success === true && json.value !== undefined) {
    return json.value;
  }
  if (json.success === false) {
    throw new Error("Read-only call returned err");
  }
  if (json.type === "response") {
    if (json.value?.type !== "ok") {
      throw new Error("Read-only call returned err");
    }
    return json.value.value;
  }
  return json;
};

export const parseTuple = (tuple: any, id: number): Dataset | null => {
  if (!tuple) {
    return null;
  }
  const type = tuple.type ?? "";
  const data =
    type === "tuple" || (typeof type === "string" && type.startsWith("(tuple"))
      ? (tuple.value ?? {})
      : (tuple.value ?? {});
  const getString = (key: string) => String(data[key]?.value ?? "");
  const getBool = (key: string) => Boolean(data[key]?.value ?? false);
  const getNum = (key: string) =>
    Number.parseInt(String(data[key]?.value ?? "0"), 10);
  const getOptionalPrincipal = (key: string) =>
    String(data[key]?.value?.value ?? "");

  return {
    id,
    name: getString("name"),
    description: getString("description"),
    dataType: getString("data-type"),
    collectionDate: getNum("collection-date"),
    altitudeMin: getNum("altitude-min"),
    altitudeMax: getNum("altitude-max"),
    latitude: getNum("latitude"),
    longitude: getNum("longitude"),
    ipfsHash: getString("ipfs-hash"),
    isPublic: getBool("is-public"),
    metadataFrozen: getBool("metadata-frozen"),
    verified: getBool("verified"),
    verifiedBy: getOptionalPrincipal("verified-by"),
    verifiedAt: getNum("verified-at"),
    createdAt: getNum("created-at"),
    owner: getString("owner"),
    status: getString("status"),
  };
};

export const formatCoord = (value: number) => (value / 1_000_000).toFixed(3);

export const formatChainValue = (value: number) => {
  if (!value) return "n/a";
  if (value > 1_000_000_000) {
    return new Date(value * 1000).toLocaleString();
  }
  return `Block ${value}`;
};

export const getStatusClass = (status: string) => {
  if (status === "verified") return "status--verified";
  if (status === "rejected") return "status--rejected";
  if (status === "pending") return "status--pending";
  if (status === "deprecated") return "status--deprecated";
  return "status--active";
};

export const getQualityScore = (dataset: Dataset) =>
  (dataset.verified ? 45 : 0) +
  (dataset.ipfsHash ? 30 : 0) +
  (dataset.metadataFrozen ? 15 : 0) +
  (dataset.isPublic ? 10 : 0);

export const getStatusPriority = (status: string) => {
  if (status === "verified") return 4;
  if (status === "pending") return 3;
  if (status === "active") return 2;
  if (status === "deprecated") return 1;
  return 0;
};

export const getVersionStatusClass = (status: VersionStatus) => {
  if (status === "approved") return "status--verified";
  if (status === "rejected") return "status--rejected";
  if (status === "pending") return "status--pending";
  return "status--active";
};

export const mapDatasetToVersionStatus = (dataset: Dataset): VersionStatus => {
  if (dataset.status === "rejected") return "rejected";
  if (dataset.status === "pending") return "pending";
  if (dataset.verified || dataset.status === "verified") return "approved";
  return "approved";
};

export const nowUnix = () => Math.floor(Date.now() / 1000);
export const MICRO_TOKEN = 1_000_000;

export const formatTokenAmount = (value: number, decimals = 6) =>
  (value / 10 ** decimals).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.min(decimals, 4),
  });

export const formatPercentFromBps = (bps: number) =>
  `${(bps / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}%`;

export const parseUInt = (value: any) =>
  Number.parseInt(String(value?.value ?? value ?? "0"), 10);

export const parseMicroTokenInput = (value: string) => {
  const amount = Number.parseFloat(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  return Math.round(amount * MICRO_TOKEN);
};

export const parseStakeInfo = (value: any) => {
  const tuple = value?.value ?? {};
  return {
    amount: parseUInt(tuple.amount),
    lastClaimBlock: parseUInt(tuple["last-claim-block"]),
    totalClaimed: parseUInt(tuple["total-claimed"]),
  };
};

export const resetInvalidSession = (userSession: UserSession) => {
  try {
    userSession.store?.deleteSessionData();
  } catch {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("blockstack-session");
    }
  }
};

export const safeIsSignedIn = (userSession: UserSession) => {
  try {
    return userSession.isUserSignedIn();
  } catch {
    resetInvalidSession(userSession);
    return false;
  }
};

export const getUserAddress = (userSession: UserSession) => {
  if (!safeIsSignedIn(userSession)) {
    return "";
  }
  try {
    const userData = userSession.loadUserData();
    const profile = userData?.profile as any;
    return profile?.stxAddress?.mainnet ?? profile?.stxAddress?.testnet ?? "";
  } catch {
    return "";
  }
};

export const getAppIcon = () => {
  try {
    return `${window.location.origin}/atmos-icon.svg`;
  } catch {
    return "";
  }
};

export const getConnectProviders = () => {
  if (typeof window === "undefined") {
    return DEFAULT_PROVIDERS;
  }

  const stacksProvider = (window as any).StacksProvider;
  if (!stacksProvider) {
    return DEFAULT_PROVIDERS;
  }

  const hasNamedProvider = Boolean(
    (window as any).LeatherProvider ||
      (window as any).AsignaProvider ||
      (window as any).XverseProviders?.StacksProvider,
  );
  if (hasNamedProvider) {
    return DEFAULT_PROVIDERS;
  }

  const fallbackIcon =
    DEFAULT_PROVIDERS.find((provider) => provider.id === "LeatherProvider")
      ?.icon ?? getAppIcon();

  const inAppProvider = {
    id: "StacksProvider",
    name: "In-App Wallet",
    icon: fallbackIcon,
    webUrl: window.location.origin,
  };

  return [inAppProvider, ...DEFAULT_PROVIDERS];
};

let connectUiPromise: Promise<boolean> | null = null;

export const ensureConnectUi = async () => {
  if (typeof window === "undefined") {
    return false;
  }
  if (window.customElements?.get("connect-modal")) {
    return true;
  }

  connectUiPromise ??= defineCustomElements(window)
    .then(() => Boolean(window.customElements?.get("connect-modal")))
    .catch(() => {
      connectUiPromise = null;
      return false;
    });

  return connectUiPromise;
};

type FeeEstimateCacheEntry = { fee: number; expiresAt: number };
const feeEstimateCache = new Map<string, FeeEstimateCacheEntry>();

export const estimateContractCallFee = async ({
  stacksApiBaseUrl,
  contractAddress,
  contractName,
  functionName,
  functionArgs,
}: {
  stacksApiBaseUrl: string;
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
}): Promise<number | null> => {
  if (typeof window === "undefined") return null;

  const payload = createContractCallPayload(
    contractAddress,
    contractName,
    functionName,
    functionArgs,
  );
  const payloadHex = bytesToHex(serializePayloadBytes(payload));
  const cacheKey = `${stacksApiBaseUrl}:${payloadHex}`;
  const now = Date.now();
  const cached = feeEstimateCache.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached.fee;

  try {
    const estimations = await fetchFeeEstimateTransaction({
      payload: payloadHex,
      network: "mainnet",
      client: { baseUrl: stacksApiBaseUrl, fetch: window.fetch.bind(window) },
    });
    const fee = Number(estimations[1]?.fee ?? estimations[0]?.fee ?? 0);
    if (!Number.isFinite(fee) || fee <= 0) return null;
    feeEstimateCache.set(cacheKey, { fee, expiresAt: now + 60_000 });
    return fee;
  } catch {
    return null;
  }
};

export const estimateNextNonce = async ({
  stacksApiBaseUrl,
  stxAddress,
}: {
  stacksApiBaseUrl: string;
  stxAddress: string;
}): Promise<number | null> => {
  if (typeof window === "undefined") return null;
  const address = (stxAddress ?? "").trim();
  if (!address) return null;

  try {
    const nonce = await fetchNonce({
      address,
      network: "mainnet",
      client: { baseUrl: stacksApiBaseUrl, fetch: window.fetch.bind(window) },
    });
    const value = Number(nonce);
    if (!Number.isFinite(value) || value < 0) return null;
    return value;
  } catch {
    return null;
  }
};

export const readValue = (event?: { currentTarget?: { value?: string } }) =>
  event?.currentTarget?.value ?? "";

export const readChecked = (event?: { currentTarget?: { checked?: boolean } }) =>
  event?.currentTarget?.checked ?? false;
