# PR #8 security-gate review

The final integration PR targets `main` from `feat/game-reviews`. Its secret
scan checks all commits in `53f83407f178ec791235531afd7a62423bf118d3..e944a2b9e68a9ba5040a619dad9c475145bc9db8`
(33 commits, including GitHub's PR merge commit), rather than only commits
added by the follow-up correction PR. The scan used the repository's existing
Gitleaks configuration, the image digest pinned in `.github/workflows/gitleaks.yml`,
and `--redact=100`. The local report was kept outside the repository; no
matches or secret values are recorded here.

The four reported entries are two fingerprints detected twice each: once as a
literal and once after Base64 decoding. Both are `generic-api-key` matches on
the `security.jwt.secret` property inside `@SpringBootTest` annotations.

| Fingerprint | Commit | File and line | Classification |
| --- | --- | --- | --- |
| `df9d76d9fb7623b16195df7f47997b6df66f4c17:backend/src/test/java/com/gothsins/questlog/ratelimit/RateLimitRedisIT.java:generic-api-key:19` | `df9d76d` | `backend/src/test/java/com/gothsins/questlog/ratelimit/RateLimitRedisIT.java:19` | Synthetic test fixture; two detections |
| `ce2e59def18c38e356aae7884a1de7cd1055bf50:backend/src/test/java/com/gothsins/questlog/review/GameReviewRepositoryIT.java:generic-api-key:28` | `ce2e59d` | `backend/src/test/java/com/gothsins/questlog/review/GameReviewRepositoryIT.java:28` | Synthetic test fixture; two detections |

The fixture decodes to a repeated 16-byte ASCII-hex sequence and is identical
in both commits. A search of the current tracked tree found it only in four
test classes, with no match in production source or configuration. These are
deterministic test keys, not deployable credentials. `.gitleaksignore` now
excludes only the two exact historical fingerprints. New secrets, including
new occurrences of the same fixture on different lines or commits, remain
subject to scanning. A future finding that may be a real credential must
block integration and trigger provider-specific revocation or rotation before
any exception is considered.

## CodeQL SHA-1 finding

The [Pwned Passwords range protocol](https://haveibeenpwned.com/API/V3#SearchingByRange)
requires the first five hexadecimal characters of a SHA-1 hash by default.
`PwnedPasswordService` computes that hash locally, sends only the prefix via
`PwnedPasswordClient`, and compares the returned suffix locally. The full
hash and password are never sent to the provider. SHA-1 is an interoperability
format for this lookup, not a password verifier or stored password hash;
`AuthService` continues to store passwords with BCrypt. Replacing SHA-1 with
SHA-256 would silently invalidate the lookup. No additional misuse was found
in this path. The SHA-1 alert is therefore an intentional protocol use, not a
remediable weak password-storage finding.

CodeQL Java and JavaScript/TypeScript analysis jobs completed successfully on
PR #8, while the separate CodeQL result check reported a finding. A repository
security reviewer should inspect [the specific alert](https://github.com/gothsins/questlog/security/code-scanning/2),
confirm its location and data flow, then dismiss it as **used in tests** only
if that reason applies; for this production lookup, use the GitHub reason
**won't fix** with the protocol rationale above. Do not dismiss the query
globally or mark the alert fixed. Alert detail and dismissal controls require
GitHub Security access; this review has not changed the alert state.

After this correction is merged into `feat/game-reviews` by a maintainer,
rerun the PR #8 secret scan against the updated head and confirm all required
checks. Do not merge PR #8 while the secret gate is red or the CodeQL finding
has not been reviewed under the repository's policy.
