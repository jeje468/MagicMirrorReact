import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

export function Calendar() {
  const holidays = [
    { name: 'Thanksgiving Day', date: 'Nov 27th' },
    { name: 'Christmas', date: 'Dec 25th' }
  ];

  return (
    <div className="text-white">
      <div className="text-xs uppercase tracking-wider text-gray-500 mb-3">
        US Holidays
      </div>
      <div className="flex flex-col gap-2">
        {holidays.map((holiday, index) => (
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
