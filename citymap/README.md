# City Map - Printable Maps

A web application for creating printable city maps with customizable styles, frames, and text overlays.

## Features

- **Interactive Map**: Mapbox-powered map with city search
- **City Search**: Search and fly to any city worldwide
- **Style Selection**: Choose from 8 different map styles (Streets, Outdoors, Light, Dark, Satellite, etc.)
- **Frame Gallery**: Add decorative frames to your map (Minimal, Vintage, Ornate, Modern, Classic)
- **Text Editor**: Add custom text with adjustable size, color, font, and position
- **Export Options**: Export maps as high-resolution PDF, JPG, PNG, or BMP files

## Setup

1. **Update Mapbox Token**: Open `app.js` and replace the `mapboxgl.accessToken` with your own Mapbox access token:
   ```javascript
   mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';
   ```

2. **Access the Page**: Navigate to `rewaza.github.io/citymap` after pushing to GitHub

## Usage

1. **Search for a City**: Use the city search field at the top to find and navigate to any city
2. **Select Style**: Click "Select Style" to choose a map style
3. **Add Frame**: Click "Frame Gallery" to add a decorative frame
4. **Add Text**: Click "Add Text" to add custom text overlays
5. **Export**: Click "Print / Export" to save your map in your preferred format

## Notes

- The map starts zoomed out and automatically flies to Boston, MA on page load
- All exports are generated at 2400x1800 pixels for high resolution
- Text elements can be positioned anywhere on the map using percentage-based coordinates

