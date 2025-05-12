import React, { useState, useEffect } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';

export default function YearlyStats({ yearlyStats = [] }) {
  const [stats, setStats] = useState(yearlyStats);
  
  // Listen for data updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleDataReady = (event) => {
        if (event.detail?.yearlyStats) {
          setStats(event.detail.yearlyStats);
        }
      };
      
      window.addEventListener('travel-data-ready', handleDataReady);
      return () => window.removeEventListener('travel-data-ready', handleDataReady);
    }
  }, []);
  
  if (!stats || stats.length === 0) {
    return (
      <div className="stats-card p-4">
        <h3 className="text-lg font-semibold flex items-center mb-2">
          <CalendarIcon className="h-5 w-5 mr-2 text-secondary-color" />
          Travel by Year
        </h3>
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No yearly stats available</p>
      </div>
    );
  }
  
  const maxVisits = Math.max(...stats.map(stat => stat.visits_count));
  
  return (
    <div className="stats-card p-4">
      <h3 className="text-lg font-semibold flex items-center mb-4">
        <CalendarIcon className="h-5 w-5 mr-2 text-secondary-color" />
        Travel by Year
      </h3>
      
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
        {stats.map((stat) => (
          <div key={stat.year} className="mb-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1 gap-2">
              <div className="flex items-center">
                <span className="text-sm font-medium">{stat.year}</span>
              </div>
              <div className="flex flex-wrap gap-1 text-xs">
                <span className="px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full whitespace-nowrap">
                  {stat.visits_count} visits
                </span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full whitespace-nowrap">
                  {stat.countries_count} countries
                </span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 rounded-full whitespace-nowrap">
                  {stat.cities_count} cities
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-600 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" 
                style={{ width: `${(stat.visits_count / maxVisits) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
