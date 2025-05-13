import React, { useState, useEffect } from 'react';
import { MicrophoneIcon } from '@heroicons/react/24/outline';

export default function TopArtists({ topArtists = [] }) {
  const [artists, setArtists] = useState(topArtists);
  
  // Listen for data updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleDataReady = (event) => {
        if (event.detail?.topArtists) {
          setArtists(event.detail.topArtists);
        }
      };
      
      document.addEventListener('spotify-data-ready', handleDataReady);
      return () => document.removeEventListener('spotify-data-ready', handleDataReady);
    }
  }, []);
  
  if (!artists || artists.length === 0) {
    return (
      <div className="spotify-card p-2 sm:p-4">
        <h3 className="text-lg font-semibold flex items-center mb-2">
          <MicrophoneIcon className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
          Top Artists
        </h3>
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No artist data available</p>
      </div>
    );
  }
  
  return (
    <div className="spotify-card p-2 sm:p-4">
      <h3 className="text-lg font-semibold flex items-center mb-4">
        <MicrophoneIcon className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
        Top Artists
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4 music-grid">
        {artists.slice(0, 6).map((artist, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="relative w-full pb-[100%] mb-2">
              <img 
                src={artist.image_url} 
                alt={artist.name} 
                className="absolute inset-0 w-full h-full object-cover rounded-md music-image shadow-sm"
              />
            </div>
            <div className="text-center mt-2">
              <p className="font-medium text-sm truncate w-full">{artist.name}</p>
              <div className="flex items-center justify-center mt-1">
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 rounded-full text-xs">
                  {artist.popularity}% popular
                </span>
              </div>
              {artist.genres && artist.genres.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {artist.genres.slice(0, 2).join(', ')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
