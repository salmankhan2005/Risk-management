'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CreditCard,
  ExternalLink,
  Eye,
  Filter,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  Shield,
  Smartphone,
  Store,
  User,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useRiskWatch } from '@/lib/store';

interface Node {
  id: string;
  label: string;
  type: 'Customer' | 'Account' | 'Device' | 'Merchant' | 'Transaction' | 'Alert' | 'Case';
  x: number;
  y: number;
  riskScore: number;
  isCircular?: boolean;
  meta: Record<string, any>;
}

interface Edge {
  source: string;
  target: string;
  label: string;
  isCircular?: boolean;
}

export interface NetworkGraphProps {
  customers?: any[];
  accounts?: any[];
  transfers?: any[];
  focusEntityId?: string;
}

export default function NetworkGraph({ focusEntityId }: NetworkGraphProps = {}) {
  const { customers, accounts, transactions, transfers, alerts, cases, devices, merchants } = useRiskWatch();

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [onlySuspicious, setOnlySuspicious] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Build the network graph model
  const { nodes, edges } = useMemo(() => {
    const nList: Node[] = [
      // Customers
      { id: 'CUS-000001', label: 'Aarav Malhotra', type: 'Customer', x: 180, y: 140, riskScore: 78, meta: { email: 'aarav.m@zenithcore.io', tier: 'High' } },
      { id: 'CUS-000004', label: 'Sunita Singhania', type: 'Customer', x: 440, y: 110, riskScore: 94, isCircular: true, meta: { email: 'sunita.s@suratdiamond.in', tier: 'Critical' } },
      { id: 'CUS-000005', label: 'Rohan Mehra', type: 'Customer', x: 680, y: 150, riskScore: 68, isCircular: true, meta: { email: 'rohan.m@delhitechnology.net', tier: 'Medium' } },
      { id: 'CUS-000003', label: 'Vikramaditya Rao', type: 'Customer', x: 560, y: 460, riskScore: 84, isCircular: true, meta: { email: 'v.rao@deccancapital.org', tier: 'Critical' } },

      // Accounts
      { id: 'ACC-CUS-000001-01', label: 'ACC-01 (Current)', type: 'Account', x: 180, y: 280, riskScore: 78, meta: { balance: '₹14,25,800', status: 'Active' } },
      { id: 'ACC-CUS-000004-01', label: 'ACC-04 (Corporate)', type: 'Account', x: 400, y: 250, riskScore: 94, isCircular: true, meta: { balance: '₹84,00,000', status: 'Active' } },
      { id: 'ACC-CUS-000005-01', label: 'ACC-05 (Intermediary)', type: 'Account', x: 680, y: 280, riskScore: 72, isCircular: true, meta: { balance: '₹3,20,000', status: 'Active' } },
      { id: 'ACC-CUS-000003-01', label: 'ACC-03 (Liquidity)', type: 'Account', x: 540, y: 360, riskScore: 84, isCircular: true, meta: { balance: '₹48,90,000', status: 'Active' } },

      // Devices
      { id: 'DEV-00892', label: 'DEV-00892 (Proxy VPN)', type: 'Device', x: 80, y: 380, riskScore: 85, meta: { ip: '103.21.244.18', country: 'IN', isProxy: true } },

      // Merchants
      { id: 'MER-00104', label: 'Aether Crypto OTC', type: 'Merchant', x: 80, y: 220, riskScore: 88, meta: { category: 'Crypto Exchange', jurisdiction: 'Seychelles' } },

      // Transactions
      { id: 'TXN-2026-00000001', label: 'TXN-01 (₹8.5L)', type: 'Transaction', x: 220, y: 400, riskScore: 89, meta: { amount: '₹8,50,000', direction: 'Debit' } },
      { id: 'TXN-2026-00000010', label: 'TXN-10 (₹24L Loop)', type: 'Transaction', x: 530, y: 230, riskScore: 92, isCircular: true, meta: { amount: '₹24,00,000', hop: 'Leg 1' } },

      // Alerts & Cases
      { id: 'ALT-2026-000001', label: 'ALT-01 Velocity Spike', type: 'Alert', x: 300, y: 480, riskScore: 89, meta: { severity: 'High', status: 'Open' } },
      { id: 'ALT-2026-000002', label: 'ALT-02 Circular Loop', type: 'Alert', x: 560, y: 160, riskScore: 94, isCircular: true, meta: { severity: 'Critical', status: 'Under Review' } },
      { id: 'CASE-2026-000002', label: 'CASE-02 Circular Network', type: 'Case', x: 740, y: 420, riskScore: 94, isCircular: true, meta: { priority: 'P1', status: 'Pending Review' } },
    ];

    const eList: Edge[] = [
      // Customer -> Account
      { source: 'CUS-000001', target: 'ACC-CUS-000001-01', label: 'owns' },
      { source: 'CUS-000004', target: 'ACC-CUS-000004-01', label: 'owns' },
      { source: 'CUS-000005', target: 'ACC-CUS-000005-01', label: 'owns' },
      { source: 'CUS-000003', target: 'ACC-CUS-000003-01', label: 'owns' },

      // Account -> Transaction
      { source: 'ACC-CUS-000001-01', target: 'TXN-2026-00000001', label: 'debited' },
      { source: 'TXN-2026-00000001', target: 'MER-00104', label: 'merchant' },
      { source: 'TXN-2026-00000001', target: 'DEV-00892', label: 'originated_from' },
      { source: 'TXN-2026-00000001', target: 'ALT-2026-000001', label: 'triggered' },

      // Circular Transfer Loop (ACC-04 -> ACC-05 -> ACC-03 -> ACC-04)
      { source: 'ACC-CUS-000004-01', target: 'TXN-2026-00000010', label: 'hop 1 (₹24L)', isCircular: true },
      { source: 'TXN-2026-00000010', target: 'ACC-CUS-000005-01', label: 'transfer to', isCircular: true },
      { source: 'ACC-CUS-000005-01', target: 'ACC-CUS-000003-01', label: 'hop 2 (₹23.5L)', isCircular: true },
      { source: 'ACC-CUS-000003-01', target: 'ACC-CUS-000004-01', label: 'hop 3 return (₹22L)', isCircular: true },

      // Topology alert links
      { source: 'ACC-CUS-000004-01', target: 'ALT-2026-000002', label: 'flags loop', isCircular: true },
      { source: 'ALT-2026-000002', target: 'CASE-2026-000002', label: 'escalated to', isCircular: true },
    ];

    return { nodes: nList, edges: eList };
  }, []);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      if (filterType !== 'ALL' && n.type !== filterType) return false;
      if (onlySuspicious && n.riskScore < 75 && !n.isCircular) return false;
      return true;
    });
  }, [nodes, filterType, onlySuspicious]);

  const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));

  // Filtered edges
  const filteredEdges = useMemo(() => {
    return edges.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));
  }, [edges, visibleNodeIds]);

  const getNodeColor = (node: Node) => {
    if (node.isCircular) return '#C7A16B';
    if (node.riskScore >= 80) return '#D94C42';
    if (node.riskScore >= 50) return '#E3A449';
    return '#75856B';
  };

  const getNodeIcon = (type: Node['type']) => {
    switch (type) {
      case 'Customer': return <User size={13} color="#FFF" />;
      case 'Account': return <CreditCard size={13} color="#FFF" />;
      case 'Device': return <Smartphone size={13} color="#FFF" />;
      case 'Merchant': return <Store size={13} color="#FFF" />;
      case 'Transaction': return <ArrowRight size={13} color="#FFF" />;
      case 'Alert': return <AlertTriangle size={13} color="#FFF" />;
      case 'Case': return <Briefcase size={13} color="#FFF" />;
      default: return <Shield size={13} color="#FFF" />;
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selectedNode ? '1fr 340px' : '1fr', gap: '16px', position: 'relative' }}>
      {/* Main Canvas Viewport */}
      <div className="graph-viewport" style={{ position: 'relative' }}>
        {/* Controls Toolbar */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(25, 27, 24, 0.92)',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(217, 209, 196, 0.18)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Filter size={13} color="#C7A16B" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              background: 'transparent',
              color: '#F3EEE4',
              fontSize: '11px',
              border: 0,
              outline: 0,
              fontWeight: 600,
            }}
          >
            <option value="ALL" style={{ background: '#191B18' }}>All Entity Types</option>
            <option value="Customer" style={{ background: '#191B18' }}>Customers</option>
            <option value="Account" style={{ background: '#191B18' }}>Accounts</option>
            <option value="Device" style={{ background: '#191B18' }}>Devices</option>
            <option value="Merchant" style={{ background: '#191B18' }}>Merchants</option>
            <option value="Alert" style={{ background: '#191B18' }}>Alerts</option>
            <option value="Case" style={{ background: '#191B18' }}>Cases</option>
          </select>

          <span style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#F3EEE4', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={onlySuspicious}
              onChange={(e) => setOnlySuspicious(e.target.checked)}
            />
            <span>Highlight Suspicious Only</span>
          </label>
        </div>

        {/* Zoom Controls */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(25, 27, 24, 0.92)',
            padding: '4px',
            borderRadius: '6px',
            border: '1px solid rgba(217, 209, 196, 0.18)',
          }}
        >
          <button
            type="button"
            className="icon-button"
            style={{ color: '#F3EEE4' }}
            onClick={() => setZoom((z) => Math.min(1.6, z + 0.15))}
            title="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            className="icon-button"
            style={{ color: '#F3EEE4' }}
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
            title="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            className="icon-button"
            style={{ color: '#F3EEE4' }}
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            title="Reset Zoom"
          >
            <RefreshCw size={13} />
          </button>
        </div>

        {/* Circular Transfer Callout Badge */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 10,
            background: 'rgba(199, 161, 107, 0.15)',
            border: '1px solid rgba(199, 161, 107, 0.4)',
            borderRadius: '6px',
            padding: '6px 12px',
            color: '#C7A16B',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <RefreshCw size={12} />
          <span>Circular Transfer Loop Detected: ACC-04 → ACC-05 → ACC-03 → ACC-04</span>
        </div>

        {/* SVG Canvas */}
        <svg
          style={{ width: '100%', height: '100%', cursor: 'grab' }}
          viewBox="0 0 850 560"
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#8C8577" />
            </marker>
            <marker
              id="arrowCircular"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#C7A16B" />
            </marker>
          </defs>

          {/* Group with transform for zoom & pan */}
          <g transform={`scale(${zoom}) translate(${pan.x}, ${pan.y})`}>
            {/* Edges */}
            {filteredEdges.map((e, idx) => {
              const srcNode = nodes.find((n) => n.id === e.source);
              const tgtNode = nodes.find((n) => n.id === e.target);
              if (!srcNode || !tgtNode) return null;

              const isSelected = selectedNode && (selectedNode.id === e.source || selectedNode.id === e.target);
              const strokeColor = e.isCircular ? '#C7A16B' : isSelected ? '#AD7048' : 'rgba(217, 209, 196, 0.25)';
              const strokeWidth = e.isCircular || isSelected ? 2.5 : 1.2;

              const midX = (srcNode.x + tgtNode.x) / 2;
              const midY = (srcNode.y + tgtNode.y) / 2;

              return (
                <g key={idx}>
                  <line
                    x1={srcNode.x}
                    y1={srcNode.y}
                    x2={tgtNode.x}
                    y2={tgtNode.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={e.isCircular ? '4 3' : undefined}
                    markerEnd={e.isCircular ? 'url(#arrowCircular)' : 'url(#arrow)'}
                  />
                  {e.isCircular && (
                    <text
                      x={midX}
                      y={midY - 6}
                      fill="#C7A16B"
                      fontSize="9"
                      fontWeight="700"
                      textAnchor="middle"
                      style={{ background: '#10110F', padding: '2px' }}
                    >
                      {e.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {filteredNodes.map((n) => {
              const isSelected = selectedNode?.id === n.id;
              const color = getNodeColor(n);

              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x}, ${n.y})`}
                  onClick={() => setSelectedNode(n)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Outer Pulsing Ring for high-risk / circular */}
                  {(n.isCircular || n.riskScore >= 85) && (
                    <circle
                      r="24"
                      fill="none"
                      stroke={color}
                      strokeWidth="1.5"
                      opacity="0.4"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* Main Circle */}
                  <circle
                    r="18"
                    fill="#191B18"
                    stroke={isSelected ? '#FFF' : color}
                    strokeWidth={isSelected ? 3 : 2}
                  />

                  {/* Icon representation */}
                  <foreignObject x="-7" y="-7" width="14" height="14">
                    <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
                      {getNodeIcon(n.type)}
                    </div>
                  </foreignObject>

                  {/* Label */}
                  <text
                    y="32"
                    fill={isSelected ? '#FFF' : '#C4BCB0'}
                    fontSize="10"
                    fontWeight={isSelected ? '700' : '500'}
                    textAnchor="middle"
                  >
                    {n.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Node Inspector Side Pane */}
      {selectedNode && (
        <div
          className="app-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '600px',
            overflowY: 'auto',
          }}
        >
          <div className="app-card-header">
            <div>
              <span className="badge badge-neutral" style={{ marginBottom: '4px' }}>
                {selectedNode.type}
              </span>
              <h3 className="app-card-title" style={{ fontSize: '15px' }}>
                {selectedNode.label}
              </h3>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={() => setSelectedNode(null)}
              title="Close pane"
            >
              ×
            </button>
          </div>

          <div className="app-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#F3EEE4', borderRadius: '6px', border: '1px solid #E7DFD3' }}>
              <span style={{ fontSize: '11px', color: '#6F6A60', fontWeight: 600 }}>Calculated Risk Score</span>
              <span className={`badge ${selectedNode.riskScore >= 80 ? 'badge-critical' : selectedNode.riskScore >= 50 ? 'badge-medium' : 'badge-low'}`}>
                {selectedNode.riskScore} / 100
              </span>
            </div>

            {selectedNode.isCircular && (
              <div style={{ padding: '10px 12px', background: 'rgba(199, 161, 107, 0.15)', border: '1px solid rgba(199, 161, 107, 0.4)', borderRadius: '6px', color: '#8C6A34', fontSize: '11px' }}>
                <strong>Circular Pattern Member:</strong> Involved in closed-loop fund transfer structure with 92% retention.
              </div>
            )}

            <div className="key-value-list">
              <div className="key-value-row">
                <span className="key-value-label">Identifier</span>
                <span className="key-value-value">{selectedNode.id}</span>
              </div>
              {Object.entries(selectedNode.meta).map(([k, v]) => (
                <div key={k} className="key-value-row">
                  <span className="key-value-label">{k.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</span>
                  <span className="key-value-value">{String(v)}</span>
                </div>
              ))}
            </div>

            {/* Deep Links */}
            <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #E7DFD3' }}>
              {selectedNode.type === 'Customer' && (
                <Link href={`/app/customers/${selectedNode.id}`} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  View Customer Dossier <ExternalLink size={13} />
                </Link>
              )}
              {selectedNode.type === 'Account' && (
                <Link href={`/app/accounts/${selectedNode.id}`} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  View Account Ledger <ExternalLink size={13} />
                </Link>
              )}
              {selectedNode.type === 'Transaction' && (
                <Link href={`/app/transactions/${selectedNode.id}`} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  View Transaction Details <ExternalLink size={13} />
                </Link>
              )}
              {selectedNode.type === 'Alert' && (
                <Link href={`/app/alerts/${selectedNode.id}`} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Open Alert Review <ExternalLink size={13} />
                </Link>
              )}
              {selectedNode.type === 'Case' && (
                <Link href={`/app/cases/${selectedNode.id}`} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Open Case Investigation <ExternalLink size={13} />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
