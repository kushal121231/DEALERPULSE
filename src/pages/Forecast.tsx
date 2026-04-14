import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import KpiCard from '../components/KpiCard';
import {
  formatCurrency, formatNumber, getBranchPerformance
} from '../utils/calculations';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function Forecast() {
  const { data, dateRange } = useData();
  const [conversionLift, setConversionLift] = useState(0);

  if (!data) return null;

  // Current pipeline (not lost, not delivered)
  const pipeline = data.leads.filter(l => !['lost', 'delivered'].includes(l.status));
  const byStage: Record<string, { count: number; value: number; baseRate: number }> = {
    new: { count: 0, value: 0, baseRate: 0.15 },
    contacted: { count: 0, value: 0, baseRate: 0.25 },
    test_drive: { count: 0, value: 0, baseRate: 0.45 },
    negotiation: { count: 0, value: 0, baseRate: 0.65 },
    order_placed: { count: 0, value: 0, baseRate: 0.90 },
  };

  pipeline.forEach(l => {
    if (byStage[l.status]) {
      byStage[l.status].count++;
      byStage[l.status].value += l.deal_value;
    }
  });

  const liftMultiplier = 1 + conversionLift / 100;
  const stages = Object.entries(byStage).map(([stage, info]) => {
    const adjustedRate = Math.min(info.baseRate * liftMultiplier, 1);
    return {
      stage: stage.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
      count: info.count,
      value: info.value,
      probability: adjustedRate * 100,
      weightedValue: info.value * adjustedRate,
    };
  });

  const totalWeighted = stages.reduce((s, st) => s + st.weightedValue, 0);
  const totalPipeline = stages.reduce((s, st) => s + st.value, 0);
  const totalLeads = stages.reduce((s, st) => s + st.count, 0);
  const expectedUnits = stages.reduce((s, st) => s + st.count * (st.probability / 100), 0);

  // Target remaining
  const branchPerf = getBranchPerformance(data.branches, data.leads, data.targets, data.sales_reps, data.deliveries, dateRange);
  const totalTarget = branchPerf.reduce((s, b) => s + b.targetRevenue, 0);
  const totalAchieved = branchPerf.reduce((s, b) => s + b.revenue, 0);
  const gap = totalTarget - totalAchieved;

  const forecastData = stages.map(s => ({
    ...s,
    unweighted: s.value - s.weightedValue,
  }));

  // Branch forecast
  const branchForecast = data.branches.map(b => {
    const branchPipeline = pipeline.filter(l => l.branch_id === b.id);
    let weighted = 0;
    branchPipeline.forEach(l => {
      const rate = byStage[l.status]?.baseRate || 0.15;
      weighted += l.deal_value * Math.min(rate * liftMultiplier, 1);
    });
    const perf = branchPerf.find(bp => bp.id === b.id);
    return {
      branch: b.name.replace(' Toyota', ''),
      achieved: perf?.revenue || 0,
      forecast: weighted,
      target: perf?.targetRevenue || 0,
      gap: (perf?.targetRevenue || 0) - (perf?.revenue || 0) - weighted,
    };
  });

  return (
    <div>
      <div className="kpi-grid">
        <KpiCard label="Pipeline Leads" value={formatNumber(totalLeads)} sub={`${pipeline.length} active opportunities`} />
        <KpiCard label="Pipeline Value" value={formatCurrency(totalPipeline)} sub="Total unweighted" />
        <KpiCard
          label="Weighted Forecast"
          value={formatCurrency(totalWeighted)}
          sub={`${expectedUnits.toFixed(0)} expected units`}
          subType="positive"
        />
        <KpiCard
          label="Target Gap"
          value={formatCurrency(Math.max(gap - totalWeighted, 0))}
          sub={gap - totalWeighted <= 0 ? 'On track to hit target!' : 'Additional revenue needed'}
          subType={gap - totalWeighted <= 0 ? 'positive' : 'negative'}
        />
      </div>

      <div className="chart-card" style={{ marginBottom: 20 }}>
        <h3>What-If Scenario</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ color: '#94a3b8', fontSize: 14 }}>If we improve conversion rates by</span>
          <input
            type="range"
            min={-30}
            max={50}
            value={conversionLift}
            onChange={e => setConversionLift(Number(e.target.value))}
            style={{ flex: 1, minWidth: 120, maxWidth: 300, accentColor: '#6366f1' }}
          />
          <span style={{
            color: conversionLift >= 0 ? '#10b981' : '#ef4444',
            fontWeight: 700,
            fontSize: 18,
            minWidth: 60,
          }}>
            {conversionLift > 0 ? '+' : ''}{conversionLift}%
          </span>
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ padding: '12px 20px', background: '#0f172a', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Expected Revenue</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#6366f1' }}>{formatCurrency(totalWeighted)}</div>
          </div>
          <div style={{ padding: '12px 20px', background: '#0f172a', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Expected Units</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#0ea5e9' }}>{expectedUnits.toFixed(0)}</div>
          </div>
          <div style={{ padding: '12px 20px', background: '#0f172a', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Remaining Gap to Target</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: gap - totalWeighted <= 0 ? '#10b981' : '#ef4444' }}>
              {gap - totalWeighted <= 0 ? 'Covered!' : formatCurrency(gap - totalWeighted)}
            </div>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Weighted Pipeline by Stage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="stage" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={v => formatCurrency(v)} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
                formatter={(v: any) => formatCurrency(Number(v))}
              />
              <Legend />
              <Bar dataKey="weightedValue" name="Weighted (likely)" stackId="a" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="unweighted" name="Unweighted (upside)" stackId="a" fill="#334155" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Branch Forecast vs Target</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={branchForecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="branch" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={v => formatCurrency(v)} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
                formatter={(v: any) => formatCurrency(Number(v))}
              />
              <Legend />
              <Bar dataKey="achieved" name="Achieved" stackId="a" fill="#10b981" />
              <Bar dataKey="forecast" name="Forecast" stackId="a" fill="#6366f1" />
              <Bar dataKey="target" name="Target" fill="none" stroke="#f59e0b" strokeWidth={2} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
