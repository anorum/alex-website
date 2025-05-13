import React, { useState, useEffect } from 'react';
import { FireIcon } from '@heroicons/react/24/outline';

export default function RecentWorkouts({ recentActivities = [] }) {
  const [activities, setActivities] = useState(recentActivities);
  
  // Listen for data updates
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
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No recent workout data available</p>
      </div>
    );
  }
  
  return (
    <div className="stats-card p-2 sm:p-4">
      <h3 className="text-lg font-semibold flex items-center mb-4">
        <FireIcon className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
        Recent Workouts
      </h3>
      
      <div className="max-h-[400px] overflow-y-auto pr-1">
        <div className="overflow-x-auto">
          <table className="w-full text-sm workout-stats-table">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="p-2 text-left">Activity</th>
                <th className="p-2 text-left hidden sm:table-cell">Type</th>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Distance</th>
                <th className="p-2 text-left">Duration</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity, index) => (
                <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="p-2">
                    <div className="flex items-center">
                      <span className="text-xl mr-2">{getActivityIcon(activity.type)}</span>
                      <span className="font-medium text-sm truncate max-w-[120px] sm:max-w-[150px]">{activity.name}</span>
                    </div>
                  </td>
                  <td className="p-2 text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                    {activity.type}
                  </td>
                  <td className="p-2 text-gray-500 dark:text-gray-400">
                    {formatDate(activity.date)}
                  </td>
                  <td className="p-2 text-gray-500 dark:text-gray-400">
                    {activity.distance > 0 ? 
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs">
                        {formatDistance(activity.distance)} mi
                      </span> : '-'}
                  </td>
                  <td className="p-2 text-gray-500 dark:text-gray-400">
                    {activity.duration ? 
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 rounded-full text-xs">
                        {formatDuration(activity.duration)}
                      </span> : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
