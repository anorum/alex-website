import React, { useState, useEffect } from 'react';
import { HeartIcon } from '@heroicons/react/24/outline';

// Format date for display
function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function RecentlyPlayed({ recentlyPlayed = [] }) {
  const [tracks, setTracks] = useState(recentlyPlayed);
  
  // Listen for data updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleDataReady = (event) => {
        if (event.detail?.recentlyPlayed) {
          setTracks(event.detail.recentlyPlayed);
        }
      };
      
      document.addEventListener('spotify-data-ready', handleDataReady);
      return () => document.removeEventListener('spotify-data-ready', handleDataReady);
    }
  }, []);
  
  if (!tracks || tracks.length === 0) {
    return (
      <div className="stats-card p-3 sm:p-4 rounded-xl border border-[var(--border-color)] bg-white/10 dark:bg-white/5">
        <h3 className="text-lg font-semibold flex items-center mb-2">
          <HeartIcon className="h-5 w-5 mr-2 text-red-600 dark:text-red-400" />
          Recently Played
        </h3>
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No recently played tracks available</p>
      </div>
    );
  }
  
  return (
    <div className="stats-card p-3 sm:p-4 rounded-xl border border-[var(--border-color)] bg-white/10 dark:bg-white/5">
      <h3 className="text-lg font-semibold flex items-center mb-4">
        <HeartIcon className="h-5 w-5 mr-2 text-red-600 dark:text-red-400" />
        Recently Played
      </h3>
      
      <div className="max-h-[400px] overflow-y-auto pr-1">
        <table className="w-full text-sm">
          <thead className="bg-white/5 dark:bg-white/10 text-[var(--text-tertiary)] text-xs uppercase tracking-wide">
            <tr>
              <th className="p-2 text-left">Track</th>
              <th className="p-2 text-left">Artist</th>
              <th className="p-2 text-left">Album</th>
              <th className="p-2 text-left">Played At</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((track, index) => (
              <tr key={index} className="border border-transparent rounded-md hover:border-[var(--border-color)] hover:bg-white/5 dark:hover:bg-gray-800 transition-all">
                <td className="px-2 py-1 text-sm sm:text-xs align-middle">
                  <div className="flex items-center">
                    <div className="w-8 h-8 flex-shrink-0 mr-2">
                      <img 
                        src={track.image_url} 
                        alt={track.name} 
                        className="w-full h-full object-cover rounded-sm music-image"
                      />
                    </div>
                    <span className="font-medium text-sm truncate max-w-[150px]">{track.name}</span>
                  </div>
                </td>
                <td className="px-2 py-1 text-[11px] text-gray-400 truncate max-w-[140px]">
                  {track.artists.join(', ')}
                </td>
                <td className="px-2 py-1 text-[11px] text-gray-400 truncate max-w-[140px]">
                  {track.album}
                </td>
                <td className="px-2 py-1 text-sm sm:text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap align-middle">
                  {formatDate(track.played_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
