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

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

// Custom marker icon with country flag
const createFlagIcon = (flag) => {
  return L.divIcon({
    html: `<div style="font-size: 24px; background-color: rgba(255, 255, 255, 0.7); border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">${flag}</div>`,
    className: 'flag-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -30]  // Move popup higher above the marker
  });
};

// Image Carousel component for popups
const ImageCarousel = ({ images, locationName, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  if (!images || images.length === 0) return null;
  
  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };
  
  const prevImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[var(--bg-color)]/95 flex items-center justify-center p-4" onClick={toggleFullscreen}>
        <div className="relative max-w-4xl max-h-full backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
          <img 
            src={images[currentIndex]} 
            alt={`Visit to ${locationName} - Image ${currentIndex + 1}`}
            className="max-w-full max-h-[80vh] object-contain rounded-md"
          />
          <button 
            onClick={toggleFullscreen}
            className="absolute top-2 right-2 bg-[var(--accent-color)] text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-[var(--accent-color)]/80 transition-colors"
            aria-label="Close fullscreen"
          >
            ×
          </button>
          {images.length > 1 && (
            <>
              <button 
                onClick={prevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-[var(--accent-color)] text-white rounded-full w-10 h-10 flex items-center justify-center text-xl hover:bg-[var(--accent-color)]/80 transition-colors"
                aria-label="Previous image"
              >
                ←
              </button>
              <button 
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[var(--accent-color)] text-white rounded-full w-10 h-10 flex items-center justify-center text-xl hover:bg-[var(--accent-color)]/80 transition-colors"
                aria-label="Next image"
              >
                →
              </button>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {images.map((_, index) => (
                  <span 
                    key={index} 
                    className={`w-3 h-3 rounded-full ${index === currentIndex ? 'bg-white' : 'bg-gray-400'}`}
                  />
                ))}
              </div>
              <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-white text-sm">
                {currentIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="mt-3 mb-3">
      <div className="relative w-full h-48 rounded-lg overflow-hidden shadow-md">
        <img 
          src={images[currentIndex]} 
          alt={`Visit to ${locationName} - Image ${currentIndex + 1}`}
          className="w-full h-full object-cover cursor-pointer"
          onClick={toggleFullscreen}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-20"></div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFullscreen();
          }}
          className="absolute top-2 right-2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm transition-all"
          aria-label="View fullscreen"
        >
          ⤢
        </button>
        
        {images.length > 1 && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all"
              aria-label="Previous image"
            >
              ←
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all"
              aria-label="Next image"
            >
              →
            </button>
            
            <div className="absolute bottom-2 left-0 right-0 flex justify-center items-center">
              <div className="bg-black bg-opacity-60 px-3 py-1 rounded-full flex items-center space-x-2">
                <span className="text-white text-xs">{currentIndex + 1}/{images.length}</span>
                <div className="flex space-x-1">
                  {images.map((_, index) => (
                    <span 
                      key={index} 
                      className={`w-2 h-2 rounded-full ${index === currentIndex ? 'bg-white' : 'bg-gray-400'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default function IndexTravelMap() {
  const mapRef = useRef(null);
  const [travelData, setTravelData] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load travel data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const apiUrl = '/api/alexapi/api/v1/travel/data';
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Process locations for the map - add /api/alexapi to image URLs
        const locations = data.locations || [];
        const travelLocations = locations.map(location => {
          const processedVisits = location.visits.map(visit => {
            const processedImageUrls = visit.image_urls?.map(url => `/api/alexapi${url}`);
            
            return {
              id: visit.id,
              date: visit.date,
              notes: visit.notes,
              imageUrls: processedImageUrls
            };
          });
          
          return {
            id: location.id,
            city: location.city,
            country: location.country,
            flag: location.flag,
            coordinates: location.coordinates,
            visits: processedVisits
          };
        });
        
        setTravelData(travelLocations);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading travel data:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Function to determine if we're on mobile
  const isMobile = () => {
    return typeof window !== 'undefined' && window.innerWidth < 640;
  };
  
  // Open location detail view
  const openLocationDetail = (location) => {
    setSelectedLocation(location);
  };
  
  // Close location detail view
  const closeLocationDetail = () => {
    setSelectedLocation(null);
  };
  
  if (isLoading) {
    return (
      <div className="h-64 w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-color"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="h-64 w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-red-500 dark:text-red-400">Error loading travel data: {error}</p>
      </div>
    );
  }
  
  if (!travelData || travelData.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
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
    <div className="rounded-lg overflow-hidden border border-border-color shadow-md relative">
      {/* Location detail overlay */}
      {selectedLocation && (
        <div className="absolute inset-0 bg-[var(--bg-color)] z-20 overflow-y-auto">
          <div className="sticky top-0 z-30 bg-[var(--bg-color)] shadow-md p-2 sm:p-3 md:p-4 backdrop-blur-md border-b border-[var(--border-color)]">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              <div className="flex items-center">
                <span className="text-xl sm:text-2xl md:text-3xl mr-1.5 sm:mr-2 md:mr-3">{selectedLocation.flag}</span>
                <h2 className="text-base sm:text-lg md:text-2xl font-bold truncate">{selectedLocation.city}, {selectedLocation.country}</h2>
              </div>
              <button 
                onClick={closeLocationDetail}
                className="p-1.5 sm:p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                aria-label="Close detail view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="p-2 sm:p-3 md:p-4 max-w-3xl mx-auto animate-fade-in">
            <p className="text-sm sm:text-base md:text-lg mb-2 sm:mb-3 md:mb-4">{selectedLocation.visits.length} visits to this location</p>
            
            {selectedLocation.visits.map((visit, index) => (
              <div
                key={visit.id || index}
                className="mb-6 sm:mb-8 md:mb-10 bg-[var(--bubble-bg)] border border-[var(--border-color)] rounded-lg shadow-md backdrop-blur-md transition-transform hover:translate-y-[-4px]"
              >
                <div className="p-4 sm:p-5 md:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-[var(--text-tertiary)] font-medium">
                      {formatDate(visit.date)}
                    </div>
                    <div className="text-xl">{selectedLocation.flag}</div>
                  </div>

                  {visit.notes && (
                    <p className="text-base text-[var(--text-secondary)] mb-4 whitespace-pre-wrap">
                      {visit.notes}
                    </p>
                  )}

                  {visit.imageUrls && visit.imageUrls.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--text-tertiary)] mb-2">Photos</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {visit.imageUrls.map((url, imgIndex) => (
                          <div key={imgIndex} className="relative aspect-video rounded-md overflow-hidden shadow-sm">
                            <img
                              src={url}
                              alt={`Visit to ${selectedLocation.city} - Image ${imgIndex + 1}`}
                              className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-105"
                              onClick={() => {
                                const carousel = <ImageCarousel 
                                  images={visit.imageUrls} 
                                  locationName={selectedLocation.city} 
                                  initialIndex={imgIndex} 
                                />;
                                // Render the carousel
                                const root = document.createElement('div');
                                root.id = 'image-carousel-root';
                                document.body.appendChild(root);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <MapContainer 
        center={center} 
        zoom={1} 
        style={{ width: '100%' }}
        ref={mapRef}
        className="z-0 h-64"
        scrollWheelZoom={true}
        attributionControl={false}
        maxBounds={[[-90, -180], [90, 180]]}
        maxBoundsViscosity={1.0}
        worldCopyJump={false}
        zoomControl={!isMobile()} // Hide zoom controls on mobile
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {travelData.map((location) => (
          <Marker 
            key={location.id}
            position={location.coordinates}
            icon={createFlagIcon(location.flag)}
            eventHandlers={{
              click: () => {
                openLocationDetail(location);
              }
            }}
          />
        ))}
      </MapContainer>
      
      <div className="absolute bottom-2 right-2 z-10">
        <a 
          href="/stats" 
          className="bg-accent-color text-white text-xs px-3 py-1 rounded-full shadow-md hover:bg-opacity-90 transition-all"
        >
          View detailed stats
        </a>
      </div>
    </div>
  );
}
