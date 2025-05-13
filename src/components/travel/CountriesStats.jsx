import React, { useState, useEffect } from 'react';
import { GlobeAltIcon } from '@heroicons/react/24/outline';


export default function CountriesStats({ countriesData = [] }) {
  const [countries, setCountries] = useState(countriesData);
  
  // Listen for data updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleDataReady = (event) => {
        if (event.detail?.countriesData) {
          setCountries(event.detail.countriesData);
        }
      };
      
      document.addEventListener('travel-data-ready', handleDataReady);
      return () => document.removeEventListener('travel-data-ready', handleDataReady);
    }
  }, []);
  
  if (!countries || countries.length === 0) {
    return (
      <div className="stats-card p-2 sm:p-4">
        <h3 className="text-lg font-semibold flex items-center mb-2">
          <GlobeAltIcon className="h-5 w-5 mr-2 text-secondary-color" />
          Countries
        </h3>
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No countries data available</p>
      </div>
    );
  }
  
  // Sort countries by value (most visits first)
  const sortedCountries = [...countries].sort((a, b) => b.value - a.value);
  const maxVisits = sortedCountries[0].value;
  const totalVisits = sortedCountries.reduce((sum, country) => sum + country.value, 0);
  
  return (
    <div className="stats-card p-2 sm:p-4">
      <h3 className="text-lg font-semibold flex items-center mb-4">
        <GlobeAltIcon className="h-5 w-5 mr-2 text-secondary-color" />
        Countries
      </h3>
      
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
        {sortedCountries.map((country) => (
          <div key={country.name} className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center max-w-[60%]">
                <span className="text-xl mr-2 flex-shrink-0">{country.flag || "🏳️"}</span>
                <span className="text-sm font-medium truncate">{country.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full whitespace-nowrap">
                  {country.value} visits
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                  ({Math.round((country.value / totalVisits) * 100)}%)
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-600 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" 
                style={{ width: `${(country.value / maxVisits) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
