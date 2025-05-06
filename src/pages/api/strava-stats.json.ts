import type { APIRoute } from 'astro';

// Define interfaces for our data
interface Activity {
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  start_date: string;
  map?: {
    summary_polyline?: string;
  };
}

interface ActivitySummary {
  name: string;
  type: string;
  distance: number; // in kilometers
  duration: number; // in minutes
  elevation: number; // in meters
  date: string;
  mapPolyline?: string;
}

interface ActivityType {
  name: string;
  count: number;
  totalDistance: number;
}

// Function to get a valid access token
export async function getAccessToken(): Promise<string | null> {
  const refreshToken = import.meta.env.STRAVA_REFRESH_TOKEN;
  const clientId = import.meta.env.STRAVA_CLIENT_ID || '';
  const clientSecret = import.meta.env.STRAVA_CLIENT_SECRET || '';
  
  if (!refreshToken || !clientId || !clientSecret) {
    console.error('Missing required Strava credentials');
    return null;
  }
  
  try {
    // Exchange refresh token for a new access token
    // Per Strava docs: https://developers.strava.com/docs/authentication/#refreshingexpiredaccesstokens
    console.log('Getting new Strava access token...');
    
    const response = await fetch('https://www.strava.com/api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get token: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Successfully obtained new access token');
    
    // If a new refresh token is provided, we should store it
    // In a real production app, you would update your environment variables or database
    // For this demo, we'll just log it
    if (data.refresh_token && data.refresh_token !== refreshToken) {
      console.log('New refresh token received. Update your .env file with:');
      console.log(`STRAVA_REFRESH_TOKEN=${data.refresh_token}`);
    }
    
    return data.access_token;
  } catch (error) {
    console.error('Error getting Strava access token:', error);
    return null;
  }
}

export async function fetchStravaApi<T>(endpoint: string, token: string): Promise<T> {
  const res = await fetch(`https://www.strava.com/api/v3/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method: 'GET'
  });
  
  if (!res.ok) {
    if (res.status === 429) {
      throw new Error(`Strava API rate limit exceeded: ${res.status} ${res.statusText}. Please try again later.`);
    }
    throw new Error(`Strava API error: ${res.status} ${res.statusText}`);
  }
  
  return await res.json();
}

// Interface for athlete profile
interface AthleteProfile {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  profile: string; // profile image URL
  city: string;
  state: string;
  country: string;
}

export async function getAthleteProfile(token: string): Promise<AthleteProfile | null> {
  try {
    // Per Strava docs: https://developers.strava.com/docs/reference/#api-Athletes-getLoggedInAthlete
    const athlete = await fetchStravaApi<AthleteProfile>('athlete', token);
    console.log('Successfully fetched athlete profile');
    return athlete;
  } catch (error) {
    console.error('Error fetching athlete profile:', error);
    return null;
  }
}

export async function getAthleteActivities(token: string, limit = 10): Promise<ActivitySummary[]> {
  // Per Strava docs: https://developers.strava.com/docs/reference/#api-Activities-getLoggedInAthleteActivities
  // Requires 'activity:read_permission' scope
  const endpoint = `athlete/activities?per_page=${limit}&page=1`;
  
  try {
    const activities = await fetchStravaApi<Activity[]>(endpoint, token);
    
    if (!activities || activities.length === 0) {
      console.log('No activities found');
      return [];
    }
    
    console.log(`Found ${activities.length} activities`);
    
    return activities.map(activity => ({
      name: activity.name,
      type: activity.type,
      distance: Math.round((activity.distance / 1609.34) * 10) / 10, // Convert to miles and round to 1 decimal
      duration: Math.round(activity.moving_time / 60), // Convert to minutes
      elevation: Math.round(activity.total_elevation_gain),
      date: new Date(activity.start_date).toLocaleDateString(),
      mapPolyline: activity.map?.summary_polyline
    }));
  } catch (error) {
    // Check if it's a 401 error, which likely means missing scope
    if (error instanceof Error && error.message.includes('401')) {
      console.error('Error fetching athlete activities: Missing activity:read_permission scope');
    } else {
      console.error('Error fetching athlete activities:', error);
    }
    return [];
  }
}

export async function getAthleteStats(token: string): Promise<any> {
  try {
    // Hardcode the athlete ID as provided by the user
    const athleteId = 85504445;
    console.log(`Using hardcoded athlete ID: ${athleteId}`);
    
    // Get the stats
    // Per Strava docs: https://developers.strava.com/docs/reference/#api-Athletes-getStats
    const endpoint = `athletes/${athleteId}/stats`;
    return await fetchStravaApi<any>(endpoint, token);
  } catch (error) {
    console.error('Error fetching athlete stats:', error);
    return null;
  }
}

// Mark this endpoint as server-rendered
export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  // Extract the timeRange from the URL (not used for Strava but kept for consistency)
  const url = new URL(request.url);
  const timeRange = url.searchParams.get('timeRange') || 'recent';
  
  console.log('Strava API endpoint called with URL:', request.url);
  console.log('Extracted timeRange:', timeRange);
  
  try {
    // Step 1: Get a valid access token
    console.log('Step 1: Getting access token');
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      console.error('Failed to get access token');
      return new Response(JSON.stringify({ 
        error: 'Failed to get Strava access token. Check your credentials.'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Step 2: Get athlete profile, activities and stats
    console.log('Step 2: Fetching athlete data');
    const profilePromise = getAthleteProfile(accessToken);
    const activitiesPromise = getAthleteActivities(accessToken);
    const statsPromise = getAthleteStats(accessToken);
    
    // Wait for all promises to resolve
    const [athleteProfile, recentActivities, athleteStats] = await Promise.all([
      profilePromise,
      activitiesPromise,
      statsPromise
    ]);
    
    // Check if we got the athlete profile
    if (!athleteProfile) {
      console.warn('No athlete profile found');
    } else {
      console.log(`Got athlete profile for ${athleteProfile.firstname} ${athleteProfile.lastname}`);
    }
    
    // Check if we got valid data
    if (!recentActivities || recentActivities.length === 0) {
      console.warn('No activities found');
    }
    
    if (!athleteStats) {
      console.warn('No athlete stats found');
    }
    
    // Step 3: Process activity types
    console.log('Step 3: Processing activity data');
    const activityTypes: Record<string, ActivityType> = {};
    
    if (recentActivities && recentActivities.length > 0) {
      recentActivities.forEach(activity => {
        if (!activityTypes[activity.type]) {
          activityTypes[activity.type] = {
            name: activity.type,
            count: 0,
            totalDistance: 0
          };
        }
        
        activityTypes[activity.type].count++;
        activityTypes[activity.type].totalDistance += activity.distance;
      });
    }
    
    const topActivityTypes = Object.values(activityTypes)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Step 4: Calculate summary statistics
    console.log('Step 4: Calculating summary statistics');
    
    // Use athlete stats if available, otherwise calculate from activities
    let totalDistance = 0;
    let totalElevation = 0;
    let totalDuration = 0;
    let activityCount = 0;
    
    if (athleteStats && athleteStats.all_ride_totals) {
      console.log('Using stats from athlete stats endpoint');
      // Convert meters to kilometers and round to 1 decimal place
      totalDistance = Math.round((athleteStats.all_ride_totals.distance || 0) / 100) / 10;
      totalElevation = Math.round(athleteStats.all_ride_totals.elevation_gain || 0);
      // Convert seconds to minutes and round
      totalDuration = Math.round((athleteStats.all_ride_totals.moving_time || 0) / 60);
      activityCount = athleteStats.all_ride_totals.count || 0;
      
      // Add run stats if available
      if (athleteStats.all_run_totals) {
        totalDistance += Math.round((athleteStats.all_run_totals.distance || 0) / 100) / 10;
        totalElevation += Math.round(athleteStats.all_run_totals.elevation_gain || 0);
        totalDuration += Math.round((athleteStats.all_run_totals.moving_time || 0) / 60);
        activityCount += athleteStats.all_run_totals.count || 0;
      }
      
      // Add swim stats if available
      if (athleteStats.all_swim_totals) {
        totalDistance += Math.round((athleteStats.all_swim_totals.distance || 0) / 100) / 10;
        totalElevation += Math.round(athleteStats.all_swim_totals.elevation_gain || 0);
        totalDuration += Math.round((athleteStats.all_swim_totals.moving_time || 0) / 60);
        activityCount += athleteStats.all_swim_totals.count || 0;
      }
    } else if (recentActivities && recentActivities.length > 0) {
      console.log('Calculating stats from activities');
      totalDistance = recentActivities.reduce((sum, activity) => sum + activity.distance, 0);
      totalElevation = recentActivities.reduce((sum, activity) => sum + activity.elevation, 0);
      totalDuration = recentActivities.reduce((sum, activity) => sum + activity.duration, 0);
      activityCount = recentActivities.length;
    }
    
    console.log(`Stats: ${totalDistance}km, ${totalElevation}m, ${totalDuration}min, ${activityCount} activities`);
    
    // Step 5: Return the processed data
    console.log('Step 5: Returning processed data');
    return new Response(JSON.stringify({ 
      athleteProfile: athleteProfile || null,
      recentActivities: recentActivities || [], 
      athleteStats: athleteStats || {},
      topActivityTypes,
      summary: {
        totalDistance,
        totalElevation,
        totalDuration,
        activityCount
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in Strava API endpoint:', error);
    
    // Provide detailed error message
    let errorMessage = 'Failed to fetch Strava data';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.message}`;
      errorDetails = error.stack || '';
    } else {
      errorDetails = String(error);
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: errorDetails
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
