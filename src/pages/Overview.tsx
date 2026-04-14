import React from 'react';
import { useData } from '../context/DataContext';
import KpiCard from '../components/KpiCard';
import {
  getConversionRate, getTotalRevenue, getPipelineValue, getLeadsByStatus,
  getMonthlyTrend, getSourceBreakdown, formatCurrency, formatNumber, STATUS_LABELS, STATUS_COLORS
} from '../utils/calculations';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Line, Legend, Area, AreaChart, ComposedChart
} from 'recharts';
import { LeadStatus } from '../types';

export default function Overview() {
  const { data, filteredLeads } = useData();
  if (!data) return null;

  const totalLeads = filteredLeads.length;
  const conversionRate = getConversionRate(filteredLeads);
  const revenue = getTotalRevenue(filteredLeads);
  const pipeline = getPipelineValue(filteredLeads);
  const statusCounts = getLeadsByStatus(filteredLeads);
  const lostCount = filteredLeads.filter(l => l.status === 'lost').length;
  const lossRate = totalLeads > 0 ? (lostCount / totalLeads * 100) : 0;
  const trend = getMonthlyTrend(data.leads, data.targets);
  const sourceData = getSourceBreakdown(filteredLeads);

  const statusPieData = (Object.entries(statusCounts) as [LeadStatus, number][])
    .filter(([_, v]) => v > 0)
    .map(([status, count]) => ({
      name: STATUS_LABELS[status],
      value: count,
      color: STATUS_COLORS[status],
    }));

  return (
    <div>
      <div className="kpi-grid">
        <KpiCard label="Total Leads" value={formatNumber(totalLeads)} sub={`${lostCount} lost (${lossRate.toFixed(0)}%)`} subType={lossRate > 40 ? 'negative' : 'neutral'} />
        <KpiCard label="Conversion Rate" value={`${conversionRate.toFixed(1)}%`} sub={`${filteredLeads.filter(l => ['order_placed', 'delivered'].includes(l.status)).length} converted`} subType={conversionRate > 30 ? 'positive' : conversionRate < 20 ? 'negative' : 'neutral'} />
        <KpiCard label="Revenue" value={formatCurrency(revenue)} sub="From converted leads" />
        <KpiCard label="Pipeline Value" value={formatCurrency(pipeline)} sub="Active opportunities" subType="positive" />
      </div>

      <div className="charts-grid">
        <div className="chart-card chart-card-full">
          <h3>Monthly Performance vs Target</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis yAxisId="left" stroke="#64748b" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="conversions" name="Conversions" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="targetUnits" name="Target Units" fill="#334155" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="leads" name="New Leads" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Lead Status Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusPieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {statusPieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
              <Legend formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Lead Sources</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sourceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#64748b" fontSize={12} />
              <YAxis type="category" dataKey="source" stroke="#64748b" fontSize={12} width={100} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
              <Bar dataKey="count" name="Total Leads" fill="#6366f1" radius={[0, 4, 4, 0]} />
              <Bar dataKey="conversions" name="Converted" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card chart-card-full">
          <h3>Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={v => formatCurrency(v)} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
                formatter={(v: any) => [formatCurrency(Number(v)), ""]}
              />
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" fill="url(#revenueGradient)" strokeWidth={2} />
              <Line type="monotone" dataKey="targetRevenue" name="Target" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
