'use client';

import React, { useState } from 'react';
import { Alert, RiskRule, Transaction } from '@/lib/types';

// 1. Transaction Activity Volume & Amount Chart
export function TransactionActivityChart({
  dailyData: customDailyData,
  transactions,
}: {
  dailyData?: { date: string; volume: number; amount: number }[];
  transactions?: Transaction[];
}) {
  const [metric, setMetric] = useState<'amount' | 'volume'>('amount');

  // Compute dailyData if transactions are passed
  const dailyData = React.useMemo(() => {
    if (customDailyData && customDailyData.length > 0) return customDailyData;
    if (transactions && transactions.length > 0) {
      // Group by last 7 distinct days or generate summary
      const map: Record<string, { volume: number; amount: number }> = {};
      transactions.forEach((tx) => {
        const d = tx.timestamp ? tx.timestamp.split('T')[0] : '2026-10-22';
        if (!map[d]) map[d] = { volume: 0, amount: 0 };
        map[d].volume += 1;
        map[d].amount += tx.amount || 0;
      });
      const entries = Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
      if (entries.length > 0) {
        return entries.slice(-7).map(([date, val]) => ({
          date: date.slice(5),
          volume: val.volume,
          amount: Math.round(val.amount),
        }));
      }
    }
    // Fallback baseline
    return [
      { date: '10-16', volume: 1420, amount: 18500000 },
      { date: '10-17', volume: 1680, amount: 22100000 },
      { date: '10-18', volume: 1950, amount: 28400000 },
      { date: '10-19', volume: 1540, amount: 19800000 },
      { date: '10-20', volume: 2210, amount: 34200000 },
      { date: '10-21', volume: 2490, amount: 41000000 },
      { date: '10-22', volume: 2150, amount: 32600000 },
    ];
  }, [customDailyData, transactions]);

  const maxVal = Math.max(...dailyData.map((d) => (metric === 'amount' ? d.amount : d.volume)), 1);
  const chartHeight = 180;
  const chartWidth = 520;
  const paddingX = 40;
  const paddingY = 20;

  const points = dailyData.map((d, idx) => {
    const val = metric === 'amount' ? d.amount : d.volume;
    const x = paddingX + (idx / Math.max(dailyData.length - 1, 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - (val / maxVal) * (chartHeight - paddingY * 2);
    return { x, y, val, date: d.date };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
    : '';

  return (
    <div className="app-card" style={{ height: '100%' }}>
      <div className="app-card-header">
        <div>
          <h3 className="app-card-title">Transaction Activity Timeline</h3>
          <p className="app-card-subtitle">Daily synthetic ledger velocity & capital flow</p>
        </div>
        <div style={{ display: 'flex', gap: '4px', background: '#F3EEE4', padding: '2px', borderRadius: '5px', border: '1px solid #D9D1C4' }}>
          <button
            type="button"
            onClick={() => setMetric('amount')}
            style={{
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 600,
              background: metric === 'amount' ? '#171713' : 'transparent',
              color: metric === 'amount' ? '#FAF7F0' : '#6F6A60',
              border: 0,
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Amount (INR)
          </button>
          <button
            type="button"
            onClick={() => setMetric('volume')}
            style={{
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 600,
              background: metric === 'volume' ? '#171713' : 'transparent',
              color: metric === 'volume' ? '#FAF7F0' : '#6F6A60',
              border: 0,
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Txn Count
          </button>
        </div>
      </div>

      <div className="app-card-body" style={{ padding: '16px' }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#AD7048" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#AD7048" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#E7DFD3" strokeDasharray="3 3" />
          <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="#E7DFD3" strokeDasharray="3 3" />
          <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#D9D1C4" />

          {/* Area & Line */}
          {areaD && <path d={areaD} fill="url(#areaGradient)" />}
          {pathD && <path d={pathD} fill="none" stroke="#AD7048" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

          {/* Points */}
          {points.map((p, idx) => (
            <g key={idx} className="cursor-pointer">
              <circle cx={p.x} cy={p.y} r="4" fill="#FAF7F0" stroke="#AD7048" strokeWidth="2" />
              <text x={p.x} y={chartHeight - 4} fontSize="9" textAnchor="middle" fill="#6F6A60">
                {p.date}
              </text>
            </g>
          ))}
        </svg>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6F6A60', marginTop: '8px' }}>
          <span>Peak: {metric === 'amount' ? `₹${(maxVal).toLocaleString('en-IN')}` : `${maxVal} txns`}</span>
          <span>Window: 7-day trailing synthetic baseline</span>
        </div>
      </div>
    </div>
  );
}

// 2. Alert Severity Distribution
export function AlertSeverityChart({
  severities: customSeverities,
  alerts,
}: {
  severities?: { critical: number; high: number; medium: number; low: number };
  alerts?: Alert[];
}) {
  const severities = React.useMemo(() => {
    if (customSeverities) return customSeverities;
    if (alerts && alerts.length > 0) {
      return {
        critical: alerts.filter((a) => a.severity === 'Critical').length,
        high: alerts.filter((a) => a.severity === 'High').length,
        medium: alerts.filter((a) => a.severity === 'Medium').length,
        low: alerts.filter((a) => a.severity === 'Low').length,
      };
    }
    return { critical: 120, high: 280, medium: 420, low: 180 };
  }, [customSeverities, alerts]);

  const total = severities.critical + severities.high + severities.medium + severities.low || 1;

  const items = [
    { label: 'Critical', count: severities.critical, color: '#D94C42', pct: Math.round((severities.critical / total) * 100) },
    { label: 'High', count: severities.high, color: '#AD7048', pct: Math.round((severities.high / total) * 100) },
    { label: 'Medium', count: severities.medium, color: '#E3A449', pct: Math.round((severities.medium / total) * 100) },
    { label: 'Low', count: severities.low, color: '#75856B', pct: Math.round((severities.low / total) * 100) },
  ];

  return (
    <div className="app-card" style={{ height: '100%' }}>
      <div className="app-card-header">
        <div>
          <h3 className="app-card-title">Alert Severity Profile</h3>
          <p className="app-card-subtitle">Distribution across active triage signals</p>
        </div>
      </div>
      <div className="app-card-body">
        {/* Multi-segment Progress Bar */}
        <div style={{ height: '14px', borderRadius: '7px', display: 'flex', overflow: 'hidden', background: '#E7DFD3', marginBottom: '20px' }}>
          {items.map((it) => (
            <div
              key={it.label}
              style={{
                width: `${it.pct}%`,
                background: it.color,
                transition: 'width 0.3s ease',
              }}
              title={`${it.label}: ${it.count} (${it.pct}%)`}
            />
          ))}
        </div>

        {/* Legend Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {items.map((it) => (
            <div key={it.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#F3EEE4', borderRadius: '6px', border: '1px solid #E7DFD3' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: it.color }} />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>{it.label}</span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700 }}>
                {it.count} <small style={{ color: '#6F6A60', fontWeight: 500 }}>({it.pct}%)</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 3. Top Triggered Rules Bar Chart / RuleTriggerChart
export function TopTriggeredRulesChart({
  rules: inputRules,
  alerts,
}: {
  rules?: { name: string; triggersCount: number; category: string }[] | RiskRule[];
  alerts?: Alert[];
}) {
  const chartRules = React.useMemo(() => {
    if (inputRules && inputRules.length > 0) {
      return (inputRules as any[]).map((r) => ({
        name: r.name,
        category: r.category,
        triggersCount: r.triggersCount ?? (alerts ? alerts.filter((a) => a.ruleIds?.includes(r.id)).length : 0),
      }));
    }
    return [
      { name: 'Velocity Spike', category: 'Velocity', triggersCount: 312 },
      { name: 'New Device', category: 'Device', triggersCount: 184 },
      { name: 'Circular Loop', category: 'Topology', triggersCount: 42 },
      { name: 'High Value Threshold', category: 'Value', triggersCount: 220 },
      { name: 'High-Risk Merchant', category: 'Merchant', triggersCount: 95 },
    ];
  }, [inputRules, alerts]);

  const max = Math.max(...chartRules.map((r) => r.triggersCount), 1);

  return (
    <div className="app-card" style={{ height: '100%' }}>
      <div className="app-card-header">
        <div>
          <h3 className="app-card-title">Rule Evaluation Frequencies</h3>
          <p className="app-card-subtitle">Active trigger counts across current transactions</p>
        </div>
      </div>
      <div className="app-card-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {chartRules.map((r) => {
            const pct = Math.round((r.triggersCount / max) * 100);
            return (
              <div key={r.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                  <span style={{ fontWeight: 600, color: '#171713' }}>{r.name}</span>
                  <span style={{ fontWeight: 700, color: '#AD7048' }}>{r.triggersCount} triggers</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#E7DFD3', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #AD7048, #C7A16B)',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const RuleTriggerChart = TopTriggeredRulesChart;

// 4. Risk Score Histogram
export function RiskScoreHistogram({
  distribution: customDistribution,
  transactions,
}: {
  distribution?: { range: string; count: number }[];
  transactions?: Transaction[];
}) {
  const distribution = React.useMemo(() => {
    if (customDistribution && customDistribution.length > 0) return customDistribution;
    if (transactions && transactions.length > 0) {
      const buckets = [
        { range: '0-20', count: 0 },
        { range: '21-40', count: 0 },
        { range: '41-60', count: 0 },
        { range: '61-80', count: 0 },
        { range: '81-100', count: 0 },
      ];
      transactions.forEach((t) => {
        const s = t.riskScore || 0;
        if (s <= 20) buckets[0].count++;
        else if (s <= 40) buckets[1].count++;
        else if (s <= 60) buckets[2].count++;
        else if (s <= 80) buckets[3].count++;
        else buckets[4].count++;
      });
      return buckets;
    }
    return [
      { range: '0-20', count: 45000 },
      { range: '21-40', count: 32000 },
      { range: '41-60', count: 15000 },
      { range: '61-80', count: 6200 },
      { range: '81-100', count: 1800 },
    ];
  }, [customDistribution, transactions]);

  const max = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <div className="app-card" style={{ height: '100%' }}>
      <div className="app-card-header">
        <div>
          <h3 className="app-card-title">Risk Score Distribution</h3>
          <p className="app-card-subtitle">Histogram of calibrated scores (0-100 scale)</p>
        </div>
      </div>
      <div className="app-card-body">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', height: '140px', paddingBottom: '20px', borderBottom: '1px solid #D9D1C4' }}>
          {distribution.map((d, idx) => {
            const heightPct = Math.max(8, Math.round((d.count / max) * 100));
            const isHigh = idx >= 3;
            return (
              <div
                key={d.range}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                }}
              >
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#6F6A60', marginBottom: '4px' }}>
                  {d.count}
                </span>
                <div
                  style={{
                    width: '80%',
                    height: `${heightPct}%`,
                    background: isHigh ? '#D94C42' : '#AD7048',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease',
                  }}
                  title={`${d.range}: ${d.count} records`}
                />
                <span style={{ fontSize: '9px', color: '#6F6A60', marginTop: '6px', whiteSpace: 'nowrap' }}>
                  {d.range}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
