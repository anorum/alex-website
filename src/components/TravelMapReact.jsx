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
      <div className="fixed inset-0 z-50 bg-[#2a4535]/95 flex items-center justify-center p-4" onClick={toggleFullscreen}>
        <div className="relative max-w-4xl max-h-full backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
          <img 
            src={images[currentIndex]} 
            alt={`Visit to ${locationName} - Image ${currentIndex + 1}`}
            className="max-w-full max-h-[80vh] object-contain rounded-md"
          />
          <button 
            onClick={toggleFullscreen}
            className="absolute top-2 right-2 bg-[#77647b] text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-[#77647b]/80 transition-colors"
            aria-label="Close fullscreen"
          >
            ×
          </button>
          {images.length > 1 && (
            <>
              <button 
                onClick={prevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-[#77647b] text-white rounded-full w-10 h-10 flex items-center justify-center text-xl hover:bg-[#77647b]/80 transition-colors"
                aria-label="Previous image"
              >
                ←
              </button>
              <button 
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#77647b] text-white rounded-full w-10 h-10 flex items-center justify-center text-xl hover:bg-[#77647b]/80 transition-colors"
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

export default function TravelMapReact({ travelData: initialData }) {
  const mapRef = useRef(null);
  const [travelData, setTravelData] = useState(initialData || []);
  const [selectedLocation, setSelectedLocation] = useState(null);
  
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
  
  // Listen for custom events
  useEffect(() => {
    // Only run on client-side
    if (typeof window !== 'undefined') {
      // Get the parent container
      const container = document.getElementById('travel-map-container');
      
      if (container) {
        // Listen for the data update event
        const handleUpdateData = (event) => {
          if (event.detail && event.detail.travelLocations) {
            setTravelData(event.detail.travelLocations);
          }
        };
        
        // Listen for the view location event
        const handleViewLocation = (event) => {
          if (event.detail && event.detail.locationId) {
            const locationId = event.detail.locationId;
            const location = travelData.find(loc => loc.id === locationId);
            
            if (location) {
              // Center map on the location
              if (mapRef.current) {
                mapRef.current.setView(location.coordinates, 10);
              }
              
              // Open the location detail view
              setSelectedLocation(location);
            }
          }
        };
        
        document.addEventListener('travel-data-ready', handleUpdateData);
        document.addEventListener('view-location-on-map', handleViewLocation);
        
        return () => {
          document.removeEventListener('travel-data-ready', handleUpdateData);
          document.removeEventListener('view-location-on-map', handleViewLocation);
        };
      }
    }
  }, [travelData]);
  
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
  
  // Open location detail view
  const openLocationDetail = (location) => {
    setSelectedLocation(location);
  };
  
  // Close location detail view
  const closeLocationDetail = () => {
    setSelectedLocation(null);
  };
  
  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 relative">
      {/* Location detail overlay */}
      {selectedLocation && (
        <div className="absolute inset-0 bg-[#2a4535] dark:bg-[#1a2e24] z-20 overflow-y-auto">
          <div className="sticky top-0 z-30 bg-[#2a4535] dark:bg-[#1a2e24] shadow-md p-4 backdrop-blur-md border-b border-white/10">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              <div className="flex items-center">
                <span className="text-3xl mr-3">{selectedLocation.flag}</span>
                <h2 className="text-2xl font-bold">{selectedLocation.city}, {selectedLocation.country}</h2>
              </div>
              <button 
                onClick={closeLocationDetail}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                aria-label="Close detail view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="p-4 max-w-3xl mx-auto animate-fade-in">
            <p className="text-lg mb-4">{selectedLocation.visits.length} visits to this location</p>
            
            {selectedLocation.visits.map((visit, index) => (
              <div key={visit.id || index} className="mb-8 bg-white/10 dark:bg-white/5 rounded-lg p-4 shadow-md backdrop-blur-md transition-transform hover:translate-y-[-5px]">
                <h3 className="text-xl font-semibold mb-2 text-white">{formatDate(visit.date)}</h3>
                
                {visit.notes && (
                  <p className="text-white/90 mb-4">{visit.notes}</p>
                )}
                
                {visit.imageUrls && visit.imageUrls.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-lg font-medium mb-2 text-[#77647b]">Photos</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {visit.imageUrls.map((url, imgIndex) => (
                        <div key={imgIndex} className="relative aspect-video rounded-lg overflow-hidden shadow-md">
                          <img 
                            src={url} 
                            alt={`Visit to ${selectedLocation.city} - Image ${imgIndex + 1}`}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => {
                              // Create a fullscreen image viewer with carousel
                              const fullscreenDiv = document.createElement('div');
                              fullscreenDiv.className = 'fixed inset-0 z-50 bg-[#2a4535]/95 flex items-center justify-center p-4 backdrop-blur-md';
                              
                              // Create container for image and controls
                              const container = document.createElement('div');
                              container.className = 'relative max-w-4xl max-h-full backdrop-blur-md';
                              container.onclick = (e) => e.stopPropagation();
                              
                              // Create image element
                              const img = document.createElement('img');
                              img.src = visit.imageUrls[imgIndex];
                              img.className = 'max-w-full max-h-[80vh] object-contain rounded-md';
                              
                              // Create close button
                              const closeBtn = document.createElement('button');
                              closeBtn.className = 'absolute top-2 right-2 bg-[#77647b] text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-[#77647b]/80 transition-colors';
                              closeBtn.innerHTML = '×';
                              closeBtn.onclick = () => document.body.removeChild(fullscreenDiv);
                              
                              // Add navigation buttons if there are multiple images
                              if (visit.imageUrls.length > 1) {
                                // Current image index
                                let currentIdx = imgIndex;
                                
                                // Update image function
                                const updateImage = () => {
                                  img.src = visit.imageUrls[currentIdx];
                                  counter.textContent = `${currentIdx + 1} / ${visit.imageUrls.length}`;
                                  
                                  // Update dots
                                  Array.from(dotsContainer.children).forEach((dot, idx) => {
                                    if (idx === currentIdx) {
                                      dot.className = 'w-3 h-3 rounded-full bg-white';
                                    } else {
                                      dot.className = 'w-3 h-3 rounded-full bg-gray-400';
                                    }
                                  });
                                };
                                
                                // Previous button
                                const prevBtn = document.createElement('button');
                                prevBtn.className = 'absolute left-2 top-1/2 transform -translate-y-1/2 bg-[#77647b] text-white rounded-full w-10 h-10 flex items-center justify-center text-xl hover:bg-[#77647b]/80 transition-colors';
                                prevBtn.innerHTML = '←';
                                prevBtn.onclick = (e) => {
                                  e.stopPropagation();
                                  currentIdx = (currentIdx - 1 + visit.imageUrls.length) % visit.imageUrls.length;
                                  updateImage();
                                };
                                
                                // Next button
                                const nextBtn = document.createElement('button');
                                nextBtn.className = 'absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#77647b] text-white rounded-full w-10 h-10 flex items-center justify-center text-xl hover:bg-[#77647b]/80 transition-colors';
                                nextBtn.innerHTML = '→';
                                nextBtn.onclick = (e) => {
                                  e.stopPropagation();
                                  currentIdx = (currentIdx + 1) % visit.imageUrls.length;
                                  updateImage();
                                };
                                
                                // Create dots container
                                const dotsContainer = document.createElement('div');
                                dotsContainer.className = 'absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2';
                                
                                // Add dots for each image
                                visit.imageUrls.forEach((_, idx) => {
                                  const dot = document.createElement('span');
                                  dot.className = idx === currentIdx ? 'w-3 h-3 rounded-full bg-white' : 'w-3 h-3 rounded-full bg-gray-400';
                                  dotsContainer.appendChild(dot);
                                });
                                
                                // Create counter
                                const counter = document.createElement('div');
                                counter.className = 'absolute bottom-10 left-1/2 transform -translate-x-1/2 text-white text-sm';
                                counter.textContent = `${currentIdx + 1} / ${visit.imageUrls.length}`;
                                
                                // Add navigation elements to container
                                container.appendChild(prevBtn);
                                container.appendChild(nextBtn);
                                container.appendChild(dotsContainer);
                                container.appendChild(counter);
                              }
                              
                              // Add elements to container
                              container.appendChild(img);
                              container.appendChild(closeBtn);
                              
                              // Add close functionality to background
                              fullscreenDiv.onclick = () => document.body.removeChild(fullscreenDiv);
                              
                              // Append to body
                              fullscreenDiv.appendChild(container);
                              document.body.appendChild(fullscreenDiv);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <MapContainer 
        center={center} 
        zoom={2} 
        style={{ height: '500px', width: '100%' }}
        ref={mapRef}
        className="z-0"
        maxBounds={[[-90, -180], [90, 180]]}
        maxBoundsViscosity={1.0}
        worldCopyJump={false}
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
    </div>
  );
}
