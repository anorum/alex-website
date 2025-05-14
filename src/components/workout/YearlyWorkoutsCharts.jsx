import React, { useState, useEffect } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import ApexCharts from 'apexcharts';

import { chartColors } from '../../utils/chartUtils';

// Chart colors
const themeColors = {
  primary: chartColors.green,
  accent: chartColors.purple,
  secondary: chartColors.teal,
  tertiary: chartColors.blue,
};

export default function YearlyWorkoutsCharts({ yearlyStats = [] }) {
  const [stats, setStats] = useState(yearlyStats);
  const [activeTab, setActiveTab] = useState(0);
  
  // Format distance from km to miles with 1 decimal place
  const formatDistance = (distanceKm) => {
    const miles = distanceKm * 0.621371;
    return Math.round(miles * 10) / 10;
  };
  
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
  
  // Initialize charts when data or active tab changes
  useEffect(() => {
    if (!stats || stats.length === 0) {
      return;
    }
    
    // Process data for charts
    const chartData = [...stats]
      .sort((a, b) => a.year - b.year) // Sort in ascending order (chronological)
      .map(year => ({
        year: year.year.toString(),
        activities: year.activity_count,
        distance: formatDistance(year.total_distance),
        elevation: Math.round(year.total_elevation_gain / 100) / 10, // Convert to thousands of feet
        duration: Math.round(year.total_duration / 60) // Convert to hours
      }));
    
    // Clean up any existing charts
    ['activities-chart', 'distance-chart', 'elevation-chart', 'duration-chart', 'area-chart'].forEach(id => {
      const chartElement = document.getElementById(id);
      if (chartElement && chartElement.chart) {
        chartElement.chart.destroy();
      }
    });
    
    // Render area chart for summary
    renderAreaChart(chartData);
    
    // Only render the active tab's chart
    if (activeTab === 0) {
      renderActivitiesChart(chartData);
    } else if (activeTab === 1) {
      renderDistanceChart(chartData);
    } else if (activeTab === 2) {
      renderElevationChart(chartData);
    } else if (activeTab === 3) {
      renderDurationChart(chartData);
    }
    
    return () => {
      // Clean up charts on unmount
      ['activities-chart', 'distance-chart', 'elevation-chart', 'duration-chart', 'area-chart'].forEach(id => {
        const chartElement = document.getElementById(id);
        if (chartElement && chartElement.chart) {
          chartElement.chart.destroy();
        }
      });
    };
  }, [stats, activeTab]);
  
  // Render area chart for summary
  const renderAreaChart = (chartData) => {
    const options = {
      chart: {
        id: 'area-chart',
        height: 200,
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
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
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
        borderColor: 'var(--border-color)',
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
            colors: 'var(--text-color)'
          }
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        show: false,
      },
    };

    const chartElement = document.getElementById("area-chart");
    if (chartElement) {
      const chart = new ApexCharts(chartElement, options);
      chartElement.chart = chart;
      chart.render();
    }
  };
  
  // Render activities chart
  const renderActivitiesChart = (chartData) => {
    const options = {
      series: [{
        name: 'Activities',
        data: chartData.map(item => item.activities)
      }],
      chart: {
        id: 'activities-chart',
        type: 'bar',
        height: 320,
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false },
        background: 'transparent',
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '60%',
          borderRadius: 8,
          distributed: true
        }
      },
      colors: Array(chartData.length).fill(themeColors.secondary),
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: chartData.map(item => item.year),
        labels: {
          style: {
            fontFamily: 'Inter, sans-serif',
            colors: 'var(--text-color)'
          }
        },
        axisBorder: { 
          show: true,
          color: 'var(--border-color)'
        },
        axisTicks: { 
          show: true,
          color: 'var(--border-color)'
        }
      },
      yaxis: {
        title: {
          text: 'Number of Activities',
          style: {
            fontFamily: 'Inter, sans-serif',
            color: 'var(--text-color)'
          }
        },
        labels: {
          style: {
            colors: 'var(--text-color)'
          },
          formatter: (val) => Math.round(val)
        }
      },
      grid: {
        borderColor: 'var(--border-color)',
        strokeDashArray: 4
      },
      tooltip: {
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
        y: {
          formatter: (value) => `${value} activities`
        }
      }
    };
    
    const chartElement = document.getElementById('activities-chart');
    if (chartElement) {
      const chart = new ApexCharts(chartElement, options);
      chartElement.chart = chart;
      chart.render();
    }
  };
  
  // Render distance chart
  const renderDistanceChart = (chartData) => {
    const options = {
      series: [{
        name: 'Distance',
        data: chartData.map(item => item.distance)
      }],
      chart: {
        id: 'distance-chart',
        type: 'bar',
        height: 320,
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false },
        background: 'transparent',
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '60%',
          borderRadius: 8,
          distributed: true
        }
      },
      colors: Array(chartData.length).fill(themeColors.accent),
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: chartData.map(item => item.year),
        labels: {
          style: {
            fontFamily: 'Inter, sans-serif',
            colors: 'var(--text-color)'
          }
        },
        axisBorder: { 
          show: true,
          color: 'var(--border-color)'
        },
        axisTicks: { 
          show: true,
          color: 'var(--border-color)'
        }
      },
      yaxis: {
        title: {
          text: 'Number of Activities',
          style: {
            fontFamily: 'Inter, sans-serif',
            color: 'var(--text-color)'
          }
        },
        labels: {
          style: {
            colors: 'var(--text-color)'
          },
          formatter: (val) => Math.round(val)
        }
      },
      grid: {
        borderColor: 'var(--border-color)',
        strokeDashArray: 4
      },
      tooltip: {
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
        y: {
          formatter: (value) => `${value} activities`
        }
      }
    };
    
    const chartElement = document.getElementById('distance-chart');
    if (chartElement) {
      const chart = new ApexCharts(chartElement, options);
      chartElement.chart = chart;
      chart.render();
    }
  };
  
  // Render elevation chart
  const renderElevationChart = (chartData) => {
    const options = {
      series: [{
        name: 'Elevation',
        data: chartData.map(item => item.elevation)
      }],
      chart: {
        id: 'elevation-chart',
        type: 'line',
        height: 320,
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false },
        background: 'transparent',
      },
      stroke: {
        curve: 'smooth',
        width: 4
      },
      colors: [themeColors.tertiary],
      markers: {
        size: 6,
        colors: [themeColors.tertiary],
        strokeColors: themeColors.primary,
        strokeWidth: 2
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: chartData.map(item => item.year),
        labels: {
          style: {
            fontFamily: 'Inter, sans-serif',
            colors: 'var(--text-color)'
          }
        },
        axisBorder: { 
          show: true,
          color: 'var(--border-color)'
        },
        axisTicks: { 
          show: true,
          color: 'var(--border-color)'
        }
      },
      yaxis: {
        title: {
          text: 'Elevation (thousands of feet)',
          style: {
            fontFamily: 'Inter, sans-serif',
            color: 'var(--text-color)'
          }
        },
        labels: {
          style: {
            colors: 'var(--text-color)'
          },
          formatter: (val) => val.toFixed(1)
        }
      },
      grid: {
        borderColor: 'var(--border-color)',
        strokeDashArray: 4
      },
      tooltip: {
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
        y: {
          formatter: (value) => `${value}k ft`
        }
      }
    };
    
    const chartElement = document.getElementById('elevation-chart');
    if (chartElement) {
      const chart = new ApexCharts(chartElement, options);
      chartElement.chart = chart;
      chart.render();
    }
  };
  
  // Render duration chart
  const renderDurationChart = (chartData) => {
    const options = {
      series: [{
        name: 'Duration',
        data: chartData.map(item => item.duration)
      }],
      chart: {
        id: 'duration-chart',
        type: 'area',
        height: 320,
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false },
        background: 'transparent',
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.3,
          stops: [0, 90, 100]
        }
      },
      colors: [themeColors.accent],
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      xaxis: {
        categories: chartData.map(item => item.year),
        labels: {
          style: {
            fontFamily: 'Inter, sans-serif',
            colors: 'var(--text-color)'
          }
        },
        axisBorder: { 
          show: true,
          color: 'var(--border-color)'
        },
        axisTicks: { 
          show: true,
          color: 'var(--border-color)'
        }
      },
      yaxis: {
        title: {
          text: 'Duration (hours)',
          style: {
            fontFamily: 'Inter, sans-serif',
            color: 'var(--text-color)'
          }
        },
        labels: {
          style: {
            colors: 'var(--text-color)'
          },
          formatter: (val) => Math.round(val)
        }
      },
      grid: {
        borderColor: 'var(--border-color)',
        strokeDashArray: 4
      },
      tooltip: {
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
        y: {
          formatter: (value) => `${value} hrs`
        }
      }
    };
    
    const chartElement = document.getElementById('duration-chart');
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
          <CalendarIcon className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
          Yearly Stats Charts
        </h3>
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No yearly stats available</p>
      </div>
    );
  }
  
  // Calculate total activities and year-over-year change
  const sortedStats = [...stats].sort((a, b) => b.year - a.year);
  const totalActivities = stats.reduce((total, year) => total + year.activity_count, 0);
  const yoyChange = sortedStats.length > 1 
    ? Math.round((sortedStats[0].activity_count / sortedStats[1].activity_count - 1) * 100) 
    : 0;
  
  return (
    <div className="stats-card p-2 sm:p-4">
      <h3 className="text-lg font-semibold flex items-center mb-4">
        <CalendarIcon className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
        Yearly Stats Charts
      </h3>
      
      {/* Summary Card */}
      <div className="w-full bg-white/70 dark:bg-gray-800/30 rounded-lg shadow-sm p-4 md:p-6 mb-6">
        <div className="flex justify-between">
          <div>
            <h5 className="leading-none text-3xl font-bold pb-2">
              {totalActivities}
            </h5>
            <p className="text-base font-normal opacity-80">Total Activities</p>
          </div>
          <div className={`flex items-center px-2.5 py-0.5 text-base font-semibold ${yoyChange >= 0 ? 'text-green-400' : 'text-red-400'} text-center`}>
            {yoyChange}%
            <svg className="w-3 h-3 ms-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 14">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={yoyChange >= 0 ? "M5 13V1m0 0L1 5m4-4 4 4" : "M5 1v12m0 0l4-4m-4 4l-4-4"}/>
            </svg>
          </div>
        </div>
        <div id="area-chart" className="mt-4 h-[200px]"></div>
        <div className="grid grid-cols-1 border-t border-gray-400 dark:border-gray-600 justify-between pt-5">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium opacity-80">
              Activity trend over years
            </span>
          </div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-400 dark:border-gray-600">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center" role="tablist">
          <li className="mr-2" role="presentation">
            <button 
              className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 0 ? 'text-secondary border-secondary' : 'border-transparent hover:text-gray-300 hover:border-gray-300'}`}
              onClick={() => setActiveTab(0)}
              type="button"
              role="tab"
              aria-selected={activeTab === 0}
            >
              Activities
            </button>
          </li>
          <li className="mr-2" role="presentation">
            <button 
              className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 1 ? 'text-accent border-accent' : 'border-transparent hover:text-gray-300 hover:border-gray-300'}`}
              onClick={() => setActiveTab(1)}
              type="button"
              role="tab"
              aria-selected={activeTab === 1}
            >
              Distance
            </button>
          </li>
          <li className="mr-2" role="presentation">
            <button 
              className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 2 ? 'text-tertiary border-tertiary' : 'border-transparent hover:text-gray-300 hover:border-gray-300'}`}
              onClick={() => setActiveTab(2)}
              type="button"
              role="tab"
              aria-selected={activeTab === 2}
            >
              Elevation
            </button>
          </li>
          <li role="presentation">
            <button 
              className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 3 ? 'text-accent border-accent' : 'border-transparent hover:text-gray-300 hover:border-gray-300'}`}
              onClick={() => setActiveTab(3)}
              type="button"
              role="tab"
              aria-selected={activeTab === 3}
            >
              Duration
            </button>
          </li>
        </ul>
      </div>
      
      <div className="mt-4">
        {/* Activities Tab */}
        <div className={`${activeTab === 0 ? 'block' : 'hidden'}`}>
          <div className="bg-white/70 dark:bg-gray-800/30 shadow-sm rounded-lg p-4">
            <h5 className="text-lg font-medium mb-2">Activities by Year</h5>
            <p className="text-sm opacity-80 mb-4">Number of activities recorded each year</p>
            <div id="activities-chart" className="mt-4"></div>
          </div>
        </div>
        
        {/* Distance Tab */}
        <div className={`${activeTab === 1 ? 'block' : 'hidden'}`}>
          <div className="bg-white/70 dark:bg-gray-800/30 shadow-sm rounded-lg p-4">
            <h5 className="text-lg font-medium mb-2">Distance by Year</h5>
            <p className="text-sm opacity-80 mb-4">Total distance covered each year (miles)</p>
            <div id="distance-chart" className="mt-4"></div>
          </div>
        </div>
        
        {/* Elevation Tab */}
        <div className={`${activeTab === 2 ? 'block' : 'hidden'}`}>
          <div className="bg-white/70 dark:bg-gray-800/30 shadow-sm rounded-lg p-4">
            <h5 className="text-lg font-medium mb-2">Elevation Gain</h5>
            <p className="text-sm opacity-80 mb-4">Total elevation gain each year (thousands of feet)</p>
            <div id="elevation-chart" className="mt-4"></div>
          </div>
        </div>
        
        {/* Duration Tab */}
        <div className={`${activeTab === 3 ? 'block' : 'hidden'}`}>
          <div className="bg-white/70 dark:bg-gray-800/30 shadow-sm rounded-lg p-4">
            <h5 className="text-lg font-medium mb-2">Duration</h5>
            <p className="text-sm opacity-80 mb-4">Total time spent on activities each year (hours)</p>
            <div id="duration-chart" className="mt-4"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
