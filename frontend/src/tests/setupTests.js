import "@testing-library/jest-dom";
import { beforeEach } from "vitest";

// Clear localStorage before each test to prevent stale data issues
beforeEach(() => {
  localStorage.clear();
});