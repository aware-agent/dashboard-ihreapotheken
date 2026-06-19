/**
 * Mock interceptor — active when VITE_LOCAL=true
 *
 * Instead of patching every hook individually, we intercept at the API client
 * level by replacing the fetch functions before any component mounts.
 */

import {
  MOCK_USER,
  MOCK_RESULTS,
  MOCK_HEALTH_ZONES,
  MOCK_BIO_AGE,
  MOCK_BIO_AGE_HISTORY,
  MOCK_ACTIONS,
  MOCK_APPOINTMENTS,
  MOCK_FACILITIES,
  MOCK_HEALTH_PROFILE_QUESTIONS,
  MOCK_HEALTH_PROFILE_ANSWERS,
  MOCK_BIOMARKER_DETAIL,
  MOCK_PACKAGES,
} from './data';

type MockResponse = unknown;

const mockRoutes: Record<string, MockResponse> = {
  // Users
  '/v1/users/me': MOCK_USER,
  '/v1/users/me/health-profile': { healthProfile: MOCK_HEALTH_PROFILE_ANSWERS.healthProfile },

  // Results
  '/v1/results': MOCK_RESULTS,

  // Health Zones
  '/v1/health-zones': MOCK_HEALTH_ZONES,

  // Facilities
  '/v1/facilities': MOCK_FACILITIES,

  // BFF endpoints
  '/bio-age': MOCK_BIO_AGE,
  '/bio-age-progress': MOCK_BIO_AGE_HISTORY,
  '/appointments': MOCK_APPOINTMENTS,
  '/actions/health-profile': { healthProfile: MOCK_HEALTH_PROFILE_QUESTIONS },
};

/**
 * Match a URL to a mock response.
 * Supports prefix matching for parameterised routes.
 */
function findMock(url: string): MockResponse | undefined {
  // Strip query string
  const clean = url.split('?')[0];

  // Exact match first
  for (const [pattern, data] of Object.entries(mockRoutes)) {
    if (clean === pattern || clean.endsWith(pattern)) {
      return data;
    }
  }

  // Biomarker detail: /v1/biomarkers/<id> or /v1/biomarkers/known/<code>
  if (/\/v1\/biomarkers\//.test(clean)) return MOCK_BIOMARKER_DETAIL;

  // Result health-zone detail: /v1/results/<id>/health-zones/<id>
  if (/\/v1\/results\/[^/]+\/health-zones\//.test(clean)) {
    return {
      id: 'hz-hormones',
      name: 'Hormones',
      icon: null,
      biomarkers: MOCK_RESULTS.results[0].biomarkers.slice(0, 3),
      inRange: 3,
      outOfRange: 1,
    };
  }

  // Result actions: /v1/results/<id>/actions
  if (/\/v1\/results\/[^/]+\/actions/.test(clean)) {
    return { actions: [], triggeringIndicators: [] };
  }

  // BFF actions: /actions/<resultId>/actions
  if (/\/actions\/[^/]+\/actions/.test(clean)) return MOCK_ACTIONS;

  // Packages: /packages
  if (/\/packages/.test(clean)) return MOCK_PACKAGES;

  // PDF: return empty blob placeholder
  if (/\/v1\/results\/[^/]+\/pdf/.test(clean)) return new Blob(['%PDF'], { type: 'application/pdf' });

  return undefined;
}

/**
 * Called at app boot — installs mocks only if VITE_LOCAL=true.
 */
export function maybeInstallMocks() {
  if (import.meta.env.VITE_LOCAL === 'true') {
    installMocks();
  }
}

/**
 * Install mock interceptor by overriding global fetch.
 */
function installMocks() {
  const originalFetch = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

    const mock = findMock(url);

    if (mock !== undefined) {
      // Simulate a small network delay for realism
      await new Promise((r) => setTimeout(r, 80));

      if (mock instanceof Blob) {
        return new Response(mock, { status: 200 });
      }

      return new Response(JSON.stringify(mock), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // For auth endpoints (/v1/auth/*), return 200 success silently
    if (/\/v1\/auth\//.test(url) || /\/v2\/auth\//.test(url)) {
      await new Promise((r) => setTimeout(r, 50));
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fall through to real fetch for anything not mocked
    return originalFetch(input, init);
  };

  console.info('[Mock] API interceptor installed. All API calls use mock data.');
}
