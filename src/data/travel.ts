// Travel data - edit travel.json to add/modify locations
import travelData from './travel.json';

export interface TravelLocation {
  country: string;
  flag: string;
  visits: number;
  /** [lat, lng] marker for places too small to appear as a map polygon */
  coords?: [number, number];
}

// JSON infers coords as number[]; the data is hand-written [lat, lng] pairs.
export const travelLocations = travelData as TravelLocation[];

// Computed stats
export const travelStats = {
  totalCountries: travelLocations.length,
  totalVisits: travelLocations.reduce((sum, loc) => sum + loc.visits, 0),
};
