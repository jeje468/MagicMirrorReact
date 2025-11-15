import React, { useState, useEffect, useMemo } from 'react';
import { getGeoInfo } from '../lib/location';

export function News() {
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [items, setItems] = useState<Array<{ source: string; time: string; headline: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const relTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.max(1, Math.floor(diffMs / 60000));
    if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const fallbackFeed = useMemo(() => 'https://news.google.com/rss?hl=en&gl=US&ceid=US:en', []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const geo = await getGeoInfo();
        if (!mounted) return;
        const cc = (geo.countryCode || 'US').toUpperCase();
        // Google News country feed (English UI); use rss2json to bypass CORS and parse.
        const rss = `https://news.google.com/rss?hl=en-${cc}&gl=${cc}&ceid=${cc}:en`;
        const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rss)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('News fetch failed');
        const data = await res.json();
        if (!data?.items?.length) throw new Error('No news items');
        const parsed: Array<{ source: string; time: string; headline: string }> = data.items.slice(0, 10).map((it: any) => ({
          source: it?.author || data?.feed?.title || 'News',
          time: relTime(it?.pubDate),
          headline: it?.title || '',
        }));
        setItems(parsed);
        setError(null);
      } catch (e: any) {
        try {
          // Fallback to global US English
          const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(fallbackFeed)}`;
          const res2 = await fetch(url);
          const data2 = await res2.json();
          const parsed: Array<{ source: string; time: string; headline: string }> = (data2.items || []).slice(0, 10).map((it: any) => ({
            source: it?.author || data2?.feed?.title || 'News',
            time: relTime(it?.pubDate),
            headline: it?.title || '',
          }));
          setItems(parsed);
          setError(null);
        } catch (e2: any) {
          setError(e2?.message || 'Failed to load news');
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [fallbackFeed]);

  useEffect(() => {
    if (!items.length) return;
    const timer = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % items.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [items.length]);

  const currentNews = items[currentNewsIndex];

  return (
    <div className="text-white text-center max-w-4xl mx-auto">
      {loading && <div className="text-xs text-gray-500">Loading local news…</div>}
      {error && <div className="text-xs text-red-500">{error}</div>}
      {!loading && !error && currentNews && (
        <>
          <div className="text-xs text-gray-500 mb-2">
            {currentNews.source} · {currentNews.time}
          </div>
          <div className="text-xl">
            {currentNews.headline}
          </div>
        </>
      )}
    </div>
  );
}
