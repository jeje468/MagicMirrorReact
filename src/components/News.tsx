import React, { useState, useEffect } from 'react';

export function News() {
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  
  // Mock news data - in production, fetch from news API
  const newsItems = [
    {
      source: 'New York Times',
      time: '5 hours ago',
      headline: 'Trump Cuts Ties With Marjorie Taylor Greene, Calling Her \'Wacky\''
    },
    {
      source: 'BBC News',
      time: '2 hours ago',
      headline: 'Global Climate Summit Reaches Historic Agreement'
    },
    {
      source: 'Tech Crunch',
      time: '1 hour ago',
      headline: 'AI Breakthrough: New Model Achieves Human-Level Reasoning'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % newsItems.length);
    }, 10000); // Rotate every 10 seconds

    return () => clearInterval(timer);
  }, [newsItems.length]);

  const currentNews = newsItems[currentNewsIndex];

  return (
    <div className="text-white text-center">
      <div className="text-xs text-gray-500 mb-2">
        {currentNews.source} · {currentNews.time}
      </div>
      <div className="text-xl">
        {currentNews.headline}
      </div>
    </div>
  );
}
