import type { FC } from 'hono/jsx';
import { FACILITY_TYPES, FACILITY_TYPE_LABELS } from '../../types';

export const MapPage: FC = () => {
  return (
    <div class="map-dashboard">
      <div id="map" class="map-container"></div>
      
      <div class="map-sidebar">
        <div class="sidebar-header">
          <h1>OpenGrid</h1>
          <p>Distribution Dashboard</p>
        </div>
        
        <div class="sidebar-stats">
          <div class="stats-box">
            <span class="stats-val" id="total-visible">0</span>
            <span class="stats-lbl">Facilities Visible</span>
          </div>
        </div>

        <div class="sidebar-filters">
          <h3>Filter by Type</h3>
          <div class="filter-list">
            {FACILITY_TYPES.map(type => (
              <label class="filter-option" key={type}>
                <input type="checkbox" value={type} checked class="type-filter" />
                <span class={`filter-color type-${type}`}></span>
                <span class="filter-label">{FACILITY_TYPE_LABELS[type]}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div class="map-loading" id="map-loading">
        <div class="spinner"></div>
        Processing 288k facilities...
      </div>
      
      <script src="/static/map.js" defer></script>
    </div>
  );
};
