import type { APIRoute } from 'astro';

// Get API token from environment variables
const API_KEY = import.meta.env.ALEX_API_KEY;
const API_BASE_URL = import.meta.env.API_BASE_URL;

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
    
    console.log(`Proxying request to: ${apiUrl}`);
    
    // Forward the request to the API with the key
    const response = await fetch(apiUrl, {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    // Get the response data
    const data = await response.json();
    
    // Return the response
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('API proxy error:', error);
    
    return new Response(JSON.stringify({ error: 'Failed to fetch data from API' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
