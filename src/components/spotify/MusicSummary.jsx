import React, { useState, useEffect } from 'react';
import { ChartBarIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';

export default function MusicSummary({ summary = {} }) {
  const [stats, setStats] = useState(summary);
  
  // Listen for data updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleDataReady = (event) => {
        if (event.detail?.stats) {
          setStats(event.detail.stats);
        }
      };
      
      document.addEventListener('spotify-data-ready', handleDataReady);
      return () => document.removeEventListener('spotify-data-ready', handleDataReady);
    }
  }, []);
  
  const defaultStats = {
    average_artist_popularity: 0,
    mainstream_factor: 0
  };
  
  const data = { ...defaultStats, ...stats };
  
  // Define stat items
  const statItems = [
    {
      icon: <ChartBarIcon className="h-5 w-5" />,
      value: Math.round(data.average_artist_popularity || 0),
      label: "Avg. Artist Popularity",
      bgColor: "bg-indigo-100 dark:bg-indigo-900",
      textColor: "text-indigo-600 dark:text-indigo-400"
    },
    {
      icon: <ChartBarIcon className="h-5 w-5" />,
      value: `${Math.round(data.mainstream_factor || 0)}%`,
      label: "Mainstream Factor",
      bgColor: "bg-blue-100 dark:bg-blue-900",
      textColor: "text-blue-600 dark:text-blue-400"
    }
  ];
  
  return (
    <div className="grid grid-cols-2 gap-3">
      {statItems.map((item, index) => (
        <div key={index} className="stats-card p-2 sm:p-3 flex flex-col items-center text-center">
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
