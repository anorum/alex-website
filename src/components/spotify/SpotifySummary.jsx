import React, { useState, useEffect } from 'react';
import { MusicalNoteIcon, MicrophoneIcon, PlayIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function SpotifySummary({ summary = {} }) {
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
  
  return (
    <div className="spotify-card p-2 sm:p-4">
      <h3 className="text-lg font-semibold flex items-center mb-4">
        <MusicalNoteIcon className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
        Music Summary
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex flex-col items-center text-center shadow-sm">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 mb-3">
            <ChartBarIcon className="h-5 w-5" />
          </div>
          <p className="text-xl font-bold">{Math.round(stats.average_artist_popularity || 0)}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Artist Popularity</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex flex-col items-center text-center shadow-sm">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 mb-3">
            <ChartBarIcon className="h-5 w-5" />
          </div>
          <p className="text-xl font-bold">{Math.round(stats.mainstream_factor || 0)}%</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Mainstream Factor</p>
        </div>
      </div>
      
      {stats.top_artists_with_images && stats.top_artists_with_images.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Most Listened Artists</h4>
          <div className="flex flex-wrap gap-2">
            {stats.top_artists_with_images.slice(0, 10).map((artist, index) => (
              <div key={index} className="flex items-center bg-white dark:bg-gray-800 rounded-full pl-1 pr-3 py-1 shadow-sm">
                <img 
                  src={artist.image_url} 
                  alt={artist.name} 
                  className="w-6 h-6 rounded-full mr-2"
                />
                <span className="text-xs font-medium">{artist.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {stats.top_genres && stats.top_genres.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Top Genres</h4>
          <div className="flex flex-wrap gap-2">
            {stats.top_genres.slice(0, 10).map((genre, index) => (
              <span 
                key={index} 
                className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 rounded-full text-xs font-medium"
              >
                {genre.genre}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
