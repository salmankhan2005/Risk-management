'use client';

import Image from 'next/image';
import Link from 'next/link';
import { SignIn, SignUp } from '@clerk/nextjs';
import { ArrowLeft, ArrowUpRight, ShieldCheck } from 'lucide-react';

type AuthPageProps = {
  initialError?: string;
  mode: 'sign-in' | 'sign-up';
};

const authAppearance = {
  variables: {
    colorPrimary: '#11120f',
    colorBackground: '#fbf9f4',
    colorText: '#11110f',
    colorTextSecondary: '#5f5b54',
    colorInputBackground: '#fbf9f4',
    colorInputText: '#11110f',
    borderRadius: '0px',
  },
  elements: {
    rootBox: 'auth-clerk-root',
    cardBox: 'auth-clerk-card-box',
    card: 'auth-clerk-card',
    headerTitle: 'auth-clerk-header-title',
    headerSubtitle: 'auth-clerk-header-subtitle',
    formFieldLabel: 'auth-clerk-label',
    formFieldInput: 'auth-clerk-input',
    formButtonPrimary: 'auth-clerk-submit',
    footerActionLink: 'auth-clerk-link',
    dividerLine: 'auth-clerk-divider-line',
    dividerText: 'auth-clerk-divider-text',
  },
};

export function AuthPage({ initialError, mode }: AuthPageProps) {
  const isSignUp = mode === 'sign-up';

  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="RiskWatch product preview">
        <Link className="auth-brand" href="/" aria-label="RiskWatch home">
          <span className="auth-brand-mark"><ShieldCheck size={23} strokeWidth={1.7} /></span>
          <span>
            <strong>RiskWatch</strong>
          </span>
        </Link>

        <div className="auth-story-content">
          <p className="auth-story-title">Every signal,<br />with its evidence.</p>
          <p className="auth-story-description">
            Review linked transactions, explainable risk rules, and validation results in one accountable workspace.
          </p>
          <figure className="auth-product-preview">
            <Image
              src="/images/riskwatch-overview-preview.jpg"
              alt="RiskWatch overview showing transaction activity, alert severity, and validation status"
              width={1440}
              height={900}
              priority
            />
            <figcaption>RiskWatch overview · Synthetic demonstration data</figcaption>
          </figure>
        </div>

        <p className="auth-story-foot">Built for transparent analysis. No live financial data.</p>
      </section>

      <section className="auth-panel" aria-labelledby="auth-title">
        <Link className="auth-back-link" href="/">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to RiskWatch
        </Link>

        <div className="auth-form-wrap">
          <h1 id="auth-title">{isSignUp ? 'Create your RiskWatch account' : 'Sign in to RiskWatch'}</h1>
          <p className="auth-intro">
            {isSignUp
              ? 'Create an account to save your analyst workspace securely.'
              : 'Use your account to return to your saved RiskWatch workspace.'}
          </p>

          {initialError && (
            <p className="auth-feedback auth-feedback-error" role="alert">
              {initialError}
            </p>
          )}

          <div className="auth-clerk-widget">
            {isSignUp ? (
              <SignUp
                appearance={authAppearance}
                fallbackRedirectUrl="/app/overview"
                path="/sign-up"
                routing="path"
                signInUrl="/sign-in"
              />
            ) : (
              <SignIn
                appearance={authAppearance}
                forceRedirectUrl="/app/overview"
                fallbackRedirectUrl="/app/overview"
                path="/sign-in"
                routing="path"
                signUpUrl="/sign-up"
              />
            )}
          </div>

          <div className="auth-divider"><span>OR</span></div>
          <Link className="auth-demo-link" href="/app/overview">
            Explore the public synthetic-data demo
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <p className="auth-legal">
          By continuing, you agree to the RiskWatch terms and privacy notice.
        </p>
      </section>
    </main>
  );
}
