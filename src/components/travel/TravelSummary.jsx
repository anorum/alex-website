import React, { useState, useEffect } from 'react';
import { GlobeAltIcon, MapIcon, CalendarIcon } from '@heroicons/react/24/outline';
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

export default function TravelSummary({ summary = {} }) {
  const [stats, setStats] = useState(summary);
  const [yearData, setYearData] = useState([]);
  
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
      }
    });
    
    // Render all charts
    renderCountriesChart(chartData);
    renderCitiesChart(chartData);
    renderVisitsChart(chartData);
    
    return () => {
      // Clean up charts on unmount
      ['countries-chart', 'cities-chart', 'visits-chart'].forEach(id => {
        const chartElement = document.getElementById(id);
        if (chartElement && chartElement.chart) {
          chartElement.chart.destroy();
        }
      });
    };
  }, [yearData]);
  
  // Render countries chart
  const renderCountriesChart = (chartData) => {
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
        theme: 'dark',
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
          name: "Countries",
          data: chartData.map(item => item.countries),
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

    const chartElement = document.getElementById("countries-chart");
    if (chartElement) {
      const chart = new ApexCharts(chartElement, options);
      chartElement.chart = chart;
      chart.render();
    }
  };
  
  // Render cities chart
  const renderCitiesChart = (chartData) => {
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
        theme: 'dark',
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
          name: "Cities",
          data: chartData.map(item => item.cities),
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

    const chartElement = document.getElementById("cities-chart");
    if (chartElement) {
      const chart = new ApexCharts(chartElement, options);
      chartElement.chart = chart;
      chart.render();
    }
  };
  
  // Render visits chart
  const renderVisitsChart = (chartData) => {
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
        theme: 'dark',
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
          name: "Visits",
          data: chartData.map(item => item.visits),
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statItems.map((item, index) => (
        <div key={index} className="stats-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.textColor} mr-3`}>
                {item.icon}
              </div>
              <div>
                <p className="text-xl font-semibold">{item.value}</p>
                <p className="text-sm opacity-80">{item.label}</p>
              </div>
            </div>
          </div>
          <div id={item.chartId} className="h-[120px] mt-2"></div>
        </div>
      ))}
    </div>
  );
}
