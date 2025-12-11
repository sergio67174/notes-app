# K6 Performance Testing Guide

## Overview

Performance tests for the Notes App (Kanban Board) using k6 load testing framework.

## Installation

```bash
# Windows (using Chocolatey)
choco install k6

# Or download from https://k6.io/docs/getting-started/installation/
```

## Test Types

### 1. Load Test (`load-test.js`)
- **Purpose**: Test system performance under expected normal and peak load
- **Duration**: 10 minutes
- **Virtual Users**: Ramps from 0 → 50 → 100 → 50 → 0
- **When to run**: Before releases, weekly

### 2. Stress Test (`stress-test.js`)
- **Purpose**: Find system breaking point
- **Duration**: 15 minutes
- **Virtual Users**: Ramps from 0 → 200 → 300 → 0
- **When to run**: Before major releases, monthly

### 3. Spike Test (`spike-test.js`)
- **Purpose**: Test system behavior under sudden traffic spikes
- **Duration**: 5 minutes
- **Virtual Users**: 0 → 500 (immediate) → 0
- **When to run**: Before major releases

### 4. Soak Test (`soak-test.js`)
- **Purpose**: Test system stability over extended period (memory leaks, etc.)
- **Duration**: 1-2 hours
- **Virtual Users**: Constant 50 users
- **When to run**: Monthly, before major releases

## Running Tests

```bash
# Navigate to k6 directory
cd tests/k6

# Run individual test
k6 run scripts/load-test.js

# Run with custom VUs and duration
k6 run --vus 100 --duration 5m scripts/load-test.js

# Run with environment variables
k6 run -e API_URL=http://localhost:4000 scripts/load-test.js

# Run and save results to JSON
k6 run --out json=reports/load-test-results.json scripts/load-test.js

# Run and send results to k6 Cloud (optional)
k6 cloud scripts/load-test.js
```

## Performance Thresholds

### API Endpoints
- **Response Time (p95)**: < 500ms
- **Response Time (p99)**: < 1000ms
- **Error Rate**: < 1%
- **Requests per Second**: > 100

### Database
- **Connection Pool**: Monitor for exhaustion
- **Query Time**: < 100ms average

### Frontend
- **Time to Interactive**: < 3s
- **First Contentful Paint**: < 1.5s

## Test Scenarios Covered

### Authentication Flow (`scenarios/auth-flow.js`)
1. User registration
2. User login
3. Token validation
4. Concurrent login requests

### Board Operations (`scenarios/board-operations.js`)
1. Load user board (GET /me/board)
2. Concurrent board access
3. Board with many tasks (100+ tasks)

### Task Operations (`scenarios/task-operations.js`)
1. Create task
2. Update task (PATCH)
3. Move task between columns
4. Delete task
5. Bulk delete done tasks
6. Concurrent task creation
7. Mixed CRUD operations

## Metrics to Monitor

### k6 Metrics
- `http_req_duration` - Request duration
- `http_req_failed` - Failed requests
- `http_reqs` - Total requests
- `vus` - Virtual users
- `iterations` - Completed iterations

### Custom Metrics
- `login_duration` - Time to complete login
- `task_creation_duration` - Time to create task
- `board_load_duration` - Time to load board

## Performance Baseline (Target)

Based on a single server setup:

| Endpoint | Method | p95 Response Time | Throughput (req/s) |
|----------|--------|-------------------|-------------------|
| /auth/register | POST | < 300ms | 20 |
| /auth/login | POST | < 200ms | 50 |
| /me/board | GET | < 150ms | 200 |
| /tasks | POST | < 200ms | 100 |
| /tasks/:id | PATCH | < 150ms | 100 |
| /tasks/:id/move | PATCH | < 150ms | 100 |
| /tasks/:id | DELETE | < 100ms | 100 |

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure backend is running on port 4000
   - Check `API_URL` environment variable

2. **High Error Rate**
   - Check database connection pool size
   - Monitor database query performance
   - Check for rate limiting

3. **Memory Leaks**
   - Run soak tests to identify
   - Monitor Node.js heap usage
   - Check database connections are properly closed

## Reports

Test results are saved to `tests/k6/reports/` directory:
- JSON format for programmatic analysis
- HTML reports (if using k6 Cloud)

## CI/CD Integration

```yaml
# Example GitHub Actions
- name: Run k6 Load Test
  run: |
    k6 run tests/k6/scripts/load-test.js

# Only proceed if performance thresholds pass
```

## Best Practices

1. **Run tests against staging environment** - Not production
2. **Start small** - Begin with 10-20 VUs, gradually increase
3. **Monitor server metrics** - CPU, memory, disk I/O during tests
4. **Test realistic scenarios** - Mimic actual user behavior
5. **Regular testing** - Weekly load tests, monthly stress tests
6. **Track performance over time** - Compare results across releases

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Examples](https://k6.io/docs/examples/)
- [k6 Cloud](https://k6.io/cloud/) - Optional cloud service
