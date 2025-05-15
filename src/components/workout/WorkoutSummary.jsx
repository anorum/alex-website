import React, { useState, useEffect } from 'react';
import { FireIcon, ChartBarIcon, ArrowTrendingUpIcon, ClockIcon } from '@heroicons/react/24/outline';
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

export default function WorkoutSummary({ summary = {}, yearlyStats = [] }) {
  const [stats, setStats] = useState(summary);
  const [yearData, setYearData] = useState(yearlyStats);
  
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
      
      document.addEventListener('workout-data-ready', handleDataReady);
      return () => document.removeEventListener('workout-data-ready', handleDataReady);
    }
  }, []);

  
  const defaultStats = {
    total_distance: 0,
    total_elevation_gain: 0,
    total_duration: 0,
    activity_count: 0
  };
  
  const data = { ...defaultStats, ...stats };
  
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
        activities: year.activity_count,
        distance: formatDistance(year.total_distance),
        elevation: Math.round(year.total_elevation_gain / 100) / 10, // Convert to thousands of feet
        duration: Math.round(year.total_duration / 60) // Convert to hours
      }));
    
    // Clean up any existing charts
    ['activities-chart', 'distance-chart', 'elevation-chart', 'duration-chart'].forEach(id => {
      const chartElement = document.getElementById(id);
      if (chartElement && chartElement.chart) {
        chartElement.chart.destroy();
      }
    });
    
    // Render all charts
    renderActivitiesChart(chartData);
    renderDistanceChart(chartData);
    renderElevationChart(chartData);
    renderDurationChart(chartData);
    
    return () => {
      // Clean up charts on unmount
      ['activities-chart', 'distance-chart', 'elevation-chart', 'duration-chart'].forEach(id => {
        const chartElement = document.getElementById(id);
        if (chartElement && chartElement.chart) {
          chartElement.chart.destroy();
        }
      });
    };
  }, [yearData]);
  
  // Render activities chart
  const renderActivitiesChart = (chartData) => {
    const options = {
      chart: {
        id: 'activities-chart',
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
        theme: 'dark',
        x: {
          show: true,
        },
        y: {
          formatter: (value) => `${value} activities`
        }
      },
      fill: {
        type: "gradient",
        gradient: {
          opacityFrom: 0.55,
          opacityTo: 0,
          shade: themeColors.secondary,
          gradientToColors: [themeColors.secondary],
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: 3,
        curve: 'smooth',
        colors: [themeColors.secondary]
      },
      grid: {
        show: true,
        strokeDashArray: 4,
        padding: {
          left: 2,
          right: 2,
          top: 0
        },
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      series: [
        {
          name: "Activities",
          data: chartData.map(item => item.activities),
          color: themeColors.secondary,
        },
      ],
      xaxis: {
        categories: chartData.map(item => item.year),
        labels: {
          show: true,
          style: {
            fontFamily: 'Inter, sans-serif',
            colors: 'rgba(255, 255, 255, 0.7)'
          }
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        show: false,
      },
    };

    const chartElement = document.getElementById("activities-chart");
    if (chartElement) {
      const chart = new ApexCharts(chartElement, options);
      chartElement.chart = chart;
      chart.render();
    }
  };
  
  // Render distance chart
  const renderDistanceChart = (chartData) => {
    const options = {
      chart: {
        id: 'distance-chart',
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
        theme: 'dark',
        x: {
          show: true,
        },
        y: {
          formatter: (value) => `${value} mi`
        }
      },
      fill: {
        type: "gradient",
        gradient: {
          opacityFrom: 0.55,
          opacityTo: 0,
          shade: themeColors.accent,
          gradientToColors: [themeColors.accent],
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: 3,
        curve: 'smooth',
        colors: [themeColors.accent]
      },
      grid: {
        show: true,
        strokeDashArray: 4,
        padding: {
          left: 2,
          right: 2,
          top: 0
        },
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      series: [
        {
          name: "Distance",
          data: chartData.map(item => item.distance),
          color: themeColors.accent,
        },
      ],
      xaxis: {
        categories: chartData.map(item => item.year),
        labels: {
          show: true,
          style: {
            fontFamily: 'Inter, sans-serif',
            colors: 'rgba(255, 255, 255, 0.7)'
          }
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        show: false,
      },
    };

    const chartElement = document.getElementById("distance-chart");
    if (chartElement) {
      const chart = new ApexCharts(chartElement, options);
      chartElement.chart = chart;
      chart.render();
    }
  };
  
  // Render elevation chart
  const renderElevationChart = (chartData) => {
    const options = {
      chart: {
        id: 'elevation-chart',
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
        theme: 'dark',
        x: {
          show: true,
        },
        y: {
          formatter: (value) => `${value}k ft`
        }
      },
      fill: {
        type: "gradient",
        gradient: {
          opacityFrom: 0.55,
          opacityTo: 0,
          shade: themeColors.tertiary,
          gradientToColors: [themeColors.tertiary],
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: 3,
        curve: 'smooth',
        colors: [themeColors.tertiary]
      },
      grid: {
        show: true,
        strokeDashArray: 4,
        padding: {
          left: 2,
          right: 2,
          top: 0
        },
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      series: [
        {
          name: "Elevation",
          data: chartData.map(item => item.elevation),
          color: themeColors.tertiary,
        },
      ],
      xaxis: {
        categories: chartData.map(item => item.year),
        labels: {
          show: true,
          style: {
            fontFamily: 'Inter, sans-serif',
            colors: 'rgba(255, 255, 255, 0.7)'
          }
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        show: false,
      },
    };

    const chartElement = document.getElementById("elevation-chart");
    if (chartElement) {
      const chart = new ApexCharts(chartElement, options);
      chartElement.chart = chart;
      chart.render();
    }
  };
  
  // Render duration chart
  const renderDurationChart = (chartData) => {
    const options = {
      chart: {
        id: 'duration-chart',
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
        theme: 'dark',
        x: {
          show: true,
        },
        y: {
          formatter: (value) => `${value} hrs`
        }
      },
      fill: {
        type: "gradient",
        gradient: {
          opacityFrom: 0.55,
          opacityTo: 0,
          shade: themeColors.accent,
          gradientToColors: [themeColors.accent],
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: 3,
        curve: 'smooth',
        colors: [themeColors.accent]
      },
      grid: {
        show: true,
        strokeDashArray: 4,
        padding: {
          left: 2,
          right: 2,
          top: 0
        },
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      series: [
        {
          name: "Duration",
          data: chartData.map(item => item.duration),
          color: themeColors.accent,
        },
      ],
      xaxis: {
        categories: chartData.map(item => item.year),
        labels: {
          show: true,
          style: {
            fontFamily: 'Inter, sans-serif',
            colors: 'rgba(255, 255, 255, 0.7)'
          }
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        show: false,
      },
    };

    const chartElement = document.getElementById("duration-chart");
    if (chartElement) {
      const chart = new ApexCharts(chartElement, options);
      chartElement.chart = chart;
      chart.render();
    }
  };
  
  // Calculate total activities and year-over-year change
  const sortedStats = yearData.length > 0 ? [...yearData].sort((a, b) => b.year - a.year) : [];
  const yoyChange = sortedStats.length > 1 
    ? Math.round((sortedStats[0].activity_count / sortedStats[1].activity_count - 1) * 100) 
    : 0;
  
  // Define stat items with their corresponding charts
  const statItems = [
    {
      icon: <FireIcon className="h-5 w-5" />,
      value: data.activity_count,
      label: "Activities",
      chartId: "activities-chart",
      textColor: "text-orange-600 dark:text-orange-400"
    },
    {
      icon: <ChartBarIcon className="h-5 w-5" />,
      value: `${formatDistance(data.total_distance)} mi`,
      label: "Distance",
      chartId: "distance-chart",
      textColor: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: <ArrowTrendingUpIcon className="h-5 w-5" />,
      value: `${Math.round(data.total_elevation_gain)} ft`,
      label: "Elevation",
      chartId: "elevation-chart",
      textColor: "text-green-600 dark:text-green-400"
    },
    {
      icon: <ClockIcon className="h-5 w-5" />,
      value: formatDuration(data.total_duration),
      label: "Duration",
      chartId: "duration-chart",
      textColor: "text-purple-600 dark:text-purple-400"
    }
  ];
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {statItems.map((item, index) => (
          <div
            key={index}
            className="stats-card"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${item.textColor} mr-3 bg-white/20 dark:bg-white/10 shadow-sm`}
                >
                  {item.icon}
                </div>
                <div>
                  <p className="text-xl font-semibold">{item.value}</p>
                  <p className="text-sm opacity-80">{item.label}</p>
                </div>
              </div>
              {index === 0 && yoyChange !== 0 && (
                <div
                  className={`flex items-center px-2.5 py-0.5 text-base font-semibold ${
                    yoyChange >= 0 ? 'text-green-400' : 'text-red-400'
                  } text-center`}
                >
                  {yoyChange}%
                  <svg
                    className="w-3 h-3 ms-1"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 10 14"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d={
                        yoyChange >= 0
                          ? "M5 13V1m0 0L1 5m4-4 4 4"
                          : "M5 1v12m0 0l4-4m-4 4l-4-4"
                      }
                    />
                  </svg>
                </div>
              )}
            </div>
            <div id={item.chartId} className="h-[120px] mt-2"></div>
          </div>
        ))}
      </div>
    </>
  );
}
