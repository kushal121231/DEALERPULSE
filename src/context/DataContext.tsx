import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { DealershipData, DateRange, Lead } from '../types';
import { filterLeadsByDateRange, filterLeadsByBranch } from '../utils/calculations';

interface DataContextType {
  data: DealershipData | null;
  loading: boolean;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  selectedBranch: string | null;
  setSelectedBranch: (id: string | null) => void;
  filteredLeads: Lead[];
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DealershipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date('2025-06-01'),
    end: new Date('2025-12-31'),
  });
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  useEffect(() => {
    fetch('/dealership_data.json')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  const filteredLeads = useMemo(() => {
    if (!data) return [];
    let leads = filterLeadsByDateRange(data.leads, dateRange);
    leads = filterLeadsByBranch(leads, selectedBranch);
    return leads;
  }, [data, dateRange, selectedBranch]);

  const value = useMemo(() => ({
    data, loading, dateRange, setDateRange, selectedBranch, setSelectedBranch, filteredLeads,
  }), [data, loading, dateRange, selectedBranch, filteredLeads]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
