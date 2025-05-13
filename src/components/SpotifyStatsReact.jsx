import React, { useState, useEffect } from 'react';
import { Card, Title, Text, Metric, Grid, Col, Flex, Divider } from '@tremor/react';
import { MusicalNoteIcon, MicrophoneIcon, PlayIcon, HeartIcon, ChartBarIcon, ListBulletIcon } from '@heroicons/react/24/outline';

// Format date for display
function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function SpotifyStatsReact({ 
  topArtists: initialTopArtists, 
  topTracks: initialTopTracks, 
  recentlyPlayed: initialRecentlyPlayed, 
  playlists: initialPlaylists,
  stats: initialStats
}) {
  const [topArtists, setTopArtists] = useState(initialTopArtists || []);
  const [topTracks, setTopTracks] = useState(initialTopTracks || []);
  const [recentlyPlayed, setRecentlyPlayed] = useState(initialRecentlyPlayed || []);
  const [playlists, setPlaylists] = useState(initialPlaylists || []);
  const [stats, setStats] = useState(initialStats || {
    top_genres: [],
    average_artist_popularity: 0,
    average_track_popularity: 0,
    mainstream_factor: 0,
    top_artists: [],
    top_tracks: []
  });
  
  // Listen for custom event to update data
  useEffect(() => {
    // Only run on client-side
    if (typeof window !== 'undefined') {
      // Listen for the custom event
      const handleUpdateData = (event) => {
        if (event.detail) {
          const { topArtists: newTopArtists, topTracks: newTopTracks, recentlyPlayed: newRecentlyPlayed, playlists: newPlaylists, stats: newStats } = event.detail;
          
          if (newTopArtists) setTopArtists(newTopArtists);
          if (newTopTracks) setTopTracks(newTopTracks);
          if (newRecentlyPlayed) setRecentlyPlayed(newRecentlyPlayed);
          if (newPlaylists) setPlaylists(newPlaylists);
          if (newStats) setStats(newStats);
        }
      };
      
      document.addEventListener('spotify-data-ready', handleUpdateData);
      
      return () => {
        document.removeEventListener('spotify-data-ready', handleUpdateData);
      };
    }
  }, []);
  
  // Render top artists
  const renderTopArtists = () => {
    if (!topArtists || topArtists.length === 0) {
      return <Text>No artist data available</Text>;
    }
    
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4 music-grid">
        {topArtists.slice(0, 6).map((artist, index) => (
          <div key={index} className="spotify-card p-3 flex flex-col items-center">
            <div className="relative w-full pb-[100%] mb-2">
              <img 
                src={artist.image_url} 
                alt={artist.name} 
                className="absolute inset-0 w-full h-full object-cover rounded-md music-image"
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
    );
  };
  
  // Render top tracks
  const renderTopTracks = () => {
    if (!topTracks || topTracks.length === 0) {
      return <Text>No track data available</Text>;
    }
    
    return (
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {topTracks.slice(0, 6).map((track, index) => (
          <div key={index} className="spotify-card p-3 flex items-center">
            <div className="w-12 h-12 flex-shrink-0 mr-3">
              <img 
                src={track.image_url} 
                alt={track.name} 
                className="w-full h-full object-cover rounded-md music-image"
              />
            </div>
            <div className="flex-grow min-w-0">
              <p className="font-medium text-sm truncate">{track.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {track.artists.join(', ')}
              </p>
            </div>
            <div className="flex-shrink-0 ml-2">
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 rounded-full text-xs">
                {track.popularity || 0}%
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render recently played
  const renderRecentlyPlayed = () => {
    if (!recentlyPlayed || recentlyPlayed.length === 0) {
      return <Text>No recently played data available</Text>;
    }
    
    return (
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {recentlyPlayed.slice(0, 6).map((track, index) => (
          <div key={index} className="spotify-card p-3 flex items-center">
            <div className="w-12 h-12 flex-shrink-0 mr-3">
              <img 
                src={track.image_url} 
                alt={track.name} 
                className="w-full h-full object-cover rounded-md music-image"
              />
            </div>
            <div className="flex-grow min-w-0">
              <p className="font-medium text-sm truncate">{track.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {track.artists.join(', ')}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {formatDate(track.played_at)}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render genre stats
  const renderGenreStats = () => {
    if (!stats.top_genres || stats.top_genres.length === 0) {
      return <Text>No genre data available</Text>;
    }
    
    const maxCount = Math.max(...stats.top_genres.map(genre => genre.count));
    
    return (
      <div className="space-y-3">
        {stats.top_genres.map((genre, index) => (
          <div key={index} className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">{genre.genre}</span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 rounded-full text-xs">
                {genre.count} artists
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-600 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full" 
                style={{ width: `${(genre.count / maxCount) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render playlists
  const renderPlaylists = () => {
    if (!playlists || playlists.length === 0) {
      return <Text>No playlist data available</Text>;
    }
    
    return (
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {playlists.slice(0, 6).map((playlist, index) => (
          <div key={index} className="spotify-card p-3 flex items-center">
            <div className="w-12 h-12 flex-shrink-0 mr-3">
              {playlist.image_url ? (
                <img 
                  src={playlist.image_url} 
                  alt={playlist.name} 
                  className="w-full h-full object-cover rounded-md music-image"
                />
              ) : (
                <div className="w-full h-full bg-purple-100 dark:bg-purple-900 rounded-md flex items-center justify-center">
                  <ListBulletIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              )}
            </div>
            <div className="flex-grow min-w-0">
              <p className="font-medium text-sm truncate">{playlist.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {playlist.tracks} tracks
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="mt-8">
      {/* Summary Stats */}
      <div className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="spotify-card flex items-center p-0.5 sm:p-2 md:p-4 bg-opacity-20">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 mr-4">
              <MicrophoneIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{stats.top_artists_with_images?.length || 0}</h3>
              <p className="text-sm opacity-80">Top Artists</p>
            </div>
          </div>
          
          <div className="spotify-card flex items-center p-0.5 sm:p-2 md:p-4 bg-opacity-20">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400 mr-4">
              <PlayIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{stats.top_tracks_with_images?.length || 0}</h3>
              <p className="text-sm opacity-80">Top Tracks</p>
            </div>
          </div>
          
          <div className="spotify-card flex items-center p-0.5 sm:p-2 md:p-4 bg-opacity-20">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 mr-4">
              <ChartBarIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{Math.round(stats.mainstream_factor || 0)}%</h3>
              <p className="text-sm opacity-80">Mainstream</p>
            </div>
          </div>
          
          <div className="spotify-card flex items-center p-0.5 sm:p-2 md:p-4 bg-opacity-20">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 mr-4">
              <ListBulletIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{playlists?.length || 0}</h3>
              <p className="text-sm opacity-80">Playlists</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Top Artists */}
        <div className="spotify-card p-0.5 sm:p-2 md:p-4">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <MicrophoneIcon className="h-6 w-6 mr-2 text-purple-600 dark:text-purple-400" />
            Top Artists
          </h3>
          <div className="mt-4">
            {renderTopArtists()}
          </div>
        </div>
        
        {/* Top Tracks */}
        <div className="spotify-card p-0.5 sm:p-2 md:p-4">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <PlayIcon className="h-6 w-6 mr-2 text-pink-600 dark:text-pink-400" />
            Top Tracks
          </h3>
          <div className="mt-4">
            {renderTopTracks()}
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        {/* Recently Played */}
        <div className="spotify-card p-0.5 sm:p-2 md:p-4">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <HeartIcon className="h-6 w-6 mr-2 text-red-600 dark:text-red-400" />
            Recently Played
          </h3>
          <div className="mt-4">
            {renderRecentlyPlayed()}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Genre Stats */}
        <div className="spotify-card p-0.5 sm:p-2 md:p-4">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <ChartBarIcon className="h-6 w-6 mr-2 text-indigo-600 dark:text-indigo-400" />
            Top Genres
          </h3>
          <div className="mt-4">
            {renderGenreStats()}
          </div>
        </div>
        
        {/* Playlists */}
        <div className="spotify-card p-0.5 sm:p-2 md:p-4">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <ListBulletIcon className="h-6 w-6 mr-2 text-blue-600 dark:text-blue-400" />
            Your Playlists
          </h3>
          <div className="mt-4">
            {renderPlaylists()}
          </div>
        </div>
      </div>
    </div>
  );
}
