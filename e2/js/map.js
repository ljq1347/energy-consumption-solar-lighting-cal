var map;
var capitals = [];
var markerClusterGroup;
var markersMap = {};
var countryDataCache = {};
var loadedCountries = {};
var currentChart = null;
var dataPanel = null;
var searchBox = null;
var searchResults = null;
var allMarkers = [];
var currentSearchQuery = '';
var countryBounds = null;  
var panelClickOutsideHandler = null;  

function loadLocalText(path, callback) {
    if (typeof loadLocalFile === 'function') {
        loadLocalFile(path, { retries: 2 })
            .then(function (text) {
                callback(text, null);
            })
            .catch(function (err) {
                console.error('Failed to load ' + path + ':', err);
                callback(null, err);
            });
        return;
    }
    var xhr = new XMLHttpRequest();
    xhr.open('GET', path, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200 || xhr.status === 0) {
                callback(xhr.responseText, null);
            } else {
                callback(null, new Error('XHR ' + xhr.status));
            }
        }
    };
    xhr.onerror = function () {
        callback(null, new Error('XHR network error'));
    };
    xhr.send();
}

function loadLocalJson(path, callback) {
    loadLocalText(path, function (text, err) {
        if (err || !text) {
            callback(null);
            return;
        }
        try {
            callback(JSON.parse(text));
        } catch (e) {
            console.error('Failed to parse JSON:', path, e);
            callback(null);
        }
    });
}

function createClusterDivIcon(count) {
    var size = count > 50 ? 40 : (count > 10 ? 30 : 22);
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.fillStyle = '#0066cc';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold ' + (size > 30 ? '14px' : '11px') + ' Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(count), size / 2, size / 2);
    return L.divIcon({
        html: '<img src="' + canvas.toDataURL() + '" width="' + size + '" height="' + size + '" alt="" style="display:block;" />',
        className: 'custom-cluster',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
    });
}

function loadCountryAndSearch(countryCode, query) {
    currentSearchQuery = query;
    loadCountryData(countryCode, function() {
        var matches = [];
        var countryData = countryDataCache[countryCode];
        
        if (countryData && countryData.cities) {
            matches = countryData.cities.filter(function(city) {
                return city.name.toLowerCase().includes(query.toLowerCase());
            }).map(function(city) {
                return { ...city, country: countryCode, source: 'country' };
            });
        }
        
        if (matches.length === 0) {
            searchResults.innerHTML = '<div class="search-no-result">No results found in ' + (countryData.country || countryCode) + '</div>';
        } else {
            var html = '';
            matches.slice(0, 20).forEach(function(city) {
                var countryName = countryData.country || countryCode;
                var adminInfo = city.admin1_code ? ' (' + city.admin1_code + ')' : '';
                html += '<div class="search-result-item" data-lat="' + city.location[0] + '" data-lng="' + city.location[1] + '" data-name="' + city.name + '" data-country="' + countryCode + '"><strong class="search-city-name">' + city.name + adminInfo + '</strong><div class="search-country-name">' + countryName + '</div></div>';
            });
            searchResults.innerHTML = html;
            
            document.querySelectorAll('.search-result-item').forEach(function(item) {
                item.addEventListener('click', function() {
                    var lat = parseFloat(this.dataset.lat);
                    var lng = parseFloat(this.dataset.lng);
                    var countryCode = this.dataset.country;
                    map.setView([lat, lng], 10);
                    
                    if (countryCode && countryDataCache[countryCode]) {
                        var countryCity = countryDataCache[countryCode].cities.find(function(c) {
                            return c.location[0] === lat && c.location[1] === lng;
                        });
                        if (countryCity) {
                            showDataPanel(countryCity, countryDataCache[countryCode].country || countryCode);
                        }
                    }
                    searchResults.style.display = 'none';
                    document.getElementById('citySearchInput').value = '';
                });
            });
        }
        searchResults.style.display = 'block';
    });
}

function loadCapitalsData(callback) {
    loadLocalJson('js/hours.json', function (data) {
        capitals = Array.isArray(data) ? data : [];
        if (!capitals.length) {
            console.warn('capitals empty — check js/hours.json load on iOS');
        }
        if (callback) callback();
    });
}

function loadCountryData(countryCode, callback) {
    if (countryDataCache[countryCode]) {
        callback(countryDataCache[countryCode]);
        return;
    }
    loadLocalJson('js/hours/' + countryCode + '.json', function (data) {
        if (data) {
            countryDataCache[countryCode] = data;
        }
        callback(data);
    });
}

function createSearchBox() {
    if (searchBox) return;

    searchBox = document.createElement('div');
    searchBox.className = 'search-box';

    var input = document.createElement('input');
    input.type = 'text';
    input.id = 'citySearchInput';
    input.placeholder = 'Search city for PV out';
    input.autocomplete = 'off';

    searchResults = document.createElement('div');
    searchResults.id = 'searchResults';

    var countryNames = {};

    function updateCountryNames() {
        for (var countryCode in countryDataCache) {
            var countryData = countryDataCache[countryCode];
            if (countryData && countryData.country) {
                countryNames[countryCode] = countryData.country;
            }
        }
    }

    var searchInput = input;

    function performSearch(query) {
        updateCountryNames();
        
        var matches = [];

        matches = matches.concat(capitals.filter(function(city) {
            return city.name.toLowerCase().includes(query);
        }).map(function(city) {
            return { ...city, source: 'capitals' };
        }));

        for (var countryCode in countryDataCache) {
            var countryData = countryDataCache[countryCode];
            if (countryData && countryData.cities) {
                var countryMatches = countryData.cities.filter(function(city) {
                    return city.name.toLowerCase().includes(query);
                }).map(function(city) {
                    return { ...city, country: countryCode, source: 'country' };
                });
                matches = matches.concat(countryMatches);
            }
        }

        return matches.slice(0, 20);
    }

    function displayResults(matches) {
        if (matches.length === 0) {
            searchResults.innerHTML = '<div class="search-no-result">No result</div>';
        } else {
            var html = '';
            matches.forEach(function(city) {
                var countryName = countryNames[city.country] || city.country;
                var adminInfo = city.admin1_code ? ' (' + city.admin1_code + ')' : '';
                html += '<div class="search-result-item" data-lat="' + city.location[0] + '" data-lng="' + city.location[1] + '" data-name="' + city.name + '" data-country="' + city.country + '"><strong class="search-city-name">' + city.name + adminInfo + '</strong><div class="search-country-name">' + countryName + '</div></div>';
            });
            searchResults.innerHTML = html;
        }
        searchResults.style.display = 'block';

        document.querySelectorAll('.search-result-item').forEach(function(item) {
            item.addEventListener('click', function() {
                var lat = parseFloat(this.dataset.lat);
                var lng = parseFloat(this.dataset.lng);
                var name = this.dataset.name;
                var countryCode = this.dataset.country;
                map.setView([lat, lng], 10);
                var city = capitals.find(function(c) {
                    return c.location[0] === lat && c.location[1] === lng;
                });
                if (city) {
                    showCityPanel(city);
                } else if (countryCode && countryDataCache[countryCode]) {
                    var countryCity = countryDataCache[countryCode].cities.find(function(c) {
                        return c.location[0] === lat && c.location[1] === lng;
                    });
                    if (countryCity) {
                        showDataPanel(countryCity, countryNames[countryCode] || countryCode);
                    }
                }
                searchResults.style.display = 'none';
                searchInput.value = '';
            });
        });
    }

    input.addEventListener('input', function() {
        var query = this.value.toLowerCase().trim();
        if (query.length === 0) {
            searchResults.style.display = 'none';
            return;
        }

        var matches = performSearch(query);

        if (matches.length === 0) {
            searchResults.innerHTML = '<div class="search-no-result">No results found. Please select a country to search:</div>';
            
            var html = '';
            for (var countryCode in countryDataCache) {
                var countryData = countryDataCache[countryCode];
                if (countryData && countryData.country) {
                    html += '<div class="country-list-item" onclick="loadCountryAndSearch(\'' + countryCode + '\', \'' + query + '\')">' + countryData.country + '</div>';
                }
            }
            
            if (html === '') {
                html = '<div class="search-no-country">No countries loaded yet. Zoom in on the map to load country data.</div>';
            }
            
            searchResults.innerHTML += html;
            searchResults.style.display = 'block';
        } else {
            displayResults(matches);
        }
    });

    input.addEventListener('touchstart', function(e) {
        e.preventDefault();
        this.focus();
    }, { passive: false });

    input.addEventListener('focus', function() {
        if (this.value.trim().length > 0) {
            this.dispatchEvent(new Event('input'));
        }
        this.style.opacity = '1';
        this.style.visibility = 'visible';
    });

    document.addEventListener('click', function(e) {
        if (e.target !== input && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });

    searchBox.appendChild(input);
    searchBox.appendChild(searchResults);
    document.getElementById('map').appendChild(searchBox);
}

function showCityPanel(city) {
    var countryCode = city.country || 'AE';
    loadCountryData(countryCode, function(data) {
        if (data && data.cities && data.cities.length > 0) {
            var cityData = data.cities.find(function(c) { 
                return c.location[0] === city.location[0] && c.location[1] === city.location[1]; 
            }) || data.cities.find(function(c) { return c.name === city.name; }) || data.cities[0];
            showDataPanel(cityData, data.country);
        }
    });
}
 

function loadCountryBounds(callback) {
    if (countryBounds) {
        callback();
        return;
    }
    loadLocalJson('js/country_bounds.json', function (data) {
        if (data && typeof data === 'object') {
            countryBounds = data;
            console.log('Loaded country bounds for ' + Object.keys(countryBounds).length + ' countries');
        } else {
            console.error('Failed to load country_bounds.json');
            countryBounds = {};
        }
        callback();
    });
}

function detectCountryByBounds(bounds) {
    var countries = [];
    
    if (!countryBounds) {
        console.warn('Country bounds not loaded yet');
        return countries;
    }
    
    var latMin = bounds.getSouth();
    var latMax = bounds.getNorth();
    var lngMin = bounds.getWest();
    var lngMax = bounds.getEast();
    
    for (var countryCode in countryBounds) {
        var b = countryBounds[countryCode].bounds;
        var countryLngMin = b[0];
        var countryLatMin = b[1];
        var countryLngMax = b[2];
        var countryLatMax = b[3];
        
        if (lngMax >= countryLngMin && lngMin <= countryLngMax &&
            latMax >= countryLatMin && latMin <= countryLatMax) {
            countries.push(countryCode);
        }
    }
    
    return countries;
}

function createDataPanel() {
    if (dataPanel) return dataPanel;

    dataPanel = document.createElement('div');
    dataPanel.id = 'sunDataPanel';
    document.getElementById('map').appendChild(dataPanel);
    return dataPanel;
}

function showDataPanel(cityData, countryName) {
    if (panelClickOutsideHandler) {
        document.removeEventListener('click', panelClickOutsideHandler);
        panelClickOutsideHandler = null;
    }
    
    var panel = createDataPanel();
    var isMobile = window.innerWidth < 500;

    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var values = months.map(function(m) { return cityData.monthly[m]; });
    var avg = cityData.average;

    var fontSize = isMobile ? '8px' : '10px';
    var titleSize = isMobile ? '12px' : '14px';
    var avgSize = isMobile ? '14px' : '16px';
    var padding = isMobile ? '2px' : '4px';
    var chartWidth = isMobile ? Math.min(window.innerWidth - 40, 320) : 360;
    var chartHeight = isMobile ? 120 : 200;

    var html = '<div class="sun-panel-header">';
    var adminInfo = cityData.admin1_code ? ' (' + cityData.admin1_code + ')' : '';
    html += '<h3 class="sun-panel-title">' + countryName + ' - ' + cityData.name + adminInfo + '</h3>';
    html += '<p class="sun-panel-subtitle">Average <span class="pvout-link" onclick="showPvoutExplanation()">PVOUT</span>: <strong style="color:#0066cc;font-size:' + avgSize + ';">' + avg.toFixed(2) + '</strong></p>';
    html += '<p class="sun-panel-coords">Coordinates: ' + cityData.location[0].toFixed(4) + ', ' + cityData.location[1].toFixed(4) + '</p>';
    html += '</div>';

    html += '<div class="sun-panel-chart"><canvas id="sunHoursChart" width="' + chartWidth + '" height="' + chartHeight + '"></canvas></div>';

    html += '<div class="sun-panel-table">';
    html += '<h4>Monthly Data</h4>';
    html += '<table>';
    html += '<tr>';
    months.forEach(function(m) {
        html += '<th>' + m + '</th>';
    });
    html += '</tr><tr>';
    values.forEach(function(v) {
        html += '<td>' + v.toFixed(2) + '</td>';
    });
    html += '</tr></table></div>';

    html += '<button id="closeSunPanel">×</button>';

    panel.innerHTML = html;
    panel.style.display = 'block';

    document.getElementById('closeSunPanel').onclick = function() {
        panel.style.display = 'none';
        if (currentChart) {
            currentChart.destroy();
            currentChart = null;
        }
        if (panelClickOutsideHandler) {
            document.removeEventListener('click', panelClickOutsideHandler);
            panelClickOutsideHandler = null;
        }
    };

    panelClickOutsideHandler = function(event) {
        if (panel && panel.style.display === 'block') {
            var isClickInside = panel.contains(event.target);
            if (!isClickInside) {
                panel.style.display = 'none';
                if (currentChart) {
                    currentChart.destroy();
                    currentChart = null;
                }
                document.removeEventListener('click', panelClickOutsideHandler);
                panelClickOutsideHandler = null;
            }
        }
    };

    setTimeout(function() {
        document.addEventListener('click', panelClickOutsideHandler);
    }, 100);

    setTimeout(function() {
        var ctx = document.getElementById('sunHoursChart').getContext('2d');
        if (currentChart) currentChart.destroy();

        currentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: 'PVOUT',
                    data: values,
                    backgroundColor: 'rgba(0, 102, 204, 0.7)',
                    borderColor: 'rgba(0, 102, 204, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    title: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 7,
                        title: { display: false }
                    },
                    x: {
                        ticks: {
                            font: { size: isMobile ? 8 : 10 }
                        }
                    }
                }
            }
        });
    }, 100);
}

function hideDataPanel() {
    if (dataPanel) {
        dataPanel.style.display = 'none';
    }
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }
}

function addMarkerForCity(city, countryCode) {
    var marker = L.marker(city.location, {
        icon: L.divIcon({
            className: 'custom-marker',
            html: '<div class="custom-marker-pin"></div>',
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        })
    });

    var pvout = city.peakSunHour || city.average || 0;
    var tooltipContent = '<strong>' + city.name + '</strong><br/>PVOUT: ' + pvout.toFixed(2);
    marker.bindTooltip(tooltipContent, {
        permanent: false,
        direction: 'top',
        className: 'custom-tooltip',
        offset: [0, -10],
        opacity: 0.9
    });

    marker.on('click', function(e) {
        var countryData = countryDataCache[countryCode];
        if (countryData) {
            var cityData = countryData.cities.find(function(c) { 
                return c.location[0] === city.location[0] && c.location[1] === city.location[1]; 
            }) || countryData.cities.find(function(c) { return c.name === city.name; }) || countryData.cities[0];
            showDataPanel(cityData, countryData.country);
        } else {
            showCityPanel(city);
        }
    });

    markerClusterGroup.addLayer(marker);
    allMarkers.push(marker);
}

function loadAndAddCountryMarkers(countryCode) {
    if (loadedCountries[countryCode]) return;
    
    loadCountryData(countryCode, function(data) {
        if (data && data.cities) {
            loadedCountries[countryCode] = true;
            data.cities.forEach(function(city) {
                addMarkerForCity(city, countryCode);
            });
            console.log('Loaded ' + data.cities.length + ' cities for ' + data.country);
        }
    });
}

function updateVisibleCountries() {
    var bounds = map.getBounds();
    var countries = detectCountryByBounds(bounds);
    
    countries.forEach(function(countryCode) {
        loadAndAddCountryMarkers(countryCode);
    });
}

function initMap() {
    var mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('Map container not found!');
        return;
    }
    mapContainer.style.width = '100%';
    mapContainer.style.height = '100%';
    
    loadCountryBounds(function() {
        map = L.map('map', {
        center: [37.0, -95.7],
            zoom: 2,
        zoomSnap: 0.5,
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true,
        keyboard: true,
        zoomControl: true,
        worldCopyJump: false,
        continuousWorld: false,
        maxBounds: [[-90, -180], [90, 180]],
        maxBoundsViscosity: 1.0
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    markerClusterGroup = L.markerClusterGroup({
        maxClusterRadius: function(zoom) {
            var baseRadius = 50;
            var zoomDiff = zoom - 2;
            return Math.max(baseRadius * Math.pow(0.7, zoomDiff), 15);
        },
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: function (cluster) {
            return createClusterDivIcon(cluster.getChildCount());
        }
    });

    addMarkers();
    markerClusterGroup.addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    createSearchBox();

    map.on('zoomend', function() {
        var currentZoom = map.getZoom();
        var showTooltips = currentZoom >= 8;
        
        allMarkers.forEach(function(marker) {
            if (showTooltips) {
                marker.openTooltip();
            } else {
                marker.closeTooltip();
            }
        });
        
        updateVisibleCountries();
    });

    map.on('moveend', function() {
        updateVisibleCountries();
    });

    updateVisibleCountries();
    }); // 闭合 loadCountryBounds 回调
}

function addMarkers() {
    capitals.forEach(function(capital) {
        addMarkerForCity(capital);
    });
}

function bootMapApp() {
    if (window.__e3MapBooted) return;
    window.__e3MapBooted = true;
    loadCapitalsData(function () {
        initMap();
    });
}

document.addEventListener('DOMContentLoaded', bootMapApp);
document.addEventListener('plusready', bootMapApp);

var PVOUT_EXPLANATION_DATA = {
    "title": "Explanation of PVOUT (Photovoltaic Power Potential) Data Metrics",
    "intro": "In our solar energy data system, you may notice that monthly power generation data for certain regions appears counterintuitive. For example: desert cities like Douglas, Arizona, show their lowest power generation in July (summer) despite being peak summer months. This is not a data error, but rather the result of scientific principles of photovoltaic generation combined with local climate phenomena. Here's a detailed explanation:",
    "sections": [
        {
            "title": "1. What is PVOUT?",
            "content": "- Full Name: Photovoltaic Power Potential<br>- Definition: It represents the actual electricity output per 1 kilowatt peak (kWp) of PV system at a specific location and time in real-world conditions (unit typically: kWh/kWp).<br>- Core Difference: PVOUT ≠ Pure sunlight hours. Pure sunlight hours (irradiance) only represent how strong the sun is; PVOUT represents how much electricity the PV panels can ultimately convert. It is the \"net power generation\" calculated after comprehensively accounting for solar radiation, air temperature, wind speed, high-temperature losses of PV components, inverter efficiency, and other factors."
        },
        {
            "title": "2. Why does power generation become the lowest in summer (July-August)?",
            "content": "This \"abnormal\" phenomenon is primarily caused by the following three core reasons:"
        },
        {
            "title": "Reason 1: \"Thermal Loss\" Caused by High Temperature (Main Reason)",
            "content": "- Scientific Principle: Solar PV panels have a \"negative temperature coefficient\" characteristic. This means the hotter the PV panel, the lower its power generation efficiency. The ideal environment for PV panels is \"strong sunlight, low temperature\".<br>- Actual Situation: Summer temperatures in Arizona in July are extremely high (often exceeding 40°C). Under intense sun exposure, the PV panel's own temperature can soar to 60°C - 70°C. This extreme high temperature causes increased internal resistance in PV components, leading to a dramatic decline in power generation efficiency."
        },
        {
            "title": "Reason 2: Unique Summer \"Monsoon Climate\" (Sudden Increase in Clouds and Thunderstorms)",
            "content": "- Special Climate: The southwestern United States (including southern Arizona) experiences a unique \"North American Monsoon\" each year from July to August.<br>- Actual Situation: During this period, moist air flows from the Gulf of California, causing the originally sunny desert region to frequently experience thunderstorms, strong convection, and heavy cumulonimbus clouds in the afternoons of July and August. Cloud cover significantly reduces the direct normal irradiance (DNI) received at ground level, directly weakening total power generation."
        },
        {
            "title": "Reason 3: \"High-Temperature Power Limiting\" of Inverters and System Electronics",
            "content": "- Solar systems consist not only of PV panels but also electronic devices like inverters. In the extreme high-temperature environment of July, inverters typically trigger \"temperature protection\" to prevent overheating and damage, actively reducing operating power (i.e., derated operation), which further depresses actual power output in July."
        },
        {
            "title": "📌 Summary and Conclusion",
            "content": "Therefore, spring (March-May) is often the golden period for highest PV power generation efficiency in these desert regions (with abundant sunlight and cool temperatures, PV panels operate at optimal conditions). Although July is in summer, the dual combination of \"efficiency collapse caused by extreme high temperature\" and \"obstruction by monsoon cloud and rain weather\" causes PVOUT (final power generation) to show an annual low. This data fully conforms to real physical and meteorological laws, so please reference it with confidence."
        }
    ]
};

function showPvoutExplanation() {
    var existingModal = document.getElementById('pvout-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    var modal = document.createElement('div');
    modal.id = 'pvout-modal';
    
    var content = document.createElement('div');
    content.className = 'pvout-modal-content';
    
    var closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.className = 'pvout-modal-close';
    closeBtn.addEventListener('click', function() {
        modal.remove();
    });
    
    var data = PVOUT_EXPLANATION_DATA;
    
    var title = document.createElement('h2');
    title.textContent = data.title;
    title.className = 'pvout-modal-title';
    content.appendChild(title);
    
    var intro = document.createElement('p');
    intro.innerHTML = data.intro;
    intro.className = 'pvout-modal-intro';
    content.appendChild(intro);
    
    data.sections.forEach(function(section) {
        var sectionTitle = document.createElement('h3');
        sectionTitle.textContent = section.title;
        sectionTitle.className = 'pvout-modal-section-title';
        content.appendChild(sectionTitle);
        
        var sectionContent = document.createElement('p');
        sectionContent.innerHTML = section.content;
        sectionContent.className = 'pvout-modal-section-content';
        content.appendChild(sectionContent);
    });
    
    content.appendChild(closeBtn);
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}


var VIEW_LEVELS = {
    WORLD: { minZoom: 0, maxZoom: 4, maxMarkers: 50, name: 'world' },
    CONTINENT: { minZoom: 4, maxZoom: 6, maxMarkers: 200, name: 'continent' },
    COUNTRY: { minZoom: 6, maxZoom: 10, maxMarkers: 500, name: 'country' },
    PROVINCE: { minZoom: 10, maxZoom: 13, maxMarkers: 1000, name: 'province' },
    CITY: { minZoom: 13, maxZoom: 19, maxMarkers: 2000, name: 'city' }
};

var DENSITY_CONFIG = {
    WORLD: { maxDensity: 0.1, maxMarkers: 50 },
    CONTINENT: { maxDensity: 1, maxMarkers: 200 },
    COUNTRY: { maxDensity: 5, maxMarkers: 500 },
    PROVINCE: { maxDensity: 20, maxMarkers: 1000 },
    CITY: { maxDensity: 100, maxMarkers: 2000 }
};

var chartCache = {
    data: {},
    loading: new Set(),
    lastAccess: {},
    maxCacheSize: 30,
    maxAge: 300000
};

var previousZoom = null;

function getCurrentViewLevel() {
    if (!map) return VIEW_LEVELS.WORLD;
    var zoom = map.getZoom();
    for (var key in VIEW_LEVELS) {
        var level = VIEW_LEVELS[key];
        if (zoom >= level.minZoom && zoom < level.maxZoom) {
            return level;
        }
    }
    return VIEW_LEVELS.WORLD;
}

function shouldLoadCountryData(countryCode) {
    var zoom = map.getZoom();
    console.log('shouldLoadCountryData:', countryCode, '当前缩放:', zoom);
    
    if (zoom < 4) {
        console.log('世界视图(zoom < 4): 不加载国家数据');
        return false;
    }
    
    if (loadedCountries[countryCode]) {
        console.log('国家已加载:', countryCode);
        return false;
    }
    
    console.log('允许加载国家数据:', countryCode);
    return true;
}

function getDensityLimit(viewLevel) {
    for (var key in VIEW_LEVELS) {
        if (VIEW_LEVELS[key] === viewLevel) {
            return DENSITY_CONFIG[key];
        }
    }
    return DENSITY_CONFIG.WORLD;
}

function sampleCitiesByDensity(cities) {
    var viewLevel = getCurrentViewLevel();
    var limit = getDensityLimit(viewLevel);
    
    if (cities.length <= limit.maxMarkers) {
        return cities;
    }
    
    var step = Math.floor(cities.length / limit.maxMarkers);
    return cities.filter(function(_, index) {
        return index % step === 0;
    });
}

function getCityCacheKey(cityData, countryName) {
    return (countryName || 'unknown') + '_' + cityData.name;
}

function cacheChartData(cityData, countryName, chartData) {
    var key = getCityCacheKey(cityData, countryName);
    chartCache.data[key] = chartData;
    chartCache.lastAccess[key] = Date.now();
    cleanupOldCharts();
}

function getCachedChart(cityData, countryName) {
    var key = getCityCacheKey(cityData, countryName);
    if (chartCache.data[key]) {
        chartCache.lastAccess[key] = Date.now();
        return chartCache.data[key];
    }
    return null;
}

function cleanupOldCharts() {
    var keys = Object.keys(chartCache.data);
    if (keys.length <= chartCache.maxCacheSize) return;
    
    var sorted = keys.sort(function(a, b) {
        return (chartCache.lastAccess[a] || 0) - (chartCache.lastAccess[b] || 0);
    });
    
    sorted.slice(0, keys.length - chartCache.maxCacheSize).forEach(function(key) {
        delete chartCache.data[key];
        delete chartCache.lastAccess[key];
    });
}

function calculateZoomDelta(newZoom) {
    if (previousZoom === null) {
        previousZoom = newZoom;
        return { type: 'initial', delta: 0 };
    }
    
    var delta = newZoom - previousZoom;
    previousZoom = newZoom;
    
    if (delta >= 3) return { type: 'major_zoom', delta: delta };
    if (delta >= 1) return { type: 'minor_zoom', delta: delta };
    if (delta <= -3) return { type: 'major_out', delta: delta };
    if (delta <= -1) return { type: 'minor_out', delta: delta };
    return { type: 'no_change', delta: delta };
}

function preloadVisibleCharts() {
    var zoom = map.getZoom();
    if (zoom < 8) return;
    
    var visibleCountries = detectCountryByBounds(map.getBounds());
    visibleCountries.forEach(function(countryCode) {
        var countryData = countryDataCache[countryCode];
        if (countryData && countryData.cities) {
            countryData.cities.slice(0, 5).forEach(function(city) {
                var cached = getCachedChart(city, countryData.country);
                if (!cached) {
                    setTimeout(function() {
                        cacheChartData(city, countryData.country, {
                            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                            datasets: [{ label: 'PVOUT', data: Object.values(city.monthly) }]
                        });
                    }, 500);
                }
            });
        }
    });
}

function cleanupExcessMarkers() {
    var viewLevel = getCurrentViewLevel();
    var maxMarkers = viewLevel.maxMarkers;
    
    if (allMarkers.length > maxMarkers * 1.5) {
        console.log('Marker数量:', allMarkers.length, '超过阈值', maxMarkers);
    }
}

(function() {
    var originalUpdateVisibleCountries = updateVisibleCountries;
    updateVisibleCountries = function() {
        var bounds = map.getBounds();
        var countries = detectCountryByBounds(bounds);
        
        console.log('=== updateVisibleCountries ===');
        console.log('当前缩放:', map.getZoom());
        console.log('检测到可见国家:', countries.length, '个');
        console.log('已加载国家:', Object.keys(loadedCountries).length, '个');
        
        countries.forEach(function(countryCode) {
            if (shouldLoadCountryData(countryCode)) {
                console.log('加载国家数据:', countryCode);
                loadAndAddCountryMarkers(countryCode);
            } else {
                console.log('跳过加载:', countryCode, '(已加载或视图级别不允许)');
            }
        });
    };
    
    var originalLoadAndAddCountryMarkers = loadAndAddCountryMarkers;
    loadAndAddCountryMarkers = function(countryCode) {
        if (loadedCountries[countryCode]) return;
        
        loadCountryData(countryCode, function(data) {
            if (data && data.cities) {
                loadedCountries[countryCode] = true;
                
                var cities = sampleCitiesByDensity(data.cities);
                
                cities.forEach(function(city) {
                    addMarkerForCity(city, countryCode);
                });
                console.log('Loaded ' + cities.length + ' cities for ' + data.country);
            }
        });
    };
    
    var originalShowDataPanel = showDataPanel;
    showDataPanel = function(cityData, countryName) {
        if (panelClickOutsideHandler) {
            document.removeEventListener('click', panelClickOutsideHandler);
            panelClickOutsideHandler = null;
        }
        
        var panel = createDataPanel();
        var isMobile = window.innerWidth < 500;
        
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var values = months.map(function(m) { return cityData.monthly[m]; });
        var avg = cityData.average;
        
        var fontSize = isMobile ? '8px' : '10px';
        var titleSize = isMobile ? '12px' : '14px';
        var avgSize = isMobile ? '14px' : '16px';
        var chartWidth = isMobile ? Math.min(window.innerWidth - 40, 320) : 360;
        var chartHeight = isMobile ? 120 : 200;
        
        var html = '<div class="sun-panel-header">';
        var adminInfo = cityData.admin1_code ? ' (' + cityData.admin1_code + ')' : '';
        html += '<h3 class="sun-panel-title">' + countryName + ' - ' + cityData.name + adminInfo + '</h3>';
        html += '<p class="sun-panel-subtitle">Average <span class="pvout-link" onclick="showPvoutExplanation()">PVOUT</span>: <strong style="color:#0066cc;font-size:' + avgSize + ';">' + avg.toFixed(2) + '</strong></p>';
        html += '<p class="sun-panel-coords">coordinates: ' + cityData.location[0].toFixed(4) + ', ' + cityData.location[1].toFixed(4) + '</p>';
        html += '</div>';
        
        html += '<div class="sun-panel-chart"><canvas id="sunHoursChart" width="' + chartWidth + '" height="' + chartHeight + '"></canvas></div>';
        
        html += '<div class="sun-panel-table">';
        html += '<h4>Monthly Data</h4>';
        html += '<table><tr>';
        months.forEach(function(m) { html += '<th>' + m + '</th>'; });
        html += '</tr><tr>';
        values.forEach(function(v) { html += '<td>' + v.toFixed(2) + '</td>'; });
        html += '</tr></table></div>';
        
        html += '<button id="closeSunPanel">×</button>';
        
        panel.innerHTML = html;
        panel.style.display = 'block';
        
        document.getElementById('closeSunPanel').onclick = function() {
            panel.style.display = 'none';
            if (currentChart) { currentChart.destroy(); currentChart = null; }
            if (panelClickOutsideHandler) {
                document.removeEventListener('click', panelClickOutsideHandler);
                panelClickOutsideHandler = null;
            }
        };
        
        panelClickOutsideHandler = function(event) {
            if (panel && panel.style.display === 'block') {
                var isClickInside = panel.contains(event.target);
                if (!isClickInside) {
                    panel.style.display = 'none';
                    if (currentChart) { currentChart.destroy(); currentChart = null; }
                    document.removeEventListener('click', panelClickOutsideHandler);
                    panelClickOutsideHandler = null;
                }
            }
        };
        
        setTimeout(function() {
            document.addEventListener('click', panelClickOutsideHandler);
        }, 100);
        
        setTimeout(function() {
            var ctx = document.getElementById('sunHoursChart').getContext('2d');
            if (currentChart) currentChart.destroy();
            
            var cached = getCachedChart(cityData, countryName);
            
            currentChart = new Chart(ctx, {
                type: 'bar',
                data: cached || {
                    labels: months,
                    datasets: [{
                        label: 'PVOUT',
                        data: values,
                        backgroundColor: 'rgba(0, 102, 204, 0.7)',
                        borderColor: 'rgba(0, 102, 204, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { display: false }, title: { display: false } },
                    scales: {
                        y: { beginAtZero: true, max: 7, title: { display: false } },
                        x: { ticks: { font: { size: isMobile ? 8 : 10 } } }
                    }
                }
            });
            
            if (!cached) {
                cacheChartData(cityData, countryName, {
                    labels: months,
                    datasets: [{ label: 'PVOUT', data: values }]
                });
            }
        }, 100);
    };
    
    var originalInitMap = initMap;
    initMap = function() {
        var mapContainer = document.getElementById('map');
        if (!mapContainer) {
            console.error('Map container not found!');
            return;
        }
        mapContainer.style.width = '100%';
        mapContainer.style.height = '100%';
        
        loadCountryBounds(function() {
            map = L.map('map', {
                center: [37.0, -95.7],
                zoom: 2,
                zoomSnap: 0.5,
                dragging: true,
                scrollWheelZoom: true,
                doubleClickZoom: true,
                touchZoom: true,
                keyboard: true,
                zoomControl: true,
                worldCopyJump: false,
                continuousWorld: false,
                maxBounds: [[-90, -180], [90, 180]],
                maxBoundsViscosity: 1.0
            });
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(map);
            
            markerClusterGroup = L.markerClusterGroup({
                maxClusterRadius: function(zoom) {
                    var baseRadius = 50;
                    var zoomDiff = zoom - 2;
                    return Math.max(baseRadius * Math.pow(0.7, zoomDiff), 15);
                },
                showCoverageOnHover: false,
                zoomToBoundsOnClick: true,
                iconCreateFunction: function (cluster) {
                    return createClusterDivIcon(cluster.getChildCount());
                }
            });
            
            addMarkers();
            markerClusterGroup.addTo(map);
            L.control.zoom({ position: 'bottomright' }).addTo(map);
            createSearchBox();
            
            map.on('zoomend', function() {
                var currentZoom = map.getZoom();
                var deltaInfo = calculateZoomDelta(currentZoom);
                
                if (deltaInfo.type === 'major_zoom') {
                    preloadVisibleCharts();
                }
                
                if (deltaInfo.type === 'major_out') {
                    cleanupExcessMarkers();
                    cleanupOldCharts();
                }
                
                var showTooltips = currentZoom >= 8;
                allMarkers.forEach(function(marker) {
                    if (showTooltips) {
                        marker.openTooltip();
                    } else {
                        marker.closeTooltip();
                    }
                });
                
                updateVisibleCountries();
            });
            
            map.on('moveend', function() {
                updateVisibleCountries();
            });
            
            updateVisibleCountries();
        });
    };
})();