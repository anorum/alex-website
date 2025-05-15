import React, { useState, useEffect } from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import ApexCharts from 'apexcharts';

import { chartColors } from '../../utils/chartUtils';

// Function to get current theme colors
const getThemeColors = () => {
  if (typeof window !== 'undefined') {
    const isDarkMode = document.documentElement.classList.contains('dark');
    return {
      text: isDarkMode ? '#ffffff' : '#2a4535',
      textMuted: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(42, 69, 53, 0.7)',
      background: isDarkMode ? '#2a4535' : '#ffffff',
      border: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      grid: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    };
  }
  return {
    text: '#2a4535',
    textMuted: 'rgba(42, 69, 53, 0.7)',
    background: '#ffffff',
    border: 'rgba(0, 0, 0, 0.1)',
    grid: 'rgba(0, 0, 0, 0.1)',
  };
};

export default function WorkoutTypesChart({ activityTypes = [] }) {
  const [types, setTypes] = useState(activityTypes);
  
  // Format distance from km to miles with 1 decimal place
  const formatDistance = (distanceKm) => {
    const miles = distanceKm * 0.621371;
    return Math.round(miles * 10) / 10;
  };
  
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
  
  // Initialize charts when data changes
  useEffect(() => {
    if (!types || types.length === 0) {
      return;
    }
    
    // Process data for charts
    const activitiesData = types.map(type => ({
      name: type.name,
      value: type.count
    }));
    
    const distanceData = types.map(type => ({
      name: type.name,
      value: formatDistance(type.total_distance)
    })).filter(item => item.value > 0); // Only include types with distance
    
    // Clean up any existing charts
    ['activities-bar-chart', 'distance-bar-chart'].forEach(id => {
      const chartElement = document.getElementById(id);
      if (chartElement && chartElement.chart) {
        chartElement.chart.destroy();
      }
    });
    
    // Render activities bar chart
    renderActivitiesBarChart(activitiesData);
    
    // Render distance bar chart
    if (distanceData.length > 0) {
      renderDistanceBarChart(distanceData);
    }
    
    // Add theme change listener
    const handleThemeChange = () => {
      // Re-render charts when theme changes
      renderActivitiesBarChart(activitiesData);
      if (distanceData.length > 0) {
        renderDistanceBarChart(distanceData);
      }
    };
    
    document.addEventListener('theme-changed', handleThemeChange);
    
    return () => {
      // Clean up charts on unmount
      ['activities-bar-chart', 'distance-bar-chart'].forEach(id => {
        const chartElement = document.getElementById(id);
        if (chartElement && chartElement.chart) {
          chartElement.chart.destroy();
        }
      });
      
      document.removeEventListener('theme-changed', handleThemeChange);
    };
  }, [types]);
  
  // Render activities bar chart
  const renderActivitiesBarChart = (data) => {
    const currentTheme = getThemeColors();
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    const options = {
      series: [{
        name: 'Activities',
        data: data.map(item => item.value)
      }],
      chart: {
        id: 'activities-bar-chart',
        type: 'bar',
        height: 320,
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false },
        background: 'transparent',
      },
      plotOptions: {
        bar: {
          horizontal: true,
          distributed: true,
          barHeight: '80%',
          borderRadius: typeof window !== 'undefined' && window.innerWidth < 640 ? 6 : 8
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function(val) {
          return val;
        },
        style: {
          fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '10px' : '12px',
          fontFamily: 'Inter, sans-serif',
          colors: [isDarkMode ? '#fff' : '#2a4535']
        },
        offsetX: typeof window !== 'undefined' && window.innerWidth < 640 ? 8 : 16
      },
      colors: [chartColors.green],
      xaxis: {
        categories: data.map(item => item.name),
        labels: {
          style: {
            fontFamily: 'Inter, sans-serif',
            colors: currentTheme.text,
            fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '10px' : '12px'
          },
          trim: true
        },
        axisBorder: { 
          show: true,
          color: currentTheme.border
        },
        axisTicks: { 
          show: true,
          color: currentTheme.border
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: currentTheme.text,
            fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '10px' : '12px'
          },
          trim: true
        }
      },
      grid: {
        borderColor: currentTheme.grid,
        strokeDashArray: 4,
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      tooltip: {
        theme: isDarkMode ? 'dark' : 'light',
        y: {
          formatter: (value) => `${value}`
        }
      },
      responsive: [
        {
          breakpoint: 640,
          options: {
            chart: {
              height: 250
            },
            plotOptions: {
              bar: {
                borderRadius: 6
              }
            },
            legend: {
              position: 'bottom',
              fontSize: '10px'
            },
            dataLabels: {
              offsetX: 8,
              style: {
                fontSize: '10px'
              }
            }
          }
        }
      ]
    };
    
    const chartElement = document.getElementById('activities-bar-chart');
    if (chartElement) {
      const chart = new ApexCharts(chartElement, options);
      chartElement.chart = chart;
      chart.render();
    }
  };
  
  // Render distance bar chart
  const renderDistanceBarChart = (data) => {
    const currentTheme = getThemeColors();
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    const options = {
      series: [{
        name: 'Distance',
        data: data.map(item => item.value)
      }],
      chart: {
        id: 'distance-bar-chart',
        type: 'bar',
        height: 320,
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false },
        background: 'transparent',
      },
      plotOptions: {
        bar: {
          horizontal: true,
          distributed: true,
          barHeight: '80%',
          borderRadius: typeof window !== 'undefined' && window.innerWidth < 640 ? 6 : 8
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function(val) {
          return `${val} mi`;
        },
        style: {
          fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '10px' : '12px',
          fontFamily: 'Inter, sans-serif',
          colors: [isDarkMode ? '#fff' : '#2a4535']
        },
        offsetX: typeof window !== 'undefined' && window.innerWidth < 640 ? 8 : 16
      },
      colors: [chartColors.blue],
      xaxis: {
        categories: data.map(item => item.name),
        labels: {
          style: {
            fontFamily: 'Inter, sans-serif',
            colors: currentTheme.text,
            fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '10px' : '12px'
          },
          trim: true
        },
        axisBorder: { 
          show: true,
          color: currentTheme.border
        },
        axisTicks: { 
          show: true,
          color: currentTheme.border
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: currentTheme.text,
            fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '10px' : '12px'
          },
          trim: true
        }
      },
      grid: {
        borderColor: currentTheme.grid,
        strokeDashArray: 4,
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      tooltip: {
        theme: isDarkMode ? 'dark' : 'light',
        y: {
          formatter: (value) => `${value} mi`
        }
      },
      responsive: [
        {
          breakpoint: 640,
          options: {
            chart: {
              height: 250
            },
            plotOptions: {
              bar: {
                borderRadius: 6
              }
            },
            legend: {
              position: 'bottom',
              fontSize: '10px'
            },
            dataLabels: {
              offsetX: 8,
              style: {
                fontSize: '10px'
              }
            }
          }
        }
      ]
    };
    
    const chartElement = document.getElementById('distance-bar-chart');
    if (chartElement) {
      const chart = new ApexCharts(chartElement, options);
      chartElement.chart = chart;
      chart.render();
    }
  };
  
  if (!types || types.length === 0) {
    return (
      <div className="stats-card p-2 sm:p-4 md:p-6">
        <h3 className="text-base sm:text-lg md:text-xl font-semibold flex items-center mb-2">
          <ChartBarIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-orange-600 dark:text-orange-400" />
          Activity Types
        </h3>
        <p className="text-center py-3 sm:py-4">No activity type data available</p>
      </div>
    );
  }
  
  return (
  <div className="stats-card p-2 sm:p-4 md:p-6">
    <h3 className="text-base sm:text-lg md:text-xl font-semibold flex items-center mb-2 sm:mb-3 md:mb-4">
      <ChartBarIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-orange-600 dark:text-orange-400" />
      Activity Types
    </h3>

    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {types.map((type) => {
        const iconMap = {
          run: '🏃',
          ride: '🚴',
          yoga: '🧘',
          weighttraining: '🏋️',
          workout: '💪',
          hike: '🥾',
        };
        const icon = iconMap[type.name.toLowerCase()] || '❓';
        const percent = types[0].count > 0 ? (type.count / types[0].count) * 100 : 0;
        const totalMi = formatDistance(type.total_distance);
        const avgMi = type.count > 0 ? (totalMi / type.count).toFixed(1) : 0;

        return (
          <div key={type.name} className="bg-white/10 dark:bg-white/5 rounded-lg p-4 flex flex-col shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{icon}</span>
              <h4 className="font-semibold capitalize">{type.name.replace('_', ' ')}</h4>
            </div>
            <p className="text-sm text-[var(--text-tertiary)] mb-1">{type.count} workouts</p>
            <p className="text-sm text-[var(--text-tertiary)] mb-2">Total: {totalMi} mi • Avg: {avgMi} mi</p>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-orange-400 dark:bg-orange-300" style={{ width: `${percent}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  </div>
);
}
