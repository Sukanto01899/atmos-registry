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

// In a production application, you would likely want to fetch and store additional metadata about datasets, such as data quality metrics, usage statistics, or user-generated tags and reviews. For this example, we focus on the core metadata stored on-chain for simplicity.
export type RegisterFormState = {
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
export type DatasetFilters = {
  search: string;
  status: string;
  visibility: "all" | "public" | "private";
  dataType: string;
  owner: string;
  altitudeMin: string;
  altitudeMax: string;
};

// Sort modes determine the ordering of datasets in the explore and mine tabs. In a real application, you might want to support more complex sorting options and allow users to customize their default sort mode.
export type SortMode =
  | "quality-desc"
  | "recent-desc"
  | "recent-asc"
  | "altitude-desc"
  | "status-priority";

export type VersionStatus = "draft" | "pending" | "approved" | "rejected";

// In a real application, version records would likely be stored in a backend or indexed on-chain with more robust querying. For this example, we keep them in local state keyed by dataset ID for simplicity.
export type VersionRecord = {
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
export type VersionDraft = {
  description: string;
  ipfsHash: string;
  isPublic: boolean;
};

// Saved views allow users to capture the current state of their filters, sorting, and other view options for easy access later. In a real application, you would likely want to persist these in local storage or a backend and support more complex view configurations.
export type SavedView = {
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
export type CommandAction = {
  id: string;
  label: string;
  detail: string;
  run: () => void;
};

// Story chapters are designed to guide users through interesting insights and narratives in the dataset collection. In a real application, you might want to support more complex chapter content, multimedia integration, and persistence of user progress.
export type StoryChapter = {
  id: string;
  title: string;
  body: string;
  datasetId?: number;
};

// TokenSnapshot represents the current state of the ATMOS token, including total supply, total staked, APY, and the user's balance and pending rewards. In a production application, you would likely want to fetch this data from a reliable on-chain source or backend API and update it in real-time.
export type StakeInfo = {
  amount: number;
  lastClaimBlock: number;
  totalClaimed: number;
};

// In a production application, you would likely want to fetch and display additional token metrics such as historical price, staking history, and more detailed breakdowns of rewards and penalties. For this example, we focus on the core metrics relevant to staking and governance participation for simplicity.
export type TokenSnapshot = {
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

// Alert system is designed to surface important updates about datasets that users are interested in, such as verification status changes or metadata freezes. In a real application, you would likely want to persist read/dismissed state and support more complex alert types and delivery mechanisms.
export type AlertLevel = "critical" | "warning" | "info";

// In this example, alerts are generated client-side based on dataset status and user watchlist. In a production application, you might want to generate and store alerts server-side or on-chain for more reliability and to support notifications outside of the app.
export type AlertItem = {
  id: string;
  datasetId: number;
  kind: "verified" | "rejected" | "frozen" | "pending";
  title: string;
  message: string;
  level: AlertLevel;
  timestamp: number;
};

export type Notice = {
  id: string;
  tone: "info" | "warning" | "critical";
  message: string;
};

export type Props = {
  notices: Notice[];
};

export type CommandPaletteProps = {
  open: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  actions: CommandAction[];
  onClose: () => void;
  onSelect: (action: CommandAction) => void;
};

export type DatasetCardProps = {
  dataset: Dataset;
  statusClass: string;
  rank: number | string;
  qualityScore: number;
  stewardshipSignal?: string;
  isStewardStaked: boolean;
  compareActive: boolean;
  watchActive: boolean;
  formatCoord: (value: number) => string;
  onCopyId: () => void;
  onCopyOwner: () => void;
  onCopyIpfs: () => void;
  onOpenDetail: () => void;
  onAudit: () => void;
  onToggleCompare: () => void;
  onToggleWatch: () => void;
};
