# Security Hardening 2.0

## Registration password policy

New passwords need at least eight Unicode code points and at most **72 UTF-8
bytes**, the safe input limit for the existing BCrypt encoder. The policy
rejects malformed Unicode and a small local list of common passwords, without
composition rules. The backend enforces the rule; the registration form mirrors
the length and byte checks for immediate feedback. Existing BCrypt hashes are
unchanged. Older accounts whose password exceeded 72 UTF-8 bytes may retain
BCrypt truncation ambiguity until those users change their passwords.

After local validation and the existing username-availability check, the
backend computes SHA-1 locally and sends only its first five hexadecimal
characters to the [Pwned Passwords range API](https://haveibeenpwned.com/API/V3).
It compares the returned suffixes locally and ignores padding records with a
zero count. SHA-1 is used only for this lookup; BCrypt remains the stored
password hash. Passwords, full SHA-1 hashes and suffixes are never sent to the
service or written to application logs. The client sets `Add-Padding: true`,
uses HTTPS by default, does not follow redirects and limits both time and
response size.

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `PWNED_PASSWORDS_ENABLED` | `true` | Set `false` only for an explicitly offline development environment; local common-password checks remain active. |
| `PWNED_PASSWORDS_BASE_URL` | `https://api.pwnedpasswords.com` | Service origin. HTTP is accepted only for loopback tests. |
| `PWNED_PASSWORDS_TIMEOUT` | `2s` | Connection and request timeout. |
| `RATE_LIMIT_REDIS_TIMEOUT` | `2s` | Bucket4j Redis connection/command timeout. |
| `QUESTLOG_CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated exact frontend origins; wildcard is rejected. Set the real HTTPS origin before production. |

The password check **fails closed**: a timeout, non-200 response, oversized or
malformed range response returns a controlled `503`, and no account is saved.
This can temporarily stop registration during a provider outage. Disabling the
check is an explicit environment decision, not an automatic fallback.

## Login and registration throttling

Bucket4j continues to store per-IP buckets in Redis: login permits five
requests per minute, registration three per ten minutes. Greedy refill means a
single token normally returns after about 12 seconds for login or 200 seconds
for registration. A rejected request returns the existing JSON error shape,
HTTP `429` and `Retry-After` in whole seconds, rounded up from Bucket4j's
actual `ConsumptionProbe` wait. CORS exposes this header to configured origins.
If Redis fails at request time, both endpoints return a controlled `503`
instead of allowing unmetered attempts. Failure during the eager Redis
connection can prevent startup; this is also fail closed.

The key uses the servlet connection address (`getRemoteAddr`) and deliberately
ignores caller-supplied `X-Forwarded-For`. This avoids spoofed identities. When
deploying behind a reverse proxy, ensure the trusted edge applies its own
abuse controls and forwards requests through a controlled network; otherwise
all clients may share the proxy's bucket. Do not enable generic forwarded-header
trust without restricting direct access to the application. A username-based
bucket was not added: an attacker could deliberately exhaust another user's
bucket and learn or interfere with account activity. Reassess with a design
that avoids targeted lockout and username enumeration.

## Security review and production preparation

- Public auth access is limited to `POST /api/auth/login` and
  `POST /api/auth/register`. Other paths still require JWT. Invalid login
  responses remain generic; access-denied exceptions now map to a consistent
  `403` JSON response.
- The current registration `409` for an existing username reveals that the
  name is taken. Changing this public contract requires a separate product
  decision. Do not add account-specific throttling while it remains.
- Swagger UI and OpenAPI are public in the current configuration. Before
  exposing production traffic, disable them with
  `springdoc.swagger-ui.enabled=false` and
  `springdoc.api-docs.enabled=false`, or restrict them at a trusted gateway.
- `/actuator/health` is public. Metrics and Prometheus are exposed by
  `application.yml` and available to any authenticated account under the
  current role model. Put management endpoints on a private interface/port or
  restrict them at the gateway before production; changing scrape access here
  could break an existing monitoring deployment.
- Keep Redis on a private network or enable authenticated/TLS transport as
  appropriate for the deployment. This milestone does not change its transport
  or the existing JWT storage strategy in the browser.
- Ensure production egress can reach the Pwned Passwords HTTPS API, set an
  exact production CORS origin and monitor the rate of registration `503`
  responses. Never put real credentials in repository configuration.

The validation suite includes offline HIBP client tests, controller tests for
`400`/`401`/`429`/`503`, policy and BCrypt regression tests, and Redis
integration tests for refill and concurrent consumption. The integration tests
use the existing isolated PostgreSQL/Redis CI services.
