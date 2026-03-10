import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { AppConfig, UserSession } from "@stacks/auth";
import {
  DEFAULT_PROVIDERS,
  showConnect,
  openContractCall,
  disconnect as clearSelectedProvider,
} from "@stacks/connect";
import { defineCustomElements } from "@stacks/connect-ui/loader";
import { STACKS_MAINNET, createNetwork } from "@stacks/network";
import {
  boolCV,
  cvToJSON,
  fetchCallReadOnlyFunction,
  intCV,
  principalCV,
  stringAsciiCV,
  stringUtf8CV,
  uintCV,
} from "@stacks/transactions";

const CONTRACT_ADDRESS = "SP1K2XGT5RNGT42N49BH936VDF8NXWNZJY15BPV4F";
const CONTRACT_NAME = "atmos-v3";
const TOKEN_CONTRACT_NAME = "atmos-token-v3";
const STAKING_CONTRACT_NAME = "atmos-staking-v1";
const SAVED_VIEWS_KEY = "atmos.saved-views.v1";
const network = createNetwork(STACKS_MAINNET);
const appConfig = new AppConfig(["store_write", "publish_data"]);
const userSession = new UserSession({ appConfig });

// Define the structure for a dataset
type Dataset = {
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

// In a production application, you would likely want to fetch and store additional metadata about datasets, such as data quality metrics, usage statistics, or user-generated tags and reviews. For this example, we focus on the core metadata stored on-chain for simplicity.
type RegisterFormState = {
  name: string;
  description: string;
  dataType: string;
  collectionDate: string;
  altitudeMin: string;
  altitudeMax: string;
  latitude: string;
  longitude: string;
  ipfsHash: string;
  isPublic: boolean;
};

// Define the structure for dataset filters
type DatasetFilters = {
  search: string;
  status: string;
  visibility: "all" | "public" | "private";
  dataType: string;
  owner: string;
  altitudeMin: string;
  altitudeMax: string;
};

// Sort modes determine the ordering of datasets in the explore and mine tabs. In a real application, you might want to support more complex sorting options and allow users to customize their default sort mode.
type SortMode =
  | "quality-desc"
  | "recent-desc"
  | "recent-asc"
  | "altitude-desc"
  | "status-priority";

type VersionStatus = "draft" | "pending" | "approved" | "rejected";

// In a real application, version records would likely be stored in a backend or indexed on-chain with more robust querying. For this example, we keep them in local state keyed by dataset ID for simplicity.
type VersionRecord = {
  id: string;
  datasetId: number;
  version: number;
  source: "onchain" | "local";
  status: VersionStatus;
  name: string;
  description: string;
  ipfsHash: string;
  isPublic: boolean;
  createdAt: number;
  submittedAt?: number;
  reviewedAt?: number;
  reviewer?: string;
};

// For simplicity, this example only supports a single draft version per dataset in local state. In a production app, you would likely want to support multiple drafts and persist them in local storage or a backend.
type VersionDraft = {
  description: string;
  ipfsHash: string;
  isPublic: boolean;
};

// Alert system is designed to surface important updates about datasets that users are interested in, such as verification status changes or metadata freezes. In a real application, you would likely want to persist read/dismissed state and support more complex alert types and delivery mechanisms.
type AlertLevel = "critical" | "warning" | "info";

// In this example, alerts are generated client-side based on dataset status and user watchlist. In a production application, you might want to generate and store alerts server-side or on-chain for more reliability and to support notifications outside of the app.
type AlertItem = {
  id: string;
  datasetId: number;
  kind: "verified" | "rejected" | "frozen" | "pending";
  title: string;
  message: string;
  level: AlertLevel;
  timestamp: number;
};

// Saved views allow users to capture the current state of their filters, sorting, and other view options for easy access later. In a real application, you would likely want to persist these in local storage or a backend and support more complex view configurations.
type SavedView = {
  id: string;
  name: string;
  createdAt: number;
  payload: {
    activeTab: "explore" | "mine";
    filters: DatasetFilters;
    geoTimePercent: number;
    compareSelectionIds: string[];
    watchlistOnly: boolean;
    watchlistIds: string[];
    mutedAlertKinds: string[];
  };
};

// Command palette actions are defined client-side for quick access to common actions and navigation. In a production app, you might want to support more dynamic command registration and more complex command payloads.
type CommandAction = {
  id: string;
  label: string;
  detail: string;
  run: () => void;
};

// Story chapters are designed to guide users through interesting insights and narratives in the dataset collection. In a real application, you might want to support more complex chapter content, multimedia integration, and persistence of user progress.
type StoryChapter = {
  id: string;
  title: string;
  body: string;
  datasetId?: number;
};

// TokenSnapshot represents the current state of the ATMOS token, including total supply, total staked, APY, and the user's balance and pending rewards. In a production application, you would likely want to fetch this data from a reliable on-chain source or backend API and update it in real-time.
type StakeInfo = {
  amount: number;
  lastClaimBlock: number;
  totalClaimed: number;
};

// In a production application, you would likely want to fetch and display additional token metrics such as historical price, staking history, and more detailed breakdowns of rewards and penalties. For this example, we focus on the core metrics relevant to staking and governance participation for simplicity.
type TokenSnapshot = {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  totalStaked: number;
  apyBps: number;
  balance: number;
  pendingReward: number;
  stakeInfo: StakeInfo;
};

// Default form state for dataset registration
const defaultRegisterForm: RegisterFormState = {
  name: "Demo Stratosphere Scan",
  description: "Sample atmospheric dataset for UI testing.",
  dataType: "atmospheric",
  collectionDate: "1704067200",
  altitudeMin: "1000",
  altitudeMax: "5000",
  latitude: "37.7749",
  longitude: "-122.4194",
  ipfsHash: "QmTestHash123",
  isPublic: true,
};

// Default providers for wallet connection. In a production app, you would likely want to dynamically detect available providers and support more options.
const unwrapResponseOk = (cv: unknown) => {
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

// Parses a tuple response from the get-dataset read-only function into a Dataset object. Handles both tuple and non-tuple response formats for compatibility with different contract versions.
const parseTuple = (tuple: any, id: number): Dataset | null => {
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

// Utility functions for formatting and deriving dataset properties for display purposes. In a real application, you might want to use more robust libraries for date formatting, geospatial calculations, and other utilities.
const formatCoord = (value: number) => (value / 1_000_000).toFixed(3);

// For collectionDate values, if the value is larger than a certain threshold, we assume it's a Unix timestamp and format it as a date. Otherwise, we treat it as a block number. This is to maintain compatibility with different contract versions that may have used different formats for this field.
const formatChainValue = (value: number) => {
  if (!value) return "n/a";
  if (value > 1_000_000_000) {
    return new Date(value * 1000).toLocaleString();
  }
  return `Block ${value}`;
};

// Status classes can be used to apply different styles based on dataset status. In a production app, you would likely want to use a more robust styling solution and support more status types.
const getStatusClass = (status: string) => {
  if (status === "verified") return "status--verified";
  if (status === "rejected") return "status--rejected";
  if (status === "pending") return "status--pending";
  if (status === "deprecated") return "status--deprecated";
  return "status--active";
};

// Quality score is a simple heuristic based on the presence of certain attributes. In a real application, you would likely want to use a more sophisticated algorithm that takes into account various factors such as data quality metrics, user feedback, and other relevant metadata.
const getQualityScore = (dataset: Dataset) =>
  (dataset.verified ? 45 : 0) +
  (dataset.ipfsHash ? 30 : 0) +
  (dataset.metadataFrozen ? 15 : 0) +
  (dataset.isPublic ? 10 : 0);

// Status priority is used for sorting datasets by their status in a meaningful way. In a production app, you might want to support more complex status hierarchies and allow users to customize the priority order.
const getStatusPriority = (status: string) => {
  if (status === "verified") return 4;
  if (status === "pending") return 3;
  if (status === "active") return 2;
  if (status === "deprecated") return 1;
  return 0;
};

// Version status is derived from the dataset status and verification state. In a real application, you would likely want to have a more robust versioning system with explicit version records stored on-chain or in a backend, rather than deriving version status from the dataset record.
const getVersionStatusClass = (status: VersionStatus) => {
  if (status === "approved") return "status--verified";
  if (status === "rejected") return "status--rejected";
  if (status === "pending") return "status--pending";
  return "status--active";
};

// In this example, we derive version status directly from the dataset's overall status and verification state for simplicity. In a production application, you would likely want to have explicit version records with their own statuses that can differ from the dataset's overall status, especially if you support multiple versions and more complex review workflows.
const mapDatasetToVersionStatus = (dataset: Dataset): VersionStatus => {
  if (dataset.status === "rejected") return "rejected";
  if (dataset.status === "pending") return "pending";
  if (dataset.verified || dataset.status === "verified") return "approved";
  return "approved";
};
const nowUnix = () => Math.floor(Date.now() / 1000);
const MICRO_TOKEN = 1_000_000;

// Utility functions for formatting token amounts, percentages, and parsing values from user input. In a production app, you would likely want to use a library like bignumber.js for handling token amounts and more robust input parsing and validation.
const formatTokenAmount = (value: number, decimals = 6) =>
  (value / 10 ** decimals).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.min(decimals, 4),
  });

// APY is stored in basis points (bps) on-chain to avoid floating point issues, so we divide by 100 to get the percentage value. In a real application, you would likely want to fetch the current APY from a reliable source and update it in real-time to provide accurate information to users.
const formatPercentFromBps = (bps: number) =>
  `${(bps / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}%`;

// Parsing functions for converting raw values from read-only contract calls into structured data. In a production application, you would likely want to have more robust parsing and error handling, especially if the contract data structures are complex or subject to change.
const parseUInt = (value: any) =>
  Number.parseInt(String(value?.value ?? value ?? "0"), 10);
const parseStakeInfo = (value: any): StakeInfo => {
  const tuple = value?.value ?? {};
  return {
    amount: parseUInt(tuple.amount),
    lastClaimBlock: parseUInt(tuple["last-claim-block"]),
    totalClaimed: parseUInt(tuple["total-claimed"]),
  };
};

// Utility functions for handling user session and wallet connection. In a production app, you would likely want to support more robust session management, error handling, and support for multiple wallet providers.
const resetInvalidSession = () => {
  try {
    userSession.store?.deleteSessionData();
  } catch {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("blockstack-session");
    }
  }
};

// Due to the way some wallet providers handle sessions, calling isUserSignedIn() can sometimes throw an error if the session data is corrupted or in an unexpected format. To prevent the entire app from crashing in this case, we wrap the call in a try-catch block and reset the session if an error occurs. This allows the app to recover gracefully and prompt the user to sign in again without losing access to the rest of the functionality.
const safeIsSignedIn = () => {
  try {
    return userSession.isUserSignedIn();
  } catch {
    resetInvalidSession();
    return false;
  }
};

// getUserAddress attempts to retrieve the user's Stacks address from their session data. If the user is not signed in or if there is an error accessing the session data, it returns an empty string. This function allows us to safely access the user's address without risking crashes due to session issues.
const getUserAddress = () => {
  if (!safeIsSignedIn()) {
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

// getAppIcon attempts to construct the URL for the app's icon based on the current window location. This is used as a fallback icon for the in-app wallet provider if no other provider icons are detected. If there is an error accessing the window object (e.g. during server-side rendering), it returns an empty string.
const getAppIcon = () => {
  try {
    return `${window.location.origin}/atmos-icon.svg`;
  } catch {
    return "";
  }
};

// getConnectProviders attempts to retrieve the list of available wallet providers based on the current window environment. If the window object is not available (e.g. during server-side rendering), it returns the default list of providers.
const getConnectProviders = () => {
  if (typeof window === "undefined") {
    return DEFAULT_PROVIDERS;
  }

  // Check for the presence of the Stacks provider
  const stacksProvider = (window as any).StacksProvider;
  if (!stacksProvider) {
    return DEFAULT_PROVIDERS;
  }

  // If any named providers are detected, we assume the user has their own wallet extension and return the default list of providers, which will allow them to choose their preferred wallet. If no named providers are detected, we include an in-app wallet provider as a fallback option to ensure users can still connect and interact with the app even if they don't have a wallet extension installed.
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

  // Create an in-app wallet provider as a fallback
  const inAppProvider = {
    id: "StacksProvider",
    name: "In-App Wallet",
    icon: fallbackIcon,
    webUrl: window.location.origin,
  };

  return [inAppProvider, ...DEFAULT_PROVIDERS];
};

const ensureConnectUi = async () => {
  if (typeof window === "undefined") {
    return false;
  }
  if (!window.customElements?.get("connect-modal")) {
    try {
      await defineCustomElements(window);
    } catch {
      return false;
    }
  }
  return Boolean(window.customElements?.get("connect-modal"));
};

const readValue = (
  event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
) => event.currentTarget?.value ?? "";

const readChecked = (event: ChangeEvent<HTMLInputElement>) =>
  event.currentTarget?.checked ?? false;

const defaultFilters: DatasetFilters = {
  search: "",
  status: "all",
  visibility: "all",
  dataType: "all",
  owner: "",
  altitudeMin: "",
  altitudeMax: "",
};

const defaultVersionDraft: VersionDraft = {
  description: "",
  ipfsHash: "",
  isPublic: true,
};

function App() {
  const [activeTab, setActiveTab] = useState<"explore" | "mine">("explore");
  const [datasetCount, setDatasetCount] = useState<number | null>(null);
  const [latestDatasets, setLatestDatasets] = useState<Dataset[]>([]);
  const [myDatasets, setMyDatasets] = useState<Dataset[]>([]);
  const [ownerInput, setOwnerInput] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");
  const [queryId, setQueryId] = useState("");
  const [queryResult, setQueryResult] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [, setWalletMessage] = useState("");
  const [txStatus, setTxStatus] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [lineageSelectionId, setLineageSelectionId] = useState("");
  const [geoTimePercent, setGeoTimePercent] = useState(100);
  const [selectedGeoDatasetId, setSelectedGeoDatasetId] = useState("");
  const [compareSelectionIds, setCompareSelectionIds] = useState<string[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [mutedAlertKinds, setMutedAlertKinds] = useState<string[]>([]);
  const [readAlertIds, setReadAlertIds] = useState<string[]>([]);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);
  const [watchlistOnly, setWatchlistOnly] = useState(false);
  const [watchlistInput, setWatchlistInput] = useState("");
  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [savedViewName, setSavedViewName] = useState("");
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showDatasetDetail, setShowDatasetDetail] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("quality-desc");
  const [storyStepIndex, setStoryStepIndex] = useState(0);
  const [storyPlaying, setStoryPlaying] = useState(false);
  const [filters, setFilters] = useState<DatasetFilters>(defaultFilters);
  const [versionStore, setVersionStore] = useState<
    Record<number, VersionRecord[]>
  >({});
  const [versionDraft, setVersionDraft] =
    useState<VersionDraft>(defaultVersionDraft);
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [versionMessage, setVersionMessage] = useState("");
  const [registerForm, setRegisterForm] =
    useState<RegisterFormState>(defaultRegisterForm);
  const [tokenSnapshot, setTokenSnapshot] = useState<TokenSnapshot | null>(
    null,
  );
  const [tokenLoading, setTokenLoading] = useState(false);
  const [stakeAmount, setStakeAmount] = useState("10");
  const [unstakeAmount, setUnstakeAmount] = useState("10");
  const [stakeStatus, setStakeStatus] = useState("");

  const stats = useMemo(
    () => [
      {
        label: "Total datasets on-chain",
        value:
          datasetCount === null ? "Loading..." : datasetCount.toLocaleString(),
        note: "Mainnet - Atmos",
      },
      {
        label: "Registry status",
        value: "Operational",
        note: "Anchored on Stacks",
      },
      {
        label: "Data coverage",
        value: "Global mesh",
        note: "Climate and Atmosphere",
      },
      {
        label: "ATMOS staked",
        value: tokenSnapshot
          ? `${formatTokenAmount(tokenSnapshot.totalStaked, tokenSnapshot.decimals)} ${tokenSnapshot.symbol}`
          : "Loading...",
        note: tokenSnapshot
          ? `${formatPercentFromBps(tokenSnapshot.apyBps)} APY`
          : "Stake pool",
      },
    ],
    [datasetCount, tokenSnapshot],
  );

  const senderAddress = walletAddress || ownerAddress || CONTRACT_ADDRESS;
  const activeDatasets = activeTab === "explore" ? latestDatasets : myDatasets;
  const dataTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          activeDatasets
            .map((dataset) => dataset.dataType.trim())
            .filter((type) => Boolean(type)),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [activeDatasets],
  );
  const filteredDatasets = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const owner = filters.owner.trim().toLowerCase();
    const min = Number.parseInt(filters.altitudeMin, 10);
    const max = Number.parseInt(filters.altitudeMax, 10);
    return activeDatasets.filter((dataset) => {
      if (search) {
        const haystack = [
          dataset.id,
          dataset.name,
          dataset.description,
          dataset.ipfsHash,
          dataset.dataType,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search)) {
          return false;
        }
      }
      if (filters.status !== "all" && dataset.status !== filters.status) {
        return false;
      }
      if (filters.visibility === "public" && !dataset.isPublic) {
        return false;
      }
      if (filters.visibility === "private" && dataset.isPublic) {
        return false;
      }
      if (filters.dataType !== "all" && dataset.dataType !== filters.dataType) {
        return false;
      }
      if (owner && !dataset.owner.toLowerCase().includes(owner)) {
        return false;
      }
      if (!Number.isNaN(min) && dataset.altitudeMin < min) {
        return false;
      }
      if (!Number.isNaN(max) && dataset.altitudeMax > max) {
        return false;
      }
      return true;
    });
  }, [activeDatasets, filters]);
  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.search ||
        (filters.status !== "all" && filters.status) ||
        (filters.visibility !== "all" && filters.visibility) ||
        (filters.dataType !== "all" && filters.dataType) ||
        filters.owner ||
        filters.altitudeMin ||
        filters.altitudeMax,
      ),
    [filters],
  );
  const geoTimeBounds = useMemo(() => {
    const timestamps = filteredDatasets
      .map((dataset) => dataset.collectionDate)
      .filter((value) => value > 0)
      .sort((a, b) => a - b);
    if (!timestamps.length) {
      return null;
    }
    return {
      min: timestamps[0],
      max: timestamps[timestamps.length - 1],
    };
  }, [filteredDatasets]);
  const geoTimeCutoff = useMemo(() => {
    if (!geoTimeBounds) {
      return null;
    }
    const span = geoTimeBounds.max - geoTimeBounds.min;
    return geoTimeBounds.min + Math.round((span * geoTimePercent) / 100);
  }, [geoTimeBounds, geoTimePercent]);
  const geoDatasets = useMemo(() => {
    if (!geoTimeCutoff) {
      return filteredDatasets;
    }
    return filteredDatasets.filter(
      (dataset) => dataset.collectionDate <= geoTimeCutoff,
    );
  }, [filteredDatasets, geoTimeCutoff]);
  const selectedGeoDataset = useMemo(
    () =>
      geoDatasets.find(
        (dataset) => dataset.id === Number.parseInt(selectedGeoDatasetId, 10),
      ) ??
      geoDatasets[0] ??
      null,
    [geoDatasets, selectedGeoDatasetId],
  );
  const compareDatasets = useMemo(() => {
    const byId = new Map(
      filteredDatasets.map((dataset) => [String(dataset.id), dataset]),
    );
    return compareSelectionIds
      .map((id) => byId.get(id))
      .filter((dataset): dataset is Dataset => Boolean(dataset));
  }, [compareSelectionIds, filteredDatasets]);
  const sortedDatasets = useMemo(() => {
    const next = [...filteredDatasets];
    next.sort((a, b) => {
      if (sortMode === "recent-desc") {
        return b.collectionDate - a.collectionDate;
      }
      if (sortMode === "recent-asc") {
        return a.collectionDate - b.collectionDate;
      }
      if (sortMode === "altitude-desc") {
        return b.altitudeMax - a.altitudeMax;
      }
      if (sortMode === "status-priority") {
        return getStatusPriority(b.status) - getStatusPriority(a.status);
      }
      return getQualityScore(b) - getQualityScore(a);
    });
    return next;
  }, [filteredDatasets, sortMode]);
  const datasetRankById = useMemo(() => {
    const rankMap = new Map<number, number>();
    sortedDatasets.forEach((dataset, index) => {
      rankMap.set(dataset.id, index + 1);
    });
    return rankMap;
  }, [sortedDatasets]);
  const myStakeInfo = tokenSnapshot?.stakeInfo ?? {
    amount: 0,
    lastClaimBlock: 0,
    totalClaimed: 0,
  };
  const stewardshipSignalByDatasetId = useMemo(() => {
    const signal = new Map<number, string>();
    if (!walletAddress || myStakeInfo.amount <= 0) {
      return signal;
    }
    const amountLabel = `${formatTokenAmount(myStakeInfo.amount)} ATMOS staked`;
    [...latestDatasets, ...myDatasets, ...(queryResult ? [queryResult] : [])]
      .filter((dataset): dataset is Dataset => Boolean(dataset))
      .forEach((dataset) => {
        if (dataset.owner === walletAddress) {
          signal.set(dataset.id, amountLabel);
        }
      });
    return signal;
  }, [
    latestDatasets,
    myDatasets,
    myStakeInfo.amount,
    queryResult,
    walletAddress,
  ]);
  const storyChapters = useMemo<StoryChapter[]>(() => {
    if (!sortedDatasets.length) {
      return [];
    }
    const highestQuality = [...sortedDatasets].sort(
      (a, b) => getQualityScore(b) - getQualityScore(a),
    )[0];
    const highestAltitude = [...sortedDatasets].sort(
      (a, b) => b.altitudeMax - a.altitudeMax,
    )[0];
    const recent = [...sortedDatasets].sort(
      (a, b) => b.collectionDate - a.collectionDate,
    )[0];
    const verifiedCount = sortedDatasets.filter(
      (dataset) => dataset.verified || dataset.status === "verified",
    ).length;
    const pendingCount = sortedDatasets.filter(
      (dataset) => dataset.status === "pending",
    ).length;

    return [
      {
        id: "chapter-coverage",
        title: "Coverage snapshot",
        body: `Current scope includes ${sortedDatasets.length} datasets across ${
          new Set(sortedDatasets.map((dataset) => dataset.dataType)).size
        } data types with ${verifiedCount} verified and ${pendingCount} pending.`,
      },
      {
        id: "chapter-quality",
        title: "Highest quality signal",
        body: `Dataset #${highestQuality.id} (${highestQuality.name}) leads quality ranking with ${getQualityScore(
          highestQuality,
        )}/100.`,
        datasetId: highestQuality.id,
      },
      {
        id: "chapter-altitude",
        title: "Altitude highlight",
        body: `Highest captured altitude in this view is ${highestAltitude.altitudeMax} m from dataset #${highestAltitude.id}.`,
        datasetId: highestAltitude.id,
      },
      {
        id: "chapter-recent",
        title: "Most recent collection",
        body: `Latest collection in this view is dataset #${recent.id} at ${formatChainValue(
          recent.collectionDate,
        )}.`,
        datasetId: recent.id,
      },
    ];
  }, [sortedDatasets]);
  const activeStoryChapter = useMemo(
    () => storyChapters[storyStepIndex] ?? null,
    [storyChapters, storyStepIndex],
  );
  const compareMetrics = useMemo(() => {
    const values = {
      status: compareDatasets.map((dataset) => dataset.status),
      visibility: compareDatasets.map((dataset) =>
        dataset.isPublic ? "Public" : "Private",
      ),
      collection: compareDatasets.map((dataset) =>
        formatChainValue(dataset.collectionDate),
      ),
      altitude: compareDatasets.map(
        (dataset) => `${dataset.altitudeMin}-${dataset.altitudeMax} m`,
      ),
      location: compareDatasets.map(
        (dataset) =>
          `${formatCoord(dataset.latitude)}, ${formatCoord(dataset.longitude)}`,
      ),
      owner: compareDatasets.map((dataset) => dataset.owner),
      quality: compareDatasets.map(
        (dataset) => `${getQualityScore(dataset)} / 100`,
      ),
    };
    const changed = (arr: string[]) => new Set(arr).size > 1;
    return {
      rows: [
        {
          label: "Status",
          key: "status",
          values: values.status,
          changed: changed(values.status),
        },
        {
          label: "Visibility",
          key: "visibility",
          values: values.visibility,
          changed: changed(values.visibility),
        },
        {
          label: "Collection",
          key: "collection",
          values: values.collection,
          changed: changed(values.collection),
        },
        {
          label: "Altitude",
          key: "altitude",
          values: values.altitude,
          changed: changed(values.altitude),
        },
        {
          label: "Location",
          key: "location",
          values: values.location,
          changed: changed(values.location),
        },
        {
          label: "Owner",
          key: "owner",
          values: values.owner,
          changed: changed(values.owner),
        },
        {
          label: "Quality",
          key: "quality",
          values: values.quality,
          changed: changed(values.quality),
        },
      ],
      best:
        compareDatasets.length === 0
          ? null
          : compareDatasets.reduce((best, current) =>
              getQualityScore(current) > getQualityScore(best) ? current : best,
            ),
    };
  }, [compareDatasets]);
  const alerts = useMemo(() => {
    const source = (() => {
      const deduped = new Map<number, Dataset>();
      [queryResult, ...latestDatasets, ...myDatasets].forEach((dataset) => {
        if (dataset && !deduped.has(dataset.id)) {
          deduped.set(dataset.id, dataset);
        }
      });
      return Array.from(deduped.values());
    })();
    const items: AlertItem[] = [];
    source.forEach((dataset) => {
      const watched =
        !watchlistOnly || watchlistIds.includes(String(dataset.id));
      if (!watched) return;
      if (dataset.verified || dataset.status === "verified") {
        items.push({
          id: `verified-${dataset.id}-${dataset.verifiedAt || dataset.createdAt}`,
          datasetId: dataset.id,
          kind: "verified",
          title: `Dataset #${dataset.id} verified`,
          message: `${dataset.name} is now verified.`,
          level: "info",
          timestamp: dataset.verifiedAt || dataset.createdAt,
        });
      }
      if (dataset.status === "rejected") {
        items.push({
          id: `rejected-${dataset.id}-${dataset.verifiedAt || dataset.createdAt}`,
          datasetId: dataset.id,
          kind: "rejected",
          title: `Dataset #${dataset.id} rejected`,
          message: `${dataset.name} was rejected by validator review.`,
          level: "critical",
          timestamp: dataset.verifiedAt || dataset.createdAt,
        });
      }
      if (dataset.metadataFrozen) {
        items.push({
          id: `frozen-${dataset.id}-${dataset.createdAt}`,
          datasetId: dataset.id,
          kind: "frozen",
          title: `Dataset #${dataset.id} metadata frozen`,
          message: `${dataset.name} metadata is now immutable.`,
          level: "warning",
          timestamp: dataset.createdAt,
        });
      }
      if (dataset.status === "pending") {
        items.push({
          id: `pending-${dataset.id}-${dataset.createdAt}`,
          datasetId: dataset.id,
          kind: "pending",
          title: `Dataset #${dataset.id} pending review`,
          message: `${dataset.name} is waiting validator approval.`,
          level: "info",
          timestamp: dataset.createdAt,
        });
      }
    });
    return items
      .filter((item) => !mutedAlertKinds.includes(item.kind))
      .filter((item) => !dismissedAlertIds.includes(item.id))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 30);
  }, [
    queryResult,
    latestDatasets,
    myDatasets,
    mutedAlertKinds,
    dismissedAlertIds,
    watchlistOnly,
    watchlistIds,
  ]);
  const unreadAlertCount = useMemo(
    () => alerts.filter((alert) => !readAlertIds.includes(alert.id)).length,
    [alerts, readAlertIds],
  );
  const lineageOptions = useMemo(() => {
    const deduped = new Map<number, Dataset>();
    [queryResult, ...latestDatasets, ...myDatasets].forEach((dataset) => {
      if (dataset && !deduped.has(dataset.id)) {
        deduped.set(dataset.id, dataset);
      }
    });
    return Array.from(deduped.values());
  }, [queryResult, latestDatasets, myDatasets]);
  const lineageDataset = useMemo(
    () =>
      lineageOptions.find(
        (dataset) => dataset.id === Number.parseInt(lineageSelectionId, 10),
      ) ??
      lineageOptions[0] ??
      null,
    [lineageOptions, lineageSelectionId],
  );
  const lineageFingerprint = useMemo(() => {
    if (!lineageDataset) return "";
    return [
      `ATM-${lineageDataset.id}`,
      `${lineageDataset.createdAt}`,
      `${lineageDataset.owner.slice(0, 6)}`,
      `${(lineageDataset.ipfsHash || "no-ipfs").slice(0, 8)}`,
    ].join("-");
  }, [lineageDataset]);
  const lineageEvents = useMemo(() => {
    if (!lineageDataset) return [];
    const events = [
      {
        title: "Record registered",
        detail: `Dataset #${lineageDataset.id} committed on-chain by owner.`,
        when: formatChainValue(lineageDataset.createdAt),
        actor: lineageDataset.owner,
      },
      {
        title: "Source metadata linked",
        detail: lineageDataset.ipfsHash
          ? `IPFS pointer attached: ${lineageDataset.ipfsHash}`
          : "No IPFS pointer attached for this dataset.",
        when: formatChainValue(lineageDataset.collectionDate),
        actor: lineageDataset.owner,
      },
      {
        title: "Current status snapshot",
        detail: `Record marked as ${lineageDataset.status}. Visibility: ${
          lineageDataset.isPublic ? "Public" : "Private"
        }.`,
        when: "Latest read",
        actor: CONTRACT_NAME,
      },
    ];
    if (lineageDataset.verified) {
      events.push({
        title: "Verification attested",
        detail: `Validator attested registry integrity for this dataset.`,
        when: formatChainValue(lineageDataset.verifiedAt),
        actor: lineageDataset.verifiedBy || "validator",
      });
    }
    if (lineageDataset.metadataFrozen) {
      events.push({
        title: "Metadata frozen",
        detail:
          "Mutable metadata updates disabled to preserve an immutable audit history.",
        when: "On-chain flag",
        actor: lineageDataset.owner,
      });
    }
    return events;
  }, [lineageDataset]);
  const versionTimeline = useMemo(() => {
    if (!lineageDataset) return [];
    const base: VersionRecord = {
      id: `onchain-${lineageDataset.id}`,
      datasetId: lineageDataset.id,
      version: 1,
      source: "onchain",
      status: mapDatasetToVersionStatus(lineageDataset),
      name: lineageDataset.name,
      description: lineageDataset.description,
      ipfsHash: lineageDataset.ipfsHash,
      isPublic: lineageDataset.isPublic,
      createdAt: lineageDataset.createdAt || lineageDataset.collectionDate,
      submittedAt: lineageDataset.createdAt || lineageDataset.collectionDate,
      reviewedAt: lineageDataset.verifiedAt || undefined,
      reviewer: lineageDataset.verifiedBy || undefined,
    };
    const local = versionStore[lineageDataset.id] ?? [];
    return [base, ...local].sort((a, b) => a.version - b.version);
  }, [lineageDataset, versionStore]);
  const selectedVersion = useMemo(
    () =>
      versionTimeline.find((record) => record.id === selectedVersionId) ??
      versionTimeline[versionTimeline.length - 1] ??
      null,
    [versionTimeline, selectedVersionId],
  );
  const previousVersion = useMemo(() => {
    if (!selectedVersion) return null;
    const index = versionTimeline.findIndex(
      (record) => record.id === selectedVersion.id,
    );
    if (index <= 0) return null;
    return versionTimeline[index - 1];
  }, [selectedVersion, versionTimeline]);
  const versionDiffs = useMemo(() => {
    if (!selectedVersion || !previousVersion) {
      return [];
    }
    const diffs: Array<{ field: string; from: string; to: string }> = [];
    if (selectedVersion.description !== previousVersion.description) {
      diffs.push({
        field: "Description",
        from: previousVersion.description || "n/a",
        to: selectedVersion.description || "n/a",
      });
    }
    if (selectedVersion.ipfsHash !== previousVersion.ipfsHash) {
      diffs.push({
        field: "IPFS hash",
        from: previousVersion.ipfsHash || "n/a",
        to: selectedVersion.ipfsHash || "n/a",
      });
    }
    if (selectedVersion.isPublic !== previousVersion.isPublic) {
      diffs.push({
        field: "Visibility",
        from: previousVersion.isPublic ? "Public" : "Private",
        to: selectedVersion.isPublic ? "Public" : "Private",
      });
    }
    return diffs;
  }, [selectedVersion, previousVersion]);
  const relatedDatasets = useMemo(() => {
    if (!lineageDataset) {
      return [];
    }
    return lineageOptions
      .filter((dataset) => dataset.id !== lineageDataset.id)
      .sort((a, b) => {
        const aScore =
          (a.owner === lineageDataset.owner ? 2 : 0) +
          (a.dataType === lineageDataset.dataType ? 1 : 0);
        const bScore =
          (b.owner === lineageDataset.owner ? 2 : 0) +
          (b.dataType === lineageDataset.dataType ? 1 : 0);
        return bScore - aScore || b.createdAt - a.createdAt;
      })
      .slice(0, 4);
  }, [lineageDataset, lineageOptions]);

  const updateRegisterField =
    (field: keyof RegisterFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.currentTarget.value;
      setRegisterForm((prev) => ({ ...prev, [field]: value }));
    };
  const updateFilterField =
    (field: keyof DatasetFilters) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = event.currentTarget.value;
      setFilters((prev) => ({ ...prev, [field]: value }));
    };
  const readContractValue = async (
    contractName: string,
    functionName: string,
    functionArgs: any[],
    sender = senderAddress,
  ) =>
    fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName,
      functionName,
      functionArgs,
      senderAddress: sender,
      network,
    });

  const fetchDataset = async (datasetId: number) => {
    const response = await readContractValue(CONTRACT_NAME, "get-dataset", [
      uintCV(datasetId),
    ]);
    const okValue = unwrapResponseOk(response);
    const dataset = parseTuple(okValue, datasetId);
    return dataset;
  };

  const loadTokenSnapshot = async (address?: string) => {
    setTokenLoading(true);
    try {
      const account = address || walletAddress || CONTRACT_ADDRESS;
      const [
        nameResponse,
        symbolResponse,
        decimalsResponse,
        totalSupplyResponse,
        totalStakedResponse,
        apyResponse,
        balanceResponse,
        pendingRewardResponse,
        stakeInfoResponse,
      ] = await Promise.all([
        readContractValue(TOKEN_CONTRACT_NAME, "get-name", [], account),
        readContractValue(TOKEN_CONTRACT_NAME, "get-symbol", [], account),
        readContractValue(TOKEN_CONTRACT_NAME, "get-decimals", [], account),
        readContractValue(TOKEN_CONTRACT_NAME, "get-total-supply", [], account),
        readContractValue(
          STAKING_CONTRACT_NAME,
          "get-total-staked",
          [],
          account,
        ),
        readContractValue(STAKING_CONTRACT_NAME, "get-apy-bps", [], account),
        readContractValue(
          TOKEN_CONTRACT_NAME,
          "get-balance",
          [principalCV(account)],
          account,
        ),
        readContractValue(
          STAKING_CONTRACT_NAME,
          "get-pending-reward",
          [principalCV(account)],
          account,
        ),
        readContractValue(
          STAKING_CONTRACT_NAME,
          "get-stake-info",
          [principalCV(account)],
          account,
        ),
      ]);

      setTokenSnapshot({
        name: String(unwrapResponseOk(nameResponse).value ?? "Atmos Token"),
        symbol: String(unwrapResponseOk(symbolResponse).value ?? "ATMOS"),
        decimals: parseUInt(unwrapResponseOk(decimalsResponse)),
        totalSupply: parseUInt(unwrapResponseOk(totalSupplyResponse)),
        totalStaked: parseUInt(unwrapResponseOk(totalStakedResponse)),
        apyBps: parseUInt(unwrapResponseOk(apyResponse)),
        balance: parseUInt(unwrapResponseOk(balanceResponse)),
        pendingReward: parseUInt(unwrapResponseOk(pendingRewardResponse)),
        stakeInfo: parseStakeInfo(cvToJSON(stakeInfoResponse as any)),
      });
    } catch {
      setTokenSnapshot(null);
    } finally {
      setTokenLoading(false);
    }
  };

  const loadLatest = async () => {
    setLoading(true);
    setStatusMessage("");
    try {
      const countResponse = await fetchCallReadOnlyFunction({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: "get-dataset-count",
        functionArgs: [],
        senderAddress: CONTRACT_ADDRESS,
        network,
      });
      const countValue = unwrapResponseOk(countResponse);
      const total = Number.parseInt(String(countValue.value ?? "0"), 10);
      setDatasetCount(total);

      if (total === 0) {
        setLatestDatasets([]);
        return;
      }
      const ids = Array.from(
        { length: Math.min(4, total) },
        (_, index) => total - index,
      );
      const results = await Promise.all(ids.map((id) => fetchDataset(id)));
      setLatestDatasets(
        results.filter((item): item is Dataset => Boolean(item)),
      );
    } catch (error) {
      setStatusMessage(
        "Unable to load datasets from mainnet. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadOwnerDatasets = async (address: string) => {
    setStatusMessage("");
    setLoading(true);
    try {
      const response = await fetchCallReadOnlyFunction({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: "get-datasets-by-owner",
        functionArgs: [principalCV(address)],
        senderAddress: address,
        network,
      });
      const json = cvToJSON(response as any) as any;
      const listValue = json.success === true ? json.value : json;
      const listType = listValue?.type ?? "";
      if (
        !(
          listType === "list" ||
          (typeof listType === "string" && listType.startsWith("(list"))
        )
      ) {
        setMyDatasets([]);
        return;
      }
      const ids: number[] = (listValue.value ?? []).map((item: any): number =>
        Number.parseInt(String(item.value ?? "0"), 10),
      );
      const limited = ids.slice(0, 8);
      const results = await Promise.all(
        limited.map((id: number) => fetchDataset(id)),
      );
      setMyDatasets(results.filter((item): item is Dataset => Boolean(item)));
    } catch (error) {
      setStatusMessage("Unable to load datasets for that address.");
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async () => {
    const parsed = Number.parseInt(queryId, 10);
    if (!parsed || parsed < 1) {
      setStatusMessage("Enter a valid dataset id.");
      return;
    }
    setQueryLoading(true);
    setStatusMessage("");
    try {
      const dataset = await fetchDataset(parsed);
      setQueryResult(dataset);
      if (dataset) {
        setLineageSelectionId(String(dataset.id));
      }
      if (!dataset) {
        setStatusMessage("Dataset not found.");
      }
    } catch (error) {
      setStatusMessage("Dataset not found.");
    } finally {
      setQueryLoading(false);
    }
  };

  const handleOwnerSubmit = () => {
    if (!ownerInput.trim()) {
      setStatusMessage("Paste a Stacks address to load your datasets.");
      return;
    }
    setOwnerAddress(ownerInput.trim());
    loadOwnerDatasets(ownerInput.trim());
  };

  const handleExportAuditTrail = () => {
    if (!lineageDataset || typeof window === "undefined") return;
    const lines = [
      "Atmos Dataset Audit Trail",
      `Dataset ID: ${lineageDataset.id}`,
      `Name: ${lineageDataset.name}`,
      `Owner: ${lineageDataset.owner}`,
      `Fingerprint: ${lineageFingerprint}`,
      "",
      "Timeline:",
      ...lineageEvents.map(
        (event, index) =>
          `${index + 1}. ${event.title} | ${event.when} | ${event.actor} | ${
            event.detail
          }`,
      ),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `atmos-audit-dataset-${lineageDataset.id}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const setLineageTarget = (datasetId: number) => {
    setLineageSelectionId(String(datasetId));
    if (typeof window !== "undefined") {
      document
        .getElementById("lineage-audit")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  const openDatasetDetail = (datasetId: number) => {
    setLineageSelectionId(String(datasetId));
    setShowDatasetDetail(true);
  };
  const setGeoTarget = (datasetId: number) => {
    setSelectedGeoDatasetId(String(datasetId));
    setLineageTarget(datasetId);
  };
  const toggleCompareDataset = (datasetId: number) => {
    const id = String(datasetId);
    setCompareSelectionIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };
  const exportComparison = () => {
    if (!compareDatasets.length || typeof window === "undefined") return;
    const payload = {
      generatedAt: new Date().toISOString(),
      compared: compareDatasets.map((dataset) => ({
        id: dataset.id,
        name: dataset.name,
        status: dataset.status,
        visibility: dataset.isPublic ? "Public" : "Private",
        collectionDate: dataset.collectionDate,
        altitudeMin: dataset.altitudeMin,
        altitudeMax: dataset.altitudeMax,
        latitude: dataset.latitude,
        longitude: dataset.longitude,
        owner: dataset.owner,
        ipfsHash: dataset.ipfsHash,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "atmos-dataset-comparison.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };
  const toggleWatchlistDataset = (datasetId: number) => {
    const id = String(datasetId);
    setWatchlistIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };
  const toggleAlertMute = (kind: AlertItem["kind"]) => {
    setMutedAlertKinds((prev) =>
      prev.includes(kind)
        ? prev.filter((item) => item !== kind)
        : [...prev, kind],
    );
  };
  const markAlertRead = (alertId: string) => {
    setReadAlertIds((prev) =>
      prev.includes(alertId) ? prev : [...prev, alertId],
    );
  };
  const applyWatchlistInput = () => {
    const parsed = watchlistInput
      .split(",")
      .map((item) => item.trim())
      .filter((item) => /^[0-9]+$/.test(item));
    setWatchlistIds(Array.from(new Set(parsed)));
  };
  const saveCurrentView = () => {
    const name = savedViewName.trim() || `View ${savedViews.length + 1}`;
    const next: SavedView = {
      id: `view-${Date.now()}`,
      name,
      createdAt: nowUnix(),
      payload: {
        activeTab,
        filters,
        geoTimePercent,
        compareSelectionIds,
        watchlistOnly,
        watchlistIds,
        mutedAlertKinds,
      },
    };
    setSavedViews((prev) => [next, ...prev].slice(0, 20));
    setSavedViewName("");
    setStatusMessage(`Saved view: ${name}`);
  };
  const applySavedView = (view: SavedView) => {
    setActiveTab(view.payload.activeTab);
    setFilters(view.payload.filters);
    setGeoTimePercent(Math.max(0, Math.min(100, view.payload.geoTimePercent)));
    setCompareSelectionIds(view.payload.compareSelectionIds);
    setWatchlistOnly(view.payload.watchlistOnly);
    setWatchlistIds(view.payload.watchlistIds);
    setMutedAlertKinds(view.payload.mutedAlertKinds);
    setStatusMessage(`Applied view: ${view.name}`);
  };
  const deleteSavedView = (viewId: string) => {
    setSavedViews((prev) => prev.filter((view) => view.id !== viewId));
  };
  const copyText = async (value: string, label: string) => {
    if (!value) {
      setStatusMessage(`${label} is empty.`);
      return;
    }
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else if (typeof window !== "undefined") {
        const area = document.createElement("textarea");
        area.value = value;
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
      }
      setStatusMessage(`${label} copied.`);
    } catch {
      setStatusMessage(`Unable to copy ${label.toLowerCase()}.`);
    }
  };
  const quickSaveCurrentView = () => {
    const fallbackName = `Quick View ${new Date().toLocaleTimeString()}`;
    const next: SavedView = {
      id: `view-${Date.now()}`,
      name: fallbackName,
      createdAt: nowUnix(),
      payload: {
        activeTab,
        filters,
        geoTimePercent,
        compareSelectionIds,
        watchlistOnly,
        watchlistIds,
        mutedAlertKinds,
      },
    };
    setSavedViews((prev) => [next, ...prev].slice(0, 20));
    setStatusMessage(`Saved view: ${fallbackName}`);
  };
  const executeCommand = (action: CommandAction) => {
    action.run();
    setShowCommandPalette(false);
    setCommandQuery("");
  };
  const handleCreateVersionDraft = () => {
    if (!lineageDataset) return;
    const existing = versionStore[lineageDataset.id] ?? [];
    const nextVersion = existing.length + 2;
    const record: VersionRecord = {
      id: `local-${lineageDataset.id}-${Date.now()}`,
      datasetId: lineageDataset.id,
      version: nextVersion,
      source: "local",
      status: "draft",
      name: lineageDataset.name,
      description: versionDraft.description.trim(),
      ipfsHash: versionDraft.ipfsHash.trim(),
      isPublic: versionDraft.isPublic,
      createdAt: nowUnix(),
    };
    setVersionStore((prev) => ({
      ...prev,
      [lineageDataset.id]: [...(prev[lineageDataset.id] ?? []), record],
    }));
    setSelectedVersionId(record.id);
    setVersionMessage(`Draft v${nextVersion} created.`);
  };
  const handleVersionTransition = (versionId: string, next: VersionStatus) => {
    if (!lineageDataset) return;
    const reviewer = walletAddress || "validator-demo";
    const timestamp = nowUnix();
    setVersionStore((prev) => {
      const records = prev[lineageDataset.id] ?? [];
      return {
        ...prev,
        [lineageDataset.id]: records.map((record) => {
          if (record.id !== versionId || record.source === "onchain") {
            return record;
          }
          if (record.status === "draft" && next === "pending") {
            return { ...record, status: "pending", submittedAt: timestamp };
          }
          if (
            record.status === "pending" &&
            (next === "approved" || next === "rejected")
          ) {
            return {
              ...record,
              status: next,
              reviewedAt: timestamp,
              reviewer,
            };
          }
          return record;
        }),
      };
    });
    setVersionMessage(`Version moved to ${next}.`);
  };

  const connectWallet = async () => {
    setWalletMessage("");
    if (!safeIsSignedIn()) {
      resetInvalidSession();
    }
    clearSelectedProvider();
    const uiReady = await ensureConnectUi();
    if (!uiReady) {
      setWalletMessage("Wallet UI failed to load. Refresh and try again.");
      return;
    }
    try {
      const defaultProviders = getConnectProviders();
      const connectOptions = {
        userSession,
        appDetails: {
          name: "Atmos Registry",
          icon: getAppIcon(),
        },
        redirectTo: "/redirect.html",
        manifestPath: "/manifest.json",
        defaultProviders,
        onFinish: () => {
          const address = getUserAddress();
          setWalletAddress(address);
          setWalletMessage(
            address
              ? "Wallet connected."
              : "Wallet connected, address unavailable.",
          );
          if (address) {
            setOwnerInput(address);
            loadTokenSnapshot(address);
          }
        },
        onCancel: () => {
          setWalletMessage("Wallet connection canceled.");
        },
      } as any;
      showConnect(connectOptions);
    } catch (error) {
      setWalletMessage(
        "Unable to open wallet connector. Check extension or browser popups.",
      );
    }
  };

  const disconnectWallet = () => {
    userSession.signUserOut(window.location.origin);
    setWalletAddress("");
    setWalletMessage("Wallet disconnected.");
    loadTokenSnapshot(CONTRACT_ADDRESS);
  };

  const handleRegisterSubmit = async () => {
    if (!walletAddress) {
      setWalletMessage("Connect your wallet to register a dataset.");
      return;
    }

    const collectionDate = Number.parseInt(registerForm.collectionDate, 10);
    const altitudeMin = Number.parseInt(registerForm.altitudeMin, 10);
    const altitudeMax = Number.parseInt(registerForm.altitudeMax, 10);
    const latitude = Math.round(
      Number.parseFloat(registerForm.latitude) * 1_000_000,
    );
    const longitude = Math.round(
      Number.parseFloat(registerForm.longitude) * 1_000_000,
    );

    if (
      !registerForm.name ||
      !registerForm.description ||
      !registerForm.dataType
    ) {
      setTxStatus("Name, description, and data type are required.");
      return;
    }
    if (
      Number.isNaN(collectionDate) ||
      Number.isNaN(altitudeMin) ||
      Number.isNaN(altitudeMax)
    ) {
      setTxStatus("Collection date and altitude values must be numbers.");
      return;
    }
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setTxStatus("Latitude and longitude must be numbers.");
      return;
    }
    if (altitudeMin < 0 || altitudeMax < altitudeMin) {
      setTxStatus(
        "Invalid altitude range. Minimum must be >= 0 and <= maximum.",
      );
      return;
    }
    if (
      latitude < -90_000_000 ||
      latitude > 90_000_000 ||
      longitude < -180_000_000 ||
      longitude > 180_000_000
    ) {
      setTxStatus("Latitude or longitude is out of bounds.");
      return;
    }

    setTxStatus("Opening wallet for transaction approval...");
    await openContractCall({
      network,
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "register-dataset",
      functionArgs: [
        stringUtf8CV(registerForm.name),
        stringUtf8CV(registerForm.description),
        stringUtf8CV(registerForm.dataType),
        uintCV(collectionDate),
        uintCV(altitudeMin),
        uintCV(altitudeMax),
        intCV(latitude),
        intCV(longitude),
        stringAsciiCV(registerForm.ipfsHash || ""),
        boolCV(registerForm.isPublic),
      ],
      postConditions: [],
      onFinish: (data) => {
        setTxStatus(`Transaction submitted: ${data.txId}`);
        loadLatest();
        setRegisterForm(defaultRegisterForm);
      },
      onCancel: () => {
        setTxStatus("Transaction canceled.");
      },
    });
  };

  const parseMicroTokenInput = (value: string) => {
    const amount = Number.parseFloat(value);
    if (!Number.isFinite(amount) || amount <= 0) {
      return null;
    }
    return Math.round(amount * MICRO_TOKEN);
  };

  const handleStakeAction = async (
    functionName: "stake" | "unstake",
    amountText: string,
  ) => {
    if (!walletAddress) {
      setStakeStatus("Connect your wallet to manage staking.");
      return;
    }
    const amount = parseMicroTokenInput(amountText);
    if (!amount) {
      setStakeStatus("Enter a valid ATMOS amount.");
      return;
    }
    setStakeStatus("Opening wallet for staking approval...");
    await openContractCall({
      network,
      contractAddress: CONTRACT_ADDRESS,
      contractName: STAKING_CONTRACT_NAME,
      functionName,
      functionArgs: [uintCV(amount)],
      postConditions: [],
      onFinish: (data) => {
        setStakeStatus(`Transaction submitted: ${data.txId}`);
        loadTokenSnapshot(walletAddress);
      },
      onCancel: () => {
        setStakeStatus("Transaction canceled.");
      },
    });
  };

  const handleClaimRewards = async () => {
    if (!walletAddress) {
      setStakeStatus("Connect your wallet to claim rewards.");
      return;
    }
    setStakeStatus("Opening wallet to claim rewards...");
    await openContractCall({
      network,
      contractAddress: CONTRACT_ADDRESS,
      contractName: STAKING_CONTRACT_NAME,
      functionName: "claim-rewards",
      functionArgs: [],
      postConditions: [],
      onFinish: (data) => {
        setStakeStatus(`Claim submitted: ${data.txId}`);
        loadTokenSnapshot(walletAddress);
      },
      onCancel: () => {
        setStakeStatus("Claim canceled.");
      },
    });
  };

  useEffect(() => {
    const hydrateSession = async () => {
      await ensureConnectUi();
      if (userSession.isSignInPending()) {
        try {
          await userSession.handlePendingSignIn();
        } catch (error) {
          setWalletMessage("Wallet sign-in failed. Try connecting again.");
        }
      }
      if (safeIsSignedIn()) {
        const address = getUserAddress();
        setWalletAddress(address);
        loadTokenSnapshot(address);
      }
    };

    hydrateSession();
    loadLatest();
    loadTokenSnapshot(CONTRACT_ADDRESS);
  }, []);
  useEffect(() => {
    loadTokenSnapshot(walletAddress || CONTRACT_ADDRESS);
  }, [walletAddress]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(SAVED_VIEWS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SavedView[];
      if (Array.isArray(parsed)) {
        setSavedViews(parsed.slice(0, 20));
      }
    } catch {
      // Ignore invalid saved view cache.
    }
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(savedViews));
  }, [savedViews]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
      if (event.key === "Escape") {
        setShowCommandPalette(false);
        setShowDatasetDetail(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!lineageOptions.length) {
      if (lineageSelectionId) {
        setLineageSelectionId("");
      }
      return;
    }
    const selectedId = Number.parseInt(lineageSelectionId, 10);
    const hasSelected = lineageOptions.some(
      (dataset) => dataset.id === selectedId,
    );
    if (!hasSelected) {
      setLineageSelectionId(String(lineageOptions[0].id));
    }
  }, [lineageOptions, lineageSelectionId]);
  useEffect(() => {
    if (!lineageDataset) {
      setVersionDraft(defaultVersionDraft);
      return;
    }
    setVersionDraft({
      description: lineageDataset.description,
      ipfsHash: lineageDataset.ipfsHash,
      isPublic: lineageDataset.isPublic,
    });
    setVersionMessage("");
  }, [lineageDataset?.id]);
  useEffect(() => {
    if (!versionTimeline.length) {
      if (selectedVersionId) {
        setSelectedVersionId("");
      }
      return;
    }
    const hasSelected = versionTimeline.some(
      (record) => record.id === selectedVersionId,
    );
    if (!hasSelected) {
      setSelectedVersionId(versionTimeline[versionTimeline.length - 1].id);
    }
  }, [selectedVersionId, versionTimeline]);
  useEffect(() => {
    if (!geoDatasets.length) {
      if (selectedGeoDatasetId) {
        setSelectedGeoDatasetId("");
      }
      return;
    }
    const hasSelected = geoDatasets.some(
      (dataset) => dataset.id === Number.parseInt(selectedGeoDatasetId, 10),
    );
    if (!hasSelected) {
      setSelectedGeoDatasetId(String(geoDatasets[0].id));
    }
  }, [geoDatasets, selectedGeoDatasetId]);
  useEffect(() => {
    const allowed = new Set(
      filteredDatasets.map((dataset) => String(dataset.id)),
    );
    setCompareSelectionIds((prev) => prev.filter((id) => allowed.has(id)));
  }, [filteredDatasets]);
  useEffect(() => {
    const allowed = new Set(
      lineageOptions.map((dataset) => String(dataset.id)),
    );
    setWatchlistIds((prev) => prev.filter((id) => allowed.has(id)));
  }, [lineageOptions]);
  useEffect(() => {
    if (!storyChapters.length) {
      setStoryStepIndex(0);
      setStoryPlaying(false);
      return;
    }
    if (storyStepIndex > storyChapters.length - 1) {
      setStoryStepIndex(0);
    }
  }, [storyChapters, storyStepIndex]);
  useEffect(() => {
    if (!storyPlaying || storyChapters.length <= 1) {
      return;
    }
    const timer = window.setInterval(() => {
      setStoryStepIndex((prev) => {
        const next = prev + 1;
        if (next >= storyChapters.length) {
          return 0;
        }
        return next;
      });
    }, 2600);
    return () => window.clearInterval(timer);
  }, [storyPlaying, storyChapters.length]);
  const commandActions: CommandAction[] = [
    {
      id: "sync-mainnet",
      label: "Sync Mainnet",
      detail: "Reload latest on-chain datasets",
      run: () => {
        loadLatest();
      },
    },
    {
      id: "tab-explore",
      label: "Switch to Explore",
      detail: "Show latest submissions tab",
      run: () => {
        setActiveTab("explore");
      },
    },
    {
      id: "tab-mine",
      label: "Switch to My Datasets",
      detail: "Show owner dataset tab",
      run: () => {
        setActiveTab("mine");
      },
    },
    {
      id: "reset-filters",
      label: "Reset Filters",
      detail: "Clear all dataset filters",
      run: () => {
        setFilters(defaultFilters);
      },
    },
    {
      id: "toggle-alerts",
      label: "Toggle Alert Center",
      detail: "Open or close Smart Alerts panel",
      run: () => {
        setShowAlerts((prev) => !prev);
      },
    },
    {
      id: "quick-save-view",
      label: "Quick Save Current View",
      detail: "Store current workspace settings",
      run: () => {
        quickSaveCurrentView();
      },
    },
    {
      id: "refresh-staking",
      label: "Refresh Staking",
      detail: "Reload ATMOS token and staking metrics",
      run: () => {
        loadTokenSnapshot(walletAddress || CONTRACT_ADDRESS);
      },
    },
    {
      id: "open-first-audit",
      label: "Open First Dataset in Audit",
      detail: "Jump to audit trail for the first filtered dataset",
      run: () => {
        if (filteredDatasets[0]) {
          setLineageTarget(filteredDatasets[0].id);
        }
      },
    },
    {
      id: "open-first-detail",
      label: "Open First Detail",
      detail: "Open the detail panel for the first filtered dataset",
      run: () => {
        if (filteredDatasets[0]) {
          openDatasetDetail(filteredDatasets[0].id);
        }
      },
    },
  ];
  const filteredCommandActions = commandActions.filter((action) => {
    const query = commandQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      action.label.toLowerCase().includes(query) ||
      action.detail.toLowerCase().includes(query)
    );
  });

  return (
    <div className="app">
      <div className="glow-layer" />
      <nav className="nav">
        <div className="nav__brand">
          <div className="logo-orb">A</div>
          <div>
            <div className="brand-title">Atmos Registry</div>
            <div className="brand-subtitle">Mainnet data mesh</div>
          </div>
        </div>
        <div className="nav__actions">
          <button
            className={`tab-btn ${activeTab === "explore" ? "active" : ""}`}
            onClick={() => setActiveTab("explore")}
          >
            Explore
          </button>
          <button
            className={`tab-btn ${activeTab === "mine" ? "active" : ""}`}
            onClick={() => setActiveTab("mine")}
          >
            My Datasets
          </button>
          <button className="ghost-btn" onClick={loadLatest} disabled={loading}>
            {loading ? "Syncing..." : "Sync Mainnet"}
          </button>
          <button
            className="ghost-btn alert-bell"
            type="button"
            onClick={() => setShowAlerts((prev) => !prev)}
          >
            Alerts
            <span
              className={`alert-count ${unreadAlertCount > 0 ? "active" : ""}`}
            >
              {unreadAlertCount}
            </span>
          </button>
          <button
            className="ghost-btn"
            type="button"
            onClick={() => setShowCommandPalette(true)}
          >
            Command
          </button>
          {walletAddress ? (
            <div className="wallet-chip">
              <span className="wallet-address">{walletAddress}</span>
              <button className="ghost-btn" onClick={disconnectWallet}>
                Disconnect
              </button>
            </div>
          ) : (
            <button className="primary-btn compact" onClick={connectWallet}>
              Connect Wallet
            </button>
          )}
        </div>
      </nav>

      {showCommandPalette && (
        <div
          className="command-overlay"
          onClick={() => setShowCommandPalette(false)}
        >
          <div
            className="command-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="command-head">
              <strong>Command Palette</strong>
              <span>Ctrl/Cmd + K</span>
            </div>
            <input
              className="command-search"
              autoFocus
              value={commandQuery}
              onChange={(event) => setCommandQuery(readValue(event))}
              placeholder="Search commands..."
            />
            <div className="command-list">
              {filteredCommandActions.length === 0 && (
                <div className="command-empty">
                  No commands matched your query.
                </div>
              )}
              {filteredCommandActions.map((action) => (
                <button
                  key={action.id}
                  className="command-item"
                  type="button"
                  onClick={() => executeCommand(action)}
                >
                  <span>{action.label}</span>
                  <small>{action.detail}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showDatasetDetail && lineageDataset && (
        <div
          className="detail-overlay"
          onClick={() => setShowDatasetDetail(false)}
        >
          <div
            className="detail-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="detail-head">
              <div>
                <div className="detail-eyebrow">
                  Dataset #{lineageDataset.id} detail
                </div>
                <h2>{lineageDataset.name}</h2>
                <p className="detail-subtitle">{lineageDataset.description}</p>
              </div>
              <button
                className="ghost-btn"
                type="button"
                onClick={() => setShowDatasetDetail(false)}
              >
                Close
              </button>
            </div>
            <div className="detail-summary">
              <span
                className={`status-pill ${getStatusClass(lineageDataset.status)}`}
              >
                {lineageDataset.status}
              </span>
              <span className="tag">{lineageDataset.dataType}</span>
              <span
                className={`tag ${lineageDataset.isPublic ? "tag--public" : "tag--private"}`}
              >
                {lineageDataset.isPublic ? "Public" : "Private"}
              </span>
              {lineageDataset.metadataFrozen && (
                <span className="tag tag--frozen">Frozen metadata</span>
              )}
            </div>
            <div className="detail-grid">
              <article className="detail-card">
                <div className="detail-card__title">Metadata</div>
                <div className="detail-meta-grid">
                  <div>
                    <span>Owner</span>
                    <strong>{lineageDataset.owner}</strong>
                  </div>
                  <div>
                    <span>Location</span>
                    <strong>
                      {formatCoord(lineageDataset.latitude)},{" "}
                      {formatCoord(lineageDataset.longitude)}
                    </strong>
                  </div>
                  <div>
                    <span>Altitude</span>
                    <strong>
                      {lineageDataset.altitudeMin}-{lineageDataset.altitudeMax}{" "}
                      m
                    </strong>
                  </div>
                  <div>
                    <span>Collected</span>
                    <strong>
                      {formatChainValue(lineageDataset.collectionDate)}
                    </strong>
                  </div>
                  <div>
                    <span>Recorded</span>
                    <strong>
                      {formatChainValue(lineageDataset.createdAt)}
                    </strong>
                  </div>
                  <div>
                    <span>IPFS</span>
                    <strong>{lineageDataset.ipfsHash || "n/a"}</strong>
                  </div>
                </div>
                <div className="detail-actions">
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() =>
                      copyText(String(lineageDataset.id), "Dataset ID")
                    }
                  >
                    Copy ID
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => copyText(lineageDataset.owner, "Owner")}
                  >
                    Copy owner
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() =>
                      copyText(lineageDataset.ipfsHash || "", "IPFS hash")
                    }
                  >
                    Copy IPFS
                  </button>
                </div>
              </article>
              <article className="detail-card">
                <div className="detail-card__title">Trust and provenance</div>
                <div className="detail-kpis">
                  <div>
                    <span>Quality score</span>
                    <strong>{getQualityScore(lineageDataset)}/100</strong>
                  </div>
                  <div>
                    <span>Fingerprint</span>
                    <strong>{lineageFingerprint}</strong>
                  </div>
                  <div>
                    <span>Verification</span>
                    <strong>
                      {lineageDataset.verified
                        ? `By ${lineageDataset.verifiedBy || "validator"}`
                        : "Awaiting or not verified"}
                    </strong>
                  </div>
                  <div>
                    <span>Stewardship</span>
                    <strong>
                      {stewardshipSignalByDatasetId.get(lineageDataset.id) ||
                        "No connected-owner stake signal"}
                    </strong>
                  </div>
                </div>
                <div className="detail-actions">
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => {
                      toggleWatchlistDataset(lineageDataset.id);
                    }}
                  >
                    {watchlistIds.includes(String(lineageDataset.id))
                      ? "Unwatch"
                      : "Watch dataset"}
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => toggleCompareDataset(lineageDataset.id)}
                  >
                    {compareSelectionIds.includes(String(lineageDataset.id))
                      ? "Remove compare"
                      : "Add to compare"}
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => setLineageTarget(lineageDataset.id)}
                  >
                    Open audit section
                  </button>
                </div>
              </article>
              <article className="detail-card detail-card--wide">
                <div className="detail-card__title">Lineage timeline</div>
                <div className="detail-timeline">
                  {lineageEvents.map((event) => (
                    <div
                      className="detail-timeline__item"
                      key={`${event.title}-${event.when}-${event.actor}`}
                    >
                      <div className="detail-timeline__dot" />
                      <div>
                        <strong>{event.title}</strong>
                        <div className="detail-timeline__meta">
                          {event.when} | {event.actor}
                        </div>
                        <p>{event.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
              <article className="detail-card">
                <div className="detail-card__title">Version history</div>
                <div className="detail-version-list">
                  {versionTimeline.map((record) => (
                    <button
                      key={record.id}
                      type="button"
                      className={`version-item ${selectedVersionId === record.id ? "active" : ""}`}
                      onClick={() => setSelectedVersionId(record.id)}
                    >
                      <div>
                        <strong>v{record.version}</strong>
                        <div className="version-source">{record.source}</div>
                      </div>
                      <span
                        className={`status-pill ${getVersionStatusClass(record.status)}`}
                      >
                        {record.status}
                      </span>
                    </button>
                  ))}
                </div>
                {selectedVersion && (
                  <div className="detail-version-summary">
                    <div>Selected: v{selectedVersion.version}</div>
                    <div>
                      Created: {formatChainValue(selectedVersion.createdAt)}
                    </div>
                    <div>Reviewer: {selectedVersion.reviewer || "n/a"}</div>
                  </div>
                )}
                {versionDiffs.length > 0 && (
                  <div className="diff-table">
                    {versionDiffs.map((diff) => (
                      <div key={diff.field} className="diff-row">
                        <div>{diff.field}</div>
                        <div>{diff.from}</div>
                        <div>{diff.to}</div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
              <article className="detail-card">
                <div className="detail-card__title">Related datasets</div>
                <div className="detail-related">
                  {relatedDatasets.length === 0 && (
                    <p className="dataset-description">
                      No nearby related datasets in the current local view.
                    </p>
                  )}
                  {relatedDatasets.map((dataset) => (
                    <button
                      key={`detail-related-${dataset.id}`}
                      type="button"
                      className="detail-related__item"
                      onClick={() => openDatasetDetail(dataset.id)}
                    >
                      <strong>
                        #{dataset.id} {dataset.name}
                      </strong>
                      <span>
                        {dataset.owner === lineageDataset.owner
                          ? "Same owner"
                          : dataset.dataType === lineageDataset.dataType
                            ? "Same type"
                            : "Recent neighbor"}
                      </span>
                    </button>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="container">
        <section className="hero">
          <div className="hero__content">
            <p className="eyebrow">Atmospheric data registry</p>
            <h1>Trusted climate signals, anchored on Stacks.</h1>
            <p className="hero__subtitle">
              Browse datasets, verify provenance, and register new records
              directly from the Atmos mainnet contract.
            </p>
            <div className="hero__actions">
              <button
                className="primary-btn"
                onClick={loadLatest}
                disabled={loading}
              >
                {loading ? "Fetching data..." : "Refresh on-chain data"}
              </button>
            </div>
          </div>
          <div className="hero__panel">
            <div className="panel-title">Lookup a dataset</div>
            <p className="panel-subtitle">
              Fetch a single dataset by id from the registry.
            </p>
            <div className="field-row">
              <input
                value={queryId}
                onChange={(event) => setQueryId(readValue(event))}
                placeholder="Dataset id (e.g. 12)"
              />
              <button
                className="primary-btn compact"
                onClick={handleLookup}
                disabled={queryLoading}
              >
                {queryLoading ? "Checking..." : "Lookup"}
              </button>
            </div>
            {queryResult && (
              <div className="mini-card">
                <div className="mini-title">{queryResult.name}</div>
                <div className="mini-meta">
                  <span>{queryResult.dataType}</span>
                  <span>{queryResult.status}</span>
                </div>
                <div className="mini-body">{queryResult.description}</div>
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={() => openDatasetDetail(queryResult.id)}
                >
                  Open detail
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Stats Grid */}
        <section className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-note">{stat.note}</div>
            </div>
          ))}
        </section>

        <section className="section stake-section">
          <div className="section-header">
            <div>
              <h2>ATMOS staking and trust layer</h2>
              <p>
                Monitor token economics and manage wallet staking directly from
                the registry.
              </p>
            </div>
          </div>
          <div className="stake-grid">
            <article className="stake-card stake-card--overview">
              <div className="stake-card__title">Protocol economics</div>
              <div className="stake-metrics">
                <div>
                  <span>Token</span>
                  <strong>
                    {tokenSnapshot
                      ? `${tokenSnapshot.name} (${tokenSnapshot.symbol})`
                      : "Loading..."}
                  </strong>
                </div>
                <div>
                  <span>Total supply</span>
                  <strong>
                    {tokenSnapshot
                      ? `${formatTokenAmount(tokenSnapshot.totalSupply, tokenSnapshot.decimals)} ${tokenSnapshot.symbol}`
                      : "Loading..."}
                  </strong>
                </div>
                <div>
                  <span>Total staked</span>
                  <strong>
                    {tokenSnapshot
                      ? `${formatTokenAmount(tokenSnapshot.totalStaked, tokenSnapshot.decimals)} ${tokenSnapshot.symbol}`
                      : "Loading..."}
                  </strong>
                </div>
                <div>
                  <span>Staking APY</span>
                  <strong>
                    {tokenSnapshot
                      ? formatPercentFromBps(tokenSnapshot.apyBps)
                      : "Loading..."}
                  </strong>
                </div>
              </div>
            </article>
            <article className="stake-card">
              <div className="stake-card__title">Wallet position</div>
              <p className="stake-card__subtitle">
                {walletAddress
                  ? "Use ATMOS to signal stewardship and earn rewards."
                  : "Connect a wallet to stake, unstake, and claim rewards."}
              </p>
              <div className="stake-metrics">
                <div>
                  <span>Wallet balance</span>
                  <strong>
                    {tokenSnapshot
                      ? `${formatTokenAmount(tokenSnapshot.balance, tokenSnapshot.decimals)} ${tokenSnapshot.symbol}`
                      : "Loading..."}
                  </strong>
                </div>
                <div>
                  <span>Currently staked</span>
                  <strong>
                    {tokenSnapshot
                      ? `${formatTokenAmount(myStakeInfo.amount, tokenSnapshot.decimals)} ${tokenSnapshot.symbol}`
                      : "Loading..."}
                  </strong>
                </div>
                <div>
                  <span>Pending reward</span>
                  <strong>
                    {tokenSnapshot
                      ? `${formatTokenAmount(tokenSnapshot.pendingReward, tokenSnapshot.decimals)} ${tokenSnapshot.symbol}`
                      : "Loading..."}
                  </strong>
                </div>
                <div>
                  <span>Total claimed</span>
                  <strong>
                    {tokenSnapshot
                      ? `${formatTokenAmount(myStakeInfo.totalClaimed, tokenSnapshot.decimals)} ${tokenSnapshot.symbol}`
                      : "Loading..."}
                  </strong>
                </div>
              </div>
              <div className="stake-actions-grid">
                <label className="stake-field">
                  <span>Stake ATMOS</span>
                  <div className="stake-inline">
                    <input
                      value={stakeAmount}
                      onChange={(event) => setStakeAmount(readValue(event))}
                      placeholder="10"
                    />
                    <button
                      className="primary-btn compact"
                      type="button"
                      onClick={() => handleStakeAction("stake", stakeAmount)}
                      disabled={!walletAddress || tokenLoading}
                    >
                      Stake
                    </button>
                  </div>
                </label>
                <label className="stake-field">
                  <span>Unstake ATMOS</span>
                  <div className="stake-inline">
                    <input
                      value={unstakeAmount}
                      onChange={(event) => setUnstakeAmount(readValue(event))}
                      placeholder="10"
                    />
                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={() =>
                        handleStakeAction("unstake", unstakeAmount)
                      }
                      disabled={!walletAddress || tokenLoading}
                    >
                      Unstake
                    </button>
                  </div>
                </label>
              </div>
              <div className="stake-footer">
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={handleClaimRewards}
                  disabled={
                    !walletAddress ||
                    tokenLoading ||
                    tokenSnapshot?.pendingReward === 0
                  }
                >
                  Claim rewards
                </button>
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={() =>
                    loadTokenSnapshot(walletAddress || CONTRACT_ADDRESS)
                  }
                  disabled={tokenLoading}
                >
                  {tokenLoading ? "Refreshing..." : "Refresh staking"}
                </button>
              </div>
              {stakeStatus && <div className="form-note">{stakeStatus}</div>}
            </article>
          </div>
        </section>

        {showAlerts && (
          <section className="section alert-section">
            <div className="section-header">
              <div>
                <h2>Smart alert center</h2>
                <p>
                  Track verification, rejection, freeze, and pending review
                  events.
                </p>
              </div>
              <div className="alert-controls">
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={() =>
                    setReadAlertIds(alerts.map((alert) => alert.id))
                  }
                  disabled={alerts.length === 0}
                >
                  Mark all read
                </button>
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={() =>
                    setDismissedAlertIds((prev) => [
                      ...new Set([...prev, ...alerts.map((alert) => alert.id)]),
                    ])
                  }
                  disabled={alerts.length === 0}
                >
                  Clear all
                </button>
              </div>
            </div>
            <div className="alert-filters">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={watchlistOnly}
                  onChange={(event) => setWatchlistOnly(readChecked(event))}
                />
                <span>Watchlist only</span>
              </label>
              <div className="alert-watchlist-input">
                <input
                  value={watchlistInput}
                  onChange={(event) => setWatchlistInput(readValue(event))}
                  placeholder="Watch dataset IDs (comma-separated)"
                />
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={applyWatchlistInput}
                >
                  Apply
                </button>
              </div>
              <div className="alert-mutes">
                {(["verified", "rejected", "frozen", "pending"] as const).map(
                  (kind) => (
                    <button
                      key={`mute-${kind}`}
                      className={`ghost-btn ${mutedAlertKinds.includes(kind) ? "active" : ""}`}
                      type="button"
                      onClick={() => toggleAlertMute(kind)}
                    >
                      {mutedAlertKinds.includes(kind)
                        ? `Unmute ${kind}`
                        : `Mute ${kind}`}
                    </button>
                  ),
                )}
              </div>
            </div>
            <div className="alert-list">
              {alerts.length === 0 && (
                <div className="dataset-card">
                  <div className="dataset-title">No alerts right now</div>
                  <p className="dataset-description">
                    Expand scope or unmute alert types to see more activity.
                  </p>
                </div>
              )}
              {alerts.map((alert) => {
                const isRead = readAlertIds.includes(alert.id);
                return (
                  <article
                    key={alert.id}
                    className={`alert-item ${isRead ? "read" : "unread"} alert-${alert.level}`}
                  >
                    <div className="alert-item__head">
                      <strong>{alert.title}</strong>
                      <span>{formatChainValue(alert.timestamp)}</span>
                    </div>
                    <p>{alert.message}</p>
                    <div className="alert-item__foot">
                      <span>Dataset #{alert.datasetId}</span>
                      <div className="alert-item__actions">
                        <button
                          className="ghost-btn"
                          type="button"
                          onClick={() => {
                            markAlertRead(alert.id);
                            setLineageTarget(alert.datasetId);
                          }}
                        >
                          Open
                        </button>
                        <button
                          className="ghost-btn"
                          type="button"
                          onClick={() =>
                            setDismissedAlertIds((prev) => [...prev, alert.id])
                          }
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <section className="section lineage-section" id="lineage-audit">
          <div className="section-header">
            <div>
              <h2>Verifiable lineage and audit trail</h2>
              <p>
                Trace dataset custody, validation, and integrity proofs from
                registry state.
              </p>
            </div>
            <div className="lineage-actions">
              {lineageOptions.length > 0 && (
                <label className="lineage-picker">
                  <span>Audit dataset</span>
                  <select
                    value={lineageSelectionId}
                    onChange={(event) =>
                      setLineageSelectionId(event.currentTarget.value)
                    }
                  >
                    {lineageOptions.map((dataset) => (
                      <option key={`lineage-${dataset.id}`} value={dataset.id}>
                        #{dataset.id} {dataset.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {lineageDataset && (
                <button
                  className="ghost-btn"
                  onClick={handleExportAuditTrail}
                  type="button"
                >
                  Export audit trail
                </button>
              )}
            </div>
          </div>
          {!lineageDataset ? (
            <div className="dataset-card">
              <div className="dataset-title">No dataset selected for audit</div>
              <p className="dataset-description">
                Use Lookup or load datasets to generate a full lineage timeline.
              </p>
            </div>
          ) : (
            <div className="lineage-grid">
              <article className="lineage-proof">
                <span className="proof-label">Proof badge</span>
                <h3>{lineageDataset.name}</h3>
                <p className="lineage-proof__meta">
                  Dataset #{lineageDataset.id} | {lineageDataset.status}
                </p>
                <div className="proof-fingerprint">{lineageFingerprint}</div>
                <p className="lineage-proof__note">
                  Fingerprint is derived from on-chain identity fields for quick
                  human verification.
                </p>
              </article>
              <article className="lineage-timeline">
                {lineageEvents.map((event) => (
                  <div
                    className="lineage-event"
                    key={`${event.title}-${event.when}-${event.actor}`}
                  >
                    <div className="lineage-event__dot" />
                    <div className="lineage-event__content">
                      <div className="lineage-event__title">{event.title}</div>
                      <div className="lineage-event__meta">
                        {event.when} | {event.actor}
                      </div>
                      <p>{event.detail}</p>
                    </div>
                  </div>
                ))}
              </article>
            </div>
          )}
        </section>

        <section className="section version-section" id="version-workflow">
          <div className="section-header">
            <div>
              <h2>Dataset versioning and approval workflow</h2>
              <p>
                Create new dataset revisions, submit for review, and track
                approval outcomes with per-version diffs.
              </p>
            </div>
          </div>
          {!lineageDataset ? (
            <div className="dataset-card">
              <div className="dataset-title">
                No dataset selected for versioning
              </div>
              <p className="dataset-description">
                Select a dataset from audit controls to start a revision
                workflow.
              </p>
            </div>
          ) : (
            <div className="version-grid">
              <article className="version-card">
                <div className="version-card__title">Create draft revision</div>
                <p className="version-card__subtitle">
                  Base dataset #{lineageDataset.id} ({lineageDataset.name})
                </p>
                <div className="field-grid">
                  <textarea
                    rows={4}
                    value={versionDraft.description}
                    onChange={(event) =>
                      setVersionDraft((prev) => ({
                        ...prev,
                        description: readValue(event),
                      }))
                    }
                    placeholder="Updated description for this revision"
                  />
                  <input
                    value={versionDraft.ipfsHash}
                    onChange={(event) =>
                      setVersionDraft((prev) => ({
                        ...prev,
                        ipfsHash: readValue(event),
                      }))
                    }
                    placeholder="Updated IPFS hash"
                  />
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={versionDraft.isPublic}
                      onChange={(event) =>
                        setVersionDraft((prev) => ({
                          ...prev,
                          isPublic: readChecked(event),
                        }))
                      }
                    />
                    <span>Keep revision public</span>
                  </label>
                </div>
                <div className="version-actions">
                  <button
                    className="primary-btn compact"
                    type="button"
                    onClick={handleCreateVersionDraft}
                  >
                    Create draft version
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() =>
                      setVersionDraft({
                        description: lineageDataset.description,
                        ipfsHash: lineageDataset.ipfsHash,
                        isPublic: lineageDataset.isPublic,
                      })
                    }
                  >
                    Reset draft
                  </button>
                </div>
                {versionMessage && (
                  <div className="form-note">{versionMessage}</div>
                )}
              </article>

              <article className="version-card">
                <div className="version-card__title">Version timeline</div>
                <div className="version-list">
                  {versionTimeline.map((record) => (
                    <button
                      key={record.id}
                      className={`version-item ${
                        selectedVersion?.id === record.id ? "active" : ""
                      }`}
                      type="button"
                      onClick={() => setSelectedVersionId(record.id)}
                    >
                      <div>
                        <strong>v{record.version}</strong>{" "}
                        <span className="version-source">{record.source}</span>
                      </div>
                      <span
                        className={`status-pill ${getVersionStatusClass(record.status)}`}
                      >
                        {record.status}
                      </span>
                    </button>
                  ))}
                </div>
                {selectedVersion && selectedVersion.source === "local" && (
                  <div className="version-actions">
                    {selectedVersion.status === "draft" && (
                      <button
                        className="ghost-btn"
                        type="button"
                        onClick={() =>
                          handleVersionTransition(selectedVersion.id, "pending")
                        }
                      >
                        Submit for review
                      </button>
                    )}
                    {selectedVersion.status === "pending" && (
                      <>
                        <button
                          className="ghost-btn"
                          type="button"
                          onClick={() =>
                            handleVersionTransition(
                              selectedVersion.id,
                              "approved",
                            )
                          }
                        >
                          Approve
                        </button>
                        <button
                          className="ghost-btn"
                          type="button"
                          onClick={() =>
                            handleVersionTransition(
                              selectedVersion.id,
                              "rejected",
                            )
                          }
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                )}
              </article>

              <article className="version-card version-card--full">
                <div className="version-card__title">Version diff view</div>
                {!selectedVersion ? (
                  <p className="dataset-description">No version selected.</p>
                ) : (
                  <div className="version-diff">
                    <div className="version-summary">
                      <span>Selected: v{selectedVersion.version}</span>
                      <span>
                        Created: {formatChainValue(selectedVersion.createdAt)}
                      </span>
                      {selectedVersion.reviewer && (
                        <span>Reviewer: {selectedVersion.reviewer}</span>
                      )}
                    </div>
                    {!previousVersion && (
                      <p className="dataset-description">
                        v{selectedVersion.version} is the initial baseline
                        version.
                      </p>
                    )}
                    {previousVersion && versionDiffs.length === 0 && (
                      <p className="dataset-description">
                        No field-level differences from v
                        {previousVersion.version}.
                      </p>
                    )}
                    {previousVersion && versionDiffs.length > 0 && (
                      <div className="diff-table">
                        {versionDiffs.map((diff) => (
                          <div
                            className="diff-row"
                            key={`${selectedVersion.id}-${diff.field}`}
                          >
                            <div>{diff.field}</div>
                            <div>{diff.from}</div>
                            <div>{diff.to}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </article>
            </div>
          )}
        </section>

        {statusMessage && <div className="status-banner">{statusMessage}</div>}

        <section className="section">
          <div className="section-header">
            <div>
              <h2>Register a dataset</h2>
              <p>Submit a new dataset to the Atmos mainnet registry.</p>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-card">
              <div className="field-grid">
                <input
                  value={registerForm.name}
                  onChange={updateRegisterField("name")}
                  placeholder="Dataset name"
                />
                <input
                  value={registerForm.dataType}
                  onChange={updateRegisterField("dataType")}
                  placeholder="Data type"
                />
                <textarea
                  value={registerForm.description}
                  onChange={updateRegisterField("description")}
                  placeholder="Short description"
                  rows={4}
                />
                <div className="field-row">
                  <input
                    value={registerForm.collectionDate}
                    onChange={updateRegisterField("collectionDate")}
                    placeholder="Collection date (unix or block height)"
                  />
                  <input
                    value={registerForm.ipfsHash}
                    onChange={updateRegisterField("ipfsHash")}
                    placeholder="IPFS hash"
                  />
                </div>
                <div className="field-row">
                  <input
                    value={registerForm.altitudeMin}
                    onChange={updateRegisterField("altitudeMin")}
                    placeholder="Altitude min (m)"
                  />
                  <input
                    value={registerForm.altitudeMax}
                    onChange={updateRegisterField("altitudeMax")}
                    placeholder="Altitude max (m)"
                  />
                </div>
                <div className="field-row">
                  <input
                    value={registerForm.latitude}
                    onChange={updateRegisterField("latitude")}
                    placeholder="Latitude (deg)"
                  />
                  <input
                    value={registerForm.longitude}
                    onChange={updateRegisterField("longitude")}
                    placeholder="Longitude (deg)"
                  />
                </div>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={registerForm.isPublic}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        isPublic: readChecked(event),
                      }))
                    }
                  />
                  <span>Mark dataset as public</span>
                </label>
              </div>
              <div className="form-actions">
                <button className="primary-btn" onClick={handleRegisterSubmit}>
                  Submit dataset
                </button>
                {txStatus && <div className="form-note">{txStatus}</div>}
              </div>
            </div>
            <div className="form-card form-card--info">
              <h3>Registry requirements</h3>
              <ul>
                <li>Latitude and longitude are stored in micro-degrees.</li>
                <li>Altitude range must be positive and ordered.</li>
                <li>Metadata can be frozen later by the dataset owner.</li>
                <li>IPFS hash is optional but recommended.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <div>
              <h2>
                {activeTab === "explore"
                  ? "Latest submissions"
                  : "Your datasets"}
              </h2>
              <p>
                {activeTab === "explore"
                  ? "The most recent records pushed to Atmos on mainnet."
                  : "Load datasets indexed to a specific Stacks address."}
              </p>
            </div>
            {activeTab === "mine" && (
              <div className="owner-form">
                <input
                  value={ownerInput}
                  onChange={(event) => setOwnerInput(readValue(event))}
                  placeholder="Paste your Stacks address"
                />
                <button
                  className="primary-btn compact"
                  onClick={handleOwnerSubmit}
                  disabled={loading}
                >
                  Load
                </button>
                {walletAddress && (
                  <button
                    className="ghost-btn"
                    onClick={() => {
                      setOwnerInput(walletAddress);
                      setOwnerAddress(walletAddress);
                      loadOwnerDatasets(walletAddress);
                    }}
                  >
                    Use wallet
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="saved-view-card">
            <div className="saved-view-head">
              <h3>Saved views</h3>
              <p>
                Save and restore your current filters, explorer state, compare
                picks, and watchlist setup.
              </p>
            </div>
            <div className="saved-view-create">
              <input
                value={savedViewName}
                onChange={(event) => setSavedViewName(readValue(event))}
                placeholder="View name (e.g. Verified Public Global)"
              />
              <button
                className="ghost-btn"
                type="button"
                onClick={saveCurrentView}
              >
                Save view
              </button>
            </div>
            <div className="saved-view-list">
              {savedViews.length === 0 && (
                <span className="saved-view-empty">No saved views yet.</span>
              )}
              {savedViews.map((view) => (
                <div className="saved-view-item" key={view.id}>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => applySavedView(view)}
                  >
                    {view.name}
                  </button>
                  <span>{formatChainValue(view.createdAt)}</span>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => deleteSavedView(view.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="filter-card">
            <div className="filter-grid">
              <input
                value={filters.search}
                onChange={updateFilterField("search")}
                placeholder="Search id, name, description, hash"
              />
              <select
                value={filters.status}
                onChange={updateFilterField("status")}
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="deprecated">Deprecated</option>
              </select>
              <select
                value={filters.visibility}
                onChange={updateFilterField("visibility")}
              >
                <option value="all">All visibility</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
              <select
                value={filters.dataType}
                onChange={updateFilterField("dataType")}
              >
                <option value="all">All data types</option>
                {dataTypeOptions.map((option) => (
                  <option key={`type-${option}`} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <input
                value={filters.owner}
                onChange={updateFilterField("owner")}
                placeholder="Owner contains..."
              />
              <div className="filter-range">
                <input
                  value={filters.altitudeMin}
                  onChange={updateFilterField("altitudeMin")}
                  placeholder="Altitude min"
                />
                <input
                  value={filters.altitudeMax}
                  onChange={updateFilterField("altitudeMax")}
                  placeholder="Altitude max"
                />
              </div>
            </div>
            <div className="filter-actions">
              <span>
                Showing {filteredDatasets.length} of {activeDatasets.length}
              </span>
              <div className="filter-sort">
                <label htmlFor="dataset-sort">Sort by</label>
                <select
                  id="dataset-sort"
                  value={sortMode}
                  onChange={(event) =>
                    setSortMode(event.currentTarget.value as SortMode)
                  }
                >
                  <option value="quality-desc">
                    Quality score (high to low)
                  </option>
                  <option value="recent-desc">Newest collection first</option>
                  <option value="recent-asc">Oldest collection first</option>
                  <option value="altitude-desc">Highest altitude first</option>
                  <option value="status-priority">Status priority</option>
                </select>
              </div>
              <button
                className="ghost-btn"
                type="button"
                onClick={() => setFilters(defaultFilters)}
                disabled={!hasActiveFilters}
              >
                Reset filters
              </button>
            </div>
          </div>
          <div className="geo-card">
            <div className="geo-header">
              <div>
                <h3>Geospatial explorer</h3>
                <p>
                  Plot datasets by coordinates and scrub collection time to
                  inspect spatial coverage changes.
                </p>
              </div>
              <div className="geo-summary">
                <span>
                  Visible points: {geoDatasets.length}/{filteredDatasets.length}
                </span>
                {geoTimeCutoff && (
                  <span>Cutoff: {formatChainValue(geoTimeCutoff)}</span>
                )}
              </div>
            </div>
            <div className="geo-timeline">
              <label htmlFor="geo-time-slider">Time window</label>
              <input
                id="geo-time-slider"
                type="range"
                min={0}
                max={100}
                value={geoTimePercent}
                onChange={(event) =>
                  setGeoTimePercent(Number.parseInt(readValue(event), 10) || 0)
                }
                disabled={!geoTimeBounds}
              />
              <span>{geoTimePercent}%</span>
            </div>
            <div className="geo-layout">
              <div className="geo-map">
                <div className="geo-map__grid" />
                {geoDatasets.map((dataset) => {
                  const left =
                    ((dataset.longitude / 1_000_000 + 180) / 360) * 100;
                  const top =
                    (1 - (dataset.latitude / 1_000_000 + 90) / 180) * 100;
                  return (
                    <button
                      key={`geo-${dataset.id}`}
                      className={`geo-point ${
                        selectedGeoDataset?.id === dataset.id ? "active" : ""
                      }`}
                      title={`#${dataset.id} ${dataset.name}`}
                      type="button"
                      style={{ left: `${left}%`, top: `${top}%` }}
                      onClick={() => setGeoTarget(dataset.id)}
                    />
                  );
                })}
                {geoDatasets.length === 0 && (
                  <div className="geo-empty">
                    No points in the current time window.
                  </div>
                )}
              </div>
              <aside className="geo-detail">
                {!selectedGeoDataset ? (
                  <p className="dataset-description">
                    Select a point to inspect details.
                  </p>
                ) : (
                  <>
                    <div className="geo-detail__title">
                      #{selectedGeoDataset.id} {selectedGeoDataset.name}
                    </div>
                    <p className="dataset-description">
                      {selectedGeoDataset.description}
                    </p>
                    <div className="geo-detail__meta">
                      <span>
                        Lat/Lng: {formatCoord(selectedGeoDataset.latitude)},{" "}
                        {formatCoord(selectedGeoDataset.longitude)}
                      </span>
                      <span>
                        Altitude: {selectedGeoDataset.altitudeMin}-
                        {selectedGeoDataset.altitudeMax} m
                      </span>
                      <span>
                        Collected:{" "}
                        {formatChainValue(selectedGeoDataset.collectionDate)}
                      </span>
                    </div>
                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={() => setLineageTarget(selectedGeoDataset.id)}
                    >
                      Open in audit trail
                    </button>
                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={() => openDatasetDetail(selectedGeoDataset.id)}
                    >
                      Open detail
                    </button>
                  </>
                )}
              </aside>
            </div>
          </div>
          <div className="compare-card">
            <div className="compare-header">
              <div>
                <h3>Comparative analysis panel</h3>
                <p>
                  Select up to 4 datasets for side-by-side metric comparison.
                </p>
              </div>
              <div className="compare-actions">
                <span>Selected: {compareDatasets.length}/4</span>
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={exportComparison}
                  disabled={compareDatasets.length === 0}
                >
                  Export JSON
                </button>
              </div>
            </div>
            <div className="compare-picks">
              {filteredDatasets.slice(0, 12).map((dataset) => {
                const selected = compareSelectionIds.includes(
                  String(dataset.id),
                );
                return (
                  <button
                    key={`cmp-pick-${dataset.id}`}
                    type="button"
                    className={`compare-pick ${selected ? "active" : ""}`}
                    onClick={() => toggleCompareDataset(dataset.id)}
                  >
                    #{dataset.id} {dataset.name}
                  </button>
                );
              })}
            </div>
            {compareDatasets.length === 0 && (
              <p className="dataset-description">
                Choose datasets above to populate the comparison matrix.
              </p>
            )}
            {compareDatasets.length > 0 && (
              <div className="compare-grid">
                <div className="compare-grid__header">Metric</div>
                {compareDatasets.map((dataset) => (
                  <div
                    key={`cmp-header-${dataset.id}`}
                    className="compare-grid__header"
                  >
                    #{dataset.id} {dataset.name}
                    {compareMetrics.best?.id === dataset.id && (
                      <span className="compare-best">Best quality</span>
                    )}
                  </div>
                ))}
                {compareMetrics.rows.map((row) => (
                  <div key={`cmp-row-${row.key}`} className="compare-row">
                    <div
                      className={`compare-cell compare-cell--label ${
                        row.changed ? "diff" : ""
                      }`}
                    >
                      {row.label}
                    </div>
                    {row.values.map((value, index) => (
                      <div
                        key={`cmp-row-${row.key}-${compareDatasets[index].id}`}
                        className={`compare-cell ${row.changed ? "diff" : ""}`}
                      >
                        {value}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="story-card">
            <div className="story-head">
              <div>
                <h3>Data story mode</h3>
                <p>
                  Auto-generated narrative from your current filtered and ranked
                  dataset view.
                </p>
              </div>
              <div className="story-controls">
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={() => setStoryPlaying((prev) => !prev)}
                  disabled={storyChapters.length <= 1}
                >
                  {storyPlaying ? "Pause" : "Play"}
                </button>
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={() =>
                    setStoryStepIndex((prev) =>
                      prev <= 0
                        ? Math.max(storyChapters.length - 1, 0)
                        : prev - 1,
                    )
                  }
                  disabled={storyChapters.length === 0}
                >
                  Prev
                </button>
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={() =>
                    setStoryStepIndex((prev) =>
                      storyChapters.length === 0
                        ? 0
                        : (prev + 1) % storyChapters.length,
                    )
                  }
                  disabled={storyChapters.length === 0}
                >
                  Next
                </button>
              </div>
            </div>
            {storyChapters.length === 0 && (
              <p className="dataset-description">
                Add or load datasets to generate a narrative.
              </p>
            )}
            {activeStoryChapter && (
              <article className="story-chapter">
                <div className="story-progress">
                  <span>
                    Chapter {storyStepIndex + 1} / {storyChapters.length}
                  </span>
                  <div className="story-dots">
                    {storyChapters.map((chapter, index) => (
                      <button
                        key={chapter.id}
                        type="button"
                        className={`story-dot ${index === storyStepIndex ? "active" : ""}`}
                        onClick={() => setStoryStepIndex(index)}
                      />
                    ))}
                  </div>
                </div>
                <h4>{activeStoryChapter.title}</h4>
                <p>{activeStoryChapter.body}</p>
                {activeStoryChapter.datasetId && (
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() =>
                      setLineageTarget(activeStoryChapter.datasetId!)
                    }
                  >
                    Open dataset #{activeStoryChapter.datasetId} in audit
                  </button>
                )}
              </article>
            )}
          </div>

          <div className="dataset-grid">
            {activeDatasets.length === 0 && (
              <div className="dataset-card">
                <div className="dataset-title">No datasets loaded yet</div>
                <p className="dataset-description">
                  {activeTab === "explore"
                    ? "Refresh to pull the latest records from mainnet."
                    : "Paste a Stacks address to load datasets tied to that owner."}
                </p>
              </div>
            )}
            {activeDatasets.length > 0 && sortedDatasets.length === 0 && (
              <div className="dataset-card">
                <div className="dataset-title">No datasets match filters</div>
                <p className="dataset-description">
                  Try broadening your filter criteria or reset all filters.
                </p>
              </div>
            )}
            {sortedDatasets.map((dataset) => (
              <article
                key={`${activeTab}-${dataset.id}`}
                className="dataset-card"
              >
                <div className="dataset-header">
                  <div>
                    <div className="dataset-title">{dataset.name}</div>
                    <div className="dataset-tags">
                      <span className="tag">{dataset.dataType}</span>
                      <span
                        className={`tag ${
                          dataset.isPublic ? "tag--public" : "tag--private"
                        }`}
                      >
                        {dataset.isPublic ? "Public" : "Private"}
                      </span>
                      {dataset.metadataFrozen && (
                        <span className="tag tag--frozen">Frozen</span>
                      )}
                      {stewardshipSignalByDatasetId.has(dataset.id) && (
                        <span className="tag tag--staked">Steward staked</span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`status-pill ${getStatusClass(dataset.status)}`}
                  >
                    {dataset.status}
                  </span>
                </div>
                <div className="dataset-rank">
                  Rank #{datasetRankById.get(dataset.id) ?? "-"} | Quality{" "}
                  {getQualityScore(dataset)}/100
                </div>
                {stewardshipSignalByDatasetId.has(dataset.id) && (
                  <div className="dataset-rank dataset-rank--stake">
                    {stewardshipSignalByDatasetId.get(dataset.id)}
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
                  <span className="hash">
                    IPFS: {dataset.ipfsHash || "n/a"}
                  </span>
                  <button
                    className="ghost-btn dataset-foot__action dataset-foot__action--compare"
                    type="button"
                    onClick={() => copyText(String(dataset.id), "Dataset ID")}
                  >
                    Copy ID
                  </button>
                  <button
                    className="ghost-btn dataset-foot__action dataset-foot__action--compare"
                    type="button"
                    onClick={() => copyText(dataset.owner, "Owner")}
                  >
                    Copy owner
                  </button>
                  <button
                    className="ghost-btn dataset-foot__action dataset-foot__action--compare"
                    type="button"
                    onClick={() =>
                      copyText(dataset.ipfsHash || "", "IPFS hash")
                    }
                  >
                    Copy IPFS
                  </button>
                  <button
                    className="ghost-btn dataset-foot__action"
                    type="button"
                    onClick={() => openDatasetDetail(dataset.id)}
                  >
                    Open detail
                  </button>
                  <button
                    className="ghost-btn dataset-foot__action"
                    type="button"
                    onClick={() => setLineageTarget(dataset.id)}
                  >
                    Audit this
                  </button>
                  <button
                    className={`ghost-btn dataset-foot__action dataset-foot__action--compare ${
                      compareSelectionIds.includes(String(dataset.id))
                        ? "active"
                        : ""
                    }`}
                    type="button"
                    onClick={() => toggleCompareDataset(dataset.id)}
                  >
                    {compareSelectionIds.includes(String(dataset.id))
                      ? "Remove compare"
                      : "Compare"}
                  </button>
                  <button
                    className={`ghost-btn dataset-foot__action dataset-foot__action--compare ${
                      watchlistIds.includes(String(dataset.id)) ? "active" : ""
                    }`}
                    type="button"
                    onClick={() => toggleWatchlistDataset(dataset.id)}
                  >
                    {watchlistIds.includes(String(dataset.id))
                      ? "Watching"
                      : "Watch"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
