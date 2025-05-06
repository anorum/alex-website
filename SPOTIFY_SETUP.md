# Setting Up Spotify Integration

This guide will help you set up the Spotify integration for your personal website.

## Prerequisites

1. A Spotify account
2. A Spotify Developer account (create one at [developer.spotify.com](https://developer.spotify.com/))

## Step 1: Create a Spotify App

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create App"
3. Fill in the required information:
   - App name: Your Website Name
   - App description: Personal website Spotify integration
   - Redirect URI: Add a valid URI (e.g., https://example.com/callback)
   - Website: Your website URL
4. Check the agreement checkbox and click "Create"

## Step 2: Get Your Client ID and Secret

1. Once your app is created, you'll see your Client ID on the dashboard
2. Click "Show Client Secret" to reveal your Client Secret
3. Add these to your `.env` file:
   ```
   SPOTIFY_CLIENT_ID=your_client_id_here
   SPOTIFY_CLIENT_SECRET=your_client_secret_here
   ```

## Step 3: Get a Refresh Token

There are several ways to get a refresh token. Here's a simple method:

### Option 1: Using the Spotify Authorization Flow

1. Visit this URL in your browser (replace CLIENT_ID and REDIRECT_URI with your values):
   ```
   https://accounts.spotify.com/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=YOUR_REDIRECT_URI&scope=user-read-private%20user-read-email%20user-top-read%20user-read-recently-played
   ```

2. Log in with your Spotify account and authorize the application

3. You'll be redirected to your redirect URI with a code parameter in the URL:
   ```
   https://example.com/callback?code=AQD...
   ```

4. Copy the code value (everything after `code=`)

5. Make a POST request to get your tokens (you can use curl, Postman, or any API client):
   ```
   curl -X POST -H "Content-Type: application/x-www-form-urlencoded" -H "Authorization: Basic BASE64_ENCODED_CLIENT_ID_AND_SECRET" -d "grant_type=authorization_code&code=YOUR_CODE&redirect_uri=YOUR_REDIRECT_URI" https://accounts.spotify.com/api/token
   ```
   
   Note: BASE64_ENCODED_CLIENT_ID_AND_SECRET is the base64 encoding of your client ID and secret in the format `client_id:client_secret`

6. The response will include a refresh token. Add this to your `.env` file:
   ```
   SPOTIFY_REFRESH_TOKEN=your_refresh_token_here
   ```

### Option 2: Using an Online Tool

You can use an online tool like [Spotify Token Generator](https://github.com/bih/spotify-token-swap-service) to generate a refresh token more easily.

## Step 4: Restart Your Development Server

After adding all the required values to your `.env` file, restart your development server to apply the changes.

## Troubleshooting

- If you see "Invalid redirect URI" errors, make sure the redirect URI in your Spotify app settings exactly matches the one you're using in your requests.
- Refresh tokens don't expire unless you revoke access to the application in your Spotify account settings.
- If you're still seeing mock data, check your server logs for any errors related to the Spotify API.
