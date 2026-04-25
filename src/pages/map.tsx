import type { FC } from 'hono/jsx';
import { FACILITY_TYPES, FACILITY_TYPE_LABELS } from '../../types';

export const MapPage: FC = () => {
  return (
    <div class="map-dashboard map-dashboard-premium">
      <div id="map" class="map-container"></div>

      <div class="map-shell">
        {/* Topbar */}
        <div class="map-topbar">
          <div class="map-topbar-left">
            <span class="map-crumb">Nigeria</span>
            <span class="map-crumb-sep">›</span>
            <span class="map-crumb">36 States + FCT</span>
            <span class="map-crumb-sep">›</span>
            <span class="map-crumb map-crumb-active">All Infrastructure</span>
          </div>
          <div class="map-topbar-right">
            <span class="map-topbar-live">
              <i class="topbar-ping"></i>Live
            </span>
            <span class="map-topbar-divider"></span>
            <span id="map-topbar-zoom" class="map-topbar-stat">Z 5.5</span>
            <span class="map-topbar-divider"></span>
            <span id="map-topbar-coords" class="map-topbar-stat map-topbar-coords">8.675°N · 9.082°E</span>
          </div>
        </div>

        {/* Sidebar */}
        <aside class="map-sidebar map-sidebar-premium map-analysis-rail">
          <div class="sidebar-header sidebar-header-premium map-rail-header">
            <div class="sidebar-header-content">
              <span class="sidebar-eyebrow">Spatial workspace</span>
              <h1>OpenGrid Atlas</h1>
            </div>
            <a href="/docs" class="map-inline-link">Docs →</a>
          </div>

          <button type="button" class="map-sidebar-toggle" id="map-sidebar-toggle" aria-expanded="true">
            <span>Analysis rail</span>
          </button>

          {/* ── Main panel (overview) ─────────────────────── */}
          <div id="main-panel">
            {/* Hero stat */}
            <div class="sidebar-hero-stat">
              <div class="hero-stat-row">
                <span class="hero-stat-num tabular-nums" id="total-visible">0</span>
                <span class="hero-stat-unit">facilities</span>
              </div>
              <p class="hero-stat-sub">
                <span class="tabular-nums" id="active-type-count">{FACILITY_TYPES.length}</span> layers · search: <span id="search-state">all</span>
              </p>
            </div>

            {/* Search */}
            <div class="map-search-panel">
              <div class="map-search-wrap">
                <svg class="map-search-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  id="map-search"
                  class="map-search-input"
                  type="search"
                  placeholder="Hospital, market, school…"
                  autocomplete="off"
                />
              </div>
              <p class="map-panel-hint" id="map-filter-status">Showing all facility types.</p>
            </div>

            {/* Quick actions */}
            <div class="map-actions-panel">
              <button type="button" class="map-chip-button" id="map-select-all">All</button>
              <button type="button" class="map-chip-button" id="map-clear-all">None</button>
              <button type="button" class="map-chip-button" id="map-reset-view">Reset map</button>
            </div>

            {/* Viewport brief */}
            <div class="map-viewport-panel map-brief-panel">
              <div class="map-panel-head">
                <h3>In view</h3>
                <span class="map-panel-meta tabular-nums" id="map-zoom-level">Zoom 5.5</span>
              </div>
              <p class="map-brief-summary" id="viewport-summary">
                Click a state on the map to drill in, or pan to read what's in frame.
              </p>
              <div class="viewport-metrics viewport-metrics-brief">
                <div class="viewport-metric map-metric-card">
                  <span>Visible</span>
                  <strong class="tabular-nums" id="viewport-visible-count">0</strong>
                </div>
                <div class="viewport-metric map-metric-card">
                  <span>Leading type</span>
                  <strong id="viewport-leading-type">—</strong>
                </div>
              </div>
              <div class="viewport-breakdown" id="viewport-breakdown">
                <div class="viewport-breakdown-empty">Move or zoom the map to inspect.</div>
              </div>
            </div>

            {/* Filter pill grid */}
            <div class="sidebar-filters">
              <div class="map-panel-head">
                <h3>Infrastructure layers</h3>
                <span class="map-panel-meta">{FACILITY_TYPES.length} categories</span>
              </div>
              <div class="filter-pill-grid">
                {FACILITY_TYPES.map((type) => (
                  <label class="filter-pill" key={type}>
                    <input type="checkbox" value={type} checked class="type-filter" />
                    <span class={`filter-pill-swatch type-${type}`}></span>
                    <span class="filter-pill-label">{FACILITY_TYPE_LABELS[type]}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* ── State drill-down panel ──────────────────────── */}
          <div id="state-panel" class="state-panel" style="display:none">
            <button type="button" id="state-back-btn" class="state-back-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              All states
            </button>

            <div class="state-hero">
              <h2 id="state-panel-name">—</h2>
              <span id="state-panel-tier" class="state-tier-badge tier-none">—</span>
            </div>

            <div class="state-metrics-grid">
              <div class="state-metric">
                <span class="state-metric-label">Population</span>
                <strong class="state-metric-value" id="state-panel-pop">—</strong>
              </div>
              <div class="state-metric">
                <span class="state-metric-label">Facilities</span>
                <strong class="state-metric-value" id="state-panel-count">—</strong>
              </div>
              <div class="state-metric state-metric-highlight">
                <span class="state-metric-label">Per 10,000 people</span>
                <strong class="state-metric-value state-metric-big" id="state-panel-per10k">—</strong>
              </div>
            </div>

            <div class="state-types-section">
              <p class="state-types-label">Top facility types</p>
              <div id="state-panel-types" class="state-types-list"></div>
            </div>

            <a href="#" class="map-inline-link state-docs-link" onclick="return false" id="state-docs-link">
              View state API →
            </a>
          </div>
        </aside>

        {/* Choropleth legend */}
        <div class="map-floating-card map-floating-card-bottom choropleth-legend">
          <span class="floating-card-kicker">Facilities per 10k people</span>
          <div class="choropleth-scale">
            <span class="choropleth-step step-critical"></span>
            <span class="choropleth-step step-low"></span>
            <span class="choropleth-step step-moderate"></span>
            <span class="choropleth-step step-good"></span>
            <span class="choropleth-step step-strong"></span>
          </div>
          <div class="choropleth-labels">
            <span>0</span>
            <span>1</span>
            <span>3</span>
            <span>6</span>
            <span>10+</span>
          </div>
          <div class="cluster-legend-row">
            <span><i class="legend-dot legend-dot-hot"></i>High cluster</span>
            <span><i class="legend-dot legend-dot-watch"></i>Low cluster</span>
          </div>
        </div>
      </div>

      <div class="map-loading map-loading-premium" id="map-loading">
        <div class="spinner"></div>
        <div class="map-loading-copy">
          <strong>Building the live facility layer</strong>
          <span>Mapping schools, clinics, markets and more across Nigeria</span>
        </div>
      </div>

      <script src="/static/map.js" defer></script>
    </div>
  );
};
