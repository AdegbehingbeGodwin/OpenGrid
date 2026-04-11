import type { FC } from 'hono/jsx';
import { FACILITY_TYPES, FACILITY_TYPE_LABELS } from '../../types';

export const MapPage: FC = () => {
  return (
    <div class="map-dashboard map-dashboard-premium">
      <div id="map" class="map-container"></div>

      <div class="map-shell">
        <aside class="map-sidebar map-sidebar-premium map-analysis-rail">
          <div class="sidebar-header sidebar-header-premium map-rail-header">
            <div>
              <span class="sidebar-kicker">Spatial workspace</span>
              <h1>OpenGrid Atlas</h1>
              <p>
                Explore civic infrastructure with a calmer, analysis-first map surface built for fast
                scanning and sharper comparisons.
              </p>
            </div>
            <a href="/docs" class="map-inline-link">
              Data docs
            </a>
          </div>

          <button type="button" class="map-sidebar-toggle" id="map-sidebar-toggle" aria-expanded="true">
            <span>Analysis rail</span>
          </button>

          <div class="sidebar-stats sidebar-stats-premium map-signal-grid">
            <div class="stats-box map-signal-card">
              <span class="stats-lbl">Visible facilities</span>
              <span class="stats-val tabular-nums" id="total-visible">
                0
              </span>
              <p>Current result set after filters and search.</p>
            </div>
            <div class="stats-mini-grid">
              <div class="stats-mini-card map-metric-card">
                <span>Active lenses</span>
                <strong class="tabular-nums" id="active-type-count">
                  {FACILITY_TYPES.length}
                </strong>
              </div>
              <div class="stats-mini-card map-metric-card">
                <span>Search</span>
                <strong id="search-state">All</strong>
              </div>
            </div>
          </div>

          <div class="map-search-panel">
            <label class="map-panel-label" for="map-search">
              Search facilities
            </label>
            <div class="map-search-wrap">
              <input
                id="map-search"
                class="map-search-input"
                type="search"
                placeholder="Hospital, market, school"
                autocomplete="off"
              />
            </div>
            <p class="map-panel-hint" id="map-filter-status">
              Showing all facility types.
            </p>
          </div>

          <div class="map-actions-panel">
            <button type="button" class="map-chip-button" id="map-select-all">
              Select all types
            </button>
            <button type="button" class="map-chip-button" id="map-clear-all">
              Clear filters
            </button>
            <button type="button" class="map-chip-button" id="map-reset-view">
              Reset map
            </button>
          </div>

          <div class="map-viewport-panel map-brief-panel">
            <div class="map-panel-head">
              <h3>Location brief</h3>
              <span class="map-panel-meta tabular-nums" id="map-zoom-level">
                Zoom 5.5
              </span>
            </div>
            <p class="map-brief-summary" id="viewport-summary">
              Move across the map to generate a quick reading of what this area contains.
            </p>
            <div class="viewport-metrics viewport-metrics-brief">
              <div class="viewport-metric map-metric-card">
                <span>In view</span>
                <strong class="tabular-nums" id="viewport-visible-count">
                  0
                </strong>
              </div>
              <div class="viewport-metric map-metric-card">
                <span>Dominant type</span>
                <strong id="viewport-leading-type">-</strong>
              </div>
            </div>
            <div class="viewport-breakdown" id="viewport-breakdown">
              <div class="viewport-breakdown-empty">Move or zoom the map to inspect this area.</div>
            </div>
          </div>

          <div class="sidebar-filters">
            <div class="map-panel-head">
              <h3>Infrastructure layers</h3>
              <span class="map-panel-meta">{FACILITY_TYPES.length} categories</span>
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

        <div class="map-floating-card map-floating-card-bottom map-method-card">
          <span class="floating-card-kicker">How this reads</span>
          <p>
            Filters narrow the layer set, search reduces the visible inventory, and the location
            brief translates the current viewport into an immediate takeaway.
          </p>
          <div class="map-topbar-legend" style="margin-top: 0.85rem;">
            <span>
              <i class="legend-dot legend-dot-hot"></i>
              Higher cluster density
            </span>
            <span>
              <i class="legend-dot legend-dot-watch"></i>
              Lower cluster density
            </span>
          </div>
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
