# Data Update Instructions

This document provides step-by-step instructions for updating your personal website data for Spotify, Strava, 18Birdies, and Goodreads.

## Table of Contents
- [Spotify](#spotify)
- [Strava](#strava)
- [18Birdies](#18birdies)
- [Goodreads](#goodreads)

## Spotify

Spotify integration requires a refresh token to access your listening data through the Spotify API.

### Getting a New Spotify Refresh Token

1. Visit the Spotify Refresh Token Generator:
   ```
   https://spotify-refresh-token-generator.netlify.app/#welcome
   ```

2. Follow the steps on the website:
   - Log in with your Spotify account
   - Authorize the application with the required permissions
   - Copy the generated refresh token

3. Update your `.env` file with the new refresh token:
   ```
   SPOTIFY_REFRESH_TOKEN=your_new_refresh_token_here
   ```

4. Restart your development server to apply the changes.

### Troubleshooting Spotify Integration

- If you see errors related to invalid tokens, try generating a new refresh token.
- Ensure your Spotify Developer App has the correct redirect URI and permissions.
- Required scopes for the token include: `user-read-private user-read-email user-top-read user-read-recently-played`

## Strava

Strava integration requires authorization to access your activity data through the Strava API.

### Getting a New Strava Refresh Token

1. Visit the Strava authorization URL:
   ```
   https://www.strava.com/oauth/authorize?client_id=158383&response_type=code&redirect_uri=http://localhost/exchange_token&approval_prompt=force&scope=activity:read_all
   ```

2. Log in with your Strava account and authorize the application.

3. After authorization, you'll be redirected to a URL containing a code parameter:
   ```
   http://localhost/exchange_token?state=&code=YOUR_AUTHORIZATION_CODE&scope=read,activity:read_all,profile:read_all
   ```

4. Copy the code value (everything after `code=` and before `&scope=`).

5. Exchange the authorization code for a refresh token using a POST request:
   ```bash
   curl -X POST https://www.strava.com/oauth/token \
     -F client_id=YOUR_CLIENT_ID \
     -F client_secret=YOUR_CLIENT_SECRET \
     -F code=YOUR_AUTHORIZATION_CODE \
     -F grant_type=authorization_code
   ```

6. The response will include a refresh token. Update your `.env` file:
   ```
   STRAVA_REFRESH_TOKEN=your_new_refresh_token_here
   ```

7. Restart your development server to apply the changes.

### Alternative Method Using the Built-in Auth Flow

1. Start your development server.

2. Navigate to `/api/strava-auth` in your browser.

3. Click "Authorize with Strava" and follow the prompts.

4. After authorization, you'll be shown your access and refresh tokens.

5. Add these tokens to your `.env` file as instructed on the page.

6. Restart your development server to apply the changes.

### Troubleshooting Strava Integration

- If you encounter rate limit errors (HTTP 429), wait a few minutes before trying again.
- Ensure your Strava API application has the correct redirect URI and permissions.
- Required scopes include: `read`, `activity:read_all`, and `profile:read_all`.

## 18Birdies

18Birdies data is stored locally in a JSON file and needs to be manually updated.

### Updating 18Birdies Data

1. Visit the 18Birdies data export page:
   ```
   https://18birdies.com/download-account-data/
   ```

2. Log in with your 18Birdies account if prompted.

3. Request and download your account data.

4. The downloaded file will be a ZIP archive. Extract it to access your data.

5. Replace the existing 18Birdies data file with your new data:
   - Source: Your extracted data file
   - Destination: `public/data/18Birdies_archive.json`

6. Restart your development server to see the updated data.

### Troubleshooting 18Birdies Data

- If the data format has changed, you may need to update the parsing logic in `src/components/18BirdiesStats.astro`.
- Ensure the JSON file is valid and properly formatted.
- Check that the file contains all required fields: `accountData`, `activityData`, and `clubData`.

## Goodreads

Goodreads data is stored locally in a CSV file exported from your Goodreads account.

### Updating Goodreads Data

1. Visit the Goodreads library export page:
   ```
   https://www.goodreads.com/review/import
   ```

2. Log in with your Goodreads account if prompted.

3. In the "Export" section, click "Export Library".

4. Wait for the export to complete and download the CSV file.

5. Replace the existing Goodreads data file with your new export:
   - Source: Your downloaded CSV file
   - Destination: `public/data/goodreads_library_export.csv`

6. Restart your development server to see the updated data.

### Troubleshooting Goodreads Data

- If the CSV format has changed, you may need to update the parsing logic in `src/components/GoodreadsStats.astro`.
- Ensure the CSV file is properly formatted and includes all required columns.
- Required columns include: `Book Id`, `Title`, `Author`, `ISBN13`, `My Rating`, `Average Rating`, `Number of Pages`, `Year Published`, `Date Read`, `Date Added`, and `Exclusive Shelf`.

## General Troubleshooting

If you encounter issues after updating any of the data sources:

1. Check your browser console for error messages.
2. Verify that your `.env` file contains all required credentials.
3. Ensure all data files are in the correct format and location.
4. Clear your browser cache and restart your development server.
5. Check the API endpoint responses for specific error messages:
   - `/api/spotify-stats.json`
   - `/api/strava-stats.json`
