const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  timeout: 10000, // 10 seconds global timeout

  // Worker configuration
  // Use 4 workers for parallel test execution
  workers: 4,

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
        baseURL: process.env.BACKEND_URL || "http://backend-test:4000", // Docker network hostname
      },
    },
    {
      name: "ui",
      testDir: "./tests/playwright/ui/specs",
      dependencies: ["api"], // UI tests wait for API tests to complete
      use: {
        baseURL: process.env.FRONTEND_URL || "http://frontend-test:5173", // Docker network hostname
      },
    },
  ],
});