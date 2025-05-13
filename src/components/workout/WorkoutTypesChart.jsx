import React, { useState, useEffect } from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { BarChart, DonutChart, Card, Title, Text, Legend } from '@tremor/react';
import { chartColors } from '../../utils/chartUtils';

export default function WorkoutTypesChart({ activityTypes = [] }) {
  const [types, setTypes] = useState(activityTypes);
  
  // Listen for data updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleDataReady = (event) => {
        if (event.detail?.topActivityTypes) {
          setTypes(event.detail.topActivityTypes);
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
  
  if (!types || types.length === 0) {
    return (
      <div className="stats-card p-2 sm:p-4">
        <h3 className="text-lg font-semibold flex items-center mb-2">
          <ChartBarIcon className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
          Activity Types
        </h3>
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No activity type data available</p>
      </div>
    );
  }
  
  // Process data for charts
  const donutChartData = types.map(type => ({
    name: type.name,
    value: type.count
  }));
  
  const barChartData = types.map(type => ({
    name: type.name,
    Activities: type.count,
    Distance: formatDistance(type.total_distance)
  }));
  
  // Get colors for the donut chart
  const donutColors = types.map((_, index) => {
    const colorKeys = Object.keys(chartColors);
    return chartColors[colorKeys[index % colorKeys.length]];
  });
  
  return (
    <div className="stats-card p-2 sm:p-4">
      <h3 className="text-lg font-semibold flex items-center mb-4">
        <ChartBarIcon className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
        Activity Types
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <Title>Activity Distribution</Title>
          <Text>Breakdown of activity types</Text>
          <DonutChart
            className="mt-6"
            data={donutChartData}
            category="value"
            index="name"
            colors={donutColors}
            valueFormatter={(value) => `${value} activities`}
            label="Total Activities"
          />
          <Legend className="mt-3" />
        </Card>
        
        <Card>
          <Title>Activities & Distance</Title>
          <Text>Count and distance by activity type</Text>
          <BarChart
            className="mt-6 h-72"
            data={barChartData}
            index="name"
            categories={["Activities", "Distance"]}
            colors={["orange", "blue"]}
            valueFormatter={(value) => `${value}`}
            stack={false}
            yAxisWidth={48}
          />
        </Card>
      </div>
    </div>
  );
}
