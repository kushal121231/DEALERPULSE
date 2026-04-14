import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { getRepPerformance, formatCurrency, filterLeadsByDateRange, STATUS_LABELS, getDaysInactive } from '../utils/calculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell } from 'recharts';

export default function Team() {
  const { data, dateRange, selectedBranch } = useData();
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);

  if (!data) return null;

  let reps = data.sales_reps;
  if (selectedBranch) reps = reps.filter(r => r.branch_id === selectedBranch);

  const perf = getRepPerformance(reps, data.leads, dateRange);
  const selectedRep = selectedRepId ? perf.find(r => r.id === selectedRepId) : null;

  if (selectedRep) {
    const repLeads = filterLeadsByDateRange(
      data.leads.filter(l => l.assigned_to === selectedRep.id),
      dateRange
    );
    const branch = data.branches.find(b => b.id === selectedRep.branch_id);

    return (
      <div>
        <button
          onClick={() => setSelectedRepId(null)}
          style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: 14, marginBottom: 16, fontFamily: 'inherit' }}
        >
          ← Back to team
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div className="lead-avatar" style={{ width: 48, height: 48, fontSize: 18 }}>
            {selectedRep.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 600 }}>{selectedRep.name}</h3>
            <p style={{ color: '#94a3b8', fontSize: 14 }}>
              {selectedRep.role === 'branch_manager' ? 'Branch Manager' : 'Sales Officer'} · {branch?.name}
            </p>
          </div>
        </div>

        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-card-label">Total Leads</div>
            <div className="kpi-card-value">{selectedRep.totalLeads}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card-label">Conversions</div>
            <div className="kpi-card-value">{selectedRep.conversions}</div>
            <div className={`kpi-card-sub ${selectedRep.conversionRate > 30 ? 'positive' : 'negative'}`}>
              {selectedRep.conversionRate.toFixed(1)}% rate
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card-label">Revenue</div>
            <div className="kpi-card-value">{formatCurrency(selectedRep.revenue)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card-label">Avg Response</div>
            <div className="kpi-card-value">{selectedRep.avgResponseTime.toFixed(0)}h</div>
            <div className={`kpi-card-sub ${selectedRep.avgResponseTime < 24 ? 'positive' : 'negative'}`}>
              {selectedRep.avgResponseTime < 24 ? 'Fast responder' : 'Needs improvement'}
            </div>
          </div>
        </div>

        <div className="chart-card" style={{ marginTop: 20 }}>
          <h3>Lead Portfolio ({repLeads.length} leads)</h3>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Model</th>
                  <th>Status</th>
                  <th>Value</th>
                  <th>Days Inactive</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {repLeads.slice(0, 30).map(lead => {
                  const inactive = getDaysInactive(lead);
                  return (
                    <tr key={lead.id}>
                      <td style={{ color: '#f1f5f9' }}>{lead.customer_name}</td>
                      <td>{lead.model_interested}</td>
                      <td><span className={`status-badge ${lead.status}`}>{STATUS_LABELS[lead.status]}</span></td>
                      <td>{formatCurrency(lead.deal_value)}</td>
                      <td style={{ color: inactive > 7 ? '#ef4444' : inactive > 3 ? '#f59e0b' : '#94a3b8' }}>
                        {inactive} days
                      </td>
                      <td>{lead.source.replace('_', ' ')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const scatterData = perf.map(r => ({
    name: r.name.split(' ')[0],
    leads: r.totalLeads,
    rate: r.conversionRate,
    revenue: r.revenue,
    role: r.role,
  }));

  return (
    <div>
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Revenue by Rep</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={perf.slice(0, 15)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#64748b" fontSize={12} tickFormatter={v => formatCurrency(v)} />
              <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={120} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
                formatter={(v: any) => formatCurrency(Number(v))}
              />
              <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]}>
                {perf.slice(0, 15).map((r, i) => (
                  <Cell key={i} fill={r.role === 'branch_manager' ? '#8b5cf6' : '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Leads vs Conversion Rate</h3>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="leads" name="Total Leads" stroke="#64748b" fontSize={12} />
              <YAxis dataKey="rate" name="Conversion %" stroke="#64748b" fontSize={12} unit="%" />
              <ZAxis dataKey="revenue" range={[50, 400]} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
                formatter={(v: any, name: any) => [String(name) === "Conversion %" ? `${v.toFixed(1)}%` : v, name]}
              />
              <Scatter data={scatterData} fill="#6366f1">
                {scatterData.map((d, i) => (
                  <Cell key={i} fill={d.role === 'branch_manager' ? '#8b5cf6' : '#6366f1'} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-card" style={{ marginTop: 20 }}>
        <h3>Team Leaderboard</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Branch</th>
                <th>Role</th>
                <th>Leads</th>
                <th>Converted</th>
                <th>Rate</th>
                <th>Revenue</th>
                <th>Active</th>
                <th>Avg Response</th>
              </tr>
            </thead>
            <tbody>
              {perf.map((rep, i) => {
                const branch = data.branches.find(b => b.id === rep.branch_id);
                return (
                  <tr key={rep.id} className="clickable" onClick={() => setSelectedRepId(rep.id)}>
                    <td style={{ color: i < 3 ? '#fbbf24' : '#64748b', fontWeight: i < 3 ? 600 : 400 }}>
                      {i + 1}
                    </td>
                    <td>
                      <div className="lead-row">
                        <div className="lead-avatar">{rep.name.split(' ').map(n => n[0]).join('')}</div>
                        <span style={{ color: '#f1f5f9', fontWeight: 500 }}>{rep.name}</span>
                      </div>
                    </td>
                    <td>{branch?.name.replace(' Toyota', '')}</td>
                    <td>{rep.role === 'branch_manager' ? 'Manager' : 'Sales'}</td>
                    <td>{rep.totalLeads}</td>
                    <td>{rep.conversions}</td>
                    <td style={{ color: rep.conversionRate > 35 ? '#10b981' : rep.conversionRate < 20 ? '#ef4444' : '#f1f5f9' }}>
                      {rep.conversionRate.toFixed(1)}%
                    </td>
                    <td>{formatCurrency(rep.revenue)}</td>
                    <td>{rep.activeLeads}</td>
                    <td>{rep.avgResponseTime.toFixed(0)}h</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
