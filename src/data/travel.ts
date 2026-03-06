// Travel data - edit travel.json to add/modify locations
import travelData from './travel.json';

export interface TravelLocation {
  country: string;
  flag: string;
  visits: number;
}

export const travelLocations: TravelLocation[] = travelData;

// Computed stats
export const travelStats = {
  totalCountries: travelLocations.length,
  totalVisits: travelLocations.reduce((sum, loc) => sum + loc.visits, 0),
};
