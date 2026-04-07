import type { FC } from 'hono/jsx';
import { FACILITY_TYPE_LABELS, FACILITY_TYPES } from '../../types';

export const ContributePage: FC = () => {
  return (
    <div class="contribute">
      <h1>Add a Facility</h1>
      <p>Help build the most complete open directory of Nigerian public facilities. There are two ways to contribute:</p>

      <div class="contribute-options">
        <div class="option">
          <h2>Option 1: Submit via Form</h2>
          <p>Fill out the form below — we'll open a pull request automatically.</p>

          <form id="contribute-form" class="form">
            <div class="field">
              <label for="facility_type">Facility Type *</label>
              <select id="facility_type" name="facility_type" required>
                <option value="">Select a type...</option>
                {FACILITY_TYPES.map((type) => (
                  <option key={type} value={type}>{FACILITY_TYPE_LABELS[type]}</option>
                ))}
              </select>
            </div>
            <div class="field">
              <label for="facility_name">Facility Name *</label>
              <input type="text" id="facility_name" name="facility_name" required placeholder="e.g. Government Secondary School Ikeja" />
            </div>
            <div class="field">
              <label for="state">State *</label>
              <input type="text" id="state" name="state" required placeholder="e.g. Lagos" />
            </div>
            <div class="field">
              <label for="lga">Local Government Area *</label>
              <input type="text" id="lga" name="lga" required placeholder="e.g. Ikeja" />
            </div>
            <div class="field">
              <label>Location * <span class="label-hint">Click the map or enter coordinates manually</span></label>
              <div id="map" class="map-picker"></div>
              <div class="coords-inputs">
                <div class="coord-field">
                  <label for="lat">Latitude</label>
                  <input type="number" id="lat" name="lat" required step="any" min="3" max="15" placeholder="e.g. 6.6018" />
                </div>
                <div class="coord-field">
                  <label for="lng">Longitude</label>
                  <input type="number" id="lng" name="lng" required step="any" min="1" max="16" placeholder="e.g. 3.3515" />
                </div>
              </div>
            </div>
            <div class="field">
              <label for="contributor_name">Your Name / GitHub Username</label>
              <input type="text" id="contributor_name" name="contributor_name" placeholder="e.g. your-username" />
            </div>
            <div class="field">
              <label for="description">Notes (optional)</label>
              <textarea id="description" name="description" rows={3} placeholder="Any additional context about this facility..."></textarea>
            </div>
            <button type="submit" id="submit-btn" class="btn">Submit Facility</button>
            <div id="form-message" class="form-message"></div>
          </form>

          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

          <script dangerouslySetInnerHTML={{__html: `
            (function() {
              var nigeriaBounds = L.latLngBounds(L.latLng(3.0, 1.0), L.latLng(14.5, 15.5));
              var map = L.map('map', {
                maxBounds: nigeriaBounds,
                maxBoundsViscosity: 1.0,
                minZoom: 6,
                maxZoom: 18
              }).setView([9.05, 7.49], 6);

              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors',
                bounds: nigeriaBounds
              }).addTo(map);

              var marker = null;
              var latInput = document.getElementById('lat');
              var lngInput = document.getElementById('lng');

              function updateMarker(lat, lng) {
                var latlng = L.latLng(lat, lng);
                if (marker) { marker.setLatLng(latlng); }
                else { marker = L.marker(latlng).addTo(map); }
              }

              map.on('click', function(e) {
                var lat = e.latlng.lat.toFixed(6);
                var lng = e.latlng.lng.toFixed(6);
                latInput.value = lat;
                lngInput.value = lng;
                updateMarker(lat, lng);
              });

              function onManualInput() {
                var lat = parseFloat(latInput.value);
                var lng = parseFloat(lngInput.value);
                if (!isNaN(lat) && !isNaN(lng) && lat >= 3 && lat <= 15 && lng >= 1 && lng <= 16) {
                  updateMarker(lat, lng);
                  map.panTo([lat, lng]);
                }
              }
              latInput.addEventListener('change', onManualInput);
              lngInput.addEventListener('change', onManualInput);
              setTimeout(function() { map.invalidateSize(); }, 100);

              document.getElementById('contribute-form').addEventListener('reset', function() {
                if (marker) { map.removeLayer(marker); marker = null; }
                latInput.value = '';
                lngInput.value = '';
              });
            })();

            document.getElementById('contribute-form').addEventListener('submit', async (e) => {
              e.preventDefault();
              const form = e.target;
              const msg = document.getElementById('form-message');
              const btn = document.getElementById('submit-btn');
              btn.disabled = true;
              btn.textContent = 'Submitting...';
              msg.textContent = '';
              msg.className = 'form-message';

              try {
                const data = Object.fromEntries(new FormData(form));
                data.lat = parseFloat(data.lat);
                data.lng = parseFloat(data.lng);

                if (isNaN(data.lat) || isNaN(data.lng)) {
                  msg.textContent = 'Please set the facility location on the map or enter coordinates.';
                  msg.className = 'form-message error';
                  return;
                }

                const res = await fetch('/api/contribute', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data),
                });
                const result = await res.json();

                if (result.success) {
                  var prUrl = result.data && result.data.pr_url;
                  msg.innerHTML = prUrl
                    ? 'Thank you! A <a href="' + prUrl + '" target="_blank" rel="noopener">pull request</a> has been created and will be reviewed shortly.'
                    : 'Thank you! Your submission has been received.';
                  msg.className = 'form-message success';
                  form.reset();
                } else {
                  msg.textContent = result.error?.message || 'Something went wrong. Please try again.';
                  msg.className = 'form-message error';
                }
              } catch {
                msg.textContent = 'Network error. Please try again.';
                msg.className = 'form-message error';
              } finally {
                btn.disabled = false;
                btn.textContent = 'Submit Facility';
              }
            });
          `}} />
        </div>

        <div class="option">
          <h2>Option 2: Open a Pull Request</h2>
          <p>For contributors comfortable with Git:</p>
          <ol>
            <li>Fork the <a href="https://github.com/AdegbehingbeGodwin/OpenGrid" target="_blank" rel="noopener">repository</a></li>
            <li>Open the state file at <code>data/states/&lt;state-slug&gt;.json</code></li>
            <li>Add your facility to the correct LGA's <code>facilities</code> array</li>
            <li>Submit a pull request — CI will validate your data automatically</li>
          </ol>
          <p>Facility entry format:</p>
          <pre>{`{
  "type": "school",
  "name": "Government Secondary School Ikeja",
  "slug": "government-secondary-school-ikeja-school",
  "coordinates": { "lat": 6.6018, "lng": 3.3515 },
  "source": "community",
  "verified": false,
  "added_by": "your-github-username"
}`}</pre>
          <p>Valid types: <code>{FACILITY_TYPES.join(', ')}</code></p>
        </div>
      </div>
    </div>
  );
};
