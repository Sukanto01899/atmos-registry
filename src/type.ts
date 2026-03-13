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
