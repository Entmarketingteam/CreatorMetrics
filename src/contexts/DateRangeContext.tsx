import React, { createContext, useContext, useState, useEffect } from 'react';

export type DateRangePreset = 'last7' | 'last30' | 'last90' | 'custom';

interface DateRange {
  from: Date;
  to: Date;
  preset: DateRangePreset;
}

interface DateRangeContextType {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  setPreset: (preset: DateRangePreset) => void;
  setCustomRange: (from: Date, to: Date) => void;
  getPresetLabel: () => string;
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

function getDefaultDateRange(preset: DateRangePreset = 'last30'): DateRange {
  const to = new Date();
  to.setHours(23, 59, 59, 999);

  const from = new Date();
  from.setHours(0, 0, 0, 0);

  switch (preset) {
    case 'last7':
      from.setDate(from.getDate() - 7);
      break;
    case 'last30':
      from.setDate(from.getDate() - 30);
      break;
    case 'last90':
      from.setDate(from.getDate() - 90);
      break;
    case 'custom':
      from.setDate(from.getDate() - 30);
      break;
  }

  return { from, to, preset };
}

function formatDateRange(from: Date, to: Date): string {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const fromFormatted = formatDate(from);
  const toFormatted = formatDate(to);

  if (from.getFullYear() !== to.getFullYear()) {
    return `${from.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  return `${fromFormatted} - ${toFormatted}`;
}

export function DateRangeProvider({ children }: { children: React.ReactNode }) {
  const [dateRange, setDateRangeState] = useState<DateRange>(() => {
    const saved = localStorage.getItem('dateRange');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          from: new Date(parsed.from),
          to: new Date(parsed.to),
          preset: parsed.preset,
        };
      } catch (e) {
        return getDefaultDateRange();
      }
    }
    return getDefaultDateRange();
  });

  useEffect(() => {
    localStorage.setItem('dateRange', JSON.stringify({
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
      preset: dateRange.preset,
    }));
  }, [dateRange]);

  const setDateRange = (range: DateRange) => {
    setDateRangeState(range);
  };

  const setPreset = (preset: DateRangePreset) => {
    const newRange = getDefaultDateRange(preset);
    setDateRangeState(newRange);
  };

  const setCustomRange = (from: Date, to: Date) => {
    setDateRangeState({
      from,
      to,
      preset: 'custom',
    });
  };

  const getPresetLabel = () => {
    switch (dateRange.preset) {
      case 'last7':
        return 'Last 7 days';
      case 'last30':
        return 'Last 30 days';
      case 'last90':
        return 'Last 90 days';
      case 'custom':
        return formatDateRange(dateRange.from, dateRange.to);
      default:
        return 'Last 30 days';
    }
  };

  return (
    <DateRangeContext.Provider
      value={{
        dateRange,
        setDateRange,
        setPreset,
        setCustomRange,
        getPresetLabel,
      }}
    >
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error('useDateRange must be used within DateRangeProvider');
  }
  return context;
}
