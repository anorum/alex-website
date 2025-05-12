import React, { useState, useEffect } from 'react';
import { GlobeAltIcon, MapIcon, CalendarIcon, UserGroupIcon } from '@heroicons/react/24/outline';

export default function TravelSummary({ summary = {} }) {
  const [stats, setStats] = useState(summary);
  
  // Listen for data updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleDataReady = (event) => {
        if (event.detail?.summary) {
          setStats(event.detail.summary);
        }
      };
      
      window.addEventListener('travel-data-ready', handleDataReady);
      return () => window.removeEventListener('travel-data-ready', handleDataReady);
    }
  }, []);
  
  const defaultStats = {
    total_countries: 0,
    total_cities: 0,
    total_visits: 0,
    most_visited_city: '-'
  };
  
  const data = { ...defaultStats, ...stats };
  
  // Define stat items
  const statItems = [
    {
      icon: <GlobeAltIcon className="h-5 w-5" />,
      value: data.total_countries,
      label: "Countries",
      bgColor: "bg-green-100 dark:bg-green-900",
      textColor: "text-green-600 dark:text-green-400"
    },
    {
      icon: <MapIcon className="h-5 w-5" />,
      value: data.total_cities,
      label: "Cities",
      bgColor: "bg-blue-100 dark:bg-blue-900",
      textColor: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: <CalendarIcon className="h-5 w-5" />,
      value: data.total_visits,
      label: "Visits",
      bgColor: "bg-amber-100 dark:bg-amber-900",
      textColor: "text-amber-600 dark:text-amber-400"
    },
    {
      icon: <UserGroupIcon className="h-5 w-5" />,
      value: data.most_visited_city,
      label: "Most Visited",
      bgColor: "bg-indigo-100 dark:bg-indigo-900",
      textColor: "text-indigo-600 dark:text-indigo-400"
    }
  ];
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statItems.map((item, index) => (
        <div key={index} className="stats-card p-3 flex flex-col items-center text-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.bgColor} ${item.textColor} mb-2`}>
            {item.icon}
          </div>
          <div className="truncate w-full">
            <p className="text-xl font-semibold truncate">{item.value}</p>
            <p className="text-md opacity-80">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
