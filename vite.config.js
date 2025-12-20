import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { vitestSetupFilePath, getClarinetVitestsArgv } from "@stacks/clarinet-sdk/vitest";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "clarinet",
    poolOptions: {
      threads: {
        singleThread: true,
      },
      forks: {
        singleFork: true,
      },
    },
    setupFiles: [vitestSetupFilePath],
  },
});
