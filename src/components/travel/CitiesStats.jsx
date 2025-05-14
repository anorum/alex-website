import React, { useState, useEffect } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

export default function CitiesStats({ citiesData = [] }) {
  const [cities, setCities] = useState(citiesData);
  
  // Listen for data updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleDataReady = (event) => {
        if (event.detail?.citiesData) {
          setCities(event.detail.citiesData);
        }
      };
      
      document.addEventListener('travel-data-ready', handleDataReady);
      return () => document.removeEventListener('travel-data-ready', handleDataReady);
    }
  }, []);
  
  if (!cities || cities.length === 0) {
    return (
      <div className="stats-card p-2 sm:p-4">
        <h3 className="text-lg font-semibold flex items-center mb-2">
          <MapPinIcon className="h-5 w-5 mr-2 text-secondary-color" />
          Cities
        </h3>
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No cities data available</p>
      </div>
    );
  }
  
  // Sort cities by value (most visits first) and take top 10
  const sortedCities = [...cities].sort((a, b) => b.value - a.value).slice(0, 10);
  const maxVisits = sortedCities[0].value;
  
  return (
    <div className="stats-card p-2 sm:p-4">
      <h3 className="text-lg font-semibold flex items-center mb-4 text-gray-800 dark:text-white">
        <MapPinIcon className="h-5 w-5 mr-2 text-secondary-color" />
        Top Cities
      </h3>
      
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
        {sortedCities.map((city) => (
          <div key={city.name} className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center max-w-[70%]">
                <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-800 dark:text-green-300 mr-2 flex-shrink-0">
                  <span className="text-xs font-bold">{city.name.substring(0, 2).toUpperCase()}</span>
                </div>
                <span className="text-sm font-medium truncate text-gray-800 dark:text-white">{city.name}</span>
              </div>
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full whitespace-nowrap">
                {city.value} visits
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-600 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-700 dark:from-green-400 dark:to-green-600 h-2 rounded-full" 
                style={{ width: `${(city.value / maxVisits) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
      
      {cities.length > 10 && (
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing top 10 of {cities.length} cities
          </p>
        </div>
      )}
    </div>
  );
}
