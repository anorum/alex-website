import { Suspense, lazy, useEffect } from 'react';
import { travelLocations, travelStats } from '../../../data/travel';
import Window, { type WindowContentProps } from '../ui/Window';

const IndexTravelMap = lazy(() => import('../../travel/IndexTravelMap'));

export default function TravelMapWindow({ onClose }: WindowContentProps) {
  // Leaflet needs a resize kick once its container is visible
  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <Window title="SEA CHART" onClose={onClose}>
      <div className="rpgt-map">
        <Suspense fallback={<div className="rpgt-loading">CHARTING...</div>}>
          <IndexTravelMap travelData={travelLocations} />
        </Suspense>
      </div>
      <p className="rpga-flavor" style={{ marginTop: '0.5rem' }}>
        {travelStats.totalCountries} countries, {travelStats.totalVisits} trips. Green means visited.
      </p>
    </Window>
  );
}
