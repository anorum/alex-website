import React, { useState, useEffect } from 'react';
import { FireIcon, ChartBarIcon, ArrowTrendingUpIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function WorkoutSummary({ summary = {} }) {
  const [stats, setStats] = useState(summary);
  
  // Listen for data updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleDataReady = (event) => {
        if (event.detail?.summary) {
          setStats(event.detail.summary);
        }
      };
      
      document.addEventListener('workout-data-ready', handleDataReady);
      return () => document.removeEventListener('workout-data-ready', handleDataReady);
    }
  }, []);
  
  const defaultStats = {
    total_distance: 0,
    total_elevation_gain: 0,
    total_duration: 0,
    activity_count: 0
  };
  
  const data = { ...defaultStats, ...stats };
  
  // Format distance from km to miles with 1 decimal place
  const formatDistance = (distanceKm) => {
    const miles = distanceKm * 0.621371;
    return Math.round(miles * 10) / 10;
  };
  
  // Format duration from minutes to hours and minutes
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };
  
  // Define stat items
  const statItems = [
    {
      icon: <FireIcon className="h-5 w-5" />,
      value: data.activity_count,
      label: "Activities",
      bgColor: "bg-orange-100 dark:bg-orange-900",
      textColor: "text-orange-600 dark:text-orange-400"
    },
    {
      icon: <ChartBarIcon className="h-5 w-5" />,
      value: `${formatDistance(data.total_distance)} mi`,
      label: "Distance",
      bgColor: "bg-blue-100 dark:bg-blue-900",
      textColor: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: <ArrowTrendingUpIcon className="h-5 w-5" />,
      value: `${Math.round(data.total_elevation_gain)} ft`,
      label: "Elevation",
      bgColor: "bg-green-100 dark:bg-green-900",
      textColor: "text-green-600 dark:text-green-400"
    },
    {
      icon: <ClockIcon className="h-5 w-5" />,
      value: formatDuration(data.total_duration),
      label: "Duration",
      bgColor: "bg-purple-100 dark:bg-purple-900",
      textColor: "text-purple-600 dark:text-purple-400"
    }
  ];
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
