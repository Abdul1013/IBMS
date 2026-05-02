/**
 * IBMS Load Test — k6 Script
 * ===========================
 * Run:  k6 run tests/load/ibms_load_test.js
 *
 * Configure via environment variables:
 *   BASE_URL          (default: http://localhost:5000)
 *   TEST_EMAIL        (required)
 *   TEST_PASSWORD     (required)
 *   ANNOUNCEMENT_ID   (required)
 *   MAX_VUS           (default: 500)
 *   HOLD_SECONDS      (default: 180)
 *
 * Scenario:
 *   setup() logs in ONCE and returns the access token. Each VU iteration
 *   then performs an authenticated browse: GET /announcements (feed) +
 *   GET /announcements/:id (detail). This models a population of users
 *   who are already signed in and reading announcements — the realistic
 *   sustained load on the read path.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const TEST_EMAIL = __ENV.TEST_EMAIL;
const TEST_PASSWORD = __ENV.TEST_PASSWORD;
const ANNOUNCEMENT_ID = __ENV.ANNOUNCEMENT_ID;
const MAX_VUS = parseInt(__ENV.MAX_VUS || '500', 10);
const HOLD_SECONDS = parseInt(__ENV.HOLD_SECONDS || '180', 10);

if (!TEST_EMAIL || !TEST_PASSWORD || !ANNOUNCEMENT_ID) {
  throw new Error(
    'Missing required env vars: TEST_EMAIL, TEST_PASSWORD, ANNOUNCEMENT_ID'
  );
}

export const options = {
  stages: [
    { duration: '30s', target: MAX_VUS },
    { duration: `${HOLD_SECONDS}s`, target: MAX_VUS },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(99)<2000'],
    http_req_failed: ['rate<0.01'],
  },
};

export function setup() {
  const res = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (res.status !== 200) {
    throw new Error(`Login failed in setup: ${res.status} ${res.body}`);
  }

  const token = res.json('data.accessToken');
  if (!token) throw new Error('Login response missing accessToken');

  return { token };
}

export default function (data) {
  const authHeaders = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.token}`,
    },
  };

  const feedRes = http.get(
    `${BASE_URL}/api/v1/announcements?page=1&limit=10`,
    authHeaders
  );
  check(feedRes, { 'feed status 200': (r) => r.status === 200 });

  sleep(1);

  const detailRes = http.get(
    `${BASE_URL}/api/v1/announcements/${ANNOUNCEMENT_ID}`,
    authHeaders
  );
  check(detailRes, { 'detail status 200': (r) => r.status === 200 });

  sleep(1);
}
