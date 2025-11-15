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
        const geo = await getGeoInfo();
        if (!mounted) return;
        const cc = geo.countryCode || 'US';
        setHeading(`${geo.countryName || cc} Holidays`);
        const year = new Date().getFullYear();
        const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${cc}`);
        if (!res.ok) throw new Error('Holidays fetch failed');
        const list: Array<{ date: string; localName: string; name: string }> = await res.json();
        const today = new Date();
        const upcoming = list
          .filter((h) => new Date(h.date) >= new Date(today.toISOString().slice(0, 10)))
          .slice(0, 6)
          .map((h) => ({
            name: h.localName || h.name,
            date: new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          }));
        setHolidays(upcoming);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load holidays');
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
