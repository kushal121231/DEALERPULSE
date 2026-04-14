# DealerPulse — Design Decisions

## What I Built and Why

A 6-page dashboard application that gives a dealership CEO and branch managers a complete view of their sales operation:

1. **Overview** — The "vital signs" page. KPIs (leads, conversion rate, revenue, pipeline), monthly performance vs targets, lead source effectiveness, and revenue trends. A CEO can open this and know in 10 seconds if the business is healthy.

2. **Branches** — Comparative view of all 5 branches with drill-down. The table shows unit attainment with color-coded progress bars so you can instantly see who's behind. Clicking into a branch shows its funnel, monthly trend, and popular models.

3. **Team** — Leaderboard ranking all 30 reps by revenue. Scatter plot shows leads-vs-conversion to identify efficient vs. high-volume reps. Drill into any rep to see their full lead portfolio with days-inactive highlighting.

4. **Pipeline** — Three tabs: conversion funnel (with drop-off analysis), lead aging (leads going cold with 7+ days no activity), and lost-reason analysis. The funnel includes a written insight about the biggest drop-off point.

5. **Insights** — The "action items" page. Automatically surfaces: stale leads by branch, reps needing coaching (<15% conversion), slow responders (48h+ avg first contact), and target attainment warnings. This is what a manager opens Monday morning.

6. **Forecast** — Pipeline weighted by stage probability, with a what-if slider. "If we improve conversion by 10%, do we close the target gap?" Branch-level forecast vs target shows where to focus effort.

## Key Product Decisions

- **Dark theme**: Dashboards are often displayed on monitors or reviewed in meetings. Dark themes reduce eye strain and look more "executive."
- **Information hierarchy**: Overview → Branch → Rep follows how a CEO thinks. Start broad, drill into problems.
- **Actionable over decorative**: Every chart answers a question. No vanity metrics. The Insights page is the most opinionated — it makes recommendations, not just shows data.
- **What-if slider on Forecast**: Simple but powerful. A CEO can ask "what if we hire a trainer to improve conversion 10%?" and see the revenue impact instantly.
- **Lead aging with 7-day threshold**: In car sales, a lead older than a week without contact is nearly dead. Surfacing this creates urgency.
- **Client-side data processing**: With 510 leads, there's no need for a backend. All calculations happen in the browser with memoized derived state. This keeps the architecture simple and the deploy trivial.

## Tradeoffs

- **No backend API**: For this dataset size, client-side is faster to build and deploy. For a real product with 50K+ leads, I'd move to a backend with aggregation queries.
- **CRA over Next.js**: Simpler setup, no SSR needed since all data is static JSON. Tradeoff is slightly larger bundle, but acceptable for an internal tool.
- **Recharts over D3**: Faster to build with, good React integration, covers all chart types needed. D3 would give more control but isn't worth the time investment here.
- **No state management library**: React Context + useMemo is sufficient. Redux/Zustand would be overkill for this data volume.
- **Hardcoded date ranges**: The data spans Jun-Dec 2025. Rather than a date picker, I used a dropdown with meaningful presets (months, quarters, all time). More aligned with how managers think.

## Interesting Patterns in the Data

- **Website leads have lower conversion** than walk-ins and referrals, suggesting digital leads need better qualification before assignment.
- **Some reps have high lead counts but low conversion** — classic volume-over-quality pattern that a manager could address with targeted coaching.
- **Delivery delays cluster around certain months** and branches, suggesting supply chain or logistics patterns worth investigating.
- **The test-drive-to-negotiation drop-off** is significant across all branches — this is the biggest funnel bottleneck and where process improvements would have the highest ROI.

## What I'd Build Next

1. **AI-powered natural language summaries** — "Downtown Toyota had a strong October, converting 12 of 28 leads. Kavitha's team is on track but 3 leads need follow-up this week."
2. **Email/Slack alerts** — Push notifications when a lead goes cold or a branch falls below 50% attainment.
3. **Historical comparison** — "This month vs last month" or "vs same period last year."
4. **Individual lead timeline view** — Click into a lead to see the full status history with notes, like a CRM detail page.
5. **Export to PDF/CSV** — Managers want to share specific views in weekly meetings.
6. **Mobile-optimized cards** — While responsive, a dedicated mobile layout with swipeable cards would be better for managers checking on the go.
