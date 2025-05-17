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
    <div className="stats-card p-3 sm:p-4 rounded-xl bg-white/10 dark:bg-white/5">
      {stats.top_artists_with_images && stats.top_artists_with_images.length > 0 && (
        <div className="mt-2">
          <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1">
            <MusicalNoteIcon className="h-4 w-4" />
            Most Listened Artists
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {stats.top_artists_with_images.slice(0, 10).map((artist, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 rounded-lg border border-white/10 bg-white/10 dark:bg-white/5 shadow-sm hover:shadow-md transition"
              >
                <img 
                  src={artist.image_url} 
                  alt={artist.name} 
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm font-semibold truncate">{artist.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {stats.top_genres && stats.top_genres.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1">
            <MusicalNoteIcon className="h-4 w-4" />
            Top Genres
          </h4>
          <div className="flex flex-wrap gap-2">
            {stats.top_genres.slice(0, 10).map((genre, index) => (
              <span 
                key={index} 
                className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-tr from-purple-200 to-purple-300 dark:from-purple-900 dark:to-purple-800 text-purple-900 dark:text-purple-100 border border-white/10 shadow-sm"
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
