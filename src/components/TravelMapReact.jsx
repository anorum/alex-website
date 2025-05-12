import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

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

// Image Carousel component for popups
const ImageCarousel = ({ images, locationName }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (!images || images.length === 0) return null;
  
  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };
  
  const prevImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };
  
  return (
    <div className="relative w-full h-48 mt-2 mb-2">
      <img 
        src={images[currentIndex]} 
        alt={`Visit to ${locationName} - Image ${currentIndex + 1}`}
        className="w-full h-full object-cover rounded-md"
      />
      {images.length > 1 && (
        <>
          <button 
            onClick={prevImage}
            className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center"
            aria-label="Previous image"
          >
            ←
          </button>
          <button 
            onClick={nextImage}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center"
            aria-label="Next image"
          >
            →
          </button>
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {images.map((_, index) => (
              <span 
                key={index} 
                className={`w-2 h-2 rounded-full ${index === currentIndex ? 'bg-white' : 'bg-gray-400'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Custom marker icon with country flag
const createFlagIcon = (country) => {
  return L.divIcon({
    html: `<div style="font-size: 24px; background-color: rgba(255, 255, 255, 0.7); border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">${getCountryFlag(country)}</div>`,
    className: 'flag-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

export default function TravelMapReact({ travelData: initialData }) {
  const mapRef = useRef(null);
  const [travelData, setTravelData] = useState(initialData || []);
  
  // Center the map on a location when clicked from outside
  const centerMapOnLocation = (locationId, coordinates) => {
    if (mapRef.current && coordinates) {
      mapRef.current.setView(coordinates, 10);
      
      // Find and open the popup for this location
      const markers = document.querySelectorAll('.leaflet-marker-icon');
      markers.forEach(marker => {
        if (marker.getAttribute('data-location-id') === locationId) {
          marker.click();
        }
      });
    }
  };
  
  // Listen for custom event to update data
  useEffect(() => {
    // Only run on client-side
    if (typeof window !== 'undefined') {
      // Get the parent container
      const container = document.getElementById('travel-map-container');
      
      if (container) {
        // Listen for the custom event
        const handleUpdateData = (event) => {
          if (event.detail && event.detail.travelData) {
            setTravelData(event.detail.travelData);
          }
        };
        
        container.addEventListener('update-travel-data', handleUpdateData);
        
        return () => {
          container.removeEventListener('update-travel-data', handleUpdateData);
        };
      }
    }
  }, []);
  
  if (!travelData || travelData.length === 0) {
    return (
      <div className="h-[500px] w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No travel data available</p>
      </div>
    );
  }
  
  // Find the center point for the map (average of all coordinates)
  const allCoordinates = travelData.map(location => location.coordinates);
  const center = allCoordinates.length > 0 
    ? [
        allCoordinates.reduce((sum, coord) => sum + coord[0], 0) / allCoordinates.length,
        allCoordinates.reduce((sum, coord) => sum + coord[1], 0) / allCoordinates.length
      ]
    : [20, 0]; // Default center if no data
  
  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <MapContainer 
        center={center} 
        zoom={2} 
        style={{ height: '500px', width: '100%' }}
        ref={mapRef}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {travelData.map((location) => (
        <Marker 
          key={location.id}
          position={location.coordinates}
          icon={createFlagIcon(location.country)}
          eventHandlers={{
            click: () => {
              if (mapRef.current) {
                mapRef.current.setView(location.coordinates, 10);
              }
            }
          }}
        >
          <Popup maxWidth={300} minWidth={250}>
            <div className="popup-content">
              <div className="flex items-center mb-2">
                <span className="text-xl mr-2">{getCountryFlag(location.country)}</span>
                <h3 className="text-lg font-semibold">{location.city}, {location.country}</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{location.visits.length} visits</p>
              
              <div className="border-t border-gray-200 my-2"></div>
              
              {location.visits.map((visit, index) => (
                <div key={visit.id || index} className="mb-3 last:mb-0">
                  <p className="font-medium">{formatDate(visit.date)}</p>
                  
                  {visit.notes && (
                    <p className="text-sm text-gray-600 mt-1 mb-2">{visit.notes}</p>
                  )}
                  
                  {visit.imageUrls && visit.imageUrls.length > 0 && (
                    <ImageCarousel images={visit.imageUrls} locationName={location.city} />
                  )}
                  
                  {index < location.visits.length - 1 && (
                    <div className="border-t border-gray-200 my-2"></div>
                  )}
                </div>
              ))}
            </div>
          </Popup>
        </Marker>
      ))}
      </MapContainer>
    </div>
  );
}
