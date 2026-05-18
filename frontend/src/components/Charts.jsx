import React from 'react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const GRID = { stroke: '#21262d', strokeDasharray: '3 3' };
const AXIS = { fill: '#8b949e', fontSize: 11, fontFamily: 'var(--font-mono)' };

function ChartCard({ title, subtitle, children }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '16px 16px 12px',
    }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#e6edf3', letterSpacing: '0.03em' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function CustomTooltip({ active, payload, label, unit = 'ms' }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1c2128', border: '1px solid #30363d', borderRadius: 6,
      padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 11,
    }}>
      <div style={{ color: '#8b949e', marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, display: 'flex', gap: 8 }}>
          <span>{p.name}:</span>
          <span style={{ fontWeight: 700 }}>{Math.round(p.value)}{unit}</span>
        </div>
      ))}
    </div>
  );
}

export default function Charts({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
        gridTemplateRows: 'auto auto',
      }}>
        {['Response Time', 'Throughput', 'Error Rate', 'Pool Utilization'].map(title => (
          <ChartCard key={title} title={title}>
            <div style={{
              height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#8b949e', fontSize: 12, fontStyle: 'italic',
            }}>
              Waiting for data — start the simulation
            </div>
          </ChartCard>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

      {/* Response Time */}
      <ChartCard title="Response Time" subtitle="Average, P95, and P99 latency over time">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="time" tick={AXIS} interval="preserveStartEnd" />
            <YAxis tick={AXIS} unit="ms" />
            <Tooltip content={<CustomTooltip unit="ms" />} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-mono)' }} />
            <ReferenceLine y={200} stroke="#d29922" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: 'SLA', fill: '#d29922', fontSize: 10 }} />
            <Line type="monotone" dataKey="avgResponseTime" name="Avg" stroke="#3fb950" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="p95ResponseTime" name="P95" stroke="#f0883e" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="p99ResponseTime" name="P99" stroke="#f85149" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Throughput */}
      <ChartCard title="Throughput" subtitle="Requests per second">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="tpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a371f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a371f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="time" tick={AXIS} interval="preserveStartEnd" />
            <YAxis tick={AXIS} unit="/s" />
            <Tooltip content={<CustomTooltip unit="/s" />} />
            <Area type="monotone" dataKey="throughput" name="RPS" stroke="#a371f7" fill="url(#tpGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Error Rate */}
      <ChartCard title="Error Rate" subtitle="Percentage of failed requests (5s window)">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f85149" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f85149" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="time" tick={AXIS} interval="preserveStartEnd" />
            <YAxis tick={AXIS} unit="%" domain={[0, 100]} />
            <Tooltip content={<CustomTooltip unit="%" />} />
            <ReferenceLine y={5} stroke="#d29922" strokeDasharray="4 4" strokeOpacity={0.6} label={{ value: '5%', fill: '#d29922', fontSize: 10 }} />
            <Area type="monotone" dataKey="errorRate" name="Errors" stroke="#f85149" fill="url(#errGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* DB Pool Utilization */}
      <ChartCard title="DB Pool Utilization" subtitle="Active connections vs pool capacity (%)">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="poolGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f0883e" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f0883e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="time" tick={AXIS} interval="preserveStartEnd" />
            <YAxis tick={AXIS} unit="%" domain={[0, 100]} />
            <Tooltip content={<CustomTooltip unit="%" />} />
            <ReferenceLine y={80} stroke="#d29922" strokeDasharray="4 4" strokeOpacity={0.6} label={{ value: 'Warning', fill: '#d29922', fontSize: 10 }} />
            <ReferenceLine y={100} stroke="#f85149" strokeDasharray="4 4" strokeOpacity={0.6} label={{ value: 'Max', fill: '#f85149', fontSize: 10 }} />
            <Area type="monotone" dataKey="poolUtilization" name="Pool %" stroke="#f0883e" fill="url(#poolGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

    </div>
  );
}
