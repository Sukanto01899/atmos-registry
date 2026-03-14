import { DatasetFilters, SortMode } from "./type";

export const SORT_MODES = [
  "quality-desc",
  "recent-desc",
  "recent-asc",
  "altitude-desc",
  "status-priority",
] as const;

// export type SortMode = (typeof SORT_MODES)[number];

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

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

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

  return {
    activeTab: tab === "mine" ? "mine" : "explore",
    filters: {
      search: params.get("search") ?? "",
      status: params.get("status") ?? "all",
      visibility:
        visibility === "public" || visibility === "private"
          ? (visibility as "public" | "private")
          : "all",
      dataType: params.get("type") ?? "all",
      owner: params.get("owner") ?? "",
      altitudeMin: params.get("amin") ?? "",
      altitudeMax: params.get("amax") ?? "",
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

export const CONTRACT_ADDRESS = "SP1K2XGT5RNGT42N49BH936VDF8NXWNZJY15BPV4F";
export const CONTRACT_NAME = "atmos-v3";

// Dataset structure represents the core metadata about each dataset stored on-chain. In a real application, you would likely want to fetch and store additional metadata about datasets, such as data quality metrics, usage statistics, or user-generated tags and reviews. For this example, we focus on the core metadata stored on-chain for simplicity.
export type Dataset = {
  id: number;
  name: string;
  description: string;
  dataType: string;
  collectionDate: number;
  altitudeMin: number;
  altitudeMax: number;
  latitude: number;
  longitude: number;
  ipfsHash: string;
  isPublic: boolean;
  metadataFrozen: boolean;
  verified: boolean;
  verifiedBy: string;
  verifiedAt: number;
  createdAt: number;
  owner: string;
  status: string;
};
