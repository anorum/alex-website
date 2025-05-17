import React, { useState, useEffect } from 'react';

export default function RecentTrips({ recentVisits: initialVisits = [] }) {
  // Helper to resolve image URLs
  const resolveImageUrl = (url) => {
    return url.startsWith('/api/v1') ? `/api/alexapi${url}` : url;
  };

  const [recentVisits, setRecentVisits] = useState(initialVisits);
  const [isMobile, setIsMobile] = useState(false);
  
  // Listen for data updates and check window size
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if mobile on initial load
      setIsMobile(window.innerWidth < 640);
      
      // Listen for data updates
      const handleDataReady = (event) => {
        if (event.detail?.recentVisits) {
          setRecentVisits(event.detail.recentVisits);
        }
      };
      
      // Listen for window resize
      const handleResize = () => {
        setIsMobile(window.innerWidth < 640);
      };
      
      document.addEventListener('travel-data-ready', handleDataReady);
      window.addEventListener('resize', handleResize);
      
      return () => {
        document.removeEventListener('travel-data-ready', handleDataReady);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);
  if (!recentVisits || recentVisits.length === 0) {
    return (
      <div className="bg-white/10 dark:bg-white/5 rounded-lg p-4 shadow-md backdrop-blur-md">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Trips</h3>
        <p className="text-gray-500 font-medium">No recent trips available</p>
      </div>
    );
  }

  // Format date for display (month and year only)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  return (
    <div className="bg-white/10 dark:bg-white/5 rounded-lg p-4 shadow-md backdrop-blur-md">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Trips</h3>
      
      {/* Desktop view - table */}
      <div className="md:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 dark:border-white/10">
              <th className="py-3 px-4 text-sm font-semibold">Date</th>
              <th className="py-3 px-4 text-sm font-semibold">Location</th>
              <th className="py-3 px-4 text-sm font-semibold">Country</th>
              <th className="py-3 px-4 text-sm font-semibold">Photos</th>
              <th className="py-3 px-4 text-sm font-semibold">Notes</th>
            </tr>
          </thead>
          <tbody>
            {recentVisits.map((visit) => (
              <tr 
                key={visit.visit_id} 
                className="border-b border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => {
                  const event = new CustomEvent('view-location-on-map', {
                    detail: { locationId: visit.location_id }
                  });
                  document.dispatchEvent(event);
                  document.getElementById('travel-map-container')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <td className="py-3 px-4 font-medium">{formatDate(visit.date)}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">{visit.flag}</span>
                    <span className="font-semibold">{visit.city}</span>
                  </div>
                </td>
                <td className="py-3 px-4 font-medium">{visit.country}</td>
                <td className="py-3 px-4">
                  {visit.imageUrls && (
                    <div className="flex -space-x-2">
                      {visit.imageUrls.slice(0, 3).map((url, index) => (
                        <div 
                          key={index} 
                          className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-white/20 shadow-sm"
                          style={{ zIndex: 3 - index }}
                        >
                          <img 
                            src={resolveImageUrl(url)} 
                            alt={`${visit.city} photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {visit.imageUrls.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-[#0c6b4e] dark:bg-[#77647b] flex items-center justify-center text-xs text-white border border-gray-200 dark:border-white/20 shadow-sm" style={{ zIndex: 0 }}>
                          +{visit.imageUrls.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4">
                  {visit.notes ? (
                    <p className="text-sm font-medium line-clamp-2">{visit.notes}</p>
                  ) : (
                    <span className="text-sm">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Mobile view - cards */}
      <div className="sm:hidden space-y-4">
        {recentVisits.map((visit) => (
          <div 
            key={visit.visit_id}
            className="bg-gray-50 dark:bg-white/5 rounded-lg p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            onClick={() => {
              const event = new CustomEvent('view-location-on-map', {
                detail: { locationId: visit.location_id }
              });
              document.dispatchEvent(event);
              document.getElementById('travel-map-container')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-2xl mr-2">{visit.flag}</span>
                <div>
                  <h4 className="font-semibold text-gray-900">{visit.city}</h4>
                  <p className="text-sm font-medium text-gray-600">{visit.country}</p>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-500">
                {formatDate(visit.date)}
              </div>
            </div>
            
            {visit.imageUrls && visit.imageUrls.length > 0 && (
              <div className="flex -space-x-2 mb-2">
                {visit.imageUrls.slice(0, 3).map((url, index) => (
                  <div 
                    key={index} 
                    className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-white/20 shadow-sm"
                    style={{ zIndex: 3 - index }}
                  >
                    <img 
                      src={resolveImageUrl(url)} 
                      alt={`${visit.city} photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {visit.imageUrls.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-[#0c6b4e] dark:bg-[#77647b] flex items-center justify-center text-xs text-white border border-gray-200 dark:border-white/20 shadow-sm" style={{ zIndex: 0 }}>
                    +{visit.imageUrls.length - 3}
                  </div>
                )}
              </div>
            )}
            
            {visit.notes && (
              <p className="text-sm font-medium line-clamp-2">{visit.notes}</p>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-sm font-medium text-[var(--text-secondary)] italic">
        Click on any {isMobile ? 'card' : 'row'} to view that location on the map
      </div>
    </div>
  );
}
