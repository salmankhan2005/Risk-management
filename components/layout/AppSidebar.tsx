'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Crosshair,
  Database,
  FileCheck2,
  FileText,
  History,
  LineChart,
  Network,
  Repeat,
  Shield,
  ShieldCheck,
  Sliders,
  Users,
  Wallet,
} from 'lucide-react';
import { useRiskWatch } from '@/lib/store';

export default function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { alerts, cases } = useRiskWatch();

  const openAlertsCount = alerts.filter((a) => a.status === 'New' || a.status === 'Open').length;
  const activeCasesCount = cases.filter((c) => c.status !== 'Resolved' && c.status !== 'Closed').length;

  const navGroups = [
    {
      group: 'OPERATIONS',
      items: [
        { label: 'Overview', href: '/app/overview', icon: BarChart3 },
        { label: 'Transactions', href: '/app/transactions', icon: ArrowLeftRight },
        { label: 'Accounts', href: '/app/accounts', icon: Wallet },
        { label: 'Customers', href: '/app/customers', icon: Users },
        { label: 'Transfers', href: '/app/transfers', icon: Repeat },
        { label: 'Alerts', href: '/app/alerts', icon: AlertTriangle, badge: openAlertsCount > 0 ? String(openAlertsCount) : undefined },
        { label: 'Cases', href: '/app/cases', icon: Briefcase, badge: activeCasesCount > 0 ? String(activeCasesCount) : undefined },
      ],
    },
    {
      group: 'INTELLIGENCE',
      items: [
        { label: 'Risk Rules', href: '/app/rules', icon: ShieldCheck },
        { label: 'Network Graph', href: '/app/network', icon: Network },
        { label: 'Analytics', href: '/app/analytics', icon: LineChart },
      ],
    },
    {
      group: 'DATA & LABS',
      items: [
        { label: 'Data Explorer', href: '/app/data-explorer', icon: Database },
        { label: 'Data Generator', href: '/app/data-generator', icon: Cpu },
        { label: 'Validation Lab', href: '/app/validation', icon: FileCheck2, badge: '5' },
        { label: 'Ground Truth', href: '/app/ground-truth', icon: Crosshair },
      ],
    },
    {
      group: 'GOVERNANCE',
      items: [
        { label: 'Reports', href: '/app/reports', icon: FileText },
        { label: 'Audit Trail', href: '/app/audit', icon: History },
        { label: 'System Settings', href: '/app/settings', icon: Sliders },
      ],
    },
  ];

  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Header with Brand and Collapse Toggle */}
      <div className="sidebar-header">
        <Link href="/" className="sidebar-brand" title="RiskWatch Home">
          <div className="sidebar-brand-mark">
            <Shield size={18} strokeWidth={2} />
          </div>
          {!collapsed && (
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-name">RiskWatch</span>
              <span className="sidebar-brand-tag">Risk Intelligence</span>
            </div>
          )}
        </Link>
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation Group Items */}
      <div className="sidebar-nav-scroll">
        {navGroups.map((group) => (
          <div key={group.group} className="sidebar-group">
            {!collapsed && <div className="sidebar-group-title">{group.group}</div>}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/app/overview' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                  title={item.label}
                >
                  <Icon size={16} className="sidebar-icon" strokeWidth={1.8} />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span className="sidebar-link-badge">{item.badge}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Sidebar Footer with Environment Badge */}
      <div className="sidebar-footer">
        {!collapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span className="sidebar-env-badge">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C7A16B', display: 'inline-block' }} />
              SYNTHETIC DATA (SEED 20261022)
            </span>
            <div style={{ fontSize: '10px', color: '#8C8577', lineHeight: 1.4 }}>
              Controlled environment · No live bank feeds
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', placeItems: 'center' }} title="Synthetic Dataset: 20261022">
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C7A16B' }} />
          </div>
        )}
      </div>
    </aside>
  );
}
