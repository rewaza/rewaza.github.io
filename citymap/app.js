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

// Load saved city on page load
const savedCity = loadSavedCity();
if (savedCity) {
    state.currentCity = savedCity;
    map.setCenter([savedCity.coordinates.lng, savedCity.coordinates.lat]);
    map.setZoom(11);
}

// Fly to saved city or Boston on load
map.on('load', () => {
    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Fly to saved city or Boston with animation
    const targetCity = savedCity || state.currentCity;
    setTimeout(() => {
        map.flyTo({
            center: [targetCity.coordinates.lng, targetCity.coordinates.lat],
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

// Style selector
const styleBtn = document.getElementById('style-btn');
const styleMenu = document.getElementById('style-menu');

styleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    styleMenu.classList.toggle('hidden');
    frameMenu.classList.add('hidden');
    exportMenu.classList.add('hidden');
});

document.querySelectorAll('.style-option').forEach(option => {
    option.addEventListener('click', (e) => {
        const style = e.target.getAttribute('data-style');
        state.currentStyle = style;
        map.setStyle(style);
        styleMenu.classList.add('hidden');
        styleBtn.textContent = `Style: ${e.target.textContent}`;
    });
});

// Frame gallery
const frameBtn = document.getElementById('frame-btn');
const frameMenu = document.getElementById('frame-menu');

frameBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    frameMenu.classList.toggle('hidden');
    styleMenu.classList.add('hidden');
    exportMenu.classList.add('hidden');
});

document.querySelectorAll('.frame-item').forEach(item => {
    item.addEventListener('click', (e) => {
        const frame = e.currentTarget.getAttribute('data-frame');
        state.currentFrame = frame;
        frameMenu.classList.add('hidden');
        frameBtn.textContent = `Frame: ${frame === 'none' ? 'None' : frame.charAt(0).toUpperCase() + frame.slice(1)}`;
    });
});

// Text editor
const textBtn = document.getElementById('text-btn');
const textModal = document.getElementById('text-editor-modal');
const closeModal = document.querySelector('.close');
const addTextBtn = document.getElementById('add-text-btn');
const cancelTextBtn = document.getElementById('cancel-text-btn');

textBtn.addEventListener('click', () => {
    textModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
    textModal.classList.add('hidden');
});

cancelTextBtn.addEventListener('click', () => {
    textModal.classList.add('hidden');
});

// Text size slider
const textSizeSlider = document.getElementById('text-size');
const textSizeValue = document.getElementById('text-size-value');
textSizeSlider.addEventListener('input', (e) => {
    textSizeValue.textContent = e.target.value + 'px';
});

// Text position sliders
const textPosX = document.getElementById('text-position-x');
const textPosXValue = document.getElementById('text-position-x-value');
textPosX.addEventListener('input', (e) => {
    textPosXValue.textContent = e.target.value + '%';
});

const textPosY = document.getElementById('text-position-y');
const textPosYValue = document.getElementById('text-position-y-value');
textPosY.addEventListener('input', (e) => {
    textPosYValue.textContent = e.target.value + '%';
});

// Add text element
addTextBtn.addEventListener('click', () => {
    const text = document.getElementById('text-input').value;
    const size = document.getElementById('text-size').value;
    const color = document.getElementById('text-color').value;
    const font = document.getElementById('text-font').value;
    const posX = document.getElementById('text-position-x').value;
    const posY = document.getElementById('text-position-y').value;
    
    if (text.trim()) {
        state.textElements.push({
            text: text,
            size: size,
            color: color,
            font: font,
            posX: posX,
            posY: posY
        });
        
        // Clear form
        document.getElementById('text-input').value = '';
        textModal.classList.add('hidden');
    }
});

// Print/Export functionality
const printBtn = document.getElementById('print-btn');
const exportMenu = document.getElementById('export-menu');

printBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    exportMenu.classList.toggle('hidden');
    styleMenu.classList.add('hidden');
    frameMenu.classList.add('hidden');
});

document.querySelectorAll('.export-option').forEach(option => {
    option.addEventListener('click', async (e) => {
        const format = e.target.getAttribute('data-format');
        exportMenu.classList.add('hidden');
        await exportMap(format);
    });
});

// Export function
async function exportMap(format) {
    // Show loading
    printBtn.textContent = 'Exporting...';
    printBtn.disabled = true;
    
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
        
        // Set dimensions for high-resolution export (portrait orientation like the examples)
        const width = 2000; // High resolution width
        const height = 2800; // High resolution height (taller for text area)
        
        printableContent.style.width = width + 'px';
        printableContent.style.height = height + 'px';
        
        // Apply frame
        frameOverlay.className = 'frame-overlay';
        if (state.currentFrame !== 'none') {
            frameOverlay.classList.add(`frame-${state.currentFrame}`);
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
            
            printBtn.textContent = 'Print / Export';
            printBtn.disabled = false;
        });
        
    } catch (error) {
        console.error('Export error:', error);
        alert('Error exporting map. Please try again.');
        printBtn.textContent = 'Print / Export';
        printBtn.disabled = false;
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

// Refresh button
const refreshBtn = document.getElementById('refresh-btn');
refreshBtn.addEventListener('click', () => {
    const savedCity = loadSavedCity();
    if (savedCity) {
        map.flyTo({
            center: [savedCity.coordinates.lng, savedCity.coordinates.lat],
            zoom: 11,
            duration: 2000
        });
    } else {
        location.reload();
    }
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
        preserveDrawingBuffer: true
    });
    
    // Add navigation controls
    state.studioMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
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
    const resizeHandle = mapContainer.querySelector('.map-resize-handle');
    let isDragging = false;
    let isResizing = false;
    let startX, startY, startWidth, startHeight, startLeft, startTop;
    
    // Set initial position
    mapContainer.style.position = 'relative';
    
    // Drag functionality (only on map container, not on map itself)
    mapContainer.addEventListener('mousedown', (e) => {
        // Don't drag if clicking on the map or resize handle
        if (e.target.closest('.mapboxgl-canvas') || e.target === resizeHandle) {
            if (e.target === resizeHandle) {
                isResizing = true;
            }
            return;
        }
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = mapContainer.getBoundingClientRect();
        const previewRect = document.querySelector('.studio-preview').getBoundingClientRect();
        startLeft = rect.left - previewRect.left;
        startTop = rect.top - previewRect.top;
        startWidth = rect.width;
        startHeight = rect.height;
        e.preventDefault();
        e.stopPropagation();
    });
    
    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = mapContainer.getBoundingClientRect();
        startWidth = rect.width;
        startHeight = rect.height;
        e.preventDefault();
        e.stopPropagation();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const previewRect = document.querySelector('.studio-preview').getBoundingClientRect();
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            const newLeft = startLeft + deltaX;
            const newTop = startTop + deltaY;
            
            // Constrain to preview area
            if (newLeft >= 0 && newLeft + mapContainer.offsetWidth <= previewRect.width) {
                mapContainer.style.left = newLeft + 'px';
            }
            if (newTop >= 0 && newTop + mapContainer.offsetHeight <= previewRect.height) {
                mapContainer.style.top = newTop + 'px';
            }
        } else if (isResizing) {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            const newWidth = Math.max(300, startWidth + deltaX);
            const newHeight = Math.max(200, startHeight + deltaY);
            mapContainer.style.width = newWidth + 'px';
            mapContainer.style.height = newHeight + 'px';
            if (state.studioMap) {
                setTimeout(() => state.studioMap.resize(), 50);
            }
        }
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
        isResizing = false;
    });
    
    // Update frame
    updateStudioFrame();
}

// Update studio frame
function updateStudioFrame() {
    const frameOverlay = document.getElementById('studio-frame-overlay');
    frameOverlay.className = 'studio-frame-overlay';
    if (state.currentFrame !== 'none') {
        frameOverlay.classList.add(`frame-${state.currentFrame}`);
    }
}

// Studio button click
studioBtn.addEventListener('click', () => {
    state.studioMode = true;
    studioMode.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
        initStudioMode();
        initStudioMenuToggle();
    }, 100);
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
            // Add margin to preview when menu opens
            const preview = document.querySelector('.studio-preview');
            if (preview) {
                preview.style.marginRight = '350px';
            }
            // Resize map after margin change
            if (state.studioMap) {
                setTimeout(() => {
                    state.studioMap.resize();
                }, 350); // Wait for CSS transition to complete
            }
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
            // Remove margin from preview when menu closes
            const preview = document.querySelector('.studio-preview');
            if (preview) {
                preview.style.marginRight = '0';
            }
            // Resize map after margin change to fill extended space
            if (state.studioMap) {
                setTimeout(() => {
                    state.studioMap.resize();
                }, 350); // Wait for CSS transition to complete
            }
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

// Studio frame buttons
document.querySelectorAll('.frame-btn-studio').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const frame = e.target.getAttribute('data-frame');
        state.currentFrame = frame;
        updateStudioFrame();
    });
});

// Studio save button
studioSaveBtn.addEventListener('click', async () => {
    const formatMenu = document.createElement('div');
    formatMenu.className = 'export-menu';
    formatMenu.style.position = 'absolute';
    formatMenu.style.top = '10px';
    formatMenu.style.right = '10px';
    formatMenu.innerHTML = `
        <div class="export-option" data-format="pdf">PDF</div>
        <div class="export-option" data-format="jpg">JPG</div>
        <div class="export-option" data-format="png">PNG</div>
        <div class="export-option" data-format="bmp">BMP</div>
    `;
    
    studioMode.appendChild(formatMenu);
    
    formatMenu.querySelectorAll('.export-option').forEach(option => {
        option.addEventListener('click', async (e) => {
            const format = e.target.getAttribute('data-format');
            formatMenu.remove();
            await exportFromStudio(format);
        });
    });
    
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!formatMenu.contains(e.target) && e.target !== studioSaveBtn) {
                formatMenu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 100);
});

// Studio print button
studioPrintBtn.addEventListener('click', () => {
    window.print();
});

// Export from Studio
async function exportFromStudio(format) {
    studioSaveBtn.textContent = 'Exporting...';
    studioSaveBtn.disabled = true;
    
    try {
        // Get current studio map state
        const center = state.studioMap.getCenter();
        const zoom = state.studioMap.getZoom();
        
        // Use the printable container
        const printableContainer = document.getElementById('printable-container');
        const printableContent = document.getElementById('printable-content');
        const mapPrint = document.getElementById('map-print');
        const frameOverlay = document.getElementById('frame-overlay');
        const cityInfo = document.getElementById('city-info');
        const cityNameEl = document.getElementById('city-name');
        const stateNameEl = document.getElementById('state-name');
        const coordinatesEl = document.getElementById('coordinates');
        
        const width = 2000;
        const height = 2800;
        
        printableContent.style.width = width + 'px';
        printableContent.style.height = height + 'px';
        
        // Apply frame
        frameOverlay.className = 'frame-overlay';
        if (state.currentFrame !== 'none') {
            frameOverlay.classList.add(`frame-${state.currentFrame}`);
        }
        
        // Set text with studio styles
        const cityName = document.getElementById('studio-city-name').textContent;
        const stateName = document.getElementById('studio-state-name').textContent;
        const coordinates = document.getElementById('studio-coordinates').textContent;
        
        cityNameEl.textContent = cityName;
        cityNameEl.style.fontSize = state.studioTextStyles.cityName.size + 'px';
        cityNameEl.style.fontFamily = state.studioTextStyles.cityName.font;
        cityNameEl.style.color = state.studioTextStyles.cityName.color;
        
        stateNameEl.textContent = stateName;
        stateNameEl.style.fontSize = state.studioTextStyles.stateName.size + 'px';
        stateNameEl.style.fontFamily = state.studioTextStyles.stateName.font;
        stateNameEl.style.color = state.studioTextStyles.stateName.color;
        
        coordinatesEl.textContent = coordinates;
        coordinatesEl.style.fontSize = state.studioTextStyles.coordinates.size + 'px';
        coordinatesEl.style.fontFamily = state.studioTextStyles.coordinates.font;
        coordinatesEl.style.color = state.studioTextStyles.coordinates.color;
        
        // Clear existing map
        if (mapPrint._mapboxglMap) {
            mapPrint._mapboxglMap.remove();
        }
        
        // Create print map with studio map's state
        const printMap = new mapboxgl.Map({
            container: 'map-print',
            style: state.currentStyle,
            center: [center.lng, center.lat],
            zoom: zoom,
            interactive: false,
            attributionControl: false,
            preserveDrawingBuffer: true
        });
        
        mapPrint._mapboxglMap = printMap;
        
        printMap.on('load', async () => {
            await new Promise(resolve => setTimeout(resolve, 1500));
            printMap.resize();
            await new Promise(resolve => setTimeout(resolve, 500));
            
            printableContainer.style.position = 'fixed';
            printableContainer.style.top = '0';
            printableContainer.style.left = '0';
            printableContainer.style.width = width + 'px';
            printableContainer.style.height = height + 'px';
            printableContainer.style.zIndex = '10000';
            printableContainer.classList.remove('hidden');
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const canvas = await html2canvas(printableContent, {
                width: width,
                height: height,
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#faf8f3'
            });
            
            printableContainer.classList.add('hidden');
            printableContainer.style.position = 'fixed';
            printableContainer.style.top = '-9999px';
            printableContainer.style.left = '-9999px';
            
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
                const imgData = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = 'city-map.bmp';
                link.href = imgData;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
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
            
            studioSaveBtn.textContent = 'Save';
            studioSaveBtn.disabled = false;
        });
        
    } catch (error) {
        console.error('Export error:', error);
        alert('Error exporting map. Please try again.');
        studioSaveBtn.textContent = 'Save';
        studioSaveBtn.disabled = false;
    }
}

// Close menus when clicking outside
document.addEventListener('click', (e) => {
    if (!styleMenu.contains(e.target) && e.target !== styleBtn) {
        styleMenu.classList.add('hidden');
    }
    if (!frameMenu.contains(e.target) && e.target !== frameBtn) {
        frameMenu.classList.add('hidden');
    }
    if (!exportMenu.contains(e.target) && e.target !== printBtn) {
        exportMenu.classList.add('hidden');
    }
});

