import type { APIRoute } from 'astro';

// Define interfaces for our data
interface Artist {
  name: string;
  imageUrl: string;
  count: number;
}

interface Track {
  name: string;
  artist: string;
  imageUrl: string;
  count: number;
}

// Function to get a new access token using the refresh token
export async function getAccessToken(): Promise<string | null> {
  const refreshToken = import.meta.env.SPOTIFY_REFRESH_TOKEN;
  const clientId = import.meta.env.SPOTIFY_CLIENT_ID;
  const clientSecret = import.meta.env.SPOTIFY_CLIENT_SECRET;

  try {
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Failed to refresh token: ${tokenResponse.status} ${tokenResponse.statusText}`);
    }
    
    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

export async function fetchWebApi<T>(endpoint: string, method: string, token: string, body?: unknown): Promise<T> {
  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method,
    body: body ? JSON.stringify(body) : undefined
  });
  return await res.json();
}

export async function getTopTracks(token: string, time_range = 'short_term', limit = 10): Promise<Track[]> {
  const endpoint = `v1/me/top/tracks?time_range=${time_range}&limit=${limit}`;
  const response = await fetchWebApi<{ items: any[] }>(endpoint, 'GET', token);
  
  return response.items.map(item => ({
    name: item.name,
    artist: item.artists.map((artist: any) => artist.name).join(', '),
    imageUrl: item.album?.images?.[0]?.url || '',
    count: item.popularity || 0
  }));
}

export async function getTopArtists(token: string, time_range = 'short_term', limit = 10): Promise<any[]> {
  const endpoint = `v1/me/top/artists?time_range=${time_range}&limit=${limit}`;
  const response = await fetchWebApi<{ items: any[] }>(endpoint, 'GET', token);
  
  console.log('Raw artist data from Spotify:', response.items[0]);
  
  return response.items.map(item => ({
    name: item.name,
    imageUrl: item.images?.[0]?.url || '',
    count: item.popularity || 0,
    genres: item.genres || []
  }));
}

// Mark this endpoint as server-rendered
export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  // Extract the timeRange from the URL
  const url = new URL(request.url);
  const timeRange = url.searchParams.get('timeRange') || 'medium_term';
  
  console.log('API endpoint called with URL:', request.url);
  console.log('Raw query string:', url.search);
  console.log('Extracted timeRange:', timeRange);
  
  try {
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Failed to get access token' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    const [topArtists, topTracks] = await Promise.all([
      getTopArtists(accessToken, timeRange as 'short_term' | 'medium_term' | 'long_term'),
      getTopTracks(accessToken, timeRange as 'short_term' | 'medium_term' | 'long_term')
    ]);
    
    // Extract genres from top artists
    const genreCounts: Record<string, number> = {};
    topArtists.forEach((artist: any) => {
      if (artist.genres) {
        artist.genres.forEach((genre: string) => {
          const formattedGenre = genre.split(' ')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          genreCounts[formattedGenre] = (genreCounts[formattedGenre] || 0) + artist.count;
        });
      }
    });
    
    const topGenres = Object.entries(genreCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return new Response(JSON.stringify({ topArtists, topTracks, topGenres }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching Spotify data:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch Spotify data' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
