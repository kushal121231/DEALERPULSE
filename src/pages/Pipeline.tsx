import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import {
  getConversionFunnel, getLeadAgingAlerts, getDaysInactive, STATUS_LABELS,
  STATUS_COLORS, formatCurrency, getLostReasonBreakdown, getModelBreakdown
} from '../utils/calculations';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#0ea5e9', '#f59e0b', '#10b981', '#ec4899'];

export default function Pipeline() {
  const { data, filteredLeads } = useData();
  const [tab, setTab] = useState<'funnel' | 'aging' | 'lost'>('funnel');

  if (!data) return null;

  const funnel = getConversionFunnel(filteredLeads);
  const staleLeads = getLeadAgingAlerts(filteredLeads);
  const lostReasons = getLostReasonBreakdown(filteredLeads);
  const models = getModelBreakdown(filteredLeads);

  return (
    <div>
      <div className="tabs">
        <button className={`tab-btn ${tab === 'funnel' ? 'active' : ''}`} onClick={() => setTab('funnel')}>Conversion Funnel</button>
        <button className={`tab-btn ${tab === 'aging' ? 'active' : ''}`} onClick={() => setTab('aging')}>Lead Aging ({staleLeads.length})</button>
        <button className={`tab-btn ${tab === 'lost' ? 'active' : ''}`} onClick={() => setTab('lost')}>Lost Analysis</button>
      </div>

      {tab === 'funnel' && (
        <div>
          <div className="chart-card" style={{ marginBottom: 20 }}>
            <h3>Conversion Funnel — How leads progress through stages</h3>
            <div style={{ marginTop: 20 }}>
              <div className="funnel-container">
                {funnel.map((stage, i) => (
                  <div key={stage.stage} className="funnel-stage">
                    <div className="funnel-label">{stage.stage}</div>
                    <div className="funnel-bar-container">
                      <div
                        className="funnel-bar"
                        style={{
                          width: `${Math.max(stage.percentage, 5)}%`,
                          background: Object.values(STATUS_COLORS)[i],
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
            {funnel.length >= 3 && (
              <div style={{ marginTop: 20, padding: 16, background: '#0f172a', borderRadius: 8 }}>
                <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>
                  <strong style={{ color: '#f1f5f9' }}>Drop-off analysis: </strong>
                  {funnel[1].count > 0 && funnel[2].count > 0 && (
                    <>
                      {((1 - funnel[2].count / funnel[1].count) * 100).toFixed(0)}% of contacted leads never reach test drive.
                      {' '}Improving this stage could have the biggest pipeline impact.
                    </>
                  )}
                </p>
              </div>
            )}
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h3>Demand by Model</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={models} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#64748b" fontSize={12} />
                  <YAxis type="category" dataKey="model" stroke="#64748b" fontSize={11} width={140} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
                  <Bar dataKey="count" name="Leads" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="conversions" name="Sold" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Revenue by Model</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={models.filter(m => m.revenue > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="revenue" nameKey="model">
                    {models.filter(m => m.revenue > 0).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} formatter={(v: any) => formatCurrency(Number(v))} />
                  <Legend formatter={v => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'aging' && (
        <div>
          <div className="chart-card" style={{ marginBottom: 16 }}>
            <div style={{ padding: '8px 0', color: '#94a3b8', fontSize: 14 }}>
              <strong style={{ color: '#ef4444' }}>{staleLeads.length} leads</strong> have had no activity in 7+ days. These need immediate follow-up.
            </div>
          </div>
          <div className="chart-card">
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Branch</th>
                    <th>Rep</th>
                    <th>Model</th>
                    <th>Status</th>
                    <th>Days Inactive</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {staleLeads.slice(0, 50).map(lead => {
                    const branch = data.branches.find(b => b.id === lead.branch_id);
                    const rep = data.sales_reps.find(r => r.id === lead.assigned_to);
                    const days = getDaysInactive(lead);
                    return (
                      <tr key={lead.id}>
                        <td style={{ color: '#f1f5f9' }}>{lead.customer_name}</td>
                        <td>{branch?.name.replace(' Toyota', '')}</td>
                        <td>{rep?.name}</td>
                        <td>{lead.model_interested}</td>
                        <td><span className={`status-badge ${lead.status}`}>{STATUS_LABELS[lead.status]}</span></td>
                        <td style={{ color: days > 30 ? '#ef4444' : days > 14 ? '#f59e0b' : '#94a3b8', fontWeight: 600 }}>
                          {days} days
                        </td>
                        <td>{formatCurrency(lead.deal_value)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'lost' && (
        <div>
          <div className="charts-grid">
            <div className="chart-card">
              <h3>Lost Reasons</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={lostReasons.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#64748b" fontSize={12} />
                  <YAxis type="category" dataKey="reason" stroke="#64748b" fontSize={11} width={180} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
                  <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <h3>Loss Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={lostReasons.slice(0, 6)} cx="50%" cy="50%" outerRadius={100} paddingAngle={2} dataKey="count" nameKey="reason">
                    {lostReasons.slice(0, 6).map((_, i) => (
                      <Cell key={i} fill={['#ef4444', '#f97316', '#f59e0b', '#8b5cf6', '#64748b', '#334155'][i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
                  <Legend formatter={v => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
