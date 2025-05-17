import React, { useState, useEffect } from 'react';
import { FlagIcon, ChartBarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import ApexCharts from 'apexcharts';

// For HeatMap
const getHeatColor = (percentage) => {
  if (percentage >= 75) return '#10B981'; // Green
  if (percentage >= 50) return '#FBBF24'; // Yellow
  if (percentage >= 25) return '#F97316'; // Orange
  return '#EF4444'; // Red
};

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

export default function GolfSummary({ summary = {} }) {
  const [stats, setStats] = useState(summary);
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
        if (event.detail?.stats) {
          setStats(event.detail.stats);
        }
      };

      document.addEventListener('golf-data-ready', handleDataReady);
      return () => document.removeEventListener('golf-data-ready', handleDataReady);
    }
  }, []);

  const defaultStats = {
    total_rounds: 0,
    total_holes_played: 0,
    average_score: 0,
    total_aces: 0,
    total_eagles: 0,
    total_birdies: 0,
    total_pars: 0,
    total_bogeys: 0,
    total_double_bogey_or_worse: 0,
    total_fairways_hit: 0,
    total_fairways_missed_left: 0,
    total_fairways_missed_right: 0,
    total_gir: 0,
    total_missed_greens_left: 0,
    total_missed_greens_right: 0,
    total_missed_greens_short: 0,
    total_missed_greens_long: 0
  };

  const data = { ...defaultStats, ...stats };

  // Calculate percentages
  const totalFairways = data.total_fairways_hit + data.total_fairways_missed_left + data.total_fairways_missed_right;
  const fairwaysHitPercentage = totalFairways > 0 ? Math.round((data.total_fairways_hit / totalFairways) * 100) : 0;

  const totalGreens = data.total_gir + data.total_missed_greens_left + data.total_missed_greens_right +
    data.total_missed_greens_short + data.total_missed_greens_long;
  const greensHitPercentage = totalGreens > 0 ? Math.round((data.total_gir / totalGreens) * 100) : 0;


  // Initialize charts when data changes
  useEffect(() => {

    // Add a small delay to ensure DOM elements are ready
    const initializeCharts = () => {
      // Clean up any existing charts
      ['greens-chart', 'fairways-chart'].forEach(id => {
        const chartElement = document.getElementById(id);
        if (chartElement && chartElement.chart) {
          chartElement.chart.destroy();
          chartElement.chart = null;
        }
      });

      // Render charts
      renderFairwaysChart();
    };

    // Use a small timeout to ensure DOM is ready
    const timeoutId = setTimeout(initializeCharts, 100);

    // Add theme change listener
    const handleThemeChange = () => {
      // Clean up existing charts before rendering new ones
      ['greens-chart', 'fairways-chart'].forEach(id => {
        const chartElement = document.getElementById(id);
        if (chartElement && chartElement.chart) {
          chartElement.chart.destroy();
          chartElement.chart = null;
        }
      });

      // Re-render charts with new theme
      renderGreensChart();
      renderFairwaysChart();
    };

    // Listen for theme changes
    document.addEventListener('theme-changed', handleThemeChange);

    return () => {
      // Clean up timeout
      clearTimeout(timeoutId);

      // Clean up charts on unmount
      ['greens-chart', 'fairways-chart'].forEach(id => {
        const chartElement = document.getElementById(id);
        if (chartElement && chartElement.chart) {
          chartElement.chart.destroy();
          chartElement.chart = null;
        }
      });

      // Remove theme change listener
      document.removeEventListener('theme-changed', handleThemeChange);
    };
  }, [stats, isDarkMode]);

  // Render greens chart
  const renderGreensChart = () => {
    const currentTheme = getThemeColors();

    // Calculate total shots for percentages
    const totalGreensShots = data.total_gir + data.total_missed_greens_left +
      data.total_missed_greens_right + data.total_missed_greens_short +
      data.total_missed_greens_long;

    // Always render chart even if data appears to be zero
    // This ensures the chart container is initialized

    // Create a quadrant visualization
    const options = {
      series: [
        {
          name: 'Hits',
          type: 'scatter',
          data: [{ x: 0, y: 0, z: data.total_gir }]
        },
        {
          name: 'Left',
          type: 'scatter',
          data: [{ x: -10, y: 0, z: data.total_missed_greens_left }]
        },
        {
          name: 'Right',
          type: 'scatter',
          data: [{ x: 10, y: 0, z: data.total_missed_greens_right }]
        },
        {
          name: 'Short',
          type: 'scatter',
          data: [{ x: 0, y: -10, z: data.total_missed_greens_short }]
        },
        {
          name: 'Long',
          type: 'scatter',
          data: [{ x: 0, y: 10, z: data.total_missed_greens_long }]
        }
      ],
      chart: {
        id: 'greens-chart',
        height: 240,
        type: 'bubble',
        fontFamily: 'Inter, sans-serif',
        background: 'transparent',
        toolbar: {
          show: false
        },
        animations: {
          enabled: false
        }
      },
      colors: [
        getHeatColor((data.total_gir / totalGreensShots) * 100),
        getHeatColor((data.total_missed_greens_left / totalGreensShots) * 100),
        getHeatColor((data.total_missed_greens_right / totalGreensShots) * 100),
        getHeatColor((data.total_missed_greens_short / totalGreensShots) * 100),
        getHeatColor((data.total_missed_greens_long / totalGreensShots) * 100)
      ],
      xaxis: {
        type: 'numeric',
        min: -15,
        max: 15,
        tickAmount: 3,
        labels: {
          show: false
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        },
        crosshairs: {
          show: false
        }
      },
      yaxis: {
        type: 'numeric',
        min: -15,
        max: 15,
        tickAmount: 3,
        labels: {
          show: false
        },
        crosshairs: {
          show: false
        }
      },
      grid: {
        show: true,
        borderColor: currentTheme.gridBorder,
        xaxis: {
          lines: {
            show: true
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      markers: {
        size: function (e, seriesIndex, dataPointIndex) {
          // Size based on the value (z)
          if (this.w.globals.series[seriesIndex] &&
            this.w.globals.series[seriesIndex][dataPointIndex]) {
            const value = this.w.globals.series[seriesIndex][dataPointIndex].z || 0;
            const percentage = totalGreensShots > 0 ? (value / totalGreensShots) * 100 : 0;
            return Math.max(percentage * 2, 5); // Minimum size of 5
          }
          return 5;
        },
        shape: 'circle',
        strokeWidth: 0
      },
      tooltip: {
        enabled: true,
        theme: isDarkMode ? 'dark' : 'light',
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          const value = w.globals.series[seriesIndex][dataPointIndex].z || 0;
          const name = w.globals.seriesNames[seriesIndex];
          const percentage = totalGreensShots > 0 ? ((value / totalGreensShots) * 100).toFixed(1) : '0.0';
          return `<div class="p-2">
                    <span class="font-semibold">${name}</span>: 
                    <span>${value} (${percentage}%)</span>
                  </div>`;
        }
      },
      legend: {
        show: true,
        position: 'bottom',
        horizontalAlign: 'center',
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif',
        labels: {
          colors: currentTheme.text
        },
        markers: {
          width: 12,
          height: 12,
          radius: 12
        },
        itemMargin: {
          horizontal: 8,
          vertical: 0
        },
        formatter: function (seriesName, opts) {
          const value = opts.w.globals.series[opts.seriesIndex][0].z || 0;
          const percentage = totalGreensShots > 0 ? ((value / totalGreensShots) * 100).toFixed(1) : '0.0';
          return `${seriesName}: ${value} (${percentage}%)`;
        }
      },
      annotations: {
        position: 'back',
        xaxis: [{
          x: 0,
          strokeDashArray: 0,
          borderColor: currentTheme.gridBorder,
          borderWidth: 1
        }],
        yaxis: [{
          y: 0,
          strokeDashArray: 0,
          borderColor: currentTheme.gridBorder,
          borderWidth: 1
        }],
        points: [],
        shapes: [
          {
            // Left misses
            x: -15,
            x2: 0,
            y: -15,
            y2: 15,
            fillColor: `rgba(255, 0, 0, ${Math.min(data.total_missed_greens_left / totalGreensShots, 1)})`,
            opacity: 0.25,
            type: 'rect'
          },
          {
            // Right misses
            x: 0,
            x2: 15,
            y: -15,
            y2: 15,
            fillColor: `rgba(255, 0, 0, ${Math.min(data.total_missed_greens_right / totalGreensShots, 1)})`,
            opacity: 0.25,
            type: 'rect'
          },
          {
            // Short misses
            x: -15,
            x2: 15,
            y: -15,
            y2: 0,
            fillColor: `rgba(255, 165, 0, ${Math.min(data.total_missed_greens_short / totalGreensShots, 1)})`,
            opacity: 0.25,
            type: 'rect'
          },
          {
            // Long misses
            x: -15,
            x2: 15,
            y: 0,
            y2: 15,
            fillColor: `rgba(255, 165, 0, ${Math.min(data.total_missed_greens_long / totalGreensShots, 1)})`,
            opacity: 0.25,
            type: 'rect'
          },
          {
            // Center hits (GIR)
            x: -5,
            x2: 5,
            y: -5,
            y2: 5,
            fillColor: `rgba(0, 255, 0, ${Math.min(data.total_gir / totalGreensShots, 1)})`,
            opacity: 0.3,
            type: 'rect'
          }
        ]
      }
    };

    const chartElement = document.getElementById('greens-chart');
    if (chartElement) {
      const chart = new ApexCharts(chartElement, options);
      chartElement.chart = chart;
      chart.render();
    } else {
      console.error("Could not find greens-chart element");
    }
  };

  // Render fairways chart
  const renderFairwaysChart = () => {
    const currentTheme = getThemeColors();

    // Calculate total shots for percentages
    const totalFairwayShots = data.total_fairways_hit + data.total_fairways_missed_left +
      data.total_fairways_missed_right;

    // Always render chart even if data appears to be zero
    // This ensures the chart container is initialized

    // Create a quadrant visualization
    const options = {
      series: [
        {
          name: 'Hit',
          type: 'scatter',
          data: [{ x: 0, y: 0, z: data.total_fairways_hit }]
        },
        {
          name: 'Left',
          type: 'scatter',
          data: [{ x: -10, y: 0, z: data.total_fairways_missed_left }]
        },
        {
          name: 'Right',
          type: 'scatter',
          data: [{ x: 10, y: 0, z: data.total_fairways_missed_right }]
        }
      ],
      chart: {
        id: 'fairways-chart',
        height: 240,
        type: 'bubble',
        fontFamily: 'Inter, sans-serif',
        background: 'transparent',
        toolbar: {
          show: false
        },
        animations: {
          enabled: false
        }
      },
      colors: [
        getHeatColor((data.total_fairways_hit / totalFairwayShots) * 100),
        getHeatColor((data.total_fairways_missed_left / totalFairwayShots) * 100),
        getHeatColor((data.total_fairways_missed_right / totalFairwayShots) * 100)
      ],
      xaxis: {
        type: 'numeric',
        min: -15,
        max: 15,
        tickAmount: 3,
        labels: {
          show: false
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        },
        crosshairs: {
          show: false
        }
      },
      yaxis: {
        type: 'numeric',
        min: -5,
        max: 5,
        tickAmount: 1,
        labels: {
          show: false
        },
        crosshairs: {
          show: false
        }
      },
      grid: {
        show: true,
        borderColor: currentTheme.gridBorder,
        xaxis: {
          lines: {
            show: true
          }
        },
        yaxis: {
          lines: {
            show: false
          }
        }
      },
      markers: {
        size: function (e, seriesIndex, dataPointIndex) {
          // Size based on the value (z)
          if (this.w.globals.series[seriesIndex] &&
            this.w.globals.series[seriesIndex][dataPointIndex]) {
            const value = this.w.globals.series[seriesIndex][dataPointIndex].z || 0;
            const percentage = totalFairwayShots > 0 ? (value / totalFairwayShots) * 100 : 0;
            return Math.max(percentage * 2, 5); // Minimum size of 5
          }
          return 5;
        },
        shape: 'circle',
        strokeWidth: 0
      },
      tooltip: {
        enabled: true,
        theme: isDarkMode ? 'dark' : 'light',
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          const value = w.globals.series[seriesIndex][dataPointIndex].z || 0;
          const name = w.globals.seriesNames[seriesIndex];
          const percentage = totalFairwayShots > 0 ? ((value / totalFairwayShots) * 100).toFixed(1) : '0.0';
          return `<div class="p-2">
                    <span class="font-semibold">${name}</span>: 
                    <span>${value} (${percentage}%)</span>
                  </div>`;
        }
      },
      legend: {
        show: true,
        position: 'bottom',
        horizontalAlign: 'center',
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif',
        labels: {
          colors: currentTheme.text
        },
        markers: {
          width: 12,
          height: 12,
          radius: 12
        },
        itemMargin: {
          horizontal: 8,
          vertical: 0
        },
        formatter: function (seriesName, opts) {
          const value = opts.w.globals.series[opts.seriesIndex][0].z || 0;
          const percentage = totalFairwayShots > 0 ? ((value / totalFairwayShots) * 100).toFixed(1) : '0.0';
          return `${seriesName}: ${value} (${percentage}%)`;
        }
      },
      annotations: {
        position: 'back',
        xaxis: [{
          x: 0,
          strokeDashArray: 0,
          borderColor: currentTheme.gridBorder,
          borderWidth: 1
        }],
        yaxis: [{
          y: 0,
          strokeDashArray: 0,
          borderColor: currentTheme.gridBorder,
          borderWidth: 1
        }],
        points: [],
        shapes: [
          {
            x: -15,
            x2: 0,
            y: -5,
            y2: 5,
            fillColor: `rgba(255, 0, 0, ${Math.min(data.total_fairways_missed_left / totalFairwayShots, 1)})`,
            opacity: 0.25,
            type: 'rect'
          },
          {
            x: 0,
            x2: 15,
            y: -5,
            y2: 5,
            fillColor: `rgba(255, 0, 0, ${Math.min(data.total_fairways_missed_right / totalFairwayShots, 1)})`,
            opacity: 0.25,
            type: 'rect'
          },
          {
            x: -5,
            x2: 5,
            y: -5,
            y2: 5,
            fillColor: `rgba(0, 255, 0, ${Math.min(data.total_fairways_hit / totalFairwayShots, 1)})`,
            opacity: 0.25,
            type: 'rect'
          }
        ]
      }
    };

    const chartElement = document.getElementById('fairways-chart');
    if (chartElement) {
      const chart = new ApexCharts(chartElement, options);
      chartElement.chart = chart;
      chart.render();
    } else {
      console.error("Could not find fairways-chart element");
    }
  };

  // Define stat items
  const statItems = [
    {
      icon: <FlagIcon className="h-5 w-5" />,
      value: data.total_rounds,
      label: "Rounds Played",
      textColor: "text-green-600 dark:text-green-400"
    },
    {
      icon: <ChartBarIcon className="h-5 w-5" />,
      value: data.average_score.toFixed(1),
      label: "Average Score",
      textColor: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: <ArrowTrendingUpIcon className="h-5 w-5" />,
      value: `${fairwaysHitPercentage}%`,
      label: "Fairways Hit",
      textColor: "text-amber-600 dark:text-amber-400"
    },
    {
      icon: <FlagIcon className="h-5 w-5" />,
      value: `${greensHitPercentage}%`,
      label: "Greens in Regulation",
      textColor: "text-purple-600 dark:text-purple-400"
    }
  ];

  return (
    <div>
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {statItems.map((item, index) => (
          <div key={index} className="p-4 rounded-lg bg-white/10 dark:bg-white/5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.textColor} mr-3`}>
                {item.icon}
              </div>
              <div>
                <p className="text-xl font-bold">{item.value}</p>
                <p className="text-sm font-medium">{item.label}</p>
              </div>
            </div>
          </div>
        </div>
        ))}
      </div>
            {/* Scoring Stats */}
      <div className="p-4 mt-4 pb-6 rounded-lg bg-white/10 dark:bg-white/5 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Scoring Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white/70 dark:bg-gray-800/30 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{data.total_aces}</p>
            <p className="text-sm">Aces</p>
          </div>
          <div className="bg-white/70 dark:bg-gray-800/30 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{data.total_eagles}</p>
            <p className="text-sm">Eagles</p>
          </div>
          <div className="bg-white/70 dark:bg-gray-800/30 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-green-600 dark:text-green-400">{data.total_birdies}</p>
            <p className="text-sm">Birdies</p>
          </div>
          <div className="bg-white/70 dark:bg-gray-800/30 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{data.total_pars}</p>
            <p className="text-sm">Pars</p>
          </div>
          <div className="bg-white/70 dark:bg-gray-800/30 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{data.total_bogeys}</p>
            <p className="text-sm">Bogeys</p>
          </div>
          <div className="bg-white/70 dark:bg-gray-800/30 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-red-600 dark:text-red-400">{data.total_double_bogey_or_worse}</p>
            <p className="text-sm">Double+</p>
          </div>
        </div>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Green Accuracy Chart */}
        {/* Green Accuracy Dial */}
        <div className="p-4 rounded-lg bg-white/10 dark:bg-white/5 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Green Accuracy</h3>
          <div className="relative w-64 h-64 mx-auto">
            {/* Cross lines */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-px bg-gray-400 dark:bg-gray-600 absolute"></div>
              <div className="h-full w-px bg-gray-400 dark:bg-gray-600 absolute"></div>
            </div>

            {/* Center circle (GIR) */}
            <div className="absolute top-1/3 left-1/3 w-1/3 h-1/3 rounded-full bg-green-600/70 flex items-center justify-center text-sm font-bold text-white">
              {totalGreens > 0 ? `${Math.round((data.total_gir / totalGreens) * 100)}%` : '0%'}
            </div>

            {/* Quadrant labels */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs text-center">
              Miss Long<br />
              {totalGreens > 0 ? Math.round((data.total_missed_greens_long / totalGreens) * 100) : 0}%
            </div>
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-center">
              Miss Short<br />
              {totalGreens > 0 ? Math.round((data.total_missed_greens_short / totalGreens) * 100) : 0}%
            </div>
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-center">
              Miss Left<br />
              {totalGreens > 0 ? Math.round((data.total_missed_greens_left / totalGreens) * 100) : 0}%
            </div>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-center">
              Miss Right<br />
              {totalGreens > 0 ? Math.round((data.total_missed_greens_right / totalGreens) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Fairway Accuracy Chart */}
        <div className="p-4 rounded-lg bg-white/10 dark:bg-white/5 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Fairway Accuracy</h3>
          <div className="relative w-full h-32 sm:h-40 md:h-48 border border-gray-400 dark:border-gray-600 rounded-sm overflow-hidden">
            {/* Left Miss */}
            <div className="absolute top-0 bottom-0 left-0 w-1/3 bg-red-500/30 flex items-center justify-center text-xs text-white font-semibold text-center px-1">
              Miss Left<br />
              {totalFairways > 0 ? Math.round((data.total_fairways_missed_left / totalFairways) * 100) : 0}%
            </div>

            {/* Center Hit */}
            <div className="absolute top-0 bottom-0 left-1/3 w-1/3 bg-green-500/60 flex items-center justify-center text-xs text-white font-semibold text-center px-1">
              Hit<br />
              {totalFairways > 0 ? Math.round((data.total_fairways_hit / totalFairways) * 100) : 0}%
            </div>

            {/* Right Miss */}
            <div className="absolute top-0 bottom-0 right-0 w-1/3 bg-red-500/30 flex items-center justify-center text-xs text-white font-semibold text-center px-1">
              Miss Right<br />
              {totalFairways > 0 ? Math.round((data.total_fairways_missed_right / totalFairways) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
