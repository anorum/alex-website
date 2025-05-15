import React, { useState, useEffect } from 'react';
import { FireIcon } from '@heroicons/react/24/outline';
import ApexCharts from 'apexcharts';

// Website theme colors
const themeColors = {
  // Dark mode colors
  dark: {
    primary: '#2a4535',      // Dark green (bg-color)
    accent: '#77647b',       // Purple (accent-color)
    secondary: '#8fb996',    // Light green (secondary-color)
    tertiary: '#d1e2c4',     // Very light green (tertiary-color)
    text: '#ffffff',         // White (text-color)
    textMuted: 'rgba(255, 255, 255, 0.7)',
    bubble: 'rgba(255, 255, 255, 0.1)', // Bubble background
    axisBorder: 'rgba(255, 255, 255, 0.1)',
    gridBorder: 'rgba(255, 255, 255, 0.1)'
  },
  // Light mode colors
  light: {
    primary: '#0c6b4e',      // Green (bg-color)
    accent: '#77647b',       // Purple (accent-color)
    secondary: '#0c6b4e',    // Green (secondary-color)
    tertiary: '#8fb996',     // Light green (tertiary-color)
    text: '#2a4535',         // Dark green (text-color)
    textMuted: 'rgba(42, 69, 53, 0.7)',
    bubble: 'rgba(255, 255, 255, 0.7)', // Bubble background
    axisBorder: 'rgba(0, 0, 0, 0.1)',
    gridBorder: 'rgba(0, 0, 0, 0.1)'
  }
};

// Function to get current theme colors
const getThemeColors = () => {
  if (typeof window !== 'undefined') {
    return document.documentElement.classList.contains('dark') 
      ? themeColors.dark 
      : themeColors.light;
  }
  return themeColors.dark; // Default to dark theme
};

// Chart colors array
const getChartColors = (isDarkMode) => {
  if (isDarkMode) {
    return [
      themeColors.dark.secondary,
      themeColors.dark.accent,
      themeColors.dark.tertiary,
      '#ff9800',  // Orange
      '#2196f3',  // Blue
    ];
  } else {
    return [
      themeColors.light.secondary,
      themeColors.light.accent,
      themeColors.light.tertiary,
      '#e65100',  // Dark Orange
      '#0d47a1',  // Dark Blue
    ];
  }
};

export default function RecentWorkouts({ recentActivities = [] }) {
  const [activities, setActivities] = useState(recentActivities);

  // Listen for workout-data-ready event to update activities dynamically
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleDataReady = (event) => {
        if (event.detail?.recentActivities) {
          setActivities(event.detail.recentActivities);
        }
      };
      document.addEventListener('workout-data-ready', handleDataReady);
      return () => document.removeEventListener('workout-data-ready', handleDataReady);
    }
  }, []);
  
  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Format distance from km to miles with 1 decimal place
  const formatDistance = (distanceKm) => {
    const miles = distanceKm * 0.621371;
    return Math.round(miles * 10) / 10;
  };
  
  // Format duration from minutes to hours and minutes
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Group activities by date (for calendar grid)
  const groupActivitiesByDate = (activities) => {
    const grouped = {};
    activities.forEach((activity) => {
      const dateKey = formatDate(activity.date);
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(activity);
    });
    return grouped;
  };

  // Helper to get intensity color based on total activity duration for a day
  const getIntensityColor = (activities) => {
    const totalMinutes = activities.reduce((sum, a) => sum + (a.duration || 0), 0);
    if (totalMinutes > 180) return '#ef4444'; // red-500
    if (totalMinutes > 120) return '#f97316'; // orange-500
    if (totalMinutes > 60) return '#facc15';  // yellow-400
    if (totalMinutes > 30) return '#4ade80';  // green-400
    if (totalMinutes > 0) return '#bbf7d0';   // green-200
    return 'transparent';
  };
  
  // Helper function to get activity icon
  const getActivityIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'run':
      case 'running':
        return "🏃‍♂️";
      case 'ride':
      case 'cycling':
      case 'bikeride':
      case 'virtualride':
        return "🚴‍♂️";
      case 'swim':
      case 'swimming':
        return "🏊‍♂️";
      case 'hike':
      case 'hiking':
      case 'walk':
      case 'walking':
        return "🥾";
      case 'workout':
      case 'weighttraining':
      case 'weight_training':
      case 'weights':
        return "🏋️‍♂️";
      case 'yoga':
        return "🧘‍♂️";
      default:
        return "🏆";
    }
  };
  
  
  if (!activities || activities.length === 0) {
    return (
      <div className="stats-card p-2 sm:p-4">
        <h3 className="text-lg font-semibold flex items-center mb-2">
          <FireIcon className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
          Recent Workouts
        </h3>
        <p className="text-center py-4">No recent workout data available</p>
      </div>
    );
  }
  
  return (
    <div className="stats-card p-2 sm:p-4">
      <h3 className="text-lg font-semibold flex items-center mb-4">
        <FireIcon className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
        Recent Workouts
      </h3>
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white/10 dark:bg-gray-800/30 shadow-sm rounded-lg p-4">
          <h5 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Activity Calendar</h5>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Icons represent each type of activity by date</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-3">
            {Object.entries(groupActivitiesByDate(activities)).map(([date, dayActivities]) => {
              const bgColor = getIntensityColor(dayActivities);
              return (
                <div
                  key={date}
                  className={`stats-card p-4 rounded-xl shadow-sm hover:shadow-lg transition-all transform hover:scale-[1.02] hover:brightness-105 flex flex-col items-center text-center border border-[var(--border-color)]`}
                  style={{ backgroundColor: 'var(--bubble-bg)', backgroundImage: `linear-gradient(to bottom, ${bgColor}, transparent)` }}
                >
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)] mb-2 tracking-tight uppercase">
                    {date}
                  </span>
                  <div className="flex flex-wrap justify-center gap-1 mb-2 text-lg sm:text-xl">
                    {dayActivities.map((act, idx) => (
                      <span key={idx} className="text-lg">{getActivityIcon(act.type)}</span>
                    ))}
                  </div>
                  <div className="text-[10px] sm:text-xs text-[var(--text-tertiary)] leading-tight space-y-0.5">
                    {dayActivities.map((act, idx) => (
                      <div key={idx}>
                        {act.duration ? formatDuration(act.duration) : ''}
                        {act.distance ? ` • ${formatDistance(act.distance)}mi` : ''}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#bbf7d0' }}></span> Light
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#4ade80' }}></span> Moderate
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#facc15' }}></span> Strong
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f97316' }}></span> Intense
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }}></span> Max Effort
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
