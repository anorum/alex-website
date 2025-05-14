import React, { useState, useEffect } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
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

export default function YearlyStats({ yearlyStats = [] }) {
  const [stats, setStats] = useState(yearlyStats);
  
  // Listen for data updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleDataReady = (event) => {
        if (event.detail?.yearlyStats) {
          setStats(event.detail.yearlyStats);
        }
      };
      
      document.addEventListener('travel-data-ready', handleDataReady);
      return () => document.removeEventListener('travel-data-ready', handleDataReady);
    }
  }, []);
  
  // Initialize charts when data changes
  useEffect(() => {
    if (!stats || stats.length === 0) {
      return;
    }
    
    // Process stats to ensure they have the right properties
    const processedStats = stats.map(stat => ({
      category: stat.year.toString(),
      values: {
        visits: stat.visits_count,
        countries: stat.countries_visited?.length || 0,
        cities: stat.cities_visited?.length || 0
      }
    })).sort((a, b) => a.category.localeCompare(b.category)); // Sort by year ascending
    
    // Clean up any existing charts
    const chartElement = document.getElementById('yearly-visits-chart');
    if (chartElement && chartElement.chart) {
      chartElement.chart.destroy();
      chartElement.chart = null;
    }
    
    // Render visits chart
    renderVisitsChart(processedStats);
    
    // Add theme change listener
    const handleThemeChange = () => {
      // Clean up existing chart before rendering new one
      const chartElement = document.getElementById('yearly-visits-chart');
      if (chartElement && chartElement.chart) {
        chartElement.chart.destroy();
        chartElement.chart = null;
      }
      
      // Re-render chart with new theme
      renderVisitsChart(processedStats);
    };
    
    // Listen for theme changes
    document.addEventListener('theme-changed', handleThemeChange);
    
    return () => {
      // Clean up charts on unmount
      const chartElement = document.getElementById('yearly-visits-chart');
      if (chartElement && chartElement.chart) {
        chartElement.chart.destroy();
        chartElement.chart = null;
      }
      
      // Remove theme change listener
      document.removeEventListener('theme-changed', handleThemeChange);
    };
  }, [stats]);
  
  // Render visits chart
  const renderVisitsChart = (data) => {
    const currentTheme = getThemeColors();
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    const options = {
      series: [{
        name: 'Visits',
        data: data.map(item => item.values.visits)
      }],
      chart: {
        id: 'yearly-visits-chart',
        type: 'bar',
        height: 320,
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false },
        background: 'transparent',
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '70%',
          borderRadius: 4,
          dataLabels: {
            position: 'top'
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function(val) {
          return val;
        },
        offsetY: -20,
        style: {
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
          colors: [isDarkMode ? '#fff' : '#2a4535']
        }
      },
      colors: [chartColors.green],
      xaxis: {
        categories: data.map(item => item.category),
        labels: {
          style: {
            fontFamily: 'Inter, sans-serif',
            colors: currentTheme.text,
            fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '10px' : '12px'
          }
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
        title: {
          text: 'Number of Visits',
          style: {
            fontFamily: 'Inter, sans-serif',
            color: currentTheme.text
          }
        },
        labels: {
          style: {
            colors: currentTheme.text,
            fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '10px' : '12px'
          }
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
        custom: ({ series, seriesIndex, dataPointIndex, w }) => {
          const item = data[dataPointIndex];
          return `
            <div class="p-2">
              <div class="flex items-center mb-2">
                <span class="font-medium">${item.category}</span>
              </div>
              <div class="grid grid-cols-1 gap-2">
                <div>
                  <span class="text-xs opacity-70">Visits:</span>
                  <span class="block font-medium">${item.values.visits}</span>
                </div>
                <div>
                  <span class="text-xs opacity-70">Countries:</span>
                  <span class="block font-medium">${item.values.countries}</span>
                </div>
                <div>
                  <span class="text-xs opacity-70">Cities:</span>
                  <span class="block font-medium">${item.values.cities}</span>
                </div>
              </div>
            </div>
          `;
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
                borderRadius: 3
              }
            },
            dataLabels: {
              style: {
                fontSize: '10px'
              }
            }
          }
        }
      ]
    };
    
    const chartElement = document.getElementById('yearly-visits-chart');
    if (chartElement) {
      const chart = new ApexCharts(chartElement, options);
      chartElement.chart = chart;
      chart.render();
    }
  };
  
  if (!stats || stats.length === 0) {
    return (
      <div className="stats-card p-2 sm:p-4 md:p-6">
        <h3 className="text-base sm:text-lg md:text-xl font-semibold flex items-center mb-2">
          <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-secondary-color" />
          Travel by Year
        </h3>
        <p className="text-center text-gray-500 dark:text-gray-400 py-3 sm:py-4">No yearly stats available</p>
      </div>
    );
  }
  
  return (
    <div className="stats-card p-2 sm:p-4 md:p-6">
      <h3 className="text-base sm:text-lg md:text-xl font-semibold flex items-center mb-2 sm:mb-3 md:mb-4">
        <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-secondary-color" />
        Travel by Year
      </h3>
      
      <div className="bg-white/10 dark:bg-gray-800/30 shadow-sm rounded-lg p-2 sm:p-3 md:p-4">
        <h5 className="text-sm sm:text-base md:text-lg font-medium text-gray-800 dark:text-white mb-1 sm:mb-1.5 md:mb-2">Yearly Visits</h5>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1.5 sm:mb-2 md:mb-4">Number of trips per year</p>
        <div className="chart-container mt-2 sm:mt-3 md:mt-4 h-[30vh] sm:h-[35vh] md:h-[40vh]">
          <div id="yearly-visits-chart"></div>
        </div>
      </div>
    </div>
  );
}
