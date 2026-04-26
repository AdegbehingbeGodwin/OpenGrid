(function() {
  /* ── Basemap style ─────────────────────────────────────── */
  const style = {
    version: 8,
    name: 'OpenGrid Dark Atlas',
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      basemapBase: {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/dark_matter_nolabels/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/dark_matter_nolabels/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/dark_matter_nolabels/{z}/{x}/{y}.png',
          'https://d.basemaps.cartocdn.com/dark_matter_nolabels/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      },
      basemapLabels: {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/dark_matter_only_labels/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/dark_matter_only_labels/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/dark_matter_only_labels/{z}/{x}/{y}.png',
          'https://d.basemaps.cartocdn.com/dark_matter_only_labels/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }
    },
    layers: [
      {
        id: 'basemap-base',
        type: 'raster',
        source: 'basemapBase',
        paint: {
          'raster-opacity': 1,
          'raster-saturation': 0.06,
          'raster-contrast': 0.06,
          'raster-brightness-min': 0,
          'raster-brightness-max': 1
        }
      },
      {
        id: 'basemap-labels',
        type: 'raster',
        source: 'basemapLabels',
        paint: {
          'raster-opacity': 0.65,
          'raster-saturation': -0.2,
          'raster-contrast': 0.12
        }
      }
    ]
  };

  const defaultView = { center: [8.6753, 9.082], zoom: 5.5 };

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

  /* ── Facility type colours ─────────────────────────────── */
  const typeColors = {
    health_facility:     '#2edb98',
    school:              '#5ba3ff',
    market:              '#f5a623',
    water_point:         '#22d3ee',
    government_building: '#94a3b8',
    police_station:      '#4f6ef7',
    fire_station:        '#f4655a',
    post_office:         '#fb923c',
    idp_site:            '#a78bfa',
    church:              '#facc15',
    mosque:              '#34d399',
    farm:                '#86efac',
    factory:             '#a8a29e',
    energy_substation:   '#fb923c',
    filling_station:     '#fb7185'
  };

  const colorMatchExp = ['match', ['get', 't']];
  Object.entries(typeColors).forEach(function(e) { colorMatchExp.push(e[0], e[1]); });
  colorMatchExp.push('#94a3b8');

  /* ── GeoJSON statename → slug map (mirrors server TS) ─── */
  const GEOJSON_TO_SLUG = {
    'Abia':'abia','Adamawa':'adamawa','Akwa Ibom':'akwa-ibom','Anambra':'anambra',
    'Bauchi':'bauchi','Bayelsa':'bayelsa','Benue':'benue','Borno':'borno',
    'Cross River':'cross-river','Delta':'delta','Ebonyi':'ebonyi','Edo':'edo',
    'Ekiti':'ekiti','Enugu':'enugu','Fct':'fct','Gombe':'gombe','Imo':'imo',
    'Jigawa':'jigawa','Kaduna':'kaduna','Kano':'kano','Katsina':'katsina',
    'Kebbi':'kebbi','Kogi':'kogi','Kwara':'kwara','Lagos':'lagos',
    'Nasarawa':'nasarawa','Niger':'niger','Ogun':'ogun','Ondo':'ondo',
    'Osun':'osun','Oyo':'oyo','Plateau':'plateau','Rivers':'rivers',
    'Sokoto':'sokoto','Taraba':'taraba','Yobe':'yobe','Zamfara':'zamfara'
  };

  /* ── App state ─────────────────────────────────────────── */
  const state = {
    features: [],
    activeTypes: new Set(),
    query: '',
    stateStats: {},      /* slug → { facility_count, population, facilities_per_10k, type_breakdown } */
    activeState: null,   /* currently drilled-in state slug */
    hoveredStateId: null
  };

  /* ── DOM refs ──────────────────────────────────────────── */
  const checkboxes         = Array.from(document.querySelectorAll('.type-filter'));
  const loadingEl          = document.getElementById('map-loading');
  const totalVisibleEl     = document.getElementById('total-visible');
  const activeTypeCountEl  = document.getElementById('active-type-count');
  const searchStateEl      = document.getElementById('search-state');
  const filterStatusEl     = document.getElementById('map-filter-status');
  const searchInput        = document.getElementById('map-search');
  const selectAllBtn       = document.getElementById('map-select-all');
  const clearAllBtn        = document.getElementById('map-clear-all');
  const resetViewBtn       = document.getElementById('map-reset-view');
  const viewportVisibleEl  = document.getElementById('viewport-visible-count');
  const viewportLeadingEl  = document.getElementById('viewport-leading-type');
  const viewportBreakEl    = document.getElementById('viewport-breakdown');
  const viewportSummaryEl  = document.getElementById('viewport-summary');
  const zoomLevelEl        = document.getElementById('map-zoom-level');
  const sidebarToggleBtn   = document.getElementById('map-sidebar-toggle');
  const sidebarEl          = document.querySelector('.map-sidebar-premium');
  const topbarZoomEl       = document.getElementById('map-topbar-zoom');
  const topbarCoordsEl     = document.getElementById('map-topbar-coords');
  const statePanelEl       = document.getElementById('state-panel');
  const stateBackBtn       = document.getElementById('state-back-btn');
  const mainPanelEl        = document.getElementById('main-panel');

  /* Initialise all types as active; guard against empty NodeList */
  if (checkboxes.length === 0) {
    /* Fallback: seed from known types if DOM not ready */
    var knownTypes = ['health_facility','school','market','water_point','government_building',
      'police_station','fire_station','post_office','idp_site','church','mosque',
      'farm','factory','energy_substation','filling_station'];
    knownTypes.forEach(function(t) { state.activeTypes.add(t); });
  } else {
    checkboxes.forEach(function(cb) {
      state.activeTypes.add(cb.value);
      cb.checked = true; /* ensure DOM reflects state */
    });
  }

  /* Sync count display immediately so it never shows stale "0" or "1" */
  if (activeTypeCountEl) activeTypeCountEl.textContent = String(state.activeTypes.size);

  /* ── Utilities ─────────────────────────────────────────── */
  function titleize(v) {
    return String(v||'').replace(/_/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();});
  }

  function fmtNum(n) { return Number(n).toLocaleString(); }

  function updateStatus(total) {
    const active = state.activeTypes.size;
    activeTypeCountEl.textContent = String(active);
    searchStateEl.textContent = state.query ? '"'+state.query+'"' : 'all';
    if (active === 0) {
      filterStatusEl.textContent = 'No types selected. Choose at least one category.';
      return;
    }
    const lbl = active === checkboxes.length ? 'all facility types'
              : active === 1 ? '1 active type'
              : active+' active types';
    filterStatusEl.textContent = 'Showing '+fmtNum(total)+' facilities across '+lbl+'.';
  }

  function buildFiltered() {
    const q = state.query.trim().toLowerCase();
    return state.features.filter(function(f) {
      if (!state.activeTypes.has(f.properties.t)) return false;
      if (state.activeState && f.properties.ss !== state.activeState) return false;
      if (!q) return true;
      return String(f.properties.n||'').toLowerCase().includes(q);
    });
  }

  function updateMapSource() {
    const src = map.getSource('facilities');
    if (!src) return;
    const filtered = buildFiltered();
    totalVisibleEl.textContent = fmtNum(filtered.length);
    updateStatus(filtered.length);
    src.setData({ type:'FeatureCollection', features: filtered });
    updateViewport(filtered);
  }

  function updateViewport(features) {
    if (!viewportVisibleEl || !viewportLeadingEl || !viewportBreakEl || !zoomLevelEl || !viewportSummaryEl) return;
    const zoom = map.getZoom().toFixed(1);
    zoomLevelEl.textContent = 'Zoom '+zoom;
    if (topbarZoomEl) topbarZoomEl.textContent = 'Z '+zoom;

    if (!features.length) {
      viewportVisibleEl.textContent = '0';
      viewportLeadingEl.textContent = '—';
      viewportSummaryEl.textContent = 'No facilities match the current filters.';
      viewportBreakEl.innerHTML = '<div class="viewport-breakdown-empty">No facilities match current filters.</div>';
      return;
    }

    const bounds = map.getBounds();
    const inView = features.filter(function(f) {
      const c = f.geometry && f.geometry.coordinates;
      return c && bounds.contains([c[0],c[1]]);
    });

    viewportVisibleEl.textContent = fmtNum(inView.length);

    if (!inView.length) {
      viewportLeadingEl.textContent = '—';
      viewportSummaryEl.textContent = 'Pan or zoom to bring facilities into frame.';
      viewportBreakEl.innerHTML = '<div class="viewport-breakdown-empty">Pan or zoom to bring facilities into frame.</div>';
      return;
    }

    const counts = {};
    inView.forEach(function(f){ const t=f.properties.t; counts[t]=(counts[t]||0)+1; });
    const ranked = Object.entries(counts).sort(function(a,b){return b[1]-a[1];}).slice(0,4);
    viewportLeadingEl.textContent = titleize(ranked[0][0]);
    viewportSummaryEl.textContent =
      'This frame has '+fmtNum(inView.length)+' facilities, led by '+titleize(ranked[0][0])+'. Zoom '+zoom+'.';

    viewportBreakEl.innerHTML = ranked.map(function(e){
      const pct = Math.round((e[1]/inView.length)*100);
      const col = typeColors[e[0]]||'#94a3b8';
      return '<div class="viewport-row">'+
        '<span style="display:flex;align-items:center;gap:0.45rem">'+
        '<i style="width:6px;height:6px;border-radius:50%;background:'+col+';display:inline-block;flex-shrink:0"></i>'+
        titleize(e[0])+'</span>'+
        '<strong>'+fmtNum(e[1])+' <em>'+pct+'%</em></strong></div>';
    }).join('');
  }

  function setAllTypes(checked) {
    checkboxes.forEach(function(cb){
      cb.checked = checked;
      if (checked) state.activeTypes.add(cb.value); else state.activeTypes.delete(cb.value);
    });
    updateMapSource();
  }

  function resetView() {
    map.easeTo({ center:defaultView.center, zoom:defaultView.zoom, bearing:0, pitch:0, duration:1100 });
  }

  /* ── Choropleth colour helpers ─────────────────────────── */
  function coverageColor(per10k) {
    if (per10k === null || per10k === undefined) return 'rgba(30,50,40,0.45)';
    if (per10k < 1)   return 'rgba(180,50,40,0.35)';
    if (per10k < 3)   return 'rgba(200,110,30,0.38)';
    if (per10k < 6)   return 'rgba(200,180,30,0.38)';
    if (per10k < 10)  return 'rgba(46,180,120,0.40)';
    return 'rgba(46,219,152,0.50)';
  }

  /* ── State drill-down ──────────────────────────────────── */
  function showStatePanel(slug) {
    if (!statePanelEl || !mainPanelEl) return;
    const s = state.stateStats[slug];
    if (!s) return;

    state.activeState = slug;
    updateMapSource();

    /* Highlight the selected state fill */
    if (map.getLayer('state-selected')) {
      map.setFilter('state-selected', ['==', ['get', 'slug'], slug]);
    }

    /* Top 3 types */
    const topTypes = Object.entries(s.type_breakdown||{})
      .sort(function(a,b){return b[1]-a[1];}).slice(0,3);

    const per10k = s.facilities_per_10k != null ? s.facilities_per_10k.toFixed(1) : '—';
    const pop = s.population ? fmtNum(s.population) : '—';

    /* Coverage tier label */
    const p = s.facilities_per_10k;
    const tier = p === null ? 'No data'
               : p < 1 ? 'Critical gap'
               : p < 3 ? 'Low coverage'
               : p < 6 ? 'Moderate'
               : p < 10 ? 'Good coverage'
               : 'Strong coverage';
    const tierClass = p === null ? 'tier-none'
                    : p < 1 ? 'tier-critical'
                    : p < 3 ? 'tier-low'
                    : p < 6 ? 'tier-moderate'
                    : 'tier-good';

    document.getElementById('state-panel-name').textContent = s.name || titleize(slug);
    document.getElementById('state-panel-pop').textContent = pop;
    document.getElementById('state-panel-count').textContent = fmtNum(s.facility_count);
    document.getElementById('state-panel-per10k').textContent = per10k;
    document.getElementById('state-panel-tier').textContent = tier;
    document.getElementById('state-panel-tier').className = 'state-tier-badge '+tierClass;

    const typesEl = document.getElementById('state-panel-types');
    if (typesEl) {
      typesEl.innerHTML = topTypes.map(function(e){
        const col = typeColors[e[0]]||'#94a3b8';
        const pct = s.facility_count > 0 ? Math.round((e[1]/s.facility_count)*100) : 0;
        return '<div class="state-type-row">'+
          '<span style="display:flex;align-items:center;gap:0.5rem">'+
          '<i style="width:7px;height:7px;border-radius:50%;background:'+col+';box-shadow:0 0 5px '+col+'88;flex-shrink:0;display:inline-block"></i>'+
          titleize(e[0])+'</span>'+
          '<span class="state-type-meta">'+fmtNum(e[1])+' <em>'+pct+'%</em></span>'+
          '</div>';
      }).join('');
    }

    mainPanelEl.style.display = 'none';
    statePanelEl.style.display = 'flex';
  }

  function hideStatePanel() {
    if (!statePanelEl || !mainPanelEl) return;
    state.activeState = null;
    statePanelEl.style.display = 'none';
    mainPanelEl.style.display = '';
    if (map.getLayer('state-selected')) {
      map.setFilter('state-selected', ['==', ['get', 'slug'], '']);
    }
    updateMapSource();
    resetView();
  }

  /* ── Event wiring ──────────────────────────────────────── */
  checkboxes.forEach(function(cb){
    cb.addEventListener('change', function(){
      if (cb.checked) state.activeTypes.add(cb.value); else state.activeTypes.delete(cb.value);
      updateMapSource();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', function(){ state.query = searchInput.value||''; updateMapSource(); });
  }
  if (selectAllBtn) selectAllBtn.addEventListener('click', function(){ setAllTypes(true); });
  if (clearAllBtn)  clearAllBtn.addEventListener('click',  function(){ setAllTypes(false); });
  if (resetViewBtn) resetViewBtn.addEventListener('click', function(){ hideStatePanel(); });
  if (stateBackBtn) stateBackBtn.addEventListener('click', function(){ hideStatePanel(); });

  if (sidebarToggleBtn && sidebarEl) {
    sidebarToggleBtn.addEventListener('click', function(){
      const collapsed = sidebarEl.classList.toggle('is-collapsed');
      sidebarToggleBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    });
  }

  /* Topbar: live coordinates */
  if (topbarCoordsEl) {
    map.on('mousemove', function(e){
      const lat = e.lngLat.lat, lng = e.lngLat.lng;
      topbarCoordsEl.textContent =
        Math.abs(lat).toFixed(3)+'°'+(lat>=0?'N':'S')+' · '+
        Math.abs(lng).toFixed(3)+'°'+(lng>=0?'E':'W');
    });
  }
  map.on('zoom', function(){
    const z = map.getZoom().toFixed(1);
    if (topbarZoomEl) topbarZoomEl.textContent = 'Z '+z;
    if (zoomLevelEl)  zoomLevelEl.textContent  = 'Zoom '+z;
  });

  /* ── Map load ──────────────────────────────────────────── */
  map.on('load', function() {

    /* Inject swatch CSS */
    let css = '';
    Object.entries(typeColors).forEach(function(e){
      css += '.type-'+e[0]+'{background-color:'+e[1]+';box-shadow:0 0 6px '+e[1]+'55}\n';
    });
    const styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    /* ── Load state stats + boundaries in parallel ─── */
    Promise.all([
      fetch('/api/state-stats').then(function(r){ return r.json(); }),
      fetch('/static/nga-states.geojson').then(function(r){ return r.json(); })
    ]).then(function(results) {
      const statsData  = results[0];
      const boundaries = results[1];

      /* Build slug-keyed lookup */
      (statsData.data||[]).forEach(function(s){
        state.stateStats[s.slug] = s;
      });

      /* Enrich GeoJSON features with stats */
      boundaries.features.forEach(function(f) {
        const geoName = f.properties.statename;
        const slug = GEOJSON_TO_SLUG[geoName] || geoName.toLowerCase().replace(/\s+/g,'-');
        const stats = state.stateStats[slug] || {};
        f.properties.slug = slug;
        f.properties.facility_count = stats.facility_count || 0;
        f.properties.population = stats.population || 0;
        f.properties.facilities_per_10k = stats.facilities_per_10k || null;
        f.properties.choropleth_color = coverageColor(stats.facilities_per_10k);
      });

      /* Add state source */
      map.addSource('state-boundaries', {
        type: 'geojson',
        data: boundaries,
        generateId: true
      });

      /* Choropleth fill */
      map.addLayer({
        id: 'state-fill',
        type: 'fill',
        source: 'state-boundaries',
        paint: {
          'fill-color': ['get', 'choropleth_color'],
          'fill-opacity': 1
        }
      });

      /* State outline */
      map.addLayer({
        id: 'state-outline',
        type: 'line',
        source: 'state-boundaries',
        paint: {
          'line-color': 'rgba(52,211,153,0.22)',
          'line-width': ['interpolate',['linear'],['zoom'], 4,0.8, 8,1.5],
          'line-opacity': 1
        }
      });

      /* Hover highlight */
      map.addLayer({
        id: 'state-hover',
        type: 'fill',
        source: 'state-boundaries',
        paint: {
          'fill-color': 'rgba(52,211,153,0.12)',
          'fill-opacity': ['case',['boolean',['feature-state','hovered'],false],1,0]
        }
      });

      /* Selected state highlight */
      map.addLayer({
        id: 'state-selected',
        type: 'line',
        source: 'state-boundaries',
        filter: ['==',['get','slug'],''],
        paint: {
          'line-color': '#34d399',
          'line-width': 2.5,
          'line-opacity': 0.9
        }
      });

      /* State hover interaction */
      map.on('mousemove', 'state-fill', function(e) {
        if (!e.features.length) return;
        map.getCanvas().style.cursor = 'pointer';
        if (state.hoveredStateId !== null) {
          map.setFeatureState({ source:'state-boundaries', id:state.hoveredStateId }, { hovered:false });
        }
        state.hoveredStateId = e.features[0].id;
        map.setFeatureState({ source:'state-boundaries', id:state.hoveredStateId }, { hovered:true });
      });

      map.on('mouseleave', 'state-fill', function() {
        map.getCanvas().style.cursor = '';
        if (state.hoveredStateId !== null) {
          map.setFeatureState({ source:'state-boundaries', id:state.hoveredStateId }, { hovered:false });
        }
        state.hoveredStateId = null;
      });

      /* State click → drill-down */
      map.on('click', 'state-fill', function(e) {
        if (!e.features.length) return;
        const slug = e.features[0].properties.slug;
        if (!slug) return;

        /* Fly to state bounding box */
        const coords = e.features[0].geometry.coordinates[0];
        const lngs = coords.map(function(c){return c[0];});
        const lats = coords.map(function(c){return c[1];});
        map.fitBounds(
          [[Math.min.apply(null,lngs), Math.min.apply(null,lats)],
           [Math.max.apply(null,lngs), Math.max.apply(null,lats)]],
          { padding:{ top:60, bottom:60, left:420, right:60 }, duration:900, maxZoom:9 }
        );

        showStatePanel(slug);
      });

      /* ── Facility points data ───────────────────── */
      return fetch('/api/map-data').then(function(r){ return r.json(); });

    }).then(function(data) {
      state.features = data.features || [];

      if (loadingEl) {
        loadingEl.style.opacity = '0';
        setTimeout(function(){ loadingEl.remove(); }, 400);
      }

      map.addSource('facilities', {
        type: 'geojson',
        data: data,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      /* Cluster glow */
      map.addLayer({
        id: 'clusters-halo',
        type: 'circle',
        source: 'facilities',
        filter: ['has','point_count'],
        paint: {
          'circle-color': ['step',['get','point_count'],
            'rgba(46,219,152,0.14)', 100, 'rgba(245,166,35,0.16)', 1000, 'rgba(244,101,90,0.18)'],
          'circle-radius': ['step',['get','point_count'], 32, 100, 46, 1000, 62],
          'circle-blur': 0.7
        }
      });

      /* Cluster circles */
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'facilities',
        filter: ['has','point_count'],
        paint: {
          'circle-color': ['step',['get','point_count'], '#1fbd80', 100, '#d4851a', 1000, '#c94840'],
          'circle-radius': ['step',['get','point_count'], 17, 100, 24, 1000, 33],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': 'rgba(255,255,255,0.18)'
        }
      });

      /* Cluster count labels */
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'facilities',
        filter: ['has','point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold','Arial Unicode MS Bold'],
          'text-size': 12,
          'text-allow-overlap': true
        },
        paint: { 'text-color': '#ffffff' }
      });

      /* Point glow halo */
      map.addLayer({
        id: 'unclustered-point-halo',
        type: 'circle',
        source: 'facilities',
        filter: ['!',['has','point_count']],
        paint: {
          'circle-color': colorMatchExp,
          'circle-radius': ['interpolate',['linear'],['zoom'], 5,7, 9,10, 13,14],
          'circle-blur': 0.75,
          'circle-opacity': ['interpolate',['linear'],['zoom'], 5,0.18, 9,0.25, 13,0.32]
        }
      });

      /* Individual points */
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'facilities',
        filter: ['!',['has','point_count']],
        paint: {
          'circle-color': colorMatchExp,
          'circle-radius': ['interpolate',['linear'],['zoom'], 5,3.2, 9,4.5, 13,6.5],
          'circle-opacity': ['interpolate',['linear'],['zoom'], 5,0.88, 9,0.94, 13,1],
          'circle-stroke-width': ['interpolate',['linear'],['zoom'], 5,1, 13,1.6],
          'circle-stroke-color': 'rgba(8,14,12,0.85)'
        }
      });

      updateMapSource();

      map.on('moveend', function(){ updateViewport(buildFiltered()); });
      map.on('zoomend', function(){ updateViewport(buildFiltered()); });

      /* Cluster click → zoom */
      map.on('click', 'clusters', function(e) {
        const feat = map.queryRenderedFeatures(e.point,{layers:['clusters']});
        map.getSource('facilities').getClusterExpansionZoom(feat[0].properties.cluster_id).then(function(z){
          map.easeTo({ center:feat[0].geometry.coordinates, zoom:z+1, duration:900 });
        });
      });

      /* Cursor */
      ['clusters','unclustered-point'].forEach(function(lyr){
        map.on('mouseenter', lyr, function(){ map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', lyr, function(){ map.getCanvas().style.cursor = ''; });
      });

      /* Facility popup */
      map.on('click', 'unclustered-point', function(e) {
        const coords = e.features[0].geometry.coordinates.slice();
        const props  = e.features[0].properties;
        while (Math.abs(e.lngLat.lng - coords[0]) > 180) {
          coords[0] += e.lngLat.lng > coords[0] ? 360 : -360;
        }
        const col = typeColors[props.t]||'#94a3b8';
        const html =
          '<div class="map-popup">'+
          '<div class="popup-header">'+
          '<span class="popup-type-dot" style="background:'+col+';box-shadow:0 0 8px '+col+'88"></span>'+
          '<span class="popup-kicker">'+titleize(props.t)+'</span>'+
          '</div>'+
          '<h3>'+(props.n||'Unnamed facility')+'</h3>'+
          '<div class="popup-meta">'+
          '<span class="'+(props.s==='grid3'?'meta-verified':'meta-community')+'">'+
          (props.s==='grid3'?'✓ Verified · Grid3':'Community')+'</span>'+
          '</div></div>';

        new maplibregl.Popup({ closeButton:false, className:'glass-popup', offset:18 })
          .setLngLat(coords).setHTML(html).addTo(map);
      });

    }).catch(function(err) {
      console.error('Map load error:', err);
      if (loadingEl) loadingEl.textContent = 'Failed to load data. Please refresh.';
    });
  });
})();
