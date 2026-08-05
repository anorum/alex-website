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

const palettes = {
  light: {
    visitedFill: '#0d8a5f',
    visitedStroke: '#0a6e4c',
    otherFill: '#dcd7ca',
    otherStroke: '#b3ac99',
    tiles: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
  },
  dark: {
    visitedFill: '#1fc784',
    visitedStroke: '#1fc784',
    otherFill: '#22332c',
    otherStroke: '#3a4f45',
    tiles: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
  },
};

// RPG mode always uses the light palette so the FF7 pixelated filter
// in rpg-theme.css keeps its intended look regardless of dark mode.
function resolveMode() {
  const html = document.documentElement;
  if (html.classList.contains('theme-rpg')) return 'light';
  return html.classList.contains('dark') ? 'dark' : 'light';
}

export default function IndexTravelMap({ travelData = [] }) {
  const [geoData, setGeoData] = useState(null);
  const [mode, setMode] = useState(resolveMode);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error('Failed to load countries GeoJSON:', err));
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => setMode(resolveMode()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  if (!travelData || travelData.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center" style={{ minHeight: '300px' }}>
        <p style={{ color: 'var(--text-tertiary)' }}>No travel data available</p>
      </div>
    );
  }

  const palette = palettes[mode];

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
      fillColor: isVisited ? palette.visitedFill : palette.otherFill,
      weight: 0.5,
      opacity: 1,
      color: isVisited ? palette.visitedStroke : palette.otherStroke,
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
          ${stats.visits > 1 ? `<div class="text-xs mt-1" style="opacity: 0.7">${stats.visits} visits</div>` : ''}
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
    <MapContainer
      center={[25, 0]}
      zoom={2}
      minZoom={2}
      maxZoom={6}
      style={{ width: '100%', height: '460px' }}
      className="z-0"
      scrollWheelZoom={true}
      attributionControl={false}
      maxBounds={[[-85, -180], [85, 180]]}
      maxBoundsViscosity={1.0}
      worldCopyJump={false}
      zoomControl={typeof window !== 'undefined' && window.innerWidth >= 640}
    >
      <TileLayer key={mode} url={palette.tiles} noWrap={true} />
      {geoData && (
        <GeoJSON
          key={`geo-${mode}`}
          data={geoData}
          style={getStyle}
          onEachFeature={onEachFeature}
        />
      )}
    </MapContainer>
  );
}
