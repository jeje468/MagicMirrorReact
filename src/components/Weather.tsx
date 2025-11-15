import React from 'react';
import { Cloud, Sun, Wind } from 'lucide-react';

export function Weather() {
  // Mock weather data - in production, fetch from weather API
  const currentWeather = {
    location: 'NEW YORK CITY, US NY',
    temp: 3.0,
    feelsLike: 4.5,
    wind: 2,
    windDirection: 'NNW',
    time: '13:43'
  };

  const forecast = [
    { day: 'Today', icon: <Sun className="w-5 h-5" />, high: 10.0, low: 1.0 },
    { day: 'Tomorrow', icon: <Sun className="w-5 h-5" />, high: 11.6, low: 1.4 },
    { day: 'Mon', icon: <Sun className="w-5 h-5" />, high: 7.3, low: 1.1 },
    { day: 'Tue', icon: <Sun className="w-5 h-5" />, high: 8.8, low: 2.4 },
    { day: 'Wed', icon: <Sun className="w-5 h-5" />, high: 9.5, low: 1.0 }
  ];

  return (
    <div className="text-white text-right">
      {/* Location and Time */}
      <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">
        {currentWeather.location}
      </div>
      
      {/* Current Conditions */}
      <div className="flex items-center justify-end gap-3 mb-2">
        <Wind className="w-5 h-5" />
        <span className="text-sm">{currentWeather.wind} {currentWeather.windDirection}</span>
        <Sun className="w-6 h-6" />
        <span className="text-lg">{currentWeather.time}</span>
      </div>

      {/* Temperature */}
      <div className="flex items-start justify-end gap-2 mb-1">
        <Cloud className="w-8 h-8 mt-2" />
        <span className="text-7xl tracking-tight">{currentWeather.temp}°</span>
      </div>
      <div className="text-gray-400 mb-6">
        Feels like {currentWeather.feelsLike}°
      </div>

      {/* Forecast */}
      <div className="border-t border-gray-800 pt-4">
        <div className="text-xs uppercase tracking-wider text-gray-500 mb-3">
          Weather Forecast
        </div>
        <div className="flex flex-col gap-2">
          {forecast.map((day, index) => (
            <div key={index} className="flex items-center justify-end gap-4 text-sm">
              <span className="w-20 text-left text-gray-400">{day.day}</span>
              {day.icon}
              <span className="w-12 text-right">{day.high}°</span>
              <span className="w-12 text-right text-gray-400">{day.low}°</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
