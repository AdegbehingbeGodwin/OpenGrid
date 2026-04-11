import type { FC } from 'hono/jsx';
import { STATE_COORDS } from '../data/state-coordinates';
import { NIGERIA_OUTLINE_PATH } from '../data/nigeria-outline';
import { FACILITY_TYPE_LABELS } from '../../types';
import type { FacilityType } from '../../types';

interface StateStat {
  slug: string;
  name: string;
  facility_count: number;
  lgas_with_data: number;
}

interface TypeCount {
  type: string;
  count: number;
}

interface HomeProps {
  stateStats: StateStat[];
  totalFacilities: number;
  totalStates: number;
  statesWithData: number;
  lgasWithData: number;
  typeBreakdown: TypeCount[];
}

function dotRadius(count: number): number {
  if (count === 0) return 3;
  if (count <= 100) return 5;
  if (count <= 500) return 7;
  if (count <= 2000) return 9;
  return 11;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export const HomePage: FC<HomeProps> = ({
  stateStats,
  totalFacilities,
  totalStates,
  statesWithData,
  lgasWithData,
  typeBreakdown,
}) => {
  const hotStates = stateStats.filter((s) => s.facility_count > 0).slice(0, 5);
  const needsData = stateStats.filter((s) => s.facility_count === 0).slice(0, 5);
  const topTypes = typeBreakdown.slice(0, 6);
  const coverageRatio = totalStates === 0 ? 0 : Math.round((statesWithData / totalStates) * 100);

  const tradeRoutes: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const hotSlugs = hotStates.map((s) => s.slug);
  for (let i = 0; i < hotSlugs.length - 1; i++) {
    const a = STATE_COORDS[hotSlugs[i]];
    const b = STATE_COORDS[hotSlugs[i + 1]];
    if (a && b) tradeRoutes.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
  }

  return (
    <div class="home-page home-cinematic">
      <div class="ambient-grid" aria-hidden="true"></div>
      <div class="hero-orbit hero-orbit-a" aria-hidden="true"></div>
      <div class="hero-orbit hero-orbit-b" aria-hidden="true"></div>

      <section class="hero-canvas">
        <div class="hero-narrative">
          <div class="eyebrow">
            <span class="eyebrow-dot"></span>
            World-class civic infrastructure visibility
          </div>
          <div class="hero-manifesto">
            <p class="hero-prelude">For developers, researchers, contributors, and the public.</p>
            <h1>See Nigeria's public infrastructure as a living system, not a spreadsheet.</h1>
            <p class="subtitle hero-subtitle">
              OpenGrid turns scattered facility records into a civic data surface that feels
              legible, modern, and consequential. Explore what exists, spot what is missing, and
              contribute what your community knows.
            </p>
          </div>

          <div class="hero-actions">
            <a href="/docs" class="btn btn-glow" id="hero-docs-btn">
              Explore the API
            </a>
            <a href="/map" class="btn btn-outline" id="hero-map-btn">
              Enter the map
            </a>
            <a href="/contribute" class="hero-text-link" id="hero-contribute-btn">
              Contribute missing facilities
            </a>
          </div>

          <div class="hero-proofline">
            <div class="proof-chip">
              <span class="proof-label">Coverage</span>
              <strong>{coverageRatio}% of states represented</strong>
            </div>
            <div class="proof-chip">
              <span class="proof-label">Open access</span>
              <strong>No auth. JSON API. Community-powered.</strong>
            </div>
          </div>
        </div>

        <div class="hero-stage">
          <div class="hero-stage-header">
            <div>
              <span class="map-kicker">National signal view</span>
              <h2>Nigeria facility pulse</h2>
            </div>
            <div class="hero-stage-stats">
              <div>
                <span>Facilities indexed</span>
                <strong>{formatCount(totalFacilities)}</strong>
              </div>
              <div>
                <span>LGAs covered</span>
                <strong>{formatCount(lgasWithData)}</strong>
              </div>
            </div>
          </div>

          <div class="hero-stage-map" id="market-map">
            <svg class="nigeria-svg" viewBox="0 0 800 700" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g class="map-viewport" id="map-viewport">
                <path class="nigeria-outline" d={NIGERIA_OUTLINE_PATH} />

                {tradeRoutes.map((route, index) => (
                  <line
                    key={`route-${index}`}
                    class="trade-route"
                    x1={String(route.x1)}
                    y1={String(route.y1)}
                    x2={String(route.x2)}
                    y2={String(route.y2)}
                  />
                ))}

                {stateStats.map((state) => {
                  const coords = STATE_COORDS[state.slug];
                  if (!coords) return null;

                  const radius = dotRadius(state.facility_count);
                  const isHot = state.facility_count > 0;
                  const dotClass = isHot ? 'market-dot market-dot-hot' : 'market-dot market-dot-watch';
                  const showLabel =
                    state.facility_count > 50 ||
                    hotStates.slice(0, 8).includes(state) ||
                    needsData.slice(0, 3).includes(state);
                  const pulseSpeed = isHot
                    ? `${2.5 + Math.random() * 1.5}s`
                    : `${3.5 + Math.random() * 1}s`;
                  const labelDx =
                    coords.labelOffset?.[0] ?? (coords.labelDir === 'left' ? -radius - 6 : radius + 6);
                  const labelDy = coords.labelOffset?.[1] ?? 4;

                  return (
                    <g
                      key={state.slug}
                      class="state-dot-group"
                      data-slug={state.slug}
                      data-name={state.name}
                      data-count={String(state.facility_count)}
                      data-lgas={String(state.lgas_with_data)}
                      data-x={String(coords.x)}
                      data-y={String(coords.y)}
                      data-label={coords.label}
                    >
                      {isHot && radius >= 5 && (
                        <circle class="market-dot-ring" cx={String(coords.x)} cy={String(coords.y)} r={String(radius * 2)}>
                          <animate
                            attributeName="r"
                            values={`${radius * 2};${radius * 3.5};${radius * 2}`}
                            dur={pulseSpeed}
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            values="0.4;0;0.4"
                            dur={pulseSpeed}
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}

                      <circle class={dotClass} cx={String(coords.x)} cy={String(coords.y)} r={String(radius)}>
                        <animate
                          attributeName="r"
                          values={`${radius};${radius + 2};${radius}`}
                          dur={pulseSpeed}
                          repeatCount="indefinite"
                        />
                      </circle>

                      {showLabel && (
                        <text
                          class={`map-label${coords.labelDir === 'left' ? ' map-label-left' : ''}`}
                          x={String(coords.x + labelDx)}
                          y={String(coords.y + labelDy)}
                        >
                          {coords.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>

            <div class="map-tooltip" id="map-tooltip">
              <span class="tooltip-ping"></span>
              <span class="tooltip-text" id="tooltip-text">
                {formatCount(totalFacilities)} facilities across {statesWithData} states
              </span>
            </div>

            <div class="map-focus-card" id="map-focus-card" hidden>
              <span class="focus-kicker">Focused state</span>
              <strong id="focus-title">Nigeria overview</strong>
              <p id="focus-meta">Click a node to zoom in and inspect coverage.</p>
              <a href="/api" id="focus-link">
                Open API index
              </a>
            </div>

            <button type="button" class="map-reset hero-map-reset" id="map-reset" hidden>
              Reset view
            </button>
          </div>
        </div>
      </section>

      <section class="signal-ribbon">
        <div class="signal-lead">
          <span class="section-kicker">What OpenGrid makes possible</span>
          <h2>Built to impress technical users without alienating everyone else.</h2>
        </div>
        <div class="signal-columns">
          <article>
            <span class="signal-tag">For technical teams</span>
            <p>Fast API access, consistent schemas, open contribution flows, and coverage snapshots that are usable immediately.</p>
          </article>
          <article>
            <span class="signal-tag">For public users</span>
            <p>A clear, navigable picture of schools, clinics, markets, and the places that still need visibility.</p>
          </article>
          <article>
            <span class="signal-tag">For contributors</span>
            <p>Open pathways to add local knowledge and make the national dataset more complete with every submission.</p>
          </article>
        </div>
      </section>

      <section class="editorial-grid">
        <article class="editorial-panel editorial-panel-copy">
          <span class="section-kicker">National coverage</span>
          <h2>One open index for public infrastructure across all 36 states and the FCT.</h2>
          <p>
            OpenGrid is designed to feel less like a directory dump and more like a civic lens:
            coverage where it exists, gaps where they remain, and a contribution path when the data
            falls short of reality.
          </p>
        </article>

        <article class="editorial-panel editorial-panel-stats">
          <div class="editorial-stat">
            <span>Facilities indexed</span>
            <strong>{formatCount(totalFacilities)}</strong>
          </div>
          <div class="editorial-stat">
            <span>States with data</span>
            <strong>
              {statesWithData}/{totalStates}
            </strong>
          </div>
          <div class="editorial-stat">
            <span>LGAs with data</span>
            <strong>{formatCount(lgasWithData)}</strong>
          </div>
        </article>

        <article class="editorial-panel editorial-panel-types">
          <span class="section-kicker">Most represented categories</span>
          <div class="type-pills">
            {topTypes.map((type) => (
              <a
                key={type.type}
                href={`/api/facilities?type=${type.type}&limit=10`}
                class="type-pill"
                id={`type-pill-${type.type}`}
              >
                {FACILITY_TYPE_LABELS[type.type as FacilityType] ?? type.type}
                <span class="pill-count">{formatCount(type.count)}</span>
              </a>
            ))}
          </div>
        </article>
      </section>

      <section class="surface-grid surface-grid-reframed">
        <div class="surface-card surface-card-code">
          <span class="surface-kicker">API confidence</span>
          <h3>No onboarding maze. No paywall. Just structured access.</h3>
          <div class="terminal terminal-hero">
            <div class="terminal-header">
              <span class="terminal-dot"></span>
              <span class="terminal-dot"></span>
              <span class="terminal-dot"></span>
            </div>
            <div class="terminal-body">
              <div class="terminal-line">
                <span class="terminal-prompt">$</span> curl /api/facilities?type=school&state=kano
              </div>
              <div class="terminal-line">
                <span class="terminal-prompt">$</span> curl /api/coverage
              </div>
              <div class="terminal-line">
                <span class="terminal-prompt">$</span> curl /api/types
              </div>
            </div>
          </div>
        </div>

        <div class="surface-card surface-card-glass">
          <span class="surface-kicker">Open contribution loop</span>
          <h3>Seeded from Grid3. Strengthened by local knowledge.</h3>
          <p>
            The dataset begins with established public records and gets better when contributors
            add what only communities can see on the ground.
          </p>
          <a href="/contribute" class="hero-text-link">
            Submit a facility
          </a>
        </div>

        <div class="surface-card surface-card-glass">
          <span class="surface-kicker">Civic storytelling</span>
          <h3>Coverage should feel visible, not buried in tables.</h3>
          <p>
            Maps, summaries, and state-by-state focus views make it easier to understand where the
            data is strong and where the country still needs better visibility.
          </p>
          <a href="/map" class="hero-text-link">
            Explore the live map
          </a>
        </div>
      </section>



      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var tooltip = document.getElementById('map-tooltip');
              var tooltipText = document.getElementById('tooltip-text');
              var defaultText = tooltipText.textContent;
              var groups = document.querySelectorAll('.state-dot-group');
              var map = document.getElementById('market-map');
              var viewport = document.getElementById('map-viewport');
              var reset = document.getElementById('map-reset');
              var focusCard = document.getElementById('map-focus-card');
              var focusTitle = document.getElementById('focus-title');
              var focusMeta = document.getElementById('focus-meta');
              var focusLink = document.getElementById('focus-link');
              var focusedSlug = null;
              var currentTransform = { tx: 0, ty: 0, scale: 1 };
              var activeGroup = null;
              var dragState = null;

              function renderTransform() {
                if (!viewport) return;
                viewport.setAttribute(
                  'transform',
                  'translate(' + currentTransform.tx + ' ' + currentTransform.ty + ') scale(' + currentTransform.scale + ')'
                );
              }

              function setActiveGroup(nextGroup) {
                if (activeGroup) activeGroup.classList.remove('is-active');
                activeGroup = nextGroup;
                if (activeGroup) activeGroup.classList.add('is-active');
              }

              function fmtCount(n) {
                return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
              }

              function applyFocus(slug, name, count, lgas, x, y) {
                if (!viewport) return;
                var scale = 1.95;
                var tx = 400 - scale * x;
                var ty = 330 - scale * y;
                currentTransform = { tx: tx, ty: ty, scale: scale };
                renderTransform();
                map.classList.add('map-focused');
                focusedSlug = slug;
                if (reset) reset.hidden = false;
                if (focusCard) focusCard.hidden = false;
                if (focusTitle) focusTitle.textContent = name;
                if (focusMeta) {
                  var c = parseInt(count, 10);
                  focusMeta.textContent =
                    c > 0
                      ? fmtCount(c) +
                        ' facilit' +
                        (c !== 1 ? 'ies' : 'y') +
                        ' across ' +
                        lgas +
                        ' LGA' +
                        (lgas !== '1' ? 's' : '')
                      : 'No data yet. Help add facilities for this state.';
                }
                if (focusLink) focusLink.setAttribute('href', '/api/facilities?state=' + slug);
              }

              function resetFocus() {
                if (!viewport) return;
                currentTransform = { tx: 0, ty: 0, scale: 1 };
                renderTransform();
                map.classList.remove('map-focused');
                focusedSlug = null;
                dragState = null;
                setActiveGroup(null);
                if (reset) reset.hidden = true;
                if (focusCard) focusCard.hidden = true;
              }

              if (reset) reset.addEventListener('click', resetFocus);

              if (map) {
                map.addEventListener('pointerdown', function(event) {
                  if (!focusedSlug) return;
                  if (
                    event.target.closest('.state-dot-group') ||
                    event.target.closest('.map-focus-card') ||
                    event.target.closest('.map-reset')
                  ) {
                    return;
                  }

                  dragState = {
                    pointerId: event.pointerId,
                    startX: event.clientX,
                    startY: event.clientY,
                    originTx: currentTransform.tx,
                    originTy: currentTransform.ty,
                    moved: false,
                  };
                  map.classList.add('is-dragging');
                  if (map.setPointerCapture) map.setPointerCapture(event.pointerId);
                });

                map.addEventListener('pointermove', function(event) {
                  if (!dragState || dragState.pointerId !== event.pointerId || !focusedSlug) return;
                  var dx = event.clientX - dragState.startX;
                  var dy = event.clientY - dragState.startY;
                  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragState.moved = true;
                  currentTransform.tx = dragState.originTx + dx;
                  currentTransform.ty = dragState.originTy + dy;
                  renderTransform();
                });

                function endDrag(event) {
                  if (!dragState || dragState.pointerId !== event.pointerId) return;
                  var moved = dragState.moved;
                  dragState = null;
                  map.classList.remove('is-dragging');
                  try {
                    if (map.releasePointerCapture) map.releasePointerCapture(event.pointerId);
                  } catch (error) {}
                  if (!moved && focusedSlug && !event.target.closest('.state-dot-group')) resetFocus();
                }

                map.addEventListener('pointerup', endDrag);
                map.addEventListener('pointercancel', endDrag);
              }

              groups.forEach(function(group) {
                group.addEventListener('mouseenter', function() {
                  var name = group.getAttribute('data-name');
                  var count = group.getAttribute('data-count');
                  var lgas = group.getAttribute('data-lgas');
                  var c = parseInt(count, 10);
                  tooltipText.textContent =
                    c > 0
                      ? name +
                        ' - ' +
                        fmtCount(c) +
                        ' facilit' +
                        (c !== 1 ? 'ies' : 'y') +
                        ' across ' +
                        lgas +
                        ' LGA' +
                        (lgas !== '1' ? 's' : '')
                      : name + ' - no data yet. Help add some.';
                  tooltip.classList.add('tooltip-active');
                });

                group.addEventListener('mouseleave', function() {
                  tooltipText.textContent = defaultText;
                  tooltip.classList.remove('tooltip-active');
                });

                group.addEventListener('click', function(event) {
                  event.stopPropagation();
                  var slug = group.getAttribute('data-slug');
                  var name = group.getAttribute('data-name');
                  var count = group.getAttribute('data-count');
                  var lgas = group.getAttribute('data-lgas');
                  var x = parseFloat(group.getAttribute('data-x'));
                  var y = parseFloat(group.getAttribute('data-y'));
                  if (focusedSlug === slug) {
                    resetFocus();
                    return;
                  }
                  setActiveGroup(group);
                  applyFocus(slug, name, count, lgas, x, y);
                });
              });
            })();
          `,
        }}
      />
    </div>
  );
};
