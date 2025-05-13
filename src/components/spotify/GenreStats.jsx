import React, { useState, useEffect } from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';

export default function GenreStats({ genreStats = [] }) {
  const [stats, setStats] = useState(genreStats);
  
  // Listen for data updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleDataReady = (event) => {
        if (event.detail?.stats?.top_genres) {
          setStats(event.detail.stats.top_genres);
        }
      };
      
      document.addEventListener('spotify-data-ready', handleDataReady);
      return () => document.removeEventListener('spotify-data-ready', handleDataReady);
    }
  }, []);
  
  if (!stats || stats.length === 0) {
    return (
      <div className="spotify-card p-2 sm:p-4">
        <h3 className="text-lg font-semibold flex items-center mb-2">
          <ChartBarIcon className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
          Top Genres
        </h3>
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No genre data available</p>
      </div>
    );
  }
  
  const maxCount = Math.max(...stats.map(genre => genre.count));
  
  return (
    <div className="spotify-card p-2 sm:p-4">
      <h3 className="text-lg font-semibold flex items-center mb-4">
        <ChartBarIcon className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
        Top Genres
      </h3>
      
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
        {stats.map((genre, index) => (
          <div key={index} className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">{genre.genre}</span>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 rounded-full text-xs">
                {genre.count} artists
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-600 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full" 
                style={{ width: `${(genre.count / maxCount) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
