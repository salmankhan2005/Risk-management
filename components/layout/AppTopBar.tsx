'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AlertTriangle,
  Bell,
  Calendar,
  ChevronRight,
  Contrast,
  ExternalLink,
  Search,
  Shield,
  UserCheck,
} from 'lucide-react';
import { UserButton, useUser } from '@clerk/nextjs';
import { useRiskWatch } from '@/lib/store';
import { UserRole } from '@/lib/types';

interface AppTopBarProps {
  onOpenSearch: () => void;
  theme: 'riskwatch' | 'monochrome' | 'smoky';
  onThemeChange: (theme: 'riskwatch' | 'monochrome' | 'smoky') => void;
}

export default function AppTopBar({ onOpenSearch, theme, onThemeChange }: AppTopBarProps) {
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const {
    currentRole,
    setCurrentRole,
    alerts,
    workspaceSyncStatus,
  } = useRiskWatch();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Compute breadcrumbs
  const segments = pathname.split('/').filter(Boolean);
  // e.g. ['app', 'transactions', 'TXN-2026-00000001']

  const unreadAlerts = alerts.filter((a) => a.status === 'New' || a.status === 'Open').slice(0, 5);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentRole(e.target.value as UserRole);
  };

  return (
    <header className="app-topbar">
      {/* Breadcrumb Navigation */}
      <nav className="app-breadcrumbs" aria-label="Breadcrumbs">
        <Link href="/app/overview">RiskWatch</Link>
        {segments.map((segment, index) => {
          if (segment === 'app') return null;
          const isLast = index === segments.length - 1;
          const href = '/' + segments.slice(0, index + 1).join('/');
          const formatted = segment
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
          return (
            <React.Fragment key={href}>
              <ChevronRight size={13} color="#9C9588" />
              {isLast ? (
                <span className="app-breadcrumbs-current">{formatted}</span>
              ) : (
                <Link href={href}>{formatted}</Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Topbar Actions */}
      <div className="app-topbar-actions">
        {/* Global Search Button */}
        <button
          type="button"
          className="app-search-btn"
          onClick={onOpenSearch}
          title="Search all entities (Ctrl+K or Cmd+K)"
        >
          <Search size={14} color="#AD7048" />
          <span>Quick search...</span>
          <kbd>⌘K</kbd>
        </button>

        {/* Date Window */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: '#6F6A60',
            background: '#F3EEE4',
            padding: '5px 10px',
            borderRadius: '6px',
            border: '1px solid #D9D1C4',
          }}
          className="app-date-window hidden md:flex"
        >
          <Calendar size={13} color="#AD7048" />
          <span>Oct 15 - Oct 22, 2026</span>
        </div>

        {/* Environment Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: 'rgba(199, 161, 107, 0.18)',
            border: '1px solid rgba(199, 161, 107, 0.4)',
            borderRadius: '5px',
            fontSize: '10.5px',
            fontWeight: 800,
            letterSpacing: '0.06em',
            color: '#8C6A34',
          }}
          className="app-environment-badge"
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C7A16B' }} />
          SYNTHETIC DATA
        </div>

        {/* Notification Center Popover */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="icon-button"
            style={{
              position: 'relative',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: '1px solid #D9D1C4',
              background: '#F3EEE4',
            }}
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            title="Recent Alerts"
          >
            <Bell size={15} color="#171713" />
            {unreadAlerts.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: '#D94C42',
                  color: '#FFF',
                  fontSize: '9px',
                  fontWeight: 800,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {unreadAlerts.length}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div
              className="notification-popover"
              style={{
                position: 'absolute',
                right: 0,
                top: '40px',
                width: '320px',
                background: '#FAF7F0',
                border: '1px solid #D9D1C4',
                boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                borderRadius: '8px',
                padding: '12px',
                zIndex: 50,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #E7DFD3',
                  paddingBottom: '8px',
                  marginBottom: '10px',
                }}
              >
                <strong style={{ fontSize: '12px' }}>Operational Alerts</strong>
                <Link
                  href="/app/alerts"
                  onClick={() => setNotificationsOpen(false)}
                  style={{ fontSize: '11px', color: '#AD7048', textDecoration: 'none', fontWeight: 600 }}
                >
                  View all ({alerts.length})
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {unreadAlerts.map((al) => (
                  <Link
                    key={al.id}
                    href={`/app/alerts/${al.id}`}
                    className="notification-item"
                    onClick={() => setNotificationsOpen(false)}
                    style={{
                      display: 'block',
                      padding: '8px 10px',
                      background: '#F3EEE4',
                      borderRadius: '5px',
                      border: '1px solid #E5DDD1',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700 }}>{al.id}</span>
                      <span className={`badge ${al.severity === 'Critical' ? 'badge-critical' : 'badge-high'}`}>
                        {al.severity}
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#59554E', marginTop: '3px' }}>
                      {al.title}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <label className="theme-switcher">
          <Contrast size={14} aria-hidden="true" />
          <span className="sr-only">Color theme</span>
          <select
            aria-label="Color theme"
            value={theme}
            onChange={(event) => {
              const nextTheme = event.target.value;
              if (nextTheme === 'riskwatch' || nextTheme === 'monochrome' || nextTheme === 'smoky') {
                onThemeChange(nextTheme);
              }
            }}
          >
            <option value="riskwatch">Warm</option>
            <option value="monochrome">Monochrome</option>
            <option value="smoky">Smoky Graphite</option>
          </select>
        </label>

        {/* Role Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <UserCheck size={14} color="#6F6A60" className="hidden sm:inline" />
          <select
            className="role-switcher-select"
            value={currentRole}
            onChange={handleRoleChange}
            title="Demonstration Role Switcher"
          >
            <option value="Operations Analyst">Role: Operations Analyst</option>
            <option value="Risk/Compliance Reviewer">Role: Risk/Compliance Reviewer</option>
            <option value="System Administrator">Role: System Administrator</option>
          </select>
        </div>

        {isSignedIn ? (
          <div className="workspace-account">
            <span className="workspace-save-status" role="status">
              {workspaceSyncStatus === 'saving'
                ? 'Saving…'
                : workspaceSyncStatus === 'saved'
                  ? 'Saved'
                  : workspaceSyncStatus === 'error'
                    ? 'Not synced'
                    : 'Workspace'}
            </span>
            <UserButton />
          </div>
        ) : (
          <Link className="workspace-sign-in" href="/sign-in">
            Sign in to save
          </Link>
        )}
      </div>
    </header>
  );
}
