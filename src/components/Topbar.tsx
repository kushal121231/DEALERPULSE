import React from 'react';
import { Menu } from 'lucide-react';
import { useData } from '../context/DataContext';

interface TopbarProps {
  title: string;
  onBurgerClick: () => void;
}

export default function Topbar({ title, onBurgerClick }: TopbarProps) {
  const { data, dateRange, setDateRange, selectedBranch, setSelectedBranch } = useData();

  const months = [
    { label: 'All Time (Jun–Dec 2025)', start: '2025-06-01', end: '2025-12-31' },
    { label: 'Jun 2025', start: '2025-06-01', end: '2025-06-30' },
    { label: 'Jul 2025', start: '2025-07-01', end: '2025-07-31' },
    { label: 'Aug 2025', start: '2025-08-01', end: '2025-08-31' },
    { label: 'Sep 2025', start: '2025-09-01', end: '2025-09-30' },
    { label: 'Oct 2025', start: '2025-10-01', end: '2025-10-31' },
    { label: 'Nov 2025', start: '2025-11-01', end: '2025-11-30' },
    { label: 'Dec 2025', start: '2025-12-01', end: '2025-12-31' },
    { label: 'Q3 2025 (Jul–Sep)', start: '2025-07-01', end: '2025-09-30' },
    { label: 'Q4 2025 (Oct–Dec)', start: '2025-10-01', end: '2025-12-31' },
  ];

  const currentValue = `${dateRange.start.toISOString().slice(0, 10)}|${dateRange.end.toISOString().slice(0, 10)}`;

  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="burger" onClick={onBurgerClick}><Menu size={22} /></button>
        <h2>{title}</h2>
      </div>
      <div className="topbar-filters">
        <select
          className="filter-select"
          value={currentValue}
          onChange={e => {
            const [s, en] = e.target.value.split('|');
            setDateRange({ start: new Date(s), end: new Date(en) });
          }}
        >
          {months.map(m => (
            <option key={m.label} value={`${m.start}|${m.end}`}>{m.label}</option>
          ))}
        </select>
        {data && (
          <select
            className="filter-select"
            value={selectedBranch || ''}
            onChange={e => setSelectedBranch(e.target.value || null)}
          >
            <option value="">All Branches</option>
            {data.branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
