import React, { useState, useEffect } from 'react';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';

export default function MusicArtistsGenres({ summary = {} }) {
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
      {stats.top_artists_with_images && stats.top_artists_with_images.length > 0 && (
        <div className="mt-2">
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
