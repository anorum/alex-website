import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const countryNameToCode = {
  'Australia': 'AUS',
  'Canada': 'CAN',
  'United States': 'USA',
  'China': 'CHN',
  'Hong Kong': 'HKG',
  'Indonesia': 'IDN',
  'Japan': 'JPN',
  'Mexico': 'MEX',
  'United Kingdom': 'GBR',
  'Singapore': 'SGP',
  'Malaysia': 'MYS',
  'Thailand': 'THA',
  'Vietnam': 'VNM',
};

export default function IndexTravelMap({ travelData = [] }) {
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error('Failed to load countries GeoJSON:', err));
  }, []);

  if (!travelData || travelData.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center rounded-lg" style={{ minHeight: '300px', backgroundColor: 'var(--bubble-bg)' }}>
        <p style={{ color: 'var(--text-tertiary)' }}>No travel data available</p>
      </div>
    );
  }

  const visitedCountries = new Set(
    travelData.map(loc => countryNameToCode[loc.country]).filter(Boolean)
  );

  const countryStats = travelData.reduce((acc, loc) => {
    const code = countryNameToCode[loc.country];
    if (code) {
      if (!acc[code]) acc[code] = { name: loc.country, flag: loc.flag, visits: 0 };
      acc[code].visits += loc.visits || 1;
    }
    return acc;
  }, {});

  const getCountryCode = (properties) => {
    return properties.ISO_A3 || properties.ADM0_A3 || properties.iso_a3 || properties.SOV_A3;
  };

  const getStyle = (feature) => {
    const countryCode = getCountryCode(feature.properties);
    const isVisited = visitedCountries.has(countryCode);

    return {
      fillColor: isVisited ? '#22c55e' : '#e5e7eb',
      weight: 0.5,
      opacity: 1,
      color: isVisited ? '#16a34a' : '#9ca3af',
      fillOpacity: isVisited ? 0.75 : 0.35,
    };
  };

  const onEachFeature = (feature, layer) => {
    const countryCode = getCountryCode(feature.properties);
    const stats = countryStats[countryCode];

    if (stats) {
      layer.bindPopup(`
        <div class="text-center p-2">
          <div class="text-2xl mb-1">${stats.flag}</div>
          <div class="font-semibold text-sm">${stats.name}</div>
          ${stats.visits > 1 ? `<div class="text-xs mt-1" style="color: #6b7280">${stats.visits} visits</div>` : ''}
        </div>
      `);

      layer.on({
        mouseover: (e) => {
          e.target.setStyle({ fillOpacity: 0.9, weight: 2 });
        },
        mouseout: (e) => {
          e.target.setStyle({ fillOpacity: 0.7, weight: 0.5 });
        },
      });
    }
  };

  return (
    <div className="overflow-hidden" style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
      <MapContainer
        center={[25, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={6}
        style={{ width: '100%', height: '500px' }}
        className="z-0"
        scrollWheelZoom={true}
        attributionControl={false}
        maxBounds={[[-85, -180], [85, 180]]}
        maxBoundsViscosity={1.0}
        worldCopyJump={false}
        zoomControl={typeof window !== 'undefined' && window.innerWidth >= 640}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          noWrap={true}
        />
        {geoData && (
          <GeoJSON
            data={geoData}
            style={getStyle}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
    </div>
  );
}
