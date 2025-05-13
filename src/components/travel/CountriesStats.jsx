import React, { useState, useEffect } from 'react';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
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

export default function CountriesStats({ countriesData = [] }) {
  const [countries, setCountries] = useState(countriesData);
  
  // Listen for data updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleDataReady = (event) => {
        if (event.detail?.countriesData) {
          setCountries(event.detail.countriesData);
        }
      };
      
      document.addEventListener('travel-data-ready', handleDataReady);
      return () => document.removeEventListener('travel-data-ready', handleDataReady);
    }
  }, []);
  
  // Initialize charts when data changes
  useEffect(() => {
    if (!countries || countries.length === 0) {
      return;
    }
    
    // Sort countries by value (most visits first)
    const sortedCountries = [...countries].sort((a, b) => b.value - a.value);
    
    // Take top 10 countries for the chart
    const topCountries = sortedCountries.slice(0, 10);
    
    // Clean up any existing charts
    ['countries-bar-chart'].forEach(id => {
      const chartElement = document.getElementById(id);
      if (chartElement && chartElement.chart) {
        chartElement.chart.destroy();
      }
    });
    
    // Render countries bar chart
    renderCountriesBarChart(topCountries);
    
    return () => {
      // Clean up charts on unmount
      ['countries-bar-chart'].forEach(id => {
        const chartElement = document.getElementById(id);
        if (chartElement && chartElement.chart) {
          chartElement.chart.destroy();
        }
      });
    };
  }, [countries]);
  
  // Render countries bar chart
  const renderCountriesBarChart = (data) => {
    const options = {
      series: [{
        name: 'Visits',
        data: data.map(item => item.value)
      }],
      chart: {
        id: 'countries-bar-chart',
        type: 'bar',
        height: 350,
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false },
        background: 'transparent',
      },
      plotOptions: {
        bar: {
          horizontal: true,
          distributed: true,
          barHeight: '80%',
          borderRadius: 6
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
      legend: {
        show: false // Hide the legend as requested
      },
      colors: data.map((_, index) => {
        const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#ef4444', '#84cc16', '#14b8a6'];
        return colors[index % colors.length];
      }),
      xaxis: {
        categories: data.map(item => `${item.flag} ${item.name}`),
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
          formatter: (value) => `${value} visits`
        }
      }
    };
    
    const chartElement = document.getElementById('countries-bar-chart');
    if (chartElement) {
      const chart = new ApexCharts(chartElement, options);
      chartElement.chart = chart;
      chart.render();
    }
  };
  
  if (!countries || countries.length === 0) {
    return (
      <div className="stats-card p-2 sm:p-4">
        <h3 className="text-lg font-semibold flex items-center mb-2">
          <GlobeAltIcon className="h-5 w-5 mr-2 text-secondary-color" />
          Countries
        </h3>
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No countries data available</p>
      </div>
    );
  }
  
  return (
    <div className="stats-card p-2 sm:p-4">
      <h3 className="text-lg font-semibold flex items-center mb-4">
        <GlobeAltIcon className="h-5 w-5 mr-2 text-secondary-color" />
        Countries
      </h3>
      
      <div className="bg-white/10 dark:bg-gray-800/30 shadow-sm rounded-lg p-4">
        <h5 className="text-lg font-medium text-white mb-2">Most Visited Countries</h5>
        <p className="text-sm text-gray-300 mb-4">Top countries by number of visits</p>
        <div id="countries-bar-chart" className="mt-4"></div>
      </div>
    </div>
  );
}
