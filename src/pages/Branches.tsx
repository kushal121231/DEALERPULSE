import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import KpiCard from '../components/KpiCard';
import {
  getBranchPerformance, formatCurrency, formatNumber, getMonthlyTrend,
  getConversionFunnel, getModelBreakdown, STATUS_COLORS
} from '../utils/calculations';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line, Legend
} from 'recharts';

export default function Branches() {
  const { data, dateRange } = useData();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!data) return null;

  const perf = getBranchPerformance(data.branches, data.leads, data.targets, data.sales_reps, data.deliveries, dateRange);
  const selected = selectedId ? perf.find(b => b.id === selectedId) : null;

  const compareData = perf.map(b => ({
    branch: b.name.replace(' Toyota', ''),
    conversion: Math.round(b.conversionRate),
    attainment: Math.round(b.unitAttainment),
  }));

  if (selected) {
    const branchLeads = data.leads.filter(l => l.branch_id === selected.id);
    const trend = getMonthlyTrend(branchLeads, data.targets, selected.id);
    const funnel = getConversionFunnel(branchLeads);
    const models = getModelBreakdown(branchLeads);

    return (
      <div>
        <button
          onClick={() => setSelectedId(null)}
          style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: 14, marginBottom: 16, fontFamily: 'inherit' }}
        >
          ← Back to all branches
        </button>
        <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>{selected.name} — {selected.city}</h3>

        <div className="kpi-grid">
          <KpiCard label="Total Leads" value={formatNumber(selected.totalLeads)} />
          <KpiCard label="Conversions" value={String(selected.conversions)} sub={`${selected.conversionRate.toFixed(1)}% rate`} subType={selected.conversionRate > 30 ? 'positive' : 'negative'} />
          <KpiCard label="Revenue" value={formatCurrency(selected.revenue)} sub={`${selected.revenueAttainment.toFixed(0)}% of target`} subType={selected.revenueAttainment > 80 ? 'positive' : 'negative'} />
          <KpiCard label="Unit Target" value={`${selected.conversions}/${selected.targetUnits}`} sub={`${selected.unitAttainment.toFixed(0)}% attainment`} subType={selected.unitAttainment > 80 ? 'positive' : 'negative'} />
          <KpiCard label="Pipeline" value={formatCurrency(selected.pipelineValue)} sub="Active opportunities" subType="positive" />
          <KpiCard label="Avg Delivery" value={`${selected.avgDeliveryDays.toFixed(0)} days`} subType={selected.avgDeliveryDays > 20 ? 'negative' : 'positive'} />
        </div>

        <div className="charts-grid">
          <div className="chart-card chart-card-full">
            <h3>Monthly Trend</h3>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
                <Legend />
                <Bar dataKey="conversions" name="Conversions" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="targetUnits" name="Target" fill="#334155" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="leads" name="Leads" stroke="#0ea5e9" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Conversion Funnel</h3>
            <div className="funnel-container">
              {funnel.map((stage, i) => (
                <div key={stage.stage} className="funnel-stage">
                  <div className="funnel-label">{stage.stage}</div>
                  <div className="funnel-bar-container">
                    <div
                      className="funnel-bar"
                      style={{
                        width: `${Math.max(stage.percentage, 8)}%`,
                        background: Object.values(STATUS_COLORS)[i] || '#6366f1',
                      }}
                    >
                      {stage.percentage.toFixed(0)}%
                    </div>
                  </div>
                  <div className="funnel-count">{stage.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <h3>Popular Models</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={models.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis type="category" dataKey="model" stroke="#64748b" fontSize={11} width={130} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
                <Bar dataKey="count" name="Leads" fill="#6366f1" radius={[0, 4, 4, 0]} />
                <Bar dataKey="conversions" name="Converted" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="charts-grid">
        <div className="chart-card chart-card-full">
          <h3>Branch Comparison</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={perf}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickFormatter={v => v.replace(' Toyota', '')} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
              <Legend />
              <Bar dataKey="conversions" name="Conversions" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="targetUnits" name="Target" fill="#334155" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lostLeads" name="Lost" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Conversion vs Attainment</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={compareData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="branch" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} unit="%" />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
              <Legend formatter={(v: string) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
              <Bar dataKey="conversion" name="Conversion %" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="attainment" name="Target Attainment %" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-card" style={{ marginTop: 20 }}>
        <h3>Branch Details</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Branch</th>
                <th>City</th>
                <th>Leads</th>
                <th>Conversions</th>
                <th>Rate</th>
                <th>Revenue</th>
                <th>Unit Attainment</th>
                <th>Pipeline</th>
                <th>Avg Delivery</th>
              </tr>
            </thead>
            <tbody>
              {perf.map(b => (
                <tr key={b.id} className="clickable" onClick={() => setSelectedId(b.id)}>
                  <td style={{ color: '#f1f5f9', fontWeight: 500 }}>{b.name}</td>
                  <td>{b.city}</td>
                  <td>{b.totalLeads}</td>
                  <td>{b.conversions}</td>
                  <td>{b.conversionRate.toFixed(1)}%</td>
                  <td>{formatCurrency(b.revenue)}</td>
                  <td>
                    <div className="attainment">
                      <span className="attainment-value" style={{ color: b.unitAttainment > 80 ? '#10b981' : b.unitAttainment > 50 ? '#f59e0b' : '#ef4444' }}>
                        {b.unitAttainment.toFixed(0)}%
                      </span>
                      <div className="attainment-bar">
                        <div className="progress-bar">
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${Math.min(b.unitAttainment, 100)}%`,
                              background: b.unitAttainment > 80 ? '#10b981' : b.unitAttainment > 50 ? '#f59e0b' : '#ef4444',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{formatCurrency(b.pipelineValue)}</td>
                  <td>{b.avgDeliveryDays.toFixed(0)} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
