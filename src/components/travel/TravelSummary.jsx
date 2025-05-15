import React, { useState, useEffect } from 'react';
import { GlobeAltIcon, MapIcon, CalendarIcon } from '@heroicons/react/24/outline';
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

export default function TravelSummary({ summary = {} }) {
  const [stats, setStats] = useState(summary);
  const [yearData, setYearData] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Check theme on mount and when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initial theme check
      setIsDarkMode(document.documentElement.classList.contains('dark'));
      
      // Listen for theme changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class' && 
              mutation.target === document.documentElement) {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
            
            // Trigger theme-changed event for charts to update
            document.dispatchEvent(new Event('theme-changed'));
          }
        });
      });
      
      observer.observe(document.documentElement, { attributes: true });
      
      return () => observer.disconnect();
    }
  }, []);
  
  // Listen for data updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleDataReady = (event) => {
        if (event.detail?.summary) {
          setStats(event.detail.summary);
        }
        if (event.detail?.yearlyStats) {
          setYearData(event.detail.yearlyStats);
        }
      };
      
      document.addEventListener('travel-data-ready', handleDataReady);
      return () => document.removeEventListener('travel-data-ready', handleDataReady);
    }
  }, []);
  
  const defaultStats = {
    total_countries: 0,
    total_cities: 0,
    total_visits: 0
  };
  
  const data = { ...defaultStats, ...stats };
  
  // Initialize charts when data changes
  useEffect(() => {
    if (!yearData || yearData.length === 0) {
      return;
    }
    
    // Process data for charts
    const chartData = [...yearData]
      .sort((a, b) => a.year - b.year) // Sort in ascending order (chronological)
      .map(year => ({
        year: year.year.toString(),
        countries: year.countries_visited?.length || 0,
        cities: year.cities_visited?.length || 0,
        visits: year.visits_count || 0
      }));
    
    // Clean up any existing charts
    ['countries-chart', 'cities-chart', 'visits-chart'].forEach(id => {
      const chartElement = document.getElementById(id);
      if (chartElement && chartElement.chart) {
        chartElement.chart.destroy();
        chartElement.chart = null;
      }
    });
    
    // Render all charts
    renderCountriesChart(chartData);
    renderCitiesChart(chartData);
    renderVisitsChart(chartData);
    
    // Add theme change listener
    const handleThemeChange = () => {
      // Clean up existing charts before rendering new ones
      ['countries-chart', 'cities-chart', 'visits-chart'].forEach(id => {
        const chartElement = document.getElementById(id);
        if (chartElement && chartElement.chart) {
          chartElement.chart.destroy();
          chartElement.chart = null;
        }
      });
      
      // Re-render charts with new theme
      renderCountriesChart(chartData);
      renderCitiesChart(chartData);
      renderVisitsChart(chartData);
    };
    
    // Listen for theme changes
    document.addEventListener('theme-changed', handleThemeChange);
    
    return () => {
      // Clean up charts on unmount
      ['countries-chart', 'cities-chart', 'visits-chart'].forEach(id => {
        const chartElement = document.getElementById(id);
        if (chartElement && chartElement.chart) {
          chartElement.chart.destroy();
          chartElement.chart = null;
        }
      });
      
      // Remove theme change listener
      document.removeEventListener('theme-changed', handleThemeChange);
    };
  }, [yearData]);
  
  // Render countries chart
  const renderCountriesChart = (chartData) => {
    const currentTheme = getThemeColors();
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    const options = {
      chart: {
        id: 'countries-chart',
        height: 120,
        type: "area",
        fontFamily: "Inter, sans-serif",
        dropShadow: {
          enabled: false,
        },
        toolbar: {
          show: false,
        },
        background: 'transparent',
      },
      tooltip: {
        enabled: true,
        theme: isDarkMode ? 'dark' : 'light',
        x: {
          show: true,
        },
        y: {
          formatter: (value) => `${value} countries`
        }
      },
      fill: {
        type: "gradient",
        gradient: {
          opacityFrom: 0.55,
          opacityTo: 0,
          shade: currentTheme.secondary,
          gradientToColors: [currentTheme.secondary],
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: 3,
        curve: 'smooth',
        colors: [currentTheme.secondary]
      },
      grid: {
        show: true,
        strokeDashArray: 4,
        padding: {
          left: 2,
          right: 2,
          top: 0
        },
        borderColor: currentTheme.gridBorder,
      },
      series: [
        {
          name: "Countries",
          data: chartData.map(item => item.countries),
          color: currentTheme.secondary,
        },
      ],
      xaxis: {
        categories: chartData.map(item => item.year),
        labels: {
          show: true,
          style: {
            fontFamily: 'Inter, sans-serif',
            colors: currentTheme.textMuted
          }
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        show: false,
      },
    };

    const chartElement = document.getElementById("countries-chart");
    if (chartElement) {
      const chart = new ApexCharts(chartElement, options);
      chartElement.chart = chart;
      chart.render();
    }
  };
  
  // Render cities chart
  const renderCitiesChart = (chartData) => {
    const currentTheme = getThemeColors();
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    const options = {
      chart: {
        id: 'cities-chart',
        height: 120,
        type: "area",
        fontFamily: "Inter, sans-serif",
        dropShadow: {
          enabled: false,
        },
        toolbar: {
          show: false,
        },
        background: 'transparent',
      },
      tooltip: {
        enabled: true,
        theme: isDarkMode ? 'dark' : 'light',
        x: {
          show: true,
        },
        y: {
          formatter: (value) => `${value} cities`
        }
      },
      fill: {
        type: "gradient",
        gradient: {
          opacityFrom: 0.55,
          opacityTo: 0,
          shade: currentTheme.accent,
          gradientToColors: [currentTheme.accent],
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: 3,
        curve: 'smooth',
        colors: [currentTheme.accent]
      },
      grid: {
        show: true,
        strokeDashArray: 4,
        padding: {
          left: 2,
          right: 2,
          top: 0
        },
        borderColor: currentTheme.gridBorder,
      },
      series: [
        {
          name: "Cities",
          data: chartData.map(item => item.cities),
          color: currentTheme.accent,
        },
      ],
      xaxis: {
        categories: chartData.map(item => item.year),
        labels: {
          show: true,
          style: {
            fontFamily: 'Inter, sans-serif',
            colors: currentTheme.textMuted
          }
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        show: false,
      },
    };

    const chartElement = document.getElementById("cities-chart");
    if (chartElement) {
      const chart = new ApexCharts(chartElement, options);
      chartElement.chart = chart;
      chart.render();
    }
  };
  
  // Render visits chart
  const renderVisitsChart = (chartData) => {
    const currentTheme = getThemeColors();
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    const options = {
      chart: {
        id: 'visits-chart',
        height: 120,
        type: "area",
        fontFamily: "Inter, sans-serif",
        dropShadow: {
          enabled: false,
        },
        toolbar: {
          show: false,
        },
        background: 'transparent',
      },
      tooltip: {
        enabled: true,
        theme: isDarkMode ? 'dark' : 'light',
        x: {
          show: true,
        },
        y: {
          formatter: (value) => `${value} visits`
        }
      },
      fill: {
        type: "gradient",
        gradient: {
          opacityFrom: 0.55,
          opacityTo: 0,
          shade: currentTheme.tertiary,
          gradientToColors: [currentTheme.tertiary],
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: 3,
        curve: 'smooth',
        colors: [currentTheme.tertiary]
      },
      grid: {
        show: true,
        strokeDashArray: 4,
        padding: {
          left: 2,
          right: 2,
          top: 0
        },
        borderColor: currentTheme.gridBorder,
      },
      series: [
        {
          name: "Visits",
          data: chartData.map(item => item.visits),
          color: currentTheme.tertiary,
        },
      ],
      xaxis: {
        categories: chartData.map(item => item.year),
        labels: {
          show: true,
          style: {
            fontFamily: 'Inter, sans-serif',
            colors: currentTheme.textMuted
          }
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        show: false,
      },
    };

    const chartElement = document.getElementById("visits-chart");
    if (chartElement) {
      const chart = new ApexCharts(chartElement, options);
      chartElement.chart = chart;
      chart.render();
    }
  };
  
  // Define stat items with their corresponding charts
  const statItems = [
    {
      icon: <GlobeAltIcon className="h-5 w-5" />,
      value: data.total_countries,
      label: "Countries",
      chartId: "countries-chart",
      textColor: "text-green-600 dark:text-green-400"
    },
    {
      icon: <MapIcon className="h-5 w-5" />,
      value: data.total_cities,
      label: "Cities",
      chartId: "cities-chart",
      textColor: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: <CalendarIcon className="h-5 w-5" />,
      value: data.total_visits,
      label: "Visits",
      chartId: "visits-chart",
      textColor: "text-amber-600 dark:text-amber-400"
    }
  ];
  
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {statItems.map((item, index) => (
          <div
            key={index}
            className="p-4 rounded-lg bg-[var(--bubble-bg)] border border-[var(--border-color)] shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${item.textColor} mr-3 bg-white/20 dark:bg-white/10 shadow-sm`}
                >
                  {item.icon}
                </div>
                <div>
                  <p className="text-xl font-semibold text-gray-800 dark:text-white">{item.value}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{item.label}</p>
                </div>
              </div>
            </div>
            <div id={item.chartId} className="h-[120px] mt-2"></div>
            <p className="text-xs text-[var(--text-tertiary)] mt-1 text-center">by year</p>
          </div>
        ))}
      </div>
    </div>
  );
}
