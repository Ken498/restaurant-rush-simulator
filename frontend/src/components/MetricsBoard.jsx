import React from 'react';

function StatCard({ label, value, unit = '', color = '#e6edf3', bg, warn, pulse }) {
  return (
    <div style={{
      background: bg || 'var(--surface)',
      border: `1px solid ${warn ? '#f85149' : 'var(--border)'}`,
      borderRadius: 8, padding: '14px 16px',
      position: 'relative', overflow: 'hidden',
      transition: 'border-color 0.3s',
    }}>
      {pulse && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(248,81,73,0.07)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      )}
      <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 6, fontWeight: 600, letterSpacing: '0.08em' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700,
          color, lineHeight: 1, letterSpacing: '-0.02em',
        }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: 12, color: '#8b949e', fontFamily: 'var(--font-mono)' }}>{unit}</span>}
      </div>
    </div>
  );
}

function PoolBar({ used, total }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const color = pct >= 90 ? '#f85149' : pct >= 70 ? '#d29922' : '#3fb950';
  return (
    <div style={{
      background: 'var(--surface)', border: `1px solid ${pct >= 90 ? '#f85149' : 'var(--border)'}`,
      borderRadius: 8, padding: '14px 16px', transition: 'border-color 0.3s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: '#8b949e', fontWeight: 600, letterSpacing: '0.08em' }}>
          DB POOL UTILIZATION
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color, fontWeight: 700 }}>
          {used}/{total} ({pct}%)
        </span>
      </div>
      <div style={{ height: 6, background: '#30363d', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: color,
          borderRadius: 3, transition: 'width 0.4s, background 0.3s',
        }} />
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: '#8b949e' }}>
        {pct >= 90 ? '⚠ Pool saturated — bottleneck detected'
          : pct >= 70 ? '● Pool under pressure'
          : '● Pool healthy'}
      </div>
    </div>
  );
}

export default function MetricsBoard({ metrics }) {
  const errorRate = metrics.overallErrorRate ?? 0;
  const p95 = metrics.p95ResponseTime ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <StatCard label="TOTAL REQUESTS" value={metrics.totalRequests?.toLocaleString() ?? '0'} color="#58a6ff" />
        <StatCard
          label="FAILED REQUESTS"
          value={metrics.failedRequests?.toLocaleString() ?? '0'}
          color={metrics.failedRequests > 0 ? '#f85149' : '#3fb950'}
          warn={metrics.failedRequests > 0}
          pulse={metrics.failedRequests > 0}
        />
        <StatCard
          label="ERROR RATE"
          value={`${errorRate}`}
          unit="%"
          color={errorRate >= 20 ? '#f85149' : errorRate >= 5 ? '#d29922' : '#3fb950'}
          warn={errorRate >= 20}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <StatCard
          label="AVG RESPONSE TIME"
          value={metrics.avgResponseTime ?? 0}
          unit="ms"
          color={metrics.avgResponseTime > 500 ? '#f85149' : metrics.avgResponseTime > 200 ? '#d29922' : '#3fb950'}
        />
        <StatCard
          label="P95 RESPONSE TIME"
          value={p95}
          unit="ms"
          color={p95 > 1000 ? '#f85149' : p95 > 500 ? '#d29922' : '#3fb950'}
          warn={p95 > 1000}
        />
        <StatCard
          label="P99 RESPONSE TIME"
          value={metrics.p99ResponseTime ?? 0}
          unit="ms"
          color={metrics.p99ResponseTime > 2000 ? '#f85149' : '#f0883e'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <StatCard label="THROUGHPUT" value={metrics.timeSeriesData?.slice(-1)[0]?.throughput ?? 0} unit=" req/s" color="#a371f7" />
        <StatCard label="SUCCESS REQUESTS" value={metrics.successRequests?.toLocaleString() ?? '0'} color="#3fb950" />
      </div>

      <PoolBar used={metrics.activeConnections ?? 0} total={metrics.dbPoolSize ?? 5} />
    </div>
  );
}
