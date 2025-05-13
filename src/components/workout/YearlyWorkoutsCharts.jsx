import React, { useState, useEffect } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { BarChart, Card, Title, Text, Tab, TabGroup, TabList, TabPanel, TabPanels } from '@tremor/react';
import { chartColors } from '../../utils/chartUtils';

export default function YearlyWorkoutsCharts({ yearlyStats = [] }) {
  const [stats, setStats] = useState(yearlyStats);
  
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
  
  // Format distance from km to miles with 1 decimal place
  const formatDistance = (distanceKm) => {
    const miles = distanceKm * 0.621371;
    return Math.round(miles * 10) / 10;
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
  
  // Format data for the chart and sort by year in descending order
  const chartData = [...stats]
    .sort((a, b) => b.year - a.year) // Sort in descending order (newest first)
    .map(year => ({
      year: year.year.toString(),
      Activities: year.activity_count,
      Distance: formatDistance(year.total_distance),
      Elevation: Math.round(year.total_elevation_gain / 100) / 10, // Convert to thousands of feet
      Duration: Math.round(year.total_duration / 60) // Convert to hours
    }));
  
  return (
    <div className="stats-card p-2 sm:p-4">
      <h3 className="text-lg font-semibold flex items-center mb-4">
        <CalendarIcon className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
        Yearly Stats Charts
      </h3>
      
      <TabGroup>
        <TabList className="mb-4">
          <Tab>Activities</Tab>
          <Tab>Combined</Tab>
          <Tab>Distance</Tab>
          <Tab>Elevation</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <Card>
              <Title>Activities by Year</Title>
              <Text>Number of activities recorded each year</Text>
              <BarChart
                className="mt-4 h-72"
                data={chartData}
                index="year"
                categories={["Activities"]}
                colors={["orange"]}
                valueFormatter={(value) => `${value} activities`}
                yAxisWidth={48}
              />
            </Card>
          </TabPanel>
          
          <TabPanel>
            <Card>
              <Title>Yearly Workout Stats</Title>
              <Text>Combined view of distance, elevation and duration</Text>
              <BarChart
                className="mt-4 h-72"
                data={chartData}
                index="year"
                categories={["Distance", "Elevation", "Duration"]}
                colors={["blue", "green", "purple"]}
                stack={false}
                valueFormatter={(value) => `${value}`}
                yAxisWidth={48}
              />
            </Card>
          </TabPanel>
          
          <TabPanel>
            <Card>
              <Title>Distance by Year</Title>
              <Text>Total distance covered each year (miles)</Text>
              <BarChart
                className="mt-4 h-72"
                data={chartData}
                index="year"
                categories={["Distance"]}
                colors={["blue"]}
                valueFormatter={(value) => `${value} mi`}
                yAxisWidth={48}
              />
            </Card>
          </TabPanel>
          
          <TabPanel>
            <Card>
              <Title>Elevation Gain</Title>
              <Text>Total elevation gain each year (thousands of feet)</Text>
              <BarChart
                className="mt-4 h-72"
                data={chartData}
                index="year"
                categories={["Elevation"]}
                colors={["green"]}
                valueFormatter={(value) => `${value}k ft`}
                yAxisWidth={48}
              />
            </Card>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
} 
