// assets/map-editor.js

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. CONFIGURATION
    // REPLACE WITH YOUR ACTUAL TOKEN
    mapboxgl.accessToken = 'pk.eyJ1IjoidGFudGFua3V6IiwiYSI6ImNrNzJ6YjhxMjAzeHQzZXBmOGNobHJ4ZTQifQ.EzlLcvfk8rBbTNLqBE68fQ'; 
    
    const state = {
        city: 'New York',
        style: 'mapbox://styles/mapbox/streets-v12',
        lat: 40.7128,
        lng: -74.0060,
        zoom: 12
    };

    // 2. INIT MAP
    const map = new mapboxgl.Map({
        container: 'map',
        style: state.style,
        center: [state.lng, state.lat],
        zoom: state.zoom,
        preserveDrawingBuffer: true,
        attributionControl: false // Cleaner look
    });

    // 3. INIT GEOCODER (Search Box)
    const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        placeholder: 'Search city...',
        marker: false,
        flyTo: true
    });
    
    // Append geocoder to our custom sidebar div
    document.getElementById('geocoder-container').appendChild(geocoder.onAdd(map));

    // Handle Search Results
    geocoder.on('result', (e) => {
        const place = e.result;
        
        // Update State
        state.lat = place.center[1];
        state.lng = place.center[0];
        
        // Update Inputs & Labels
        const cityText = place.text; 
        let contextText = "UNITED STATES"; // Fallback
        
        // Try to parse context for country/state
        if(place.context) {
             const country = place.context.find(c => c.id.includes('country'));
             if(country) contextText = country.text.toUpperCase();
        }

        updateLabels(cityText, contextText, state.lat, state.lng);
    });

    // 4. TAB NAVIGATION LOGIC
    const tabs = document.querySelectorAll('.nav-tab');
    const panels = document.querySelectorAll('.editor-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            // Add active to clicked
            tab.classList.add('active');
            const targetId = tab.dataset.target;
            document.getElementById(targetId).classList.add('active');
            
            // Resize map if needed (Mapbox doesn't like being hidden)
            map.resize();
        });
    });

    // 5. STYLE SWITCHER
    const styleBtns = document.querySelectorAll('.style-btn');
    styleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Visual Update
            styleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Map Update
            const newStyle = btn.dataset.style;
            map.setStyle(newStyle);
            
            // Update Hidden Form Input
            const styleName = btn.innerText.trim();
            document.getElementById('prop-style').value = styleName;
        });
    });

    // 6. LABEL SYNC (Input -> Preview)
    const inputCity = document.getElementById('input-city');
    const labelCity = document.getElementById('label-city');
    const inputState = document.getElementById('input-state');
    const labelState = document.getElementById('label-state');
    const inputCoords = document.getElementById('input-coords');
    const labelCoords = document.getElementById('label-coords');
    const showCoordsCheck = document.getElementById('show-coords');

    // Helper to update everything
    function updateLabels(city, sub, lat, lng) {
        // Update Inputs
        inputCity.value = city.toUpperCase();
        inputState.value = sub.toUpperCase();
        
        // Format Coords
        const latDir = lat >= 0 ? 'N' : 'S';
        const lngDir = lng >= 0 ? 'E' : 'W';
        const coordText = `${Math.abs(lat).toFixed(4)}° ${latDir} / ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
        inputCoords.value = coordText;

        // Update Preview Text
        labelCity.innerText = city.toUpperCase();
        labelState.innerText = sub.toUpperCase();
        labelCoords.innerText = coordText;

        // Update Hidden Shopify Inputs
        document.getElementById('prop-city').value = city;
        document.getElementById('prop-coords').value = coordText;
    }

    // Event Listeners for direct typing
    inputCity.addEventListener('input', (e) => { 
        labelCity.innerText = e.target.value.toUpperCase(); 
        document.getElementById('prop-city').value = e.target.value;
    });
    
    inputState.addEventListener('input', (e) => labelState.innerText = e.target.value.toUpperCase());
    
    inputCoords.addEventListener('input', (e) => {
        labelCoords.innerText = e.target.value;
        document.getElementById('prop-coords').value = e.target.value;
    });
    
    // Toggle Coordinates Visibility
    showCoordsCheck.addEventListener('change', (e) => {
        labelCoords.style.display = e.target.checked ? 'block' : 'none';
        // Resize map after layout change to prevent gray areas
        setTimeout(() => map.resize(), 50);
    });

    // 6b. LABEL STYLING CONTROLS (Font, Size, Color)
    // Title controls
    const titleFont = document.getElementById('title-font');
    const titleSize = document.getElementById('title-size');
    const titleSizeValue = document.getElementById('title-size-value');
    const titleColor = document.getElementById('title-color');

    if (titleFont) {
        titleFont.addEventListener('change', (e) => {
            labelCity.style.fontFamily = `'${e.target.value}', sans-serif`;
        });
    }
    if (titleSize && titleSizeValue) {
        titleSize.addEventListener('input', (e) => {
            labelCity.style.fontSize = `${e.target.value}px`;
            titleSizeValue.textContent = `${e.target.value}px`;
        });
    }
    if (titleColor) {
        titleColor.addEventListener('input', (e) => {
            labelCity.style.color = e.target.value;
        });
    }

    // Subtitle controls
    const subtitleFont = document.getElementById('subtitle-font');
    const subtitleSize = document.getElementById('subtitle-size');
    const subtitleSizeValue = document.getElementById('subtitle-size-value');
    const subtitleColor = document.getElementById('subtitle-color');

    if (subtitleFont) {
        subtitleFont.addEventListener('change', (e) => {
            labelState.style.fontFamily = `'${e.target.value}', sans-serif`;
        });
    }
    if (subtitleSize && subtitleSizeValue) {
        subtitleSize.addEventListener('input', (e) => {
            labelState.style.fontSize = `${e.target.value}px`;
            subtitleSizeValue.textContent = `${e.target.value}px`;
        });
    }
    if (subtitleColor) {
        subtitleColor.addEventListener('input', (e) => {
            labelState.style.color = e.target.value;
        });
    }

    // Coordinates controls
    const coordsFont = document.getElementById('coords-font');
    const coordsSize = document.getElementById('coords-size');
    const coordsSizeValue = document.getElementById('coords-size-value');
    const coordsColor = document.getElementById('coords-color');

    if (coordsFont) {
        coordsFont.addEventListener('change', (e) => {
            labelCoords.style.fontFamily = `'${e.target.value}', sans-serif`;
        });
    }
    if (coordsSize && coordsSizeValue) {
        coordsSize.addEventListener('input', (e) => {
            labelCoords.style.fontSize = `${e.target.value}px`;
            coordsSizeValue.textContent = `${e.target.value}px`;
        });
    }
    if (coordsColor) {
        coordsColor.addEventListener('input', (e) => {
            labelCoords.style.color = e.target.value;
        });
    }

    // 7. MAP ZOOM CONTROLS (+/- buttons zoom the map)
    document.getElementById('btn-zoom-in').addEventListener('click', () => map.zoomIn());
    document.getElementById('btn-zoom-out').addEventListener('click', () => map.zoomOut());

    // 8. POSTER SCALE SLIDER (slider scales the poster preview)
    const posterCanvas = document.getElementById('poster-canvas');
    const posterFrameWrapper = document.getElementById('poster-frame-wrapper');
    const scaleSlider = document.getElementById('poster-scale-slider');
    const scaleValue = document.getElementById('poster-scale-value');

    if (scaleSlider && scaleValue && posterFrameWrapper) {
        scaleSlider.addEventListener('input', (e) => {
            const scale = parseInt(e.target.value);
            posterFrameWrapper.style.transform = `scale(${scale / 100})`;
            posterFrameWrapper.style.transformOrigin = 'center center';
            scaleValue.textContent = `${scale}%`;
            
            // Resize map after transform
            setTimeout(() => map.resize(), 100);
        });
    }

    // 9. SIZE SYNC (New Code)
    const sizeSelect = document.getElementById('size-select');
    const propSize = document.getElementById('prop-size');
    
    if(sizeSelect && propSize) {
        // Update on change
        sizeSelect.addEventListener('change', (e) => {
            propSize.value = e.target.value; // Syncs "18x24", "Digital", etc.
        });
    }

    // 10. MAP SHAPE CONTROLS (includes orientation and shape)
    const shapeBtns = document.querySelectorAll('.shape-btn');
    const mapContainerFrame = document.getElementById('map-container-frame');
    
    // Store default dimensions for orientation
    const posterDimensions = {
        portrait: { width: 450, height: 600 },
        landscape: { width: 600, height: 450 }
    };
    
    shapeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Check if this is an orientation or shape button
            const orientation = btn.dataset.orientation;
            const shape = btn.dataset.shape;
            
            if (orientation) {
                // Handle orientation - only deactivate other orientation buttons
                document.querySelectorAll('.shape-btn[data-orientation]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Apply orientation
                const dims = posterDimensions[orientation];
                if (posterCanvas) {
                    posterCanvas.style.width = dims.width + 'px';
                    posterCanvas.style.height = dims.height + 'px';
                }
            } else if (shape) {
                // Handle shape - only deactivate other shape buttons
                document.querySelectorAll('.shape-btn[data-shape]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Apply shape
                if (shape === 'circle') {
                    mapContainerFrame.style.borderRadius = '50%';
                } else {
                    mapContainerFrame.style.borderRadius = '0';
                }
            }
            
            // Resize map after change
            setTimeout(() => map.resize(), 100);
        });
    });

    // 11. MAP OUTLINE CONTROLS
    const outlineType = document.getElementById('outline-type');
    const outlineColor = document.getElementById('outline-color');
    const outlineSize = document.getElementById('outline-size');
    const outlineSizeValue = document.getElementById('outline-size-value');
    
    function updateMapOutline() {
        if (!mapContainerFrame) return;
        
        const type = outlineType ? outlineType.value : 'solid';
        const color = outlineColor ? outlineColor.value : '#111111';
        const size = outlineSize ? parseInt(outlineSize.value) : 1;
        
        // Update size display
        if (outlineSizeValue) {
            outlineSizeValue.textContent = `${size}px`;
        }
        
        // Reset all border-related styles first
        mapContainerFrame.style.border = 'none';
        mapContainerFrame.style.outline = 'none';
        mapContainerFrame.style.outlineOffset = '0';
        mapContainerFrame.style.boxShadow = 'none';
        
        switch(type) {
            case 'solid':
                mapContainerFrame.style.border = `${size}px solid ${color}`;
                break;
            case 'dashed':
                mapContainerFrame.style.border = `${size}px dashed ${color}`;
                break;
            case 'two-lines':
                // Both lines equal size - border is inner, outline is outer
                mapContainerFrame.style.border = `${size}px solid ${color}`;
                mapContainerFrame.style.outline = `${size}px solid ${color}`;
                mapContainerFrame.style.outlineOffset = `${Math.max(2, size)}px`;
                break;
            case 'two-lines-thin':
                // Inner line thin (1px), outer line normal
                mapContainerFrame.style.border = `1px solid ${color}`;
                mapContainerFrame.style.outline = `${size}px solid ${color}`;
                mapContainerFrame.style.outlineOffset = `${Math.max(2, size)}px`;
                break;
            case 'two-lines-thick':
                // Inner line thick, outer line normal
                const innerThick = Math.max(size * 2, 4);
                mapContainerFrame.style.border = `${innerThick}px solid ${color}`;
                mapContainerFrame.style.outline = `${size}px solid ${color}`;
                mapContainerFrame.style.outlineOffset = `${Math.max(2, size)}px`;
                break;
        }
        
        // Refresh map to adjust for border changes
        setTimeout(() => map.resize(), 50);
    }
    
    if (outlineType) outlineType.addEventListener('change', updateMapOutline);
    if (outlineColor) outlineColor.addEventListener('input', updateMapOutline);
    if (outlineSize) outlineSize.addEventListener('input', updateMapOutline);

    // 12. POSTER BACKGROUND COLOR
    const mapBgColor = document.getElementById('map-bg-color');
    
    if (mapBgColor && posterCanvas) {
        mapBgColor.addEventListener('input', (e) => {
            posterCanvas.style.backgroundColor = e.target.value;
        });
    }

    // 13. FRAME CONTROLS
    const frameWrapper = document.getElementById('poster-frame-wrapper');
    const frameMaterialBtns = document.querySelectorAll('.frame-material-btn');
    const woodOptions = document.getElementById('frame-wood-options');
    const metalOptions = document.getElementById('frame-metal-options');
    const printOptions = document.getElementById('frame-print-options');
    const frameSizeOptions = document.getElementById('frame-size-options');
    const woodBtns = document.querySelectorAll('.wood-btn');
    const metalBtns = document.querySelectorAll('.metal-btn');
    const printStyleBtns = document.querySelectorAll('.print-style-btn');
    const frameSizeSlider = document.getElementById('frame-size');
    const frameSizeValue = document.getElementById('frame-size-value');
    const woodCustomColor = document.getElementById('wood-custom-color');
    const printBorderColor = document.getElementById('print-border-color');

    // Frame state
    const frameState = {
        material: 'none',
        woodType: 'maple',
        metalType: 'black',
        printStyle: 'solid',
        printColor: '#111111',
        size: 15,
        customColor: null
    };

    // Wood colors mapping (solid colors for border)
    const woodColorsSolid = {
        maple: '#DEB887',
        oak: '#A0826D',
        cherry: '#6B3A1F',
        walnut: '#4A3728',
        pine: '#D9C9A8',
        ebony: '#232323',
        beech: '#C9B896',
        mahogany: '#5A3535'
    };

    // Metal colors mapping (solid colors for border)
    const metalColorsSolid = {
        black: '#232323',
        white: '#F0F0F0',
        silver: '#B0B0B0',
        gold: '#C9A227',
        bronze: '#B5712D',
        copper: '#9A5D2F'
    };

    function updateFrame() {
        if (!frameWrapper) return;

        // Reset all frame styles
        frameWrapper.style.border = 'none';
        frameWrapper.style.padding = '0';
        frameWrapper.style.background = 'transparent';
        frameWrapper.className = '';

        if (frameState.material === 'none') {
            setTimeout(() => map.resize(), 50);
            return;
        }

        const size = frameState.size;

        if (frameState.material === 'wood') {
            const color = frameState.customColor || woodColorsSolid[frameState.woodType];
            frameWrapper.style.padding = size + 'px';
            frameWrapper.style.background = color;
            frameWrapper.className = 'frame-wood';
        } else if (frameState.material === 'metal') {
            const color = metalColorsSolid[frameState.metalType];
            frameWrapper.style.padding = size + 'px';
            frameWrapper.style.background = color;
            frameWrapper.className = 'frame-metal';
        } else if (frameState.material === 'print') {
            const color = frameState.printColor;
            const style = frameState.printStyle;
            frameWrapper.style.border = `${size}px ${style} ${color}`;
            frameWrapper.className = 'frame-print';
        }

        // Resize map after frame change
        setTimeout(() => map.resize(), 50);
    }

    // Material selection
    frameMaterialBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            frameMaterialBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            frameState.material = btn.dataset.material;
            frameState.customColor = null;
            
            // Show/hide options
            if (woodOptions) woodOptions.style.display = frameState.material === 'wood' ? 'block' : 'none';
            if (metalOptions) metalOptions.style.display = frameState.material === 'metal' ? 'block' : 'none';
            if (printOptions) printOptions.style.display = frameState.material === 'print' ? 'block' : 'none';
            if (frameSizeOptions) frameSizeOptions.style.display = frameState.material !== 'none' ? 'block' : 'none';
            
            updateFrame();
        });
    });

    // Wood type selection
    woodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            woodBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            frameState.woodType = btn.dataset.wood;
            frameState.customColor = null;
            updateFrame();
        });
    });

    // Metal type selection
    metalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            metalBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            frameState.metalType = btn.dataset.metal;
            updateFrame();
        });
    });

    // Print style selection
    printStyleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            printStyleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            frameState.printStyle = btn.dataset.print;
            updateFrame();
        });
    });

    // Frame size slider
    if (frameSizeSlider && frameSizeValue) {
        frameSizeSlider.addEventListener('input', (e) => {
            frameState.size = parseInt(e.target.value);
            frameSizeValue.textContent = frameState.size + 'px';
            updateFrame();
        });
    }

    // Custom wood color
    if (woodCustomColor) {
        woodCustomColor.addEventListener('input', (e) => {
            woodBtns.forEach(b => b.classList.remove('active'));
            frameState.customColor = e.target.value;
            updateFrame();
        });
    }

    // Print border color
    if (printBorderColor) {
        printBorderColor.addEventListener('input', (e) => {
            frameState.printColor = e.target.value;
            updateFrame();
        });
    }

    // 12. FREE DRAG AND DROP FOR MAP AND LABELS
    const posterLabels = document.getElementById('poster-labels');
    const mapFrame = document.getElementById('map-container-frame');
    const labelsDragHandle = posterLabels ? posterLabels.querySelector('.labels-drag-handle') : null;
    const mapDragHandle = mapFrame ? mapFrame.querySelector('.map-drag-handle') : null;
    
    // State for dragging
    let dragState = {
        active: false,
        element: null,
        startX: 0,
        startY: 0,
        startTop: 0,
        startLeft: 0,
        startRight: 0,
        startBottom: 0
    };
    
    // Get poster bounds
    function getPosterBounds() {
        const rect = posterCanvas.getBoundingClientRect();
        const padding = 20;
        return {
            minX: padding,
            minY: padding,
            maxX: posterCanvas.offsetWidth - padding,
            maxY: posterCanvas.offsetHeight - padding
        };
    }
    
    // Start dragging
    function startDrag(e, element) {
        e.preventDefault();
        dragState.active = true;
        dragState.element = element;
        dragState.startX = e.clientX;
        dragState.startY = e.clientY;
        
        const style = window.getComputedStyle(element);
        dragState.startTop = parseInt(style.top) || 0;
        dragState.startLeft = parseInt(style.left) || 0;
        dragState.startRight = parseInt(style.right) || 0;
        dragState.startBottom = parseInt(style.bottom) || 0;
        
        element.classList.add('dragging');
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
    }
    
    // Perform dragging
    function doDrag(e) {
        if (!dragState.active) return;
        
        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY;
        const el = dragState.element;
        const bounds = getPosterBounds();
        
        if (el === posterLabels) {
            // Labels: update bottom and left/right positions
            let newBottom = dragState.startBottom - dy;
            let newLeft = dragState.startLeft + dx;
            let newRight = dragState.startRight - dx;
            
            // Constrain to poster bounds
            const labelHeight = el.offsetHeight;
            newBottom = Math.max(bounds.minY, Math.min(bounds.maxY - labelHeight, newBottom));
            
            el.style.bottom = newBottom + 'px';
            // Keep centered by adjusting both left and right equally
            // Or allow free horizontal movement
            el.style.left = Math.max(bounds.minX, dragState.startLeft + dx) + 'px';
            el.style.right = 'auto';
            el.style.width = 'auto';
        } else if (el === mapFrame) {
            // Map: update position
            let newTop = dragState.startTop + dy;
            let newLeft = dragState.startLeft + dx;
            
            // Constrain to poster bounds
            const mapWidth = el.offsetWidth;
            const mapHeight = el.offsetHeight;
            newTop = Math.max(bounds.minY, Math.min(bounds.maxY - mapHeight, newTop));
            newLeft = Math.max(bounds.minX, Math.min(bounds.maxX - mapWidth, newLeft));
            
            el.style.top = newTop + 'px';
            el.style.left = newLeft + 'px';
            el.style.right = 'auto';
            el.style.bottom = 'auto';
        }
    }
    
    // Stop dragging
    function stopDrag() {
        if (dragState.element) {
            dragState.element.classList.remove('dragging');
        }
        dragState.active = false;
        dragState.element = null;
        document.removeEventListener('mousemove', doDrag);
        document.removeEventListener('mouseup', stopDrag);
        
        // Refresh map
        setTimeout(() => map.resize(), 50);
    }
    
    // Attach drag handlers
    if (labelsDragHandle) {
        labelsDragHandle.addEventListener('mousedown', (e) => startDrag(e, posterLabels));
    }
    if (mapDragHandle) {
        mapDragHandle.addEventListener('mousedown', (e) => startDrag(e, mapFrame));
    }

    // 13. MAP RESIZE FUNCTIONALITY - All 8 directions
    const resizeHandles = mapFrame ? mapFrame.querySelectorAll('.resize-handle') : [];
    
    let resizeState = {
        active: false,
        direction: null,
        startX: 0,
        startY: 0,
        startTop: 0,
        startLeft: 0,
        startWidth: 0,
        startHeight: 0
    };
    
    function startResize(e, direction) {
        e.preventDefault();
        e.stopPropagation();
        
        resizeState.active = true;
        resizeState.direction = direction;
        resizeState.startX = e.clientX;
        resizeState.startY = e.clientY;
        
        const style = window.getComputedStyle(mapFrame);
        resizeState.startTop = parseInt(style.top) || 0;
        resizeState.startLeft = parseInt(style.left) || 0;
        resizeState.startWidth = mapFrame.offsetWidth;
        resizeState.startHeight = mapFrame.offsetHeight;
        
        mapFrame.classList.add('resizing');
        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
    }
    
    function doResize(e) {
        if (!resizeState.active) return;
        
        const dx = e.clientX - resizeState.startX;
        const dy = e.clientY - resizeState.startY;
        const dir = resizeState.direction;
        const bounds = getPosterBounds();
        const minSize = 80;
        
        let newTop = resizeState.startTop;
        let newLeft = resizeState.startLeft;
        let newWidth = resizeState.startWidth;
        let newHeight = resizeState.startHeight;
        
        // Handle each direction
        if (dir.includes('n')) {
            newTop = resizeState.startTop + dy;
            newHeight = resizeState.startHeight - dy;
            if (newHeight < minSize) {
                newHeight = minSize;
                newTop = resizeState.startTop + resizeState.startHeight - minSize;
            }
            if (newTop < bounds.minY) {
                newHeight -= (bounds.minY - newTop);
                newTop = bounds.minY;
            }
        }
        if (dir.includes('s')) {
            newHeight = resizeState.startHeight + dy;
            if (newHeight < minSize) newHeight = minSize;
            if (newTop + newHeight > bounds.maxY) {
                newHeight = bounds.maxY - newTop;
            }
        }
        if (dir.includes('w')) {
            newLeft = resizeState.startLeft + dx;
            newWidth = resizeState.startWidth - dx;
            if (newWidth < minSize) {
                newWidth = minSize;
                newLeft = resizeState.startLeft + resizeState.startWidth - minSize;
            }
            if (newLeft < bounds.minX) {
                newWidth -= (bounds.minX - newLeft);
                newLeft = bounds.minX;
            }
        }
        if (dir.includes('e')) {
            newWidth = resizeState.startWidth + dx;
            if (newWidth < minSize) newWidth = minSize;
            if (newLeft + newWidth > bounds.maxX) {
                newWidth = bounds.maxX - newLeft;
            }
        }
        
        // Apply new dimensions
        mapFrame.style.top = newTop + 'px';
        mapFrame.style.left = newLeft + 'px';
        mapFrame.style.right = 'auto';
        mapFrame.style.bottom = 'auto';
        mapFrame.style.width = newWidth + 'px';
        mapFrame.style.height = newHeight + 'px';
        
        // Resize map
        map.resize();
    }
    
    function stopResize() {
        resizeState.active = false;
        resizeState.direction = null;
        mapFrame.classList.remove('resizing');
        document.removeEventListener('mousemove', doResize);
        document.removeEventListener('mouseup', stopResize);
        
        // Final map resize
        setTimeout(() => map.resize(), 50);
    }
    
    // Attach resize handlers to all handles
    resizeHandles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            startResize(e, handle.dataset.dir);
        });
    });

    // 14. FULLSCREEN TOGGLE
    const fullscreenBtn = document.getElementById('fullscreen-toggle');
    
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            document.body.classList.toggle('fullscreen-mode');
            
            // Resize map after fullscreen toggle
            setTimeout(() => map.resize(), 100);
        });
        
        // Also allow ESC key to exit fullscreen
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.body.classList.contains('fullscreen-mode')) {
                document.body.classList.remove('fullscreen-mode');
                setTimeout(() => map.resize(), 100);
            }
        });
    }

});