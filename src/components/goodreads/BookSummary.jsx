import React, { useState, useEffect } from 'react';
import { BookOpenIcon, ClockIcon, StarIcon, BookmarkIcon } from '@heroicons/react/24/outline';
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

export default function BookSummary({ summary = {} }) {
  const [stats, setStats] = useState(summary);
  const [booksYearData, setBooksYearData] = useState({});
  const [pagesYearData, setPagesYearData] = useState({});
  
  // Listen for data updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleDataReady = (event) => {
        if (event.detail?.summary) {
          setStats(event.detail.summary);
        }
        if (event.detail?.booksPerYear) {
          setBooksYearData(event.detail.booksPerYear);
        }
        if (event.detail?.summary?.pages_per_year) {
          setPagesYearData(event.detail.summary.pages_per_year);
        }
      };
      
      document.addEventListener('books-data-ready', handleDataReady);
      return () => document.removeEventListener('books-data-ready', handleDataReady);
    }
  }, []);
  
  const defaultStats = {
    total_books_read: 0,
    total_books_reading: 0,
    total_books_to_read: 0,
    total_pages_read: 0,
    average_rating: 0
  };
  
  const data = { ...defaultStats, ...stats };
  
  // Initialize charts when data changes
  useEffect(() => {
    // Clean up any existing charts
    ['books-per-year-chart', 'pages-per-year-chart'].forEach(id => {
      const chartElement = document.getElementById(id);
      if (chartElement && chartElement.chart) {
        chartElement.chart.destroy();
      }
    });
    
    // Render books per year chart if data is available
    if (booksYearData && Object.keys(booksYearData).length > 0) {
      // Process data for books chart
      const booksChartData = Object.entries(booksYearData)
        .map(([year, count]) => ({
          year: year,
          value: count
        }))
        .sort((a, b) => a.year - b.year); // Sort by year ascending
      
      renderYearlyChart(booksChartData, "books-per-year-chart", "Books Read");
    }
    
    // Render pages per year chart if data is available
    if (pagesYearData && Object.keys(pagesYearData).length > 0) {
      // Process data for pages chart
      const pagesChartData = Object.entries(pagesYearData)
        .map(([year, count]) => ({
          year: year,
          value: count
        }))
        .sort((a, b) => a.year - b.year); // Sort by year ascending
      
      renderYearlyChart(pagesChartData, "pages-per-year-chart", "Pages Read");
    }
    
    return () => {
      // Clean up charts on unmount
      ['books-per-year-chart', 'pages-per-year-chart'].forEach(id => {
        const chartElement = document.getElementById(id);
        if (chartElement && chartElement.chart) {
          chartElement.chart.destroy();
        }
      });
    };
  }, [booksYearData, pagesYearData]);
  
  // Render yearly chart (books or pages)
  const renderYearlyChart = (chartData, chartId, seriesName) => {
    const options = {
      series: [{
        name: seriesName,
        data: chartData.map(item => item.value)
      }],
      chart: {
        id: chartId,
        type: 'area',
        height: 120,
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false },
        background: 'transparent',
        dropShadow: {
          enabled: false,
        },
      },
      tooltip: {
        enabled: true,
        theme: 'dark',
        x: {
          show: true,
        },
        y: {
          formatter: (value) => seriesName === 'Books Read' ? 
            `${value} books` : 
            `${value.toLocaleString()} pages`
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
        colors: [seriesName === 'Books Read' ? themeColors.secondary : '#4299e1'] // Yellow for books, blue for pages
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
      xaxis: {
        categories: chartData.map(item => item.year),
        labels: {
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
    
    const chartElement = document.getElementById(chartId);
    if (chartElement) {
      const chart = new ApexCharts(chartElement, options);
      chartElement.chart = chart;
      chart.render();
    }
  };
  
  // Format average rating to one decimal place
  const formatRating = (rating) => {
    return Math.round(rating * 10) / 10;
  };
  
  // Define stat items with their corresponding charts
  const statItems = [
    {
      icon: <BookOpenIcon className="h-5 w-5" />,
      value: data.total_books_read,
      label: "Books Read",
      chartId: "books-per-year-chart",
      textColor: "text-yellow-600 dark:text-yellow-400"
    },
    {
      icon: <BookmarkIcon className="h-5 w-5" />,
      value: data.total_pages_read.toLocaleString(),
      label: "Pages Read",
      chartId: "pages-per-year-chart",
      textColor: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: <StarIcon className="h-5 w-5" />,
      value: formatRating(data.average_rating),
      label: "Average Rating",
      chartId: null,
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
          {item.chartId && <div id={item.chartId} className="h-[120px] mt-2"></div>}
          {!item.chartId && (
            <div className="h-[120px] mt-2 flex items-center justify-center">
              {item.label === "Average Rating" && (
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => {
                    // Calculate how filled this star should be (0 to 1)
                    const rating = data.average_rating;
                    let fillPercentage = 0;
                    
                    if (star <= Math.floor(rating)) {
                      // Full star
                      fillPercentage = 1;
                    } else if (star === Math.ceil(rating)) {
                      // Partial star
                      fillPercentage = rating % 1;
                    }
                    
                    return (
                      <div key={star} className="relative h-8 w-8">
                        {/* Empty star (background) */}
                        <StarIcon className="absolute h-8 w-8 text-gray-300" />
                        
                        {/* Filled portion of star */}
                        {fillPercentage > 0 && (
                          <div className="absolute h-8 overflow-hidden" style={{ width: `${fillPercentage * 100}%` }}>
                            <StarIcon className="h-8 w-8 text-yellow-400 fill-yellow-400" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {/* No text needed for Pages Read */}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
