import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:4173";
export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "*.spec.mjs",
  timeout: 30_000,
  expect: { timeout: 20_000 },
  use: { baseURL, trace: "retain-on-failure" },
  reporter: "list",
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } }
  ],
  webServer: {
    command: "node tests/browser/server.mjs",
    url: `${baseURL}/index.htm`,
    reuseExistingServer: false,
    timeout: 10_000
  }
});
