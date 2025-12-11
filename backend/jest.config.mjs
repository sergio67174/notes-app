export default {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  globalSetup: "./tests/setup.js",
  globalTeardown: "./tests/teardown.js",
};
