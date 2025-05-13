import React, { useState, useEffect } from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import ApexCharts from 'apexcharts';

// Website theme colors
const themeColors = {
  primary: '#2a4535',      // Dark green (bg-color)
  accent: '#77647b',       // Purple (accent-color)
  secondary: '#8fb996',    // Light green (secondary-color)
  tertiary: '#d1e2c4',     // Very light green (tertiary-color)
  text: '#ffffff',         // White (text-color)
  bubble: 'rgba(255, 255, 255, 0.1)', // Bubble background
};

// Chart colors array
const chartColorsArray = [
  themeColors.secondary,
  themeColors.accent,
  themeColors.tertiary,
  '#ff9800',  // Orange
  '#2196f3',  // Blue
];

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
      activities: type.count
    }));
    
    const distanceData = types.map(type => ({
      name: type.name,
      distance: formatDistance(type.total_distance)
    })).filter(item => item.distance > 0); // Only include types with distance
    
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
    
    return () => {
      // Clean up charts on unmount
      ['activities-bar-chart', 'distance-bar-chart'].forEach(id => {
        const chartElement = document.getElementById(id);
        if (chartElement && chartElement.chart) {
          chartElement.chart.destroy();
        }
      });
    };
  }, [types]);
  
  // Render activities bar chart
  const renderActivitiesBarChart = (data) => {
    const options = {
      series: [{
        name: 'Activities',
        data: data.map(item => item.activities)
      }],
      chart: {
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
          borderRadius: 8
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function(val) {
          return val;
        },
        style: {
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
          colors: ['#fff']
        },
        offsetX: 16
      },
      colors: data.map((_, index) => chartColorsArray[index % chartColorsArray.length]),
      xaxis: {
        categories: data.map(item => item.name),
        labels: {
          style: {
            fontFamily: 'Inter, sans-serif',
            colors: 'rgba(255, 255, 255, 0.7)'
          }
        },
        axisBorder: { 
          show: true,
          color: 'rgba(255, 255, 255, 0.1)'
        },
        axisTicks: { 
          show: true,
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: 'rgba(255, 255, 255, 0.7)'
          }
        }
      },
      grid: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        strokeDashArray: 4,
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (value) => `${value} activities`
        }
      }
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
    const options = {
      series: [{
        name: 'Distance',
        data: data.map(item => item.distance)
      }],
      chart: {
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
          borderRadius: 8
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function(val) {
          return val + ' mi';
        },
        style: {
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
          colors: ['#fff']
        },
        offsetX: 16
      },
      colors: data.map((_, index) => chartColorsArray[index % chartColorsArray.length]),
      xaxis: {
        categories: data.map(item => item.name),
        labels: {
          style: {
            fontFamily: 'Inter, sans-serif',
            colors: 'rgba(255, 255, 255, 0.7)'
          }
        },
        axisBorder: { 
          show: true,
          color: 'rgba(255, 255, 255, 0.1)'
        },
        axisTicks: { 
          show: true,
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: 'rgba(255, 255, 255, 0.7)'
          }
        }
      },
      grid: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        strokeDashArray: 4,
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (value) => `${value} mi`
        }
      }
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
      <div className="stats-card p-2 sm:p-4">
        <h3 className="text-lg font-semibold flex items-center mb-2">
          <ChartBarIcon className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
          Activity Types
        </h3>
        <p className="text-center py-4">No activity type data available</p>
      </div>
    );
  }
  
  return (
    <div className="stats-card p-2 sm:p-4">
      <h3 className="text-lg font-semibold flex items-center mb-4">
        <ChartBarIcon className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
        Activity Types
      </h3>
      
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white/10 dark:bg-gray-800/30 shadow-sm rounded-lg p-4">
          <h5 className="text-lg font-medium text-white mb-2">Activities by Type</h5>
          <p className="text-sm text-gray-300 mb-4">Number of activities per type</p>
          <div id="activities-bar-chart" className="mt-4"></div>
        </div>

        <div className="bg-white/10 dark:bg-gray-800/30 shadow-sm rounded-lg p-4 mt-6">
          <h5 className="text-lg font-medium text-white mb-2">Distance by Type</h5>
          <p className="text-sm text-gray-300 mb-4">Total distance per activity type (miles)</p>
          <div id="distance-bar-chart" className="mt-4"></div>
        </div>
      </div>
    </div>
  );
}
