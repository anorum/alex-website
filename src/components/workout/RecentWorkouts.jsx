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
  
  // Initialize charts when data changes
  useEffect(() => {
    if (!activities || activities.length === 0) {
      return;
    }
    
    // Process data for charts
    const recentActivitiesData = [...activities]
      .slice(0, 10) // Take only the 10 most recent activities
      .reverse(); // Reverse to show oldest to newest (left to right)
    
    // Prepare data for distance chart
    const distanceData = recentActivitiesData
      .filter(activity => activity.distance > 0)
      .map(activity => ({
        x: formatDate(activity.date),
        y: formatDistance(activity.distance),
        type: activity.type,
        name: activity.name,
        duration: formatDuration(activity.duration)
      }));
    
    // Prepare data for duration chart
    const durationData = recentActivitiesData
      .filter(activity => activity.duration > 0)
      .map(activity => ({
        x: formatDate(activity.date),
        y: Math.round(activity.duration / 60 * 10) / 10, // Convert to hours with 1 decimal
        type: activity.type,
        name: activity.name,
        distance: activity.distance > 0 ? `${formatDistance(activity.distance)} mi` : 'N/A'
      }));
    
    // Clean up any existing charts
    ['recent-distance-chart', 'recent-duration-chart'].forEach(id => {
      const chartElement = document.getElementById(id);
      if (chartElement && chartElement.chart) {
        chartElement.chart.destroy();
        chartElement.chart = null;
      }
    });
    
    // Render distance chart
    if (distanceData.length > 0) {
      renderDistanceChart(distanceData);
    }
    
    // Render duration chart
    if (durationData.length > 0) {
      renderDurationChart(durationData);
    }
    
    // Add theme change listener
    const handleThemeChange = () => {
      // Clean up existing charts before rendering new ones
      ['recent-distance-chart', 'recent-duration-chart'].forEach(id => {
        const chartElement = document.getElementById(id);
        if (chartElement && chartElement.chart) {
          chartElement.chart.destroy();
          chartElement.chart = null;
        }
      });
      
      // Re-render charts with new theme
      if (distanceData.length > 0) {
        renderDistanceChart(distanceData);
      }
      
      if (durationData.length > 0) {
        renderDurationChart(durationData);
      }
    };
    
    // Listen for theme changes
    document.addEventListener('theme-changed', handleThemeChange);
    
    return () => {
      // Clean up charts on unmount
      ['recent-distance-chart', 'recent-duration-chart'].forEach(id => {
        const chartElement = document.getElementById(id);
        if (chartElement && chartElement.chart) {
          chartElement.chart.destroy();
          chartElement.chart = null;
        }
      });
      
      // Remove theme change listener
      document.removeEventListener('theme-changed', handleThemeChange);
    };
  }, [activities]);
  
  // Render distance chart
  const renderDistanceChart = (data) => {
    const currentTheme = getThemeColors();
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    const options = {
      series: [{
        name: 'Distance',
        data: data.map(item => item.y)
      }],
      chart: {
        id: 'recent-distance-chart',
        type: 'bar',
        height: 240,
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false },
        background: 'transparent',
      },
      plotOptions: {
        bar: {
          columnWidth: '70%',
          borderRadius: 6
        }
      },
      colors: [currentTheme.secondary],
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: data.map(item => item.x),
        labels: {
          style: {
            fontFamily: 'Inter, sans-serif',
            colors: currentTheme.textMuted
          },
          rotate: -45,
          rotateAlways: false,
          hideOverlappingLabels: true
        },
        axisBorder: { 
          show: true,
          color: currentTheme.axisBorder
        },
        axisTicks: { 
          show: true,
          color: currentTheme.axisBorder
        }
      },
      yaxis: {
        title: {
          text: 'Distance (miles)',
          style: {
            fontFamily: 'Inter, sans-serif',
            color: currentTheme.textMuted
          }
        },
        labels: {
          style: {
            colors: currentTheme.textMuted
          }
        }
      },
      grid: {
        borderColor: currentTheme.gridBorder,
        strokeDashArray: 4
      },
      tooltip: {
        theme: isDarkMode ? 'dark' : 'light',
        x: {
          show: true
        },
        y: {
          formatter: (value) => `${value} mi`
        },
        custom: ({ series, seriesIndex, dataPointIndex, w }) => {
          const item = data[dataPointIndex];
          return `
            <div class="p-2">
              <div class="flex items-center mb-2">
                <span class="text-lg mr-2">${getActivityIcon(item.type)}</span>
                <span class="font-medium">${item.name}</span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <span class="text-xs opacity-70">Date:</span>
                  <span class="block font-medium">${item.x}</span>
                </div>
                <div>
                  <span class="text-xs opacity-70">Type:</span>
                  <span class="block font-medium">${item.type}</span>
                </div>
                <div>
                  <span class="text-xs opacity-70">Distance:</span>
                  <span class="block font-medium">${item.y} mi</span>
                </div>
                <div>
                  <span class="text-xs opacity-70">Duration:</span>
                  <span class="block font-medium">${item.duration}</span>
                </div>
              </div>
            </div>
          `;
        }
      }
    };
    
    const chartElement = document.getElementById('recent-distance-chart');
    if (chartElement) {
      const chart = new ApexCharts(chartElement, options);
      chartElement.chart = chart;
      chart.render();
    }
  };
  
  // Render duration chart
  const renderDurationChart = (data) => {
    const currentTheme = getThemeColors();
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    const options = {
      series: [{
        name: 'Duration',
        data: data.map(item => item.y)
      }],
      chart: {
        id: 'recent-duration-chart',
        type: 'bar',
        height: 240,
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false },
        background: 'transparent',
      },
      plotOptions: {
        bar: {
          columnWidth: '70%',
          borderRadius: 6
        }
      },
      colors: [currentTheme.secondary],
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: data.map(item => item.x),
        labels: {
          style: {
            fontFamily: 'Inter, sans-serif',
            colors: currentTheme.textMuted
          },
          rotate: -45,
          rotateAlways: false,
          hideOverlappingLabels: true
        },
        axisBorder: { 
          show: true,
          color: currentTheme.axisBorder
        },
        axisTicks: { 
          show: true,
          color: currentTheme.axisBorder
        }
      },
      yaxis: {
        title: {
          text: 'Duration (hours)',
          style: {
            fontFamily: 'Inter, sans-serif',
            color: currentTheme.textMuted
          }
        },
        labels: {
          style: {
            colors: currentTheme.textMuted
          }
        }
      },
      grid: {
        borderColor: currentTheme.gridBorder,
        strokeDashArray: 4
      },
      tooltip: {
        theme: isDarkMode ? 'dark' : 'light',
        x: {
          show: true
        },
        y: {
          formatter: (value) => `${value} hrs`
        },
        custom: ({ series, seriesIndex, dataPointIndex, w }) => {
          const item = data[dataPointIndex];
          return `
            <div class="p-2">
              <div class="flex items-center mb-2">
                <span class="text-lg mr-2">${getActivityIcon(item.type)}</span>
                <span class="font-medium">${item.name}</span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <span class="text-xs opacity-70">Date:</span>
                  <span class="block font-medium">${item.x}</span>
                </div>
                <div>
                  <span class="text-xs opacity-70">Type:</span>
                  <span class="block font-medium">${item.type}</span>
                </div>
                <div>
                  <span class="text-xs opacity-70">Duration:</span>
                  <span class="block font-medium">${item.y} hrs</span>
                </div>
                <div>
                  <span class="text-xs opacity-70">Distance:</span>
                  <span class="block font-medium">${item.distance}</span>
                </div>
              </div>
            </div>
          `;
        }
      }
    };
    
    const chartElement = document.getElementById('recent-duration-chart');
    if (chartElement) {
      const chart = new ApexCharts(chartElement, options);
      chartElement.chart = chart;
      chart.render();
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
          <h5 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Recent Distances</h5>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Distance per recent activity (miles)</p>
          <div id="recent-distance-chart" className="mt-4"></div>
        </div>

        <div className="bg-white/10 dark:bg-gray-800/30 shadow-sm rounded-lg p-4">
          <h5 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Recent Durations</h5>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Duration per recent activity (hours)</p>
          <div id="recent-duration-chart" className="mt-4"></div>
        </div>
        
        <div className="bg-white/10 dark:bg-gray-800/30 shadow-sm rounded-lg p-4">
          <h5 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Recent Activities</h5>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Your latest workouts</p>
          <div className="max-h-[400px] overflow-y-auto pr-1">
            <div className="overflow-x-auto">
              <table className="w-full text-sm workout-stats-table">
                <thead className="bg-white/10 dark:bg-gray-700">
                  <tr>
                    <th className="p-2 text-left text-gray-700 dark:text-gray-200">Activity</th>
                    <th className="p-2 text-left hidden sm:table-cell text-gray-700 dark:text-gray-200">Type</th>
                    <th className="p-2 text-left text-gray-700 dark:text-gray-200">Date</th>
                    <th className="p-2 text-left text-gray-700 dark:text-gray-200">Distance</th>
                    <th className="p-2 text-left text-gray-700 dark:text-gray-200">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.slice(0, 10).map((activity, index) => (
                    <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <td className="p-2">
                        <div className="flex items-center">
                          <span className="text-xl mr-2">{getActivityIcon(activity.type)}</span>
                          <span className="font-medium text-sm truncate max-w-[120px] sm:max-w-[150px] text-gray-800 dark:text-gray-200">{activity.name}</span>
                        </div>
                      </td>
                      <td className="p-2 hidden sm:table-cell text-gray-700 dark:text-gray-300">
                        {activity.type}
                      </td>
                      <td className="p-2 text-gray-700 dark:text-gray-300">
                        {formatDate(activity.date)}
                      </td>
                      <td className="p-2">
                        {activity.distance > 0 ? 
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs">
                            {formatDistance(activity.distance)} mi
                          </span> : '-'}
                      </td>
                      <td className="p-2">
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
      </div>
    </div>
  );
}
