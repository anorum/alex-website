import type { APIRoute } from 'astro';

// Get API token from environment variables with fallback pattern
// This ensures compatibility in both development and production environments
const API_KEY = process.env.ALEX_API_KEY || import.meta.env.ALEX_API_KEY;
const API_BASE_URL = process.env.API_BASE_URL || import.meta.env.API_BASE_URL;

// Make this endpoint dynamic by setting prerender to false
export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  try {
    // Get the slug from the request
    const slug = params.slug;
    
    if (!slug) {
      return new Response(JSON.stringify({ error: 'Missing endpoint path' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Construct the API URL
    const apiUrl = `${API_BASE_URL}/${slug}`;
    
    // Log only the slug for debugging, not the full URL
    console.log(`Processing API request for: ${slug}`);
    
    // Forward the request to the API with the key
    const response = await fetch(apiUrl, {
      headers: {
        'X-API-Key': API_KEY,
        // Don't set Content-Type to allow the browser to set it automatically
      }
    });
    
    // Check if the response is an image or other binary data
    const contentType = response.headers.get('Content-Type') || '';
    
    if (contentType.includes('image/') || contentType.includes('application/octet-stream')) {
      // For images and binary data, return the response as is
      const arrayBuffer = await response.arrayBuffer();
      return new Response(arrayBuffer, {
        status: response.status,
        headers: {
          'Content-Type': contentType
        }
      });
    } else {
      // For JSON and other text data, parse and return as JSON
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    // Log only the error message, not the full error object which might contain sensitive info
    console.error('API proxy error:', error instanceof Error ? error.message : 'Unknown error');
    
    return new Response(JSON.stringify({ error: 'Failed to fetch data from API' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
