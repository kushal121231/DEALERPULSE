import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Overview from './pages/Overview';
import Branches from './pages/Branches';
import Team from './pages/Team';
import Pipeline from './pages/Pipeline';
import Insights from './pages/Insights';
import Forecast from './pages/Forecast';
import { useData } from './context/DataContext';
import './styles.css';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Overview',
  '/branches': 'Branches',
  '/team': 'Team Performance',
  '/funnel': 'Pipeline',
  '/insights': 'Insights',
  '/forecast': 'Forecast',
};

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { loading } = useData();
  const title = PAGE_TITLES[location.pathname] || 'DealerPulse';

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span style={{ color: '#94a3b8' }}>Loading dealership data...</span>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Topbar title={title} onBurgerClick={() => setSidebarOpen(o => !o)} />
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/branches" element={<Branches />} />
            <Route path="/team" element={<Team />} />
            <Route path="/funnel" element={<Pipeline />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/forecast" element={<Forecast />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <DataProvider>
        <AppLayout />
      </DataProvider>
    </BrowserRouter>
  );
}

export default App;
