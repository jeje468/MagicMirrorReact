import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { getGeoInfo } from '../lib/location';

export function Calendar() {
  const [heading, setHeading] = useState<string>('Holidays');
  const [holidays, setHolidays] = useState<Array<{ name: string; date: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Use a static list of dummy birthdays instead of fetching holidays
        if (!mounted) return;
        setHeading('Birthdays');
        setHolidays([
          { name: 'Andrei Iliescu', date: 'March 03' },
          { name: 'Máté Bene', date: 'May 02' },
          { name: 'Riccardo Legnini', date: 'May 20' },
          { name: 'Sofia Zandonà', date: 'September 17' },
        ]);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load data');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="text-white">
      <div className="text-xs uppercase tracking-wider text-gray-500 mb-3">{heading}</div>
      <div className="flex flex-col gap-2">
        {loading && <div className="text-xs text-gray-500">Loading holidays…</div>}
        {error && <div className="text-xs text-red-500">{error}</div>}
        {!loading && !error && holidays.map((holiday, index) => (
          <div key={index} className="flex items-center gap-3">
            <CalendarIcon className="w-4 h-4 text-gray-400" />
            <span className="flex-1">{holiday.name}</span>
            <span className="text-gray-400">{holiday.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
