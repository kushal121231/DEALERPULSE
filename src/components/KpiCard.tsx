import React from 'react';

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  subType?: 'positive' | 'negative' | 'neutral';
}

export default function KpiCard({ label, value, sub, subType = 'neutral' }: KpiCardProps) {
  return (
    <div className="kpi-card">
      <div className="kpi-card-label">{label}</div>
      <div className="kpi-card-value">{value}</div>
      {sub && <div className={`kpi-card-sub ${subType}`}>{sub}</div>}
    </div>
  );
}
