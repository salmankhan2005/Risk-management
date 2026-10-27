'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowUpRight,
  Fingerprint,
  RefreshCw,
  Zap,
} from 'lucide-react';

export default function CinematicHeroScene() {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '580px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Ambient background glow & sculptural contour lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.5,
          background:
            'radial-gradient(ellipse at 75% 35%, rgba(199, 161, 107, 0.22) 0%, rgba(173, 112, 72, 0.12) 35%, transparent 70%)',
        }}
      />

      {/* Sculptural Contour Vector Grid */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.22 }}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1000 700"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="copperLine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C7A16B" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#AD7048" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10110F" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path d="M 0,200 Q 250,120 500,260 T 1000,180" fill="none" stroke="url(#copperLine)" strokeWidth="1.2" />
        <path d="M 0,300 Q 300,240 600,380 T 1000,290" fill="none" stroke="url(#copperLine)" strokeWidth="1.5" />
        <path d="M 0,420 Q 350,340 700,500 T 1000,390" fill="none" stroke="url(#copperLine)" strokeWidth="1.2" />
        <path d="M 0,550 Q 400,460 800,600 T 1000,490" fill="none" stroke="url(#copperLine)" strokeWidth="1" />
      </svg>

      {/* Main Forensic Command Dashboard Preview Card */}
      <div
        style={{
          width: '92%',
          maxWidth: '580px',
          background: 'linear-gradient(145deg, #191B18 0%, #10110F 100%)',
          border: '1px solid rgba(199, 161, 107, 0.35)',
          boxShadow: '0 30px 80px rgba(16, 17, 15, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          position: 'relative',
          zIndex: 10,
          padding: '22px',
          color: '#F3EEE4',
        }}
      >
        {/* Terminal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(217, 209, 196, 0.12)', paddingBottom: '14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D94C42', display: 'inline-block' }} />
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E3A449', display: 'inline-block' }} />
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#75856B', display: 'inline-block' }} />
            <span style={{ marginLeft: '8px', fontSize: '11px', color: '#A8A197', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>
              RISK ENGINE · REAL-TIME INGESTION
            </span>
          </div>
          <span style={{ fontSize: '10px', background: 'rgba(199, 161, 107, 0.18)', color: '#C7A16B', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(199, 161, 107, 0.3)', fontWeight: 700, letterSpacing: '0.05em' }}>
            SYNTHETIC SEED: 20261022
          </span>
        </div>

        {/* Live Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
          <div style={{ background: '#22241F', border: '1px solid rgba(217, 209, 196, 0.1)', borderRadius: '8px', padding: '10px 12px' }}>
            <div style={{ fontSize: '9px', color: '#8C8577', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>High-Risk Velocity</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#D94C42', marginTop: '4px' }}>94.2 <small style={{ fontSize: '10px', color: '#A8A197' }}>/ 100</small></div>
          </div>
          <div style={{ background: '#22241F', border: '1px solid rgba(217, 209, 196, 0.1)', borderRadius: '8px', padding: '10px 12px' }}>
            <div style={{ fontSize: '9px', color: '#8C8577', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Topology Cycles</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#E3A449', marginTop: '4px' }}>3 Loops</div>
          </div>
          <div style={{ background: '#22241F', border: '1px solid rgba(217, 209, 196, 0.1)', borderRadius: '8px', padding: '10px 12px' }}>
            <div style={{ fontSize: '9px', color: '#8C8577', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Reconciled Delta</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#75856B', marginTop: '4px' }}>0.00%</div>
          </div>
        </div>

        {/* Live Forensic Feed */}
        <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(217, 76, 66, 0.1)', border: '1px solid rgba(217, 76, 66, 0.25)', borderRadius: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={14} color="#D94C42" />
              <span style={{ fontWeight: 600, color: '#F3EEE4' }}>TXN-2026-00000001 · ₹8,50,000</span>
            </div>
            <span style={{ fontSize: '9.5px', background: '#D94C42', color: '#FFF', padding: '1px 6px', borderRadius: '3px', fontWeight: 700 }}>
              CRITICAL 89
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#22241F', border: '1px solid rgba(217, 209, 196, 0.08)', borderRadius: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={14} color="#E3A449" />
              <span style={{ fontWeight: 500, color: '#C4BCB0' }}>TRF-2026-000001 · Round-Trip Loop</span>
            </div>
            <span style={{ fontSize: '9.5px', color: '#E3A449', fontWeight: 600 }}>FLAGGED LOOP</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#22241F', border: '1px solid rgba(217, 209, 196, 0.08)', borderRadius: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Fingerprint size={14} color="#C7A16B" />
              <span style={{ fontWeight: 500, color: '#C4BCB0' }}>DEV-00892 · Proxy VPN Fingerprint</span>
            </div>
            <span style={{ fontSize: '9.5px', color: '#C7A16B', fontWeight: 600 }}>UNRECOGNIZED</span>
          </div>
        </div>

        {/* Link directly to live app */}
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <Link
            href="/app/overview"
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#C7A16B',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'none',
            }}
          >
            Enter Operational Workspace <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>

      {/* Floating Card 1: High-Risk Transaction Card */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '5%',
          background: 'rgba(25, 27, 24, 0.96)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(217, 76, 66, 0.5)',
          borderRadius: '10px',
          padding: '12px 16px',
          boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
          zIndex: 20,
          maxWidth: '240px',
          animation: 'heroFloat 4s ease-in-out infinite alternate',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
          <AlertTriangle size={14} color="#D94C42" />
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#D94C42', letterSpacing: '0.04em' }}>VELOCITY SPIKE</span>
        </div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#F3EEE4' }}>₹8,50,000 DEBIT</div>
        <div style={{ fontSize: '10.5px', color: '#9C9588', marginTop: '2px' }}>5 txns in 9m via Aether OTC</div>
      </div>

      {/* Floating Card 2: Circular Transfer Alert Card */}
      <div
        style={{
          position: 'absolute',
          bottom: '30px',
          left: '4%',
          background: 'rgba(25, 27, 24, 0.96)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(199, 161, 107, 0.5)',
          borderRadius: '10px',
          padding: '12px 16px',
          boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
          zIndex: 20,
          maxWidth: '250px',
          animation: 'heroFloat 5s ease-in-out infinite alternate-reverse',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
          <RefreshCw size={14} color="#C7A16B" />
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#C7A16B', letterSpacing: '0.04em' }}>CIRCULAR TOPOLOGY</span>
        </div>
        <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#F3EEE4' }}>ACC-4 → ACC-5 → ACC-3</div>
        <div style={{ fontSize: '10.5px', color: '#9C9588', marginTop: '2px' }}>92% fund retention loop in 65m</div>
      </div>

      {/* Floating Card 3: New-Device Alert Card */}
      <div
        style={{
          position: 'absolute',
          bottom: '25px',
          right: '8%',
          background: 'rgba(25, 27, 24, 0.96)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(227, 164, 73, 0.5)',
          borderRadius: '10px',
          padding: '12px 16px',
          boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
          zIndex: 20,
          maxWidth: '220px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
          <Fingerprint size={14} color="#E3A449" />
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#E3A449', letterSpacing: '0.04em' }}>NEW HARDWARE KEY</span>
        </div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#F3EEE4' }}>DEV-00892 · Proxy VPN</div>
        <div style={{ fontSize: '10px', color: '#9C9588', marginTop: '2px' }}>Zero prior association with CUS-01</div>
      </div>
    </div>
  );
}
