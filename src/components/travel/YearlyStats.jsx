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
  bubble: 'rgba(255, 255, 255, 0.1)', // Bubble background
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
      year: stat.year,
      visits_count: stat.visits_count,
      countries_count: stat.countries_visited?.length || 0,
      cities_count: stat.cities_visited?.length || 0
    })).sort((a, b) => a.year - b.year); // Sort by year ascending
    
    // Clean up any existing charts
    ['yearly-visits-chart'].forEach(id => {
      const chartElement = document.getElementById(id);
      if (chartElement && chartElement.chart) {
        chartElement.chart.destroy();
      }
    });
    
    // Render visits chart
    renderVisitsChart(processedStats);
    
    return () => {
      // Clean up charts on unmount
      ['yearly-visits-chart'].forEach(id => {
        const chartElement = document.getElementById(id);
        if (chartElement && chartElement.chart) {
          chartElement.chart.destroy();
        }
      });
    };
  }, [stats]);
  
  // Render visits chart
  const renderVisitsChart = (data) => {
    const options = {
      series: [{
        name: 'Visits',
        data: data.map(item => item.visits_count)
      }],
      chart: {
        id: 'yearly-visits-chart',
        type: 'bar',
        height: 300,
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false },
        background: 'transparent',
      },
      plotOptions: {
        bar: {
          columnWidth: '70%',
          borderRadius: 6,
          dataLabels: {
            position: 'top'
          }
        }
      },
      colors: [themeColors.secondary],
      dataLabels: {
        enabled: true,
        formatter: function(val) {
          return val;
        },
        offsetY: -20,
        style: {
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
          colors: ['rgba(255, 255, 255, 0.8)']
        }
      },
      xaxis: {
        categories: data.map(item => item.year.toString()),
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
        title: {
          text: 'Number of Visits',
          style: {
            fontFamily: 'Inter, sans-serif',
            color: 'rgba(255, 255, 255, 0.7)'
          }
        },
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
          formatter: (value) => `${value} visits`
        },
        custom: ({ series, seriesIndex, dataPointIndex, w }) => {
          const item = data[dataPointIndex];
          return `
            <div class="p-2">
              <div class="flex items-center mb-2">
                <span class="font-medium">${item.year}</span>
              </div>
              <div class="grid grid-cols-1 gap-2">
                <div>
                  <span class="text-xs opacity-70">Visits:</span>
                  <span class="block font-medium">${item.visits_count}</span>
                </div>
                <div>
                  <span class="text-xs opacity-70">Countries:</span>
                  <span class="block font-medium">${item.countries_count}</span>
                </div>
                <div>
                  <span class="text-xs opacity-70">Cities:</span>
                  <span class="block font-medium">${item.cities_count}</span>
                </div>
              </div>
            </div>
          `;
        }
      }
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
      <div className="stats-card p-2 sm:p-4">
        <h3 className="text-lg font-semibold flex items-center mb-2">
          <CalendarIcon className="h-5 w-5 mr-2 text-secondary-color" />
          Travel by Year
        </h3>
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No yearly stats available</p>
      </div>
    );
  }
  
  return (
    <div className="stats-card p-2 sm:p-4">
      <h3 className="text-lg font-semibold flex items-center mb-4">
        <CalendarIcon className="h-5 w-5 mr-2 text-secondary-color" />
        Travel by Year
      </h3>
      
      <div className="bg-white/10 dark:bg-gray-800/30 shadow-sm rounded-lg p-4">
        <h5 className="text-lg font-medium text-white mb-2">Yearly Visits</h5>
        <p className="text-sm text-gray-300 mb-4">Number of trips per year</p>
        <div id="yearly-visits-chart" className="mt-4"></div>
      </div>
    </div>
  );
}
