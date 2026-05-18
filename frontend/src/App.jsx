import React, { useState, useRef, useEffect, useCallback } from 'react';
import ControlPanel from './components/ControlPanel.jsx';
import MetricsBoard from './components/MetricsBoard.jsx';
import Charts from './components/Charts.jsx';

const MENU_ITEMS = ['Burger', 'Pizza', 'Steak', 'Fries', 'Salad', 'Pasta', 'Sushi', 'Wings', 'Tacos', 'Soup'];

const DEFAULT_CONFIG = {
  customers: 50,
  ordersPerSec: 1,
  rampUpTime: 10,
  dbPoolSize: 5,
  baseQueryTime: 80,
};

const EMPTY_METRICS = {
  totalRequests: 0, failedRequests: 0, successRequests: 0,
  avgResponseTime: 0, p95ResponseTime: 0, p99ResponseTime: 0,
  activeConnections: 0, dbPoolSize: 5, poolUtilization: 0,
  overallErrorRate: 0, timeSeriesData: [],
};

function StatusBadge({ isRunning, backendOk }) {
  if (!backendOk) return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
      background: '#3d1a1a', border: '1px solid #f85149', borderRadius: 20,
      fontSize: 11, color: '#f85149', fontFamily: 'var(--font-mono)',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f85149' }} />
      Backend offline
    </div>
  );

  if (isRunning) return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
      background: '#1a3d23', border: '1px solid #3fb950', borderRadius: 20,
      fontSize: 11, color: '#3fb950', fontFamily: 'var(--font-mono)',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: '#3fb950',
        animation: 'pulse 1s ease-in-out infinite',
      }} />
      LIVE — Simulation running
    </div>
  );

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
      background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 20,
      fontSize: 11, color: '#8b949e', fontFamily: 'var(--font-mono)',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b949e' }} />
      Idle
    </div>
  );
}

export default function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [metrics, setMetrics] = useState(EMPTY_METRICS);
  const [isRunning, setIsRunning] = useState(false);
  const [backendOk, setBackendOk] = useState(false);
  const [log, setLog] = useState([]);

  const simulationRef = useRef(null);
  const pollRef = useRef(null);
  const startTimeRef = useRef(null);
  const configRef = useRef(config);
  configRef.current = config;

  const pushLog = useCallback((msg, type = 'info') => {
    const colors = { info: '#8b949e', ok: '#3fb950', error: '#f85149', warn: '#d29922' };
    setLog(prev => [
      { id: Date.now() + Math.random(), msg, color: colors[type], ts: new Date().toLocaleTimeString('en-US', { hour12: false }) },
      ...prev,
    ].slice(0, 20));
  }, []);

  // Check backend health
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/health');
        setBackendOk(res.ok);
      } catch {
        setBackendOk(false);
      }
    };
    check();
    const id = setInterval(check, 3000);
    return () => clearInterval(id);
  }, []);

  // Poll metrics
  const startPolling = useCallback(() => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/metrics');
        const data = await res.json();
        setMetrics(data);
      } catch {
        // ignore
      }
    }, 500);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const handleStart = useCallback(async () => {
    // Push config to backend
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dbPoolSize: config.dbPoolSize,
          baseQueryTime: config.baseQueryTime,
        }),
      });
    } catch {
      pushLog('Could not reach backend!', 'error');
      return;
    }

    setIsRunning(true);
    startTimeRef.current = Date.now();
    pushLog(`Rush started — ${config.customers} customers, ${config.ordersPerSec}/s each`, 'ok');

    startPolling();

    // Simulation loop: fire requests every 100ms
    simulationRef.current = setInterval(() => {
      const cfg = configRef.current;
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const rampFactor = Math.min(1, elapsed / Math.max(1, cfg.rampUpTime));
      const activeCustomers = Math.floor(cfg.customers * rampFactor);

      if (activeCustomers === 0) return;

      // requests per 100ms tick
      const batchSize = Math.max(1, Math.round((activeCustomers * cfg.ordersPerSec) / 10));

      for (let i = 0; i < batchSize; i++) {
        const item = MENU_ITEMS[Math.floor(Math.random() * MENU_ITEMS.length)];
        fetch('/api/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item }),
        }).catch(() => {});
      }
    }, 100);
  }, [config, startPolling, pushLog]);

  const handleStop = useCallback(() => {
    if (simulationRef.current) { clearInterval(simulationRef.current); simulationRef.current = null; }
    stopPolling();
    setIsRunning(false);
    pushLog('Simulation stopped.', 'warn');
  }, [stopPolling, pushLog]);

  const handleReset = useCallback(async () => {
    try {
      await fetch('/api/reset', { method: 'POST' });
      setMetrics(EMPTY_METRICS);
      setLog([]);
      pushLog('Metrics reset.', 'info');
    } catch {
      pushLog('Reset failed — backend unreachable', 'error');
    }
  }, [pushLog]);

  const handleConfigChange = useCallback((patch) => {
    setConfig(prev => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => () => { handleStop(); }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)', padding: '14px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>🍔</span>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.02em' }}>
              Restaurant Rush Simulator
            </h1>
            <div style={{ fontSize: 11, color: '#8b949e', fontFamily: 'var(--font-mono)' }}>
              Performance Testing Dashboard — Peak Hour Load Simulation
            </div>
          </div>
        </div>
        <StatusBadge isRunning={isRunning} backendOk={backendOk} />
      </header>

      {/* Backend warning */}
      {!backendOk && (
        <div style={{
          background: '#3d1a1a', borderBottom: '1px solid #f85149',
          padding: '10px 28px', fontSize: 12, color: '#f85149',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>⚠</span>
          <span>Backend not reachable. Run: <code style={{ fontFamily: 'var(--font-mono)', background: '#1a1a1a', padding: '1px 6px', borderRadius: 3 }}>cd backend && npm install && npm start</code></span>
        </div>
      )}

      {/* Main layout */}
      <div style={{
        display: 'grid', gridTemplateColumns: '280px 1fr',
        gap: 16, padding: 20, maxWidth: 1400, margin: '0 auto',
        alignItems: 'start',
      }}>
        {/* Left: Control panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ControlPanel
            config={config}
            onConfigChange={handleConfigChange}
            onStart={handleStart}
            onStop={handleStop}
            onReset={handleReset}
            isRunning={isRunning}
          />

          {/* Event log */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, padding: 14,
          }}>
            <div style={{ fontSize: 11, color: '#8b949e', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 8 }}>
              EVENT LOG
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3,
            }}>
              {log.length === 0
                ? <span style={{ color: '#8b949e', fontStyle: 'italic' }}>No events yet.</span>
                : log.map(e => (
                  <div key={e.id} style={{ display: 'flex', gap: 8 }}>
                    <span style={{ color: '#484f58' }}>{e.ts}</span>
                    <span style={{ color: e.color }}>{e.msg}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Right: Metrics + Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <MetricsBoard metrics={metrics} />
          <Charts data={metrics.timeSeriesData} />
        </div>
      </div>
    </div>
  );
}
