import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
} from "react";
import {
  connect,
  disconnect as disconnectConnect,
  getLocalStorage,
  request,
} from "@stacks/connect";
import {
  boolCV,
  cvToHex,
  cvToJSON,
  fetchCallReadOnlyFunction,
  intCV,
  PostConditionMode,
  principalCV,
  stringAsciiCV,
  stringUtf8CV,
  uintCV,
  Pc,
} from "@stacks/transactions";
import {
  buildUrlViewSearch,
  ensureConnectUi,
  formatChainValue,
  formatCoord,
  formatPercentFromBps,
  formatTokenAmount,
  getCompletenessScore,
  getConnectProviders,
  getQualityScore,
  getStatusClass,
  getStatusPriority,
  getUserAddress,
  estimateContractCallFee,
  estimateNextNonce,
  getVersionStatusClass,
  mapDatasetToVersionStatus,
  nowUnix,
  createdAtAge,
  createdAtDateLabel,
  getAgeColorClass,
  parseStakeInfo,
  parseTuple,
  parseUInt,
  parseMicroTokenInput,
  parseUrlViewState,
  readChecked,
  readValue,
  safeIsSignedIn,
  sdkMetadataToDataset,
  unwrapResponseOk,
} from "./lib";
import { getSdkClient } from "./sdk";
import { exportDatasets, findDuplicateDatasets, fromMicroDegrees, getCoordBounds, getDatasetFreshnessScore, getOwnerLeaderboard, getRelatedTags, getStaleDatasets, getUniqueTags, pickCanonicalDataset, toBboxQueryParam, toGeoUriFromMicroDegrees, toMarkdownTable } from "../atmos-sdk/src";
import {
  buildSwapCall,
  fetchPoolState,
  fetchQuoteXForY,
  fetchQuoteYForX,
  type PoolContract,
  type PoolState,
  type QuoteResult,
  type TokenRef,
} from "clardex-sdk";
import { AppNotices } from "./components/AppNotices";
import { CommandPalette } from "./components/CommandPalette";
import { CopyButton } from "./components/CopyButton";
import { CountUp } from "./components/CountUp";
import { DatasetCard } from "./components/DatasetCard";
import { GeospatialExplorer } from "./components/GeospatialExplorer";
import { KeyboardShortcutsModal } from "./components/KeyboardShortcutsModal";
import { AltitudeHistogram } from "./components/AltitudeHistogram";
import { NavBar } from "./components/NavBar";
import { ToastStack, inferToastVariant, type ToastItem } from "./components/Toast";
import { TxCenter } from "./components/TxCenter";
import { useTxCenter } from "./useTxCenter";
import {
  AlertItem,
  CommandAction,
  Dataset,
  DatasetFilters,
  Notice,
  RegisterFormState,
  SavedView,
  SortMode,
  StoryChapter,
  TokenSnapshot,
  VersionDraft,
  VersionRecord,
  VersionStatus,
} from "./type";
import {
  CONTRACT_ADDRESS,
  CONTRACT_NAME,
  network,
  SAVED_VIEWS_KEY,
  STACKS_API_BASE_URL,
  STACKS_CORE_NODE_URL,
  STAKING_CONTRACT_NAME,
  TOKEN_CONTRACT_NAME,
  userSession,
} from "./constant";
import {
  defaultFilters,
  defaultRegisterForm,
  defaultVersionDraft,
} from "./config";

const REGISTER_DRAFT_KEY = "atmos-register-draft";
const REGISTER_DRAFT_BACKUP_KEY = "atmos-register-draft-backup";
const RECENT_COMMANDS_KEY = "atmos-command-recent";
const RECENT_DATASETS_KEY = "atmos-dataset-recent";
const PINNED_DATASETS_KEY = "atmos-dataset-pins";
const WATCHLIST_DATASETS_KEY = "atmos-dataset-watchlist";
const RECENT_SEARCHES_KEY = "atmos-search-recent";
const DATASET_DENSITY_KEY = "atmos-dataset-density";
const FEATURE_TAB_KEY = "atmos-feature-tab";
const DATASET_NOTES_KEY = "atmos-dataset-notes";
const IPFS_HEALTH_KEY = "atmos-ipfs-health";
const NOTE_PRESETS = ["review", "trusted", "needs-update", "follow-up"] as const;
const REGISTER_FIELD_LIMITS = {
  name: 100,
  description: 500,
  dataType: 50,
  ipfsHash: 100,
} as const;

const emptyRegisterForm: RegisterFormState = {
  name: "",
  description: "",
  dataType: "",
  collectionDate: "",
  altitudeMin: "",
  altitudeMax: "",
  latitude: "",
  longitude: "",
  ipfsHash: "",
  isPublic: true,
};

const cloneDatasetToRegister = (dataset: Dataset): RegisterFormState => ({
  name: `${dataset.name} (copy)`,
  description: dataset.description,
  dataType: dataset.dataType,
  collectionDate: String(dataset.collectionDate),
  altitudeMin: String(dataset.altitudeMin),
  altitudeMax: String(dataset.altitudeMax),
  latitude: String(dataset.latitude / 1_000_000),
  longitude: String(dataset.longitude / 1_000_000),
  ipfsHash: dataset.ipfsHash || "",
  isPublic: dataset.isPublic,
});

const getTypeChipStyle = (value: string): CSSProperties => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return {
    borderColor: `hsla(${hue}, 70%, 60%, 0.55)`,
    color: `hsl(${hue}, 70%, 70%)`,
    background: `hsla(${hue}, 70%, 30%, 0.18)`,
  };
};

const microTokenToInputValue = (value: number) => {
  const whole = Math.floor(value / 1_000_000);
  const fraction = Math.abs(value % 1_000_000);
  if (fraction === 0) {
    return String(whole);
  }
  return `${whole}.${fraction.toString().padStart(6, "0").replace(/0+$/, "")}`;
};

const postConditionModeName = (mode?: PostConditionMode) =>
  mode === PostConditionMode.Deny ? "deny" : "allow";

const getStoredStacksAddress = () => {
  try {
    return getLocalStorage()?.addresses?.stx?.[0]?.address ?? "";
  } catch {
    return "";
  }
};

const STALE_THRESHOLD_SECONDS = 90 * 24 * 60 * 60;

function App() {
  const hasHydratedUrlRef = useRef(false);
  const hasHydratedRegisterDraft = useRef(false);
  const hasHydratedTxStatusesRef = useRef(false);
  const hasHydratedDatasetNotesRef = useRef(false);
  const hasHydratedPinnedDatasetsRef = useRef(false);
  const hasHydratedWatchlistRef = useRef(false);
  const autoLoadedOwnerRef = useRef<string>("");
  const baseTitleRef = useRef<string>(
    typeof document !== "undefined" ? document.title : "Atmos Registry",
  );
  const exploreAbortRef = useRef<AbortController | null>(null);
  const exploreFetchTimerRef = useRef<number | null>(null);
  const savedViewsImportInputRef = useRef<HTMLInputElement | null>(null);
  const backupImportInputRef = useRef<HTMLInputElement | null>(null);
  const copyToastTimeoutRef = useRef<number | null>(null);
  const txStatusByIdRef = useRef<Map<string, string>>(new Map());
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [featureTab, setFeatureTab] = useState<
    "datasets" | "add-dataset" | "staking" | "alerts" | "audit" | "versions" | "clardex"
  >(() => {
    if (typeof window === "undefined") return "datasets";
    const stored = window.localStorage.getItem(FEATURE_TAB_KEY);
    if (
      stored === "datasets" ||
      stored === "add-dataset" ||
      stored === "staking" ||
      stored === "alerts" ||
      stored === "audit" ||
      stored === "versions" ||
      stored === "clardex"
    ) {
      return stored;
    }
    return "datasets";
  });
  const [activeTab, setActiveTab] = useState<"explore" | "mine">("explore");
  const [latestDatasets, setLatestDatasets] = useState<Dataset[]>([]);
  const [myDatasets, setMyDatasets] = useState<Dataset[]>([]);
  const [ownerInput, setOwnerInput] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");
  const [queryId, setQueryId] = useState("");
  const [queryResult, setQueryResult] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef(0);
  const [walletMessage, setWalletMessage] = useState("");
  const [txStatus, setTxStatus] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [stxBalanceMicro, setStxBalanceMicro] = useState<number | null>(null);
  const [lineageSelectionId, setLineageSelectionId] = useState("");
  const [geoTimePercent, setGeoTimePercent] = useState(100);
  const [selectedGeoDatasetId, setSelectedGeoDatasetId] = useState("");
  const [compareSelectionIds, setCompareSelectionIds] = useState<string[]>([]);
  const [mutedAlertKinds, setMutedAlertKinds] = useState<string[]>([]);
  const [readAlertIds, setReadAlertIds] = useState<string[]>([]);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);
  const [watchlistOnly, setWatchlistOnly] = useState(false);
  const [watchlistInput, setWatchlistInput] = useState("");
  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
  const [datasetNotes, setDatasetNotes] = useState<Record<string, string>>({});
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [savedViewName, setSavedViewName] = useState("");
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showTxCenter, setShowTxCenter] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showDatasetDetail, setShowDatasetDetail] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [recentCommandIds, setRecentCommandIds] = useState<string[]>([]);
  const [recentDatasetIds, setRecentDatasetIds] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [pinnedDatasetIds, setPinnedDatasetIds] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("quality-desc");
  const [storyStepIndex, setStoryStepIndex] = useState(0);
  const [storyPlaying, setStoryPlaying] = useState(false);
  const [filters, setFilters] = useState<DatasetFilters>(defaultFilters);
  const [dismissedNoIpfsNotice, setDismissedNoIpfsNotice] = useState(false);
  const [datasetDensity, setDatasetDensity] = useState<
    "comfortable" | "compact"
  >(() => {
    if (typeof window === "undefined") return "comfortable";
    const stored = window.localStorage.getItem(DATASET_DENSITY_KEY);
    if (stored === "comfortable" || stored === "compact") {
      return stored;
    }
    return "comfortable";
  });
  const [ipfsHealthByCid, setIpfsHealthByCid] = useState<
    Record<
      string,
      {
        status: "unchecked" | "checking" | "ok" | "fail";
        checkedAt: number;
      }
    >
  >({});
  const ipfsHealthRef = useRef(ipfsHealthByCid);
  ipfsHealthRef.current = ipfsHealthByCid;
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

  // ── Clardex DEX state ─────────────────────────────────────
  const [clardexPool, setClardexPool] = useState<PoolContract>({
    address: "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR",
    name: "dex-pool-v5",
  });
  const [clardexPoolState, setClardexPoolState] = useState<PoolState | null>(null);
  const [clardexPoolLoading, setClardexPoolLoading] = useState(false);
  const [clardexPoolError, setClardexPoolError] = useState("");
  const [clardexQuote, setClardexQuote] = useState<QuoteResult | null>(null);
  const [clardexQuoteLoading, setClardexQuoteLoading] = useState(false);
  const [clardexQuoteError, setClardexQuoteError] = useState("");
  const [clardexAmountIn, setClardexAmountIn] = useState("1");
  const [clardexDirection, setClardexDirection] = useState<"x-to-y" | "y-to-x">("x-to-y");
  const [clardexTokenX, setClardexTokenX] = useState<TokenRef>({ type: "stx" });
  const [clardexTokenY, setClardexTokenY] = useState<TokenRef>({
    type: "sip10",
    contract: "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.atmos-token-v4",
  });
  const [clardexMinOut, setClardexMinOut] = useState("0");
  const [clardexSwapStatus, setClardexSwapStatus] = useState("");
  const [clardexSwapLoading, setClardexSwapLoading] = useState(false);

  const [stakeAmount, setStakeAmount] = useState("10");
  const [unstakeAmount, setUnstakeAmount] = useState("10");
  const [stakeStatus, setStakeStatus] = useState("");
  const [registerTouched, setRegisterTouched] = useState<
    Partial<Record<keyof RegisterFormState, boolean>>
  >({});
  const [registerSubmitAttempted, setRegisterSubmitAttempted] = useState(false);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const [registerDraftBackup, setRegisterDraftBackup] =
    useState<RegisterFormState | null>(null);
  const [transientNotices, setTransientNotices] = useState<Notice[]>([]);
  const [contractPaused, setContractPaused] = useState<boolean | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const stacksApiUrl = STACKS_API_BASE_URL;
  const atmosApiUrl =
    import.meta.env.VITE_ATMOS_API_URL ?? "http://127.0.0.1:4000";
  const txCenter = useTxCenter({ apiBaseUrl: stacksApiUrl });

  useEffect(() => {
    const preloadTimer = window.setTimeout(() => {
      void ensureConnectUi();
    }, 250);

    return () => window.clearTimeout(preloadTimer);
  }, []);

  useEffect(() => {
    if (featureTab === "add-dataset" || featureTab === "staking") {
      void ensureConnectUi();
    }
  }, [featureTab]);

  const registerValidation = useMemo(() => {
    const issues: Partial<Record<keyof RegisterFormState, string>> = {};
    const ok: Partial<Record<keyof RegisterFormState, boolean>> = {};
    if (!registerForm.name.trim()) {
      issues.name = "Name is required.";
    } else if (registerForm.name.length > REGISTER_FIELD_LIMITS.name) {
      issues.name = `Name must be ${REGISTER_FIELD_LIMITS.name} characters or less.`;
    } else {
      ok.name = true;
    }
    if (!registerForm.dataType.trim()) {
      issues.dataType = "Data type is required.";
    } else if (registerForm.dataType.length > REGISTER_FIELD_LIMITS.dataType) {
      issues.dataType = `Data type must be ${REGISTER_FIELD_LIMITS.dataType} characters or less.`;
    } else {
      ok.dataType = true;
    }
    if (!registerForm.description.trim()) {
      issues.description = "Description is required.";
    } else if (
      registerForm.description.length > REGISTER_FIELD_LIMITS.description
    ) {
      issues.description = `Description must be ${REGISTER_FIELD_LIMITS.description} characters or less.`;
    } else {
      ok.description = true;
    }
    if (registerForm.ipfsHash.length > REGISTER_FIELD_LIMITS.ipfsHash) {
      issues.ipfsHash = `IPFS hash must be ${REGISTER_FIELD_LIMITS.ipfsHash} characters or less.`;
    }

    const collectionDate = Number.parseInt(registerForm.collectionDate, 10);
    if (registerForm.collectionDate.trim() && Number.isNaN(collectionDate)) {
      issues.collectionDate = "Use a valid number.";
    } else if (registerForm.collectionDate.trim()) {
      ok.collectionDate = true;
    }

    const altitudeMin = Number.parseInt(registerForm.altitudeMin, 10);
    const altitudeMax = Number.parseInt(registerForm.altitudeMax, 10);
    if (registerForm.altitudeMin.trim() && Number.isNaN(altitudeMin)) {
      issues.altitudeMin = "Use a valid number.";
    } else if (registerForm.altitudeMin.trim()) {
      ok.altitudeMin = true;
    }
    if (registerForm.altitudeMax.trim() && Number.isNaN(altitudeMax)) {
      issues.altitudeMax = "Use a valid number.";
    } else if (registerForm.altitudeMax.trim()) {
      ok.altitudeMax = true;
    }
    if (
      !Number.isNaN(altitudeMin) &&
      !Number.isNaN(altitudeMax) &&
      registerForm.altitudeMin.trim() &&
      registerForm.altitudeMax.trim() &&
      altitudeMax < altitudeMin
    ) {
      issues.altitudeMax = "Max must be ≥ min.";
      ok.altitudeMax = false;
    }

    const latitude = Number.parseFloat(registerForm.latitude);
    const longitude = Number.parseFloat(registerForm.longitude);
    if (registerForm.latitude.trim() && Number.isNaN(latitude)) {
      issues.latitude = "Use a valid number.";
    } else if (!Number.isNaN(latitude) && (latitude < -90 || latitude > 90)) {
      issues.latitude = "Latitude must be between -90 and 90.";
    } else if (registerForm.latitude.trim()) {
      ok.latitude = true;
    }
    if (registerForm.longitude.trim() && Number.isNaN(longitude)) {
      issues.longitude = "Use a valid number.";
    } else if (
      !Number.isNaN(longitude) &&
      (longitude < -180 || longitude > 180)
    ) {
      issues.longitude = "Longitude must be between -180 and 180.";
    } else if (registerForm.longitude.trim()) {
      ok.longitude = true;
    }

    return { issues, ok };
  }, [registerForm]);

  const senderAddress = walletAddress || ownerAddress || CONTRACT_ADDRESS;
  const activeDatasets = activeTab === "explore" ? latestDatasets : myDatasets;
  const updateDatasetNote = (datasetId: number, note: string) => {
    const key = String(datasetId);
    setDatasetNotes((prev) => {
      const next = { ...prev };
      if (!note.trim()) {
        delete next[key];
      } else {
        next[key] = note;
      }
      return next;
    });
  };
  const applyDatasetNotePreset = (datasetId: number, preset: string) => {
    const key = String(datasetId);
    const marker = `[${preset}]`;
    const current = (datasetNotes[key] ?? "").trim();
    if (current.includes(marker)) {
      setStatusMessage(`Preset ${marker} already added.`);
      return;
    }
    const nextNote = current ? `${current} ${marker}` : marker;
    updateDatasetNote(datasetId, nextNote);
    setStatusMessage(`Added preset ${marker}.`);
  };

  // In a real application, you would likely want to fetch available data types from the contract or a backend rather than deriving them from the currently loaded datasets. This approach is simpler for this example but may not capture all possible data types if your dataset collection is large or if some types are not represented in the latest/my datasets.
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
  const tagOptions = useMemo(
    () =>
      getUniqueTags(
        activeDatasets as unknown as import("../atmos-sdk/src").DatasetMetadata[],
      ),
    [activeDatasets],
  );
  const lastTypedTag = filters.tags.split(",").map((tag) => tag.trim()).filter(Boolean).pop() ?? "";
  const relatedTagSuggestions = useMemo(() => {
    if (!lastTypedTag) return [];
    return getRelatedTags(
      activeDatasets as unknown as import("../atmos-sdk/src").DatasetMetadata[],
      lastTypedTag,
      { caseInsensitive: true, limit: 6 },
    );
  }, [activeDatasets, lastTypedTag]);
  const ownerLeaderboard = useMemo(
    () =>
      getOwnerLeaderboard(
        activeDatasets as unknown as import("../atmos-sdk/src").DatasetMetadata[],
        { limit: 5 },
      ),
    [activeDatasets],
  );
  const addTagToFilter = (tag: string) => {
    const current = filters.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (current.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    setFilters((prev) => ({
      ...prev,
      tags: [...current, tag].join(", "),
    }));
  };
  const filteredDatasets = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const owner = filters.owner.trim().toLowerCase();
    const requiredTags = filters.tags
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);
    const min = Number.parseInt(filters.altitudeMin, 10);
    const max = Number.parseInt(filters.altitudeMax, 10);
    const pinned = filters.pinnedOnly ? new Set(pinnedDatasetIds) : null;
    return activeDatasets.filter((dataset) => {
      const note = datasetNotes[String(dataset.id)] ?? "";
      const isVerified = dataset.verified || dataset.status === "verified";
      const hasIpfs = Boolean(dataset.ipfsHash?.trim());
      if (requiredTags.length > 0) {
        const datasetTags = (Array.isArray(dataset.tags) ? dataset.tags : [])
          .map((tag) => String(tag).trim().toLowerCase())
          .filter(Boolean);
        const tagSet = new Set(datasetTags);
        for (const requiredTag of requiredTags) {
          if (!tagSet.has(requiredTag)) {
            return false;
          }
        }
      }
      if (pinned && !pinned.has(String(dataset.id))) {
        return false;
      }
      if (search) {
        const haystack = [
          dataset.id,
          dataset.name,
          dataset.description,
          dataset.ipfsHash,
          dataset.dataType,
          note,
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
      if (filters.verified === "verified" && !isVerified) {
        return false;
      }
      if (filters.verified === "unverified" && isVerified) {
        return false;
      }
      if (filters.frozen === "frozen" && !dataset.metadataFrozen) {
        return false;
      }
      if (filters.frozen === "mutable" && dataset.metadataFrozen) {
        return false;
      }
      if (filters.ipfs === "has-ipfs" && !hasIpfs) {
        return false;
      }
      if (filters.ipfs === "no-ipfs" && hasIpfs) {
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
      if (filters.notedOnly && !note.trim()) {
        return false;
      }
      return true;
    });
  }, [activeDatasets, datasetNotes, filters, pinnedDatasetIds]);
  const filteredQualitySummary = useMemo(() => {
    if (!filteredDatasets.length) {
      return { avgQuality: 0, verifiedPct: 0, hasData: false };
    }
    const totalQuality = filteredDatasets.reduce(
      (sum, dataset) => sum + getQualityScore(dataset),
      0,
    );
    const verified = filteredDatasets.filter((dataset) => dataset.verified).length;
    return {
      avgQuality: Math.round(totalQuality / filteredDatasets.length),
      verifiedPct: Math.round((verified / filteredDatasets.length) * 100),
      hasData: true,
    };
  }, [filteredDatasets]);
  const interfaceSignals = useMemo(
    () => [
      {
        label: "Datasets",
        value: activeDatasets.length > 0 ? activeDatasets.length.toLocaleString() : "—",
        count: activeDatasets.length > 0 ? activeDatasets.length : null,
        variant: "",
        icon: "◈",
        pending: loading && activeDatasets.length === 0,
      },
      {
        label: "Showing",
        value: activeDatasets.length > 0
          ? `${filteredDatasets.length}/${activeDatasets.length}`
          : "—",
        count: null,
        variant: "",
        icon: "◉",
        pending: loading && activeDatasets.length === 0,
      },
      {
        label: "Watchlist",
        value: watchlistIds.length.toLocaleString(),
        count: watchlistIds.length,
        variant: "home-stat--green",
        icon: "★",
        pending: false,
      },
      {
        label: "Pinned",
        value: pinnedDatasetIds.length.toLocaleString(),
        count: pinnedDatasetIds.length,
        variant: "home-stat--blue",
        icon: "⊕",
        pending: false,
      },
      {
        label: "Avg quality",
        value: filteredQualitySummary.hasData
          ? `${filteredQualitySummary.avgQuality}/100`
          : "—",
        count: null,
        variant: "",
        icon: "✦",
        pending: loading && activeDatasets.length === 0,
      },
      {
        label: "Verified",
        value: filteredQualitySummary.hasData
          ? `${filteredQualitySummary.verifiedPct}%`
          : "—",
        count: null,
        variant: "home-stat--green",
        icon: "✓",
        pending: loading && activeDatasets.length === 0,
      },
    ],
    [
      activeDatasets.length,
      filteredDatasets.length,
      filteredQualitySummary,
      loading,
      pinnedDatasetIds.length,
      watchlistIds,
    ],
  );
  const insightItems = useMemo(() => {
    if (filteredDatasets.length === 0) {
      return [];
    }

    let topQuality = filteredDatasets[0];
    let topQualityScore = getQualityScore(topQuality);
    let mostRecent = filteredDatasets[0];
    let highestAltitude = filteredDatasets[0];
    const ownerCounts = new Map<string, number>();
    const notedCount = filteredDatasets.filter((dataset) =>
      Boolean(datasetNotes[String(dataset.id)]?.trim()),
    ).length;

    filteredDatasets.forEach((dataset) => {
      const score = getQualityScore(dataset);
      if (score > topQualityScore) {
        topQuality = dataset;
        topQualityScore = score;
      }
      if (dataset.collectionDate > mostRecent.collectionDate) {
        mostRecent = dataset;
      }
      if (dataset.altitudeMax > highestAltitude.altitudeMax) {
        highestAltitude = dataset;
      }
      ownerCounts.set(dataset.owner, (ownerCounts.get(dataset.owner) ?? 0) + 1);
    });

    let topOwner = Array.from(ownerCounts.entries())[0];
    ownerCounts.forEach((count, owner) => {
      if (!topOwner || count > topOwner[1]) {
        topOwner = [owner, count];
      }
    });

    return [
      {
        label: "Top quality",
        value: `#${topQuality.id} ${topQuality.name}`,
        meta: `Score ${topQualityScore}/100`,
      },
      {
        label: "Most recent",
        value: `#${mostRecent.id} ${mostRecent.name}`,
        meta: formatChainValue(mostRecent.collectionDate),
      },
      {
        label: "Highest altitude",
        value: `#${highestAltitude.id} ${highestAltitude.name}`,
        meta: `${highestAltitude.altitudeMax} m max`,
      },
      {
        label: "Top owner",
        value: topOwner ? topOwner[0] : "n/a",
        meta: topOwner ? `${topOwner[1]} datasets` : "n/a",
      },
      {
        label: "Private notes",
        value: notedCount.toLocaleString(),
        meta:
          notedCount === 1
            ? "1 dataset has a note"
            : `${notedCount} datasets have notes`,
      },
    ];
  }, [datasetNotes, filteredDatasets]);
  const stakeAmountValue = useMemo(
    () => parseMicroTokenInput(stakeAmount),
    [stakeAmount],
  );
  const unstakeAmountValue = useMemo(
    () => parseMicroTokenInput(unstakeAmount),
    [unstakeAmount],
  );
  const networkLabel = useMemo(() => {
    const apiBase = STACKS_API_BASE_URL.toLowerCase();
    if (
      apiBase.includes("localhost") ||
      apiBase.includes("127.0.0.1") ||
      apiBase.includes("devnet")
    ) {
      return "Devnet";
    }
    if (apiBase.includes("testnet")) {
      return "Testnet";
    }
    return "Mainnet";
  }, []);
  const hasInsufficientStakeBalance = useMemo(() => {
    if (!walletAddress || !tokenSnapshot || !stakeAmountValue) {
      return false;
    }
    return stakeAmountValue > tokenSnapshot.balance;
  }, [walletAddress, stakeAmountValue, tokenSnapshot]);

  useEffect(() => {
    // Keyboard shortcuts are handled in the global shortcut handler below.
    // Keeping a single handler avoids duplicate toggles.
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const raw = window.localStorage.getItem(IPFS_HEALTH_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Record<string, any>;
      if (!parsed || typeof parsed !== "object") {
        return;
      }
      const next: Record<string, { status: "unchecked" | "checking" | "ok" | "fail"; checkedAt: number }> =
        {};
      Object.entries(parsed).forEach(([cid, value]) => {
        if (typeof cid !== "string" || !cid.trim()) return;
        if (!value || typeof value !== "object") return;
        const status = (value as any).status;
        const checkedAt = Number((value as any).checkedAt ?? 0);
        if (
          status !== "unchecked" &&
          status !== "checking" &&
          status !== "ok" &&
          status !== "fail"
        ) {
          return;
        }
        next[cid] = {
          status,
          checkedAt: Number.isFinite(checkedAt) ? checkedAt : 0,
        };
      });
      setIpfsHealthByCid(next);
    } catch {
      window.localStorage.removeItem(IPFS_HEALTH_KEY);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (copyToastTimeoutRef.current !== null) {
        window.clearTimeout(copyToastTimeoutRef.current);
        copyToastTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const rawDraft = window.localStorage.getItem(REGISTER_DRAFT_KEY);
    if (!rawDraft) {
      hasHydratedRegisterDraft.current = true;
      return;
    }
    try {
      const parsed = JSON.parse(rawDraft) as Partial<RegisterFormState>;
      setRegisterForm((prev) => ({ ...prev, ...parsed }));
    } catch {
      window.localStorage.removeItem(REGISTER_DRAFT_KEY);
    } finally {
      hasHydratedRegisterDraft.current = true;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const rawRecent = window.localStorage.getItem(RECENT_COMMANDS_KEY);
    if (!rawRecent) {
      return;
    }
    try {
      const parsed = JSON.parse(rawRecent) as string[];
      if (Array.isArray(parsed)) {
        setRecentCommandIds(
          parsed.filter((item) => typeof item === "string"),
        );
      }
    } catch {
      window.localStorage.removeItem(RECENT_COMMANDS_KEY);
    }
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const rawRecentSearches = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!rawRecentSearches) {
      return;
    }
    try {
      const parsed = JSON.parse(rawRecentSearches) as string[];
      if (Array.isArray(parsed)) {
        setRecentSearches(
          parsed
            .filter((item) => typeof item === "string")
            .map((item) => item.trim())
            .filter((item) => Boolean(item)),
        );
      }
    } catch {
      window.localStorage.removeItem(RECENT_SEARCHES_KEY);
    }
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const rawDraftBackup = window.localStorage.getItem(REGISTER_DRAFT_BACKUP_KEY);
    if (!rawDraftBackup) {
      return;
    }
    try {
      const parsed = JSON.parse(rawDraftBackup) as RegisterFormState;
      if (parsed && typeof parsed === "object") {
        setRegisterDraftBackup(parsed);
      }
    } catch {
      window.localStorage.removeItem(REGISTER_DRAFT_BACKUP_KEY);
    }
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const rawRecentDatasets = window.localStorage.getItem(RECENT_DATASETS_KEY);
    if (!rawRecentDatasets) {
      return;
    }
    try {
      const parsed = JSON.parse(rawRecentDatasets) as string[];
      if (Array.isArray(parsed)) {
        setRecentDatasetIds(
          parsed.filter((item) => typeof item === "string" && /^\d+$/.test(item)),
        );
      }
    } catch {
      window.localStorage.removeItem(RECENT_DATASETS_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const rawPinned = window.localStorage.getItem(PINNED_DATASETS_KEY);
    if (!rawPinned) {
      hasHydratedPinnedDatasetsRef.current = true;
      return;
    }
    try {
      const parsed = JSON.parse(rawPinned) as string[];
      if (Array.isArray(parsed)) {
        setPinnedDatasetIds(
          Array.from(
            new Set(
              parsed.filter((item) => typeof item === "string" && /^\d+$/.test(item)),
            ),
          ),
        );
      }
    } catch {
      window.localStorage.removeItem(PINNED_DATASETS_KEY);
    } finally {
      hasHydratedPinnedDatasetsRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const rawWatchlist = window.localStorage.getItem(WATCHLIST_DATASETS_KEY);
    if (!rawWatchlist) {
      hasHydratedWatchlistRef.current = true;
      return;
    }
    try {
      const parsed = JSON.parse(rawWatchlist) as string[];
      if (Array.isArray(parsed)) {
        const next = Array.from(
          new Set(
            parsed.filter((item) => typeof item === "string" && /^\d+$/.test(item)),
          ),
        );
        setWatchlistIds(next);
        setWatchlistInput(next.join(", "));
      }
    } catch {
      window.localStorage.removeItem(WATCHLIST_DATASETS_KEY);
    } finally {
      hasHydratedWatchlistRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const rawNotes = window.localStorage.getItem(DATASET_NOTES_KEY);
    if (!rawNotes) {
      hasHydratedDatasetNotesRef.current = true;
      return;
    }
    try {
      const parsed = JSON.parse(rawNotes) as Record<string, unknown>;
      if (!parsed || typeof parsed !== "object") {
        hasHydratedDatasetNotesRef.current = true;
        return;
      }

      const next: Record<string, string> = {};
      Object.entries(parsed).forEach(([key, value]) => {
        if (!/^\d+$/.test(key)) return;
        if (typeof value !== "string") return;
        if (!value.trim()) return;
        next[key] = value;
      });
      setDatasetNotes(next);
    } catch {
      window.localStorage.removeItem(DATASET_NOTES_KEY);
    } finally {
      hasHydratedDatasetNotesRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!hasHydratedRegisterDraft.current) {
      return;
    }
    window.localStorage.setItem(
      REGISTER_DRAFT_KEY,
      JSON.stringify(registerForm),
    );
  }, [registerForm]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(
      RECENT_COMMANDS_KEY,
      JSON.stringify(recentCommandIds.slice(0, 6)),
    );
  }, [recentCommandIds]);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(
      RECENT_DATASETS_KEY,
      JSON.stringify(recentDatasetIds.slice(0, 6)),
    );
  }, [recentDatasetIds]);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(
      RECENT_SEARCHES_KEY,
      JSON.stringify(recentSearches.slice(0, 8)),
    );
  }, [recentSearches]);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!hasHydratedPinnedDatasetsRef.current) {
      return;
    }
    if (pinnedDatasetIds.length === 0) {
      window.localStorage.removeItem(PINNED_DATASETS_KEY);
      return;
    }
    window.localStorage.setItem(
      PINNED_DATASETS_KEY,
      JSON.stringify(pinnedDatasetIds.slice(0, 50)),
    );
  }, [pinnedDatasetIds]);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!hasHydratedWatchlistRef.current) {
      return;
    }
    if (watchlistIds.length === 0) {
      window.localStorage.removeItem(WATCHLIST_DATASETS_KEY);
      return;
    }
    window.localStorage.setItem(
      WATCHLIST_DATASETS_KEY,
      JSON.stringify(watchlistIds.slice(0, 200)),
    );
  }, [watchlistIds]);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!hasHydratedDatasetNotesRef.current) {
      return;
    }
    if (Object.keys(datasetNotes).length === 0) {
      window.localStorage.removeItem(DATASET_NOTES_KEY);
      return;
    }
    window.localStorage.setItem(DATASET_NOTES_KEY, JSON.stringify(datasetNotes));
  }, [datasetNotes]);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!registerDraftBackup) {
      window.localStorage.removeItem(REGISTER_DRAFT_BACKUP_KEY);
      return;
    }
    window.localStorage.setItem(
      REGISTER_DRAFT_BACKUP_KEY,
      JSON.stringify(registerDraftBackup),
    );
  }, [registerDraftBackup]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DATASET_DENSITY_KEY, datasetDensity);
  }, [datasetDensity]);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (Object.keys(ipfsHealthByCid).length === 0) {
      window.localStorage.removeItem(IPFS_HEALTH_KEY);
      return;
    }
    window.localStorage.setItem(IPFS_HEALTH_KEY, JSON.stringify(ipfsHealthByCid));
  }, [ipfsHealthByCid]);
  useEffect(() => {
    const sdk = getSdkClient();
    if (!sdk) return;

    const allDatasets = [...latestDatasets, ...myDatasets, ...(queryResult ? [queryResult] : [])];
    const hashes = [...new Set(allDatasets.map((d) => d.ipfsHash?.trim() ?? "").filter(Boolean))];
    const unchecked = hashes.filter((h) => {
      const cid = h.startsWith("ipfs://") ? h.slice(7).split(/[?#]/)[0].trim() : h.split(/[?#]/)[0].trim();
      return cid && !ipfsHealthRef.current[cid];
    });
    if (unchecked.length === 0) return;

    let cancelled = false;
    sdk.checkIpfsBatch(unchecked).then((batchResult) => {
      if (cancelled) return;
      const ts = nowUnix();
      setIpfsHealthByCid((prev) => {
        const next = { ...prev };
        batchResult.forEach((status, cid) => {
          if (!next[cid]) next[cid] = { status, checkedAt: ts };
        });
        return next;
      });
    });
    return () => { cancelled = true; };
  }, [latestDatasets, myDatasets, queryResult]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(FEATURE_TAB_KEY, featureTab);
  }, [featureTab]);
  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.search ||
        filters.tags ||
        (filters.status !== "all" && filters.status) ||
        (filters.visibility !== "all" && filters.visibility) ||
        (filters.verified !== "all" && filters.verified) ||
        (filters.frozen !== "all" && filters.frozen) ||
        (filters.ipfs !== "all" && filters.ipfs) ||
        (filters.dataType !== "all" && filters.dataType) ||
        filters.owner ||
        filters.altitudeMin ||
        filters.altitudeMax ||
        filters.notedOnly ||
        filters.pinnedOnly,
      ),
    [filters],
  );
  const filterChips = useMemo(() => {
    const chips: Array<{
      id: string;
      label: string;
      key: keyof DatasetFilters;
      className?: string;
      style?: CSSProperties;
    }> = [];
    if (filters.search) {
      chips.push({
        id: "search",
        label: `Search: ${filters.search}`,
        key: "search",
      });
    }
    if (filters.tags) {
      chips.push({
        id: "tags",
        label: `Tags: ${filters.tags}`,
        key: "tags",
      });
    }
    if (filters.status !== "all") {
      chips.push({
        id: "status",
        label: `Status: ${filters.status}`,
        key: "status",
        className: `status--${filters.status}`,
      });
    }
    if (filters.visibility !== "all") {
      chips.push({
        id: "visibility",
        label: `Visibility: ${filters.visibility}`,
        key: "visibility",
        className: `visibility--${filters.visibility}`,
      });
    }
    if (filters.verified !== "all") {
      chips.push({
        id: "verified",
        label: `Verified: ${filters.verified}`,
        key: "verified",
      });
    }
    if (filters.frozen !== "all") {
      chips.push({
        id: "frozen",
        label: `Frozen: ${filters.frozen}`,
        key: "frozen",
      });
    }
    if (filters.ipfs !== "all") {
      chips.push({
        id: "ipfs",
        label: `IPFS: ${filters.ipfs}`,
        key: "ipfs",
      });
    }
    if (filters.dataType !== "all") {
      chips.push({
        id: "dataType",
        label: `Type: ${filters.dataType}`,
        key: "dataType",
        className: "filter-chip--type",
        style: getTypeChipStyle(filters.dataType),
      });
    }
    if (filters.owner) {
      chips.push({
        id: "owner",
        label: `Owner: ${filters.owner}`,
        key: "owner",
      });
    }
    if (filters.altitudeMin) {
      chips.push({
        id: "altitudeMin",
        label: `Altitude min: ${filters.altitudeMin}`,
        key: "altitudeMin",
      });
    }
    if (filters.altitudeMax) {
      chips.push({
        id: "altitudeMax",
        label: `Altitude max: ${filters.altitudeMax}`,
        key: "altitudeMax",
      });
    }
    if (filters.notedOnly) {
      chips.push({
        id: "notedOnly",
        label: "Private notes only",
        key: "notedOnly",
      });
    }
    if (filters.pinnedOnly) {
      chips.push({
        id: "pinnedOnly",
        label: "Pinned only",
        key: "pinnedOnly",
      });
    }
    return chips;
  }, [filters]);
  const clearFilter = (key: keyof DatasetFilters) => {
    setFilters((prev) => ({
      ...prev,
      [key]: defaultFilters[key],
    }));
  };
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
    const pinned = new Set(pinnedDatasetIds);
    next.sort((a, b) => {
      const aPinned = pinned.has(String(a.id));
      const bPinned = pinned.has(String(b.id));
      if (aPinned !== bPinned) {
        return aPinned ? -1 : 1;
      }
      if (sortMode === "recent-desc") {
        return b.collectionDate - a.collectionDate;
      }
      if (sortMode === "recent-asc") {
        return a.collectionDate - b.collectionDate;
      }
      if (sortMode === "altitude-desc") {
        return b.altitudeMax - a.altitudeMax;
      }
      if (sortMode === "altitude-range-asc") {
        return (a.altitudeMax - a.altitudeMin) - (b.altitudeMax - b.altitudeMin);
      }
      if (sortMode === "status-priority") {
        return getStatusPriority(b.status) - getStatusPriority(a.status);
      }
      if (sortMode === "type-asc") {
        const cmp = a.dataType.toLowerCase().localeCompare(b.dataType.toLowerCase());
        if (cmp !== 0) return cmp;
        return getQualityScore(b) - getQualityScore(a);
      }
      if (sortMode === "completeness-desc") {
        const diff = getCompletenessScore(b) - getCompletenessScore(a);
        if (diff !== 0) return diff;
        return getQualityScore(b) - getQualityScore(a);
      }
      if (sortMode === "freshness-desc") {
        return (
          getDatasetFreshnessScore(
            b as unknown as import("../atmos-sdk/src").DatasetMetadata,
          ) -
          getDatasetFreshnessScore(
            a as unknown as import("../atmos-sdk/src").DatasetMetadata,
          )
        );
      }
      return getQualityScore(b) - getQualityScore(a);
    });
    return next;
  }, [filteredDatasets, pinnedDatasetIds, sortMode]);
  const datasetRankById = useMemo(() => {
    const rankMap = new Map<number, number>();
    sortedDatasets.forEach((dataset, index) => {
      rankMap.set(dataset.id, index + 1);
    });
    return rankMap;
  }, [sortedDatasets]);
  const duplicateInfoByDatasetId = useMemo(() => {
    const info = new Map<number, { groupSize: number; isCanonical: boolean }>();
    const groups = findDuplicateDatasets(
      activeDatasets as unknown as import("../atmos-sdk/src").DatasetMetadata[],
    );
    for (const group of groups) {
      const canonical = pickCanonicalDataset(group.datasets);
      const canonicalId = (canonical as unknown as Dataset | null)?.id;
      for (const member of group.datasets) {
        const id = (member as unknown as Dataset).id;
        info.set(id, { groupSize: group.datasets.length, isCanonical: id === canonicalId });
      }
    }
    return info;
  }, [activeDatasets]);
  const staleDatasetIds = useMemo(() => {
    const stale = getStaleDatasets(
      activeDatasets as unknown as import("../atmos-sdk/src").DatasetMetadata[],
      STALE_THRESHOLD_SECONDS,
    );
    return new Set(stale.map((dataset) => (dataset as unknown as Dataset).id));
  }, [activeDatasets]);
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

  useEffect(() => {
    if (!txCenter.txs.length) return;
    if (!hasHydratedTxStatusesRef.current) {
      hasHydratedTxStatusesRef.current = true;
      txStatusByIdRef.current = new Map(
        txCenter.txs.map((tx) => [tx.txId, tx.status]),
      );
      return;
    }

    const next = new Map(txStatusByIdRef.current);
    const notices: Notice[] = [];
    const explorerHrefFor = (txId: string) =>
      `https://explorer.hiro.so/txid/${encodeURIComponent(txId)}?chain=mainnet`;

    for (const tx of txCenter.txs) {
      const prevStatus = next.get(tx.txId);
      if (prevStatus === undefined) {
        const shortTxId =
          tx.txId.length > 12
            ? `${tx.txId.slice(0, 6)}…${tx.txId.slice(-6)}`
            : tx.txId;
        const href = explorerHrefFor(tx.txId);
        notices.push({
          id: `tx-${tx.txId}-submitted-${Date.now()}`,
          tone: "info",
          message: (
            <span>
              Transaction submitted: {tx.title}{" "}
              <a href={href} target="_blank" rel="noreferrer noopener">
                ({shortTxId})
              </a>
            </span>
          ),
        });
        next.set(tx.txId, tx.status);
        continue;
      }

      if (prevStatus !== tx.status) {
        const wasPending = prevStatus === "submitted" || prevStatus === "pending";
        const isFinal = tx.status === "success" || tx.status === "failed";
        if (wasPending && isFinal) {
          const shortTxId = tx.txId.length > 12
            ? `${tx.txId.slice(0, 6)}…${tx.txId.slice(-6)}`
            : tx.txId;
          const href = explorerHrefFor(tx.txId);
          notices.push({
            id: `tx-${tx.txId}-${tx.status}-${Date.now()}`,
            tone: tx.status === "success" ? "info" : "warning",
            message: (
              <span>
                {tx.status === "success"
                  ? "Transaction confirmed: "
                  : "Transaction failed: "}
                {tx.title}{" "}
                <a href={href} target="_blank" rel="noreferrer noopener">
                  ({shortTxId})
                </a>
              </span>
            ),
          });
        }
        next.set(tx.txId, tx.status);
      }
    }

    txStatusByIdRef.current = next;
    if (!notices.length) return;

    setTransientNotices((prev) => {
      const merged = [...prev, ...notices];
      return merged.slice(-4);
    });

    for (const notice of notices) {
      window.setTimeout(() => {
        setTransientNotices((prev) => prev.filter((item) => item.id !== notice.id));
      }, 6500);
    }
  }, [txCenter.txs]);
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
  const topAlertLevel = useMemo((): "critical" | "warning" | "info" | undefined => {
    const unread = alerts.filter((alert) => !readAlertIds.includes(alert.id));
    if (unread.length === 0) return undefined;
    if (unread.some((a) => a.level === "critical")) return "critical";
    if (unread.some((a) => a.level === "warning")) return "warning";
    return "info";
  }, [alerts, readAlertIds]);
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
  const recentDatasets = useMemo(() => {
    if (!recentDatasetIds.length) {
      return [];
    }
    const byId = new Map(lineageOptions.map((dataset) => [String(dataset.id), dataset]));
    return recentDatasetIds
      .map((id) => byId.get(id))
      .filter((dataset): dataset is Dataset => Boolean(dataset));
  }, [lineageOptions, recentDatasetIds]);
  const pinnedDatasets = useMemo(() => {
    if (!pinnedDatasetIds.length) {
      return [];
    }
    const byId = new Map(lineageOptions.map((dataset) => [String(dataset.id), dataset]));
    return pinnedDatasetIds
      .map((id) => byId.get(id))
      .filter((dataset): dataset is Dataset => Boolean(dataset));
  }, [lineageOptions, pinnedDatasetIds]);
  const recentlyNotedDatasets = useMemo(() => {
    const notedIds = Object.entries(datasetNotes)
      .filter(([, note]) => Boolean(note.trim()))
      .map(([id]) => id);
    if (!notedIds.length) {
      return [];
    }
    const byId = new Map(lineageOptions.map((dataset) => [String(dataset.id), dataset]));
    return notedIds
      .map((id) => byId.get(id))
      .filter((dataset): dataset is Dataset => Boolean(dataset))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 6);
  }, [datasetNotes, lineageOptions]);

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

  const commitRecentSearch = (raw: string) => {
    const term = raw.trim();
    if (!term) {
      return;
    }
    setRecentSearches((prev) => {
      const next = [term, ...prev.filter((item) => item !== term)];
      return next.slice(0, 8);
    });
  };

  const clearRecentSearches = () => {
    if (recentSearches.length === 0) {
      setStatusMessage("No recent searches to clear.");
      return;
    }
    setRecentSearches([]);
    setStatusMessage("Cleared recent searches.");
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

  const fetchContractPaused = async () => {
    try {
      const response = await readContractValue(CONTRACT_NAME, "is-contract-paused", []);
      const ok = unwrapResponseOk(response);
      const json = cvToJSON(ok as any) as any;
      setContractPaused(json.value === true);
    } catch {
      // leave contractPaused as null (unknown) on error
    }
  };

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
      exploreAbortRef.current?.abort();
      const controller = new AbortController();
      exploreAbortRef.current = controller;

      const params = new URLSearchParams();
      params.set("limit", "200");
      if (filters.search) params.set("search", filters.search);
      if (filters.tags) params.set("tags", filters.tags);
      if (filters.visibility !== "all") params.set("visibility", filters.visibility);
      if (filters.verified === "verified") params.set("verified", "true");
      if (filters.verified === "unverified") params.set("verified", "false");
      if (filters.frozen === "frozen") params.set("metadataFrozen", "true");
      if (filters.frozen === "mutable") params.set("metadataFrozen", "false");

      const url = `${atmosApiUrl}/datasets?${params.toString()}`;
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `API request failed (${response.status}).`);
      }
      const payload = (await response.json()) as { items?: Dataset[] };
      const items = Array.isArray(payload.items) ? payload.items : [];
      setLatestDatasets(
        items.map((item) => ({
          verifiedBy: "",
          verifiedAt: 0,
          ...(item as any),
        })),
      );
    } catch (error) {
      if ((error as any)?.name === "AbortError") {
        return;
      }
      setLatestDatasets([]);
      setStatusMessage("Unable to load datasets from the data service API.");
    } finally {
      setLoading(false);
    }
  };

  const loadOwnerDatasets = async (address: string) => {
    setStatusMessage("");
    setLoading(true);
    try {
      const sdk = getSdkClient();
      if (sdk) {
        const items = await sdk.findByOwner(address);
        setMyDatasets(items.map(sdkMetadataToDataset));
        return;
      }
      // Fallback: fetch IDs on-chain then hydrate each dataset individually.
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
    triggerDownload(
      new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }),
      `atmos-audit-dataset-${lineageDataset.id}.txt`,
    );
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
    setRecentDatasetIds((prev) => {
      const nextId = String(datasetId);
      return [nextId, ...prev.filter((id) => id !== nextId)].slice(0, 6);
    });
    setLineageSelectionId(String(datasetId));
    setShowDatasetDetail(true);
  };
  const openRandomDataset = () => {
    const pool = sortedDatasets.length ? sortedDatasets : filteredDatasets;
    if (!pool.length) {
      setStatusMessage("No datasets to pick from.");
      return;
    }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    openDatasetDetail(pick.id);
    setStatusMessage(`Surfaced #${pick.id} — ${pick.name}.`);
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
  // Dataset.id is number while DatasetMetadata.id is string; cast for serialization only.
  const asExportable = (datasets: Dataset[]) => datasets as unknown as import("../atmos-sdk/src").DatasetMetadata[];
  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const exportComparison = () => {
    if (!compareDatasets.length || typeof window === "undefined") return;
    triggerDownload(
      exportDatasets(asExportable(compareDatasets), "json", { meta: { kind: "comparison" } }),
      "atmos-dataset-comparison.json",
    );
  };
  const exportComparisonCsv = () => {
    if (!compareDatasets.length || typeof window === "undefined") {
      setStatusMessage("No comparison datasets to export.");
      return;
    }
    triggerDownload(
      exportDatasets(asExportable(compareDatasets), "csv", {
        csv: { columns: ["id", "name", "status", "isPublic", "collectionDate", "createdAt", "altitudeMin", "altitudeMax", "latitude", "longitude", "owner", "ipfsHash"] },
      }),
      `atmos-dataset-comparison-${Date.now()}.csv`,
    );
    setStatusMessage(`Exported ${compareDatasets.length} datasets (CSV).`);
  };
  const copyComparisonMarkdown = async () => {
    if (!compareDatasets.length) {
      setStatusMessage("No comparison datasets to copy.");
      return;
    }
    const markdown = toMarkdownTable(asExportable(compareDatasets), {
      fields: [
        "id",
        "name",
        "dataType",
        "status",
        "verified",
        "isPublic",
        "owner",
        "collectionDate",
      ],
    });
    await copyText(markdown, "Comparison Markdown table");
  };
  const exportFilteredDatasets = () => {
    if (!filteredDatasets.length || typeof window === "undefined") {
      setStatusMessage("No filtered datasets to export.");
      return;
    }
    triggerDownload(
      exportDatasets(asExportable(sortedDatasets), "json", {
        meta: { activeTab, totalVisible: filteredDatasets.length, sortMode, filters },
      }),
      `atmos-filtered-${activeTab}-${Date.now()}.json`,
    );
    setStatusMessage(`Exported ${filteredDatasets.length} filtered datasets.`);
  };
  const exportFilteredDatasetsCsv = () => {
    if (!filteredDatasets.length || typeof window === "undefined") {
      setStatusMessage("No filtered datasets to export.");
      return;
    }
    triggerDownload(
      exportDatasets(asExportable(sortedDatasets), "csv", {
        csv: { columns: ["id", "name", "description", "dataType", "status", "owner", "isPublic", "metadataFrozen", "verified", "verifiedBy", "verifiedAt", "collectionDate", "createdAt", "altitudeMin", "altitudeMax", "latitude", "longitude", "ipfsHash"] },
      }),
      `atmos-filtered-${activeTab}-${Date.now()}.csv`,
    );
    setStatusMessage(`Exported ${filteredDatasets.length} filtered datasets (CSV).`);
  };
  const copyFilteredCsv = async () => {
    if (!filteredDatasets.length) {
      setStatusMessage("No filtered datasets to copy.");
      return;
    }
    const escapeCsv = (value: unknown) => {
      const raw = value === null || value === undefined ? "" : String(value);
      const needsQuotes = /[",\n\r]/.test(raw);
      const escaped = raw.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    };
    const header = "id,name,dataType,latitude,longitude,qualityScore";
    const rows = sortedDatasets.map((dataset) =>
      [
        dataset.id,
        dataset.name,
        dataset.dataType,
        (dataset.latitude / 1_000_000).toFixed(6),
        (dataset.longitude / 1_000_000).toFixed(6),
        getQualityScore(dataset),
      ]
        .map(escapeCsv)
        .join(","),
    );
    const csv = [header, ...rows].join("\n");
    try {
      await navigator.clipboard.writeText(csv);
      setStatusMessage(`Copied ${filteredDatasets.length} rows as CSV.`);
    } catch {
      setStatusMessage("Clipboard write failed — check browser permissions.");
    }
  };
  const copyFilteredSummary = async () => {
    if (!filteredDatasets.length) {
      setStatusMessage("No filtered datasets to summarize.");
      return;
    }
    const total = filteredDatasets.length;
    const verified = filteredDatasets.filter((dataset) => dataset.verified).length;
    const frozen = filteredDatasets.filter(
      (dataset) => dataset.metadataFrozen,
    ).length;
    const publicCount = filteredDatasets.filter(
      (dataset) => dataset.isPublic,
    ).length;
    const typeCounts = new Map<string, number>();
    for (const dataset of filteredDatasets) {
      const type = (dataset.dataType || "untyped").trim() || "untyped";
      typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);
    }
    const topTypes = [...typeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type]) => type)
      .join(", ");
    const summary = [
      `${total} dataset${total === 1 ? "" : "s"}`,
      `${verified} verified`,
      `${frozen} frozen`,
      `${publicCount} public`,
      `types: ${topTypes}`,
      `avg quality ${filteredQualitySummary.avgQuality}/100`,
    ].join(" · ");
    try {
      await navigator.clipboard.writeText(summary);
      setStatusMessage(`Copied summary of ${total} datasets.`);
    } catch {
      setStatusMessage("Clipboard write failed — check browser permissions.");
    }
  };
  const exportFilteredDatasetsGeoJson = () => {
    if (!filteredDatasets.length || typeof window === "undefined") {
      setStatusMessage("No filtered datasets to export.");
      return;
    }

    const featureCollection = {
      type: "FeatureCollection",
      generatedAt: new Date().toISOString(),
      activeTab,
      totalVisible: filteredDatasets.length,
      sortMode,
      filters,
      features: sortedDatasets.map((dataset) => ({
        type: "Feature",
        id: dataset.id,
        geometry: {
          type: "Point",
          coordinates: [dataset.longitude / 1_000_000, dataset.latitude / 1_000_000],
        },
        properties: {
          name: dataset.name,
          description: dataset.description,
          dataType: dataset.dataType,
          status: dataset.status,
          owner: dataset.owner,
          isPublic: dataset.isPublic,
          metadataFrozen: dataset.metadataFrozen,
          verified: dataset.verified,
          verifiedBy: dataset.verifiedBy,
          verifiedAt: dataset.verifiedAt,
          collectionDate: dataset.collectionDate,
          createdAt: dataset.createdAt,
          altitudeMin: dataset.altitudeMin,
          altitudeMax: dataset.altitudeMax,
          ipfsHash: dataset.ipfsHash,
        },
      })),
    };

    triggerDownload(
      new Blob([JSON.stringify(featureCollection, null, 2)], { type: "application/geo+json;charset=utf-8" }),
      `atmos-filtered-${activeTab}-${Date.now()}.geojson`,
    );
    setStatusMessage(`Exported ${filteredDatasets.length} filtered datasets (GeoJSON).`);
  };
  const exportPinnedDatasets = () => {
    if (!pinnedDatasets.length || typeof window === "undefined") {
      setStatusMessage("No pinned datasets to export.");
      return;
    }
    triggerDownload(
      exportDatasets(asExportable(pinnedDatasets), "json", {
        meta: { totalPinned: pinnedDatasets.length, pinnedDatasetIds },
      }),
      `atmos-pinned-${Date.now()}.json`,
    );
    setStatusMessage(`Exported ${pinnedDatasets.length} pinned datasets.`);
  };
  const exportPinnedDatasetsCsv = () => {
    if (!pinnedDatasets.length || typeof window === "undefined") {
      setStatusMessage("No pinned datasets to export.");
      return;
    }
    triggerDownload(
      exportDatasets(asExportable(pinnedDatasets), "csv", {
        csv: { columns: ["id", "name", "description", "dataType", "status", "owner", "isPublic", "metadataFrozen", "verified", "verifiedBy", "verifiedAt", "collectionDate", "createdAt", "altitudeMin", "altitudeMax", "latitude", "longitude", "ipfsHash"] },
      }),
      `atmos-pinned-${Date.now()}.csv`,
    );
    setStatusMessage(`Exported ${pinnedDatasets.length} pinned datasets (CSV).`);
  };
  const exportPinnedDatasetsGeoJson = () => {
    if (!pinnedDatasets.length || typeof window === "undefined") {
      setStatusMessage("No pinned datasets to export.");
      return;
    }

    const featureCollection = {
      type: "FeatureCollection",
      generatedAt: new Date().toISOString(),
      totalPinned: pinnedDatasets.length,
      pinnedDatasetIds,
      features: pinnedDatasets.map((dataset) => ({
        type: "Feature",
        id: dataset.id,
        geometry: {
          type: "Point",
          coordinates: [dataset.longitude / 1_000_000, dataset.latitude / 1_000_000],
        },
        properties: {
          name: dataset.name,
          description: dataset.description,
          dataType: dataset.dataType,
          status: dataset.status,
          owner: dataset.owner,
          isPublic: dataset.isPublic,
          metadataFrozen: dataset.metadataFrozen,
          verified: dataset.verified,
          verifiedBy: dataset.verifiedBy,
          verifiedAt: dataset.verifiedAt,
          collectionDate: dataset.collectionDate,
          createdAt: dataset.createdAt,
          altitudeMin: dataset.altitudeMin,
          altitudeMax: dataset.altitudeMax,
          ipfsHash: dataset.ipfsHash,
        },
      })),
    };

    const blob = new Blob([JSON.stringify(featureCollection, null, 2)], {
      type: "application/geo+json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `atmos-pinned-${Date.now()}.geojson`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setStatusMessage(`Exported ${pinnedDatasets.length} pinned datasets (GeoJSON).`);
  };
  const exportSingleDatasetJson = (dataset: Dataset) => {
    if (typeof window === "undefined") {
      setStatusMessage("Export unavailable.");
      return;
    }
    const payload = {
      generatedAt: new Date().toISOString(),
      contract: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
      dataset,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `atmos-dataset-${dataset.id}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setStatusMessage(`Exported dataset #${dataset.id} (JSON).`);
  };
  const copyDatasetJson = async (dataset: Dataset) => {
    await copyText(
      JSON.stringify(dataset, null, 2),
      `Dataset #${dataset.id} JSON`,
    );
  };
  const copyDatasetGeoJsonFeature = async (dataset: Dataset) => {
    const feature = {
      type: "Feature",
      id: dataset.id,
      geometry: {
        type: "Point",
        coordinates: [dataset.longitude / 1_000_000, dataset.latitude / 1_000_000],
      },
      properties: {
        name: dataset.name,
        description: dataset.description,
        dataType: dataset.dataType,
        status: dataset.status,
        owner: dataset.owner,
        isPublic: dataset.isPublic,
        metadataFrozen: dataset.metadataFrozen,
        verified: dataset.verified,
        verifiedBy: dataset.verifiedBy,
        verifiedAt: dataset.verifiedAt,
        collectionDate: dataset.collectionDate,
        createdAt: dataset.createdAt,
        altitudeMin: dataset.altitudeMin,
        altitudeMax: dataset.altitudeMax,
        ipfsHash: dataset.ipfsHash,
      },
    };
    await copyText(
      JSON.stringify(feature, null, 2),
      `Dataset #${dataset.id} GeoJSON feature`,
    );
  };
  const buildDatasetMarkdown = (dataset: Dataset) => {
    const detailLink = buildDatasetDetailLink(dataset.id);
    const osmLink = buildMapUrlAt(dataset.latitude, dataset.longitude);
    const googleLink = buildGoogleMapsUrlAt(dataset.latitude, dataset.longitude);
    const ipfsLink = dataset.ipfsHash?.trim()
      ? buildIpfsGatewayUrl(dataset.ipfsHash)
      : "";

    const lines = [
      `## Dataset #${dataset.id}: ${dataset.name}`,
      ``,
      `- Type: ${dataset.dataType}`,
      `- Status: ${dataset.status}`,
      `- Visibility: ${dataset.isPublic ? "Public" : "Private"}`,
      `- Owner: ${dataset.owner}`,
      `- Coordinates: ${formatCoord(dataset.latitude)}, ${formatCoord(dataset.longitude)} (deg)`,
      `- Altitude: ${dataset.altitudeMin}-${dataset.altitudeMax} m`,
      `- Collected: ${formatChainValue(dataset.collectionDate)}`,
      `- Recorded: ${formatChainValue(dataset.createdAt)}`,
      `- IPFS: ${dataset.ipfsHash || "n/a"}`,
      ``,
      `Links:`,
      detailLink ? `- Detail: ${detailLink}` : "",
      osmLink ? `- OpenStreetMap: ${osmLink}` : "",
      googleLink ? `- Google Maps: ${googleLink}` : "",
      ipfsLink ? `- IPFS gateway: ${ipfsLink}` : "",
    ].filter(Boolean);

    return lines.join("\n");
  };
  const copyDatasetMarkdown = async (dataset: Dataset) => {
    await copyText(buildDatasetMarkdown(dataset), `Dataset #${dataset.id} markdown`);
  };
  const exportSingleDatasetMarkdown = (dataset: Dataset) => {
    if (typeof window === "undefined") {
      setStatusMessage("Export unavailable.");
      return;
    }
    const blob = new Blob([`${buildDatasetMarkdown(dataset)}\n`], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `atmos-dataset-${dataset.id}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setStatusMessage(`Exported dataset #${dataset.id} (Markdown).`);
  };
  const copyDatasetReadCurl = async (dataset: Dataset) => {
    const url = `${STACKS_API_BASE_URL}/v2/contracts/call-read/${CONTRACT_ADDRESS}/${CONTRACT_NAME}/get-dataset`;
    const body = JSON.stringify({
      sender: CONTRACT_ADDRESS,
      arguments: [cvToHex(uintCV(dataset.id))],
    });
    const command = `curl -s -X POST "${url}" -H "Content-Type: application/json" -d '${body}'`;
    await copyText(command, `Dataset #${dataset.id} cURL`);
  };
  const openRandomFilteredDataset = () => {
    if (!sortedDatasets.length) {
      setStatusMessage("No filtered datasets available.");
      return;
    }
    const randomIndex = Math.floor(Math.random() * sortedDatasets.length);
    const dataset = sortedDatasets[randomIndex];
    openDatasetDetail(dataset.id);
    setStatusMessage(`Opened random dataset #${dataset.id}.`);
  };
  const copyFilterSummary = async () => {
    const summaryParts = [
      `Tab: ${activeTab}`,
      `Results: ${filteredDatasets.length}/${activeDatasets.length}`,
      `Sort: ${sortMode}`,
      filters.search ? `Search: ${filters.search}` : "",
      filters.tags ? `Tags: ${filters.tags}` : "",
      filters.status !== "all" ? `Status: ${filters.status}` : "",
      filters.visibility !== "all" ? `Visibility: ${filters.visibility}` : "",
      filters.verified !== "all" ? `Verified: ${filters.verified}` : "",
      filters.frozen !== "all" ? `Frozen: ${filters.frozen}` : "",
      filters.ipfs !== "all" ? `IPFS: ${filters.ipfs}` : "",
      filters.dataType !== "all" ? `Type: ${filters.dataType}` : "",
      filters.owner ? `Owner: ${filters.owner}` : "",
      filters.altitudeMin ? `Altitude min: ${filters.altitudeMin}` : "",
      filters.altitudeMax ? `Altitude max: ${filters.altitudeMax}` : "",
      watchlistOnly ? "Watchlist only: yes" : "",
      compareSelectionIds.length
        ? `Compare: ${compareSelectionIds.join(", ")}`
        : "",
    ].filter((item) => Boolean(item));

    await copyText(summaryParts.join(" | "), "Filter summary");
  };
  const copyDatasetsApiPath = async () => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.tags) params.set("tags", filters.tags);
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.visibility !== "all") params.set("visibility", filters.visibility);
    if (filters.verified === "verified") params.set("verified", "true");
    if (filters.verified === "unverified") params.set("verified", "false");
    if (filters.frozen === "frozen") params.set("metadataFrozen", "true");
    if (filters.frozen === "mutable") params.set("metadataFrozen", "false");
    if (filters.dataType !== "all") params.set("dataType", filters.dataType);
    if (filters.owner) params.set("owner", filters.owner);
    if (filters.altitudeMin) params.set("altitudeMin", filters.altitudeMin);
    if (filters.altitudeMax) params.set("altitudeMax", filters.altitudeMax);
    const query = params.toString();
    const path = `/datasets${query ? `?${query}` : ""}`;
    await copyText(path, "Datasets API path");
  };
  const clearCompareSelection = () => {
    setCompareSelectionIds([]);
    setStatusMessage("Cleared compare selection.");
  };
  const copyVisibleDatasetIds = async () => {
    if (!sortedDatasets.length) {
      setStatusMessage("No visible dataset IDs to copy.");
      return;
    }
    await copyText(
      sortedDatasets.map((dataset) => String(dataset.id)).join(", "),
      "Visible dataset IDs",
    );
  };
  const copyVisibleDatasetsCsv = async () => {
    if (!sortedDatasets.length) {
      setStatusMessage("No visible datasets to copy.");
      return;
    }

    const escapeCsv = (value: unknown) => {
      const raw = value === null || value === undefined ? "" : String(value);
      const needsQuotes = /[",\n\r]/.test(raw);
      const escaped = raw.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    };

    const maxRows = 200;
    const rows = sortedDatasets.slice(0, maxRows);

    const columns = [
      "id",
      "name",
      "dataType",
      "status",
      "isPublic",
      "owner",
      "latitude",
      "longitude",
      "ipfsHash",
    ];

    const lines = [
      columns.join(","),
      ...rows.map((dataset) =>
        [
          dataset.id,
          dataset.name,
          dataset.dataType,
          dataset.status,
          dataset.isPublic,
          dataset.owner,
          formatCoord(dataset.latitude),
          formatCoord(dataset.longitude),
          dataset.ipfsHash ?? "",
        ]
          .map(escapeCsv)
          .join(","),
      ),
    ];

    await copyText(
      `\uFEFF${lines.join("\n")}`,
      `Visible datasets CSV (${rows.length}${sortedDatasets.length > maxRows ? "+" : ""})`,
    );
    if (sortedDatasets.length > maxRows) {
      setStatusMessage(`Copied first ${maxRows} visible datasets (CSV).`);
    }
  };
  const copyVisibleCoordsCsv = async () => {
    if (!sortedDatasets.length) {
      setStatusMessage("No visible coordinates to copy.");
      return;
    }

    const lines = [
      "id,latitude,longitude",
      ...sortedDatasets.map(
        (dataset) =>
          `${dataset.id},${formatCoord(dataset.latitude)},${formatCoord(dataset.longitude)}`,
      ),
    ];

    await copyText(lines.join("\n"), `Coordinates CSV (${sortedDatasets.length})`);
  };
  const copyVisibleDatasetLinks = async () => {
    if (!sortedDatasets.length) {
      setStatusMessage("No visible dataset links to copy.");
      return;
    }
    if (typeof window === "undefined") {
      setStatusMessage("Dataset links unavailable.");
      return;
    }
    const links = sortedDatasets
      .map((dataset) => buildDatasetDetailLink(dataset.id))
      .filter((link) => Boolean(link));

    if (!links.length) {
      setStatusMessage("No visible dataset links to copy.");
      return;
    }

    await copyText(
      Array.from(new Set(links)).join("\n"),
      `Dataset links (${links.length})`,
    );
  };
  const copyVisibleOwners = async () => {
    if (!sortedDatasets.length) {
      setStatusMessage("No visible dataset owners to copy.");
      return;
    }
    await copyText(
      Array.from(new Set(sortedDatasets.map((dataset) => dataset.owner))).join(
        ", ",
      ),
      "Visible owners",
    );
  };
  const copyVisibleDatasetNames = async () => {
    if (!sortedDatasets.length) {
      setStatusMessage("No visible dataset names to copy.");
      return;
    }
    await copyText(
      sortedDatasets.map((dataset) => dataset.name).join(", "),
      "Visible dataset names",
    );
  };
  const copyVisibleStatuses = async () => {
    if (!sortedDatasets.length) {
      setStatusMessage("No visible dataset statuses to copy.");
      return;
    }
    await copyText(
      sortedDatasets
        .map((dataset) => `#${dataset.id}:${dataset.status}`)
        .join(", "),
      "Visible dataset statuses",
    );
  };
  const copyVisibleMarkdownTable = async () => {
    if (!sortedDatasets.length) {
      setStatusMessage("No visible datasets to copy.");
      return;
    }

    const escapeCell = (value: unknown) =>
      String(value ?? "")
        .replace(/\r?\n/g, "<br/>")
        .replace(/\|/g, "\\|")
        .trim();

    const maxRows = 200;
    const rows = sortedDatasets.slice(0, maxRows);

    const header = [
      "id",
      "name",
      "type",
      "status",
      "public",
      "owner",
      "ipfs",
    ];

    const lines = [
      `| ${header.join(" | ")} |`,
      `| ${header.map(() => "---").join(" | ")} |`,
      ...rows.map((dataset) => {
        const ipfs = dataset.ipfsHash?.trim() ? dataset.ipfsHash.trim() : "";
        return `| ${[
          dataset.id,
          escapeCell(dataset.name),
          escapeCell(dataset.dataType),
          escapeCell(dataset.status),
          dataset.isPublic ? "yes" : "no",
          escapeCell(dataset.owner),
          escapeCell(ipfs),
        ].join(" | ")} |`;
      }),
    ];

    await copyText(lines.join("\n"), `Markdown table (${rows.length} rows)`);
  };
  const copyVisibleGeoJson = async () => {
    if (!sortedDatasets.length) {
      setStatusMessage("No visible datasets to copy.");
      return;
    }

    const maxRows = 200;
    const rows = sortedDatasets.slice(0, maxRows);
    const featureCollection = {
      type: "FeatureCollection",
      generatedAt: new Date().toISOString(),
      features: rows.map((dataset) => ({
        type: "Feature",
        id: dataset.id,
        geometry: {
          type: "Point",
          coordinates: [dataset.longitude / 1_000_000, dataset.latitude / 1_000_000],
        },
        properties: {
          name: dataset.name,
          dataType: dataset.dataType,
          status: dataset.status,
          owner: dataset.owner,
          isPublic: dataset.isPublic,
          altitudeMin: dataset.altitudeMin,
          altitudeMax: dataset.altitudeMax,
          collectionDate: dataset.collectionDate,
          createdAt: dataset.createdAt,
          ipfsHash: dataset.ipfsHash ?? "",
        },
      })),
    };

    await copyText(
      JSON.stringify(featureCollection, null, 2),
      `GeoJSON (${rows.length}${sortedDatasets.length > maxRows ? "+" : ""})`,
    );
    if (sortedDatasets.length > maxRows) {
      setStatusMessage(`Copied first ${maxRows} visible datasets (GeoJSON).`);
    }
  };
  const useVisibleAsWatchlist = () => {
    const nextIds = Array.from(
      new Set(sortedDatasets.map((dataset) => String(dataset.id))),
    );
    setWatchlistIds(nextIds);
    setWatchlistInput(nextIds.join(", "));
    setStatusMessage(
      `Watchlist updated with ${nextIds.length} visible datasets.`,
    );
  };
  const addVisibleToWatchlist = () => {
    const visibleIds = Array.from(
      new Set(sortedDatasets.map((dataset) => String(dataset.id))),
    );
    if (!visibleIds.length) {
      setStatusMessage("No visible datasets available.");
      return;
    }

    setWatchlistIds((prev) => {
      const merged = Array.from(new Set([...prev, ...visibleIds]));
      const addedCount = merged.length - prev.length;
      setWatchlistInput(merged.join(", "));
      setStatusMessage(
        addedCount === 0
          ? "All visible datasets are already in the watchlist."
          : `Added ${addedCount} visible ${addedCount === 1 ? "dataset" : "datasets"} to the watchlist.`,
      );
      return merged;
    });
  };
  const removeVisibleFromWatchlist = () => {
    const visibleSet = new Set(
      sortedDatasets.map((dataset) => String(dataset.id)),
    );
    if (visibleSet.size === 0) {
      setStatusMessage("No visible datasets available.");
      return;
    }

    setWatchlistIds((prev) => {
      if (!prev.length) {
        setStatusMessage("Watchlist is already empty.");
        return prev;
      }
      const next = prev.filter((id) => !visibleSet.has(id));
      const removedCount = prev.length - next.length;
      setWatchlistInput(next.join(", "));
      setStatusMessage(
        removedCount === 0
          ? "No visible datasets were in the watchlist."
          : `Removed ${removedCount} visible ${removedCount === 1 ? "dataset" : "datasets"} from the watchlist.`,
      );
      return next;
    });
  };
  const addVisibleToPins = () => {
    const visibleIds = Array.from(
      new Set(sortedDatasets.map((dataset) => String(dataset.id))),
    );
    if (!visibleIds.length) {
      setStatusMessage("No visible datasets available.");
      return;
    }

    setPinnedDatasetIds((prev) => {
      const existing = new Set(prev);
      const added = visibleIds.filter((id) => !existing.has(id));
      if (added.length === 0) {
        setStatusMessage("All visible datasets are already pinned.");
        return prev;
      }
      setStatusMessage(
        `Pinned ${added.length} visible ${added.length === 1 ? "dataset" : "datasets"}.`,
      );
      return [...added, ...prev];
    });
  };
  const useVisibleAsPins = () => {
    const nextIds = Array.from(
      new Set(sortedDatasets.map((dataset) => String(dataset.id))),
    );
    if (!nextIds.length) {
      setStatusMessage("No visible datasets available.");
      return;
    }
    setPinnedDatasetIds(nextIds);
    setStatusMessage(`Pinned list updated with ${nextIds.length} visible datasets.`);
  };
  const removeVisibleFromPins = () => {
    const visibleSet = new Set(
      sortedDatasets.map((dataset) => String(dataset.id)),
    );
    if (visibleSet.size === 0) {
      setStatusMessage("No visible datasets available.");
      return;
    }

    setPinnedDatasetIds((prev) => {
      if (!prev.length) {
        setStatusMessage("Pinned list is already empty.");
        return prev;
      }
      const next = prev.filter((id) => !visibleSet.has(id));
      const removedCount = prev.length - next.length;
      setStatusMessage(
        removedCount === 0
          ? "No visible datasets were pinned."
          : `Unpinned ${removedCount} visible ${removedCount === 1 ? "dataset" : "datasets"}.`,
      );
      return next;
    });
  };
  const clearPins = () => {
    if (pinnedDatasetIds.length === 0) {
      setStatusMessage("Pinned list is already empty.");
      return;
    }
    setPinnedDatasetIds([]);
    setStatusMessage("Cleared pinned datasets.");
  };
  const copyPinnedDatasetIds = async () => {
    if (!pinnedDatasetIds.length) {
      setStatusMessage("No pinned dataset IDs to copy.");
      return;
    }
    await copyText(pinnedDatasetIds.join(", "), `Pinned dataset IDs (${pinnedDatasetIds.length})`);
  };
  const copyVisibleIpfsHashes = async () => {
    const hashes = sortedDatasets
      .map((dataset) => dataset.ipfsHash.trim())
      .filter((hash) => Boolean(hash));
    if (!hashes.length) {
      setStatusMessage("No visible IPFS hashes to copy.");
      return;
    }
    await copyText(
      Array.from(new Set(hashes)).join(", "),
      "Visible IPFS hashes",
    );
  };
  const auditTopVisibleDataset = () => {
    if (!sortedDatasets.length) {
      setStatusMessage("No visible datasets available.");
      return;
    }
    const dataset = sortedDatasets[0];
    setLineageTarget(dataset.id);
    setStatusMessage(`Opened audit trail for dataset #${dataset.id}.`);
  };
  const compareTopVisibleDatasets = () => {
    const nextIds = sortedDatasets
      .slice(0, 4)
      .map((dataset) => String(dataset.id));
    if (!nextIds.length) {
      setStatusMessage("No visible datasets available for compare.");
      return;
    }
    setCompareSelectionIds(nextIds);
    setStatusMessage(`Loaded ${nextIds.length} visible datasets into compare.`);
  };
  const clearWatchlist = () => {
    setWatchlistIds([]);
    setWatchlistInput("");
    setWatchlistOnly(false);
    setStatusMessage("Cleared watchlist.");
  };
  const clearAllDatasetNotes = () => {
    const count = Object.keys(datasetNotes).length;
    if (!count) {
      setStatusMessage("No private notes to clear.");
      return;
    }
    setDatasetNotes({});
    setStatusMessage(
      `Cleared ${count} private ${count === 1 ? "note" : "notes"}.`,
    );
  };
  const copyDatasetSummary = async (dataset: Dataset) => {
    const note = datasetNotes[String(dataset.id)]?.trim();
    const lines = [
      `Dataset #${dataset.id}: ${dataset.name}`,
      `Type: ${dataset.dataType}`,
      `Status: ${dataset.status}`,
      `Visibility: ${dataset.isPublic ? "Public" : "Private"}`,
      `Owner: ${dataset.owner}`,
      `Coordinates: ${formatCoord(dataset.latitude)}, ${formatCoord(dataset.longitude)}`,
      `Altitude: ${dataset.altitudeMin}-${dataset.altitudeMax} m`,
      `Collection date: ${formatChainValue(dataset.collectionDate)}`,
      `Created at: ${formatChainValue(dataset.createdAt)}`,
      `IPFS: ${dataset.ipfsHash || "n/a"}`,
      `Description: ${dataset.description}`,
      note ? `Private note: ${note}` : "",
    ].filter(Boolean);
    await copyText(lines.join("\n"), `Dataset #${dataset.id} summary`);
  };
  const copyDatasetCitation = async (dataset: Dataset) => {
    const detailLink = buildDatasetDetailLink(dataset.id);
    const accessedAt = new Date().toISOString().slice(0, 10);
    const citation = [
      `${dataset.name}.`,
      `Atmos Registry dataset #${dataset.id}.`,
      `Type: ${dataset.dataType}.`,
      `Owner: ${dataset.owner}.`,
      `Collection date: ${formatChainValue(dataset.collectionDate)}.`,
      `Recorded: ${formatChainValue(dataset.createdAt)}.`,
      detailLink ? `Available at: ${detailLink}.` : "",
      `Accessed: ${accessedAt}.`,
    ]
      .filter(Boolean)
      .join(" ");

    await copyText(citation, `Dataset #${dataset.id} citation`);
  };
  const toggleWatchlistDataset = (datasetId: number) => {
    const id = String(datasetId);
    setWatchlistIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };
  const togglePinnedDataset = (datasetId: number) => {
    const id = String(datasetId);
    setPinnedDatasetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [id, ...prev],
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
        sortMode,
      },
    };
    setSavedViews((prev) => [next, ...prev].slice(0, 20));
    setSavedViewName("");
    setStatusMessage(`Saved view: ${name}`);
  };
  const applySavedView = (view: SavedView) => {
    setActiveTab(view.payload.activeTab);
    setFilters({ ...defaultFilters, ...(view.payload.filters ?? {}) });
    setGeoTimePercent(Math.max(0, Math.min(100, view.payload.geoTimePercent)));
    setCompareSelectionIds(view.payload.compareSelectionIds);
    setWatchlistOnly(view.payload.watchlistOnly);
    setWatchlistIds(view.payload.watchlistIds);
    setMutedAlertKinds(view.payload.mutedAlertKinds);
    if (view.payload.sortMode) setSortMode(view.payload.sortMode);
    setStatusMessage(`Applied view: ${view.name}`);
  };
  const deleteSavedView = (viewId: string) => {
    setSavedViews((prev) => prev.filter((view) => view.id !== viewId));
  };
  const renameSavedView = (viewId: string) => {
    if (typeof window === "undefined") {
      setStatusMessage("Rename unavailable.");
      return;
    }

    const target = savedViews.find((view) => view.id === viewId);
    if (!target) {
      setStatusMessage("Saved view not found.");
      return;
    }

    const nextName = window.prompt("Rename saved view", target.name);
    if (nextName === null) {
      return;
    }

    const trimmed = nextName.trim();
    if (!trimmed) {
      setStatusMessage("Saved view name cannot be empty.");
      return;
    }

    setSavedViews((prev) =>
      prev.map((view) =>
        view.id === viewId
          ? {
              ...view,
              name: trimmed,
            }
          : view,
      ),
    );
    setStatusMessage(`Renamed view: ${trimmed}`);
  };

  const normalizeSavedViewsImport = (raw: unknown): SavedView[] | null => {
    const unwrap = (value: any) => {
      if (value && typeof value === "object" && Array.isArray(value.savedViews)) {
        return value.savedViews;
      }
      return value;
    };

    const items = unwrap(raw);
    if (!Array.isArray(items)) {
      return null;
    }

    const next: SavedView[] = [];
    items.forEach((candidate) => {
      if (!candidate || typeof candidate !== "object") return;

      const id = String((candidate as any).id ?? "").trim();
      const name = String((candidate as any).name ?? "").trim();
      const createdAtRaw = Number((candidate as any).createdAt ?? 0);
      const payload = (candidate as any).payload;

      if (!id || !name || !payload || typeof payload !== "object") return;

      const filters = {
        ...defaultFilters,
        ...((payload as any).filters ?? {}),
      };

      const geoTimePercent = Math.max(
        0,
        Math.min(
          100,
          Number.parseInt(String((payload as any).geoTimePercent ?? 100), 10) || 100,
        ),
      );

      const compareSelectionIds = Array.isArray((payload as any).compareSelectionIds)
        ? (payload as any).compareSelectionIds.filter(
            (value: any) => typeof value === "string" && /^\d+$/.test(value),
          )
        : [];

      const watchlistIds = Array.isArray((payload as any).watchlistIds)
        ? (payload as any).watchlistIds.filter(
            (value: any) => typeof value === "string" && /^\d+$/.test(value),
          )
        : [];

      const mutedAlertKinds = Array.isArray((payload as any).mutedAlertKinds)
        ? (payload as any).mutedAlertKinds.filter(
            (value: any) => typeof value === "string",
          )
        : [];

      next.push({
        id,
        name,
        createdAt:
          Number.isFinite(createdAtRaw) && createdAtRaw > 0 ? createdAtRaw : nowUnix(),
        payload: {
          activeTab: (payload as any).activeTab === "mine" ? "mine" : "explore",
          filters,
          geoTimePercent,
          compareSelectionIds,
          watchlistOnly: Boolean((payload as any).watchlistOnly),
          watchlistIds,
          mutedAlertKinds,
        },
      });
    });

    return next;
  };

  const exportSavedViewsJson = () => {
    if (typeof window === "undefined") {
      setStatusMessage("Export unavailable.");
      return;
    }
    if (savedViews.length === 0) {
      setStatusMessage("No saved views to export.");
      return;
    }

    const payload = {
      version: 1,
      exportedAt: nowUnix(),
      app: "atmos",
      savedViews,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `atmos-saved-views-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setStatusMessage(`Exported ${savedViews.length} saved views (JSON).`);
  };

  const importSavedViewsJson = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const normalized = normalizeSavedViewsImport(parsed);
      if (!normalized) {
        setStatusMessage("Invalid saved views file.");
        return;
      }

      setSavedViews((prev) => {
        const byId = new Map<string, SavedView>();
        prev.forEach((view) => byId.set(view.id, view));
        normalized.forEach((view) => byId.set(view.id, view));
        return Array.from(byId.values())
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 20);
      });

      setStatusMessage(`Imported ${normalized.length} saved view(s).`);
    } catch {
      setStatusMessage("Failed to import saved views.");
    }
  };
  const exportLocalDataBackup = () => {
    if (typeof window === "undefined") {
      setStatusMessage("Export unavailable.");
      return;
    }
    const payload = {
      version: 1,
      exportedAt: nowUnix(),
      app: "atmos",
      kind: "local-data-backup",
      pinnedDatasetIds,
      watchlistIds,
      datasetNotes,
      savedViews,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `atmos-backup-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setStatusMessage(
      "Exported backup (pins, watchlist, notes, saved views).",
    );
  };
  const importLocalDataBackup = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as any;
      if (
        !parsed ||
        typeof parsed !== "object" ||
        parsed.kind !== "local-data-backup"
      ) {
        setStatusMessage("Invalid backup file.");
        return;
      }

      const numericIds = (value: unknown) =>
        Array.isArray(value)
          ? Array.from(
              new Set(
                value.filter(
                  (item) => typeof item === "string" && /^\d+$/.test(item),
                ),
              ),
            )
          : null;

      const pins = numericIds(parsed.pinnedDatasetIds);
      const watch = numericIds(parsed.watchlistIds);

      let notes: Record<string, string> | null = null;
      if (
        parsed.datasetNotes &&
        typeof parsed.datasetNotes === "object" &&
        !Array.isArray(parsed.datasetNotes)
      ) {
        const next: Record<string, string> = {};
        Object.entries(parsed.datasetNotes).forEach(([key, value]) => {
          if (!/^\d+$/.test(key)) return;
          if (typeof value !== "string" || !value.trim()) return;
          next[key] = value;
        });
        notes = next;
      }

      const views = normalizeSavedViewsImport(parsed.savedViews);

      if (!pins && !watch && !notes && !views) {
        setStatusMessage("Backup file contains no restorable data.");
        return;
      }

      const summary: string[] = [];
      if (pins) {
        setPinnedDatasetIds(pins);
        summary.push(`${pins.length} pins`);
      }
      if (watch) {
        setWatchlistIds(watch);
        setWatchlistInput(watch.join(", "));
        summary.push(`${watch.length} watched`);
      }
      if (notes) {
        setDatasetNotes(notes);
        summary.push(`${Object.keys(notes).length} notes`);
      }
      if (views) {
        setSavedViews(
          views.sort((a, b) => b.createdAt - a.createdAt).slice(0, 20),
        );
        summary.push(`${views.length} saved views`);
      }
      setStatusMessage(`Restored backup: ${summary.join(", ")}.`);
    } catch {
      setStatusMessage("Failed to restore backup.");
    }
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
      if (typeof window !== "undefined") {
        if (copyToastTimeoutRef.current !== null) {
          window.clearTimeout(copyToastTimeoutRef.current);
        }
        copyToastTimeoutRef.current = window.setTimeout(() => {
          setStatusMessage("");
        }, 1200);
      }
    } catch {
      setStatusMessage(`Unable to copy ${label.toLowerCase()}.`);
    }
  };
  const normalizeIpfsCid = (pointer: string) => {
    const trimmed = (pointer ?? "").trim();
    if (!trimmed) return "";

    let cid = trimmed;
    if (cid.startsWith("ipfs://")) {
      cid = cid.slice("ipfs://".length);
    }

    const urlMatch = cid.match(/\/ipfs\/([^/?#]+)/);
    if (urlMatch) {
      cid = urlMatch[1];
    }

    cid = cid.replace(/^\/?ipfs\//, "").split(/[?#]/)[0].trim();
    return cid;
  };
  const openIpfsGateway = (pointer: string) => {
    if (typeof window === "undefined") {
      setStatusMessage("IPFS gateway unavailable.");
      return;
    }

    const cid = normalizeIpfsCid(pointer);
    if (!cid) {
      setStatusMessage("IPFS hash is invalid.");
      return;
    }

    const gatewayUrl = `https://ipfs.io/ipfs/${encodeURIComponent(cid)}`;
    const opened = window.open(gatewayUrl, "_blank", "noopener,noreferrer");
    if (!opened) {
      setStatusMessage("Popup blocked. Allow popups to open IPFS.");
      return;
    }
    setStatusMessage("Opened IPFS gateway.");
  };
  const buildIpfsGatewayUrl = (pointer: string) => {
    const cid = normalizeIpfsCid(pointer);
    if (!cid) {
      return "";
    }
    return `https://ipfs.io/ipfs/${encodeURIComponent(cid)}`;
  };
  const copyIpfsGatewayUrl = async (pointer: string) => {
    const gatewayUrl = buildIpfsGatewayUrl(pointer);
    if (!gatewayUrl) {
      setStatusMessage("IPFS hash is invalid.");
      return;
    }
    await copyText(gatewayUrl, "IPFS gateway URL");
  };
  const getIpfsHealth = (pointer: string) => {
    const cid = normalizeIpfsCid(pointer);
    if (!cid) return "unchecked" as const;
    return ipfsHealthByCid[cid]?.status ?? ("unchecked" as const);
  };
  const getIpfsCheckedAt = (pointer: string) => {
    const cid = normalizeIpfsCid(pointer);
    if (!cid) return 0;
    return ipfsHealthByCid[cid]?.checkedAt ?? 0;
  };
  const checkIpfsGateway = async (pointer: string) => {
    if (typeof window === "undefined") {
      setStatusMessage("IPFS check unavailable.");
      return;
    }

    const cid = normalizeIpfsCid(pointer);
    if (!cid) {
      setStatusMessage("IPFS hash is invalid.");
      return;
    }

    setIpfsHealthByCid((prev) => ({
      ...prev,
      [cid]: { status: "checking", checkedAt: nowUnix() },
    }));

    const targets = [
      {
        label: "Cloudflare IPFS",
        url: `https://cloudflare-ipfs.com/ipfs/${encodeURIComponent(cid)}`,
      },
      { label: "ipfs.io", url: `https://ipfs.io/ipfs/${encodeURIComponent(cid)}` },
    ];

    setStatusMessage(`Checking IPFS availability (${cid.slice(0, 10)}...)`);

    for (const target of targets) {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 8_000);
      try {
        const response = await fetch(target.url, {
          method: "HEAD",
          signal: controller.signal,
        });
        if (response.ok) {
          setIpfsHealthByCid((prev) => ({
            ...prev,
            [cid]: { status: "ok", checkedAt: nowUnix() },
          }));
          setStatusMessage(
            `IPFS available via ${target.label} (${response.status}).`,
          );
          return;
        }
      } catch {
        // ignore
      } finally {
        window.clearTimeout(timeout);
      }
    }

    setIpfsHealthByCid((prev) => ({
      ...prev,
      [cid]: { status: "fail", checkedAt: nowUnix() },
    }));
    setStatusMessage("Unable to verify IPFS availability right now.");
  };
  const clearLocalCache = () => {
    if (typeof window === "undefined") {
      setStatusMessage("Local cache unavailable.");
      return;
    }

    const confirmed = window.confirm(
      "Clear locally stored app data (drafts, notes, saved views, recent commands, pinned datasets, watchlist, alerts, and tx history) for this browser?",
    );
    if (!confirmed) {
      return;
    }

    try {
      window.localStorage.removeItem(REGISTER_DRAFT_KEY);
      window.localStorage.removeItem(REGISTER_DRAFT_BACKUP_KEY);
      window.localStorage.removeItem(RECENT_COMMANDS_KEY);
      window.localStorage.removeItem(RECENT_DATASETS_KEY);
      window.localStorage.removeItem(PINNED_DATASETS_KEY);
      window.localStorage.removeItem(WATCHLIST_DATASETS_KEY);
      window.localStorage.removeItem(DATASET_NOTES_KEY);
      window.localStorage.removeItem(SAVED_VIEWS_KEY);
      window.localStorage.removeItem(DATASET_DENSITY_KEY);
      window.localStorage.removeItem(FEATURE_TAB_KEY);
    } catch {
      // ignore
    }

    txCenter.clearAll();
    setSavedViews([]);
    setSavedViewName("");
    setRecentCommandIds([]);
    setRecentDatasetIds([]);
    setPinnedDatasetIds([]);
    setDatasetNotes({});
    setWatchlistOnly(false);
    setWatchlistInput("");
    setWatchlistIds([]);
    setMutedAlertKinds([]);
    setReadAlertIds([]);
    setDismissedAlertIds([]);
    setRegisterForm(defaultRegisterForm);
    setRegisterTouched({});
    setRegisterSubmitAttempted(false);
    setRegisterDraftBackup(null);
    setDatasetDensity("comfortable");
    setFeatureTab("datasets");
    setStatusMessage("Cleared local cache.");
  };
  const buildStacksExplorerUrl = (path: string) => {
    const trimmed = (path ?? "").trim().replace(/^\/+/, "");
    if (!trimmed) return "";
    return `https://explorer.hiro.so/${trimmed}?chain=mainnet`;
  };
  const openStacksExplorer = (path: string, label: string) => {
    if (typeof window === "undefined") {
      setStatusMessage(`${label} unavailable.`);
      return;
    }
    const trimmed = (path ?? "").trim().replace(/^\/+/, "");
    if (!trimmed) {
      setStatusMessage(`${label} path is empty.`);
      return;
    }

    const explorerUrl = buildStacksExplorerUrl(trimmed);
    const opened = window.open(explorerUrl, "_blank", "noopener,noreferrer");
    if (!opened) {
      setStatusMessage(`Popup blocked. Allow popups to open ${label}.`);
      return;
    }
    setStatusMessage(`Opened ${label}.`);
  };
  const copyStacksExplorerUrl = async (path: string, label: string) => {
    const explorerUrl = buildStacksExplorerUrl(path);
    if (!explorerUrl) {
      setStatusMessage(`${label} path is empty.`);
      return;
    }
    await copyText(explorerUrl, label);
  };
  const openOwnerInExplorer = (owner: string) => {
    const value = (owner ?? "").trim();
    if (!value) {
      setStatusMessage("Owner is empty.");
      return;
    }
    openStacksExplorer(`address/${encodeURIComponent(value)}`, "Owner explorer");
  };
  const openContractInExplorer = () => {
    openStacksExplorer(
      `address/${encodeURIComponent(`${CONTRACT_ADDRESS}.${CONTRACT_NAME}`)}`,
      "Contract explorer",
    );
  };
  const copyContractExplorerUrl = async () => {
    await copyStacksExplorerUrl(
      `address/${encodeURIComponent(`${CONTRACT_ADDRESS}.${CONTRACT_NAME}`)}`,
      "Contract explorer URL",
    );
  };
  const buildMapUrlAt = (latitudeMicro: number, longitudeMicro: number) => {
    const lat = latitudeMicro / 1_000_000;
    const lon = longitudeMicro / 1_000_000;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return "";
    }
    return `https://www.openstreetmap.org/?mlat=${encodeURIComponent(
      lat,
    )}&mlon=${encodeURIComponent(lon)}#map=11/${encodeURIComponent(
      lat,
    )}/${encodeURIComponent(lon)}`;
  };
  const buildGoogleMapsUrlAt = (latitudeMicro: number, longitudeMicro: number) => {
    const lat = latitudeMicro / 1_000_000;
    const lon = longitudeMicro / 1_000_000;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return "";
    }
    return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lon}`)}&z=11`;
  };
  const openMapAt = (latitudeMicro: number, longitudeMicro: number) => {
    if (typeof window === "undefined") {
      setStatusMessage("Map unavailable.");
      return;
    }

    const url = buildMapUrlAt(latitudeMicro, longitudeMicro);
    if (!url) {
      setStatusMessage("Coordinates are invalid.");
      return;
    }
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      setStatusMessage("Popup blocked. Allow popups to open the map.");
      return;
    }
    setStatusMessage("Opened map.");
  };
  const openGoogleMapsAt = (latitudeMicro: number, longitudeMicro: number) => {
    if (typeof window === "undefined") {
      setStatusMessage("Map unavailable.");
      return;
    }

    const url = buildGoogleMapsUrlAt(latitudeMicro, longitudeMicro);
    if (!url) {
      setStatusMessage("Coordinates are invalid.");
      return;
    }
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      setStatusMessage("Popup blocked. Allow popups to open the map.");
      return;
    }
    setStatusMessage("Opened Google Maps.");
  };
  const openGeoAppAt = (
    latitudeMicro: number,
    longitudeMicro: number,
    label?: string,
  ) => {
    if (typeof window === "undefined") {
      setStatusMessage("Maps app unavailable.");
      return;
    }
    const uri = toGeoUriFromMicroDegrees(latitudeMicro, longitudeMicro, { label });
    if (!uri) {
      setStatusMessage("Coordinates are invalid.");
      return;
    }
    window.location.href = uri;
    setStatusMessage("Opening in maps app…");
  };
  const copyGeoBbox = async () => {
    const candidates = geoDatasets.map((dataset) => ({
      latitude: fromMicroDegrees(dataset.latitude) ?? NaN,
      longitude: fromMicroDegrees(dataset.longitude) ?? NaN,
    })) as unknown as import("../atmos-sdk/src").DatasetMetadata[];
    const bbox = getCoordBounds(candidates);
    if (!bbox) {
      setStatusMessage("No coordinates to compute a bounding box from.");
      return;
    }
    const param = toBboxQueryParam(bbox);
    if (!param) {
      setStatusMessage("Bounding box is invalid.");
      return;
    }
    await copyText(param, "Bounding box");
  };
  const copyMapUrlAt = async (latitudeMicro: number, longitudeMicro: number) => {
    const url = buildMapUrlAt(latitudeMicro, longitudeMicro);
    if (!url) {
      setStatusMessage("Coordinates are invalid.");
      return;
    }
    await copyText(url, "Map URL");
  };
  const copyGoogleMapsUrlAt = async (
    latitudeMicro: number,
    longitudeMicro: number,
  ) => {
    const url = buildGoogleMapsUrlAt(latitudeMicro, longitudeMicro);
    if (!url) {
      setStatusMessage("Coordinates are invalid.");
      return;
    }
    await copyText(url, "Google Maps URL");
  };
  const scrollToTop = () => {
    if (typeof window === "undefined") {
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        sortMode,
      },
    };
    setSavedViews((prev) => [next, ...prev].slice(0, 20));
    setStatusMessage(`Saved view: ${fallbackName}`);
  };
  const copyShareLink = async () => {
    if (typeof window === "undefined") {
      setStatusMessage("Share link unavailable.");
      return;
    }
    const label = hasActiveFilters ? "Filter link" : "Share link";
    await copyText(window.location.href, label);
  };
  const shareCurrentView = async () => {
    if (typeof window === "undefined") {
      setStatusMessage("Share link unavailable.");
      return;
    }
    const url = window.location.href;
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: document.title, url });
        setStatusMessage("Shared current view.");
        return;
      } catch {
        // User dismissed the share sheet, or it failed — fall back to copying.
      }
    }
    await copyText(url, "Share link");
  };
  const copySavedViewShareLink = async (view: SavedView) => {
    if (typeof window === "undefined") {
      setStatusMessage("Share link unavailable.");
      return;
    }
    const search = buildUrlViewSearch({
      activeTab: view.payload.activeTab,
      filters: { ...defaultFilters, ...(view.payload.filters ?? {}) },
      geoTimePercent: view.payload.geoTimePercent,
      compareSelectionIds: view.payload.compareSelectionIds,
      watchlistOnly: view.payload.watchlistOnly,
      watchlistIds: view.payload.watchlistIds,
      mutedAlertKinds: view.payload.mutedAlertKinds,
      sortMode: view.payload.sortMode ?? "quality-desc",
      lineageSelectionId: "",
      selectedGeoDatasetId: "",
      showDatasetDetail: false,
    });
    const link = `${window.location.origin}${window.location.pathname}${search}`;
    await copyText(link, `Link for "${view.name}"`);
  };
  const buildDatasetDetailLink = (datasetId: number) => {
    if (typeof window === "undefined") {
      return "";
    }
    // A dataset share link points at one dataset only. We intentionally drop the
    // current filters, watchlist, and compare selection so the link is clean and
    // doesn't leak the sharer's working state. Full-view sharing has its own
    // "Copy share link" button (copyShareLink).
    const nextSearch = buildUrlViewSearch({
      activeTab: "explore",
      filters: defaultFilters,
      geoTimePercent: 100,
      compareSelectionIds: [],
      watchlistOnly: false,
      watchlistIds: [],
      mutedAlertKinds: [],
      sortMode: "quality-desc",
      lineageSelectionId: String(datasetId),
      selectedGeoDatasetId: "",
      showDatasetDetail: true,
    });
    return `${window.location.origin}${window.location.pathname}${nextSearch}${window.location.hash}`;
  };
  const copyDatasetDetailLink = async (datasetId: number) => {
    const link = buildDatasetDetailLink(datasetId);
    if (!link) {
      setStatusMessage("Share link unavailable.");
      return;
    }
    await copyText(link, "Dataset link");
  };
  const executeCommand = (action: CommandAction) => {
    action.run();
    setShowCommandPalette(false);
    setCommandQuery("");
    setRecentCommandIds((prev) => {
      const next = [action.id, ...prev.filter((id) => id !== action.id)];
      return next.slice(0, 6);
    });
  };
  const clearRegisterForm = () => {
    setRegisterDraftBackup(registerForm);
    setRegisterForm(emptyRegisterForm);
    setRegisterTouched({});
    setRegisterSubmitAttempted(false);
    setTxStatus("Form cleared. Restore draft to bring back your last inputs.");
  };
  const restoreRegisterDraft = () => {
    if (!registerDraftBackup) {
      setTxStatus("No cleared draft available to restore.");
      return;
    }
    setRegisterForm(registerDraftBackup);
    setRegisterTouched({});
    setRegisterSubmitAttempted(false);
    setTxStatus("Restored the last cleared draft.");
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
    try {
      disconnectConnect();
      const result = await connect({
        defaultProviders: getConnectProviders(),
        forceWalletSelect: true,
        network: "mainnet",
      });
      const address = result.addresses.find((entry) => entry.address.startsWith("SP"))?.address
        ?? result.addresses[0]?.address
        ?? "";
      setWalletAddress(address);
      setWalletMessage(
        address ? "Wallet connected." : "Wallet connected, address unavailable.",
      );
      if (address) {
        setOwnerInput(address);
        loadTokenSnapshot(address);
      }
    } catch (error) {
      setWalletMessage(
        "Unable to open wallet connector. Check extension or browser popups.",
      );
    }
  };

  const disconnectWallet = () => {
    disconnectConnect();
    userSession.signUserOut(window.location.origin);
    setWalletAddress("");
    setMyDatasets([]);
    setOwnerInput("");
    setOwnerAddress("");
    autoLoadedOwnerRef.current = "";
    setWalletMessage("Wallet disconnected.");
    loadTokenSnapshot(CONTRACT_ADDRESS);
  };

  const requestContractCall = async ({
    functionName,
    functionArgs,
    onFinish,
    onCancel,
    postConditions,
    postConditionMode,
    contractName,
  }: {
    functionName: string;
    functionArgs: any[];
    onFinish: (data: { txId: string }) => void;
    onCancel: () => void;
    postConditions?: any[];
    postConditionMode?: PostConditionMode;
    contractName: string;
  }) => {
    const feePromise = estimateContractCallFee({
      stacksApiBaseUrl: STACKS_CORE_NODE_URL,
      contractAddress: CONTRACT_ADDRESS,
      contractName,
      functionName,
      functionArgs,
    });
    const noncePromise = estimateNextNonce({
      stacksApiBaseUrl: STACKS_CORE_NODE_URL,
      stxAddress: walletAddress,
    });

    const uiReady = await ensureConnectUi();
    if (!uiReady) {
      throw new Error("Wallet UI failed to load.");
    }

    const fee = await Promise.race([
      feePromise,
      new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 2500)),
    ]);
    const nonce = await Promise.race([
      noncePromise,
      new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 2500)),
    ]);

    try {
      const result = await request(
        {
          defaultProviders: getConnectProviders(),
        },
        "stx_callContract",
        {
          address: walletAddress as any,
          network: "mainnet",
          contract: `${CONTRACT_ADDRESS}.${contractName}` as any,
          functionName,
          functionArgs,
          fee: fee ?? undefined,
          nonce: typeof nonce === "number" ? nonce : undefined,
          postConditions: postConditions ?? [],
          postConditionMode: postConditionModeName(postConditionMode),
        },
      );

      if (!result.txid) {
        throw new Error("Wallet did not return a transaction id.");
      }
      onFinish({ txId: result.txid });
    } catch (error: any) {
      if (String(error?.message ?? "").toLowerCase().includes("cancel")) {
        onCancel();
        return;
      }
      throw error;
    }
  };

  const handleRegisterSubmit = async () => {
    setRegisterSubmitAttempted(true);
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
    if (Object.keys(registerValidation.issues).length > 0) {
      setTxStatus("Fix the highlighted fields before opening the wallet.");
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

    const functionArgs = [
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
    ];

    setTxStatus("Preparing transaction...");
    setRegisterSubmitting(true);
    try {
      const feePromise = estimateContractCallFee({
        stacksApiBaseUrl: STACKS_CORE_NODE_URL,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: "register-dataset",
        functionArgs,
      });
      const noncePromise = estimateNextNonce({
        stacksApiBaseUrl: STACKS_CORE_NODE_URL,
        stxAddress: walletAddress,
      });

      const uiReady = await ensureConnectUi();
      if (!uiReady) {
        setTxStatus("Wallet UI failed to load. Refresh and try again.");
        return;
      }

      // Don't block forever on fee estimation. If it takes too long, let the wallet estimate.
      const fee = await Promise.race([
        feePromise,
        new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 2500)),
      ]);
      const nonce = await Promise.race([
        noncePromise,
        new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 2500)),
      ]);

      setTxStatus("Opening wallet for transaction approval...");
      const result = await request(
        {
          defaultProviders: getConnectProviders(),
        },
        "stx_callContract",
        {
          address: walletAddress as any,
          network: "mainnet",
          contract: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}` as any,
          functionName: "register-dataset",
          functionArgs,
          fee: fee ?? undefined,
          nonce: typeof nonce === "number" ? nonce : undefined,
          postConditions: [],
          postConditionMode: "allow",
        },
      );
      if (!result.txid) {
        throw new Error("Wallet did not return a transaction id.");
      }
      setTxStatus(`Transaction submitted: ${result.txid}`);
      txCenter.addTx(result.txid, "Register dataset");
      loadLatest();
      setRegisterForm(defaultRegisterForm);
      setRegisterDraftBackup(null);
      setRegisterTouched({});
      setRegisterSubmitAttempted(false);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(REGISTER_DRAFT_KEY);
        window.localStorage.removeItem(REGISTER_DRAFT_BACKUP_KEY);
      }
    } catch (error: any) {
      if (String(error?.message ?? "").toLowerCase().includes("cancel")) {
        setTxStatus("Transaction canceled.");
        return;
      }
      setTxStatus("Unable to open the wallet transaction popup.");
    } finally {
      setRegisterSubmitting(false);
    }
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
    if (functionName === "stake" && tokenSnapshot && amount > tokenSnapshot.balance) {
      setStakeStatus(
        `Insufficient balance. Available: ${formatTokenAmount(tokenSnapshot.balance, tokenSnapshot.decimals)} ${tokenSnapshot.symbol}.`,
      );
      return;
    }
    setStakeStatus("Opening wallet for staking approval...");
    try {
      const assetContractId =
        `${CONTRACT_ADDRESS}.${TOKEN_CONTRACT_NAME}` as `${string}.${string}`;
      const shouldGuardSpend = functionName === "stake";
      const postConditions = shouldGuardSpend
        ? [
            Pc.principal(walletAddress)
              .willSendLte(BigInt(amount))
              .ft(assetContractId, "atmos-token"),
          ]
        : [];
      await requestContractCall({
        contractName: STAKING_CONTRACT_NAME,
        functionName,
        functionArgs: [uintCV(amount)],
        postConditions,
        postConditionMode: shouldGuardSpend
          ? PostConditionMode.Deny
          : PostConditionMode.Allow,
         onFinish: (data) => {
           setStakeStatus(`Transaction submitted: ${data.txId}`);
           txCenter.addTx(
             data.txId,
             functionName === "stake" ? "Stake ATMOS" : "Unstake ATMOS",
           );
           loadTokenSnapshot(walletAddress);
         },
         onCancel: () => {
           setStakeStatus("Transaction canceled.");
         },
      });
    } catch {
      setStakeStatus("Unable to open the wallet transaction popup.");
    }
  };

  const handleClaimRewards = async () => {
    if (!walletAddress) {
      setStakeStatus("Connect your wallet to claim rewards.");
      return;
    }
    setStakeStatus("Opening wallet to claim rewards...");
    try {
      await requestContractCall({
        contractName: STAKING_CONTRACT_NAME,
        functionName: "claim-rewards",
        functionArgs: [],
        postConditionMode: PostConditionMode.Allow,
         onFinish: (data) => {
           setStakeStatus(`Claim submitted: ${data.txId}`);
           txCenter.addTx(data.txId, "Claim rewards");
           loadTokenSnapshot(walletAddress);
         },
         onCancel: () => {
           setStakeStatus("Claim canceled.");
         },
      });
    } catch {
      setStakeStatus("Unable to open the wallet transaction popup.");
    }
  };

  // ── Clardex handlers ─────────────────────────────────────
  const loadClardexPoolState = async () => {
    setClardexPoolLoading(true);
    setClardexPoolError("");
    try {
      const state = await fetchPoolState(network, clardexPool, senderAddress);
      setClardexPoolState(state);
    } catch {
      setClardexPoolError("Failed to fetch pool state. Check the pool address.");
    } finally {
      setClardexPoolLoading(false);
    }
  };

  const fetchClardexQuote = async () => {
    const amount = parseFloat(clardexAmountIn);
    if (!clardexAmountIn || isNaN(amount) || amount <= 0) {
      setClardexQuoteError("Enter a valid amount.");
      return;
    }
    setClardexQuoteLoading(true);
    setClardexQuoteError("");
    setClardexQuote(null);
    try {
      const quote =
        clardexDirection === "x-to-y"
          ? await fetchQuoteXForY(network, clardexPool, amount, senderAddress)
          : await fetchQuoteYForX(network, clardexPool, amount, senderAddress);
      setClardexQuote(quote);
    } catch {
      setClardexQuoteError("Quote fetch failed. The pool may not be initialized.");
    } finally {
      setClardexQuoteLoading(false);
    }
  };

  const handleClardexSwap = async () => {
    if (!walletAddress) {
      setClardexSwapStatus("Connect your wallet to swap.");
      return;
    }
    const amount = parseFloat(clardexAmountIn);
    const minOut = parseFloat(clardexMinOut);
    if (isNaN(amount) || amount <= 0) {
      setClardexSwapStatus("Enter a valid amount.");
      return;
    }
    setClardexSwapLoading(true);
    setClardexSwapStatus("Opening wallet for swap approval…");
    try {
      const contractCall = buildSwapCall({
        pool: clardexPool,
        tokenX: clardexTokenX,
        tokenY: clardexTokenY,
        amountIn: amount,
        minOut: isNaN(minOut) ? 0 : minOut,
        recipient: walletAddress,
        deadline: Math.floor(Date.now() / 1000) + 600,
        direction: clardexDirection,
      });
      const uiReady = await ensureConnectUi();
      if (!uiReady) throw new Error("Wallet UI failed to load.");
      const result = await request(
        { defaultProviders: getConnectProviders() },
        "stx_callContract",
        {
          address: walletAddress as any,
          network: "mainnet",
          contract: `${contractCall.contractAddress}.${contractCall.contractName}` as any,
          functionName: contractCall.functionName,
          functionArgs: contractCall.functionArgs,
          postConditionMode: "allow",
        },
      );
      if (!result.txid) throw new Error("No txid returned.");
      setClardexSwapStatus(`Swap submitted. Tx: ${result.txid}`);
    } catch (error: any) {
      const msg = String(error?.message ?? "");
      if (msg.toLowerCase().includes("cancel")) {
        setClardexSwapStatus("Swap cancelled.");
      } else {
        setClardexSwapStatus(`Swap failed: ${msg || "Unknown error"}`);
      }
    } finally {
      setClardexSwapLoading(false);
    }
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
      if (safeIsSignedIn(userSession)) {
        const address = getUserAddress(userSession);
        setWalletAddress(address);
        loadTokenSnapshot(address);
        return;
      }
      const address = getStoredStacksAddress();
      if (address) {
        setWalletAddress(address);
        setOwnerInput(address);
        loadTokenSnapshot(address);
      }
    };

    hydrateSession();
    loadLatest();
    loadTokenSnapshot(CONTRACT_ADDRESS);
    fetchContractPaused();
  }, []);
  useEffect(() => {
    loadTokenSnapshot(walletAddress || CONTRACT_ADDRESS);
  }, [walletAddress]);
  useEffect(() => {
    if (!walletAddress) {
      setStxBalanceMicro(null);
      return;
    }
    const controller = new AbortController();
    (async () => {
      try {
        const response = await fetch(
          `${STACKS_API_BASE_URL}/extended/v1/address/${encodeURIComponent(walletAddress)}/balances`,
          { signal: controller.signal },
        );
        if (!response.ok) return;
        const json = (await response.json()) as { stx?: { balance?: string } };
        const micro = Number(json.stx?.balance ?? "");
        setStxBalanceMicro(Number.isFinite(micro) ? micro : null);
      } catch {
        // leave the balance hidden when the API is unreachable
      }
    })();
    return () => controller.abort();
  }, [walletAddress]);
  // On the "Mine" tab, load the connected wallet's datasets automatically the
  // first time we have an address, so the user doesn't have to click "Use
  // wallet". Lazy (only when the tab is active) to avoid a contract read at
  // startup, and skipped once the user has chosen any address manually.
  useEffect(() => {
    if (activeTab !== "mine") return;
    if (!walletAddress) return;
    if (ownerAddress.trim()) return;
    if (autoLoadedOwnerRef.current === walletAddress) return;
    autoLoadedOwnerRef.current = walletAddress;
    setOwnerAddress(walletAddress);
    setOwnerInput(walletAddress);
    loadOwnerDatasets(walletAddress);
  }, [activeTab, walletAddress, ownerAddress]);
  // Surface in-flight transactions in the browser tab title so users tracking a
  // confirmation in a background tab get a glanceable "(2) Atmos Registry".
  useEffect(() => {
    if (typeof document === "undefined") return;
    const base = baseTitleRef.current || "Atmos Registry";
    document.title =
      txCenter.pendingCount > 0 ? `(${txCenter.pendingCount}) ${base}` : base;
  }, [txCenter.pendingCount]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlState = parseUrlViewState(window.location.search);
    setActiveTab(urlState.activeTab);
    setFilters(urlState.filters);
    setGeoTimePercent(urlState.geoTimePercent);
    setCompareSelectionIds(urlState.compareSelectionIds);
    setWatchlistOnly(urlState.watchlistOnly);
    setWatchlistIds(urlState.watchlistIds);
    setMutedAlertKinds(urlState.mutedAlertKinds);
    setSortMode(urlState.sortMode);
    setLineageSelectionId(urlState.lineageSelectionId);
    setSelectedGeoDatasetId(urlState.selectedGeoDatasetId);
    setShowDatasetDetail(urlState.showDatasetDetail);
    hasHydratedUrlRef.current = true;
  }, []);
  useEffect(() => {
    if (typeof window === "undefined" || !hasHydratedUrlRef.current) return;
    const nextSearch = buildUrlViewSearch({
      activeTab,
      filters,
      geoTimePercent,
      compareSelectionIds,
      watchlistOnly,
      watchlistIds,
      mutedAlertKinds,
      sortMode,
      lineageSelectionId,
      selectedGeoDatasetId,
      showDatasetDetail,
    });
    const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);
  }, [
    activeTab,
    filters,
    geoTimePercent,
    compareSelectionIds,
    watchlistOnly,
    watchlistIds,
    mutedAlertKinds,
    sortMode,
    lineageSelectionId,
    selectedGeoDatasetId,
    showDatasetDetail,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (activeTab !== "explore") return;

    if (exploreFetchTimerRef.current) {
      window.clearTimeout(exploreFetchTimerRef.current);
    }

    exploreFetchTimerRef.current = window.setTimeout(() => {
      void loadLatest();
    }, 300);

    return () => {
      if (exploreFetchTimerRef.current) {
        window.clearTimeout(exploreFetchTimerRef.current);
        exploreFetchTimerRef.current = null;
      }
    };
  }, [
    activeTab,
    atmosApiUrl,
    filters.search,
    filters.tags,
    filters.visibility,
    filters.verified,
    filters.frozen,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [featureTab]);

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
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        Boolean(target) &&
        (target?.isContentEditable ||
          target?.tagName === "INPUT" ||
          target?.tagName === "TEXTAREA" ||
          target?.tagName === "SELECT");
      if (isTypingTarget) {
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
      if (event.key === "?" || (event.shiftKey && event.key === "/")) {
        event.preventDefault();
        setShowKeyboardShortcuts(true);
      }
      if (
        event.key === "/" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();
        if (featureTab !== "datasets") {
          setShowDatasetDetail(false);
          setFeatureTab("datasets");
          if (typeof window !== "undefined") {
            window.setTimeout(() => searchInputRef.current?.focus(), 0);
          }
          return;
        }
        searchInputRef.current?.focus();
      }
      if (event.key.toLowerCase() === "t") {
        event.preventDefault();
        setShowTxCenter((prev) => !prev);
      }
      if (event.key.toLowerCase() === "a") {
        event.preventDefault();
        setFeatureTab((prev) => (prev === "alerts" ? "datasets" : "alerts"));
      }
      if (event.key.toLowerCase() === "d") {
        if (featureTab !== "datasets") return;
        event.preventDefault();
        setDatasetDensity((prev) =>
          prev === "comfortable" ? "compact" : "comfortable",
        );
        setStatusMessage("Toggled dataset density.");
      }
      if (
        event.key.toLowerCase() === "p" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        if (showDatasetDetail && lineageDataset) {
          event.preventDefault();
          const pinned = pinnedDatasetIds.includes(String(lineageDataset.id));
          togglePinnedDataset(lineageDataset.id);
          setStatusMessage(
            pinned
              ? `Unpinned dataset #${lineageDataset.id}.`
              : `Pinned dataset #${lineageDataset.id}.`,
          );
          return;
        }

        if (featureTab === "datasets") {
          event.preventDefault();
          setFilters((prev) => {
            const next = !prev.pinnedOnly;
            setStatusMessage(next ? "Pinned only enabled." : "Pinned only disabled.");
            return { ...prev, pinnedOnly: next };
          });
        }
      }
      if (event.key === "Escape") {
        setShowCommandPalette(false);
        setShowKeyboardShortcuts(false);
        setShowDatasetDetail(false);
        setShowTxCenter(false);
        setStatusMessage("");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [featureTab, lineageDataset, pinnedDatasetIds, showDatasetDetail]);

  const keyboardShortcuts = useMemo(
    () => [
      { keys: "?", description: "Open this keyboard shortcuts panel" },
      { keys: "Ctrl/Cmd + K", description: "Open the command palette" },
      {
        keys: "/",
        description: "Focus dataset search when you are in the datasets view",
      },
      { keys: "A", description: "Toggle the alerts view" },
      { keys: "T", description: "Toggle the transaction center" },
      { keys: "D", description: "Toggle dataset density (Comfort/Compact)" },
      { keys: "P", description: "Toggle pinned-only (or pin dataset in detail)" },
      { keys: "Esc", description: "Close open panels and overlays" },
    ],
    [],
  );

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);
  // Bridge every status message into a floating toast, then clear the source so
  // identical consecutive messages still re-trigger. Keeps the newest 4 visible.
  useEffect(() => {
    if (!statusMessage) return;
    const id = (toastIdRef.current += 1);
    const variant = inferToastVariant(statusMessage);
    setToasts((prev) => [
      ...prev.slice(-3),
      { id, message: statusMessage, variant },
    ]);
    setStatusMessage("");
  }, [statusMessage]);
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const syncScrollState = () => {
      setShowBackToTop(window.scrollY > 520);
    };

    syncScrollState();
    window.addEventListener("scroll", syncScrollState, { passive: true });
    return () => window.removeEventListener("scroll", syncScrollState);
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
    walletAddress
      ? {
          id: "wallet-disconnect",
          label: "Disconnect Wallet",
          detail: "Sign out and clear the connected address",
          group: "Other",
          run: () => {
            disconnectWallet();
          },
        }
      : {
          id: "wallet-connect",
          label: "Connect Wallet",
          detail: "Open the wallet connector",
          group: "Other",
          run: () => {
            connectWallet();
          },
        },
    ...(walletAddress
      ? ([
          {
            id: "wallet-copy-address",
            label: "Copy Wallet Address",
            detail: "Copy the connected Stacks address",
            group: "Other",
            run: () => {
              copyText(walletAddress, "Wallet address");
            },
          },
          {
            id: "wallet-open-explorer",
            label: "Open Wallet in Explorer",
            detail: "Open the connected address on Hiro Explorer",
            group: "Other",
            run: () => {
              if (typeof window === "undefined") {
                setStatusMessage("Explorer unavailable.");
                return;
              }
              const href = `https://explorer.hiro.so/address/${encodeURIComponent(
                walletAddress,
              )}?chain=mainnet`;
              window.open(href, "_blank", "noopener,noreferrer");
            },
          },
        ] as CommandAction[])
      : []),
    {
      id: "toggle-tx-center",
      label: showTxCenter ? "Close Transactions" : "Open Transactions",
      detail: "Open or close the transaction center panel",
      group: "Navigation",
      run: () => {
        setShowTxCenter((prev) => !prev);
      },
    },
    {
      id: "refresh-txs",
      label: "Refresh Transactions",
      detail: "Poll pending transactions now",
      group: "Data",
      run: () => {
        txCenter.refreshNow();
        setShowTxCenter(true);
      },
    },
    {
      id: "clear-txs",
      label: "Clear Transactions",
      detail: "Remove all tracked transactions",
      group: "Data",
      run: () => {
        txCenter.clearAll();
        setShowTxCenter(true);
      },
    },
    {
      id: "copy-share-link",
      label: "Copy Share Link",
      detail: "Copy the current page URL",
      group: "Data",
      run: () => {
        copyShareLink();
      },
    },
    {
      id: "copy-filter-summary",
      label: "Copy Filter Summary",
      detail: "Copy active tab, filters, and counts",
      group: "Data",
      run: () => {
        copyFilterSummary();
      },
    },
    {
      id: "sort-altitude-range-asc",
      label: "Sort by Altitude Range (narrowest first)",
      detail: "Surface datasets with the most precise altitude span first",
      group: "Data",
      run: () => {
        setSortMode("altitude-range-asc");
      },
    },
    {
      id: "sort-type-asc",
      label: "Sort by Data Type (A–Z)",
      detail: "Group datasets alphabetically by data type",
      group: "Data",
      run: () => {
        setSortMode("type-asc");
      },
    },
    {
      id: "sort-quality-desc",
      label: "Sort by Quality Score",
      detail: "Order datasets by quality score, highest first",
      group: "Data",
      run: () => {
        setSortMode("quality-desc");
      },
    },
    {
      id: "sort-completeness-desc",
      label: "Sort by Completeness",
      detail: "Surface datasets with the most metadata fields filled in first",
      group: "Data",
      run: () => {
        setSortMode("completeness-desc");
      },
    },
    {
      id: "sort-recent-desc",
      label: "Sort by Recent (Newest First)",
      detail: "Jump to the most recently collected datasets",
      group: "Data",
      run: () => {
        setSortMode("recent-desc");
      },
    },
    {
      id: "sort-freshness-desc",
      label: "Sort by Freshness",
      detail: "Order datasets by recency-decayed freshness score, freshest first",
      group: "Data",
      run: () => {
        setSortMode("freshness-desc");
      },
    },
    {
      id: "copy-visible-dataset-links",
      label: "Copy Visible Dataset Links",
      detail: "Copy share links for all visible datasets",
      group: "Data",
      run: () => {
        copyVisibleDatasetLinks();
      },
    },
    {
      id: "copy-visible-dataset-ids",
      label: "Copy Visible Dataset IDs",
      detail: "Copy the IDs for the visible datasets",
      group: "Data",
      run: () => {
        copyVisibleDatasetIds();
      },
    },
    {
      id: "copy-visible-coords-csv",
      label: "Copy Visible Coords CSV",
      detail: "Copy id/lat/lon CSV for visible datasets",
      group: "Data",
      run: () => {
        copyVisibleCoordsCsv();
      },
    },
    {
      id: "copy-visible-datasets-csv",
      label: "Copy Visible Datasets CSV",
      detail: "Copy a CSV snapshot of visible datasets",
      group: "Data",
      run: () => {
        copyVisibleDatasetsCsv();
      },
    },
    {
      id: "copy-visible-owners",
      label: "Copy Visible Owners",
      detail: "Copy unique owner addresses from visible datasets",
      group: "Data",
      run: () => {
        copyVisibleOwners();
      },
    },
    {
      id: "toggle-pinned-only",
      label: filters.pinnedOnly ? "Disable Pinned Only" : "Enable Pinned Only",
      detail: "Toggle filtering to pinned datasets only",
      group: "Data",
      run: () => {
        setFilters((prev) => {
          const next = !prev.pinnedOnly;
          setStatusMessage(next ? "Pinned only enabled." : "Pinned only disabled.");
          return { ...prev, pinnedOnly: next };
        });
      },
    },
    {
      id: "pin-visible-datasets",
      label: "Pin Visible Datasets",
      detail: "Add all visible datasets to pinned list",
      group: "Data",
      run: () => {
        addVisibleToPins();
      },
    },
    {
      id: "pin-visible-datasets-replace",
      label: "Pin Visible Datasets (Replace)",
      detail: "Replace pinned list with the visible datasets",
      group: "Data",
      run: () => {
        useVisibleAsPins();
      },
    },
    {
      id: "unpin-visible-datasets",
      label: "Unpin Visible Datasets",
      detail: "Remove visible datasets from pinned list",
      group: "Data",
      run: () => {
        removeVisibleFromPins();
      },
    },
    {
      id: "copy-pinned-dataset-ids",
      label: "Copy Pinned Dataset IDs",
      detail: "Copy pinned dataset IDs as a comma-separated list",
      group: "Data",
      run: () => {
        copyPinnedDatasetIds();
      },
    },
    {
      id: "export-pinned-json",
      label: "Export Pinned JSON",
      detail: "Download pinned datasets as JSON",
      group: "Data",
      run: () => {
        exportPinnedDatasets();
      },
    },
    {
      id: "export-pinned-csv",
      label: "Export Pinned CSV",
      detail: "Download pinned datasets as CSV",
      group: "Data",
      run: () => {
        exportPinnedDatasetsCsv();
      },
    },
    {
      id: "export-pinned-geojson",
      label: "Export Pinned GeoJSON",
      detail: "Download pinned datasets as GeoJSON",
      group: "Data",
      run: () => {
        exportPinnedDatasetsGeoJson();
      },
    },
    {
      id: "clear-pins",
      label: "Clear Pins",
      detail: "Remove all pinned datasets",
      group: "Data",
      run: () => {
        clearPins();
      },
    },
    {
      id: "toggle-dataset-density",
      label: "Toggle Dataset Density",
      detail: "Switch between Comfort and Compact views",
      group: "Data",
      run: () => {
        setDatasetDensity((prev) =>
          prev === "comfortable" ? "compact" : "comfortable",
        );
        setStatusMessage("Toggled dataset density.");
      },
    },
    {
      id: "export-filtered-geojson",
      label: "Export Filtered GeoJSON",
      detail: "Download visible datasets as GeoJSON",
      group: "Data",
      run: () => {
        exportFilteredDatasetsGeoJson();
      },
    },
    {
      id: "open-random-dataset",
      label: "Open Random Dataset",
      detail: "Open a random dataset from the current filtered list",
      group: "Navigation",
      run: () => {
        openRandomFilteredDataset();
      },
    },
    {
      id: "sync-mainnet",
      label: "Sync Mainnet",
      detail: "Reload latest on-chain datasets",
      group: "Data",
      run: () => {
        loadLatest();
      },
    },
    {
      id: "tab-explore",
      label: "Switch to Explore",
      detail: "Show latest submissions tab",
      group: "Navigation",
      run: () => {
        setFeatureTab("datasets");
        setActiveTab("explore");
      },
    },
    {
      id: "tab-mine",
      label: "Switch to My Datasets",
      detail: "Show owner dataset tab",
      group: "Navigation",
      run: () => {
        setFeatureTab("datasets");
        setActiveTab("mine");
      },
    },
    {
      id: "tab-datasets",
      label: "Open Datasets",
      detail: "Jump to dataset workflows",
      group: "Navigation",
      run: () => {
        setFeatureTab("datasets");
      },
    },
    {
      id: "tab-staking",
      label: "Open Staking",
      detail: "Jump to staking dashboard",
      group: "Navigation",
      run: () => {
        setFeatureTab("staking");
      },
    },
    {
      id: "tab-alerts",
      label: "Open Alerts",
      detail: "Jump to smart alert center",
      group: "Alerts",
      run: () => {
        setFeatureTab("alerts");
      },
    },
    {
      id: "tab-audit",
      label: "Open Audit",
      detail: "Jump to lineage and audit trail",
      group: "Navigation",
      run: () => {
        setFeatureTab("audit");
      },
    },
    {
      id: "tab-versions",
      label: "Open Versions",
      detail: "Jump to version workflow",
      group: "Navigation",
      run: () => {
        setFeatureTab("versions");
      },
    },
    {
      id: "reset-filters",
      label: "Reset Filters",
      detail: "Clear all dataset filters",
      group: "Data",
      run: () => {
        setFilters(defaultFilters);
      },
    },
    {
      id: "clear-local-cache",
      label: "Clear Local Cache",
      detail: "Remove drafts, notes, saved views, and tx history in this browser",
      group: "Data",
      run: () => {
        clearLocalCache();
      },
    },
    {
      id: "toggle-alerts",
      label: "Toggle Alert Center",
      detail: "Open or close Smart Alerts panel",
      group: "Alerts",
      run: () => {
        setFeatureTab("alerts");
      },
    },
    {
      id: "quick-save-view",
      label: "Quick Save Current View",
      detail: "Store current workspace settings",
      group: "Data",
      run: () => {
        quickSaveCurrentView();
      },
    },
    {
      id: "refresh-staking",
      label: "Refresh Staking",
      detail: "Reload ATMOS token and staking metrics",
      group: "Data",
      run: () => {
        loadTokenSnapshot(walletAddress || CONTRACT_ADDRESS);
      },
    },
    {
      id: "open-first-audit",
      label: "Open First Dataset in Audit",
      detail: "Jump to audit trail for the first filtered dataset",
      group: "Navigation",
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
      group: "Navigation",
      run: () => {
        if (filteredDatasets[0]) {
          openDatasetDetail(filteredDatasets[0].id);
        }
      },
    },
    {
      id: "open-shortcuts",
      label: "Open Keyboard Shortcuts",
      detail: "Show available keyboard controls",
      group: "Navigation",
      run: () => {
        setShowKeyboardShortcuts(true);
      },
    },
  ];
  const recentCommandActions = useMemo(() => {
    if (!recentCommandIds.length) {
      return [];
    }
    const byId = new Map(commandActions.map((action) => [action.id, action]));
    return recentCommandIds
      .map((id) => byId.get(id))
      .filter((action): action is CommandAction => Boolean(action));
  }, [commandActions, recentCommandIds]);
  const filteredCommandActions = commandActions.filter((action) => {
    const query = commandQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      action.label.toLowerCase().includes(query) ||
      action.detail.toLowerCase().includes(query)
    );
  });
  const appNotices = useMemo(() => {
    const notices: Notice[] = [];
    if (contractPaused === true) {
      notices.push({
        id: "contract-paused",
        tone: "critical",
        message: "Contract is paused — read-only mode. Dataset registration and updates are disabled until the contract is unpaused.",
      });
    }
    if (walletMessage) {
      notices.push({ id: "wallet", tone: "info", message: walletMessage });
    }
    if (!dismissedNoIpfsNotice && latestDatasets.length >= 5) {
      const publicDatasets = latestDatasets.filter((d) => d.isPublic);
      if (publicDatasets.length >= 5) {
        const missingIpfs = publicDatasets.filter((d) => !d.ipfsHash?.trim()).length;
        const ratio = missingIpfs / publicDatasets.length;
        if (ratio > 0.3) {
          const pct = Math.round(ratio * 100);
          notices.push({
            id: "no-ipfs-warning",
            tone: "warning",
            message: `${pct}% of public datasets (${missingIpfs}/${publicDatasets.length}) have no IPFS hash. Linking data to IPFS improves discoverability and quality scores.`,
          });
        }
      }
    }
    return [...notices, ...transientNotices];
  }, [transientNotices, walletMessage, contractPaused, latestDatasets, dismissedNoIpfsNotice]);

  return (
    <div className="app">
      <div className="glow-layer" />
      <div className="dashboard">
      <NavBar
        networkLabel={networkLabel}
        featureTab={featureTab}
        onFeatureTabChange={setFeatureTab}
        onMenuAction={(action) => {
          if (typeof window === "undefined") return;
          if (action === "home") {
            setFeatureTab("datasets");
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
          }
          if (action === "add-dataset") {
            setFeatureTab("add-dataset");
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
          }
          if (action === "staking") {
            setFeatureTab("staking");
            return;
          }
          if (action === "alerts") {
            setFeatureTab("alerts");
            return;
          }
          if (action === "audit") {
            setFeatureTab("audit");
            return;
          }
          if (action === "versions") {
            setFeatureTab("versions");
            return;
          }
          if (action === "clardex") {
            setFeatureTab("clardex");
          }
        }}
        loading={loading}
        onSyncMainnet={loadLatest}
        unreadAlertCount={unreadAlertCount}
        unreadAlertLevel={topAlertLevel}
        onToggleAlerts={() => setFeatureTab("alerts")}
        pendingTxCount={txCenter.pendingCount}
        onToggleTxCenter={() => setShowTxCenter((prev) => !prev)}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
        onOpenShortcuts={() => setShowKeyboardShortcuts(true)}
        walletAddress={walletAddress}
        stxBalance={
          stxBalanceMicro === null
            ? ""
            : `${formatTokenAmount(stxBalanceMicro)} STX`
        }
        onConnectWallet={connectWallet}
        onDisconnectWallet={disconnectWallet}
        onOpenContractExplorer={openContractInExplorer}
        onCopyContractExplorerUrl={copyContractExplorerUrl}
        datasetCount={latestDatasets.length}
      />
      <div className="dashboard-body">
      <AppNotices
        notices={appNotices}
        onDismissNotice={(noticeId) => {
          if (noticeId === "contract-paused") return;
          if (noticeId === "wallet") {
            setWalletMessage("");
            return;
          }
          if (noticeId === "no-ipfs-warning") {
            setDismissedNoIpfsNotice(true);
            return;
          }
          setTransientNotices((prev) =>
            prev.filter((notice) => notice.id !== noticeId),
          );
        }}
      />
      <CommandPalette
        open={showCommandPalette}
        query={commandQuery}
        onQueryChange={setCommandQuery}
        actions={filteredCommandActions}
        recentActions={recentCommandActions}
        onClose={() => setShowCommandPalette(false)}
        onSelect={executeCommand}
      />
      <KeyboardShortcutsModal
        open={showKeyboardShortcuts}
        shortcuts={keyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
      />
      <TxCenter
        open={showTxCenter}
        chain="mainnet"
        txs={txCenter.txs}
        onClose={() => setShowTxCenter(false)}
        onClear={txCenter.clearAll}
        onRemove={txCenter.removeTx}
        onRefresh={txCenter.refreshNow}
      />

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
              {pinnedDatasetIds.includes(String(lineageDataset.id)) && (
                <span className="tag tag--pinned">Pinned</span>
              )}
              {lineageDataset.metadataFrozen && (
                <span className="tag tag--frozen">Frozen metadata</span>
              )}
              {lineageDataset.createdAt > 0 && (
                <span
                  className={`tag tag--age ${getAgeColorClass(lineageDataset.createdAt)}`}
                  title={
                    lineageDataset.createdAt > 1_000_000_000
                      ? `Registered ${new Date(lineageDataset.createdAt * 1000).toLocaleString()}`
                      : `Registered ~${createdAtDateLabel(lineageDataset.createdAt)} · block ${lineageDataset.createdAt} (estimated from block height)`
                  }
                >
                  {createdAtAge(lineageDataset.createdAt)}
                </span>
              )}
            </div>
            <div className="detail-grid">
              <article className="detail-card">
                <div className="detail-card__title">Metadata</div>
                <div className="detail-meta-grid">
                  <div>
                    <span>Owner</span>
                    <strong className="detail-meta__value">
                      <span className="detail-meta__text">
                        {lineageDataset.owner}
                      </span>
                      <CopyButton value={lineageDataset.owner} label="owner" />
                    </strong>
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
                      {lineageDataset.createdAt > 0 && (
                        <span className="detail-meta__age">
                          {" "}
                          · {createdAtAge(lineageDataset.createdAt)}
                        </span>
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>IPFS</span>
                    <strong className="detail-meta__value">
                      <span className="detail-meta__text">
                        {lineageDataset.ipfsHash || "n/a"}
                      </span>
                      {lineageDataset.ipfsHash && (
                        <CopyButton
                          value={lineageDataset.ipfsHash}
                          label="IPFS hash"
                        />
                      )}
                    </strong>
                  </div>
                </div>
                <div className="detail-actions">
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => {
                      const pinned = pinnedDatasetIds.includes(
                        String(lineageDataset.id),
                      );
                      togglePinnedDataset(lineageDataset.id);
                      setStatusMessage(
                        pinned
                          ? `Unpinned dataset #${lineageDataset.id}.`
                          : `Pinned dataset #${lineageDataset.id}.`,
                      );
                    }}
                  >
                    {pinnedDatasetIds.includes(String(lineageDataset.id))
                      ? "Unpin"
                      : "Pin"}
                  </button>
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
                    onClick={() => copyDatasetDetailLink(lineageDataset.id)}
                  >
                    Copy link
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => copyDatasetJson(lineageDataset)}
                  >
                    Copy JSON
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => copyDatasetGeoJsonFeature(lineageDataset)}
                  >
                    Copy GeoJSON feature
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => copyDatasetMarkdown(lineageDataset)}
                  >
                    Copy markdown
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => exportSingleDatasetJson(lineageDataset)}
                  >
                    Export JSON
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => exportSingleDatasetMarkdown(lineageDataset)}
                  >
                    Export markdown
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => window.print()}
                    title="Print this dataset's details (action buttons are hidden in the printout)"
                  >
                    Print
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() =>
                      copyText(
                        `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
                        "Contract principal",
                      )
                    }
                  >
                    Copy contract
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={openContractInExplorer}
                  >
                    Open contract
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => copyDatasetReadCurl(lineageDataset)}
                    title="Copy a runnable curl command that reads this dataset from the contract via the Stacks API"
                  >
                    Copy cURL
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => {
                      setRegisterForm(cloneDatasetToRegister(lineageDataset));
                      setRegisterTouched({});
                      setRegisterSubmitAttempted(false);
                      setFeatureTab("add-dataset");
                      setShowDatasetDetail(false);
                      if (typeof window !== "undefined") {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                  >
                    Clone to register
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
                      copyStacksExplorerUrl(
                        `address/${encodeURIComponent(lineageDataset.owner)}`,
                        "Owner explorer URL",
                      )
                    }
                  >
                    Copy owner URL
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => openOwnerInExplorer(lineageDataset.owner)}
                  >
                    Open owner
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() =>
                      copyText(
                        `${formatCoord(lineageDataset.latitude)}, ${formatCoord(lineageDataset.longitude)}`,
                        "Coordinates",
                      )
                    }
                  >
                    Copy coords
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() =>
                      openMapAt(lineageDataset.latitude, lineageDataset.longitude)
                    }
                  >
                    Open map
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() =>
                      openGoogleMapsAt(
                        lineageDataset.latitude,
                        lineageDataset.longitude,
                      )
                    }
                  >
                    Open Google Maps
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() =>
                      copyGoogleMapsUrlAt(
                        lineageDataset.latitude,
                        lineageDataset.longitude,
                      )
                    }
                  >
                    Copy Google Maps URL
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
                  {lineageDataset.ipfsHash?.trim() && (
                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={() => copyIpfsGatewayUrl(lineageDataset.ipfsHash!)}
                    >
                      Copy IPFS URL
                    </button>
                  )}
                  {lineageDataset.ipfsHash?.trim() && (
                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={() => openIpfsGateway(lineageDataset.ipfsHash!)}
                    >
                      Open IPFS
                    </button>
                  )}
                  {lineageDataset.ipfsHash?.trim() && (
                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={() => checkIpfsGateway(lineageDataset.ipfsHash!)}
                    >
                      Check IPFS
                    </button>
                  )}
                </div>
              </article>
              <article className="detail-card">
                <div className="detail-card__title">Private note</div>
                <div className="detail-timeline__meta">
                  Stored only in this browser. Dataset search includes notes.
                </div>
                <div className="note-presets" role="group" aria-label="Note presets">
                  {NOTE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      className="note-preset"
                      type="button"
                      onClick={() =>
                        applyDatasetNotePreset(lineageDataset.id, preset)
                      }
                    >
                      [{preset}]
                    </button>
                  ))}
                </div>
                <textarea
                  value={datasetNotes[String(lineageDataset.id)] ?? ""}
                  onChange={(event) =>
                    updateDatasetNote(
                      lineageDataset.id,
                      event.currentTarget.value,
                    )
                  }
                  placeholder="Add a private note for this dataset..."
                  rows={5}
                />
                <div className="detail-actions">
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() =>
                      copyText(
                        datasetNotes[String(lineageDataset.id)] ?? "",
                        "Dataset note",
                      )
                    }
                    disabled={!datasetNotes[String(lineageDataset.id)]?.trim()}
                  >
                    Copy note
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => updateDatasetNote(lineageDataset.id, "")}
                    disabled={!datasetNotes[String(lineageDataset.id)]?.trim()}
                  >
                    Clear note
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
                    onClick={() => copyText(lineageFingerprint, "Fingerprint")}
                    disabled={!lineageFingerprint}
                  >
                    Copy fingerprint
                  </button>
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
      <main className="content">
        {featureTab === "datasets" && (
          <>
            {/* ── Home banner ─────────────────────────────────── */}
            <div className="home-banner" id="home">
              <div className="home-banner__top">
                <div className="home-banner__heading">
                  <p className="eyebrow">Live registry · Stacks blockchain</p>
                  <h1 className="home-banner__title">
                    <span className="home-banner__title-accent">Climate data</span><br />open and on-chain.
                  </h1>
                  <p className="home-banner__subtitle">
                    Atmospheric datasets anchored with cryptographic proofs — explore, verify, and contribute to a transparent climate data commons.
                  </p>
                  <div className="home-banner__trust">
                    <span className="trust-badge">✓ Cryptographically verified</span>
                    <span className="trust-badge trust-badge--blue">⬡ IPFS-preserved</span>
                    <span className="trust-badge trust-badge--orange">⛓ Stacks blockchain</span>
                    <span className="trust-badge trust-badge--muted">◎ Open protocol</span>
                  </div>
                </div>
                <div className="home-banner__ctas">
                  <button
                    className="primary-btn"
                    onClick={loadLatest}
                    disabled={loading}
                  >
                    {loading ? "Fetching…" : "↻ Refresh data"}
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={openRandomFilteredDataset}
                    disabled={sortedDatasets.length === 0}
                  >
                    ⟳ Explore random
                  </button>
                </div>
              </div>

              {/* Full-width search */}
              <div className="home-search">
                <div className="input-clear home-search__wrap">
                  <span className="home-search__icon" aria-hidden="true">⌕</span>
                  <input
                    ref={searchInputRef}
                    value={filters.search}
                    onChange={updateFilterField("search")}
                    onBlur={(event) => commitRecentSearch(readValue(event))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        commitRecentSearch(
                          (event.currentTarget as HTMLInputElement).value,
                        );
                      }
                    }}
                    placeholder="Search datasets by id, name, description, or hash…"
                    className="home-search__input"
                  />
                  {filters.search ? (
                    <button
                      className="input-clear__btn"
                      type="button"
                      onClick={() => clearFilter("search")}
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  ) : (
                    <kbd className="home-search__kbd">/</kbd>
                  )}
                </div>

                <div className="home-search__row">
                  {/* Quick filter pills */}
                  <div className="quick-filters" aria-label="Quick filters">
                    <button
                      className={`quick-filter${filters.verified === "verified" ? " active" : ""}`}
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          verified: prev.verified === "verified" ? "all" : "verified",
                        }))
                      }
                    >
                      ✓ Verified
                    </button>
                    <button
                      className={`quick-filter${filters.status === "active" ? " active" : ""}`}
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          status: prev.status === "active" ? "all" : "active",
                        }))
                      }
                    >
                      Active
                    </button>
                    <button
                      className={`quick-filter${filters.status === "pending" ? " active" : ""}`}
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          status: prev.status === "pending" ? "all" : "pending",
                        }))
                      }
                    >
                      Pending
                    </button>
                    <button
                      className={`quick-filter${filters.visibility === "public" ? " active" : ""}`}
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          visibility: prev.visibility === "public" ? "all" : "public",
                        }))
                      }
                    >
                      Public
                    </button>
                    <button
                      className={`quick-filter${filters.frozen === "frozen" ? " active" : ""}`}
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          frozen: prev.frozen === "frozen" ? "all" : "frozen",
                        }))
                      }
                    >
                      Frozen
                    </button>
                    <button
                      className={`quick-filter${filters.ipfs === "has-ipfs" ? " active" : ""}`}
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          ipfs: prev.ipfs === "has-ipfs" ? "all" : "has-ipfs",
                        }))
                      }
                    >
                      Has IPFS
                    </button>
                  </div>

                  {/* Lookup by ID */}
                  <div className="home-lookup">
                    <div className="input-clear">
                      <input
                        value={queryId}
                        onChange={(event) => setQueryId(readValue(event))}
                        placeholder="ID lookup…"
                        className="home-lookup__input"
                      />
                      {queryId && (
                        <button
                          className="input-clear__btn"
                          type="button"
                          onClick={() => { setQueryId(""); setQueryResult(null); }}
                          aria-label="Clear ID"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <button
                      className="ghost-btn compact"
                      onClick={handleLookup}
                      disabled={queryLoading}
                    >
                      {queryLoading ? "…" : "Lookup"}
                    </button>
                  </div>
                </div>

                {/* Recent search chips */}
                {recentSearches.length > 0 && (
                  <div className="filter-chips">
                    {recentSearches.map((term) => (
                      <button
                        key={`recent-search-${term}`}
                        className="filter-chip"
                        type="button"
                        onClick={() => {
                          setFilters((prev) => ({ ...prev, search: term }));
                          commitRecentSearch(term);
                          searchInputRef.current?.focus();
                        }}
                        title={`Search: ${term}`}
                      >
                        <span className="filter-chip__label">{term}</span>
                      </button>
                    ))}
                    <button
                      className="filter-chip filter-chip--clear"
                      type="button"
                      onClick={clearRecentSearches}
                      title="Clear recent searches"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Lookup result */}
              {queryResult && (
                <div className="home-lookup-result">
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
                </div>
              )}

              {/* Stat row */}
              <div className="home-stats" aria-label="Registry stats">
                {interfaceSignals.map((item) => (
                  <div key={item.label} className={`home-stat${item.variant ? ` ${item.variant}` : ""}`}>
                    <span className="home-stat__icon" aria-hidden="true">{item.icon}</span>
                    <strong>
                      {item.pending ? (
                        <span className="skeleton skeleton--stat" aria-label="Loading" />
                      ) : item.count !== null ? (
                        <CountUp value={item.count} />
                      ) : (
                        item.value
                      )}
                    </strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {featureTab === "staking" && (
          <section className="section stake-section" id="staking">
            <div className="stake-section-header">
              <div>
                <h2>Staking</h2>
                <p>Stake ATMOS to signal stewardship and earn protocol rewards.</p>
              </div>
              {tokenSnapshot && (
                <div className="stake-apy-hero">
                  <span className="stake-apy-hero__label">Current APY</span>
                  <span className="stake-apy-hero__value">
                    {formatPercentFromBps(tokenSnapshot.apyBps)}
                  </span>
                </div>
              )}
            </div>
            <div className="stake-grid">
              <article className="stake-card stake-card--overview">
                <div className="stake-card__header">
                  <span className="stake-card__title">Protocol overview</span>
                  {tokenSnapshot && (
                    <span className="stake-card__badge">{tokenSnapshot.symbol}</span>
                  )}
                </div>
                <div className="stake-metrics">
                  <div className="stake-stat">
                    <span>Token</span>
                    <strong>{tokenSnapshot ? tokenSnapshot.name : "—"}</strong>
                  </div>
                  <div className="stake-stat stake-stat--highlight">
                    <span>APY</span>
                    <strong>
                      {tokenSnapshot ? formatPercentFromBps(tokenSnapshot.apyBps) : "—"}
                    </strong>
                  </div>
                  <div className="stake-stat">
                    <span>Total supply</span>
                    <strong>
                      {tokenSnapshot
                        ? `${formatTokenAmount(tokenSnapshot.totalSupply, tokenSnapshot.decimals)} ${tokenSnapshot.symbol}`
                        : "—"}
                    </strong>
                  </div>
                  <div className="stake-stat">
                    <span>Total staked</span>
                    <strong>
                      {tokenSnapshot
                        ? `${formatTokenAmount(tokenSnapshot.totalStaked, tokenSnapshot.decimals)} ${tokenSnapshot.symbol}`
                        : "—"}
                    </strong>
                  </div>
                  <div className="stake-stat">
                    <span>Circulating</span>
                    <strong>
                      {tokenSnapshot
                        ? `${formatTokenAmount(tokenSnapshot.totalSupply - tokenSnapshot.totalStaked, tokenSnapshot.decimals)} ${tokenSnapshot.symbol}`
                        : "—"}
                    </strong>
                  </div>
                  <div className="stake-stat">
                    <span>Stakers</span>
                    <strong>—</strong>
                  </div>
                </div>

                {tokenSnapshot && tokenSnapshot.totalSupply > 0 && (
                  <div className="stake-ratio">
                    <div className="stake-ratio__labels">
                      <span>Staked ratio</span>
                      <strong>
                        {((tokenSnapshot.totalStaked / tokenSnapshot.totalSupply) * 100).toFixed(1)}%
                      </strong>
                    </div>
                    <div className="stake-ratio__bar">
                      <div
                        className="stake-ratio__fill"
                        style={{
                          width: `${Math.min(100, (tokenSnapshot.totalStaked / tokenSnapshot.totalSupply) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </article>

              <article className="stake-card">
                <div className="stake-card__header">
                  <span className="stake-card__title">Your position</span>
                  <button
                    className="ghost-btn compact"
                    type="button"
                    onClick={() => loadTokenSnapshot(walletAddress || CONTRACT_ADDRESS)}
                    disabled={tokenLoading}
                  >
                    {tokenLoading ? "Refreshing…" : "Refresh"}
                  </button>
                </div>

                {!walletAddress ? (
                  <div className="stake-connect">
                    <span className="stake-connect__icon">⬡</span>
                    <strong>Wallet not connected</strong>
                    <p>Connect your Stacks wallet to stake ATMOS, earn rewards, and participate in governance.</p>
                    <button
                      className="primary-btn compact"
                      type="button"
                      onClick={connectWallet}
                    >
                      Connect wallet
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="stake-metrics">
                      <div className="stake-stat">
                        <span>Available</span>
                        <strong>
                          {tokenSnapshot
                            ? `${formatTokenAmount(tokenSnapshot.balance, tokenSnapshot.decimals)} ${tokenSnapshot.symbol}`
                            : "—"}
                        </strong>
                      </div>
                      <div className="stake-stat">
                        <span>Staked</span>
                        <strong>
                          {tokenSnapshot
                            ? `${formatTokenAmount(myStakeInfo.amount, tokenSnapshot.decimals)} ${tokenSnapshot.symbol}`
                            : "—"}
                        </strong>
                      </div>
                      <div className="stake-stat">
                        <span>Pool share</span>
                        <strong>
                          {tokenSnapshot && tokenSnapshot.totalStaked > 0
                            ? `${((myStakeInfo.amount / tokenSnapshot.totalStaked) * 100).toFixed(3)}%`
                            : "—"}
                        </strong>
                      </div>
                      <div className="stake-stat stake-stat--highlight">
                        <span>Est. daily reward</span>
                        <strong>
                          {tokenSnapshot && myStakeInfo.amount > 0
                            ? `${formatTokenAmount(
                                Math.floor((myStakeInfo.amount * tokenSnapshot.apyBps) / 10000 / 365),
                                tokenSnapshot.decimals,
                              )} ${tokenSnapshot.symbol}`
                            : "—"}
                        </strong>
                      </div>
                      <div className={`stake-stat${tokenSnapshot && tokenSnapshot.pendingReward > 0 ? " stake-stat--reward" : ""}`}>
                        <span>Pending reward</span>
                        <strong>
                          {tokenSnapshot
                            ? `${formatTokenAmount(tokenSnapshot.pendingReward, tokenSnapshot.decimals)} ${tokenSnapshot.symbol}`
                            : "—"}
                        </strong>
                      </div>
                      <div className="stake-stat">
                        <span>Total claimed</span>
                        <strong>
                          {tokenSnapshot
                            ? `${formatTokenAmount(myStakeInfo.totalClaimed, tokenSnapshot.decimals)} ${tokenSnapshot.symbol}`
                            : "—"}
                        </strong>
                      </div>
                    </div>

                    {tokenSnapshot && (tokenSnapshot.balance + myStakeInfo.amount) > 0 && (
                      <div className="stake-progress">
                        <div className="stake-progress__labels">
                          <span>Your staked portion</span>
                          <strong>
                            {((myStakeInfo.amount / (tokenSnapshot.balance + myStakeInfo.amount)) * 100).toFixed(1)}%
                          </strong>
                        </div>
                        <div className="stake-progress__bar">
                          <div
                            className="stake-progress__fill"
                            style={{
                              width: `${Math.min(100, (myStakeInfo.amount / (tokenSnapshot.balance + myStakeInfo.amount)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="stake-actions">
                      <div className="stake-action-row">
                        <label className="stake-label">Stake</label>
                        <div className="stake-input-group">
                          <input
                            value={stakeAmount}
                            onChange={(event) => setStakeAmount(readValue(event))}
                            placeholder="Amount"
                          />
                          <button
                            className="ghost-btn compact"
                            type="button"
                            onClick={() =>
                              setStakeAmount(microTokenToInputValue(tokenSnapshot?.balance ?? 0))
                            }
                            disabled={
                              tokenLoading || !tokenSnapshot || tokenSnapshot.balance <= 0
                            }
                          >
                            Max
                          </button>
                          <button
                            className="primary-btn compact"
                            type="button"
                            onClick={() => handleStakeAction("stake", stakeAmount)}
                            disabled={
                              tokenLoading || !stakeAmountValue || hasInsufficientStakeBalance
                            }
                          >
                            Stake
                          </button>
                        </div>
                      </div>
                      <div className="stake-action-row">
                        <label className="stake-label">Unstake</label>
                        <div className="stake-input-group">
                          <input
                            value={unstakeAmount}
                            onChange={(event) => setUnstakeAmount(readValue(event))}
                            placeholder="Amount"
                          />
                          <button
                            className="ghost-btn compact"
                            type="button"
                            onClick={() =>
                              setUnstakeAmount(microTokenToInputValue(myStakeInfo.amount))
                            }
                            disabled={
                              tokenLoading || !tokenSnapshot || myStakeInfo.amount <= 0
                            }
                          >
                            Max
                          </button>
                          <button
                            className="primary-btn compact"
                            type="button"
                            onClick={() => handleStakeAction("unstake", unstakeAmount)}
                            disabled={tokenLoading || !unstakeAmountValue}
                          >
                            Unstake
                          </button>
                        </div>
                      </div>
                    </div>

                    {hasInsufficientStakeBalance && tokenSnapshot && (
                      <p className="stake-warning">
                        ⚠ Exceeds available balance ({formatTokenAmount(tokenSnapshot.balance, tokenSnapshot.decimals)}{" "}
                        {tokenSnapshot.symbol})
                      </p>
                    )}

                    <div className="stake-footer">
                      <button
                        className={`stake-claim-btn ${tokenSnapshot && tokenSnapshot.pendingReward > 0 ? "primary-btn" : "ghost-btn"}`}
                        type="button"
                        onClick={handleClaimRewards}
                        disabled={tokenLoading || !tokenSnapshot || tokenSnapshot.pendingReward === 0}
                      >
                        {tokenSnapshot && tokenSnapshot.pendingReward > 0
                          ? `Claim ${formatTokenAmount(tokenSnapshot.pendingReward, tokenSnapshot.decimals)} ${tokenSnapshot.symbol}`
                          : "No rewards to claim"}
                      </button>
                      {myStakeInfo.lastClaimBlock > 0 && (
                        <span className="stake-last-claim">
                          Last claim: block {formatChainValue(myStakeInfo.lastClaimBlock)}
                        </span>
                      )}
                    </div>

                    {stakeStatus && <p className="stake-status-msg">{stakeStatus}</p>}
                  </>
                )}
              </article>
            </div>
          </section>
        )}

        {featureTab === "alerts" && (
          <section className="section alert-section" id="alerts">
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
                  placeholder="Watch dataset IDs (comma-separated)…"
                  onKeyDown={(e) => { if (e.key === "Enter") applyWatchlistInput(); }}
                />
                <button
                  className="ghost-btn compact"
                  type="button"
                  onClick={applyWatchlistInput}
                >
                  Apply
                </button>
                <button
                  className="ghost-btn compact"
                  type="button"
                  onClick={clearWatchlist}
                  disabled={watchlistIds.length === 0 && !watchlistInput}
                >
                  Clear
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
                <div className="alert-empty">
                  <span className="alert-empty__icon">🔔</span>
                  <strong>No alerts right now</strong>
                  <p>Expand scope, add datasets to your watchlist, or unmute alert types to see activity.</p>
                </div>
              )}
              {alerts.map((alert) => {
                const isRead = readAlertIds.includes(alert.id);
                const kindIcon: Record<string, string> = {
                  verified: "✓",
                  rejected: "✕",
                  frozen: "❄",
                  pending: "⏳",
                };
                return (
                  <article
                    key={alert.id}
                    className={`alert-item ${isRead ? "read" : "unread"} alert-${alert.level}`}
                    onClick={() => markAlertRead(alert.id)}
                    title={isRead ? undefined : "Click to mark as read"}
                  >
                    <div className="alert-item__head">
                      <strong>{kindIcon[alert.kind] ?? ""} {alert.title}</strong>
                      <span className="alert-item__time">{formatChainValue(alert.timestamp)}</span>
                    </div>
                    <p>{alert.message}</p>
                    <div className="alert-item__foot">
                      <div className="alert-item__meta">
                        <span className={`alert-kind-pill alert-kind-pill--${alert.kind}`}>
                          {alert.kind}
                        </span>
                        <span>#{alert.datasetId}</span>
                      </div>
                      <div className="alert-item__actions">
                        <button
                          className="ghost-btn compact"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAlertRead(alert.id);
                            setLineageTarget(alert.datasetId);
                          }}
                        >
                          Open
                        </button>
                        <button
                          className="ghost-btn compact"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDismissedAlertIds((prev) => [...prev, alert.id]);
                          }}
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

        {featureTab === "audit" && (
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
                        <option
                          key={`lineage-${dataset.id}`}
                          value={dataset.id}
                        >
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
                <div className="dataset-title">
                  No dataset selected for audit
                </div>
                <p className="dataset-description">
                  Use Lookup or load datasets to generate a full lineage
                  timeline.
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
                    Fingerprint is derived from on-chain identity fields for
                    quick human verification.
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
                        <div className="lineage-event__title">
                          {event.title}
                        </div>
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
        )}

        {featureTab === "versions" && (
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
                  <div className="version-card__title">
                    Create draft revision
                  </div>
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
                          <span className="version-source">
                            {record.source}
                          </span>
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
                            handleVersionTransition(
                              selectedVersion.id,
                              "pending",
                            )
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
        )}

        {featureTab === "datasets" && (
          <section className="section" id="dataset-list">
            <div className="datasets-tab-bar">
              <button
                className={`datasets-tab${activeTab === "explore" ? " active" : ""}`}
                type="button"
                onClick={() => setActiveTab("explore")}
              >
                Explore
                {latestDatasets.length > 0 && (
                  <span className="tab-count">{latestDatasets.length}</span>
                )}
              </button>
              <button
                className={`datasets-tab${activeTab === "mine" ? " active" : ""}`}
                type="button"
                onClick={() => setActiveTab("mine")}
              >
                My Datasets
                {myDatasets.length > 0 && (
                  <span className="tab-count">{myDatasets.length}</span>
                )}
              </button>
            </div>
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
              <div className="section-tools">
                <div className="dataset-view-tabs">
                  <button
                    className={`dataset-view-btn ${
                      datasetDensity === "comfortable" ? "active" : ""
                    }`}
                    type="button"
                    onClick={() => setDatasetDensity("comfortable")}
                  >
                    Comfort
                  </button>
                  <button
                    className={`dataset-view-btn ${
                      datasetDensity === "compact" ? "active" : ""
                    }`}
                    type="button"
                    onClick={() => setDatasetDensity("compact")}
                  >
                    Compact
                  </button>
                </div>
                <button
                  className="dataset-view-btn copy-csv-btn"
                  type="button"
                  disabled={filteredDatasets.length === 0}
                  onClick={copyFilteredCsv}
                  title="Copy filtered list as CSV (id, name, dataType, lat, lng, qualityScore)"
                >
                  ⎘ Copy CSV
                </button>
                <button
                  className="dataset-view-btn copy-csv-btn"
                  type="button"
                  disabled={filteredDatasets.length === 0}
                  onClick={copyFilteredSummary}
                  title="Copy a plaintext digest of the current filtered view"
                >
                  ⎘ Copy summary
                </button>
                <button
                  className="dataset-view-btn copy-csv-btn"
                  type="button"
                  disabled={filteredDatasets.length === 0}
                  onClick={openRandomDataset}
                  title="Open a random dataset from the current filtered view"
                >
                  ⚄ Surprise me
                </button>
              </div>
            </div>
            {insightItems.length > 0 && (
              <div className="insight-strip">
                <div className="insight-strip__head">
                  <div>
                    <h3>Insight strip</h3>
                    <p>Snapshot of the current filtered view.</p>
                  </div>
                </div>
                <div className="insight-strip__grid">
                  {insightItems.map((item) => (
                    <div className="insight-card" key={item.label}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                      <small>{item.meta}</small>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="saved-view-card">
              <div className="saved-view-head">
                <div>
                  <h3>
                    Recently viewed
                    {recentDatasets.length > 0 ? ` (${recentDatasets.length})` : ""}
                  </h3>
                  <p>Quickly reopen datasets you inspected in this browser.</p>
                </div>
                <div className="saved-view-head-actions">
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => setRecentDatasetIds([])}
                    disabled={recentDatasets.length === 0}
                  >
                    Clear recent
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={clearAllDatasetNotes}
                    disabled={Object.keys(datasetNotes).length === 0}
                  >
                    Clear all notes
                  </button>
                </div>
              </div>
              <div className="saved-view-list">
                {recentDatasets.length === 0 && (
                  <span className="saved-view-empty">
                    No dataset details opened yet.
                  </span>
                )}
                {recentDatasets.map((dataset) => (
                  <div className="saved-view-item" key={`recent-dataset-${dataset.id}`}>
                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={() => openDatasetDetail(dataset.id)}
                    >
                      #{dataset.id} {dataset.name}
                    </button>
                    <span>{dataset.dataType}</span>
                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={() =>
                        setRecentDatasetIds((prev) =>
                          prev.filter((id) => id !== String(dataset.id)),
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="saved-view-card">
              <div className="saved-view-head">
                <div>
                  <h3>Pinned datasets</h3>
                  <p>Keep important datasets at the top of your lists.</p>
                </div>
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={clearPins}
                  disabled={pinnedDatasetIds.length === 0}
                >
                  Clear pins
                </button>
              </div>
              <div className="saved-view-list">
                {pinnedDatasets.length === 0 && (
                  <span className="saved-view-empty">
                    No pinned datasets yet.
                  </span>
                )}
                {pinnedDatasets.map((dataset) => (
                  <div className="saved-view-item" key={`pinned-dataset-${dataset.id}`}>
                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={() => openDatasetDetail(dataset.id)}
                    >
                      #{dataset.id} {dataset.name}
                    </button>
                    <span>{dataset.dataType}</span>
                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={() => togglePinnedDataset(dataset.id)}
                    >
                      Unpin
                    </button>
                  </div>
                ))}
                {pinnedDatasets.length > 0 && (
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={copyPinnedDatasetIds}
                    disabled={pinnedDatasetIds.length === 0}
                  >
                    Copy pinned IDs
                  </button>
                )}
                {pinnedDatasets.length > 0 && (
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={exportPinnedDatasets}
                    disabled={pinnedDatasets.length === 0}
                  >
                    Export pinned JSON
                  </button>
                )}
                {pinnedDatasets.length > 0 && (
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={exportPinnedDatasetsCsv}
                    disabled={pinnedDatasets.length === 0}
                  >
                    Export pinned CSV
                  </button>
                )}
                {pinnedDatasets.length > 0 && (
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={exportPinnedDatasetsGeoJson}
                    disabled={pinnedDatasets.length === 0}
                  >
                    Export pinned GeoJSON
                  </button>
                )}
              </div>
            </div>
            <div className="saved-view-card">
              <div className="saved-view-head">
                <div>
                  <h3>Noted recently</h3>
                  <p>Datasets with private notes stored in this browser.</p>
                </div>
              </div>
              <div className="saved-view-list">
                {recentlyNotedDatasets.length === 0 && (
                  <span className="saved-view-empty">
                    No datasets with private notes yet.
                  </span>
                )}
                {recentlyNotedDatasets.map((dataset) => (
                  <div className="saved-view-item" key={`noted-dataset-${dataset.id}`}>
                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={() => openDatasetDetail(dataset.id)}
                    >
                      #{dataset.id} {dataset.name}
                    </button>
                    <span>{(datasetNotes[String(dataset.id)] ?? "").trim().slice(0, 40) || dataset.dataType}</span>
                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={() => updateDatasetNote(dataset.id, "")}
                    >
                      Remove note
                    </button>
                  </div>
                ))}
              </div>
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
                <input
                  ref={savedViewsImportInputRef}
                  type="file"
                  accept="application/json"
                  style={{ display: "none" }}
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    if (!file) return;
                    importSavedViewsJson(file);
                    event.currentTarget.value = "";
                  }}
                />
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={() => savedViewsImportInputRef.current?.click()}
                >
                  Import
                </button>
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={exportSavedViewsJson}
                  disabled={savedViews.length === 0}
                >
                  Export
                </button>
                <input
                  ref={backupImportInputRef}
                  type="file"
                  accept="application/json"
                  style={{ display: "none" }}
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    if (!file) return;
                    importLocalDataBackup(file);
                    event.currentTarget.value = "";
                  }}
                />
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={exportLocalDataBackup}
                  title="Download pins, watchlist, notes, and saved views as one JSON file"
                >
                  Backup all
                </button>
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={() => backupImportInputRef.current?.click()}
                  title="Restore pins, watchlist, notes, and saved views from a backup file (replaces current data)"
                >
                  Restore all
                </button>
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={copyShareLink}
                >
                  Copy share link
                </button>
                {typeof navigator !== "undefined" &&
                  typeof navigator.share === "function" && (
                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={shareCurrentView}
                    >
                      Share
                    </button>
                  )}
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
                      onClick={() => copySavedViewShareLink(view)}
                      title="Copy a shareable URL for this view"
                    >
                      Copy link
                    </button>
                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={() => renameSavedView(view.id)}
                    >
                      Rename
                    </button>
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
              <div className="filter-card__label">More filters</div>
              <div className="filter-grid">
                <div className="input-clear">
                  <input
                    value={filters.tags}
                    onChange={updateFilterField("tags")}
                    placeholder="Tags (comma separated)"
                    list="tag-options"
                  />
                  <datalist id="tag-options">
                    {tagOptions.map((tag) => (
                      <option key={tag} value={tag} />
                    ))}
                  </datalist>
                  {filters.tags && (
                    <button
                      className="input-clear__btn"
                      type="button"
                      onClick={() => clearFilter("tags")}
                      aria-label="Clear tags"
                    >
                      Ã—
                    </button>
                  )}
                  {relatedTagSuggestions.length > 0 && (
                    <div className="filter-chips" title={`Tags that co-occur with "${lastTypedTag}"`}>
                      {relatedTagSuggestions.map(({ tag, count }) => (
                        <button
                          key={tag}
                          type="button"
                          className="filter-chip"
                          onClick={() => addTagToFilter(tag)}
                        >
                          + {tag} ({count})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
                  value={filters.verified}
                  onChange={updateFilterField("verified")}
                >
                  <option value="all">All verification</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
                <select
                  value={filters.frozen}
                  onChange={updateFilterField("frozen")}
                >
                  <option value="all">All metadata</option>
                  <option value="frozen">Frozen</option>
                  <option value="mutable">Mutable</option>
                </select>
                <select value={filters.ipfs} onChange={updateFilterField("ipfs")}>
                  <option value="all">All IPFS</option>
                  <option value="has-ipfs">Has IPFS</option>
                  <option value="no-ipfs">No IPFS</option>
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
                <div className="input-clear">
                  <input
                    value={filters.owner}
                    onChange={updateFilterField("owner")}
                    placeholder="Owner contains..."
                  />
                  {filters.owner && (
                    <button
                      className="input-clear__btn"
                      type="button"
                      onClick={() => clearFilter("owner")}
                      aria-label="Clear owner"
                    >
                      ×
                    </button>
                  )}
                </div>
                {ownerLeaderboard.length > 0 && (
                  <div className="filter-chips" title="Top owners by average quality score">
                    {ownerLeaderboard.map((entry) => (
                      <button
                        key={entry.owner}
                        type="button"
                        className="filter-chip"
                        title={`${entry.owner} · ${entry.count} dataset(s) · avg quality ${entry.averageQualityScore}/100`}
                        onClick={() =>
                          setFilters((prev) => ({ ...prev, owner: entry.owner }))
                        }
                      >
                        {entry.owner === "unknown"
                          ? "unknown"
                          : `${entry.owner.slice(0, 6)}…${entry.owner.slice(-4)}`}{" "}
                        ({entry.count}, {entry.averageQualityScore}/100)
                      </button>
                    ))}
                  </div>
                )}
                <AltitudeHistogram
                  datasets={activeDatasets}
                  filterMin={filters.altitudeMin}
                  filterMax={filters.altitudeMax}
                  onBucketClick={(min, max) =>
                    setFilters((prev) => ({
                      ...prev,
                      altitudeMin: String(min),
                      altitudeMax: String(max),
                    }))
                  }
                />
                <div className="filter-range">
                  <div className="input-clear">
                    <input
                      value={filters.altitudeMin}
                      onChange={updateFilterField("altitudeMin")}
                      placeholder="Altitude min"
                    />
                    {filters.altitudeMin && (
                      <button
                        className="input-clear__btn"
                        type="button"
                        onClick={() => clearFilter("altitudeMin")}
                        aria-label="Clear altitude minimum"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <div className="input-clear">
                    <input
                      value={filters.altitudeMax}
                      onChange={updateFilterField("altitudeMax")}
                      placeholder="Altitude max"
                    />
                    {filters.altitudeMax && (
                      <button
                        className="input-clear__btn"
                        type="button"
                        onClick={() => clearFilter("altitudeMax")}
                        aria-label="Clear altitude maximum"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
                <label className="filter-toggle" htmlFor="filter-noted-only">
                  <input
                    id="filter-noted-only"
                    type="checkbox"
                    checked={filters.notedOnly}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        notedOnly: readChecked(event),
                      }))
                    }
                  />
                  <span>Private notes only</span>
                </label>
                <label className="filter-toggle" htmlFor="filter-pinned-only">
                  <input
                    id="filter-pinned-only"
                    type="checkbox"
                    checked={filters.pinnedOnly}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        pinnedOnly: readChecked(event),
                      }))
                    }
                  />
                  <span>Pinned only</span>
                </label>
              </div>
              {filterChips.length > 0 && (
                <div className="filter-chips">
                  {filterChips.map((chip) => (
                    <button
                      key={chip.id}
                      className={`filter-chip${chip.className ? ` ${chip.className}` : ""}`}
                      type="button"
                      onClick={() => clearFilter(chip.key)}
                      title={`Clear ${chip.label}`}
                      style={chip.style}
                    >
                      <span className="filter-chip__label">{chip.label}</span>
                      <span className="filter-chip__x" aria-hidden="true">
                        ×
                      </span>
                    </button>
                  ))}
                  <button
                    className="filter-chip filter-chip--clear"
                    type="button"
                    onClick={() => setFilters(defaultFilters)}
                    disabled={!hasActiveFilters}
                  >
                    Clear all
                  </button>
                </div>
              )}
              <div className="filter-actions">
                <span>
                  Showing {filteredDatasets.length} of {activeDatasets.length}
                </span>
                <button
                  className="ghost-btn filter-actions__copy-ids"
                  type="button"
                  onClick={copyVisibleDatasetIds}
                  disabled={filteredDatasets.length === 0}
                  title="Copy all filtered dataset IDs as a comma-separated list"
                >
                  Copy IDs ({filteredDatasets.length})
                </button>
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
                    <option value="altitude-desc">
                      Highest altitude first
                    </option>
                    <option value="altitude-range-asc">
                      Narrowest altitude range first
                    </option>
                    <option value="status-priority">Status priority</option>
                    <option value="type-asc">Data type (A–Z)</option>
                    <option value="completeness-desc">Completeness (high to low)</option>
                    <option value="freshness-desc">Freshness (high to low)</option>
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
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={copyShareLink}
                  title="Copy a link to the current tab, filters, and sort — paste it to land anyone in this exact view"
                  disabled={!hasActiveFilters}
                >
                  Copy filter link
                </button>
                <button
                  className={`ghost-btn ${filters.pinnedOnly ? "active" : ""}`}
                  type="button"
                  onClick={() =>
                    setFilters((prev) => {
                      const next = !prev.pinnedOnly;
                      setStatusMessage(next ? "Pinned only enabled." : "Pinned only disabled.");
                      return { ...prev, pinnedOnly: next };
                    })
                  }
                >
                  {filters.pinnedOnly ? "Pinned only: on" : "Pinned only: off"}
                </button>
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={openRandomFilteredDataset}
                  disabled={filteredDatasets.length === 0}
                >
                  Surprise me
                </button>
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={clearLocalCache}
                >
                  Clear cache
                </button>
                <button
                  className={`ghost-btn${showBulkActions ? " active" : ""}`}
                  type="button"
                  onClick={() => setShowBulkActions((prev) => !prev)}
                >
                  {showBulkActions ? "Hide bulk actions" : "Bulk actions"}
                </button>
              </div>
              {showBulkActions && (
                <div className="filter-actions filter-bulk">
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={exportFilteredDatasets}
                    disabled={filteredDatasets.length === 0}
                  >
                    Export JSON
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={exportFilteredDatasetsCsv}
                    disabled={filteredDatasets.length === 0}
                  >
                    Export CSV
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={exportFilteredDatasetsGeoJson}
                    disabled={filteredDatasets.length === 0}
                  >
                    Export GeoJSON
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={copyFilterSummary}
                  >
                    Copy summary
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={copyDatasetsApiPath}
                  >
                    Copy API path
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={copyVisibleDatasetIds}
                    disabled={filteredDatasets.length === 0}
                  >
                    Copy IDs
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={copyVisibleDatasetsCsv}
                    disabled={filteredDatasets.length === 0}
                  >
                    Copy CSV
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={copyVisibleCoordsCsv}
                    disabled={filteredDatasets.length === 0}
                  >
                    Copy coords CSV
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={copyVisibleDatasetLinks}
                    disabled={filteredDatasets.length === 0}
                  >
                    Copy links
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={copyVisibleOwners}
                    disabled={filteredDatasets.length === 0}
                  >
                    Copy owners
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={copyVisibleDatasetNames}
                    disabled={filteredDatasets.length === 0}
                  >
                    Copy names
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={copyVisibleStatuses}
                    disabled={filteredDatasets.length === 0}
                  >
                    Copy statuses
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={copyVisibleMarkdownTable}
                    disabled={filteredDatasets.length === 0}
                  >
                    Copy markdown
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={copyVisibleGeoJson}
                    disabled={filteredDatasets.length === 0}
                  >
                    Copy GeoJSON
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={copyVisibleIpfsHashes}
                    disabled={filteredDatasets.length === 0}
                  >
                    Copy IPFS
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={useVisibleAsWatchlist}
                    disabled={filteredDatasets.length === 0}
                  >
                    Watch visible (replace)
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={addVisibleToWatchlist}
                    disabled={filteredDatasets.length === 0}
                  >
                    Watch visible (add)
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={removeVisibleFromWatchlist}
                    disabled={filteredDatasets.length === 0 || watchlistIds.length === 0}
                  >
                    Unwatch visible
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={addVisibleToPins}
                    disabled={filteredDatasets.length === 0}
                  >
                    Pin visible (add)
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={useVisibleAsPins}
                    disabled={filteredDatasets.length === 0}
                  >
                    Pin visible (replace)
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={removeVisibleFromPins}
                    disabled={filteredDatasets.length === 0 || pinnedDatasetIds.length === 0}
                  >
                    Unpin visible
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={auditTopVisibleDataset}
                    disabled={filteredDatasets.length === 0}
                  >
                    Audit top result
                  </button>
                </div>
              )}
            </div>
            <GeospatialExplorer
              datasets={geoDatasets}
              filteredCount={filteredDatasets.length}
              geoTimeBounds={geoTimeBounds}
              geoTimeCutoff={geoTimeCutoff}
              geoTimePercent={geoTimePercent}
              selectedDataset={selectedGeoDataset}
              compareSelectionIds={compareSelectionIds}
              watchlistIds={watchlistIds}
              formatCoord={formatCoord}
              formatChainValue={formatChainValue}
              onTimeChange={setGeoTimePercent}
              onSelectDataset={setGeoTarget}
              onOpenAudit={setLineageTarget}
              onOpenDetail={openDatasetDetail}
              onToggleCompare={toggleCompareDataset}
              onToggleWatch={toggleWatchlistDataset}
              onCopyBbox={copyGeoBbox}
            />
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
                    onClick={compareTopVisibleDatasets}
                    disabled={filteredDatasets.length === 0}
                  >
                    Compare top 4
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={clearCompareSelection}
                    disabled={compareDatasets.length === 0}
                  >
                    Clear compare
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={exportComparison}
                    disabled={compareDatasets.length === 0}
                  >
                    Export JSON
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={exportComparisonCsv}
                    disabled={compareDatasets.length === 0}
                  >
                    Export CSV
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={copyComparisonMarkdown}
                    disabled={compareDatasets.length === 0}
                  >
                    Copy Markdown
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
                    Auto-generated narrative from your current filtered and
                    ranked dataset view.
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

            <div
              className={`dataset-grid ${
                datasetDensity === "compact" ? "dataset-grid--compact" : ""
              }`}
            >
              {loading && activeDatasets.length > 0 && (
                <div className="dataset-refresh">
                  <span>Refreshing…</span>
                  <div className="dataset-refresh__bar">
                    <div className="dataset-refresh__shimmer" />
                  </div>
                </div>
              )}
              {loading && activeDatasets.length === 0 && (
                <>
                  {[0, 1, 2].map((item) => (
                    <div
                      className="dataset-card dataset-card--skeleton"
                      key={`dataset-skeleton-${item}`}
                    >
                      <div className="skeleton-line skeleton-title" />
                      <div className="skeleton-line skeleton-tag" />
                      <div className="skeleton-line" />
                      <div className="skeleton-line" />
                      <div className="skeleton-line skeleton-short" />
                    </div>
                  ))}
                </>
              )}
              {!loading && activeDatasets.length === 0 && (
                <div className="dataset-card dataset-card--empty">
                  <div className="empty-orbit" aria-hidden="true" />
                  <div className="dataset-title">No datasets loaded yet</div>
                  <p className="dataset-description">
                    {activeTab === "explore"
                      ? "Refresh to pull the latest records from mainnet."
                      : "Paste a Stacks address to load datasets tied to that owner."}
                  </p>
                  <div className="empty-actions">
                    {activeTab === "explore" ? (
                      <button
                        className="ghost-btn"
                        type="button"
                        onClick={loadLatest}
                      >
                        Refresh data
                      </button>
                    ) : (
                      <button
                        className="ghost-btn"
                        type="button"
                        onClick={() => setActiveTab("explore")}
                      >
                        Browse mainnet
                      </button>
                    )}
                    {hasActiveFilters && (
                      <button
                        className="ghost-btn"
                        type="button"
                        onClick={() => setFilters(defaultFilters)}
                      >
                        Reset filters
                      </button>
                    )}
                  </div>
                </div>
              )}
              {activeDatasets.length > 0 && sortedDatasets.length === 0 && (
                <div className="dataset-card dataset-card--empty">
                  <div className="empty-orbit" aria-hidden="true" />
                  <div className="dataset-title">No datasets match filters</div>
                  <p className="dataset-description">
                    {filterChips.length > 0
                      ? "Clear one of the active filters below, or reset them all."
                      : "Try broadening your filter criteria or reset all filters."}
                  </p>
                  {filterChips.length > 0 && (
                    <div className="empty-filter-resets">
                      {filterChips.map((chip) => (
                        <button
                          key={chip.id}
                          className="ghost-btn empty-filter-reset"
                          type="button"
                          onClick={() => clearFilter(chip.key)}
                          title={`Clear ${chip.label}`}
                        >
                          ✕ {chip.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="empty-actions">
                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={() => setFilters(defaultFilters)}
                      disabled={!hasActiveFilters}
                    >
                      Reset filters
                    </button>
                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={openRandomFilteredDataset}
                      disabled={filteredDatasets.length === 0}
                    >
                      Surprise me
                    </button>
                  </div>
                </div>
              )}
              {sortedDatasets.map((dataset) => (
                <DatasetCard
                  key={`${activeTab}-${dataset.id}`}
                  dataset={dataset}
                  statusClass={getStatusClass(dataset.status)}
                  rank={datasetRankById.get(dataset.id) ?? "-"}
                  qualityScore={getQualityScore(dataset)}
                  freshnessScore={getDatasetFreshnessScore(
                    dataset as unknown as import("../atmos-sdk/src").DatasetMetadata,
                  )}
                  notePreview={(datasetNotes[String(dataset.id)] ?? "")
                    .trim()
                    .slice(0, 120)}
                  searchQuery={filters.search.trim()}
                  onCopySummary={() => copyDatasetSummary(dataset)}
                  onCopyCitation={() => copyDatasetCitation(dataset)}
                  onCopyDatasetJson={() =>
                    copyText(
                      JSON.stringify(dataset, null, 2),
                      `Dataset #${dataset.id} JSON`,
                    )
                  }
                  onCloneToRegister={() => {
                    setFeatureTab("add-dataset");
                    setRegisterForm(cloneDatasetToRegister(dataset));
                    setStatusMessage(
                      `Loaded dataset #${dataset.id} into the registration form.`,
                    );
                  }}
                  stewardshipSignal={stewardshipSignalByDatasetId.get(
                    dataset.id,
                  )}
                  isStewardStaked={stewardshipSignalByDatasetId.has(dataset.id)}
                  duplicateInfo={duplicateInfoByDatasetId.get(dataset.id)}
                  isStale={staleDatasetIds.has(dataset.id)}
                  compareActive={compareSelectionIds.includes(
                    String(dataset.id),
                  )}
                  watchActive={watchlistIds.includes(String(dataset.id))}
                  pinActive={pinnedDatasetIds.includes(String(dataset.id))}
                  formatCoord={formatCoord}
                  onCopyId={() => copyText(String(dataset.id), "Dataset ID")}
                  onCopyOwner={() => copyText(dataset.owner, "Owner")}
                  onLoadOwnerDatasets={() => {
                    setActiveTab("mine");
                    setOwnerInput(dataset.owner);
                    setOwnerAddress(dataset.owner);
                    loadOwnerDatasets(dataset.owner);
                    setStatusMessage("Loading datasets for that owner…");
                  }}
                  onFilterOwner={() =>
                    setFilters((prev) => ({
                      ...prev,
                      owner: dataset.owner,
                    }))
                  }
                  onCopyCoords={() =>
                    copyText(
                      `${formatCoord(dataset.latitude)}, ${formatCoord(dataset.longitude)}`,
                      "Coordinates",
                    )
                  }
                  onOpenMap={() => openMapAt(dataset.latitude, dataset.longitude)}
                  onOpenGeoApp={() =>
                    openGeoAppAt(dataset.latitude, dataset.longitude, dataset.name)
                  }
                  onCopyMapUrl={() =>
                    copyMapUrlAt(dataset.latitude, dataset.longitude)
                  }
                  onCopyIpfs={() =>
                    copyText(dataset.ipfsHash || "", "IPFS hash")
                  }
                  onCopyIpfsGatewayUrl={() =>
                    copyIpfsGatewayUrl(dataset.ipfsHash || "")
                  }
                  onCopyLink={() => copyDatasetDetailLink(dataset.id)}
                  onOpenIpfs={() => openIpfsGateway(dataset.ipfsHash || "")}
                  onCheckIpfs={() => checkIpfsGateway(dataset.ipfsHash || "")}
                  ipfsHealth={getIpfsHealth(dataset.ipfsHash || "")}
                  ipfsCheckedAt={getIpfsCheckedAt(dataset.ipfsHash || "")}
                  onOpenOwnerExplorer={() => openOwnerInExplorer(dataset.owner)}
                  onCopyOwnerExplorerUrl={() =>
                    copyStacksExplorerUrl(
                      `address/${encodeURIComponent(dataset.owner)}`,
                      "Owner explorer URL",
                    )
                  }
                  onOpenDetail={() => openDatasetDetail(dataset.id)}
                  onAudit={() => setLineageTarget(dataset.id)}
                  onToggleCompare={() => toggleCompareDataset(dataset.id)}
                  onToggleWatch={() => toggleWatchlistDataset(dataset.id)}
                  onTogglePin={() => togglePinnedDataset(dataset.id)}
                />
              ))}
            </div>
          </section>
        )}

        {featureTab === "clardex" && (
          <section className="section clardex-section" id="clardex">
            <div className="section-header">
              <div>
                <h2>Clardex DEX</h2>
                <p>Swap tokens and inspect pool state on Clardex liquidity pools.</p>
              </div>
            </div>

            {/* Pool config */}
            <div className="clardex-grid">
              {/* Pool state card */}
              <article className="clardex-card">
                <div className="clardex-card__header">
                  <span className="clardex-card__title">Pool state</span>
                  <button
                    className="ghost-btn compact"
                    type="button"
                    onClick={loadClardexPoolState}
                    disabled={clardexPoolLoading}
                  >
                    {clardexPoolLoading ? "Fetching…" : "Fetch"}
                  </button>
                </div>
                <div className="field-grid">
                  <div className="field-group">
                    <label>Pool address</label>
                    <input
                      value={clardexPool.address}
                      onChange={(e) =>
                        setClardexPool((p) => ({ ...p, address: e.currentTarget.value.trim() }))
                      }
                      placeholder="SP…"
                    />
                  </div>
                  <div className="field-group">
                    <label>Pool contract name</label>
                    <input
                      value={clardexPool.name}
                      onChange={(e) =>
                        setClardexPool((p) => ({ ...p, name: e.currentTarget.value.trim() }))
                      }
                      placeholder="dex-pool-v5"
                    />
                  </div>
                </div>
                {clardexPoolError && (
                  <p className="clardex-error">{clardexPoolError}</p>
                )}
                {clardexPoolState && (
                  <div className="clardex-metrics">
                    <div className="clardex-metric">
                      <span>Reserve X</span>
                      <strong>{clardexPoolState.reserveX.toLocaleString()}</strong>
                    </div>
                    <div className="clardex-metric">
                      <span>Reserve Y</span>
                      <strong>{clardexPoolState.reserveY.toLocaleString()}</strong>
                    </div>
                    <div className="clardex-metric">
                      <span>Total shares</span>
                      <strong>{clardexPoolState.totalShares.toLocaleString()}</strong>
                    </div>
                    <div className="clardex-metric">
                      <span>Price (X/Y)</span>
                      <strong>
                        {clardexPoolState.reserveY > 0
                          ? (clardexPoolState.reserveX / clardexPoolState.reserveY).toFixed(6)
                          : "—"}
                      </strong>
                    </div>
                  </div>
                )}
              </article>

              {/* Swap quote card */}
              <article className="clardex-card">
                <div className="clardex-card__header">
                  <span className="clardex-card__title">Swap quote</span>
                  <button
                    className="ghost-btn compact"
                    type="button"
                    onClick={fetchClardexQuote}
                    disabled={clardexQuoteLoading}
                  >
                    {clardexQuoteLoading ? "Quoting…" : "Get quote"}
                  </button>
                </div>
                <div className="field-grid">
                  <div className="field-group">
                    <label>Amount in</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={clardexAmountIn}
                      onChange={(e) => setClardexAmountIn(e.currentTarget.value)}
                      placeholder="1"
                    />
                  </div>
                  <div className="field-group">
                    <label>Direction</label>
                    <select
                      value={clardexDirection}
                      onChange={(e) =>
                        setClardexDirection(e.currentTarget.value as "x-to-y" | "y-to-x")
                      }
                    >
                      <option value="x-to-y">X → Y</option>
                      <option value="y-to-x">Y → X</option>
                    </select>
                  </div>
                </div>
                {clardexQuoteError && (
                  <p className="clardex-error">{clardexQuoteError}</p>
                )}
                {clardexQuote && (
                  <div className="clardex-metrics">
                    <div className="clardex-metric clardex-metric--green">
                      <span>Amount out</span>
                      <strong>{clardexQuote.amountOut.toLocaleString()}</strong>
                    </div>
                    <div className="clardex-metric">
                      <span>Fee</span>
                      <strong>{clardexQuote.fee.toLocaleString()}</strong>
                    </div>
                  </div>
                )}
              </article>

              {/* Swap execution card */}
              <article className="clardex-card">
                <div className="clardex-card__header">
                  <span className="clardex-card__title">Execute swap</span>
                </div>
                {!walletAddress ? (
                  <div className="stake-connect">
                    <span className="stake-connect__icon">⟺</span>
                    <strong>Wallet not connected</strong>
                    <p>Connect your Stacks wallet to execute swaps.</p>
                  </div>
                ) : (
                  <>
                    <div className="field-grid">
                      <div className="field-group">
                        <label>Token X</label>
                        <select
                          value={clardexTokenX.type === "stx" ? "stx" : (clardexTokenX as any).contract}
                          onChange={(e) => {
                            const val = e.currentTarget.value;
                            setClardexTokenX(val === "stx" ? { type: "stx" } : { type: "sip10", contract: val });
                          }}
                        >
                          <option value="stx">STX</option>
                          <option value={`${CONTRACT_ADDRESS}.${TOKEN_CONTRACT_NAME}`}>
                            ATMOS ({TOKEN_CONTRACT_NAME})
                          </option>
                        </select>
                      </div>
                      <div className="field-group">
                        <label>Token Y</label>
                        <select
                          value={clardexTokenY.type === "stx" ? "stx" : (clardexTokenY as any).contract}
                          onChange={(e) => {
                            const val = e.currentTarget.value;
                            setClardexTokenY(val === "stx" ? { type: "stx" } : { type: "sip10", contract: val });
                          }}
                        >
                          <option value={`${CONTRACT_ADDRESS}.${TOKEN_CONTRACT_NAME}`}>
                            ATMOS ({TOKEN_CONTRACT_NAME})
                          </option>
                          <option value="stx">STX</option>
                        </select>
                      </div>
                      <div className="field-group">
                        <label>Min out (slippage guard)</label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={clardexMinOut}
                          onChange={(e) => setClardexMinOut(e.currentTarget.value)}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="stake-actions">
                      <button
                        className="primary-btn"
                        type="button"
                        onClick={handleClardexSwap}
                        disabled={clardexSwapLoading}
                      >
                        {clardexSwapLoading ? "Swapping…" : "Swap"}
                      </button>
                    </div>
                    {clardexSwapStatus && (
                      <p className={`clardex-status${clardexSwapStatus.startsWith("Swap submitted") ? " clardex-status--ok" : ""}`}>
                        {clardexSwapStatus}
                      </p>
                    )}
                  </>
                )}
              </article>
            </div>
          </section>
        )}

        {featureTab === "add-dataset" && (
          <section className="section" id="register-dataset">
            <div className="register-banner">
              <p className="eyebrow">ATMOS registry · Stacks mainnet</p>
              <h2>Register a dataset</h2>
              <p className="register-banner__subtitle">
                Submit atmospheric data to the on-chain registry. All metadata is stored permanently and cryptographically anchored.
              </p>
            </div>
            <form
              className="form-grid form-grid--register"
              onSubmit={(event) => {
                event.preventDefault();
                handleRegisterSubmit();
              }}
            >
              <div className="form-card">
                <div className="form-header">
                  <h3>Dataset details</h3>
                  <p className="form-help">
                    Fields marked <span className="field-required">*</span> are required and will be stored on-chain.
                  </p>
                </div>

                {/* ── Basic information ── */}
                <div className="form-group">
                  <span className="form-group__label">Basic information</span>
                  <div className="field-grid">
                    <label className="field-label" htmlFor="dataset-name">
                      Name <span className="field-required">*</span>
                    </label>
                    <input
                      id="dataset-name"
                      value={registerForm.name}
                      onChange={updateRegisterField("name")}
                      maxLength={REGISTER_FIELD_LIMITS.name}
                      onBlur={() =>
                        setRegisterTouched((prev) => ({ ...prev, name: true }))
                      }
                      placeholder="Dataset name"
                    />
                    {registerValidation.issues.name &&
                      (registerTouched.name || registerSubmitAttempted) && (
                      <span className="field-hint field-hint--error">
                        {registerValidation.issues.name}
                      </span>
                    )}
                    {!registerValidation.issues.name &&
                      registerValidation.ok.name &&
                      (registerTouched.name || registerSubmitAttempted) && (
                        <span className="field-hint field-hint--ok">
                          Looks good.
                        </span>
                      )}

                    <label className="field-label" htmlFor="dataset-type">
                      Data type <span className="field-required">*</span>
                    </label>
                    <input
                      id="dataset-type"
                      value={registerForm.dataType}
                      onChange={updateRegisterField("dataType")}
                      maxLength={REGISTER_FIELD_LIMITS.dataType}
                      onBlur={() =>
                        setRegisterTouched((prev) => ({ ...prev, dataType: true }))
                      }
                      placeholder="e.g. imagery, sensor, model"
                    />
                    {registerValidation.issues.dataType &&
                      (registerTouched.dataType || registerSubmitAttempted) && (
                      <span className="field-hint field-hint--error">
                        {registerValidation.issues.dataType}
                      </span>
                    )}
                    {!registerValidation.issues.dataType &&
                      registerValidation.ok.dataType &&
                      (registerTouched.dataType || registerSubmitAttempted) && (
                        <span className="field-hint field-hint--ok">
                          Looks good.
                        </span>
                      )}

                    <label className="field-label" htmlFor="dataset-description">
                      Description <span className="field-required">*</span>
                    </label>
                    <textarea
                      id="dataset-description"
                      value={registerForm.description}
                      onChange={updateRegisterField("description")}
                      maxLength={REGISTER_FIELD_LIMITS.description}
                      onBlur={() =>
                        setRegisterTouched((prev) => ({
                          ...prev,
                          description: true,
                        }))
                      }
                      placeholder="Describe the dataset — what it measures, where, and how"
                      rows={4}
                    />
                    {registerValidation.issues.description &&
                      (registerTouched.description ||
                        registerSubmitAttempted) && (
                      <span className="field-hint field-hint--error">
                        {registerValidation.issues.description}
                      </span>
                    )}
                    {!registerValidation.issues.description &&
                      registerValidation.ok.description &&
                      (registerTouched.description ||
                        registerSubmitAttempted) && (
                        <span className="field-hint field-hint--ok">
                          Looks good.
                        </span>
                      )}
                  </div>
                </div>

                {/* ── Location & altitude ── */}
                <div className="form-group">
                  <span className="form-group__label">Location & altitude</span>
                  <div className="field-grid">
                    <div className="field-row">
                      <div>
                        <label className="field-label" htmlFor="latitude">
                          Latitude (deg)
                        </label>
                        <input
                          id="latitude"
                          value={registerForm.latitude}
                          onChange={updateRegisterField("latitude")}
                          onBlur={() =>
                            setRegisterTouched((prev) => ({
                              ...prev,
                              latitude: true,
                            }))
                          }
                          placeholder="e.g. 37.7749"
                        />
                        {registerValidation.issues.latitude &&
                          (registerTouched.latitude ||
                            registerSubmitAttempted) && (
                          <span className="field-hint field-hint--error">
                            {registerValidation.issues.latitude}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="field-label" htmlFor="longitude">
                          Longitude (deg)
                        </label>
                        <input
                          id="longitude"
                          value={registerForm.longitude}
                          onChange={updateRegisterField("longitude")}
                          onBlur={() =>
                            setRegisterTouched((prev) => ({
                              ...prev,
                              longitude: true,
                            }))
                          }
                          placeholder="e.g. -122.4194"
                        />
                        {registerValidation.issues.longitude &&
                          (registerTouched.longitude ||
                            registerSubmitAttempted) && (
                          <span className="field-hint field-hint--error">
                            {registerValidation.issues.longitude}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="field-row">
                      <div>
                        <label className="field-label" htmlFor="altitude-min">
                          Altitude min (m)
                        </label>
                        <input
                          id="altitude-min"
                          value={registerForm.altitudeMin}
                          onChange={updateRegisterField("altitudeMin")}
                          onBlur={() =>
                            setRegisterTouched((prev) => ({
                              ...prev,
                              altitudeMin: true,
                            }))
                          }
                          placeholder="e.g. 0"
                        />
                        {registerValidation.issues.altitudeMin &&
                          (registerTouched.altitudeMin ||
                            registerSubmitAttempted) && (
                          <span className="field-hint field-hint--error">
                            {registerValidation.issues.altitudeMin}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="field-label" htmlFor="altitude-max">
                          Altitude max (m)
                        </label>
                        <input
                          id="altitude-max"
                          value={registerForm.altitudeMax}
                          onChange={updateRegisterField("altitudeMax")}
                          onBlur={() =>
                            setRegisterTouched((prev) => ({
                              ...prev,
                              altitudeMax: true,
                            }))
                          }
                          placeholder="e.g. 1200"
                        />
                        {registerValidation.issues.altitudeMax &&
                          (registerTouched.altitudeMax ||
                            registerSubmitAttempted) && (
                          <span className="field-hint field-hint--error">
                            {registerValidation.issues.altitudeMax}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Storage & access ── */}
                <div className="form-group">
                  <span className="form-group__label">Storage & access</span>
                  <div className="field-grid">
                    <div className="field-row">
                      <div>
                        <label className="field-label" htmlFor="ipfs-hash">
                          IPFS hash
                        </label>
                        <input
                          id="ipfs-hash"
                          value={registerForm.ipfsHash}
                          onChange={updateRegisterField("ipfsHash")}
                          onBlur={() =>
                            setRegisterTouched((prev) => ({
                              ...prev,
                              ipfsHash: true,
                            }))
                          }
                          maxLength={REGISTER_FIELD_LIMITS.ipfsHash}
                          placeholder="Qm… or bafy… (optional)"
                        />
                        {registerValidation.issues.ipfsHash &&
                          (registerTouched.ipfsHash ||
                            registerSubmitAttempted) && (
                          <span className="field-hint field-hint--error">
                            {registerValidation.issues.ipfsHash}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="field-label" htmlFor="collection-date">
                          Collection date
                        </label>
                        <input
                          id="collection-date"
                          value={registerForm.collectionDate}
                          onChange={updateRegisterField("collectionDate")}
                          onBlur={() =>
                            setRegisterTouched((prev) => ({
                              ...prev,
                              collectionDate: true,
                            }))
                          }
                          placeholder="Unix timestamp or block height"
                        />
                        {registerValidation.issues.collectionDate &&
                          (registerTouched.collectionDate ||
                            registerSubmitAttempted) && (
                          <span className="field-hint field-hint--error">
                            {registerValidation.issues.collectionDate}
                          </span>
                        )}
                      </div>
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
                      <span>Make this dataset publicly visible</span>
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <div className="form-actions-row">
                    <button
                      className="primary-btn"
                      type="submit"
                      disabled={contractPaused === true || registerSubmitting}
                      title={contractPaused === true ? "Contract is paused — read-only mode" : undefined}
                    >
                      {contractPaused === true
                        ? "Read-only mode"
                        : registerSubmitting
                        ? "Submitting…"
                        : "Submit dataset"}
                    </button>
                    <button
                      className="ghost-btn compact"
                      type="button"
                      onClick={clearRegisterForm}
                    >
                      Clear
                    </button>
                    <button
                      className="ghost-btn compact"
                      type="button"
                      onClick={restoreRegisterDraft}
                      disabled={!registerDraftBackup}
                    >
                      Restore draft
                    </button>
                    <button
                      className="ghost-btn compact"
                      type="button"
                      onClick={() => setFeatureTab("datasets")}
                    >
                      ← Back
                    </button>
                  </div>
                  {txStatus && <div className="form-note">{txStatus}</div>}
                </div>
              </div>

              <div className="form-card form-card--info">
                <h3>Before you submit</h3>
                <div className="req-list">
                  <div className="req-item">
                    <span className="req-item__icon">📍</span>
                    <div>
                      <strong>Coordinates</strong>
                      <p>Latitude and longitude are stored in micro-degrees internally. Enter standard decimal degrees.</p>
                    </div>
                  </div>
                  <div className="req-item">
                    <span className="req-item__icon">↕</span>
                    <div>
                      <strong>Altitude range</strong>
                      <p>Min must be less than max. Both values must be non-negative.</p>
                    </div>
                  </div>
                  <div className="req-item">
                    <span className="req-item__icon">⬡</span>
                    <div>
                      <strong>IPFS hash</strong>
                      <p>Optional but recommended. Links the on-chain record to your raw data files for long-term preservation.</p>
                    </div>
                  </div>
                  <div className="req-item">
                    <span className="req-item__icon">🔒</span>
                    <div>
                      <strong>Immutability</strong>
                      <p>Metadata can be frozen by the owner after submission. Frozen datasets cannot be modified.</p>
                    </div>
                  </div>
                </div>
                <div className="form-card__note">
                  ⛓ Submitting requires a connected Stacks wallet. The transaction is signed client-side and broadcast to mainnet.
                </div>
              </div>
            </form>
          </section>
        )}
      </main>
      {showBackToTop && (
        <button
          className="back-to-top"
          type="button"
          onClick={scrollToTop}
          aria-label="Back to top"
        >
          Top
        </button>
      )}
      </div>{/* dashboard-body */}
      </div>{/* dashboard */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;

