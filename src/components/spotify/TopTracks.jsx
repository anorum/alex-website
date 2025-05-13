import React, { useState, useEffect } from 'react';
import { PlayIcon } from '@heroicons/react/24/outline';

export default function TopTracks({ topTracks = [] }) {
  const [tracks, setTracks] = useState(topTracks);
  
  // Listen for data updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleDataReady = (event) => {
        if (event.detail?.topTracks) {
          setTracks(event.detail.topTracks);
        }
      };
      
      document.addEventListener('spotify-data-ready', handleDataReady);
      return () => document.removeEventListener('spotify-data-ready', handleDataReady);
    }
  }, []);
  
  if (!tracks || tracks.length === 0) {
    return (
      <div className="spotify-card p-2 sm:p-4">
        <h3 className="text-lg font-semibold flex items-center mb-2">
          <PlayIcon className="h-5 w-5 mr-2 text-pink-600 dark:text-pink-400" />
          Top Tracks
        </h3>
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No track data available</p>
      </div>
    );
  }
  
  return (
    <div className="spotify-card p-2 sm:p-4">
      <h3 className="text-lg font-semibold flex items-center mb-4">
        <PlayIcon className="h-5 w-5 mr-2 text-pink-600 dark:text-pink-400" />
        Top Tracks
      </h3>
      
      <div className="max-h-[400px] overflow-y-auto pr-1">
        {tracks.map((track, index) => (
          <div 
            key={index} 
            className="mb-3 bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 relative overflow-hidden">
                <img 
                  src={track.image_url} 
                  alt={track.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1">
                  <span className="text-white text-xs font-medium px-2 py-0.5 bg-pink-500/80 rounded-full">
                    {track.popularity || 0}%
                  </span>
                </div>
              </div>
              <div className="flex-grow p-3 min-w-0">
                <p className="font-medium text-sm sm:text-base truncate">{track.name}</p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                  {track.artists.join(', ')}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-1">
                  {track.album}
                </p>
              </div>
              <div className="hidden sm:flex items-center justify-center p-3">
                <span className="px-2 py-1 bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300 rounded-full text-xs font-medium">
                  {track.popularity || 0}% popular
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
