import React from 'react';
import { useData } from '../context/DataContext';
import {
  getInsights, getLeadAgingAlerts, formatCurrency,
  getRepPerformance, getBranchPerformance
} from '../utils/calculations';

export default function Insights() {
  const { data, filteredLeads, dateRange } = useData();
  if (!data) return null;

  const insights = getInsights(data.leads, data.branches, data.targets, data.sales_reps, dateRange);
  const staleLeads = getLeadAgingAlerts(filteredLeads);
  const repPerf = getRepPerformance(data.sales_reps, data.leads, dateRange);

  const staleByBranch = data.branches.map(b => ({
    branch: b.name,
    count: staleLeads.filter(l => l.branch_id === b.id).length,
    value: staleLeads.filter(l => l.branch_id === b.id).reduce((s, l) => s + l.deal_value, 0),
  })).filter(b => b.count > 0).sort((a, b) => b.count - a.count);

  const lowPerformers = repPerf.filter(r => r.totalLeads >= 5 && r.conversionRate < 15);
  const slowResponders = repPerf.filter(r => r.avgResponseTime > 48).sort((a, b) => b.avgResponseTime - a.avgResponseTime);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Actionable Insights</h3>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>
          Key findings that need attention. Items are ranked by urgency.
        </p>
        <div className="insights-list">
          {insights.map((insight, i) => (
            <div key={i} className={`insight-card ${insight.type}`}>
              {insight.metric && <div className="insight-metric">{insight.metric}</div>}
              <div className="insight-content">
                <h4>{insight.title}</h4>
                <p>{insight.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {staleByBranch.length > 0 && (
        <div className="chart-card" style={{ marginBottom: 20 }}>
          <h3>Stale Leads by Branch</h3>
          <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>
            Leads with no activity in 7+ days — at risk of going cold.
          </p>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Branch</th><th>Stale Leads</th><th>At-Risk Value</th></tr>
              </thead>
              <tbody>
                {staleByBranch.map(b => (
                  <tr key={b.branch}>
                    <td style={{ color: '#f1f5f9' }}>{b.branch}</td>
                    <td style={{ color: '#ef4444', fontWeight: 600 }}>{b.count}</td>
                    <td>{formatCurrency(b.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {lowPerformers.length > 0 && (
        <div className="chart-card" style={{ marginBottom: 20 }}>
          <h3>Reps Needing Coaching</h3>
          <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>
            Sales reps with 5+ leads but &lt;15% conversion rate.
          </p>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Branch</th><th>Leads</th><th>Converted</th><th>Rate</th><th>Lost</th></tr>
              </thead>
              <tbody>
                {lowPerformers.map(r => {
                  const branch = data.branches.find(b => b.id === r.branch_id);
                  return (
                    <tr key={r.id}>
                      <td style={{ color: '#f1f5f9' }}>{r.name}</td>
                      <td>{branch?.name.replace(' Toyota', '')}</td>
                      <td>{r.totalLeads}</td>
                      <td>{r.conversions}</td>
                      <td style={{ color: '#ef4444', fontWeight: 600 }}>{r.conversionRate.toFixed(1)}%</td>
                      <td>{r.lostLeads}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {slowResponders.length > 0 && (
        <div className="chart-card">
          <h3>Slow Response Times</h3>
          <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>
            Reps averaging 48h+ to first contact — speed matters for conversion.
          </p>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Branch</th><th>Avg Response</th><th>Conversion Rate</th></tr>
              </thead>
              <tbody>
                {slowResponders.slice(0, 10).map(r => {
                  const branch = data.branches.find(b => b.id === r.branch_id);
                  return (
                    <tr key={r.id}>
                      <td style={{ color: '#f1f5f9' }}>{r.name}</td>
                      <td>{branch?.name.replace(' Toyota', '')}</td>
                      <td style={{ color: '#f59e0b', fontWeight: 600 }}>{r.avgResponseTime.toFixed(0)}h</td>
                      <td>{r.conversionRate.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
