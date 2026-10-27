'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  Database,
  Layers3,
  Menu,
  PlayCircle,
  Search,
  Shield,
  ShieldCheck,
  Workflow,
  X,
} from 'lucide-react';

const destinations = [
  { label: 'Overview Dashboard', detail: 'Financial risk intelligence overview', href: '/app/overview' },
  { label: 'Transactions Workspace', detail: 'Filter & prioritize 100,000 ledger transactions', href: '/app/transactions' },
  { label: 'Alert Triage Queue', detail: 'Prioritize signals with rule-level evidence', href: '/app/alerts' },
  { label: 'Investigation Cases', detail: 'Case lifecycle, history & dispositions', href: '/app/cases' },
  { label: 'Transparent Risk Rules', detail: 'Thresholds, scoring contributions & simulator', href: '/app/rules' },
  { label: 'Entity Network Graph', detail: 'Visualize accounts, circular loops & devices', href: '/app/network' },
  { label: 'Validation Lab', detail: '20 automated data integrity assertions', href: '/app/validation' },
  { label: 'Ground Truth Workspace', detail: 'Isolated controlled negative test scenarios', href: '/app/ground-truth' },
];

const metrics = [
  { value: '5,000', label: 'Customers' },
  { value: '7,000', label: 'Accounts' },
  { value: '100,000', label: 'Transactions' },
  { value: '1,000', label: 'Alerts' },
];

const capabilities = [
  {
    number: '01',
    title: 'Synthetic Data Generation',
    body: 'Realistic, large-scale financial data with built-in risk patterns and edge cases.',
    icon: Layers3,
    id: 'capability-data',
  },
  {
    number: '02',
    title: 'Transparent Risk Rules',
    body: 'Deterministic, explainable rules with clear thresholds and logic.',
    icon: ShieldCheck,
    id: 'methodology',
  },
  {
    number: '03',
    title: 'End-to-End Investigation',
    body: 'From alert to case to final disposition with complete audit history.',
    icon: Search,
    id: 'how-it-works',
  },
  {
    number: '04',
    title: 'Measurable Outcomes',
    body: 'Validation reports, ground truth, precision / recall and more.',
    icon: BarChart3,
    id: 'evaluation',
  },
];

function BrandMark() {
  return (
    <a className="brand" href="#top" aria-label="RiskWatch home">
      <span className="brand-symbol" aria-hidden="true"><Shield strokeWidth={1.65} /></span>
      <span className="brand-wording">
        <span className="brand-name">RiskWatch</span>
        <span className="brand-subtitle">Financial Risk Intelligence</span>
      </span>
    </a>
  );
}

export default function HomePage() {
  const [modal, setModal] = useState<'demo' | 'signin' | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredDestinations = destinations.filter((destination) =>
    `${destination.label} ${destination.detail}`.toLowerCase().includes(searchValue.toLowerCase()),
  );

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setModal(null);
        setSearchOpen(false);
        setMobileMenuOpen(false);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const goTo = (href: string) => {
    setSearchOpen(false);
    setMobileMenuOpen(false);
    if (href.startsWith('#')) {
      window.setTimeout(() => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 20);
    } else {
      window.location.href = href;
    }
  };

  return (
    <main id="top" className="site-shell">
      <header className="site-header">
        <div className="header-inner">
          <BrandMark />

          <nav className={`desktop-nav ${mobileMenuOpen ? 'nav-open' : ''}`} aria-label="Main navigation">
            <a href="#platform" onClick={() => setMobileMenuOpen(false)}>Product <ChevronDown size={12} /></a>
            <a href="#capabilities" onClick={() => setMobileMenuOpen(false)}>Solutions <ChevronDown size={12} /></a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>Use Cases <ChevronDown size={12} /></a>
            <a href="#governance" onClick={() => setMobileMenuOpen(false)}>Security <ChevronDown size={12} /></a>
            <a href="#evaluation" onClick={() => setMobileMenuOpen(false)}>Methodology</a>
            <a href="#resources" onClick={() => setMobileMenuOpen(false)}>Resources <ChevronDown size={12} /></a>
          </nav>

          <div className="header-actions">
            <button className="search-trigger" type="button" aria-label="Search this website" onClick={() => setSearchOpen(true)}>
              <Search size={20} strokeWidth={1.8} />
            </button>
            <span className="header-divider" />
            <button className="signin-link" type="button" onClick={() => setModal('signin')}>Sign in</button>
            <button className="button button-dark header-cta" type="button" onClick={() => setModal('demo')}>
              Get Started <ArrowRight size={15} />
            </button>
            <button className="mobile-menu-trigger" type="button" aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMobileMenuOpen((open) => !open)}>
              {mobileMenuOpen ? <X size={23} /> : <Menu size={23} />}
            </button>
          </div>
        </div>
      </header>

      <section className="hero" id="platform" aria-labelledby="hero-title">
        <div className="hero-art" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/riskwatch-hero-scene.jpg" alt="" className="hero-art-image" />
          <div className="hero-art-fade" />
        </div>

        <div className="hero-content page-gutter">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> AI-DRIVEN FINANCIAL RISK MONITORING</p>
            <h1 id="hero-title">From<br />Transactions<br />to <em>Trust.</em></h1>
            <p className="hero-description">
              Detect risks. Prioritize actions. Investigate with clarity.<br className="desktop-break" />
              A complete financial risk intelligence platform powered<br className="desktop-break" />
              by synthetic data and transparent rules.
            </p>
            <div className="hero-ctas">
              <Link className="button button-dark primary-demo" href="/app/overview">
                Launch Live Demo <ArrowRight size={17} />
              </Link>
              <button className="button button-outline" type="button" onClick={() => goTo('#how-it-works')}>
                <PlayCircle size={19} strokeWidth={1.7} /> See How It Works
              </button>
            </div>

            <div className="hero-metrics" aria-label="Illustrative synthetic baseline metrics">
              {metrics.map((metric) => (
                <div className="hero-metric" key={metric.label}>
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              ))}
            </div>
            <p className="metric-note">Illustrative synthetic baseline metrics · Seed 20261022</p>
          </div>
        </div>
      </section>

      <section className="capability-band" id="capabilities" aria-label="Platform capabilities">
        <div className="capability-grid page-gutter">
          {capabilities.map((capability) => {
            const Icon = capability.icon;
            return (
              <a className="capability-item" href={`#${capability.id}`} key={capability.number}>
                <div className="capability-number">{capability.number}</div>
                <div className="capability-content">
                  <span className="capability-icon"><Icon size={34} strokeWidth={1.55} /></span>
                  <div className="capability-text">
                    <h2>{capability.title}</h2>
                    <p>{capability.body}</p>
                  </div>
                  <span className="capability-arrow"><ArrowRight size={15} /></span>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      <section className="workflow-section page-gutter" id="how-it-works">
        <div className="workflow-intro">
          <p className="section-eyebrow">A CLEAR LINE FROM SIGNAL TO DECISION</p>
          <h2>From raw events to<br /><em>defensible decisions.</em></h2>
          <p className="workflow-lead">One connected workflow for synthetic data, transparent risk scoring, and accountable analyst review.</p>
          <a className="text-link" href="#methodology">Explore the methodology <ArrowUpRight size={16} /></a>
        </div>
        <div className="workflow-steps">
          <article className="workflow-step" id="capability-data">
            <span className="workflow-step-no">01 / GENERATE</span>
            <Database size={24} strokeWidth={1.5} />
            <h3>Generate valid data</h3>
            <p>Linked customers, accounts, devices, merchants, transfers, and timestamped transactions.</p>
            <span className="step-foot"><Check size={14} /> Deterministic seed: 20261022</span>
          </article>
          <article className="workflow-step" id="methodology">
            <span className="workflow-step-no">02 / EVALUATE</span>
            <ShieldCheck size={24} strokeWidth={1.5} />
            <h3>Explain every signal</h3>
            <p>Deterministic rules record their thresholds, evidence, score contributions, and versions.</p>
            <span className="step-foot"><Check size={14} /> Rule-level evidence</span>
          </article>
          <article className="workflow-step" id="investigations">
            <span className="workflow-step-no">03 / INVESTIGATE</span>
            <Workflow size={24} strokeWidth={1.5} />
            <h3>Preserve every decision</h3>
            <p>Group alerts into cases, record analyst actions, and retain the event history.</p>
            <span className="step-foot"><Check size={14} /> Traceable outcomes</span>
          </article>
        </div>
      </section>

      <section className="governance-section" id="governance">
        <div className="governance-inner page-gutter">
          <div>
            <p className="section-eyebrow">BUILT FOR REVIEW, NOT GUESSWORK</p>
            <h2>Traceable by design.<br /><em>Measurable by default.</em></h2>
          </div>
          <div className="governance-copy" id="evaluation">
            <p>RiskWatch is designed around reproducible synthetic data, explicit edge cases, explainable rule results, and auditable state changes.</p>
            <div className="governance-points">
              <span><Check size={15} /> Ground truth kept separately</span>
              <span><Check size={15} /> 20-point data integrity validation</span>
              <span><Check size={15} /> Fixed seed reproducibility</span>
              <span><Check size={15} /> Append-only decision history</span>
            </div>
            <div style={{ marginTop: '24px' }}>
              <Link href="/app/validation" className="text-link">
                View Validation Lab <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="site-footer" id="resources">
        <div className="footer-inner page-gutter">
          <BrandMark />
          <p>Financial risk intelligence, with decisions you can explain.</p>
          <div className="footer-links">
            <a href="#platform">Platform</a>
            <a href="#methodology">Methodology</a>
            <a href="#governance">Governance</a>
            <a href="#evaluation">Evaluation</a>
          </div>
          <span className="footer-note">Synthetic demonstration · No real financial data</span>
        </div>
      </footer>

      {searchOpen && (
        <div className="overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false); }}>
          <section className="search-dialog" role="dialog" aria-modal="true" aria-label="Search RiskWatch">
            <div className="search-dialog-input-wrap">
              <Search size={20} />
              <input
                ref={searchRef}
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search transactions, accounts, alerts, rules, validation..."
                aria-label="Search platform"
              />
              <button type="button" className="icon-button" aria-label="Close search" onClick={() => setSearchOpen(false)}><X size={19} /></button>
            </div>
            <div className="search-results-label">SUGGESTED WORKSPACES</div>
            <div className="search-results">
              {filteredDestinations.length ? filteredDestinations.map((destination) => (
                <Link
                  className="search-result"
                  key={destination.href}
                  href={destination.href}
                  onClick={() => setSearchOpen(false)}
                >
                  <span><strong>{destination.label}</strong><small>{destination.detail}</small></span>
                  <ArrowUpRight size={17} />
                </Link>
              )) : <p className="no-results">No matching modules found. Try &quot;transactions&quot;, &quot;rules&quot;, or &quot;validation&quot;.</p>}
            </div>
            <div className="search-dialog-footer"><span>Navigate with Arrow keys</span><kbd>ESC</kbd><span>to close</span></div>
          </section>
        </div>
      )}

      {modal && (
        <div className="overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
          <section className="action-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <button type="button" className="dialog-close icon-button" onClick={() => setModal(null)} aria-label="Close dialog"><X size={19} /></button>
            <div className="dialog-mark"><Shield size={26} strokeWidth={1.6} /></div>
            {modal === 'demo' ? (
              <>
                <p className="section-eyebrow">RISKWATCH / LIVE WORKSPACE</p>
                <h2 id="dialog-title">Explore the risk workflow.</h2>
                <p className="dialog-copy">The full monitoring workspace is live. Explore 100,000 synthetic transactions, 1,000 alerts, case workflows, transparent rules, and the validation lab.</p>
                <div className="dialog-preview-stats">
                  <span><strong>100,000</strong><small>Transactions</small></span>
                  <span><strong>1,000</strong><small>Alerts</small></span>
                  <span><strong>5</strong><small>Edge-case types</small></span>
                </div>
                <Link className="button button-dark dialog-primary" href="/app/overview" onClick={() => setModal(null)}>
                  Enter Operational Workspace <ArrowRight size={16} />
                </Link>
                <p className="dialog-footnote">Illustrative synthetic data only. No live financial connections.</p>
              </>
            ) : (
              <>
                <p className="section-eyebrow">RISKWATCH / ACCESS</p>
                <h2 id="dialog-title">Workspace access</h2>
                <p className="dialog-copy">The workspace is publicly accessible for demonstration purposes. Click below to enter the operational dashboard directly.</p>
                <Link className="button button-dark dialog-primary" href="/app/overview" onClick={() => setModal(null)}>
                  Enter Workspace <ArrowRight size={16} />
                </Link>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
