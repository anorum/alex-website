import React, { useState, useEffect } from 'react';
import { MapContainer, GeoJSON, CircleMarker, Popup } from 'react-leaflet';
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
  },
  dark: {
    visitedFill: '#1fc784',
    visitedStroke: '#1fc784',
    otherFill: '#22332c',
    otherStroke: '#3a4f45',
  },
};

const VISITED_OPACITY = 0.75;
const OTHER_OPACITY = 0.35;

// No basemap tiles: the vendored country polygons draw the whole world and
// the ocean is a themed background color (see the leaflet-container rules),
// so the map has no third-party runtime dependency.
// RPG mode always uses the light palette so the FF7 pixelated filter
// in rpg-theme.css keeps its intended look regardless of dark mode.
function resolveMode() {
  const html = document.documentElement;
  if (html.classList.contains('theme-rpg')) return 'light';
  return html.classList.contains('dark') ? 'dark' : 'light';
}

function popupHtml(loc) {
  return `
    <div class="text-center p-2">
      <div class="text-2xl mb-1">${loc.flag}</div>
      <div class="font-semibold text-sm">${loc.country}</div>
      ${loc.visits > 1 ? `<div class="text-xs mt-1" style="opacity: 0.7">${loc.visits} visits</div>` : ''}
    </div>
  `;
}

/** @param {{ travelData?: import('../../data/travel').TravelLocation[] }} props */
export default function IndexTravelMap({ travelData = [] }) {
  const [geoData, setGeoData] = useState(null);
  const [mode, setMode] = useState(resolveMode);

  // Country outlines are vendored (Natural Earth 110m) so the map never
  // depends on a third-party host at runtime.
  useEffect(() => {
    fetch('/data/countries.geojson')
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error('Failed to load countries GeoJSON:', err));
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

  const byCode = {};
  for (const loc of travelData) {
    const code = countryNameToCode[loc.country];
    if (code) byCode[code] = loc;
  }

  const getCountryCode = (properties) =>
    properties.ISO_A3 || properties.ADM0_A3 || properties.iso_a3 || properties.SOV_A3;

  const getStyle = (feature) => {
    const isVisited = !!byCode[getCountryCode(feature.properties)];
    return {
      fillColor: isVisited ? palette.visitedFill : palette.otherFill,
      weight: 0.5,
      opacity: 1,
      color: isVisited ? palette.visitedStroke : palette.otherStroke,
      fillOpacity: isVisited ? VISITED_OPACITY : OTHER_OPACITY,
    };
  };

  const onEachFeature = (feature, layer) => {
    const loc = byCode[getCountryCode(feature.properties)];
    if (!loc) return;
    layer.bindPopup(popupHtml(loc));
    layer.on({
      mouseover: (e) => e.target.setStyle({ fillOpacity: 0.9, weight: 2 }),
      mouseout: (e) => e.target.setStyle({ fillOpacity: VISITED_OPACITY, weight: 0.5 }),
    });
  };

  // City-states like Singapore and Hong Kong are too small for the 110m
  // polygons, so they get a marker at their coordinates instead.
  const markers = travelData.filter((loc) => Array.isArray(loc.coords));

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
      {geoData && (
        <GeoJSON key={`geo-${mode}`} data={geoData} style={getStyle} onEachFeature={onEachFeature} />
      )}
      {markers.map((loc) => (
        <CircleMarker
          key={`${loc.country}-${mode}`}
          center={loc.coords}
          radius={5}
          pathOptions={{
            color: palette.visitedStroke,
            fillColor: palette.visitedFill,
            fillOpacity: 0.95,
            weight: 1.5,
          }}
        >
          <Popup>
            <div dangerouslySetInnerHTML={{ __html: popupHtml(loc) }} />
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
