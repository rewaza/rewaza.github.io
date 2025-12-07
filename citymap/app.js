// Mapbox access token - Replace with your own token
mapboxgl.accessToken = 'pk.eyJ1IjoidGFudGFua3V6IiwiYSI6ImNrNzJ6YjhxMjAzeHQzZXBmOGNobHJ4ZTQifQ.EzlLcvfk8rBbTNLqBE68fQ';

// Initialize map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-71.0589, 42.3601], // Boston, MA
    zoom: 1, // Start zoomed out
    projection: 'globe',
    preserveDrawingBuffer: true // Enable for better export quality
});

// State management
const state = {
    currentStyle: 'mapbox://styles/mapbox/streets-v12',
    currentFrame: 'none',
    textElements: [],
    mapInstance: null,
    studioMode: false,
    studioMap: null,
    studioTextStyles: {
        cityName: { size: 72, font: 'Arial', color: '#000000' },
        stateName: { size: 32, font: 'Arial', color: '#000000' },
        coordinates: { size: 20, font: 'Arial', color: '#000000' }
    },
    studioVisibility: {
        cityName: true,
        stateName: true,
        coordinates: true,
        frame: true,
        mapShape: true,
        mapFrame: true
    },
    mapShape: 'rectangle', // rectangle, square, circle, oval, triangle, trapezoid, rhombus, pentagon, octagon, vintage
    mapShapeSize: 80, // Percentage size of map shape (30-100%)
    frameOpacity: 100,
    frameThickness: 50, // Default thickness in pixels
    mapFrame: 'none', // Frame style for map container
    mapFrameOpacity: 100,
    mapFrameThickness: 50,
    resizeMode: 'proportional', // 'proportional' or 'freeform'
    zoomLevel: 1, // Current zoom level (1 = fit to screen)
    minZoom: 0.1,
    maxZoom: 3,
    gridVisible: false,
    gridSize: 50, // Grid size in pixels
    gridColor: '#cccccc',
    snapToGrid: true,
    backgroundColor: '#faf8f3',
    posterFrameColor: '#654321',
    mapFrameColor: '#654321',
    posterOrientation: 'portrait', // 'portrait' or 'landscape'
    posterSize: '24x36', // Default to 24x36 inches
    posterSizes: {
        // 2:3 Ratio sizes (width x height in inches at 300 DPI)
        '8x12': { width: 8, height: 12, ratio: '2:3' },
        '12x18': { width: 12, height: 18, ratio: '2:3' },
        '16x24': { width: 16, height: 24, ratio: '2:3' },
        '20x30': { width: 20, height: 30, ratio: '2:3' },
        '24x36': { width: 24, height: 36, ratio: '2:3' },
        '30x45': { width: 30, height: 45, ratio: '2:3' },
        // Other common sizes
        '11x14': { width: 11, height: 14, ratio: '4:5' },
        '18x24': { width: 18, height: 24, ratio: '3:4' },
        '27x40': { width: 27, height: 40, ratio: '27:40' },
        // ISO A Series (in mm, converted to inches)
        'A4': { width: 8.27, height: 11.69, ratio: '1:√2' },
        'A3': { width: 11.69, height: 16.54, ratio: '1:√2' },
        'A2': { width: 16.54, height: 23.39, ratio: '1:√2' },
        'A1': { width: 23.39, height: 33.11, ratio: '1:√2' },
        'A0': { width: 33.11, height: 46.81, ratio: '1:√2' },
        // Custom placeholder
        'custom': { width: 24, height: 36, ratio: 'custom' }
    },
    currentCity: {
        name: 'BOSTON',
        state: 'MASSACHUSETTS',
        coordinates: { lat: 42.3601, lng: -71.0589 }
    }
};

// Load saved city from localStorage on page load
function loadSavedCity() {
    const saved = localStorage.getItem('citymap_currentCity');
    if (saved) {
        try {
            const cityData = JSON.parse(saved);
            state.currentCity = cityData;
            return cityData;
        } catch (e) {
            console.error('Error loading saved city:', e);
        }
    }
    return null;
}

// Save current city to localStorage
function saveCurrentCity() {
    localStorage.setItem('citymap_currentCity', JSON.stringify(state.currentCity));
}

// Initialize geocoder
const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    marker: false,
    placeholder: 'Search for a city...',
    proximity: {
        longitude: -71.0589,
        latitude: 42.3601
    }
});

// Add geocoder to the map
document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

// Fly to Boston on initial page load (shows globe then flies in)
map.on('load', () => {
    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Start from globe view (zoom: 1) and fly to Boston
    setTimeout(() => {
        map.flyTo({
            center: [state.currentCity.coordinates.lng, state.currentCity.coordinates.lat],
            zoom: 11,
            duration: 3000,
            essential: true
        });
    }, 500);
    
    state.mapInstance = map;
});

// Handle geocoder result
geocoder.on('result', (e) => {
    const result = e.result;
    const center = result.center;
    const bbox = result.bbox;
    
    // Extract city information from geocoder result
    const context = result.context || [];
    let cityName = '';
    let stateName = '';
    
    // Try to find city and state from context
    for (let i = context.length - 1; i >= 0; i--) {
        const item = context[i];
        if (item.id && item.id.startsWith('place')) {
            cityName = item.text || result.text || '';
        }
        if (item.id && item.id.startsWith('region')) {
            stateName = item.text || '';
        }
        if (item.id && item.id.startsWith('country')) {
            // If no state found, use country as fallback
            if (!stateName) {
                stateName = item.text || '';
            }
        }
    }
    
    // Fallback: use the main text if no city found
    if (!cityName) {
        cityName = result.text || 'UNKNOWN';
    }
    
    // Update state with current city info
    state.currentCity = {
        name: cityName.toUpperCase(),
        state: stateName.toUpperCase() || '',
        coordinates: { lat: center[1], lng: center[0] }
    };
    
    // Save to localStorage
    saveCurrentCity();
    
    // Update studio if active
    if (state.studioMode && state.studioMap) {
        updateStudioTexts();
    }
    
    // Fly to the selected city
    if (bbox) {
        map.fitBounds(bbox, {
            padding: 50,
            duration: 2000
        });
    } else {
        map.flyTo({
            center: center,
            zoom: 11,
            duration: 2000
        });
    }
});

// Style, Frame, Text, and Print buttons removed from main page
// These features are now only available in Studio mode

// Placeholder variables for compatibility (some code may reference these)
const styleMenu = { classList: { add: () => {}, toggle: () => {} } };
const frameMenu = { classList: { add: () => {}, toggle: () => {} } };
const exportMenu = { classList: { add: () => {}, toggle: () => {} } };

// Export function (now only used from Studio mode)
async function exportMap(format) {
    // Show loading (printBtn may not exist if called from main page)
    const printBtn = document.getElementById('print-btn');
    if (printBtn) {
        printBtn.textContent = 'Exporting...';
        printBtn.disabled = true;
    }
    
    try {
        // Get current map state
        const center = map.getCenter();
        const zoom = map.getZoom();
        
        // Create a temporary container for the printable map
        const printableContainer = document.getElementById('printable-container');
        const printableContent = document.getElementById('printable-content');
        const mapPrint = document.getElementById('map-print');
        const frameOverlay = document.getElementById('frame-overlay');
        const textOverlay = document.getElementById('text-overlay');
        const cityInfo = document.getElementById('city-info');
        const cityNameEl = document.getElementById('city-name');
        const stateNameEl = document.getElementById('state-name');
        const coordinatesEl = document.getElementById('coordinates');
        
        // Set dimensions for high-resolution export based on poster size
        const exportDims = getExportDimensions();
        const width = exportDims.width;
        const height = exportDims.height;
        
        printableContainer.style.width = width + 'px';
        printableContainer.style.height = height + 'px';
        printableContent.style.width = width + 'px';
        printableContent.style.height = height + 'px';
        
        // Apply background color
        printableContent.style.backgroundColor = state.backgroundColor;
        
        // Apply frame
        frameOverlay.className = 'frame-overlay';
        if (state.currentFrame !== 'none') {
            frameOverlay.classList.add(`frame-${state.currentFrame}`);
            // Apply custom poster frame color and thickness
            if (state.currentFrame !== 'vintage-paper') {
                frameOverlay.style.borderWidth = state.frameThickness + 'px';
                frameOverlay.style.borderStyle = 'solid';
                frameOverlay.style.borderColor = state.posterFrameColor;
            }
        }
        
        // Set city information
        cityNameEl.textContent = state.currentCity.name;
        stateNameEl.textContent = state.currentCity.state;
        const lat = state.currentCity.coordinates.lat.toFixed(4);
        const lng = Math.abs(state.currentCity.coordinates.lng).toFixed(4);
        const latDir = state.currentCity.coordinates.lat >= 0 ? 'N' : 'S';
        const lngDir = state.currentCity.coordinates.lng >= 0 ? 'E' : 'W';
        coordinatesEl.textContent = `${lat}° ${latDir} / ${lng}° ${lngDir}`;
        
        // Clear any existing map
        if (mapPrint._mapboxglMap) {
            mapPrint._mapboxglMap.remove();
        }
        
        // Create a new map instance for printing
        const printMap = new mapboxgl.Map({
            container: 'map-print',
            style: state.currentStyle,
            center: [center.lng, center.lat],
            zoom: zoom,
            interactive: false,
            attributionControl: false,
            preserveDrawingBuffer: true // Important for export
        });
        
        // Store reference
        mapPrint._mapboxglMap = printMap;
        
        printMap.on('load', async () => {
            // Wait for map to fully render
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Resize map to ensure it renders properly at the printable size
            const mapArea = document.querySelector('.printable-map-area');
            const mapAreaHeight = mapArea.offsetHeight;
            printMap.resize();
            
            // Force map to fill the container
            const mapCanvas = printMap.getCanvas();
            if (mapCanvas) {
                mapCanvas.style.width = '100%';
                mapCanvas.style.height = '100%';
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Add custom text elements
            textOverlay.innerHTML = '';
            state.textElements.forEach(textEl => {
                const textDiv = document.createElement('div');
                textDiv.className = 'text-element';
                textDiv.textContent = textEl.text;
                textDiv.style.fontSize = textEl.size + 'px';
                textDiv.style.color = textEl.color;
                textDiv.style.fontFamily = textEl.font;
                textDiv.style.left = textEl.posX + '%';
                textDiv.style.top = textEl.posY + '%';
                textOverlay.appendChild(textDiv);
            });
            
            // Show printable container (positioned on-screen but hidden visually)
            printableContainer.style.position = 'fixed';
            printableContainer.style.top = '0';
            printableContainer.style.left = '0';
            printableContainer.style.width = width + 'px';
            printableContainer.style.height = height + 'px';
            printableContainer.style.zIndex = '10000';
            printableContainer.classList.remove('hidden');
            
            // Wait for rendering
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Capture with html2canvas at high resolution
            const canvas = await html2canvas(printableContent, {
                width: width,
                height: height,
                scale: 2, // Higher scale for better quality
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: width,
                windowHeight: height
            });
            
            // Hide printable container
            printableContainer.classList.add('hidden');
            printableContainer.style.position = 'fixed';
            printableContainer.style.top = '-9999px';
            printableContainer.style.left = '-9999px';
            
            // Destroy print map
            if (printMap) {
                printMap.remove();
            }
            
            // Export based on format
            if (format === 'pdf') {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'px',
                    format: [width, height]
                });
                
                const imgData = canvas.toDataURL('image/png', 1.0);
                pdf.addImage(imgData, 'PNG', 0, 0, width, height);
                pdf.save('city-map.pdf');
            } else if (format === 'bmp') {
                // Convert to BMP format
                const imgData = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = 'city-map.bmp';
                link.href = imgData;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                // Convert canvas to blob for JPG/PNG
                const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `city-map.${format}`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, mimeType, format === 'jpg' ? 0.95 : 1.0);
            }
            
            if (printBtn) {
                printBtn.textContent = 'Print / Export';
                printBtn.disabled = false;
            }
        });
        
    } catch (error) {
        console.error('Export error:', error);
        alert('Error exporting map. Please try again.');
        if (printBtn) {
            printBtn.textContent = 'Print / Export';
            printBtn.disabled = false;
        }
    }
}

// Menu Toggle
const menuToggle = document.getElementById('menu-toggle');
const controlPanel = document.getElementById('control-panel');
let menuOverlay = null;

function createMenuOverlay() {
    if (!menuOverlay) {
        menuOverlay = document.createElement('div');
        menuOverlay.className = 'menu-overlay';
        menuOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
            display: none;
        `;
        menuOverlay.addEventListener('click', closeMenu);
        document.body.appendChild(menuOverlay);
    }
    return menuOverlay;
}

function openMenu() {
    if (window.innerWidth <= 768) {
        controlPanel.classList.add('open');
        const overlay = createMenuOverlay();
        overlay.style.display = 'block';
    } else {
        controlPanel.classList.remove('hidden-desktop');
    }
    menuToggle.classList.add('active');
}

function closeMenu() {
    if (window.innerWidth <= 768) {
        controlPanel.classList.remove('open');
        if (menuOverlay) {
            menuOverlay.style.display = 'none';
        }
    } else {
        controlPanel.classList.add('hidden-desktop');
    }
    menuToggle.classList.remove('active');
}

// Initialize menu toggle after DOM is ready
if (menuToggle && controlPanel) {
    menuToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const isMobile = window.innerWidth <= 768;
        const isOpen = isMobile 
            ? controlPanel.classList.contains('open')
            : !controlPanel.classList.contains('hidden-desktop');
        
        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });
}

// Close menu when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
        if (!controlPanel.contains(e.target) && !menuToggle.contains(e.target) && controlPanel.classList.contains('open')) {
            closeMenu();
        }
    }
});

// Close menu on window resize if switching to desktop
window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && controlPanel.classList.contains('open')) {
        closeMenu();
    }
});

// Refresh button - reset to Boston with globe animation
const refreshBtn = document.getElementById('refresh-btn');
refreshBtn.addEventListener('click', () => {
    // Reset to Boston, MA (default location)
    const bostonCoords = { lat: 42.3601, lng: -71.0589 };
    
    // Update state with Boston info
    state.currentCity = {
        name: 'BOSTON',
        state: 'MASSACHUSETTS',
        coordinates: bostonCoords
    };
    
    // First zoom out to show globe
    map.flyTo({
        center: [bostonCoords.lng, bostonCoords.lat],
        zoom: 1,
        duration: 1500,
        essential: true
    });
    
    // Then fly back to Boston after showing globe
    setTimeout(() => {
        map.flyTo({
            center: [bostonCoords.lng, bostonCoords.lat],
            zoom: 11,
            duration: 3000,
            essential: true
        });
    }, 1800);
    
    // Save Boston as current city
    saveCurrentCity();
});

// Studio Mode Functions
const studioMode = document.getElementById('studio-mode');
const studioBtn = document.getElementById('studio-btn');
const exitStudioBtn = document.getElementById('exit-studio-btn');
const studioSaveBtn = document.getElementById('studio-save-btn');
const studioPrintBtn = document.getElementById('studio-print-btn');

// Update studio text displays
function updateStudioTexts() {
    const cityNameEl = document.getElementById('studio-city-name');
    const stateNameEl = document.getElementById('studio-state-name');
    const coordinatesEl = document.getElementById('studio-coordinates');
    
    if (cityNameEl && !cityNameEl.matches(':focus')) {
        cityNameEl.textContent = state.currentCity.name;
    }
    if (stateNameEl && !stateNameEl.matches(':focus')) {
        stateNameEl.textContent = state.currentCity.state;
    }
    
    if (state.studioMap && coordinatesEl) {
        const center = state.studioMap.getCenter();
        const lat = center.lat.toFixed(4);
        const lng = Math.abs(center.lng).toFixed(4);
        const latDir = center.lat >= 0 ? 'N' : 'S';
        const lngDir = center.lng >= 0 ? 'E' : 'W';
        if (!coordinatesEl.matches(':focus')) {
            coordinatesEl.textContent = `${lat}° ${latDir} / ${lng}° ${lngDir}`;
        }
    }
}

// Apply text styles to studio elements
function applyStudioTextStyles() {
    const cityNameEl = document.getElementById('studio-city-name');
    const stateNameEl = document.getElementById('studio-state-name');
    const coordinatesEl = document.getElementById('studio-coordinates');
    
    const cityStyle = state.studioTextStyles.cityName;
    const stateStyle = state.studioTextStyles.stateName;
    const coordStyle = state.studioTextStyles.coordinates;
    
    if (cityNameEl) {
        cityNameEl.style.fontSize = cityStyle.size + 'px';
        cityNameEl.style.fontFamily = cityStyle.font;
        cityNameEl.style.color = cityStyle.color;
    }
    
    if (stateNameEl) {
        stateNameEl.style.fontSize = stateStyle.size + 'px';
        stateNameEl.style.fontFamily = stateStyle.font;
        stateNameEl.style.color = stateStyle.color;
    }
    
    if (coordinatesEl) {
        coordinatesEl.style.fontSize = coordStyle.size + 'px';
        coordinatesEl.style.fontFamily = coordStyle.font;
        coordinatesEl.style.color = coordStyle.color;
    }
}

// Initialize Studio Mode
function initStudioMode() {
    const studioMapContainer = document.getElementById('studio-map');
    
    // Destroy existing map if any
    if (state.studioMap) {
        state.studioMap.remove();
        state.studioMap = null;
    }
    
    // Create studio map
    const center = map.getCenter();
    const zoom = map.getZoom();
    
    state.studioMap = new mapboxgl.Map({
        container: 'studio-map',
        style: state.currentStyle,
        center: [center.lng, center.lat],
        zoom: zoom,
        interactive: true,
        preserveDrawingBuffer: true,
        attributionControl: false // Hide attribution
    });
    
    // Navigation controls removed for cleaner poster preview
    
    // Update coordinates when map moves
    state.studioMap.on('moveend', () => {
        updateStudioTexts();
    });
    
    state.studioMap.on('load', () => {
        // Resize map to ensure it renders properly
        setTimeout(() => {
            state.studioMap.resize();
            updateStudioTexts();
            applyStudioTextStyles();
        }, 100);
        
        // Update coordinates continuously
        state.studioMap.on('move', () => {
            updateStudioTexts();
        });
    });
    
    // Also resize on window resize
    window.addEventListener('resize', () => {
        if (state.studioMap && state.studioMode) {
            setTimeout(() => {
                state.studioMap.resize();
            }, 100);
        }
    });
    
    // Make map container resizable and draggable
    const mapContainer = document.getElementById('studio-map-container');
    const resizeHandles = mapContainer.querySelectorAll('.map-resize-handle');
    let isDragging = false;
    let isResizing = false;
    let resizeEdge = null; // 'top', 'right', 'bottom', 'left', 'corner'
    let startX, startY, startWidth, startHeight, startCssLeft, startCssTop, startAspectRatio;
    
    // Initialize resize mode checkboxes
    const proportionalCheckbox = document.getElementById('resize-proportional');
    const freeformCheckbox = document.getElementById('resize-freeform');
    
    if (proportionalCheckbox && freeformCheckbox) {
        proportionalCheckbox.checked = state.resizeMode === 'proportional';
        freeformCheckbox.checked = state.resizeMode === 'freeform';
        
        proportionalCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                state.resizeMode = 'proportional';
                freeformCheckbox.checked = false;
            }
        });
        
        freeformCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                state.resizeMode = 'freeform';
                proportionalCheckbox.checked = false;
            }
        });
    }
    
    // Helper function to get current CSS left/top values (handles both inline and computed styles)
    function getCssPosition() {
        // First try inline styles
        let left = parseFloat(mapContainer.style.left);
        let top = parseFloat(mapContainer.style.top);
        
        // If not set inline, get computed styles
        if (isNaN(left) || isNaN(top)) {
            const computedStyle = window.getComputedStyle(mapContainer);
            left = parseFloat(computedStyle.left) || 0;
            top = parseFloat(computedStyle.top) || 0;
        }
        
        return { left, top };
    }
    
    // Helper function to get the canvas scale factor
    function getCanvasScale() {
        const canvas = document.getElementById('studio-canvas');
        if (!canvas) return 1;
        const canvasRect = canvas.getBoundingClientRect();
        return canvasRect.width / canvas.offsetWidth;
    }
    
    // Add event listeners to all resize handles
    resizeHandles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            
            // Get actual dimensions from computed style (not scaled)
            const computedStyle = window.getComputedStyle(mapContainer);
            startWidth = parseFloat(computedStyle.width) || mapContainer.offsetWidth;
            startHeight = parseFloat(computedStyle.height) || mapContainer.offsetHeight;
            
            const cssPos = getCssPosition();
            startCssLeft = cssPos.left;
            startCssTop = cssPos.top;
            startAspectRatio = startWidth / startHeight;
            
            // Determine which edge is being resized
            if (handle.classList.contains('map-resize-handle-corner')) {
                resizeEdge = 'corner';
            } else if (handle.classList.contains('map-resize-handle-top')) {
                resizeEdge = 'top';
            } else if (handle.classList.contains('map-resize-handle-right')) {
                resizeEdge = 'right';
            } else if (handle.classList.contains('map-resize-handle-bottom')) {
                resizeEdge = 'bottom';
            } else if (handle.classList.contains('map-resize-handle-left')) {
                resizeEdge = 'left';
            }
            
            e.preventDefault();
            e.stopPropagation();
        });
    });
    
    // Drag functionality - move the entire map container
    mapContainer.addEventListener('mousedown', (e) => {
        // Don't drag if clicking on the map canvas or resize handles
        if (e.target.closest('.mapboxgl-canvas') || e.target.closest('.map-resize-handle')) {
            return;
        }
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const cssPos = getCssPosition();
        startCssLeft = cssPos.left;
        startCssTop = cssPos.top;
        e.preventDefault();
        e.stopPropagation();
    });
    
    document.addEventListener('mousemove', (e) => {
        const scale = getCanvasScale();
        
        if (isDragging) {
            // Account for canvas scale when dragging
            const deltaX = (e.clientX - startX) / scale;
            const deltaY = (e.clientY - startY) / scale;
            
            // Apply snap to grid
            let newLeft = snapToGrid(startCssLeft + deltaX);
            let newTop = snapToGrid(startCssTop + deltaY);
            
            mapContainer.style.left = newLeft + 'px';
            mapContainer.style.top = newTop + 'px';
        } else if (isResizing && resizeEdge) {
            // Account for canvas scale when resizing
            const deltaX = (e.clientX - startX) / scale;
            const deltaY = (e.clientY - startY) / scale;
            
            let newWidth = startWidth;
            let newHeight = startHeight;
            let deltaLeft = 0; // Change in left position
            let deltaTop = 0;  // Change in top position
            
            if (state.resizeMode === 'proportional') {
                // Proportional resize maintains aspect ratio
                if (resizeEdge === 'corner') {
                    // Resize from bottom-right corner - top-left stays fixed
                    const scale = Math.max(0.3, Math.min(
                        (startWidth + deltaX) / startWidth,
                        (startHeight + deltaY) / startHeight
                    ));
                    newWidth = Math.max(300, startWidth * scale);
                    newHeight = Math.max(200, startHeight * scale);
                    // No position change - corner is anchored at top-left
                } else if (resizeEdge === 'top') {
                    // Resize from top edge - bottom edge stays fixed
                    const scale = Math.max(0.3, (startHeight - deltaY) / startHeight);
                    newHeight = Math.max(200, startHeight * scale);
                    newWidth = Math.max(300, startWidth * scale);
                    // Move top edge up/down, bottom stays fixed
                    deltaTop = startHeight - newHeight;
                } else if (resizeEdge === 'right') {
                    // Resize from right edge - left edge stays fixed
                    const scale = Math.max(0.3, (startWidth + deltaX) / startWidth);
                    newWidth = Math.max(300, startWidth * scale);
                    newHeight = Math.max(200, startHeight * scale);
                    // No position change - left edge stays fixed
                } else if (resizeEdge === 'bottom') {
                    // Resize from bottom edge - top edge stays fixed
                    const scale = Math.max(0.3, (startHeight + deltaY) / startHeight);
                    newHeight = Math.max(200, startHeight * scale);
                    newWidth = Math.max(300, startWidth * scale);
                    // No position change - top edge stays fixed
                } else if (resizeEdge === 'left') {
                    // Resize from left edge - right edge stays fixed
                    const scale = Math.max(0.3, (startWidth - deltaX) / startWidth);
                    newWidth = Math.max(300, startWidth * scale);
                    newHeight = Math.max(200, startHeight * scale);
                    // Move left edge, right stays fixed
                    deltaLeft = startWidth - newWidth;
                }
            } else {
                // Freeform resize - resize individual edges only
                if (resizeEdge === 'corner') {
                    // Bottom-right corner - top-left stays fixed
                    newWidth = Math.max(300, startWidth + deltaX);
                    newHeight = Math.max(200, startHeight + deltaY);
                    // No position change
                } else if (resizeEdge === 'top') {
                    // Resize from top edge only - bottom edge stays fixed
                    newHeight = Math.max(200, startHeight - deltaY);
                    // Move top edge, bottom stays fixed
                    deltaTop = startHeight - newHeight;
                } else if (resizeEdge === 'right') {
                    // Resize from right edge only - left edge stays fixed
                    newWidth = Math.max(300, startWidth + deltaX);
                    // No position change
                } else if (resizeEdge === 'bottom') {
                    // Resize from bottom edge only - top edge stays fixed
                    newHeight = Math.max(200, startHeight + deltaY);
                    // No position change
                } else if (resizeEdge === 'left') {
                    // Resize from left edge only - right edge stays fixed
                    newWidth = Math.max(300, startWidth - deltaX);
                    // Move left edge, right stays fixed
                    deltaLeft = startWidth - newWidth;
                }
            }
            
            // Apply snap to grid for sizes
            newWidth = snapToGrid(newWidth);
            newHeight = snapToGrid(newHeight);
            
            // Apply size changes
            mapContainer.style.width = newWidth + 'px';
            mapContainer.style.height = newHeight + 'px';
            
            // Apply position changes only for top/left edge resizing
            // Top edge: move the top, keep bottom fixed
            if (resizeEdge === 'top') {
                const snappedTop = snapToGrid(startCssTop + deltaTop);
                mapContainer.style.top = snappedTop + 'px';
            }
            // Left edge: move the left, keep right fixed
            if (resizeEdge === 'left') {
                const snappedLeft = snapToGrid(startCssLeft + deltaLeft);
                mapContainer.style.left = snappedLeft + 'px';
            }
            
            // Resize the map to fit new container
            if (state.studioMap) {
                setTimeout(() => state.studioMap.resize(), 50);
            }
        }
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
        isResizing = false;
        resizeEdge = null;
    });
    
    // Update frame
    updateStudioFrame();
    
    // Apply initial map shape
    const initialMapContainer = document.getElementById('studio-map-container');
    if (initialMapContainer && state.mapShape !== 'rectangle') {
        initialMapContainer.classList.add(`shape-${state.mapShape}`);
    }
    
    // Apply initial map shape size
    applyMapShapeSize();
    
    // Apply initial map frame
    updateMapFrame();
}

// Update studio frame
function updateStudioFrame() {
    const frameOverlay = document.getElementById('studio-frame-overlay');
    const canvas = document.getElementById('studio-canvas');
    if (!frameOverlay || !canvas) return;
    
    frameOverlay.className = 'studio-frame-overlay';
    
    // Only show frame if frame visibility is enabled
    if (state.studioVisibility.frame && state.currentFrame !== 'none') {
        frameOverlay.classList.add(`frame-${state.currentFrame}`);
        frameOverlay.style.display = 'block';
        // Apply opacity
        frameOverlay.style.opacity = state.frameOpacity / 100;
        
        // Apply thickness (except for vintage-paper which doesn't use border)
        if (state.currentFrame !== 'vintage-paper') {
            const thickness = state.frameThickness;
            const thicknessPx = thickness + 'px';
            // Use custom poster frame color
            const borderColor = state.posterFrameColor || '#654321';
            frameOverlay.style.borderWidth = thicknessPx;
            frameOverlay.style.borderStyle = 'solid';
            frameOverlay.style.borderColor = borderColor;
        } else {
            // Reset border for vintage-paper
            frameOverlay.style.borderWidth = '';
            frameOverlay.style.borderStyle = '';
            frameOverlay.style.borderColor = '';
        }
    } else {
        frameOverlay.style.display = 'none';
    }
    
    // Resize map after frame changes
    if (state.studioMap) {
        setTimeout(() => {
            state.studioMap.resize();
        }, 100);
    }
}

// Update studio element visibility
function updateStudioVisibility() {
    const cityNameEl = document.getElementById('studio-city-name');
    const stateNameEl = document.getElementById('studio-state-name');
    const coordinatesEl = document.getElementById('studio-coordinates');
    const mapContainer = document.getElementById('studio-map-container');
    
    if (cityNameEl) {
        cityNameEl.style.display = state.studioVisibility.cityName ? 'inline-block' : 'none';
    }
    if (stateNameEl) {
        stateNameEl.style.display = state.studioVisibility.stateName ? 'inline-block' : 'none';
    }
    if (coordinatesEl) {
        coordinatesEl.style.display = state.studioVisibility.coordinates ? 'inline-block' : 'none';
    }
    if (mapContainer) {
        // If map shape visibility is disabled, show as rectangle
        if (!state.studioVisibility.mapShape) {
            mapContainer.className = 'studio-map-container';
        } else if (state.mapShape !== 'rectangle') {
            mapContainer.className = 'studio-map-container';
            mapContainer.classList.add(`shape-${state.mapShape}`);
        } else {
            // Ensure rectangle shape is applied correctly
            mapContainer.className = 'studio-map-container';
        }
        
        // Apply map shape size
        applyMapShapeSize();
        
        // Resize map after shape change to fill container properly
        if (state.studioMap) {
            setTimeout(() => {
                state.studioMap.resize();
            }, 100);
        }
    }
    
    updateStudioFrame();
    updateMapFrame();
}

// Apply map shape size
function applyMapShapeSize() {
    const mapContainer = document.getElementById('studio-map-container');
    if (!mapContainer) return;
    
    if (state.studioVisibility.mapShape) {
        // Apply size as scale transform or width/height based on shape
        const sizePercent = state.mapShapeSize / 100;
        
        // For shapes that use percentage widths, adjust them
        if (state.mapShape === 'rectangle') {
            mapContainer.style.width = (80 * sizePercent) + '%';
            mapContainer.style.height = (60 * sizePercent) + '%';
        } else if (state.mapShape === 'square' || state.mapShape === 'circle') {
            const baseSize = 60;
            mapContainer.style.width = (baseSize * sizePercent) + '%';
            mapContainer.style.height = (baseSize * sizePercent) + '%';
        } else if (state.mapShape === 'oval') {
            mapContainer.style.width = (70 * sizePercent) + '%';
            mapContainer.style.height = (50 * sizePercent) + '%';
        } else {
            // For other shapes, use transform scale
            mapContainer.style.transform = `scale(${sizePercent})`;
            mapContainer.style.transformOrigin = 'center';
        }
    }
}

// Update map frame
function updateMapFrame() {
    const mapFrameOverlay = document.getElementById('studio-map-frame-overlay');
    const mapContainer = document.getElementById('studio-map-container');
    if (!mapFrameOverlay || !mapContainer) return;
    
    mapFrameOverlay.className = 'studio-map-frame-overlay';
    
    // Remove previous frame classes from container and reset styles
    mapContainer.classList.remove('has-map-frame', 'frame-minimal', 'frame-vintage', 'frame-ornate', 'frame-modern', 'frame-classic', 'frame-vintage-paper');
    mapContainer.style.filter = '';
    mapContainer.style.overflow = 'hidden'; // Reset to default
    mapContainer.style.removeProperty('--frame-thickness');
    mapContainer.style.removeProperty('--frame-color');
    
    // Check if current shape uses clip-path
    const clipPathShapes = ['triangle', 'trapezoid', 'rhombus', 'pentagon', 'octagon'];
    const isClipPathShape = clipPathShapes.some(shape => mapContainer.classList.contains(`shape-${shape}`));
    
    // Only show frame if map frame visibility is enabled
    if (state.studioVisibility.mapFrame && state.mapFrame !== 'none') {
        mapFrameOverlay.classList.add(`frame-${state.mapFrame}`);
        mapFrameOverlay.style.display = 'block';
        // Apply opacity
        mapFrameOverlay.style.opacity = state.mapFrameOpacity / 100;
        
        // Add frame classes to container for clip-path shapes
        mapContainer.classList.add('has-map-frame', `frame-${state.mapFrame}`);
        
        // Use custom map frame color
        const borderColor = state.mapFrameColor || '#654321';
        
        // Apply thickness (except for vintage-paper which doesn't use border)
        if (state.mapFrame !== 'vintage-paper') {
            const thickness = state.mapFrameThickness;
            const thicknessPx = thickness + 'px';
            
            if (isClipPathShape) {
                // For clip-path shapes, use CSS custom properties for pseudo-element frame
                mapContainer.style.setProperty('--frame-thickness', thicknessPx);
                mapContainer.style.setProperty('--frame-color', borderColor);
                mapContainer.style.padding = '0';
                mapContainer.style.overflow = 'visible';
            } else {
                // For regular shapes, use border
                mapFrameOverlay.style.borderWidth = thicknessPx;
                mapFrameOverlay.style.borderStyle = 'solid';
                mapFrameOverlay.style.borderColor = borderColor;
                // Adjust map container padding to account for frame thickness (internal borders)
                mapContainer.style.padding = thicknessPx;
                mapContainer.style.overflow = 'hidden';
            }
        } else {
            // Reset border for vintage-paper
            mapFrameOverlay.style.borderWidth = '';
            mapFrameOverlay.style.borderStyle = '';
            mapFrameOverlay.style.borderColor = '';
            mapContainer.style.padding = '0';
        }
    } else {
        mapFrameOverlay.style.display = 'none';
        // Reset padding when frame is hidden
        mapContainer.style.padding = '0';
    }
    
    // Resize map after frame changes
    if (state.studioMap) {
        setTimeout(() => {
            state.studioMap.resize();
        }, 100);
    }
}

// Studio button click
studioBtn.addEventListener('click', () => {
    state.studioMode = true;
    studioMode.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Reset zoom level when entering studio
    state.zoomLevel = 1;
    
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            // Initialize canvas first
            updateStudioCanvas();
            
            // Then initialize map and controls
            initStudioMode();
            initStudioMenuToggle();
            initStudioToggles();
            initZoomControls();
            initDraggableTexts();
            updateStudioVisibility();
            applyBackgroundColor();
            updatePosterSizeDisplay();
            
            // Update canvas again after all elements are initialized
            setTimeout(() => {
                updateStudioCanvas();
            }, 300);
        });
    });
});

// Exit studio
exitStudioBtn.addEventListener('click', () => {
    state.studioMode = false;
    studioMode.classList.add('hidden');
    document.body.style.overflow = '';
    if (state.studioMap) {
        state.studioMap.remove();
        state.studioMap = null;
    }
});

// Studio Menu Toggle
function initStudioMenuToggle() {
    const studioMenuToggle = document.getElementById('studio-menu-toggle');
    const studioControls = document.getElementById('studio-controls');
    let studioMenuOverlay = null;
    
    function createStudioMenuOverlay() {
        if (!studioMenuOverlay) {
            studioMenuOverlay = document.createElement('div');
            studioMenuOverlay.className = 'studio-menu-overlay';
            studioMenuOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 2000;
                display: none;
            `;
            studioMenuOverlay.addEventListener('click', closeStudioMenu);
            document.body.appendChild(studioMenuOverlay);
        }
        return studioMenuOverlay;
    }
    
    function openStudioMenu() {
        if (window.innerWidth <= 768) {
            studioControls.classList.add('open');
            const overlay = createStudioMenuOverlay();
            overlay.style.display = 'block';
        } else {
            studioControls.classList.remove('hidden-desktop');
            // Add margin to preview wrapper when menu opens
            const previewWrapper = document.querySelector('.studio-preview-wrapper');
            if (previewWrapper) {
                previewWrapper.style.marginRight = '350px';
            }
            // Resize canvas and map after margin change
            setTimeout(() => {
                updateStudioCanvas();
            }, 350); // Wait for CSS transition to complete
        }
        studioMenuToggle.classList.add('active');
    }
    
    function closeStudioMenu() {
        if (window.innerWidth <= 768) {
            studioControls.classList.remove('open');
            if (studioMenuOverlay) {
                studioMenuOverlay.style.display = 'none';
            }
        } else {
            studioControls.classList.add('hidden-desktop');
            // Remove margin from preview wrapper when menu closes
            const previewWrapper = document.querySelector('.studio-preview-wrapper');
            if (previewWrapper) {
                previewWrapper.style.marginRight = '0';
            }
            // Resize canvas and map after margin change
            setTimeout(() => {
                updateStudioCanvas();
            }, 350); // Wait for CSS transition to complete
        }
        studioMenuToggle.classList.remove('active');
    }
    
    if (studioMenuToggle && studioControls) {
        studioMenuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const isMobile = window.innerWidth <= 768;
            const isOpen = isMobile 
                ? studioControls.classList.contains('open')
                : !studioControls.classList.contains('hidden-desktop');
            
            if (isOpen) {
                closeStudioMenu();
            } else {
                openStudioMenu();
            }
        });
        
        // Close menu when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && state.studioMode) {
                if (!studioControls.contains(e.target) && !studioMenuToggle.contains(e.target) && studioControls.classList.contains('open')) {
                    closeStudioMenu();
                }
            }
        });
        
        // Close menu on window resize
        window.addEventListener('resize', () => {
            if (state.studioMode) {
                if (window.innerWidth > 768 && studioControls.classList.contains('open')) {
                    closeStudioMenu();
                }
            }
        });
    }
}

// Studio text controls
const citySizeSlider = document.getElementById('city-size');
const citySizeValue = document.getElementById('city-size-value');
const cityFontSelect = document.getElementById('city-font');
const cityColorInput = document.getElementById('city-color');

citySizeSlider.addEventListener('input', (e) => {
    state.studioTextStyles.cityName.size = parseInt(e.target.value);
    citySizeValue.textContent = e.target.value + 'px';
    applyStudioTextStyles();
});

cityFontSelect.addEventListener('change', (e) => {
    state.studioTextStyles.cityName.font = e.target.value;
    applyStudioTextStyles();
});

cityColorInput.addEventListener('input', (e) => {
    state.studioTextStyles.cityName.color = e.target.value;
    applyStudioTextStyles();
});

const stateSizeSlider = document.getElementById('state-size');
const stateSizeValue = document.getElementById('state-size-value');
const stateFontSelect = document.getElementById('state-font');
const stateColorInput = document.getElementById('state-color');

stateSizeSlider.addEventListener('input', (e) => {
    state.studioTextStyles.stateName.size = parseInt(e.target.value);
    stateSizeValue.textContent = e.target.value + 'px';
    applyStudioTextStyles();
});

stateFontSelect.addEventListener('change', (e) => {
    state.studioTextStyles.stateName.font = e.target.value;
    applyStudioTextStyles();
});

stateColorInput.addEventListener('input', (e) => {
    state.studioTextStyles.stateName.color = e.target.value;
    applyStudioTextStyles();
});

const coordSizeSlider = document.getElementById('coord-size');
const coordSizeValue = document.getElementById('coord-size-value');
const coordFontSelect = document.getElementById('coord-font');
const coordColorInput = document.getElementById('coord-color');

coordSizeSlider.addEventListener('input', (e) => {
    state.studioTextStyles.coordinates.size = parseInt(e.target.value);
    coordSizeValue.textContent = e.target.value + 'px';
    applyStudioTextStyles();
});

coordFontSelect.addEventListener('change', (e) => {
    state.studioTextStyles.coordinates.font = e.target.value;
    applyStudioTextStyles();
});

coordColorInput.addEventListener('input', (e) => {
    state.studioTextStyles.coordinates.color = e.target.value;
    applyStudioTextStyles();
});

// Background color picker
const backgroundColorInput = document.getElementById('background-color');
if (backgroundColorInput) {
    backgroundColorInput.value = state.backgroundColor;
    backgroundColorInput.addEventListener('input', (e) => {
        state.backgroundColor = e.target.value;
        applyBackgroundColor();
    });
}

// Poster frame color picker
const posterFrameColorInput = document.getElementById('poster-frame-color');
if (posterFrameColorInput) {
    posterFrameColorInput.value = state.posterFrameColor;
    posterFrameColorInput.addEventListener('input', (e) => {
        state.posterFrameColor = e.target.value;
        updateStudioFrame();
    });
}

// Map frame color picker
const mapFrameColorInput = document.getElementById('map-frame-color');
if (mapFrameColorInput) {
    mapFrameColorInput.value = state.mapFrameColor;
    mapFrameColorInput.addEventListener('input', (e) => {
        state.mapFrameColor = e.target.value;
        updateMapFrame();
    });
}

// Apply background color function
function applyBackgroundColor() {
    const canvas = document.getElementById('studio-canvas');
    if (canvas) {
        canvas.style.backgroundColor = state.backgroundColor;
    }
}

// Poster size controls
const posterSizeSelect = document.getElementById('poster-size-select');
const orientationPortrait = document.getElementById('orientation-portrait');
const orientationLandscape = document.getElementById('orientation-landscape');
const customSizeInputs = document.getElementById('custom-size-inputs');
const customWidthInput = document.getElementById('custom-width');
const customHeightInput = document.getElementById('custom-height');
const posterDimensionsDisplay = document.getElementById('poster-dimensions');
const posterRatioDisplay = document.getElementById('poster-ratio');

// Update poster size display
function updatePosterSizeDisplay() {
    const sizeData = state.posterSizes[state.posterSize];
    if (!sizeData) return;
    
    let width = sizeData.width;
    let height = sizeData.height;
    
    // Swap for landscape
    if (state.posterOrientation === 'landscape') {
        [width, height] = [height, width];
    }
    
    // Format display
    if (state.posterSize.startsWith('A')) {
        posterDimensionsDisplay.textContent = `${width.toFixed(2)}" × ${height.toFixed(2)}"`;
    } else {
        posterDimensionsDisplay.textContent = `${width}" × ${height}"`;
    }
    posterRatioDisplay.textContent = `(${sizeData.ratio})`;
    
    // Update preview aspect ratio
    updatePreviewAspectRatio();
}

// Get canvas dimensions (using a reasonable base size for display)
function getCanvasDimensions() {
    const sizeData = state.posterSizes[state.posterSize];
    if (!sizeData) return { width: 800, height: 1200 };
    
    let width = sizeData.width;
    let height = sizeData.height;
    
    // Swap for landscape
    if (state.posterOrientation === 'landscape') {
        [width, height] = [height, width];
    }
    
    // Use a base unit of 100 pixels per inch for display (manageable size)
    const displayDPI = 100;
    return {
        width: Math.round(width * displayDPI),
        height: Math.round(height * displayDPI)
    };
}

// Update studio canvas size and scale
function updateStudioCanvas() {
    const canvas = document.getElementById('studio-canvas');
    const studioPreview = document.querySelector('.studio-preview');
    const previewWrapper = document.querySelector('.studio-preview-wrapper');
    
    if (!canvas || !previewWrapper || !studioPreview) return;
    
    // Get canvas dimensions based on poster size
    const canvasDims = getCanvasDimensions();
    
    // Set canvas to exact dimensions
    canvas.style.width = canvasDims.width + 'px';
    canvas.style.height = canvasDims.height + 'px';
    
    // Calculate base scale to fit within the preview wrapper
    const wrapperRect = previewWrapper.getBoundingClientRect();
    
    // Ensure we have valid dimensions (can be 0 on initial load or during resize)
    const wrapperWidth = Math.max(wrapperRect.width, 200);
    const wrapperHeight = Math.max(wrapperRect.height, 200);
    
    const padding = 60; // Padding around the canvas
    const availableWidth = wrapperWidth - padding;
    const availableHeight = wrapperHeight - padding;
    
    const scaleX = availableWidth / canvasDims.width;
    const scaleY = availableHeight / canvasDims.height;
    const fitScale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
    
    // Store fit scale for reference
    state.fitScale = fitScale > 0 ? fitScale : 0.5;
    
    // Apply zoom level to the fit scale
    const finalScale = state.fitScale * state.zoomLevel;
    canvas.style.transform = `scale(${finalScale})`;
    
    // Update the preview container size to match scaled canvas
    // This makes scrolling work correctly
    const scaledWidth = canvasDims.width * finalScale;
    const scaledHeight = canvasDims.height * finalScale;
    studioPreview.style.width = scaledWidth + 'px';
    studioPreview.style.height = scaledHeight + 'px';
    studioPreview.style.minWidth = scaledWidth + 'px';
    studioPreview.style.minHeight = scaledHeight + 'px';
    
    // Apply background color
    canvas.style.backgroundColor = state.backgroundColor;
    
    // Update map container position (1" margin from top/left/right, map takes 55% of height)
    updateMapContainerLayout();
    
    // Update zoom level display
    updateZoomDisplay();
    
    // Resize map after canvas change
    if (state.studioMap) {
        setTimeout(() => {
            state.studioMap.resize();
        }, 100);
    }
}

// Update zoom display
function updateZoomDisplay() {
    const zoomLevelEl = document.getElementById('zoom-level');
    if (zoomLevelEl) {
        const percentage = Math.round(state.zoomLevel * 100);
        zoomLevelEl.textContent = percentage + '%';
    }
}

// Zoom functions
function zoomIn() {
    const newZoom = Math.min(state.zoomLevel * 1.25, state.maxZoom);
    state.zoomLevel = newZoom;
    updateStudioCanvas();
}

function zoomOut() {
    const newZoom = Math.max(state.zoomLevel / 1.25, state.minZoom);
    state.zoomLevel = newZoom;
    updateStudioCanvas();
}

function zoomFit() {
    state.zoomLevel = 1;
    updateStudioCanvas();
}

function zoomActual() {
    // Calculate zoom to show at actual pixel size (100%)
    // This means 1 canvas pixel = 1 screen pixel
    if (state.fitScale) {
        state.zoomLevel = 1 / state.fitScale;
        // Cap at max zoom
        state.zoomLevel = Math.min(state.zoomLevel, state.maxZoom);
        updateStudioCanvas();
    }
}

// Initialize zoom controls
function initZoomControls() {
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const zoomFitBtn = document.getElementById('zoom-fit-btn');
    const zoom100Btn = document.getElementById('zoom-100-btn');
    const previewWrapper = document.getElementById('studio-preview-wrapper');
    
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', zoomIn);
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', zoomOut);
    }
    
    if (zoomFitBtn) {
        zoomFitBtn.addEventListener('click', zoomFit);
    }
    
    if (zoom100Btn) {
        zoom100Btn.addEventListener('click', zoomActual);
    }
    
    // Mouse wheel zoom
    if (previewWrapper) {
        previewWrapper.addEventListener('wheel', (e) => {
            // Only zoom if Ctrl is held or on trackpad (pinch gesture)
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                
                if (e.deltaY < 0) {
                    zoomIn();
                } else {
                    zoomOut();
                }
            }
        }, { passive: false });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (!state.studioMode) return;
        
        // Check if we're not in an input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            return;
        }
        
        if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
            e.preventDefault();
            zoomIn();
        } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
            e.preventDefault();
            zoomOut();
        } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
            e.preventDefault();
            zoomFit();
        }
    });
}

// Update map container layout based on canvas size
function updateMapContainerLayout() {
    const canvas = document.getElementById('studio-canvas');
    const mapContainer = document.getElementById('studio-map-container');
    
    if (!canvas || !mapContainer) return;
    
    const canvasDims = getCanvasDimensions();
    
    // Calculate margins (1" = 100px at display DPI)
    const margin = 100; // 1 inch margin
    const bottomSpace = 500; // 5 inches for text at bottom
    
    // Position map container
    mapContainer.style.left = margin + 'px';
    mapContainer.style.top = margin + 'px';
    mapContainer.style.width = (canvasDims.width - margin * 2) + 'px';
    mapContainer.style.height = (canvasDims.height - margin - bottomSpace) + 'px';
    
    // Initialize text positions if not already set
    initializeTextPositions();
}

// Initialize default text positions
function initializeTextPositions() {
    const canvas = document.getElementById('studio-canvas');
    if (!canvas) return;
    
    const canvasDims = getCanvasDimensions();
    const centerX = canvasDims.width / 2;
    
    const cityNameEl = document.getElementById('studio-city-name');
    const stateNameEl = document.getElementById('studio-state-name');
    const coordinatesEl = document.getElementById('studio-coordinates');
    
    // Only set initial positions if not already positioned by user
    if (cityNameEl && !cityNameEl.dataset.userPositioned) {
        cityNameEl.style.left = centerX + 'px';
        cityNameEl.style.bottom = '280px';
        cityNameEl.style.transform = 'translateX(-50%)';
    }
    
    if (stateNameEl && !stateNameEl.dataset.userPositioned) {
        stateNameEl.style.left = centerX + 'px';
        stateNameEl.style.bottom = '180px';
        stateNameEl.style.transform = 'translateX(-50%)';
    }
    
    if (coordinatesEl && !coordinatesEl.dataset.userPositioned) {
        coordinatesEl.style.left = centerX + 'px';
        coordinatesEl.style.bottom = '100px';
        coordinatesEl.style.transform = 'translateX(-50%)';
    }
}

// Initialize draggable text elements
function initDraggableTexts() {
    const canvas = document.getElementById('studio-canvas');
    const textElements = document.querySelectorAll('.studio-text-draggable');
    
    if (!canvas) return;
    
    textElements.forEach(element => {
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        
        // Mouse down - start dragging (only if not editing text)
        element.addEventListener('mousedown', (e) => {
            // Don't drag if editing text (element has focus)
            if (document.activeElement === element) return;
            
            isDragging = true;
            element.classList.add('dragging');
            
            // Get current position
            const rect = element.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            const scale = canvasRect.width / canvas.offsetWidth;
            
            startX = e.clientX;
            startY = e.clientY;
            
            // Get current left/top position (accounting for transform)
            const computedStyle = window.getComputedStyle(element);
            const currentLeft = parseFloat(element.style.left) || (canvas.offsetWidth / 2);
            const currentTop = element.style.top ? parseFloat(element.style.top) : null;
            const currentBottom = element.style.bottom ? parseFloat(element.style.bottom) : null;
            
            // Convert bottom to top if needed
            if (currentBottom !== null && currentTop === null) {
                startTop = canvas.offsetHeight - currentBottom - element.offsetHeight;
            } else {
                startTop = currentTop || 0;
            }
            startLeft = currentLeft;
            
            // Remove centering transform when user starts dragging
            element.style.transform = 'none';
            element.dataset.userPositioned = 'true';
            
            e.preventDefault();
        });
        
        // Mouse move - drag
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const canvasRect = canvas.getBoundingClientRect();
            const scale = canvasRect.width / canvas.offsetWidth;
            
            // Calculate new position
            const deltaX = (e.clientX - startX) / scale;
            const deltaY = (e.clientY - startY) / scale;
            
            let newLeft = startLeft + deltaX;
            let newTop = startTop + deltaY;
            
            // Apply snap to grid
            newLeft = snapToGrid(newLeft);
            newTop = snapToGrid(newTop);
            
            // Constrain within canvas bounds
            const padding = 20; // Keep some padding from edges
            const maxLeft = canvas.offsetWidth - element.offsetWidth - padding;
            const maxTop = canvas.offsetHeight - element.offsetHeight - padding;
            
            newLeft = Math.max(padding, Math.min(newLeft, maxLeft));
            newTop = Math.max(padding, Math.min(newTop, maxTop));
            
            // Apply new position (use top instead of bottom for easier calculation)
            element.style.left = newLeft + 'px';
            element.style.top = newTop + 'px';
            element.style.bottom = 'auto';
        });
        
        // Mouse up - stop dragging
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.classList.remove('dragging');
            }
        });
        
        // Double click to edit text
        element.addEventListener('dblclick', () => {
            element.focus();
            // Select all text
            const range = document.createRange();
            range.selectNodeContents(element);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        });
    });
}

// Keep the old function name for compatibility but redirect to new one
function updatePreviewAspectRatio() {
    updateStudioCanvas();
}

// Get export dimensions in pixels (at 300 DPI)
function getExportDimensions() {
    const sizeData = state.posterSizes[state.posterSize];
    if (!sizeData) return { width: 2400, height: 3600 }; // Default fallback
    
    let width = sizeData.width;
    let height = sizeData.height;
    
    // Swap for landscape
    if (state.posterOrientation === 'landscape') {
        [width, height] = [height, width];
    }
    
    // Convert to pixels at 300 DPI (capped for performance)
    const dpi = 300;
    const maxDimension = 6000; // Cap at 6000px for performance
    
    let pixelWidth = Math.round(width * dpi);
    let pixelHeight = Math.round(height * dpi);
    
    // Scale down if too large
    if (pixelWidth > maxDimension || pixelHeight > maxDimension) {
        const scale = maxDimension / Math.max(pixelWidth, pixelHeight);
        pixelWidth = Math.round(pixelWidth * scale);
        pixelHeight = Math.round(pixelHeight * scale);
    }
    
    return { width: pixelWidth, height: pixelHeight };
}

if (posterSizeSelect) {
    posterSizeSelect.value = state.posterSize;
    posterSizeSelect.addEventListener('change', (e) => {
        state.posterSize = e.target.value;
        
        // Show/hide custom inputs
        if (customSizeInputs) {
            customSizeInputs.style.display = state.posterSize === 'custom' ? 'block' : 'none';
        }
        
        updatePosterSizeDisplay();
    });
}

if (orientationPortrait) {
    orientationPortrait.addEventListener('click', () => {
        state.posterOrientation = 'portrait';
        orientationPortrait.classList.add('active');
        if (orientationLandscape) orientationLandscape.classList.remove('active');
        updatePosterSizeDisplay();
    });
}

if (orientationLandscape) {
    orientationLandscape.addEventListener('click', () => {
        state.posterOrientation = 'landscape';
        orientationLandscape.classList.add('active');
        if (orientationPortrait) orientationPortrait.classList.remove('active');
        updatePosterSizeDisplay();
    });
}

if (customWidthInput) {
    customWidthInput.addEventListener('input', (e) => {
        state.posterSizes.custom.width = parseFloat(e.target.value) || 24;
        updatePosterSizeDisplay();
    });
}

if (customHeightInput) {
    customHeightInput.addEventListener('input', (e) => {
        state.posterSizes.custom.height = parseFloat(e.target.value) || 36;
        updatePosterSizeDisplay();
    });
}

// Initialize Studio Toggles
function initStudioToggles() {
    // City Name toggle
    const toggleCityName = document.getElementById('toggle-city-name');
    if (toggleCityName) {
        toggleCityName.checked = state.studioVisibility.cityName;
        toggleCityName.addEventListener('change', (e) => {
            state.studioVisibility.cityName = e.target.checked;
            updateStudioVisibility();
        });
    }
    
    // State Name toggle
    const toggleStateName = document.getElementById('toggle-state-name');
    if (toggleStateName) {
        toggleStateName.checked = state.studioVisibility.stateName;
        toggleStateName.addEventListener('change', (e) => {
            state.studioVisibility.stateName = e.target.checked;
            updateStudioVisibility();
        });
    }
    
    // Coordinates toggle
    const toggleCoordinates = document.getElementById('toggle-coordinates');
    if (toggleCoordinates) {
        toggleCoordinates.checked = state.studioVisibility.coordinates;
        toggleCoordinates.addEventListener('change', (e) => {
            state.studioVisibility.coordinates = e.target.checked;
            updateStudioVisibility();
        });
    }
    
    // Frame toggle
    const toggleFrame = document.getElementById('toggle-frame');
    if (toggleFrame) {
        toggleFrame.checked = state.studioVisibility.frame;
        toggleFrame.addEventListener('change', (e) => {
            state.studioVisibility.frame = e.target.checked;
            updateStudioVisibility();
        });
    }
    
    // Toggle map shape visibility
    const toggleMapShape = document.getElementById('toggle-map-shape');
    if (toggleMapShape) {
        toggleMapShape.checked = state.studioVisibility.mapShape;
        toggleMapShape.addEventListener('change', (e) => {
            state.studioVisibility.mapShape = e.target.checked;
            updateStudioVisibility();
        });
    }
    
    // Frame opacity slider
    const frameOpacitySlider = document.getElementById('frame-opacity');
    const frameOpacityValue = document.getElementById('frame-opacity-value');
    if (frameOpacitySlider && frameOpacityValue) {
        frameOpacitySlider.value = state.frameOpacity;
        frameOpacityValue.textContent = state.frameOpacity + '%';
        frameOpacitySlider.addEventListener('input', (e) => {
            state.frameOpacity = parseInt(e.target.value);
            frameOpacityValue.textContent = e.target.value + '%';
            updateStudioFrame();
        });
    }
    
    // Frame size slider
    const frameThicknessSlider = document.getElementById('frame-thickness');
    const frameThicknessValue = document.getElementById('frame-thickness-value');
    if (frameThicknessSlider && frameThicknessValue) {
        frameThicknessSlider.value = state.frameThickness;
        frameThicknessValue.textContent = state.frameThickness + 'px';
        frameThicknessSlider.addEventListener('input', (e) => {
            state.frameThickness = parseInt(e.target.value);
            frameThicknessValue.textContent = e.target.value + 'px';
            updateStudioFrame();
        });
    }
    
    // Frame dropdown
    const frameSelect = document.getElementById('frame-select');
    if (frameSelect) {
        frameSelect.value = state.currentFrame;
        frameSelect.addEventListener('change', (e) => {
            state.currentFrame = e.target.value;
            updateStudioFrame();
        });
    }
    
    // Map shape dropdown
    const mapShapeSelect = document.getElementById('map-shape-select');
    if (mapShapeSelect) {
        mapShapeSelect.value = state.mapShape;
        mapShapeSelect.addEventListener('change', (e) => {
            const shape = e.target.value;
            state.mapShape = shape;
            
            // Apply shape to map container
            const shapeMapContainer = document.getElementById('studio-map-container');
            if (shapeMapContainer) {
                // Remove all shape classes
                shapeMapContainer.className = 'studio-map-container';
                // Add new shape class
                if (shape !== 'rectangle') {
                    shapeMapContainer.classList.add(`shape-${shape}`);
                }
                
                // Apply map shape size
                applyMapShapeSize();
                
                // Update map frame to match new shape
                updateMapFrame();
                
                // Resize map after shape change
                if (state.studioMap) {
                    setTimeout(() => {
                        state.studioMap.resize();
                    }, 100);
                }
            }
        });
    }
    
    // Map shape size slider
    const mapShapeSizeSlider = document.getElementById('map-shape-size');
    const mapShapeSizeValue = document.getElementById('map-shape-size-value');
    if (mapShapeSizeSlider && mapShapeSizeValue) {
        mapShapeSizeSlider.value = state.mapShapeSize;
        mapShapeSizeValue.textContent = state.mapShapeSize + '%';
        mapShapeSizeSlider.addEventListener('input', (e) => {
            state.mapShapeSize = parseInt(e.target.value);
            mapShapeSizeValue.textContent = e.target.value + '%';
            applyMapShapeSize();
            if (state.studioMap) {
                setTimeout(() => {
                    state.studioMap.resize();
                }, 100);
            }
        });
    }
    
    // Map frame dropdown
    const mapFrameSelect = document.getElementById('map-frame-select');
    if (mapFrameSelect) {
        mapFrameSelect.value = state.mapFrame;
        mapFrameSelect.addEventListener('change', (e) => {
            state.mapFrame = e.target.value;
            updateMapFrame();
        });
    }
    
    // Map frame opacity slider
    const mapFrameOpacitySlider = document.getElementById('map-frame-opacity');
    const mapFrameOpacityValue = document.getElementById('map-frame-opacity-value');
    if (mapFrameOpacitySlider && mapFrameOpacityValue) {
        mapFrameOpacitySlider.value = state.mapFrameOpacity;
        mapFrameOpacityValue.textContent = state.mapFrameOpacity + '%';
        mapFrameOpacitySlider.addEventListener('input', (e) => {
            state.mapFrameOpacity = parseInt(e.target.value);
            mapFrameOpacityValue.textContent = e.target.value + '%';
            updateMapFrame();
        });
    }
    
    // Map frame thickness slider
    const mapFrameThicknessSlider = document.getElementById('map-frame-thickness');
    const mapFrameThicknessValue = document.getElementById('map-frame-thickness-value');
    if (mapFrameThicknessSlider && mapFrameThicknessValue) {
        mapFrameThicknessSlider.value = state.mapFrameThickness;
        mapFrameThicknessValue.textContent = state.mapFrameThickness + 'px';
        mapFrameThicknessSlider.addEventListener('input', (e) => {
            state.mapFrameThickness = parseInt(e.target.value);
            mapFrameThicknessValue.textContent = e.target.value + 'px';
            updateMapFrame();
        });
    }
    
    // Toggle map frame visibility
    const toggleMapFrame = document.getElementById('toggle-map-frame');
    if (toggleMapFrame) {
        toggleMapFrame.checked = state.studioVisibility.mapFrame;
        toggleMapFrame.addEventListener('change', (e) => {
            state.studioVisibility.mapFrame = e.target.checked;
            updateMapFrame();
        });
    }
    
    // Apply initial map shape size
    applyMapShapeSize();
    
    // Apply initial map frame
    updateMapFrame();
    
    // Grid toggle
    const toggleGrid = document.getElementById('toggle-grid');
    if (toggleGrid) {
        toggleGrid.checked = state.gridVisible;
        toggleGrid.addEventListener('change', (e) => {
            state.gridVisible = e.target.checked;
            updateGridOverlay();
        });
    }
    
    // Grid size dropdown
    const gridSizeSelect = document.getElementById('grid-size-select');
    if (gridSizeSelect) {
        gridSizeSelect.value = state.gridSize;
        gridSizeSelect.addEventListener('change', (e) => {
            state.gridSize = parseInt(e.target.value);
            updateGridOverlay();
        });
    }
    
    // Snap to grid checkbox
    const snapToGridCheckbox = document.getElementById('snap-to-grid');
    if (snapToGridCheckbox) {
        snapToGridCheckbox.checked = state.snapToGrid;
        snapToGridCheckbox.addEventListener('change', (e) => {
            state.snapToGrid = e.target.checked;
        });
    }
    
    // Grid color picker
    const gridColorPicker = document.getElementById('grid-color');
    if (gridColorPicker) {
        gridColorPicker.value = state.gridColor;
        gridColorPicker.addEventListener('input', (e) => {
            state.gridColor = e.target.value;
            updateGridOverlay();
        });
    }
    
    // Map style dropdown
    const mapStyleSelect = document.getElementById('map-style-select');
    if (mapStyleSelect) {
        mapStyleSelect.value = state.currentStyle;
        mapStyleSelect.addEventListener('change', (e) => {
            state.currentStyle = e.target.value;
            // Update studio map style
            if (state.studioMap) {
                state.studioMap.setStyle(state.currentStyle);
                // Re-add event listeners after style change
                state.studioMap.once('styledata', () => {
                    state.studioMap.resize();
                });
            }
            // Also update main map style
            map.setStyle(state.currentStyle);
        });
    }
    
    // Initialize grid overlay
    updateGridOverlay();
}

// Update grid overlay visibility and style
function updateGridOverlay() {
    const gridOverlay = document.getElementById('studio-grid-overlay');
    if (!gridOverlay) return;
    
    // Set CSS custom properties for grid
    gridOverlay.style.setProperty('--grid-size', state.gridSize + 'px');
    gridOverlay.style.setProperty('--grid-color', state.gridColor);
    
    // Toggle visibility
    if (state.gridVisible) {
        gridOverlay.classList.add('visible');
    } else {
        gridOverlay.classList.remove('visible');
    }
}

// Snap value to grid
function snapToGrid(value) {
    if (!state.snapToGrid || !state.gridVisible) return value;
    return Math.round(value / state.gridSize) * state.gridSize;
}

// Studio save button
studioSaveBtn.addEventListener('click', async () => {
    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'export-menu-backdrop';
    
    // Create format menu
    const formatMenu = document.createElement('div');
    formatMenu.className = 'export-menu';
    formatMenu.innerHTML = `
        <div class="export-option" data-format="pdf">PDF</div>
        <div class="export-option" data-format="jpg">JPG</div>
        <div class="export-option" data-format="png">PNG</div>
        <div class="export-option" data-format="bmp">BMP</div>
    `;
    
    document.body.appendChild(backdrop);
    document.body.appendChild(formatMenu);
    
    const closeMenu = () => {
        backdrop.remove();
        formatMenu.remove();
    };
    
    // Close on backdrop click
    backdrop.addEventListener('click', closeMenu);
    
    formatMenu.querySelectorAll('.export-option').forEach(option => {
        option.addEventListener('click', async (e) => {
            const format = e.target.getAttribute('data-format');
            closeMenu();
            await exportFromStudio(format);
        });
    });
});

// Studio print button
studioPrintBtn.addEventListener('click', async () => {
    studioPrintBtn.textContent = 'Preparing...';
    studioPrintBtn.disabled = true;
    
    try {
        const canvas = document.querySelector('.studio-canvas');
        
        // Hide non-printable elements
        const gridOverlay = document.querySelector('.studio-grid-overlay');
        const resizeHandles = document.querySelectorAll('.map-resize-handle');
        const mapFrameOverlay = document.querySelector('.studio-map-frame-overlay');
        
        if (gridOverlay) gridOverlay.style.display = 'none';
        resizeHandles.forEach(h => h.style.display = 'none');
        if (mapFrameOverlay) mapFrameOverlay.style.display = 'none';
        
        // Wait for map to render
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Capture the canvas
        const capturedCanvas = await html2canvas(canvas, {
            useCORS: true,
            allowTaint: true,
            scale: 2,
            backgroundColor: state.backgroundColor || '#ffffff',
            logging: false
        });
        
        // Restore hidden elements
        if (gridOverlay && state.gridVisible) gridOverlay.style.display = 'block';
        resizeHandles.forEach(h => h.style.display = '');
        if (mapFrameOverlay) mapFrameOverlay.style.display = '';
        
        // Get poster dimensions
        const posterDims = getCanvasDimensions();
        const widthInches = posterDims.width / 100;
        const heightInches = posterDims.height / 100;
        
        // Open a new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print Poster</title>
                <style>
                    @page {
                        size: ${widthInches}in ${heightInches}in;
                        margin: 0;
                    }
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    html, body {
                        width: 100%;
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: white;
                    }
                    img {
                        max-width: 100%;
                        max-height: 100%;
                        object-fit: contain;
                    }
                    @media print {
                        html, body {
                            width: ${widthInches}in;
                            height: ${heightInches}in;
                        }
                        img {
                            width: 100%;
                            height: 100%;
                            object-fit: contain;
                        }
                    }
                </style>
            </head>
            <body>
                <img src="${capturedCanvas.toDataURL('image/png')}" alt="Poster">
            </body>
            </html>
        `);
        printWindow.document.close();
        
        // Wait for image to load then print
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
            }, 250);
        };
        
    } catch (error) {
        console.error('Print error:', error);
        alert('Error preparing print. Please try again.');
    }
    
    studioPrintBtn.textContent = 'Print';
    studioPrintBtn.disabled = false;
});

// Export from Studio
async function exportFromStudio(format) {
    studioSaveBtn.textContent = 'Exporting...';
    studioSaveBtn.disabled = true;
    
    try {
        const canvas = document.querySelector('.studio-canvas');
        
        // Hide non-printable elements
        const gridOverlay = document.querySelector('.studio-grid-overlay');
        const resizeHandles = document.querySelectorAll('.map-resize-handle');
        const mapFrameOverlay = document.querySelector('.studio-map-frame-overlay');
        
        if (gridOverlay) gridOverlay.style.display = 'none';
        resizeHandles.forEach(h => h.style.display = 'none');
        if (mapFrameOverlay) mapFrameOverlay.style.display = 'none';
        
        // Wait for map to render
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get poster dimensions for export (300 DPI)
        const posterDims = getCanvasDimensions();
        const exportWidth = posterDims.width * 3; // 300 DPI (3x the 100 DPI display)
        const exportHeight = posterDims.height * 3;
        
        // Capture the canvas at high resolution
        const capturedCanvas = await html2canvas(canvas, {
            useCORS: true,
            allowTaint: true,
            scale: 3, // 3x scale for 300 DPI
            backgroundColor: state.backgroundColor || '#ffffff',
            logging: false
        });
        
        // Restore hidden elements
        if (gridOverlay && state.gridVisible) gridOverlay.style.display = 'block';
        resizeHandles.forEach(h => h.style.display = '');
        if (mapFrameOverlay) mapFrameOverlay.style.display = '';
        
        const width = capturedCanvas.width;
        const height = capturedCanvas.height;
        
        // Export based on format
        if (format === 'pdf') {
            const { jsPDF } = window.jspdf;
            const orientation = width > height ? 'landscape' : 'portrait';
            const pdf = new jsPDF({
                orientation: orientation,
                unit: 'px',
                format: [width, height]
            });
            const imgData = capturedCanvas.toDataURL('image/png', 1.0);
            pdf.addImage(imgData, 'PNG', 0, 0, width, height);
            pdf.save('city-map.pdf');
        } else if (format === 'bmp') {
            const imgData = capturedCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'city-map.bmp';
            link.href = imgData;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
            capturedCanvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `city-map.${format}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, mimeType, format === 'jpg' ? 0.95 : 1.0);
        }
        
    } catch (error) {
        console.error('Export error:', error);
        alert('Error exporting map. Please try again.');
    }
    
    studioSaveBtn.textContent = 'Save';
    studioSaveBtn.disabled = false;
}

// Handle window resize to update canvas scale
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (state.studioMode) {
            // Use requestAnimationFrame for smooth resize
            requestAnimationFrame(() => {
                updateStudioCanvas();
            });
        }
    }, 150);
});

// Handle orientation change on mobile
window.addEventListener('orientationchange', () => {
    if (state.studioMode) {
        setTimeout(() => {
            updateStudioCanvas();
        }, 300);
    }
});
