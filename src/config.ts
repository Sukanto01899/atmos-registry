import { DatasetFilters, RegisterFormState, VersionDraft } from "./type";

export const defaultRegisterForm: RegisterFormState = {
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

export const defaultFilters: DatasetFilters = {
  search: "",
  status: "all",
  visibility: "all",
  dataType: "all",
  owner: "",
  altitudeMin: "",
  altitudeMax: "",
  notedOnly: false,
};

export const defaultVersionDraft: VersionDraft = {
  description: "",
  ipfsHash: "",
  isPublic: true,
};
