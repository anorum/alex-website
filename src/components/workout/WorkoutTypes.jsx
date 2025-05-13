import React, { useState, useEffect } from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';

export default function WorkoutTypes({ activityTypes = [] }) {
  const [types, setTypes] = useState(activityTypes);
  
  // Listen for data updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleDataReady = (event) => {
        if (event.detail?.topActivityTypes) {
          setTypes(event.detail.topActivityTypes);
        }
      };
      
      document.addEventListener('workout-data-ready', handleDataReady);
      return () => document.removeEventListener('workout-data-ready', handleDataReady);
    }
  }, []);
  
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
  
  // Format distance from km to miles with 1 decimal place
  const formatDistance = (distanceKm) => {
    const miles = distanceKm * 0.621371;
    return Math.round(miles * 10) / 10;
  };
  
  if (!types || types.length === 0) {
    return (
      <div className="stats-card p-2 sm:p-4">
        <h3 className="text-lg font-semibold flex items-center mb-2">
          <ChartBarIcon className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
          Activity Types
        </h3>
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No activity type data available</p>
      </div>
    );
  }
  
  const maxCount = Math.max(...types.map(type => type.count));
  
  return (
    <div className="stats-card p-2 sm:p-4">
      <h3 className="text-lg font-semibold flex items-center mb-4">
        <ChartBarIcon className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
        Activity Types
      </h3>
      
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
        {types.map((type, index) => (
          <div key={index} className="mb-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1 gap-2">
              <div className="flex items-center">
                <span className="text-xl mr-2">{getActivityIcon(type.name)}</span>
                <span className="text-sm font-medium">{type.name}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="workout-pill bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                  {type.count} activities
                </span>
                {type.total_distance > 0 && (
                  <span className="workout-pill bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                    {formatDistance(type.total_distance)} mi
                  </span>
                )}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-600 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full" 
                style={{ width: `${(type.count / maxCount) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
