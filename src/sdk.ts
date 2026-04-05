import { SdkClient, createIpfsAdapter } from "../atmos-sdk/src";

const API_URL = import.meta.env.VITE_ATMOS_API_URL ?? "http://127.0.0.1:4000";
const IPFS_ENDPOINT = import.meta.env.VITE_IPFS_ENDPOINT ?? "";
const SDK_CACHE_MAX_AGE_MS = (() => {
  const raw = import.meta.env.VITE_ATMOS_SDK_CACHE_MAX_AGE_MS;
  if (raw === undefined || raw === null || raw === "") {
    return 30_000;
  }
  const parsed = Number.parseInt(String(raw), 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 30_000;
  }
  return parsed;
})();

let sdkClient: SdkClient | null = null;

export const getSdkClient = () => {
  if (!IPFS_ENDPOINT) {
    return null;
  }

  if (!sdkClient) {
    sdkClient = new SdkClient({
      baseUrl: API_URL,
      cache: { maxAgeMs: SDK_CACHE_MAX_AGE_MS },
      storage: createIpfsAdapter({ endpoint: IPFS_ENDPOINT }),
    });
  }

  return sdkClient;
};
