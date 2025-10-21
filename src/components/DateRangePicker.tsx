import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { useDateRange } from '../contexts/DateRangeContext';

export default function DateRangePicker() {
  const { dateRange, setPreset, setCustomRange, getPresetLabel } = useDateRange();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [error, setError] = useState('');

  const presets = [
    { value: 'last7', label: 'Last 7 days' },
    { value: 'last30', label: 'Last 30 days' },
    { value: 'last90', label: 'Last 90 days' },
  ];

  const handlePresetSelect = (preset: 'last7' | 'last30' | 'last90') => {
    setPreset(preset);
    setDropdownOpen(false);
  };

  const handleCustomRangeClick = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    setFromDate(formatDateForInput(dateRange.preset === 'custom' ? dateRange.from : thirtyDaysAgo));
    setToDate(formatDateForInput(dateRange.preset === 'custom' ? dateRange.to : today));
    setError('');
    setDropdownOpen(false);
    setModalOpen(true);
  };

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleApplyCustomRange = () => {
    setError('');

    if (!fromDate || !toDate) {
      setError('Please select both start and end dates');
      return;
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    if (from > to) {
      setError('Start date must be before end date');
      return;
    }

    const daysDiff = Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 365) {
      setError('Date range cannot exceed 365 days');
      return;
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (to > today) {
      setError('End date cannot be in the future');
      return;
    }

    setCustomRange(from, to);
    setModalOpen(false);
  };

  const handleResetToDefault = () => {
    setPreset('last30');
    setDropdownOpen(false);
  };

  const maxDate = formatDateForInput(new Date());
  const minDate = (() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return formatDateForInput(date);
  })();

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
        >
          <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-gray-900 dark:text-white hidden sm:inline">
            {getPresetLabel()}
          </span>
          <span className="text-gray-900 dark:text-white sm:hidden">
            Range
          </span>
          <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>

        {dropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
              <div className="py-1">
                {presets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handlePresetSelect(preset.value as any)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      dateRange.preset === preset.value
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                <button
                  onClick={handleCustomRangeClick}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    dateRange.preset === 'custom'
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Custom Range
                </button>
                {dateRange.preset === 'custom' && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                    <button
                      onClick={handleResetToDefault}
                      className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Reset to Last 30 Days
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Custom Date Range
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select up to 365 days
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label
                  htmlFor="from-date"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  From Date
                </label>
                <input
                  id="from-date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  min={minDate}
                  max={maxDate}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="to-date"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  To Date
                </label>
                <input
                  id="to-date"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  min={fromDate || minDate}
                  max={maxDate}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleApplyCustomRange}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Apply
              </button>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setError('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
