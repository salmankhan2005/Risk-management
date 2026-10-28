import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f4f0e8',
        color: '#11110f',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '3rem', fontWeight: 700, margin: '0 0 12px 0' }}>404</h1>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 16px 0', color: '#444' }}>
        Page Not Found
      </h2>
      <p style={{ maxWidth: '400px', margin: '0 0 24px 0', color: '#666', lineHeight: 1.5 }}>
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link
        href="/app/overview"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          background: '#11110f',
          color: '#f4f0e8',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
        }}
      >
        Return to Overview
      </Link>
    </div>
  );
}

