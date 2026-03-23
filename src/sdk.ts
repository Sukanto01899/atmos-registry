import { SdkClient, createIpfsAdapter } from "../atmos-sdk/src";

const API_URL = import.meta.env.VITE_ATMOS_API_URL ?? "http://127.0.0.1:4000";
const IPFS_ENDPOINT = import.meta.env.VITE_IPFS_ENDPOINT ?? "";

let sdkClient: SdkClient | null = null;

export const getSdkClient = () => {
  if (!IPFS_ENDPOINT) {
    return null;
  }

  if (!sdkClient) {
    sdkClient = new SdkClient({
      baseUrl: API_URL,
      storage: createIpfsAdapter({ endpoint: IPFS_ENDPOINT }),
    });
  }

  return sdkClient;
};
