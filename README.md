# 🍔 Restaurant Rush Simulator

A performance testing dashboard that simulates hundreds of concurrent customers placing orders during peak hours. Built to demonstrate concepts like response time degradation, database connection pool exhaustion, and throughput under load — the same metrics you'd analyze in JMeter.

![Dashboard Preview](https://img.shields.io/badge/stack-Node.js%20%2B%20React-blue) ![License](https://img.shields.io/badge/license-MIT-green)

**🚀 Live Demo: [https://restaurant-rush-frontend.onrender.com](https://restaurant-rush-frontend.onrender.com)**

---

## What It Shows

- **Response Time** — Average, P95, and P99 latency as load increases
- **Throughput** — Requests per second delivered to the server
- **Error Rate** — Failed requests when the DB pool is exhausted
- **DB Pool Utilization** — Live view of connection pool pressure and saturation

---

## How It Works

There is no real database. The backend simulates a database connection pool using an in-memory counter and `setTimeout` to fake query latency. As concurrent requests exceed the pool size, latency spikes non-linearly and requests start failing — exactly what happens in a real overloaded system.

The frontend fires real HTTP `POST /api/order` requests from the browser, ramping up from 0 to your configured customer count over the ramp-up period. The server sees genuine concurrent connections, so all measured response times are real.

```
Browser (React)
  └── fires N fetch() calls every 100ms
        └── POST /api/order → Express server
              └── checks pool → simulates query → responds 200 or 503
```

---

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# Clone the repo
git clone https://github.com/Ken498/restaurant-rush-simulator.git
cd restaurant-rush-simulator

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
```

**Run (two terminals):**

```bash
# Terminal 1 — Backend (port 3001)
cd backend
npm start

# Terminal 2 — Frontend (port 5173)
cd frontend
npx vite
```

Open **http://localhost:5173**

---

## Load Presets

| Preset | Customers | Orders/sec | DB Pool | Expected Behavior |
|---|---|---|---|---|
| Quiet | 10 | 0.5 | 10 | Healthy — low latency, no errors |
| Lunch Rush | 80 | 1 | 5 | Moderate pressure, some queuing |
| Dinner Peak | 200 | 2 | 5 | Pool saturates, latency climbs |
| Chaos | 400 | 3 | 3 | High error rate, severe bottleneck |

---

## Configuration

All parameters are adjustable via the control panel at runtime:

| Parameter | Description |
|---|---|
| Concurrent Customers | Number of simulated users |
| Orders/sec per Customer | How frequently each customer places an order |
| Ramp-Up Time | Seconds to scale from 0 to full load |
| DB Pool Size | Max simultaneous DB connections (bottleneck knob) |
| Base Query Time | Simulated query latency at zero load |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/order` | Place a simulated order |
| `GET` | `/api/metrics` | Get current metrics + time-series data |
| `POST` | `/api/config` | Update simulation parameters |
| `POST` | `/api/reset` | Reset all metrics |
| `GET` | `/api/health` | Health check |

---

## Project Structure

```
restaurant-rush-simulator/
├── backend/
│   ├── server.js          # Express server, pool simulation, metrics
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx                      # Main layout, simulation loop
│   │   ├── components/
│   │   │   ├── ControlPanel.jsx         # Sliders, presets, start/stop
│   │   │   ├── MetricsBoard.jsx         # Live stat cards
│   │   │   └── Charts.jsx               # Recharts line/area charts
│   │   └── index.css
│   ├── index.html
│   └── vite.config.js     # Proxies /api → localhost:3001
└── package.json
```

---

## Relation to JMeter

This project visualizes the same concepts JMeter measures:

| Concept | JMeter | This Project |
|---|---|---|
| Virtual Users | Thread Groups | Simulated customers |
| Ramp-Up | Ramp-Up Period | Ramp-Up Time slider |
| Response Time | Aggregate Report | Response Time chart |
| Error Rate | Summary Report | Error Rate chart |
| Throughput | Throughput column | RPS chart |
| Think Time | Constant Timer | Orders/sec setting |

The key difference: JMeter generates load from external threads; this simulator generates load from browser `fetch()` calls. The server-side behavior and metrics are identical in concept.

---

## License

MIT
