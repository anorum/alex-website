import React, { useState, useEffect } from 'react';
import { ListBulletIcon } from '@heroicons/react/24/outline';

export default function Playlists({ playlists = [] }) {
  const [playlistData, setPlaylistData] = useState(playlists);
  
  // Listen for data updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleDataReady = (event) => {
        if (event.detail?.playlists) {
          setPlaylistData(event.detail.playlists);
        }
      };
      
      document.addEventListener('spotify-data-ready', handleDataReady);
      return () => document.removeEventListener('spotify-data-ready', handleDataReady);
    }
  }, []);
  
  if (!playlistData || playlistData.length === 0) {
    return (
      <div className="spotify-card p-2 sm:p-4">
        <h3 className="text-lg font-semibold flex items-center mb-2">
          <ListBulletIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
          Your Playlists
        </h3>
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No playlist data available</p>
      </div>
    );
  }
  
  return (
    <div className="spotify-card p-2 sm:p-4">
      <h3 className="text-lg font-semibold flex items-center mb-4">
        <ListBulletIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
        Your Playlists
      </h3>
      
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
        {playlistData.map((playlist, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-center shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 flex-shrink-0 mr-3">
              {playlist.image_url ? (
                <img 
                  src={playlist.image_url} 
                  alt={playlist.name} 
                  className="w-full h-full object-cover rounded-md music-image"
                />
              ) : (
                <div className="w-full h-full bg-blue-100 dark:bg-blue-900 rounded-md flex items-center justify-center">
                  <ListBulletIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              )}
            </div>
            <div className="flex-grow min-w-0">
              <p className="font-medium text-sm truncate">{playlist.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {playlist.tracks} tracks
              </p>
              {playlist.description && (
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                  {playlist.description}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 ml-2">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs">
                {playlist.public ? 'Public' : 'Private'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
