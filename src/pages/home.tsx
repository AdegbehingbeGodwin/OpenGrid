import type { FC } from 'hono/jsx';
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
  const topTypes = typeBreakdown.slice(0, 6);
  const coverageRatio = totalStates === 0 ? 0 : Math.round((statesWithData / totalStates) * 100);
  const rankedStates = [...stateStats].sort((a, b) => b.facility_count - a.facility_count).slice(0, 12);
  const maxCount = rankedStates[0]?.facility_count ?? 1;

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
              <span class="map-kicker">Coverage signal</span>
              <h2>National facility index</h2>
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

          <div class="hero-signal-body">
            <div class="hero-signal-matrix">
              <div class="signal-section-label">State ranking</div>
              {rankedStates.map((state, i) => {
                const pct = (state.facility_count / maxCount * 100).toFixed(1);
                const isGap = state.facility_count === 0;
                const tier = isGap ? 'gap' : i < 3 ? 'top' : i < 7 ? 'mid' : 'base';
                return (
                  <a
                    key={state.slug}
                    href={`/api/facilities?state=${state.slug}`}
                    class={`signal-row signal-row-${tier}`}
                    style={`--i:${i};--pct:${isGap ? '4' : pct}%`}
                  >
                    <span class="signal-rank tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                    <span class="signal-name">{state.name}</span>
                    <div class="signal-bar-track">
                      <div class="signal-bar"></div>
                    </div>
                    <span class="signal-value tabular-nums">{isGap ? '—' : formatCount(state.facility_count)}</span>
                  </a>
                );
              })}
            </div>

            <div class="hero-signal-types">
              <div class="signal-section-label">Category split</div>
              {topTypes.map((type, i) => {
                const maxTypeCount = topTypes[0]?.count ?? 1;
                const typePct = (type.count / maxTypeCount * 100).toFixed(1);
                return (
                  <a
                    key={type.type}
                    href={`/api/facilities?type=${type.type}&limit=10`}
                    class="signal-type-row"
                    style={`--i:${i + 14};--pct:${typePct}%`}
                  >
                    <span class={`signal-type-dot signal-dot-${type.type}`}></span>
                    <span class="signal-type-name">{FACILITY_TYPE_LABELS[type.type as FacilityType] ?? type.type}</span>
                    <div class="signal-type-track">
                      <div class={`signal-type-bar signal-type-bar-${type.type}`}></div>
                    </div>
                    <span class="signal-value tabular-nums">{formatCount(type.count)}</span>
                  </a>
                );
              })}

              <div class="signal-coverage-badge">
                <div class="coverage-badge-row">
                  <span class="coverage-badge-num tabular-nums">{coverageRatio}%</span>
                  <span class="coverage-badge-label">national coverage</span>
                </div>
                <div class="coverage-track">
                  <div class="coverage-fill" style={`--target-w:${coverageRatio}%`}></div>
                </div>
              </div>

              <div class="signal-types-footer">
                <a href="/docs" class="map-inline-link">Full API index →</a>
              </div>
            </div>
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



    </div>
  );
};
