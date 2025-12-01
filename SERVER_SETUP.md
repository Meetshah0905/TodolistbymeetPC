# Focus List - Local Server

## Starting the App

To avoid YouTube API errors (Error 153), run the app on a local web server instead of opening HTML files directly:

### Option 1: Using Python (Recommended)
1. Open a terminal in this directory
2. Run: `python -m http.server 8000`
3. Open your browser to: `http://localhost:8000/AssetViewer/background-music.html`

Or simply double-click `start-server.bat` (Windows)

### Option 2: Using Node.js
1. Install http-server: `npm install -g http-server`
2. Run: `http-server -p 8000`
3. Open your browser to: `http://localhost:8000/AssetViewer/background-music.html`

### Option 3: Using VS Code
1. Install "Live Server" extension
2. Right-click on `background-music.html` and select "Open with Live Server"

## Why?

The YouTube IFrame API requires a proper HTTP origin and doesn't work well with the `file://` protocol. Running a local server solves this issue.

## Troubleshooting

If you still see "Error 153":
- Make sure you're accessing via `http://localhost` not `file://`
- Clear your browser cache
- Try a different video from the list
- Check browser console for detailed error messages
