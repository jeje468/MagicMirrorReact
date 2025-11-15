import React, { useState, useEffect } from 'react';

export function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const getSeconds = (date: Date) => {
    return date.getSeconds().toString().padStart(2, '0');
  };

  return (
    <div className="text-white">
      <div className="text-gray-400 mb-2">
        {formatDate(time)}
      </div>
      <div className="flex items-start gap-1">
        <span className="text-8xl tracking-tight">
          {formatTime(time)}
        </span>
        <span className="text-4xl text-gray-400 mt-2">
          {getSeconds(time)}
        </span>
      </div>
    </div>
  );
}
