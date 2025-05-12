import React, { useState, useEffect } from 'react';
import { Card, Title, Text, Metric, Grid, Col, Flex, Divider } from '@tremor/react';
import { MapIcon, GlobeAltIcon, CalendarIcon, UserGroupIcon, PhotoIcon, ChartBarIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';

// Helper function to get country flag emoji
function getCountryFlag(country) {
  const flagEmojis = {
    "Singapore": "🇸🇬",
    "Japan": "🇯🇵",
    "United Kingdom": "🇬🇧",
    "United States": "🇺🇸",
    "France": "🇫🇷",
    "Italy": "🇮🇹",
    "Spain": "🇪🇸",
    "Germany": "🇩🇪",
    "Australia": "🇦🇺",
    "Canada": "🇨🇦",
    "China": "🇨🇳",
    "India": "🇮🇳",
    "Brazil": "🇧🇷",
    "Mexico": "🇲🇽",
    "South Korea": "🇰🇷",
    // Add more as needed
  };
  
  return flagEmojis[country] || "🏳️";
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function TravelStatsReact({ 
  travelData: initialTravelData, 
  summary: initialSummary, 
  yearlyStats: initialYearlyStats, 
  countriesData: initialCountriesData, 
  citiesData: initialCitiesData 
}) {
  const [selectedTab, setSelectedTab] = useState(0);
  const [travelData, setTravelData] = useState(initialTravelData || []);
  const [summary, setSummary] = useState(initialSummary || {
    total_countries: 0,
    total_cities: 0,
    total_visits: 0,
    most_visited_city: '',
    most_visited_country: ''
  });
  const [yearlyStats, setYearlyStats] = useState(initialYearlyStats || []);
  const [countriesData, setCountriesData] = useState(initialCountriesData || []);
  const [citiesData, setCitiesData] = useState(initialCitiesData || []);
  
  // Listen for custom event to update data
  useEffect(() => {
    // Only run on client-side
    if (typeof window !== 'undefined') {
      // Get the parent container
      const container = document.getElementById('tremor-stats');
      
      if (container) {
        // Listen for the custom event
        const handleUpdateData = (event) => {
          if (event.detail) {
            const { travelData: newTravelData, summary: newSummary, yearlyStats: newYearlyStats, countriesData: newCountriesData, citiesData: newCitiesData } = event.detail;
            
            if (newTravelData) setTravelData(newTravelData);
            if (newSummary) setSummary(newSummary);
            if (newYearlyStats) setYearlyStats(newYearlyStats);
            if (newCountriesData) setCountriesData(newCountriesData);
            if (newCitiesData) setCitiesData(newCitiesData);
          }
        };
        
        container.addEventListener('update-travel-stats', handleUpdateData);
        
        return () => {
          container.removeEventListener('update-travel-stats', handleUpdateData);
        };
      }
    }
  }, []);
  
  // Render yearly stats chart
  const renderYearlyStats = () => {
    if (!yearlyStats || yearlyStats.length === 0) {
      return <Text>No yearly stats available</Text>;
    }
    
    const maxVisits = Math.max(...yearlyStats.map(stat => stat.visits_count));
    
    return (
      <div className="space-y-6">
        {yearlyStats.map((stat, index) => (
          <div key={index} className="mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-400 mr-3">
                  <span className="text-lg font-bold">{stat.year}</span>
                </div>
                <div>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">{stat.year}</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <span className="px-2.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full text-xs font-medium">
                  {stat.visits_count} visits
                </span>
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs font-medium">
                  {stat.countries_count} countries
                </span>
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 rounded-full text-xs font-medium">
                  {stat.cities_count} cities
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-600 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500" 
                   style={{ width: `${(stat.visits_count / maxVisits) * 100}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render countries distribution
  const renderCountriesChart = () => {
    if (!countriesData || countriesData.length === 0) {
      return <Text>No countries data available</Text>;
    }
    
    // Sort countries by value (most visits first)
    const sortedCountries = [...countriesData].sort((a, b) => b.value - a.value);
    const totalVisits = sortedCountries.reduce((sum, country) => sum + country.value, 0);
    
    return (
      <div className="space-y-4">
        {sortedCountries.map((country, index) => (
          <div key={index} className="mb-4 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-800 dark:text-blue-300 mr-3">
                  <span className="text-xl">{getCountryFlag(country.name)}</span>
                </div>
                <span className="text-base font-medium text-gray-900 dark:text-white">
                  {country.name}
                </span>
              </div>
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs font-medium">
                {country.value} visits ({Math.round(country.value / totalVisits * 100)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-600 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-500" 
                   style={{ width: `${(country.value / sortedCountries[0].value) * 100}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render cities distribution
  const renderCitiesChart = () => {
    if (!citiesData || citiesData.length === 0) {
      return <Text>No cities data available</Text>;
    }
    
    // Sort cities by value (most visits first)
    const sortedCities = [...citiesData].sort((a, b) => b.value - a.value).slice(0, 10); // Top 10 cities
    const maxVisits = sortedCities[0].value;
    
    return (
      <div className="space-y-4">
        {sortedCities.map((city, index) => (
          <div key={index} className="mb-4 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-800 dark:text-green-300 mr-3">
                  <span className="text-sm font-bold">{city.name.substring(0, 2).toUpperCase()}</span>
                </div>
                <span className="text-base font-medium text-gray-900 dark:text-white">
                  {city.name}
                </span>
              </div>
              <span className="px-2.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full text-xs font-medium">
                {city.value} visits
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-600 overflow-hidden">
              <div className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500" 
                   style={{ width: `${(city.value / maxVisits) * 100}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render locations and recent visits
  const renderLocationsPanel = () => {
    if (!travelData || travelData.length === 0) {
      return <Text>No location data available</Text>;
    }
    
    // Extract recent visits from all locations
    const allVisits = [];
    travelData.forEach(location => {
      location.visits.forEach(visit => {
        allVisits.push({
          ...visit,
          city: location.city,
          country: location.country,
          location_id: location.id
        });
      });
    });
    
    // Sort by date (newest first) and take the 5 most recent
    const recentVisits = allVisits
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
    
    return (
      <Grid numItemsMd={2} className="gap-6">
        <Card>
          <Title>All Locations</Title>
          <Text>Click on a location to view on map</Text>
          <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
            {travelData.map((location, index) => (
              <div 
                key={index} 
                className="mb-2 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer location-item" 
                data-location-id={location.id}
              >
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full mr-3 bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-800 dark:text-green-300 shadow-sm">
                      <span className="text-xl">{getCountryFlag(location.country)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{location.city}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{location.country}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full text-xs font-medium">
                      {location.visits.length} visits
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Last: {formatDate(location.visits[location.visits.length - 1].date)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        <Card>
          <Title>Recent Visits</Title>
          <Text>Latest travel activity</Text>
          <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
            {recentVisits.map((visit, index) => (
              <div 
                key={index} 
                className="mb-2 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer visit-item" 
                data-location-id={visit.location_id} 
                data-visit-id={visit.id}
              >
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full mr-3 bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-800 dark:text-green-300 shadow-sm">
                      <span className="text-xl">{getCountryFlag(visit.country)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{visit.city}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(visit.date)}</p>
                    </div>
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 rounded-full text-xs font-medium">
                      {visit.country}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Grid>
    );
  };
  
  return (
    <div className="mt-8">
      {/* Summary Stats */}
      <div className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stats-card flex items-center p-4 bg-opacity-20">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 mr-4">
              <GlobeAltIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{summary?.total_countries || 0}</h3>
              <p className="text-sm opacity-80">Countries</p>
            </div>
          </div>
          
          <div className="stats-card flex items-center p-4 bg-opacity-20">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 mr-4">
              <MapIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{summary?.total_cities || 0}</h3>
              <p className="text-sm opacity-80">Cities</p>
            </div>
          </div>
          
          <div className="stats-card flex items-center p-4 bg-opacity-20">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400 mr-4">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{summary?.total_visits || 0}</h3>
              <p className="text-sm opacity-80">Total Visits</p>
            </div>
          </div>
          
          <div className="stats-card flex items-center p-4 bg-opacity-20">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 mr-4">
              <UserGroupIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{summary?.most_visited_city || '-'}</h3>
              <p className="text-sm opacity-80">Most Visited</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Yearly Stats */}
        <div className="stats-card p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <CalendarIcon className="h-6 w-6 mr-2 text-secondary-color" />
            Travel by Year
          </h3>
          <div className="mt-4">
            {renderYearlyStats()}
          </div>
        </div>
        
        {/* Countries Distribution */}
        <div className="stats-card p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <GlobeAltIcon className="h-6 w-6 mr-2 text-secondary-color" />
            Countries Distribution
          </h3>
          <div className="mt-4">
            {renderCountriesChart()}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Cities Distribution */}
        <div className="stats-card p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <MapPinIcon className="h-6 w-6 mr-2 text-secondary-color" />
            Top Cities
          </h3>
          <div className="mt-4">
            {renderCitiesChart()}
          </div>
        </div>
        
        {/* Recent Visits */}
        <div className="stats-card p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <ClockIcon className="h-6 w-6 mr-2 text-secondary-color" />
            Recent Activity
          </h3>
          <div className="mt-4">
            {renderLocationsPanel()}
          </div>
        </div>
      </div>
    </div>
  );
}
