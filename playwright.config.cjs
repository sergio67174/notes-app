const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/playwright",  // where we’ll put our Playwright tests
  timeout: 30000,
  use: {
    baseURL: "http://localhost:4000",  // your backend
  },
});