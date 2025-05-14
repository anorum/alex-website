import React, { useState, useEffect } from 'react';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
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
        chartElement.chart = null;
      }
    });
    
    // Render countries bar chart
    renderCountriesBarChart(topCountries);
    
    // Add theme change listener
    const handleThemeChange = () => {
      // Clean up existing chart before rendering new one
      ['countries-bar-chart'].forEach(id => {
        const chartElement = document.getElementById(id);
        if (chartElement && chartElement.chart) {
          chartElement.chart.destroy();
          chartElement.chart = null;
        }
      });
      
      // Re-render chart with new theme
      renderCountriesBarChart(topCountries);
    };
    
    // Listen for theme changes
    document.addEventListener('theme-changed', handleThemeChange);
    
    return () => {
      // Clean up charts on unmount
      ['countries-bar-chart'].forEach(id => {
        const chartElement = document.getElementById(id);
        if (chartElement && chartElement.chart) {
          chartElement.chart.destroy();
          chartElement.chart = null;
        }
      });
      
      // Remove theme change listener
      document.removeEventListener('theme-changed', handleThemeChange);
    };
  }, [countries]);
  
  // Render countries bar chart
  const renderCountriesBarChart = (data) => {
    const currentTheme = getThemeColors();
    const isDarkMode = document.documentElement.classList.contains('dark');
    
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
          colors: [isDarkMode ? '#fff' : '#2a4535']
        },
        offsetX: 16
      },
      legend: {
        show: false // Hide the legend as requested
      },
      colors: data.map((_, index) => {
        // Different color palettes for light and dark mode
        const darkColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#ef4444', '#84cc16', '#14b8a6'];
        const lightColors = ['#1d4ed8', '#7e22ce', '#be185d', '#b45309', '#047857', '#0e7490', '#4338ca', '#b91c1c', '#4d7c0f', '#0f766e'];
        
        return isDarkMode ? darkColors[index % darkColors.length] : lightColors[index % lightColors.length];
      }),
      xaxis: {
        categories: data.map(item => `${item.flag} ${item.name}`),
        labels: {
          style: {
            fontFamily: 'Inter, sans-serif',
            colors: currentTheme.textMuted
          }
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
        labels: {
          style: {
            colors: currentTheme.textMuted
          }
        }
      },
      grid: {
        borderColor: currentTheme.gridBorder,
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
        <h5 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Most Visited Countries</h5>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Top countries by number of visits</p>
        <div id="countries-bar-chart" className="mt-4"></div>
      </div>
    </div>
  );
}
