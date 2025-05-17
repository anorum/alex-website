import React, { useState, useEffect } from 'react';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';

export default function MusicSummary({ summary = {} }) {
  const [stats, setStats] = useState(summary);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Check theme on mount and when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initial theme check
      setIsDarkMode(document.documentElement.classList.contains('dark'));
      
      // Listen for theme changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class' && 
              mutation.target === document.documentElement) {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
          }
        });
      });
      
      observer.observe(document.documentElement, { attributes: true });
      
      return () => observer.disconnect();
    }
  }, []);
  
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
  
  const defaultStats = {
    average_artist_popularity: 0,
    mainstream_factor: 0
  };
  
  const data = { ...defaultStats, ...stats };
  
  // Define stat items
  const statItems = [
    {
      icon: <MusicalNoteIcon className="h-5 w-5" />,
      value: Math.round(data.average_artist_popularity || 0),
      label: "Avg. Artist Popularity",
      tooltip: "How popular your top artists are on Spotify (0–100)",
      bgColor: "bg-indigo-100 dark:bg-indigo-900",
      textColor: "text-indigo-700 dark:text-indigo-400"
    },
    {
      icon: <MusicalNoteIcon className="h-5 w-5" />,
      value: `${Math.round(data.mainstream_factor || 0)}%`,
      label: "Mainstream Factor",
      tooltip: "How mainstream your taste is compared to Spotify listeners",
      bgColor: "bg-blue-100 dark:bg-blue-900",
      textColor: "text-blue-700 dark:text-blue-400"
    }
  ];
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {statItems.map((item, index) => (
        <div key={index} className="stats-card p-3 rounded-xl shadow-sm hover:shadow-md transition-all border border-[var(--border-color)] bg-white/10 dark:bg-white/5 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.bgColor} ${item.textColor}`}>
            {item.icon}
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold">{item.value}</p>
            <div className="text-xs font-medium leading-tight" title={item.tooltip}>
              {item.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
