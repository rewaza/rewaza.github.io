/* global config csv2geojson turf Assembly $ */
'use strict';

mapboxgl.accessToken = config.accessToken;
const columnHeaders = config.sideBarInfo;

let geojsonData = {};
const filteredGeojson = {
    type: 'FeatureCollection',
    features: [],
};

const map = new mapboxgl.Map({
    container: 'map',
    style: config.style,
    center: config.center,
    zoom: config.zoom,
    transformRequest: transformRequest,
});

function flyToLocation(currentFeature) {
    map.flyTo({
        center: currentFeature,
        zoom: 5,
    });
}

function createPopup(currentFeature) {
    const popups = document.getElementsByClassName('mapboxgl-popup');
    /** Check if there is already a popup on the map and if so, remove it */
    if (popups[0]) popups[0].remove();
    new mapboxgl.Popup({
            closeOnClick: true
        })
        .setLngLat(currentFeature.geometry.coordinates)
        .setHTML('<h3>' + currentFeature.properties[config.popupInfo] + '</h3>')
        .addTo(map);
}

function buildLocationList(geopoints) {
    /* Add a new listing section to the sidebar. */
    const listings = document.getElementById('listings');
    listings.innerHTML = '';    
    geopoints.features.forEach((location, i) => {
        const prop = location.properties;
        if (prop[columnHeaders[1]] != "") {
            const listing = listings.appendChild(document.createElement('div'));
            /* Assign a unique `id` to the listing. */
            listing.id = 'listing-' + prop.id;
            /* Assign the `item` class to each listing for styling. */
            listing.className = 'item';
            /* Add the link to the individual listing created above. */
            const link = listing.appendChild(document.createElement('button'));
            link.className = 'title';
            link.id = 'link-' + prop.id;
            link.innerHTML =
                '<p style="line-height: 1.25">' + prop[columnHeaders[0]] + '</p>' + '<p style="line-height: 1.25">' + prop[columnHeaders[1]] + '</p>';
            /* Add details to the individual listing. */
            const details = listing.appendChild(document.createElement('div'));
            details.className = 'content';
            var div = document.createElement('div');
            div.innerText += prop[columnHeaders[6]] + prop[columnHeaders[2]];
            div.className;
            details.appendChild(div);
            var div = document.createElement('div');
            div.innerText += prop[columnHeaders[7]] + prop[columnHeaders[3]];
            div.className;
            details.appendChild(div);
            var div = document.createElement('div');
            div.innerText += prop[columnHeaders[8]] + prop[columnHeaders[4]];
            div.className;
            details.appendChild(div);
            var div = document.createElement('div');
            div.innerText += prop[columnHeaders[9]] + prop[columnHeaders[5]];
            div.className;
            details.appendChild(div);            

            link.addEventListener('click', function() {
                const clickedListing = location.geometry.coordinates;
                flyToLocation(clickedListing);
                createPopup(location);
                const activeItem = document.getElementsByClassName('active');
                if (activeItem[0]) {activeItem[0].classList.remove('active');}
                this.parentNode.classList.add('active');
                const divList = document.querySelectorAll('.content');
                const divCount = divList.length;
                for (i = 0; i < divCount; i++) {divList[i].style.maxHeight = null;}
                for (let i = 0; i < geojsonData.features.length; i++) {
                    this.parentNode.classList.remove('active');
                    this.classList.toggle('active');
                    const content = this.nextElementSibling;
                    if (content.style.maxHeight) {
                        content.style.maxHeight = null;
                    } else {content.style.maxHeight = content.scrollHeight + 'px';
                    }
                }
            });
        }
    });
}

const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken, // Set the access token
    mapboxgl: mapboxgl, // Set the mapbox-gl instance
    marker: true, // Use the geocoder's default marker style
    zoom: 11,
});

map.on('load', () => {
    map.addControl(geocoder, 'top-right');

    // csv2geojson - following the Sheet Mapper tutorial https://www.mapbox.com/impact-tools/sheet-mapper
    console.log('loaded');
    $(document).ready(() => {
        console.log('ready');
        $.ajax({
            type: 'GET',
            url: config.CSV,
            dataType: 'text',
            success: function(csvData) {
                makeGeoJSON(csvData);
            },
            error: function(request, status, error) {
                console.log(request);
                console.log(status);
                console.log(error);
            },
        });
    });

    function makeGeoJSON(csvData) {
        csv2geojson.csv2geojson(
            csvData, {
                latfield: 'Latitude',
                lonfield: 'Longitude',
                delimiter: ',',
                numericFields: 'Customers',
                cluster: true,
                clusterMaxZoom: 14,
                clusterRadius: 50,
            },
            (err, data) => {
                data.features.forEach((data, i) => {
                    data.properties.id = i;
                });

                geojsonData = data;

                var fff = Object.values(data.features[0]);
                var kval = fff[1];
                var tiw_1 = Object.keys(kval)[6];
                var tiw_2 = Object.keys(kval)[7];
                var tiw_3 = Object.keys(kval)[8];
                var tiw_4 = Object.keys(kval)[9];

                var filters_ = [{
                        type: 'checkbox',
                        botype: tiw_1,
                        title: '',
                        columnHeader: 't1', // Case sensitive - must match spreadsheet entry
                        listItems: ['1', ], // Case sensitive - must match spreadsheet entry; This will take up to six inputs but is best used with a maximum of three;
                    },
                    {
                        type: 'checkbox',
                        botype: tiw_2,
                        title: '',
                        columnHeader: 't2', // Case sensitive - must match spreadsheet entry
                        listItems: ['2', ], // Case sensitive - must match spreadsheet entry; This will take up to six inputs but is best used with a maximum of three;
                    },
                    {
                        type: 'checkbox',
                        botype: tiw_3,
                        title: '',
                        columnHeader: 't3', // Case sensitive - must match spreadsheet entry
                        listItems: ['3', ], // Case sensitive - must match spreadsheet entry; This will take up to six inputs but is best used with a maximum of three;
                    },
                    {
                        type: 'checkbox',
                        botype: tiw_4,
                        title: '',
                        columnHeader: 't4', // Case sensitive - must match spreadsheet entry
                        listItems: ['4', ], // Case sensitive - must match spreadsheet entry; This will take up to six inputs but is best used with a maximum of three;
                    },
                ]

                function buildCheckbox(title, listItems, botype) {
                    const filtersDiv = document.getElementById('filters');
                    const mainDiv = document.createElement('div');
                    const filterTitle = document.createElement('div');
                    const formatcontainer = document.createElement('div');
                    filterTitle.classList.add('center', 'flex-parent', 'py12', 'txt-bold');
                    formatcontainer.classList.add(
                        'center',
                        'flex-parent',
                        'flex-parent--column',
                        'px3',
                        'flex-parent--space-between-main',
                    );
                    const secondLine = document.createElement('div');
                    secondLine.classList.add(
                        'center',
                        'flex-parent',
                        'py12',
                        'px3',
                        'flex-parent--space-between-main',
                    );
                    filterTitle.innerText = title;
                    mainDiv.appendChild(filterTitle);
                    mainDiv.appendChild(formatcontainer);

                    for (let i = 0; i < listItems.length; i++) {
                        const container = document.createElement('label');

                        container.classList.add('checkbox-container');

                        const input = document.createElement('input');
                        input.classList.add('px12', 'filter-option');
                        input.setAttribute('type', 'checkbox');
                        input.setAttribute('id', listItems[i]);
                        input.setAttribute('value', listItems[i]);

                        const checkboxDiv = document.createElement('div');
                        const inputValue = document.createElement('p');
                        inputValue.innerText = botype;
                        checkboxDiv.classList.add('checkbox', 'mr6');
                        checkboxDiv.appendChild(Assembly.createIcon('check'));

                        container.appendChild(input);
                        container.appendChild(checkboxDiv);
                        container.appendChild(inputValue);

                        formatcontainer.appendChild(container);
                    }
                    filtersDiv.appendChild(mainDiv);
                }

                const checkboxFilters = [];

                function createFilterObject(filterSettings) {
                    filterSettings.forEach((filter) => {
                        if (filter.type === 'checkbox') {
                            const keyValues = {};
                            Object.assign(keyValues, {
                                header: filter.columnHeader,
                                value: filter.listItems,
                            });
                            checkboxFilters.push(keyValues);
                        }
                    });
                }

                function applyFilters() {
                    const filterForm = document.getElementById('filters');

                    filterForm.addEventListener('change', function() {
                        const filterOptionHTML = this.getElementsByClassName('filter-option');
                        const filterOption = [].slice.call(filterOptionHTML);

                        const geojCheckboxFilters = [];

                        filteredGeojson.features = [];
                        // const filteredFeatures = [];
                        // filteredGeojson.features = [];

                        filterOption.forEach((filter) => {
                            if (filter.type === 'checkbox' && filter.checked) {
                                checkboxFilters.forEach((objs) => {
                                    Object.entries(objs).forEach(([, value]) => {
                                        if (value.includes(filter.value)) {
                                            const geojFilter = [objs.header, filter.value];
                                            geojCheckboxFilters.push(geojFilter);
                                        }
                                    });
                                });
                            }
                        });

                        if (geojCheckboxFilters.length === 0) {
                            geojsonData.features.forEach((feature) => {
                                filteredGeojson.features.push(feature);
                            });
                        } else if (geojCheckboxFilters.length > 0) {
                            geojCheckboxFilters.forEach((filter) => {
                                geojsonData.features.forEach((feature) => {
                                    if (feature.properties[filter[0]].includes(filter[1])) {
                                        if (
                                            filteredGeojson.features.filter(
                                                (f) => f.properties.id === feature.properties.id,
                                            ).length === 0
                                        ) {
                                            filteredGeojson.features.push(feature);
                                        }
                                    }
                                });
                            });
                        }

                        map.getSource('geopoints').setData(filteredGeojson);                   
                        //buildLocationList(filteredGeojson); // activate if side bar filter is needed, need to solve issue with 2 and 4 checkboxes, they are emptying sidebar
                    });
                }

                function filters(filterSettings) {
                    filterSettings.forEach((filter) => {
                        if (filter.type === 'checkbox') {
                            buildCheckbox(filter.title, filter.listItems, filter.botype);
                        }
                    });
                }

                function removeFilters() {
                    const input = document.getElementsByTagName('input');
                    const select = document.getElementsByTagName('select');
                    const selectOption = [].slice.call(select);
                    const checkboxOption = [].slice.call(input);
                    filteredGeojson.features = [];
                    checkboxOption.forEach((checkbox) => {
                        if (checkbox.type === 'checkbox' && checkbox.checked === true) {
                            checkbox.checked = false;
                        }
                    });

                    selectOption.forEach((option) => {
                        option.selectedIndex = 0;
                    });

                    map.getSource('geopoints').setData(geojsonData);
                    buildLocationList(geojsonData);
                }

                function removeFiltersButton() {
                    const removeFilter = document.getElementById('removeFilters');
                    removeFilter.addEventListener('click', () => {
                        removeFilters();
                    });
                }

                createFilterObject(filters_);
                applyFilters();
                filters(filters_);
                removeFiltersButton();

                map.addSource('geopoints', {
                    type: 'geojson',
                    data: geojsonData,
                    cluster: true,
                    clusterMaxZoom: 14,
                    clusterRadius: 50,
                    clusterProperties: {
                        sum: ["+", ["get", "Customers", ["properties"]]],
                    },
                });

                map.addLayer({
                    id: 'clusters',
                    type: 'circle',
                    source: 'geopoints',
                    filter: ['has', "sum"],
                    paint: {
                        'circle-color': [
                            'step',
                            ['get', "sum"],
                            '#51bbd6',
                            10,
                            '#f1f075',
                            50,
                            '#f28cb1'
                        ],
                        'circle-radius': [
                            'step',
                            ['get', "sum"],
                            20,
                            10,
                            30,
                            50,
                            40
                        ]
                    }
                });

                map.addLayer({
                    id: 'cluster-count',
                    type: 'symbol',
                    source: 'geopoints',
                    filter: ['has', 'point_count'],
                    layout: {
                        'text-field': ["get", "sum"],
                        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                        'text-size': 12
                    }
                });

                map.addLayer({
                    id: 'unclustered-point',
                    type: 'circle',
                    source: 'geopoints',
                    filter: ['!', ['has', 'point_count']],
                    paint: {
                        'circle-color': '#fecb00',
                        'circle-radius': 12,
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#333'
                    }
                });

                map.on('click', 'clusters', function(e) {
                    var features = map.queryRenderedFeatures(e.point, {
                        layers: ['clusters']
                    });
                    var clusterId = features[0].properties.cluster_id;
                    map.getSource('geopoints').getClusterExpansionZoom(
                        clusterId,
                        function(err, zoom) {
                            if (err) return;

                            map.easeTo({
                                center: features[0].geometry.coordinates,
                                zoom: zoom
                            });
                        }
                    );
                });
                map.on('click', 'unclustered-point', function(e) {
                    var coordinates = e.features[0].geometry.coordinates.slice();
                    var description = `<h4>` + `<b>` + `Country: ` + e.features[0].properties.Country + `</b>` + `</h4>` + `<h4>` + `<b>` + `City: ` + e.features[0].properties.City_State + `</b>` + `</h4>` + `</h4>` + `<h4>` + `<b>` + e.features[0].properties.Criteria_1fx + `: ` + `</b>` + e.features[0].properties.Criteria_1fxes + `</h4>` + `<h4>` + `<b>` + e.features[0].properties.Criteria_2fx + `: ` + `</b>` + e.features[0].properties.Criteria_2fxes + `</h4>` + `<h4>` + `<b>` + e.features[0].properties.Criteria_3fx + `: ` + `</b>` + e.features[0].properties.Criteria_3fxes + `</h4>` + `<h4>` + `<b>` + e.features[0].properties.Criteria_4fx + `: ` + `</b>` + e.features[0].properties.Criteria_4fxes + `</h4>`;
                    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                    }
                    new mapboxgl.Popup()
                        .setLngLat(coordinates)
                        .setHTML(description)
                        .addTo(map);
                });
                map.on('mouseenter', 'clusters', function() {
                    map.getCanvas().style.cursor = 'pointer';
                });
                map.on('mouseleave', 'clusters', function() {
                    map.getCanvas().style.cursor = '';
                });
                map.on('mouseenter', 'unclustered-point', function() {
                    map.getCanvas().style.cursor = 'pointer';
                });
                map.on('mouseleave', 'unclustered-point', function() {
                    map.getCanvas().style.cursor = '';
                });

            },
        );

        map.on('click', 'geopoints', (e) => {
            const features = map.queryRenderedFeatures(e.point, {
                layers: ['geopoints'],
            });
            const clickedPoint = features[0].geometry.coordinates;
            flyToLocation(clickedPoint);
            sortByDistance(clickedPoint);
            createPopup(features[0]);
        });

        map.on('mouseenter', 'geopoints', () => {
            map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'geopoints', () => {
            map.getCanvas().style.cursor = '';
        });
        buildLocationList(geojsonData);
    }
});

// Modal - popup for filtering results
const filterResults = document.getElementById('filterResults');
const exitButton = document.getElementById('exitButton');
const modal = document.getElementById('modal');

filterResults.addEventListener('click', () => {
    modal.classList.remove('hide-visually');
    modal.classList.add('z5');
});

exitButton.addEventListener('click', () => {
    modal.classList.add('hide-visually');
});

const title = document.getElementById('title');
title.innerText = config.title;
const description = document.getElementById('description');
description.innerText = config.description;

function transformRequest(url) {
    const isMapboxRequest =
        url.slice(8, 22) === 'api.mapbox.com' ||
        url.slice(10, 26) === 'tiles.mapbox.com';
    return {
        url: isMapboxRequest ? url.replace('?', '?pluginName=finder&') : url,
    };
}

dragElement(document.getElementById("filterbox"));

function dragElement(elmnt) {
    var pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;
    if (document.getElementById(elmnt.id + "header")) {
        // if present, the header is where you move the DIV from:
        document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
    } else {
        // otherwise, move the DIV from anywhere inside the DIV:
        elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        //e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}
