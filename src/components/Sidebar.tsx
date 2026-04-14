import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, GitBranch, Users, Funnel, AlertTriangle, TrendingUp } from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <div className={`sidebar-overlay ${open ? 'visible' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div>
            <h1>DealerPulse</h1>
            <span>Toyota Network</span>
          </div>
        </div>
        <nav className="sidebar-nav" onClick={onClose}>
          <NavLink to="/" end>
            <LayoutDashboard /> Overview
          </NavLink>
          <NavLink to="/branches">
            <GitBranch /> Branches
          </NavLink>
          <NavLink to="/team">
            <Users /> Team
          </NavLink>
          <NavLink to="/funnel">
            <Funnel /> Pipeline
          </NavLink>
          <NavLink to="/insights">
            <AlertTriangle /> Insights
          </NavLink>
          <NavLink to="/forecast">
            <TrendingUp /> Forecast
          </NavLink>
        </nav>
      </aside>
    </>
  );
}
