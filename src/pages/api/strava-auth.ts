import type { APIRoute } from 'astro';

// Define the scopes we need
// Based on https://www.markhneedham.com/blog/2020/12/15/strava-authorization-error-missing-read-permission/
// We need to include both read and activity:read scopes
const REQUIRED_SCOPES = 'read,activity:read,activity:read_all,profile:read_all';

// OAuth endpoint for initiating the authorization flow
export const GET: APIRoute = async ({ request, redirect }) => {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  
  // If action is 'authorize', redirect to Strava's authorization page
  if (action === 'authorize') {
    const clientId = import.meta.env.STRAVA_CLIENT_ID;
    
    if (!clientId) {
      return new Response(JSON.stringify({ error: 'Missing Strava client ID' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Construct the redirect URL (this should be a URL that Strava can redirect back to)
    const redirectUri = new URL('/api/strava-auth', url.origin).toString();
    
    // Construct the authorization URL
    const authUrl = new URL('https://www.strava.com/oauth/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', REQUIRED_SCOPES);
    
    // Redirect to Strava's authorization page
    return redirect(authUrl.toString());
  }
  
  // If we have a code, exchange it for an access token
  const code = url.searchParams.get('code');
  if (code) {
    const clientId = import.meta.env.STRAVA_CLIENT_ID;
    const clientSecret = import.meta.env.STRAVA_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ error: 'Missing Strava client ID or secret' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    try {
      // Exchange the code for an access token
      const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code'
        })
      });
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Failed to get token: ${tokenResponse.status} ${tokenResponse.statusText} - ${errorText}`);
      }
      
      const tokenData = await tokenResponse.json();
      
      // Return the token data with instructions
      return new Response(`
        <html>
          <head>
            <title>Strava Authorization Successful</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                line-height: 1.6;
              }
              pre {
                background-color: #f5f5f5;
                padding: 15px;
                border-radius: 5px;
                overflow-x: auto;
              }
              .token-data {
                margin-top: 20px;
              }
              .instructions {
                margin-top: 30px;
                padding: 15px;
                background-color: #e6f7ff;
                border-left: 4px solid #1890ff;
              }
            </style>
          </head>
          <body>
            <h1>Strava Authorization Successful!</h1>
            <p>Your Strava account has been successfully authorized with the following scopes: <strong>${tokenData.scope || REQUIRED_SCOPES}</strong></p>
            
            <div class="token-data">
              <h2>Token Information</h2>
              <pre>${JSON.stringify(tokenData, null, 2)}</pre>
            </div>
            
            <div class="instructions">
              <h2>Next Steps</h2>
              <p>To use these tokens in your application:</p>
              <ol>
                <li>Add the following to your <code>.env</code> file:</li>
                <pre>
STRAVA_ACCESS_TOKEN=${tokenData.access_token}
STRAVA_REFRESH_TOKEN=${tokenData.refresh_token}
STRAVA_CLIENT_ID=${clientId}
STRAVA_CLIENT_SECRET=${clientSecret}
                </pre>
                <li>Restart your development server</li>
                <li>Visit the stats page to see your Strava data</li>
              </ol>
            </div>
            
            <p><a href="/stats">Return to Stats Page</a></p>
          </body>
        </html>
      `, {
        status: 200,
        headers: {
          'Content-Type': 'text/html'
        }
      });
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      
      return new Response(JSON.stringify({ 
        error: 'Failed to exchange code for token',
        details: error instanceof Error ? error.message : String(error)
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  }
  
  // If no action or code, show instructions
  return new Response(`
    <html>
      <head>
        <title>Strava Authorization</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
          }
          .button {
            display: inline-block;
            background-color: #FC4C02;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin-top: 20px;
          }
          .instructions {
            margin-top: 30px;
            padding: 15px;
            background-color: #f5f5f5;
            border-left: 4px solid #333;
          }
        </style>
      </head>
      <body>
        <h1>Strava Authorization</h1>
        <p>This page helps you authorize your Strava account to work with this application.</p>
        
        <div class="instructions">
          <h2>Why do I need to authorize?</h2>
          <p>To display your Strava activities and statistics, this application needs permission to access your Strava data. The authorization process will request the following permissions:</p>
          <ul>
            <li><strong>Read Public</strong>: View your public data</li>
            <li><strong>Activity Read All</strong>: View your activities</li>
            <li><strong>Profile Read All</strong>: View your profile information</li>
          </ul>
        </div>
        
        <a href="/api/strava-auth?action=authorize" class="button">Authorize with Strava</a>
        
        <p><a href="/stats">Return to Stats Page</a></p>
      </body>
    </html>
  `, {
    status: 200,
    headers: {
      'Content-Type': 'text/html'
    }
  });
};
