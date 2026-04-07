(function() {
  // Dark matter style
  const style = {
    version: 8,
    name: 'Dark Matter',
    sources: {
      'basemap': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }
    },
    layers: [
      {
        id: 'basemap-tiles',
        type: 'raster',
        source: 'basemap'
      }
    ]
  };

  const map = new maplibregl.Map({
    container: 'map',
    style: style,
    center: [8.6753, 9.0820], // Center of Nigeria
    zoom: 5.5,
    minZoom: 4,
    maxZoom: 18,
    pitch: 0,
    antialias: true
  });

  map.addControl(new maplibregl.NavigationControl(), 'top-right');

  // Palette for different facility types
  const typeColors = {
    'health_facility': '#34d399', // green
    'school': '#60a5fa',          // blue
    'market': '#f0be7a',          // orange
    'water_point': '#38bdf8',     // light blue
    'government_building': '#9ca3af', // gray
    'police_station': '#1d4ed8',  // dark blue
    'fire_station': '#ef4444',    // red
    'post_office': '#f97316',     // orange-red
    'idp_site': '#c084fc',        // purple
    'church': '#fbbf24',          // amber
    'mosque': '#34d399',          // green
    'farm': '#a3e635',            // lime
    'factory': '#a8a29e',         // stone
    'energy_substation': '#fb923c', // orange
    'filling_station': '#f43f5e'  // rose
  };

  // Convert the color map to a Mapbox match expression
  const colorMatchExp = ['match', ['get', 't']];
  for (const [key, color] of Object.entries(typeColors)) {
    colorMatchExp.push(key, color);
  }
  colorMatchExp.push('#cbd5e1'); // default color

  const state = {
    features: [],
    activeTypes: new Set()
  };

  // Setup UI checkboxes
  const checkboxes = document.querySelectorAll('.type-filter');
  checkboxes.forEach(cb => {
    state.activeTypes.add(cb.value);
    cb.addEventListener('change', () => {
      if (cb.checked) {
        state.activeTypes.add(cb.value);
      } else {
        state.activeTypes.delete(cb.value);
      }
      updateMapSource();
    });
  });

  const loadingEl = document.getElementById('map-loading');
  const totalVisibleEl = document.getElementById('total-visible');

  function updateMapSource() {
    if (!map.getSource('facilities')) return;
    
    const filtered = state.features.filter(f => state.activeTypes.has(f.properties.t));
    totalVisibleEl.textContent = filtered.length.toLocaleString();
    
    map.getSource('facilities').setData({
      type: 'FeatureCollection',
      features: filtered
    });
  }

  map.on('load', () => {
    // Inject custom CSS styles for the sidebar filter dots
    let dynamicCSS = '';
    for (const [key, color] of Object.entries(typeColors)) {
      dynamicCSS += `.type-${key} { background-color: ${color}; box-shadow: 0 0 8px ${color}40; }\n`;
    }
    const styleEl = document.createElement('style');
    styleEl.textContent = dynamicCSS;
    document.head.appendChild(styleEl);

    // Fetch GeoJSON from the API so Pages does not need to ship a 46 MB static asset.
    fetch('/api/map-data')
      .then(r => r.json())
      .then(data => {
        state.features = data.features;
        loadingEl.style.opacity = '0';
        setTimeout(() => loadingEl.remove(), 300);

        map.addSource('facilities', {
          type: 'geojson',
          data: data,
          cluster: true,
          clusterMaxZoom: 14, // Max zoom to cluster points on
          clusterRadius: 50 // Radius of each cluster when clustering points
        });

        // 1. Cluster glow rings (blur)
        map.addLayer({
          id: 'clusters-glow',
          type: 'circle',
          source: 'facilities',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              'rgba(52, 211, 153, 0.2)', // < 100
              100,
              'rgba(240, 190, 122, 0.2)', // >= 100
              1000,
              'rgba(248, 113, 113, 0.2)' // >= 1000
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              30,
              100,
              45,
              1000,
              60
            ],
            'circle-blur': 1
          }
        });

        // 2. Cluster sharp circles
        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'facilities',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              'rgba(52, 211, 153, 0.6)', 
              100,
              'rgba(240, 190, 122, 0.6)', 
              1000,
              'rgba(248, 113, 113, 0.6)'
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
               18,
               100,
               24,
               1000,
               32
            ],
            'circle-stroke-width': 1,
            'circle-stroke-color': 'rgba(255, 255, 255, 0.5)'
          }
        });

        // 3. Cluster count text
        map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'facilities',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['Space Grotesk', 'sans-serif'],
            'text-size': 13,
            'text-allow-overlap': true
          },
          paint: {
            'text-color': '#ffffff'
          }
        });

        // 4. Unclustered individual points
        map.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'facilities',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': colorMatchExp,
            'circle-radius': 4,
            'circle-stroke-width': 0
          }
        });

        // 5. Unclustered point glow
        map.addLayer({
          id: 'unclustered-point-glow',
          type: 'circle',
          source: 'facilities',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': colorMatchExp,
            'circle-radius': 12,
            'circle-blur': 1,
            'circle-opacity': 0.5
          }
        });

        // Set initial total
        updateMapSource();

        // ── Interaction ──
        
        // Inspect a cluster on click
        map.on('click', 'clusters', (e) => {
          const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
          const clusterId = features[0].properties.cluster_id;
          map.getSource('facilities').getClusterExpansionZoom(clusterId).then((zoom) => {
            map.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom + 1
            });
          });
        });

        // Hover states
        map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = ''; });
        map.on('mouseenter', 'unclustered-point', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'unclustered-point', () => { map.getCanvas().style.cursor = ''; });

        // Popup for individual points
        map.on('click', 'unclustered-point', (e) => {
          const coords = e.features[0].geometry.coordinates.slice();
          const props = e.features[0].properties;
          
          while (Math.abs(e.lngLat.lng - coords[0]) > 180) {
            coords[0] += e.lngLat.lng > coords[0] ? 360 : -360;
          }

          const html = `<div class="map-popup">
            <span class="popup-kicker">${props.t.replace(/_/g, ' ')}</span>
            <h3>${props.n}</h3>
            <div class="popup-meta">
              <span class="meta-tag">${props.s === 'grid3' ? 'Verified (Grid3)' : 'Community'}</span>
            </div>
          </div>`;

          new maplibregl.Popup({ closeButton: false, className: 'glass-popup' })
            .setLngLat(coords)
            .setHTML(html)
            .addTo(map);
        });

      })
      .catch(err => {
        console.error('Failed to load map data:', err);
        loadingEl.textContent = 'Failed to load data. Please refresh.';
      });
  });
})();
