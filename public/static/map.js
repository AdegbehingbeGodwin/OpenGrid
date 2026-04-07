(function() {
  const style = {
    version: 8,
    name: 'OpenGrid Night Atlas',
    sources: {
      basemap: {
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

  const defaultView = {
    center: [8.6753, 9.082],
    zoom: 5.5
  };

  const map = new maplibregl.Map({
    container: 'map',
    style: style,
    center: defaultView.center,
    zoom: defaultView.zoom,
    minZoom: 4,
    maxZoom: 18,
    pitch: 0,
    antialias: true
  });

  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

  const typeColors = {
    health_facility: '#41d39f',
    school: '#68a5ff',
    market: '#e6ae67',
    water_point: '#53c4ff',
    government_building: '#a7b0bb',
    police_station: '#3569ff',
    fire_station: '#ef5a5a',
    post_office: '#ff8d4d',
    idp_site: '#b788ff',
    church: '#e4c04e',
    mosque: '#58cf8d',
    farm: '#9adf58',
    factory: '#b3a79f',
    energy_substation: '#f29a4a',
    filling_station: '#f25273'
  };

  const colorMatchExp = ['match', ['get', 't']];
  Object.entries(typeColors).forEach(function(entry) {
    colorMatchExp.push(entry[0], entry[1]);
  });
  colorMatchExp.push('#d9e3e8');

  const state = {
    features: [],
    activeTypes: new Set(),
    query: ''
  };

  const checkboxes = Array.from(document.querySelectorAll('.type-filter'));
  const loadingEl = document.getElementById('map-loading');
  const totalVisibleEl = document.getElementById('total-visible');
  const activeTypeCountEl = document.getElementById('active-type-count');
  const searchStateEl = document.getElementById('search-state');
  const filterStatusEl = document.getElementById('map-filter-status');
  const searchInput = document.getElementById('map-search');
  const selectAllBtn = document.getElementById('map-select-all');
  const clearAllBtn = document.getElementById('map-clear-all');
  const resetViewBtn = document.getElementById('map-reset-view');
  const viewportVisibleCountEl = document.getElementById('viewport-visible-count');
  const viewportLeadingTypeEl = document.getElementById('viewport-leading-type');
  const viewportBreakdownEl = document.getElementById('viewport-breakdown');
  const zoomLevelEl = document.getElementById('map-zoom-level');
  const sidebarToggleBtn = document.getElementById('map-sidebar-toggle');
  const sidebarEl = document.querySelector('.map-sidebar-premium');

  checkboxes.forEach(function(checkbox) {
    state.activeTypes.add(checkbox.value);
  });

  function updateStatus(total) {
    const activeCount = state.activeTypes.size;
    const queryText = state.query ? '"' + state.query + '"' : 'All';
    activeTypeCountEl.textContent = String(activeCount);
    searchStateEl.textContent = queryText;

    if (activeCount === 0) {
      filterStatusEl.textContent = 'No types selected. Choose at least one category to show facilities.';
      return;
    }

    const typeLabel =
      activeCount === checkboxes.length
        ? 'all facility types'
        : activeCount === 1
          ? '1 active type'
          : activeCount + ' active types';

    filterStatusEl.textContent =
      'Showing ' + total.toLocaleString() + ' facilities across ' + typeLabel + '.';
  }

  function titleizeType(value) {
    return String(value || '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, function(char) {
        return char.toUpperCase();
      });
  }

  function buildFilteredFeatures() {
    const query = state.query.trim().toLowerCase();
    return state.features.filter(function(feature) {
      const matchesType = state.activeTypes.has(feature.properties.t);
      if (!matchesType) return false;
      if (!query) return true;
      return String(feature.properties.n || '').toLowerCase().includes(query);
    });
  }

  function updateMapSource() {
    const source = map.getSource('facilities');
    if (!source) return;

    const filtered = buildFilteredFeatures();
    totalVisibleEl.textContent = filtered.length.toLocaleString();
    updateStatus(filtered.length);

    source.setData({
      type: 'FeatureCollection',
      features: filtered
    });

    updateViewportInsights(filtered);
  }

  function updateViewportInsights(features) {
    if (!viewportVisibleCountEl || !viewportLeadingTypeEl || !viewportBreakdownEl || !zoomLevelEl) {
      return;
    }

    zoomLevelEl.textContent = 'Zoom ' + map.getZoom().toFixed(1);

    if (!features.length) {
      viewportVisibleCountEl.textContent = '0';
      viewportLeadingTypeEl.textContent = '-';
      viewportBreakdownEl.innerHTML =
        '<div class="viewport-breakdown-empty">No facilities match the current filters.</div>';
      return;
    }

    const bounds = map.getBounds();
    const inView = features.filter(function(feature) {
      const coords = feature.geometry && feature.geometry.coordinates;
      return coords && bounds.contains([coords[0], coords[1]]);
    });

    viewportVisibleCountEl.textContent = inView.length.toLocaleString();

    if (!inView.length) {
      viewportLeadingTypeEl.textContent = '-';
      viewportBreakdownEl.innerHTML =
        '<div class="viewport-breakdown-empty">Pan or zoom to bring facilities into the current frame.</div>';
      return;
    }

    const counts = {};
    inView.forEach(function(feature) {
      const type = feature.properties.t;
      counts[type] = (counts[type] || 0) + 1;
    });

    const ranked = Object.entries(counts)
      .sort(function(a, b) {
        return b[1] - a[1];
      })
      .slice(0, 4);

    viewportLeadingTypeEl.textContent = titleizeType(ranked[0][0]);
    viewportBreakdownEl.innerHTML = ranked
      .map(function(entry) {
        return (
          '<div class="viewport-row">' +
          '<span>' + titleizeType(entry[0]) + '</span>' +
          '<strong>' + Number(entry[1]).toLocaleString() + '</strong>' +
          '</div>'
        );
      })
      .join('');
  }

  function setAllTypes(checked) {
    checkboxes.forEach(function(checkbox) {
      checkbox.checked = checked;
      if (checked) {
        state.activeTypes.add(checkbox.value);
      } else {
        state.activeTypes.delete(checkbox.value);
      }
    });
    updateMapSource();
  }

  function resetView() {
    map.easeTo({
      center: defaultView.center,
      zoom: defaultView.zoom,
      bearing: 0,
      pitch: 0,
      duration: 1100
    });
  }

  checkboxes.forEach(function(checkbox) {
    checkbox.addEventListener('change', function() {
      if (checkbox.checked) state.activeTypes.add(checkbox.value);
      else state.activeTypes.delete(checkbox.value);
      updateMapSource();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', function() {
      state.query = searchInput.value || '';
      updateMapSource();
    });
  }

  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', function() {
      setAllTypes(true);
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', function() {
      setAllTypes(false);
    });
  }

  if (resetViewBtn) {
    resetViewBtn.addEventListener('click', function() {
      resetView();
    });
  }

  if (sidebarToggleBtn && sidebarEl) {
    sidebarToggleBtn.addEventListener('click', function() {
      const collapsed = sidebarEl.classList.toggle('is-collapsed');
      sidebarToggleBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    });
  }

  map.on('load', function() {
    let dynamicCSS = '';
    Object.entries(typeColors).forEach(function(entry) {
      dynamicCSS += '.type-' + entry[0] + ' { background-color: ' + entry[1] + '; box-shadow: 0 0 10px ' + entry[1] + '40; }\n';
    });
    const styleEl = document.createElement('style');
    styleEl.textContent = dynamicCSS;
    document.head.appendChild(styleEl);

    fetch('/api/map-data')
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        state.features = data.features || [];

        if (loadingEl) {
          loadingEl.style.opacity = '0';
          setTimeout(function() {
            loadingEl.remove();
          }, 350);
        }

        map.addSource('facilities', {
          type: 'geojson',
          data: data,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50
        });

        map.addLayer({
          id: 'clusters-glow',
          type: 'circle',
          source: 'facilities',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              'rgba(65, 211, 159, 0.24)',
              100,
              'rgba(230, 174, 103, 0.22)',
              1000,
              'rgba(239, 90, 90, 0.22)'
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              34,
              100,
              48,
              1000,
              64
            ],
            'circle-blur': 1
          }
        });

        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'facilities',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              'rgba(65, 211, 159, 0.76)',
              100,
              'rgba(230, 174, 103, 0.76)',
              1000,
              'rgba(239, 90, 90, 0.76)'
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              18,
              100,
              26,
              1000,
              34
            ],
            'circle-stroke-width': 1.25,
            'circle-stroke-color': 'rgba(255, 255, 255, 0.55)'
          }
        });

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

        map.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'facilities',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': colorMatchExp,
            'circle-radius': 4.2,
            'circle-stroke-width': 0.6,
            'circle-stroke-color': 'rgba(8, 12, 10, 0.36)'
          }
        });

        updateMapSource();

        map.on('moveend', function() {
          updateViewportInsights(buildFilteredFeatures());
        });

        map.on('zoomend', function() {
          updateViewportInsights(buildFilteredFeatures());
        });

        map.on('click', 'clusters', function(event) {
          const features = map.queryRenderedFeatures(event.point, { layers: ['clusters'] });
          const clusterId = features[0].properties.cluster_id;
          map.getSource('facilities').getClusterExpansionZoom(clusterId).then(function(zoom) {
            map.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom + 1,
              duration: 1000
            });
          });
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

        map.on('click', 'unclustered-point', function(event) {
          const coords = event.features[0].geometry.coordinates.slice();
          const props = event.features[0].properties;

          while (Math.abs(event.lngLat.lng - coords[0]) > 180) {
            coords[0] += event.lngLat.lng > coords[0] ? 360 : -360;
          }

          const html =
            '<div class="map-popup">' +
            '<span class="popup-kicker">' + props.t.replace(/_/g, ' ') + '</span>' +
            '<h3>' + props.n + '</h3>' +
            '<div class="popup-meta">' +
            '<span class="meta-tag">' + (props.s === 'grid3' ? 'Verified (Grid3)' : 'Community') + '</span>' +
            '</div>' +
            '</div>';

          new maplibregl.Popup({ closeButton: false, className: 'glass-popup', offset: 18 })
            .setLngLat(coords)
            .setHTML(html)
            .addTo(map);
        });
      })
      .catch(function(error) {
        console.error('Failed to load map data:', error);
        if (loadingEl) {
          loadingEl.textContent = 'Failed to load data. Please refresh.';
        }
      });
  });
})();
