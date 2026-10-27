'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, BarChart2, Download, Filter, PieChart, TrendingUp } from 'lucide-react';
import { useRiskWatch } from '@/lib/store';
import {
  TransactionActivityChart,
  AlertSeverityChart,
  RuleTriggerChart,
  RiskScoreHistogram,
} from '@/components/ui/AppCharts';
import { formatCurrency } from '@/lib/data';

export default function AnalyticsPage() {
  const { transactions, alerts, rules, customers, accounts } = useRiskWatch();
  const [chartTab, setChartTab] = useState('activity');

  const totalVolume = transactions.reduce((s, t) => s + t.amount, 0);
  const avgRiskScore = transactions.reduce((s, t) => s + t.riskScore, 0) / transactions.length;
  const flaggedRate = (transactions.filter((t) => t.status === 'Flagged').length / transactions.length * 100).toFixed(1);
  const openAlerts = alerts.filter((a) => a.status !== 'Resolved' && a.status !== 'False Positive').length;

  const chartTabs = [
    { id: 'activity', label: 'Transaction Activity', icon: <Activity size={13} /> },
    { id: 'severity', label: 'Alert Severity', icon: <PieChart size={13} /> },
    { id: 'rules', label: 'Rule Triggers', icon: <BarChart2 size={13} /> },
    { id: 'histogram', label: 'Risk Distribution', icon: <TrendingUp size={13} /> },
  ];

  return (
    <div className="app-page-wrapper">
      <div className="app-page-header">
        <div className="app-page-title-block">
          <h1>Analytics</h1>
          <p>Aggregate risk trends, transaction patterns, and alert analytics across the synthetic dataset.</p>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Transaction Volume', value: formatCurrency(totalVolume), sub: `${transactions.length.toLocaleString()} records` },
          { label: 'Avg Risk Score', value: avgRiskScore.toFixed(1), sub: 'across all transactions' },
          { label: 'Flagged Rate', value: `${flaggedRate}%`, sub: 'of transactions flagged' },
          { label: 'Open Alerts', value: openAlerts.toLocaleString(), sub: 'requiring attention' },
          { label: 'Customers', value: customers.length.toLocaleString(), sub: `${customers.filter((c) => c.riskTier === 'High' || c.riskTier === 'Critical').length} high/critical` },
          { label: 'Accounts', value: accounts.length.toLocaleString(), sub: `${accounts.filter((a) => a.status === 'Closed').length} closed` },
        ].map((item) => (
          <div key={item.label} className="kpi-card">
            <div className="kpi-top"><span>{item.label}</span></div>
            <div className="kpi-value tabular-nums">{item.value}</div>
            <div style={{ fontSize: '10px', color: '#6F6A60', marginTop: '2px' }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {chartTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`filter-chip ${chartTab === t.id ? 'active' : ''}`}
            onClick={() => setChartTab(t.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Chart Display */}
      <div className="app-card">
        <div className="app-card-header">
          <h3 className="app-card-title">
            {chartTabs.find((t) => t.id === chartTab)?.icon}
            {chartTabs.find((t) => t.id === chartTab)?.label}
          </h3>
        </div>
        <div className="app-card-body" style={{ minHeight: '320px' }}>
          {chartTab === 'activity' && <TransactionActivityChart transactions={transactions} />}
          {chartTab === 'severity' && <AlertSeverityChart alerts={alerts} />}
          {chartTab === 'rules' && <RuleTriggerChart alerts={alerts} rules={rules} />}
          {chartTab === 'histogram' && <RiskScoreHistogram transactions={transactions} />}
        </div>
      </div>

      {/* Risk Breakdown Table */}
      <div className="app-card">
        <div className="app-card-header">
          <h3 className="app-card-title"><Filter size={15} color="#AD7048" /> Risk Tier Breakdown</h3>
        </div>
        <div className="app-card-body">
          <table className="app-table">
            <thead>
              <tr>
                <th>Risk Tier</th>
                <th>Customers</th>
                <th>Accounts</th>
                <th>Flagged Txns</th>
                <th>Active Alerts</th>
              </tr>
            </thead>
            <tbody>
              {['Critical', 'High', 'Medium', 'Low'].map((tier) => (
                <tr key={tier}>
                  <td>
                    <span className={`badge ${tier === 'Critical' ? 'badge-critical' : tier === 'High' ? 'badge-high' : tier === 'Medium' ? 'badge-medium' : 'badge-low'}`}>
                      {tier}
                    </span>
                  </td>
                  <td className="tabular-nums">{customers.filter((c) => c.riskTier === tier).length}</td>
                  <td className="tabular-nums">{accounts.filter((a) => a.riskLevel === tier).length}</td>
                  <td className="tabular-nums">{transactions.filter((t) => t.status === 'Flagged' && t.riskScore >= (tier === 'Critical' ? 80 : tier === 'High' ? 60 : tier === 'Medium' ? 40 : 0) && t.riskScore < (tier === 'Critical' ? 101 : tier === 'High' ? 80 : tier === 'Medium' ? 60 : 40)).length}</td>
                  <td className="tabular-nums">{alerts.filter((a) => a.severity === tier && a.status !== 'Resolved').length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
