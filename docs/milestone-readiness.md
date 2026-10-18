# Milestone stabilization and readiness

## Local application and verification

Use Java 21, Node 24, PostgreSQL 17 and Redis 7. The [root README](../README.md)
describes normal local startup (`docker compose up -d`, backend Maven run,
then `npm ci` and `npm run dev` in `frontend/`). That Compose configuration
uses a **persistent** development volume. Do not use it for integration tests.
Keep `.env` files, JWT secrets and API credentials out of commits and test
logs. Local gameplay with IGDB/Steam requires developer credentials; the
tests below do not call those providers.

For frontend checks, from `frontend/` run `npm ci`, `npm run build`,
`npm run lint`, `npm test`, and `npm run test:e2e`. Playwright starts its own
Vite server and uses strictly intercepted synthetic API fixtures. It does not
exercise Spring Boot. The production build now loads page modules on demand;
the initial JavaScript entry fell from 515.33 kB (157.29 kB gzip) to 287.54
kB (90.53 kB gzip), measured with `npm run build` before and after the change
on this branch. The new initial entry also imports a shared 131.42 kB
(43.23 kB gzip) React chunk, so the comparable initial JavaScript total is
418.96 kB (133.76 kB gzip), a reduction of 96.37 kB (23.53 kB gzip).
Route chunks load when visited; this removes the Vite 500 kB warning without
changing its threshold.

For the real backend journey, start **disposable** PostgreSQL and Redis
containers with unique names and random host ports, as CI does. Set
`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`,
`SPRING_DATA_REDIS_PORT`, fictitious `IGDB_CLIENT_ID` and `IGDB_CLIENT_SECRET`,
and a fresh random `JWT_SECRET`. The CI workflow shows exact service and
environment setup. Then run from `backend/`:

```sh
./mvnw -B -ntp clean test '-Dtest=*Test,*Tests,*IT'
```

On Windows use `mvnw.cmd`. Do not point this command at the persistent
development database. `PlayerJourneyIT` uses real Spring Security, JWT,
controller routing, Flyway, PostgreSQL and Redis. It creates synthetic users
and a catalog game in the disposable database, then verifies registration,
wrong and correct login, library isolation, add/update, game details, review
read/edit/delete and rejection of another user's mutations. Only the external
Pwned Passwords HTTP client is replaced by a deterministic test response; the
password policy, local SHA-1 suffix comparison and fail-closed production
configuration remain unchanged. IGDB and Steam are not contacted because the
test inserts a local catalog game through the repository.

The existing GitHub Actions backend job already starts temporary PostgreSQL
and Redis and runs `*IT`, so this journey joins the PR quality gate without a
new service or paid tool. The browser job still uses mock API fixtures. A
single browser → live Spring Boot → disposable database suite is deferred:
it would require a dedicated backend launcher, external-provider stubs and
safe test-data seeding, while duplicating much of the new controller journey.
It should be added only when it can run reproducibly without real providers,
accounts or persistent data.

Local final validation on this branch used Docker Desktop with disposable
PostgreSQL 17 and Redis 7 containers, random published ports and no reused
database. `mvnw.cmd -B -ntp clean test '-Dtest=*Test,*Tests,*IT'` passed 114
tests; `npm run build` and `npm run lint` passed without warnings from the
frontend sources; `npm test` passed 12 tests; Playwright with two workers and
zero retries passed 50 tests with two intentional viewport skips. The first
attempt to run Playwright concurrently with a cold Spring Boot test context
hit the browser's global test timeout on this workstation. Running each suite
separately passed without changing timeouts. A prior isolated integration run
left a Redis rate-limit bucket for MockMvc's default IP; the journey test now
uses a unique synthetic remote address per run and still exercises the real
limiter. These observations are local; GitHub CI must be checked on the PR's
final commit.

## Findings and disposition

| Severity | Finding | Disposition |
| --- | --- | --- |
| Medium | `/profile` did not use the frontend authenticated-route guard; a visitor could reach its shell before the API returned 401. The backend still rejected data. | Route now uses `ProtectedRoute`; expired profile queries clear the session and navigate to login. |
| Low | The profile nickname was copied from query data in an effect, producing two lint warnings and a stale-dependency risk. | Draft is derived from server data until edited and reset after a confirmed save; no effect-based state copy. Load failure has a retry control. |
| Low | The profile said nicknames appeared in analyses, while review responses display `username`. | Copy now describes the current contract accurately. |
| Low/performance | Every route was bundled into the initial 515.33 kB JavaScript entry. | Route-level lazy loading lowers the initial entry to 287.54 kB; route behavior is covered by desktop/mobile E2E. |

## Remaining risks and integration decision

- Browser tests validate UI behavior against synthetic API fixtures; they do
  not prove a live browser-to-backend flow. `PlayerJourneyIT` covers the real
  controller/persistence/authentication path without React. This is a coverage
  boundary, not a production behavior change.
- IGDB, Steam and Pwned Passwords production availability, quotas and external
  error behavior cannot be established by offline tests. Their existing unit
  and simulated browser error tests remain in place.
- Reviews currently display username, not nickname, and have no pagination or
  explicit edit marker. Changing those contracts belongs to a later milestone.
- Before publishing behind Cloudflare Tunnel or another proxy, define the
  trusted proxy boundary and IP/rate-limit behavior. Do not trust
  `X-Forwarded-For` automatically. This branch deliberately leaves IP
  identification unchanged.
- Before integrating to `main`, require the PR's backend, frontend, browser,
  CodeQL and secret-scan checks to pass on the final commit. Review any new
  alerts and verify the integration branch has not advanced unexpectedly.

**Readiness recommendation:** ready for human review and integration after the
final PR checks are green. The deferred live-browser boundary and external
provider behavior are future quality work, not blockers for the verified
local flows in this milestone.
