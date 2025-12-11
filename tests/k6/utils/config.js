// tests/k6/utils/config.js

/**
 * K6 Performance Test Configuration
 *
 * Centralized configuration for all k6 performance tests.
 * Uses environment variables with sensible defaults.
 */

export const config = {
  // API Configuration
  API_URL: __ENV.API_URL || 'http://localhost:4000',

  // Performance Thresholds
  thresholds: {
    // HTTP request duration thresholds
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1000ms

    // HTTP request failure rate
    http_req_failed: ['rate<0.01'], // Less than 1% failure rate

    // Successful requests per second
    http_reqs: ['rate>100'], // More than 100 req/s
  },

  // Virtual User Profiles
  loadProfiles: {
    smoke: {
      vus: 1,
      duration: '1m',
    },
    load: {
      stages: [
        { duration: '2m', target: 50 },   // Ramp up to 50 users
        { duration: '5m', target: 100 },  // Ramp up to 100 users
        { duration: '2m', target: 50 },   // Ramp down to 50 users
        { duration: '1m', target: 0 },    // Ramp down to 0 users
      ],
    },
    stress: {
      stages: [
        { duration: '2m', target: 100 },  // Ramp up to 100 users
        { duration: '5m', target: 200 },  // Ramp up to 200 users
        { duration: '5m', target: 300 },  // Ramp up to 300 users
        { duration: '2m', target: 0 },    // Ramp down to 0 users
      ],
    },
    spike: {
      stages: [
        { duration: '10s', target: 500 }, // Immediate spike to 500 users
        { duration: '3m', target: 500 },  // Stay at 500 users
        { duration: '10s', target: 0 },   // Quick ramp down
      ],
    },
    soak: {
      stages: [
        { duration: '2m', target: 50 },   // Ramp up to 50 users
        { duration: '60m', target: 50 },  // Stay at 50 users for 1 hour
        { duration: '2m', target: 0 },    // Ramp down to 0 users
      ],
    },
  },

  // Test data
  testUsers: {
    password: 'LoadTest123!',
    namePrefix: 'K6User',
  },
};
