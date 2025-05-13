import React, { useState, useEffect } from 'react';

export default function RecentTrips({ recentVisits: initialVisits = [] }) {
  const [recentVisits, setRecentVisits] = useState(initialVisits);
  
  // Listen for data updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleDataReady = (event) => {
        if (event.detail?.recentVisits) {
          console.log("RecentTrips received data:", event.detail.recentVisits);
          setRecentVisits(event.detail.recentVisits);
        }
      };
      
      document.addEventListener('travel-data-ready', handleDataReady);
      return () => document.removeEventListener('travel-data-ready', handleDataReady);
    }
  }, []);
  if (!recentVisits || recentVisits.length === 0) {
    return (
      <div className="bg-white/10 dark:bg-white/5 rounded-lg p-4 shadow-md backdrop-blur-md">
        <h3 className="text-xl font-semibold mb-4">Recent Trips</h3>
        <p className="text-gray-400">No recent trips available</p>
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
      <h3 className="text-xl font-semibold mb-4">Recent Trips</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Country</th>
              <th className="py-3 px-4">Photos</th>
              <th className="py-3 px-4">Notes</th>
            </tr>
          </thead>
          <tbody>
            {recentVisits.map((visit) => (
              <tr 
                key={visit.visit_id} 
                className="border-b border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => {
                  // Find the location on the map
                  const event = new CustomEvent('view-location-on-map', {
                    detail: { locationId: visit.location_id }
                  });
                  document.dispatchEvent(event);
                  
                  // Scroll to the map
                  document.getElementById('travel-map-container')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <td className="py-3 px-4">{formatDate(visit.date)}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">{visit.flag}</span>
                    <span>{visit.city}</span>
                  </div>
                </td>
                <td className="py-3 px-4">{visit.country}</td>
                <td className="py-3 px-4">
                  {visit.imageUrls && (
                    <div className="flex -space-x-2">
                      {visit.imageUrls.slice(0, 3).map((url, index) => (
                        <div 
                          key={index} 
                          className="w-8 h-8 rounded-full overflow-hidden border border-white/20 shadow-sm"
                          style={{ zIndex: 3 - index }}
                        >
                          <img 
                            src={url.startsWith('/api/v1') ? `/api/alexapi${url}` : url} 
                            alt={`${visit.city} photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {visit.imageUrls.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-[#77647b] flex items-center justify-center text-xs text-white border border-white/20 shadow-sm" style={{ zIndex: 0 }}>
                          +{visit.imageUrls.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4">
                  {visit.notes ? (
                    <p className="text-sm text-white/80 line-clamp-2">{visit.notes}</p>
                  ) : (
                    <span className="text-white/40 text-sm">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-sm text-white/60 italic">
        Click on any row to view that location on the map
      </div>
    </div>
  );
}
