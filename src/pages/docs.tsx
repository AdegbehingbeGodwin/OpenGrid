import type { FC } from 'hono/jsx';
import { FACILITY_TYPES, FACILITY_TYPE_LABELS } from '../../types';

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/facilities',
    description: 'List facilities. Filter by type, state, LGA, or free-text search.',
    params: [
      { name: 'type', type: 'string', description: 'Facility type (e.g. school, market, health_facility)' },
      { name: 'state', type: 'string', description: 'State slug (e.g. lagos, kano)' },
      { name: 'lga', type: 'string', description: 'LGA slug (e.g. ikeja-ikeja)' },
      { name: 'q', type: 'string', description: 'Free-text search across name, LGA, state' },
      { name: 'source', type: 'string', description: '"grid3" or "community"' },
      { name: 'limit', type: 'number', description: 'Results per page (1–100, default 20)' },
      { name: 'offset', type: 'number', description: 'Pagination offset (default 0)' },
      { name: 'order', type: 'string', description: '"asc" or "desc" by name' },
    ],
  },
  {
    method: 'GET',
    path: '/api/facilities/:slug',
    description: 'Get a single facility by its slug.',
    params: [],
  },
  {
    method: 'GET',
    path: '/api/types',
    description: 'List all 15 facility types with record counts.',
    params: [],
  },
  {
    method: 'GET',
    path: '/api/states',
    description: 'List all 36 states and the FCT.',
    params: [],
  },
  {
    method: 'GET',
    path: '/api/states/:slug',
    description: 'Get a single state with LGA count and facility count.',
    params: [],
  },
  {
    method: 'GET',
    path: '/api/lgas',
    description: 'List all LGAs, optionally filtered by state.',
    params: [
      { name: 'state', type: 'string', description: 'State slug to filter by' },
    ],
  },
  {
    method: 'GET',
    path: '/api/lgas/:slug',
    description: 'Get a single LGA with facility count.',
    params: [],
  },
  {
    method: 'GET',
    path: '/api/coverage',
    description: 'Full coverage summary: per-type counts and per-state facility counts.',
    params: [],
  },
  {
    method: 'POST',
    path: '/api/contribute',
    description: 'Submit a new facility. Opens a GitHub pull request automatically.',
    params: [
      { name: 'facility_name', type: 'string', description: 'Required. Name of the facility' },
      { name: 'facility_type', type: 'string', description: 'Required. One of the 15 facility types' },
      { name: 'state', type: 'string', description: 'Required. State name or slug' },
      { name: 'lga', type: 'string', description: 'Required. LGA name or slug' },
      { name: 'lat', type: 'number', description: 'Required. Latitude (3–15)' },
      { name: 'lng', type: 'number', description: 'Required. Longitude (1–16)' },
      { name: 'contributor_name', type: 'string', description: 'Optional. Your name or GitHub username' },
      { name: 'description', type: 'string', description: 'Optional. Notes about the facility' },
    ],
  },
];

export const DocsPage: FC = () => {
  const typeOptions = FACILITY_TYPES.map((t) => ({ value: t, label: FACILITY_TYPE_LABELS[t] }));

  return (
    <div class="docs explorer-page">

      {/* Header */}
      <div class="explorer-header">
        <div class="eyebrow">
          <span class="eyebrow-dot"></span>
          Interactive API Explorer
        </div>
        <h1>OpenGrid API</h1>
        <p class="subtitle">
          Try any endpoint live. Pick a facility type, filter by state or LGA, and see the real response — no setup needed.
        </p>
        <div class="explorer-meta">
          <span class="meta-tag"><code>https://opengrid.pages.dev/api</code></span>
          <span class="meta-tag">No auth required</span>
          <span class="meta-tag">JSON</span>
          <span class="meta-tag">CORS enabled</span>
        </div>
      </div>

      {/* Main explorer layout */}
      <div class="explorer-layout">

        {/* Left: Controls */}
        <div class="explorer-controls">
          <div class="explorer-section-label">Explore Facilities</div>

          <div class="explorer-field-group">
            <label class="explorer-label" for="exp-type">Facility Type</label>
            <select class="explorer-select" id="exp-type">
              <option value="">All types</option>
              {typeOptions.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div class="explorer-field-group">
            <label class="explorer-label" for="exp-state">State</label>
            <select class="explorer-select" id="exp-state">
              <option value="">All states</option>
            </select>
          </div>

          <div class="explorer-field-group">
            <label class="explorer-label" for="exp-lga">LGA</label>
            <select class="explorer-select" id="exp-lga" disabled>
              <option value="">All LGAs</option>
            </select>
          </div>

          <div class="explorer-field-group">
            <label class="explorer-label" for="exp-q">Search</label>
            <input class="explorer-input" id="exp-q" type="text" placeholder="e.g. general hospital" />
          </div>

          <div class="explorer-field-row">
            <div class="explorer-field-group">
              <label class="explorer-label" for="exp-limit">Limit</label>
              <input class="explorer-input" id="exp-limit" type="number" value="10" min="1" max="100" />
            </div>
            <div class="explorer-field-group">
              <label class="explorer-label" for="exp-source">Source</label>
              <select class="explorer-select" id="exp-source">
                <option value="">Any</option>
                <option value="grid3">Grid3</option>
                <option value="community">Community</option>
              </select>
            </div>
          </div>

          {/* Generated URL */}
          <div class="explorer-url-block">
            <div class="explorer-url-label">
              <span class="method-badge method-get">GET</span>
              <span class="explorer-url-text" id="exp-url">/api/facilities?limit=10</span>
            </div>
            <div class="explorer-url-actions">
              <button class="icon-btn" id="exp-copy-curl" title="Copy as curl">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                curl
              </button>
              <button class="icon-btn" id="exp-copy-url" title="Copy URL">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                URL
              </button>
            </div>
          </div>

          <button class="btn btn-glow explorer-run-btn" id="exp-run">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Run Request
          </button>
        </div>

        {/* Right: Response */}
        <div class="explorer-response">
          <div class="response-header">
            <div class="response-title">Response</div>
            <div class="response-meta" id="exp-response-meta"></div>
          </div>
          <div class="response-body" id="exp-response-body">
            <div class="response-placeholder">
              <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" opacity="0.3"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              <p>Set your filters and click <strong>Run Request</strong> to see a live response.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Endpoint Reference */}
      <div class="endpoint-ref">
        <h2 class="endpoint-ref-title">Endpoint Reference</h2>
        <p class="endpoint-ref-sub">All endpoints return JSON. No authentication required.</p>

        <div class="endpoint-ref-list">
          {ENDPOINTS.map((ep, i) => (
            <details key={i} class="endpoint-item">
              <summary class="endpoint-summary">
                <span class={`method-badge method-${ep.method.toLowerCase()}`}>{ep.method}</span>
                <code class="endpoint-path">{ep.path}</code>
                <span class="endpoint-desc-inline">{ep.description}</span>
              </summary>
              <div class="endpoint-detail">
                {ep.params.length > 0 && (
                  <table class="param-table">
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Type</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ep.params.map((p) => (
                        <tr key={p.name}>
                          <td><code>{p.name}</code></td>
                          <td><span class="param-type">{p.type}</span></td>
                          <td>{p.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <div class="endpoint-try-wrap">
                  <a
                    href={ep.path.includes(':')
                      ? `/api${ep.path.replace('/api', '').split(':')[0].replace(/\/$/, '')}`
                      : `/api${ep.path.replace('/api', '')}`}
                    target="_blank"
                    rel="noopener"
                    class="btn btn-sm btn-outline"
                    id={`try-${i}`}
                  >
                    Open in browser →
                  </a>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Facility Types Reference */}
      <div class="types-ref">
        <h2 class="endpoint-ref-title">Facility Types</h2>
        <p class="endpoint-ref-sub">Pass these exact values to the <code>type=</code> query parameter.</p>
        <div class="types-grid">
          {FACILITY_TYPES.map((type) => (
            <div class="type-ref-card" key={type} id={`type-ref-${type}`}>
              <code class="type-slug">{type}</code>
              <span class="type-label-text">{FACILITY_TYPE_LABELS[type]}</span>
              <a
                href={`/api/facilities?type=${type}&limit=5`}
                target="_blank"
                rel="noopener"
                class="type-try-link"
              >
                Try →
              </a>
            </div>
          ))}
        </div>
      </div>

      <script dangerouslySetInnerHTML={{__html: `
        (function() {
          var BASE = window.location.origin;

          // ── State ────────────────────────────────────────────────────────────
          var selType   = document.getElementById('exp-type');
          var selState  = document.getElementById('exp-state');
          var selLga    = document.getElementById('exp-lga');
          var selSource = document.getElementById('exp-source');
          var inpQ      = document.getElementById('exp-q');
          var inpLimit  = document.getElementById('exp-limit');
          var urlText   = document.getElementById('exp-url');
          var runBtn    = document.getElementById('exp-run');
          var respBody  = document.getElementById('exp-response-body');
          var respMeta  = document.getElementById('exp-response-meta');
          var copyCurl  = document.getElementById('exp-copy-curl');
          var copyUrl   = document.getElementById('exp-copy-url');

          // ── Load states ───────────────────────────────────────────────────────
          fetch('/api/states')
            .then(function(r) { return r.json(); })
            .then(function(d) {
              var states = d.data || [];
              states.forEach(function(s) {
                var o = document.createElement('option');
                o.value = s.slug;
                o.textContent = s.name;
                selState.appendChild(o);
              });
            })
            .catch(function() {});

          // ── Load LGAs on state change ─────────────────────────────────────────
          selState.addEventListener('change', function() {
            var slug = selState.value;
            selLga.innerHTML = '<option value="">All LGAs</option>';
            selLga.disabled = !slug;
            if (!slug) { updateUrl(); return; }
            fetch('/api/lgas?state=' + slug)
              .then(function(r) { return r.json(); })
              .then(function(d) {
                var lgas = d.data || d || [];
                lgas.forEach(function(l) {
                  var o = document.createElement('option');
                  o.value = l.slug;
                  o.textContent = l.name;
                  selLga.appendChild(o);
                });
              })
              .catch(function() {});
            updateUrl();
          });

          // ── Build URL ─────────────────────────────────────────────────────────
          function buildUrl() {
            var params = [];
            if (selType.value)   params.push('type=' + encodeURIComponent(selType.value));
            if (selState.value)  params.push('state=' + encodeURIComponent(selState.value));
            if (selLga.value)    params.push('lga=' + encodeURIComponent(selLga.value));
            if (inpQ.value.trim()) params.push('q=' + encodeURIComponent(inpQ.value.trim()));
            if (selSource.value) params.push('source=' + encodeURIComponent(selSource.value));
            var limit = parseInt(inpLimit.value) || 10;
            params.push('limit=' + limit);
            return '/api/facilities' + (params.length ? '?' + params.join('&') : '');
          }

          function updateUrl() {
            urlText.textContent = buildUrl();
          }

          [selType, selSource, selLga, inpLimit].forEach(function(el) {
            el.addEventListener('change', updateUrl);
          });
          inpQ.addEventListener('input', updateUrl);

          // ── Copy helpers ──────────────────────────────────────────────────────
          function copyText(text, btn, label) {
            navigator.clipboard.writeText(text).then(function() {
              var orig = btn.innerHTML;
              btn.textContent = '✓ Copied';
              btn.classList.add('copied');
              setTimeout(function() { btn.innerHTML = orig; btn.classList.remove('copied'); }, 1800);
            }).catch(function() {});
          }

          copyCurl.addEventListener('click', function() {
            var fullUrl = BASE + buildUrl();
            copyText('curl "' + fullUrl + '"', copyCurl, 'curl');
          });

          copyUrl.addEventListener('click', function() {
            var fullUrl = BASE + buildUrl();
            copyText(fullUrl, copyUrl, 'URL');
          });

          // ── Run request ───────────────────────────────────────────────────────
          runBtn.addEventListener('click', function() {
            var url = buildUrl();
            var fullUrl = BASE + url;

            runBtn.disabled = true;
            runBtn.textContent = 'Loading…';
            respMeta.textContent = '';
            respBody.innerHTML = '<div class="response-loading"><span class="resp-spinner"></span> Fetching…</div>';

            var t0 = Date.now();
            fetch(url)
              .then(function(r) {
                var ms = Date.now() - t0;
                var status = r.status;
                return r.json().then(function(data) {
                  return { data: data, status: status, ms: ms };
                });
              })
              .then(function(result) {
                var total = result.data.meta ? result.data.meta.total : null;
                var shown = Array.isArray(result.data.data) ? result.data.data.length : null;
                var metaParts = [];
                metaParts.push('<span class="resp-status resp-status-ok">' + result.status + ' OK</span>');
                metaParts.push('<span class="resp-ms">' + result.ms + 'ms</span>');
                if (total !== null) metaParts.push('<span class="resp-count">' + (shown || 0) + ' of ' + total.toLocaleString() + ' results</span>');
                respMeta.innerHTML = metaParts.join('');

                var json = JSON.stringify(result.data, null, 2);
                // Syntax highlight
                json = json
                  .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
                    var cls = 'json-num';
                    if (/^"/.test(match)) {
                      cls = /:$/.test(match) ? 'json-key' : 'json-str';
                    } else if (/true|false/.test(match)) {
                      cls = 'json-bool';
                    } else if (/null/.test(match)) {
                      cls = 'json-null';
                    }
                    return '<span class="' + cls + '">' + match + '</span>';
                  });
                respBody.innerHTML = '<pre class="response-json">' + json + '</pre>';
              })
              .catch(function(err) {
                respMeta.innerHTML = '<span class="resp-status resp-status-err">Error</span>';
                respBody.innerHTML = '<div class="response-err">' + (err.message || 'Request failed') + '</div>';
              })
              .finally(function() {
                runBtn.disabled = false;
                runBtn.innerHTML = '<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg> Run Request';
              });
          });
        })();
      `}} />
    </div>
  );
};
