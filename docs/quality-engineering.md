# Quality checks

The PR workflows use only GitHub-hosted standard runners, official GitHub
actions, and the open-source Gitleaks CLI. They do not provision a paid service,
use production credentials, deploy, or connect to a persistent database.
GitHub's free hosted-runner allowance applies to this public repository; verify
repository visibility and billing policy before making it private. The separate
GitHub Code Quality product is not enabled.

## Run locally

Use Node 24 and Java 21. From `frontend/`:

```sh
npm ci
npm run build
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm audit --audit-level=high
```

`npm run test:e2e:headed` opens Chromium for investigation. Playwright starts
its own Vite server on `127.0.0.1:4173`; close another server on that port
before running it. The browser tests run in desktop Chrome and a Pixel 7
viewport. `e2e/mockApi.ts` intercepts Questlog API calls with local fixtures,
including fictitious login, game, and library state. The browser context
allows HTTP only to the local Vite server on `127.0.0.1:4173`; explicitly
handled API calls at `127.0.0.1:8080` receive mock responses without a network
request. All other HTTP and WebSocket destinations are blocked and reported.
The runner refuses to reuse a Vite server already listening on that port,
preventing an inherited API configuration. No backend, IGDB, Steam, Pwned
Passwords, account, or real JWT is needed. The mock session token is only a
visual fixture. Failed tests leave screenshots and traces in ignored
`frontend/test-results/`; keep those files
private if you later add tests with real credentials.

The browser suite covers the product tour, public navigation, registration
validation and errors, login errors, protected-route redirects, mocked library
status changes, exploration and import, game details gallery keyboard/lightbox,
external-data errors, and mobile overflow. It does **not** prove API contracts
or a full browser-to-backend journey. The backend's integration tests cover
real persistence separately. A future isolated browser integration suite can
start disposable PostgreSQL/Redis containers and a local Spring Boot process;
it must stub external services and use synthetic users.

From `backend/`, run all Maven `*Test`, `*Tests`, and `*IT` classes after
starting **disposable** PostgreSQL 17 and Redis 7 instances and setting their
ports through `POSTGRES_PORT` and `SPRING_DATA_REDIS_PORT`. Set
`POSTGRES_DB=questlog_ci`, `POSTGRES_USER=questlog_ci`,
`POSTGRES_PASSWORD=''`, fictitious `IGDB_CLIENT_ID` and
`IGDB_CLIENT_SECRET`, and a fresh random `JWT_SECRET`. Then run:

```sh
./mvnw -B -ntp clean test '-Dtest=*Test,*Tests,*IT'
```

On Windows use `mvnw.cmd` and PowerShell's corresponding environment syntax.
Do not point tests at a development or production database. The exact
disposable service configuration is in `.github/workflows/ci.yml`.

## Pull-request jobs and failure criteria

| Workflow / job | What runs | PR result |
| --- | --- | --- |
| `Questlog CI / Backend tests` | Java 21, Maven unit and integration tests, temporary PostgreSQL/Redis | Any test/build failure is red |
| `Questlog CI / Frontend build, lint and tests` | Node 24, locked install, production build, lint, existing tests; `npm audit` report | Build/lint/tests fail red; audit is advisory |
| `Questlog CI / Browser E2E (mock API)` | Locked install, Chromium, Playwright fixtures | Failing test is red; failure traces/screenshots retained for one day |
| `CodeQL security / CodeQL java-kotlin` | Manual Java compile and extended security queries | Extraction/analyzer failure is red; findings appear in code scanning |
| `CodeQL security / CodeQL javascript-typescript` | Source analysis and extended security queries | Extraction/analyzer failure is red; findings appear in code scanning |
| `Secret scan / Secrets in proposed commits` | Gitleaks CLI over commits proposed by the PR | Detected secret or scanner error is red |

CodeQL runs on PRs targeting `feat/game-reviews` or `main`, pushes to either
branch, and manual dispatch. Other security workflows run on those PRs. The
existing CI additionally runs on pushes to `main` and manual dispatch. CodeQL and CI
cancel superseded runs on the same ref. Jobs have read-only repository access
except CodeQL's `security-events: write` permission to upload findings.
Checkout does not retain credentials. The PR event executes untrusted source
without production secrets. Only failure artifacts are uploaded, for one day.

GitHub's free Dependency Review action was tested on PR #5, but GitHub rejected
it because this repository's dependency graph is disabled. It was removed
instead of leaving a permanently failing job. Repository administrators may
enable the free dependency graph in repository security settings; after that,
Dependency Review can be reconsidered to block **new** high/critical Maven and
npm advisories. This milestone does not automatically block vulnerable
dependencies. The CI frontend job runs `npm audit --audit-level=high` as a
visible, non-blocking report; it needs npm advisory access and can change as
the database changes. We did not add an OWASP Dependency-Check gate: the NVD
data feed/key and updates would make an unauthenticated PR check slow and
unreliable. Maven has no vulnerability scanner in this CI yet. Review Maven
dependencies manually until the dependency graph is enabled. Advisory findings
can be false positives for unreachable code or versions with backported fixes; document
the exact package, affected version, severity, exploitability, and available
fix before changing a gate. Never suppress an advisory just to make CI green.

The workflows pin `github/codeql-action` v4.38.1 and Gitleaks v8.30.0 by
immutable SHA/digest. The npm advisory threshold is high (including critical),
but its CI step is advisory. Gitleaks findings fail the PR job.

CodeQL availability is included for public repositories, but its findings are
alerts and do not automatically fail this workflow. Require checks through
branch protection if desired; configure any alert-based policy separately.
GitHub Actions and artifact storage policies may change. The one-day failure
artifact retention minimizes storage, but repository administrators should
monitor free quotas. No paid feature is required by these workflows.

## Secret scanning and incident response

Gitleaks scans **new PR commits**, not the entire repository history. To audit
all history locally with the free CLI, from a trusted clone run:

```sh
gitleaks git --no-banner --redact=100 .
```

For working-tree files, run `gitleaks dir --no-banner --redact=100 .`.
Do not publish unredacted reports or upload them as public CI artifacts. A
finding should be treated as potentially real: identify its provider and
scope, revoke or rotate the credential promptly in the provider, inspect
access logs, replace it in affected environments, and only then clean the
repository. Deleting a line or rewriting Git history alone does not revoke a
credential; coordinate history repair with collaborators if exposure occurred.
For false positives, inspect the finding privately and prefer changing the
fixture or adding a narrow, reviewed allowlist rather than disabling a rule.

## Extending the suite

Keep browser fixtures in `frontend/e2e/mockApi.ts` and route new API requests
explicitly. Use semantic locators and state assertions instead of fixed sleeps.
For real integration scenarios, create temporary accounts and services for
each run, stub external providers, and keep credentials out of logs, traces,
and uploaded artifacts. Do not reuse production tokens or databases.
