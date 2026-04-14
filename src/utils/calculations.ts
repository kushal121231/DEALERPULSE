import { Lead, Target, Delivery, Branch, SalesRep, DateRange, LeadStatus } from '../types';
import { isWithinInterval, parseISO, differenceInDays, format, startOfMonth, endOfMonth } from 'date-fns';

export const LEAD_STAGES: LeadStatus[] = ['new', 'contacted', 'test_drive', 'negotiation', 'order_placed', 'delivered'];

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  test_drive: 'Test Drive',
  negotiation: 'Negotiation',
  order_placed: 'Order Placed',
  delivered: 'Delivered',
  lost: 'Lost',
};

export const STATUS_COLORS: Record<LeadStatus, string> = {
  new: '#6366f1',
  contacted: '#8b5cf6',
  test_drive: '#0ea5e9',
  negotiation: '#f59e0b',
  order_placed: '#10b981',
  delivered: '#059669',
  lost: '#ef4444',
};

export function filterLeadsByDateRange(leads: Lead[], range: DateRange): Lead[] {
  return leads.filter(lead => {
    const created = parseISO(lead.created_at);
    return isWithinInterval(created, { start: range.start, end: range.end });
  });
}

export function filterLeadsByBranch(leads: Lead[], branchId: string | null): Lead[] {
  if (!branchId) return leads;
  return leads.filter(l => l.branch_id === branchId);
}

export function getConversionRate(leads: Lead[]): number {
  if (leads.length === 0) return 0;
  const converted = leads.filter(l => ['order_placed', 'delivered'].includes(l.status)).length;
  return (converted / leads.length) * 100;
}

export function getTotalRevenue(leads: Lead[]): number {
  return leads
    .filter(l => ['order_placed', 'delivered'].includes(l.status))
    .reduce((sum, l) => sum + l.deal_value, 0);
}

export function getPipelineValue(leads: Lead[]): number {
  return leads
    .filter(l => !['lost', 'delivered'].includes(l.status))
    .reduce((sum, l) => sum + l.deal_value, 0);
}

export function getLeadsByStatus(leads: Lead[]): Record<LeadStatus, number> {
  const counts: Record<string, number> = {};
  for (const status of [...LEAD_STAGES, 'lost'] as LeadStatus[]) {
    counts[status] = 0;
  }
  leads.forEach(l => { counts[l.status] = (counts[l.status] || 0) + 1; });
  return counts as Record<LeadStatus, number>;
}

export function getConversionFunnel(leads: Lead[]): { stage: string; count: number; percentage: number }[] {
  const total = leads.length;
  if (total === 0) return LEAD_STAGES.map(s => ({ stage: STATUS_LABELS[s], count: 0, percentage: 0 }));

  return LEAD_STAGES.map(stage => {
    const count = leads.filter(lead => {
      return lead.status_history.some(h => h.status === stage);
    }).length;
    return {
      stage: STATUS_LABELS[stage],
      count,
      percentage: (count / total) * 100,
    };
  });
}

export function getMonthlyTrend(leads: Lead[], targets: Target[], branchId?: string): {
  month: string;
  leads: number;
  conversions: number;
  revenue: number;
  targetUnits: number;
  targetRevenue: number;
}[] {
  const months = ['2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12'];
  return months.map(month => {
    const start = startOfMonth(parseISO(month + '-01'));
    const end = endOfMonth(parseISO(month + '-01'));
    const monthLeads = leads.filter(l => {
      const d = parseISO(l.created_at);
      return isWithinInterval(d, { start, end });
    });
    const conversions = monthLeads.filter(l => ['order_placed', 'delivered'].includes(l.status));
    const monthTargets = targets.filter(t => t.month === month && (!branchId || t.branch_id === branchId));
    return {
      month: format(start, 'MMM yyyy'),
      leads: monthLeads.length,
      conversions: conversions.length,
      revenue: conversions.reduce((s, l) => s + l.deal_value, 0),
      targetUnits: monthTargets.reduce((s, t) => s + t.target_units, 0),
      targetRevenue: monthTargets.reduce((s, t) => s + t.target_revenue, 0),
    };
  });
}

export function getLeadAgingAlerts(leads: Lead[]): Lead[] {
  const now = new Date();
  return leads
    .filter(l => !['delivered', 'lost', 'order_placed'].includes(l.status))
    .filter(l => {
      const lastActivity = parseISO(l.last_activity_at);
      return differenceInDays(now, lastActivity) > 7;
    })
    .sort((a, b) => parseISO(a.last_activity_at).getTime() - parseISO(b.last_activity_at).getTime());
}

export function getDaysInactive(lead: Lead): number {
  return differenceInDays(new Date(), parseISO(lead.last_activity_at));
}

export function getBranchPerformance(
  branches: Branch[],
  leads: Lead[],
  targets: Target[],
  reps: SalesRep[],
  deliveries: Delivery[],
  dateRange: DateRange
) {
  return branches.map(branch => {
    const branchLeads = filterLeadsByDateRange(
      leads.filter(l => l.branch_id === branch.id),
      dateRange
    );
    const branchTargets = targets.filter(t => {
      const monthDate = parseISO(t.month + '-01');
      return t.branch_id === branch.id && isWithinInterval(monthDate, { start: dateRange.start, end: dateRange.end });
    });
    const totalTargetUnits = branchTargets.reduce((s, t) => s + t.target_units, 0);
    const totalTargetRevenue = branchTargets.reduce((s, t) => s + t.target_revenue, 0);
    const conversions = branchLeads.filter(l => ['order_placed', 'delivered'].includes(l.status));
    const revenue = conversions.reduce((s, l) => s + l.deal_value, 0);
    const branchDeliveries = deliveries.filter(d =>
      branchLeads.some(l => l.id === d.lead_id)
    );
    const avgDeliveryDays = branchDeliveries.length > 0
      ? branchDeliveries.reduce((s, d) => s + d.days_to_deliver, 0) / branchDeliveries.length
      : 0;
    const branchReps = reps.filter(r => r.branch_id === branch.id);

    return {
      ...branch,
      totalLeads: branchLeads.length,
      conversions: conversions.length,
      conversionRate: branchLeads.length > 0 ? (conversions.length / branchLeads.length) * 100 : 0,
      revenue,
      targetUnits: totalTargetUnits,
      targetRevenue: totalTargetRevenue,
      unitAttainment: totalTargetUnits > 0 ? (conversions.length / totalTargetUnits) * 100 : 0,
      revenueAttainment: totalTargetRevenue > 0 ? (revenue / totalTargetRevenue) * 100 : 0,
      avgDeliveryDays,
      repCount: branchReps.length,
      lostLeads: branchLeads.filter(l => l.status === 'lost').length,
      pipelineValue: getPipelineValue(branchLeads),
    };
  });
}

export function getRepPerformance(
  reps: SalesRep[],
  leads: Lead[],
  dateRange: DateRange
) {
  return reps.map(rep => {
    const repLeads = filterLeadsByDateRange(
      leads.filter(l => l.assigned_to === rep.id),
      dateRange
    );
    const conversions = repLeads.filter(l => ['order_placed', 'delivered'].includes(l.status));
    const lostLeads = repLeads.filter(l => l.status === 'lost');
    const avgResponseTime = getAvgResponseTime(repLeads);

    return {
      ...rep,
      totalLeads: repLeads.length,
      conversions: conversions.length,
      conversionRate: repLeads.length > 0 ? (conversions.length / repLeads.length) * 100 : 0,
      revenue: conversions.reduce((s, l) => s + l.deal_value, 0),
      lostLeads: lostLeads.length,
      pipelineValue: getPipelineValue(repLeads),
      avgResponseTime,
      activeLeads: repLeads.filter(l => !['delivered', 'lost'].includes(l.status)).length,
    };
  }).sort((a, b) => b.revenue - a.revenue);
}

function getAvgResponseTime(leads: Lead[]): number {
  const times: number[] = [];
  leads.forEach(lead => {
    if (lead.status_history.length >= 2) {
      const created = parseISO(lead.status_history[0].timestamp);
      const firstContact = parseISO(lead.status_history[1].timestamp);
      const hours = (firstContact.getTime() - created.getTime()) / (1000 * 60 * 60);
      if (hours > 0 && hours < 720) times.push(hours);
    }
  });
  return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
}

export function getSourceBreakdown(leads: Lead[]): { source: string; count: number; conversions: number; rate: number }[] {
  const sources = ['website', 'walk_in', 'referral', 'social_media', 'auto_expo', 'phone_enquiry'];
  return sources.map(source => {
    const sourceLeads = leads.filter(l => l.source === source);
    const conversions = sourceLeads.filter(l => ['order_placed', 'delivered'].includes(l.status)).length;
    return {
      source: source.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
      count: sourceLeads.length,
      conversions,
      rate: sourceLeads.length > 0 ? (conversions / sourceLeads.length) * 100 : 0,
    };
  }).sort((a, b) => b.count - a.count);
}

export function getModelBreakdown(leads: Lead[]): { model: string; count: number; revenue: number; conversions: number }[] {
  const models = Array.from(new Set(leads.map(l => l.model_interested)));
  return models.map(model => {
    const modelLeads = leads.filter(l => l.model_interested === model);
    const conversions = modelLeads.filter(l => ['order_placed', 'delivered'].includes(l.status));
    return {
      model,
      count: modelLeads.length,
      revenue: conversions.reduce((s, l) => s + l.deal_value, 0),
      conversions: conversions.length,
    };
  }).sort((a, b) => b.revenue - a.revenue);
}

export function getLostReasonBreakdown(leads: Lead[]): { reason: string; count: number }[] {
  const lost = leads.filter(l => l.status === 'lost' && l.lost_reason);
  const reasons: Record<string, number> = {};
  lost.forEach(l => {
    const r = l.lost_reason!;
    reasons[r] = (reasons[r] || 0) + 1;
  });
  return Object.entries(reasons)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);
}

export function formatCurrency(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(Math.round(value));
}

export function getInsights(
  leads: Lead[],
  branches: Branch[],
  targets: Target[],
  reps: SalesRep[],
  dateRange: DateRange
): { type: 'warning' | 'danger' | 'success' | 'info'; title: string; description: string; metric?: string }[] {
  const insights: { type: 'warning' | 'danger' | 'success' | 'info'; title: string; description: string; metric?: string }[] = [];
  const filteredLeads = filterLeadsByDateRange(leads, dateRange);

  // Stale leads alert
  const staleLeads = getLeadAgingAlerts(filteredLeads);
  if (staleLeads.length > 0) {
    const byBranch: Record<string, number> = {};
    staleLeads.forEach(l => {
      const branch = branches.find(b => b.id === l.branch_id);
      const name = branch?.name || l.branch_id;
      byBranch[name] = (byBranch[name] || 0) + 1;
    });
    const worst = Object.entries(byBranch).sort((a, b) => b[1] - a[1])[0];
    insights.push({
      type: 'danger',
      title: `${staleLeads.length} leads haven't been contacted in 7+ days`,
      description: `${worst[0]} has the most stale leads (${worst[1]}). These leads are at high risk of being lost.`,
      metric: `${staleLeads.length} stale`,
    });
  }

  // Target attainment warnings
  branches.forEach(branch => {
    const branchLeads = filteredLeads.filter(l => l.branch_id === branch.id);
    const branchTargets = targets.filter(t => {
      const monthDate = parseISO(t.month + '-01');
      return t.branch_id === branch.id && isWithinInterval(monthDate, { start: dateRange.start, end: dateRange.end });
    });
    const targetUnits = branchTargets.reduce((s, t) => s + t.target_units, 0);
    const conversions = branchLeads.filter(l => ['order_placed', 'delivered'].includes(l.status)).length;
    const attainment = targetUnits > 0 ? (conversions / targetUnits) * 100 : 0;
    if (attainment < 60 && targetUnits > 0) {
      insights.push({
        type: 'warning',
        title: `${branch.name} is behind target`,
        description: `Only ${conversions} of ${targetUnits} unit target achieved (${attainment.toFixed(0)}% attainment). Needs ${targetUnits - conversions} more conversions.`,
        metric: `${attainment.toFixed(0)}%`,
      });
    }
  });

  // Top performer
  const repPerf = getRepPerformance(reps, leads, dateRange);
  if (repPerf.length > 0) {
    const top = repPerf[0];
    const branch = branches.find(b => b.id === top.branch_id);
    insights.push({
      type: 'success',
      title: `${top.name} is the top performer`,
      description: `${top.conversions} conversions generating ${formatCurrency(top.revenue)} at ${branch?.name || ''}.`,
      metric: `${top.conversions} deals`,
    });
  }

  // High loss rate sources
  const sourceBreakdown = getSourceBreakdown(filteredLeads);
  const highLossSources = sourceBreakdown.filter(s => s.count >= 10 && s.rate < 20);
  if (highLossSources.length > 0) {
    const worst = highLossSources[0];
    insights.push({
      type: 'info',
      title: `${worst.source} has low conversion (${worst.rate.toFixed(0)}%)`,
      description: `${worst.count} leads from ${worst.source} but only ${worst.conversions} converted. Consider reviewing this channel's lead quality.`,
      metric: `${worst.rate.toFixed(0)}%`,
    });
  }

  // Delivery delays
  return insights;
}
