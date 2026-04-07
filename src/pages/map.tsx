import type { FC } from 'hono/jsx';
import { FACILITY_TYPES, FACILITY_TYPE_LABELS } from '../../types';

export const MapPage: FC = () => {
  return (
    <div class="map-dashboard map-dashboard-premium">
      <div id="map" class="map-container"></div>

      <div class="map-shell">
        <aside class="map-sidebar map-sidebar-premium">
          <div class="sidebar-header sidebar-header-premium">
            <div>
              <span class="sidebar-kicker">Live civic atlas</span>
              <h1>OpenGrid Map</h1>
              <p>
                Explore facility coverage across Nigeria with live filtering, clustered density, and
                instant type breakdowns.
              </p>
            </div>
            <a href="/docs" class="map-inline-link">
              API explorer
            </a>
          </div>

          <button type="button" class="map-sidebar-toggle" id="map-sidebar-toggle" aria-expanded="true">
            <span>Map controls</span>
          </button>

          <div class="sidebar-stats sidebar-stats-premium">
            <div class="stats-box">
              <span class="stats-lbl">Visible facilities</span>
              <span class="stats-val" id="total-visible">
                0
              </span>
            </div>
            <div class="stats-mini-grid">
              <div class="stats-mini-card">
                <span>Active types</span>
                <strong id="active-type-count">{FACILITY_TYPES.length}</strong>
              </div>
              <div class="stats-mini-card">
                <span>Search</span>
                <strong id="search-state">All</strong>
              </div>
            </div>
          </div>

          <div class="map-search-panel">
            <label class="map-panel-label" for="map-search">
              Search by facility name
            </label>
            <div class="map-search-wrap">
              <input
                id="map-search"
                class="map-search-input"
                type="search"
                placeholder="Hospital, market, school..."
                autocomplete="off"
              />
            </div>
            <p class="map-panel-hint" id="map-filter-status">
              Showing all facility types.
            </p>
          </div>

          <div class="map-actions-panel">
            <button type="button" class="map-chip-button" id="map-select-all">
              Select all
            </button>
            <button type="button" class="map-chip-button" id="map-clear-all">
              Clear all
            </button>
            <button type="button" class="map-chip-button" id="map-reset-view">
              Reset view
            </button>
          </div>

          <div class="map-viewport-panel">
            <div class="map-panel-head">
              <h3>Current viewport</h3>
              <span class="map-panel-meta" id="map-zoom-level">Zoom 5.5</span>
            </div>
            <div class="viewport-metrics">
              <div class="viewport-metric">
                <span>In frame</span>
                <strong id="viewport-visible-count">0</strong>
              </div>
              <div class="viewport-metric">
                <span>Leading type</span>
                <strong id="viewport-leading-type">-</strong>
              </div>
            </div>
            <div class="viewport-breakdown" id="viewport-breakdown">
              <div class="viewport-breakdown-empty">Move or zoom the map to inspect this area.</div>
            </div>
          </div>

          <div class="sidebar-filters">
            <div class="map-panel-head">
              <h3>Filter by type</h3>
              <span class="map-panel-meta">15 categories</span>
            </div>
            <div class="filter-list filter-list-premium">
              {FACILITY_TYPES.map((type) => (
                <label class="filter-option filter-option-premium" key={type}>
                  <input type="checkbox" value={type} checked class="type-filter" />
                  <span class={`filter-color type-${type}`}></span>
                  <span class="filter-label">{FACILITY_TYPE_LABELS[type]}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        <div class="map-topbar">
          <div class="map-topbar-copy">
            <span class="map-topbar-kicker">Sleek by default. Legible at a glance.</span>
            <strong>Zoom into clusters, inspect individual facilities, and shape the view in seconds.</strong>
          </div>
          <div class="map-topbar-legend">
            <span>
              <i class="legend-dot legend-dot-hot"></i>
              Dense clusters
            </span>
            <span>
              <i class="legend-dot legend-dot-watch"></i>
              Lower density
            </span>
          </div>
        </div>

        <div class="map-floating-card map-floating-card-bottom">
          <span class="floating-card-kicker">How to explore</span>
          <p>
            Use filters to isolate categories, search to narrow by name, and click any cluster to
            step deeper into that area.
          </p>
        </div>
      </div>

      <div class="map-loading map-loading-premium" id="map-loading">
        <div class="spinner"></div>
        <div class="map-loading-copy">
          <strong>Building the live facility layer</strong>
          <span>Preparing a national view of schools, clinics, markets, and more.</span>
        </div>
      </div>

      <script src="/static/map.js" defer></script>
    </div>
  );
};
