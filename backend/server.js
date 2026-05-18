const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const MENU_ITEMS = ['Burger', 'Pizza', 'Steak', 'Fries', 'Salad', 'Pasta', 'Sushi', 'Wings', 'Tacos', 'Soup'];

let config = {
  dbPoolSize: 5,
  baseQueryTime: 80,       // ms
  errorRateAtCapacity: 0.35,
};

let poolUsed = 0;
let totalRequests = 0;
let failedRequests = 0;

// Rolling windows for metrics
let recentResponseTimes = [];  // { timestamp, time, failed }
let recentRequests = [];       // timestamps for throughput
let timeSeriesData = [];       // snapshots every second

function getAvg(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function getPercentile(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(Math.floor(sorted.length * p), sorted.length - 1);
  return sorted[idx];
}

function simulateQueryTime() {
  const loadRatio = poolUsed / Math.max(config.dbPoolSize, 1);
  // Latency spikes non-linearly under load
  const loadPenalty = Math.pow(loadRatio, 2) * config.baseQueryTime * 4;
  const base = config.baseQueryTime + loadPenalty;
  const jitter = (Math.random() - 0.5) * base * 0.3;
  return Math.max(15, base + jitter);
}

// Snapshot every second
setInterval(() => {
  const now = Date.now();
  const win5s = now - 5000;
  const win1s = now - 1000;

  recentRequests = recentRequests.filter(t => t > win1s);
  const throughput = recentRequests.length;

  recentResponseTimes = recentResponseTimes.filter(r => r.timestamp > win5s);
  const times = recentResponseTimes.map(r => r.time);
  const failed5s = recentResponseTimes.filter(r => r.failed).length;

  const snapshot = {
    time: new Date(now).toLocaleTimeString('en-US', { hour12: false }),
    avgResponseTime: Math.round(getAvg(times)),
    p95ResponseTime: Math.round(getPercentile(times, 0.95)),
    p99ResponseTime: Math.round(getPercentile(times, 0.99)),
    throughput,
    errorRate: recentResponseTimes.length
      ? Math.round((failed5s / recentResponseTimes.length) * 100)
      : 0,
    activeConnections: poolUsed,
    poolUtilization: Math.round((poolUsed / config.dbPoolSize) * 100),
  };

  timeSeriesData.push(snapshot);
  if (timeSeriesData.length > 60) timeSeriesData.shift();
}, 1000);

app.post('/api/order', async (req, res) => {
  const start = Date.now();
  totalRequests++;
  recentRequests.push(start);

  const record = (failed) => {
    const elapsed = Date.now() - start;
    recentResponseTimes.push({ timestamp: start, time: elapsed, failed });
    if (failed) failedRequests++;
    return elapsed;
  };

  // Pool exhausted: fail or queue briefly
  if (poolUsed >= config.dbPoolSize) {
    if (Math.random() < config.errorRateAtCapacity) {
      const elapsed = record(true);
      return res.status(503).json({
        error: 'DB_POOL_EXHAUSTED',
        message: 'Database connection pool exhausted — request rejected',
        responseTime: elapsed,
      });
    }

    // Short queue wait
    const waitTime = 150 + Math.random() * 350;
    await new Promise(r => setTimeout(r, waitTime));

    if (poolUsed >= config.dbPoolSize) {
      const elapsed = record(true);
      return res.status(503).json({
        error: 'QUEUE_TIMEOUT',
        message: 'Timed out waiting for a free DB connection',
        responseTime: elapsed,
      });
    }
  }

  poolUsed++;
  try {
    const queryMs = simulateQueryTime();
    await new Promise(r => setTimeout(r, queryMs));

    // Rare random DB error
    if (Math.random() < 0.015) {
      throw new Error('DEADLOCK: Transaction was chosen as the deadlock victim');
    }

    const elapsed = record(false);
    return res.json({
      success: true,
      orderId: `ORD-${Date.now()}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
      item: req.body.item || 'Burger',
      table: Math.ceil(Math.random() * 30),
      responseTime: elapsed,
    });
  } catch (err) {
    const elapsed = record(true);
    return res.status(500).json({ error: 'DB_ERROR', message: err.message, responseTime: elapsed });
  } finally {
    poolUsed--;
  }
});

app.get('/api/metrics', (req, res) => {
  const times = recentResponseTimes.map(r => r.time);
  res.json({
    totalRequests,
    failedRequests,
    successRequests: totalRequests - failedRequests,
    avgResponseTime: Math.round(getAvg(times)),
    p95ResponseTime: Math.round(getPercentile(times, 0.95)),
    p99ResponseTime: Math.round(getPercentile(times, 0.99)),
    activeConnections: poolUsed,
    dbPoolSize: config.dbPoolSize,
    poolUtilization: Math.round((poolUsed / config.dbPoolSize) * 100),
    overallErrorRate: totalRequests
      ? Math.round((failedRequests / totalRequests) * 100)
      : 0,
    timeSeriesData,
    config,
  });
});

app.post('/api/config', (req, res) => {
  const { dbPoolSize, baseQueryTime, errorRateAtCapacity } = req.body;
  if (dbPoolSize !== undefined) config.dbPoolSize = Math.max(1, Math.min(100, Number(dbPoolSize)));
  if (baseQueryTime !== undefined) config.baseQueryTime = Math.max(10, Math.min(3000, Number(baseQueryTime)));
  if (errorRateAtCapacity !== undefined) config.errorRateAtCapacity = Math.max(0, Math.min(1, Number(errorRateAtCapacity)));
  res.json({ success: true, config });
});

app.post('/api/reset', (req, res) => {
  totalRequests = 0;
  failedRequests = 0;
  recentResponseTimes = [];
  recentRequests = [];
  timeSeriesData = [];
  poolUsed = 0;
  res.json({ success: true });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', poolUsed, poolSize: config.dbPoolSize });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n  Restaurant Rush Backend\n  http://localhost:${PORT}\n`);
});
