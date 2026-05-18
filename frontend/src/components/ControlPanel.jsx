import React from 'react';

const PRESETS = [
  { label: 'Quiet', customers: 10, ordersPerSec: 0.5, rampUp: 5, dbPool: 10, queryTime: 60 },
  { label: 'Lunch Rush', customers: 80, ordersPerSec: 1, rampUp: 10, dbPool: 5, queryTime: 80 },
  { label: 'Dinner Peak', customers: 200, ordersPerSec: 2, rampUp: 15, dbPool: 5, queryTime: 100 },
  { label: 'Chaos', customers: 400, ordersPerSec: 3, rampUp: 8, dbPool: 3, queryTime: 120 },
];

function Slider({ label, value, min, max, step = 1, unit = '', onChange, color = '#58a6ff' }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: '#8b949e', fontSize: 12 }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color, fontWeight: 600 }}>
          {value}{unit}
        </span>
      </div>
      <div style={{ position: 'relative', height: 4, background: '#30363d', borderRadius: 2 }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.1s',
        }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            position: 'absolute', inset: '-8px 0', width: '100%', height: 20,
            opacity: 0, cursor: 'pointer', zIndex: 1,
          }}
        />
      </div>
    </div>
  );
}

export default function ControlPanel({ config, onConfigChange, onStart, onStop, onReset, isRunning }) {
  const applyPreset = (preset) => {
    onConfigChange({
      customers: preset.customers,
      ordersPerSec: preset.ordersPerSec,
      rampUpTime: preset.rampUp,
      dbPoolSize: preset.dbPool,
      baseQueryTime: preset.queryTime,
    });
  };

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 18,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>⚙️</span>
        <h2 style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.05em', color: '#e6edf3' }}>
          CONTROL PANEL
        </h2>
      </div>

      {/* Presets */}
      <div>
        <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 8, fontWeight: 600, letterSpacing: '0.08em' }}>
          LOAD PRESETS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              disabled={isRunning}
              style={{
                padding: '6px 10px', background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 6, color: isRunning ? '#8b949e' : '#e6edf3', fontSize: 12,
                cursor: isRunning ? 'not-allowed' : 'pointer', fontFamily: 'var(--font)',
                fontWeight: 500, transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => { if (!isRunning) e.target.style.borderColor = '#58a6ff'; }}
              onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div>
        <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 12, fontWeight: 600, letterSpacing: '0.08em' }}>
          LOAD CONFIGURATION
        </div>
        <Slider label="Concurrent Customers" value={config.customers} min={1} max={500} unit=" users"
          color="#58a6ff" onChange={v => onConfigChange({ customers: v })} />
        <Slider label="Orders / sec per Customer" value={config.ordersPerSec} min={0.1} max={5} step={0.1} unit="/s"
          color="#3fb950" onChange={v => onConfigChange({ ordersPerSec: v })} />
        <Slider label="Ramp-Up Time" value={config.rampUpTime} min={1} max={60} unit="s"
          color="#a371f7" onChange={v => onConfigChange({ rampUpTime: v })} />
      </div>

      <div>
        <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 12, fontWeight: 600, letterSpacing: '0.08em' }}>
          DATABASE CONFIGURATION
        </div>
        <Slider label="DB Connection Pool Size" value={config.dbPoolSize} min={1} max={50} unit=" conns"
          color="#f0883e" onChange={v => onConfigChange({ dbPoolSize: v })} />
        <Slider label="Base Query Time" value={config.baseQueryTime} min={10} max={500} unit="ms"
          color="#d29922" onChange={v => onConfigChange({ baseQueryTime: v })} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {!isRunning ? (
          <button onClick={onStart} style={{
            gridColumn: '1 / -1', padding: '10px 0', background: '#238636',
            border: '1px solid #2ea043', borderRadius: 8, color: '#fff',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)',
            letterSpacing: '0.04em', transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.target.style.background = '#2ea043'}
            onMouseLeave={e => e.target.style.background = '#238636'}
          >
            ▶ START RUSH
          </button>
        ) : (
          <button onClick={onStop} style={{
            gridColumn: '1 / -1', padding: '10px 0', background: '#da3633',
            border: '1px solid #f85149', borderRadius: 8, color: '#fff',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)',
            letterSpacing: '0.04em', transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.target.style.background = '#f85149'}
            onMouseLeave={e => e.target.style.background = '#da3633'}
          >
            ■ STOP
          </button>
        )}
        <button onClick={onReset} disabled={isRunning} style={{
          gridColumn: '1 / -1', padding: '8px 0', background: 'transparent',
          border: '1px solid var(--border)', borderRadius: 8,
          color: isRunning ? '#8b949e' : '#e6edf3', fontSize: 12,
          cursor: isRunning ? 'not-allowed' : 'pointer', fontFamily: 'var(--font)',
          fontWeight: 500,
        }}>
          Reset Metrics
        </button>
      </div>

      <div style={{
        padding: '10px 12px', background: 'var(--surface2)', borderRadius: 6,
        border: '1px solid var(--border)', fontSize: 11, color: '#8b949e',
        fontFamily: 'var(--font-mono)',
      }}>
        <div>Target RPS: <span style={{ color: '#58a6ff' }}>
          {(config.customers * config.ordersPerSec).toFixed(1)}
        </span> req/s</div>
        <div>DB Pool: <span style={{ color: '#f0883e' }}>{config.dbPoolSize}</span> connections</div>
        <div>Ramp-up: <span style={{ color: '#a371f7' }}>{config.rampUpTime}s</span></div>
      </div>
    </div>
  );
}
