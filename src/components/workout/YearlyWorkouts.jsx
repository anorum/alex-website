import React, { useState, useEffect } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { BarList, Card } from '@tremor/react';
import { chartColors, formatDistance as formatDistanceUtil } from '../../utils/chartUtils';

export default function YearlyWorkouts({ yearlyStats = [] }) {
  const [stats, setStats] = useState(yearlyStats);
  
  // Listen for data updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleDataReady = (event) => {
        if (event.detail?.yearlyStats) {
          setStats(event.detail.yearlyStats);
        }
      };
      
      document.addEventListener('workout-data-ready', handleDataReady);
      return () => document.removeEventListener('workout-data-ready', handleDataReady);
    }
  }, []);
  
  // Format distance from km to miles with 1 decimal place
  const formatDistance = (distanceKm) => {
    const miles = distanceKm * 0.621371;
    return Math.round(miles * 10) / 10;
  };
  
  // Format duration from minutes to hours
  const formatDuration = (minutes) => {
    const hours = Math.round(minutes / 60);
    return hours;
  };
  
  if (!stats || stats.length === 0) {
    return (
      <div className="stats-card p-2 sm:p-4">
        <h3 className="text-lg font-semibold flex items-center mb-2">
          <CalendarIcon className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
          Yearly Stats
        </h3>
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No yearly stats available</p>
      </div>
    );
  }
  
  // Process stats to ensure they have the right properties and sort by year in descending order
  const processedStats = [...stats]
    .sort((a, b) => b.year - a.year) // Sort in descending order (newest first)
    .map(stat => ({
      name: stat.year.toString(),
      value: stat.activity_count,
      distance: formatDistance(stat.total_distance),
      elevation: Math.round(stat.total_elevation_gain),
      duration: formatDuration(stat.total_duration)
    }));
  
  return (
    <div className="stats-card p-2 sm:p-4">
      <h3 className="text-lg font-semibold flex items-center mb-4">
        <CalendarIcon className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
        Yearly Stats
      </h3>
      
      <Card className="max-h-[300px] overflow-y-auto">
        <BarList
          data={processedStats}
          valueFormatter={(value) => `${value} activities`}
          color={chartColors.orange}
          showAnimation={true}
          className="mt-2"
          item={({ name, value, distance, elevation, duration }) => (
            <div className="flex flex-col w-full">
              <div className="flex justify-between items-center">
                <span className="font-medium">{name}</span>
                <span className="font-medium">{value} activities</span>
              </div>
              <div className="flex flex-wrap gap-1 text-xs mt-1">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full whitespace-nowrap">
                  {distance} mi
                </span>
                <span className="px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full whitespace-nowrap">
                  {elevation} ft
                </span>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 rounded-full whitespace-nowrap">
                  {duration} hrs
                </span>
              </div>
            </div>
          )}
        />
      </Card>
    </div>
  );
}

