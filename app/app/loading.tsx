export default function AppLoading() {
  return (
    <div className="app-page-skeleton">
      {/* Skeleton header */}
      <div className="skeleton-header">
        <div className="skeleton-block" style={{ width: '220px', height: '22px', borderRadius: '4px' }} />
        <div className="skeleton-block" style={{ width: '140px', height: '14px', borderRadius: '4px', marginTop: '6px' }} />
      </div>
      {/* Skeleton KPI row */}
      <div className="skeleton-kpi-row">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton-kpi-card">
            <div className="skeleton-block" style={{ width: '60%', height: '11px', borderRadius: '3px' }} />
            <div className="skeleton-block" style={{ width: '80px', height: '28px', borderRadius: '4px', marginTop: '8px' }} />
            <div className="skeleton-block" style={{ width: '75%', height: '10px', borderRadius: '3px', marginTop: '6px' }} />
          </div>
        ))}
      </div>
      {/* Skeleton table */}
      <div className="skeleton-card">
        <div className="skeleton-block" style={{ width: '180px', height: '14px', borderRadius: '4px', marginBottom: '16px' }} />
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="skeleton-row">
            <div className="skeleton-block" style={{ width: '120px', height: '11px', borderRadius: '3px' }} />
            <div className="skeleton-block" style={{ width: '90px', height: '11px', borderRadius: '3px' }} />
            <div className="skeleton-block" style={{ width: '160px', height: '11px', borderRadius: '3px' }} />
            <div className="skeleton-block" style={{ width: '70px', height: '11px', borderRadius: '3px' }} />
            <div className="skeleton-block" style={{ width: '55px', height: '20px', borderRadius: '10px' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

