import { AppConfig, UserSession } from "@stacks/auth";
import { createNetwork, STACKS_MAINNET } from "@stacks/network";

export const CONTRACT_ADDRESS = "SP1K2XGT5RNGT42N49BH936VDF8NXWNZJY15BPV4F";
export const CONTRACT_NAME = "atmos-v4";
export const TOKEN_CONTRACT_NAME = "atmos-token-v4";
export const STAKING_CONTRACT_NAME = "atmos-staking-v4";
export const SAVED_VIEWS_KEY = "atmos.saved-views.v1";
export const network = createNetwork(STACKS_MAINNET);
export const STACKS_API_BASE_URL =
  import.meta.env.VITE_STACKS_API_BASE_URL ?? "https://api.mainnet.hiro.so";
export const appConfig = new AppConfig(["store_write", "publish_data"]);
export const userSession = new UserSession({ appConfig });

