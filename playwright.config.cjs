const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  timeout: 5000,

  // Reporter configuration
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["list"],
  ],

  // Default "use" can be overridden per project
  use: {
    headless: true,
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 },
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "api",
      testDir: "./tests/playwright/api/specs",
      use: {
        baseURL: "http://localhost:4000", // BACKEND (Express API)
      },
    },
    {
      name: "ui",
      testDir: "./tests/playwright/ui/specs",
      dependencies: ["api"], // UI tests wait for API tests to complete
      use: {
        baseURL: "http://localhost:5173", // FRONTEND (Vite)
      },
    },
  ],

  // Later we can uncomment this to auto-start servers.
  // webServer: [
  //   {
  //     command: "npm --prefix backend run dev",
  //     port: 4000,
  //     reuseExistingServer: true,
  //   },
  //   {
  //     command: "npm --prefix frontend run dev",
  //     port: 5173,
  //     reuseExistingServer: true,
  //   },
  // ],
});