import React, { useEffect, useMemo, useState } from 'react';
import { Cloud, Sun, Wind } from 'lucide-react';
import { getGeoInfo } from '../lib/location';

export function Weather() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>('');
  const [current, setCurrent] = useState<{ temp: number; feelsLike?: number; windKmh?: number; windDir?: string; time: string } | null>(null);
  const [forecast, setForecast] = useState<Array<{ day: string; high: number; low: number }>>([]);

  const dirFromDeg = (deg?: number) => {
    if (deg == null || isNaN(deg)) return undefined;
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const ix = Math.round(deg / 22.5) % 16;
    return dirs[ix];
  };

  const weekday = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  };

  const todayLabel = useMemo(() => 'Today', []);
  const tomorrowLabel = useMemo(() => 'Tomorrow', []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const geo = await getGeoInfo();
        if (!mounted) return;
        const locParts = [
          geo.city,
          geo.countryCode ? `${geo.countryCode} ${geo.principalSubdivision ?? ''}`.trim() : geo.principalSubdivision,
        ].filter(Boolean) as string[];
        setLocationLabel(locParts.join(', ').toUpperCase());

        const params = new URLSearchParams({
          latitude: String(geo.latitude),
          longitude: String(geo.longitude),
          current_weather: 'true',
          hourly: 'apparent_temperature,winddirection_10m,windspeed_10m',
          daily: 'temperature_2m_max,temperature_2m_min',
          timezone: 'auto',
        });
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
        if (!res.ok) throw new Error('Weather fetch failed');
        const data = await res.json();

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const windKmh = data.current_weather?.windspeed;
        const windDirDeg = data.current_weather?.winddirection;
        const feelsLikeSeries = data.hourly?.apparent_temperature as number[] | undefined;
        const hourlyTimes = data.hourly?.time as string[] | undefined;

        let feelsLike: number | undefined = undefined;
        if (feelsLikeSeries && hourlyTimes) {
          // find closest hour index
          const idx = hourlyTimes.findIndex((t) => Math.abs(new Date(t).getTime() - now.getTime()) < 1000 * 60 * 60);
          if (idx >= 0) feelsLike = Number(feelsLikeSeries[idx]?.toFixed(1));
        }

        setCurrent({
          temp: Number(data.current_weather?.temperature?.toFixed?.(1) ?? data.current_weather?.temperature),
          feelsLike,
          windKmh,
          windDir: dirFromDeg(windDirDeg),
          time: timeStr,
        });

        const dmax: number[] = data.daily?.temperature_2m_max || [];
        const dmin: number[] = data.daily?.temperature_2m_min || [];
        const dtime: string[] = data.daily?.time || [];

        const rows = dtime.slice(0, 5).map((t, i) => ({
          day: i === 0 ? todayLabel : i === 1 ? tomorrowLabel : weekday(t),
          high: Number(dmax[i]?.toFixed?.(1) ?? dmax[i]),
          low: Number(dmin[i]?.toFixed?.(1) ?? dmin[i]),
        }));
        setForecast(rows);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load weather');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [todayLabel, tomorrowLabel]);

  return (
    <div className="text-white text-right text-lg">
      {/* Location and Time */}
      <div className="text-sm uppercase tracking-wider text-gray-500 mb-3">
        {locationLabel || (loading ? 'Locating…' : 'Unknown Location')}
      </div>
      
      {/* Current Conditions */}
      <div className="flex items-center justify-end gap-3 mb-2">
        <Wind className="w-5 h-5" />
        <span className="text-base">
          {current?.windKmh != null ? `${Math.round(current.windKmh)} km/h` : '--'} {current?.windDir ?? ''}
        </span>
        <Sun className="w-6 h-6" />
        <span className="text-xl">{current?.time ?? '--:--'}</span>
      </div>

      {/* Temperature */}
      <div className="flex items-start justify-end gap-2 mb-1">
        <Cloud className="w-8 h-8 mt-2" />
        <span className="text-8xl tracking-tight">{current ? current.temp : '--'}°</span>
      </div>
      {current?.feelsLike != null && (
        <div className="text-gray-400 mb-6 text-lg">Feels like {current.feelsLike}°</div>
      )}
    </div>
  );
}
