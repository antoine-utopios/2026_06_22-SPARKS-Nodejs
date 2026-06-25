import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  testMatch: "**/*.e2e.test.js",
  use: { headless: true },
  webServer: {
    command: "node src/server.js",
    url: "http://localhost:3000",
    reuseExistingServer: true
  }
});
