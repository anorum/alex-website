import React, { useState, useEffect } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import ApexCharts from 'apexcharts';

// Website theme colors
const themeColors = {
  primary: '#2a4535',      // Dark green (bg-color)
  accent: '#77647b',       // Purple (accent-color)
  secondary: '#8fb996',    // Light green (secondary-color)
  tertiary: '#d1e2c4',     // Very light green (tertiary-color)
  text: '#ffffff',         // White (text-color)
  bubble: 'rgba(255, 255, 255, 0.1)' // Bubble background
};

export default function YearlyWorkouts({ yearlyStats = [] }) {
  const [stats, setStats] = useState(yearlyStats);
  
  // Listen for data updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleDataReady = (event) => {
        if (event.detail?.yearlyStats) {
          setStats(event.detail.yearlyStats);
        }
      };
      
      document.addEventListener('workout-data-ready', handleDataReady);
      return () => document.removeEventListener('workout-data-ready', handleDataReady);
    }
  }, []);
  
  // Format distance from km to miles with 1 decimal place
  const formatDistance = (distanceKm) => {
    const miles = distanceKm * 0.621371;
    return Math.round(miles * 10) / 10;
  };
  
  // Format duration from minutes to hours
  const formatDuration = (minutes) => {
    const hours = Math.round(minutes / 60);
    return hours;
  };
  
  // Initialize chart when data changes
  useEffect(() => {
    if (!stats || stats.length === 0) {
      return;
    }
    
    // Process stats to ensure they have the right properties and sort by year in descending order
    const processedStats = [...stats]
      .sort((a, b) => b.year - a.year) // Sort in descending order (newest first)
      .map(stat => ({
        name: stat.year.toString(),
        value: stat.activity_count
      }));
    
    // Clean up any existing chart
    const chartElement = document.getElementById('yearly-activities-chart');
    if (chartElement && chartElement.chart) {
      chartElement.chart.destroy();
    }
    
    // Create chart options
    const options = {
      series: [{
        name: 'Activities',
        data: processedStats.map(item => item.value)
      }],
      chart: {
        type: 'bar',
        height: 320,
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false },
        background: 'transparent'
      },
      plotOptions: {
        bar: {
          horizontal: true,
          distributed: true,
          barHeight: '80%',
          borderRadius: 8
        }
      },
      colors: Array(processedStats.length).fill(themeColors.secondary),
      dataLabels: {
        enabled: true,
        formatter: function(val) {
          return val + ' activities';
        },
        style: {
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
          colors: ['#fff']
        },
        offsetX: 16
      },
      xaxis: {
        categories: processedStats.map(item => item.name),
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
    
    // Render chart
    if (chartElement) {
      const chart = new ApexCharts(chartElement, options);
      chartElement.chart = chart;
      chart.render();
    }
    
    return () => {
      // Clean up chart on unmount
      if (chartElement && chartElement.chart) {
        chartElement.chart.destroy();
      }
    };
  }, [stats]);
  
  if (!stats || stats.length === 0) {
    return (
      <div className="stats-card p-2 sm:p-4">
        <h3 className="text-lg font-semibold flex items-center mb-2">
          <CalendarIcon className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
          Yearly Stats
        </h3>
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No yearly stats available</p>
      </div>
    );
  }
  
  // Process stats for display
  const processedStats = [...stats]
    .sort((a, b) => b.year - a.year) // Sort in descending order (newest first)
    .map(stat => ({
      name: stat.year.toString(),
      value: stat.activity_count,
      distance: formatDistance(stat.total_distance),
      elevation: Math.round(stat.total_elevation_gain),
      duration: formatDuration(stat.total_duration)
    }));
  
  return (
    <div className="stats-card p-2 sm:p-4">
      <h3 className="text-lg font-semibold flex items-center mb-4">
        <CalendarIcon className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
        Yearly Stats
      </h3>
      
      <div className="bg-white/10 dark:bg-gray-800/30 shadow-sm rounded-lg p-4 max-h-[500px] overflow-y-auto">
        <div id="yearly-activities-chart" className="mt-2 mb-4"></div>
        
        {/* Custom legend with additional stats */}
        <div className="mt-6 space-y-3">
          {processedStats.map((stat, index) => (
            <div key={index} className="flex flex-col">
              <div className="flex justify-between items-center">
                <span className="font-medium text-white">{stat.name}</span>
                <span className="font-medium text-white">{stat.value} activities</span>
              </div>
              <div className="flex flex-wrap gap-1 text-xs mt-1">
                <span className="px-2 py-0.5 bg-white/10 text-blue-300 rounded-full whitespace-nowrap">
                  {stat.distance} mi
                </span>
                <span className="px-2 py-0.5 bg-white/10 text-green-300 rounded-full whitespace-nowrap">
                  {stat.elevation} ft
                </span>
                <span className="px-2 py-0.5 bg-white/10 text-purple-300 rounded-full whitespace-nowrap">
                  {stat.duration} hrs
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
