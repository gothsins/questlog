import test from 'node:test'
import assert from 'node:assert/strict'

import { buildContentSecurityPolicy } from '../csp.ts'

test('policy never allows inline or eval script execution', () => {
    const policy = buildContentSecurityPolicy('http://localhost:8080')

    assert.ok(!policy.includes("'unsafe-inline'"))
    assert.ok(!policy.includes("'unsafe-eval'"))
    assert.match(policy, /script-src 'self'(;|$)/)
})

test('API origin is allowed for requests and images, normalized to origin only', () => {
    const policy = buildContentSecurityPolicy('https://api.example.com/some/path/')

    assert.match(policy, /connect-src 'self' https:\/\/api\.example\.com(;|$)/)
    assert.match(policy, /img-src [^;]*https:\/\/api\.example\.com/)
    assert.ok(!policy.includes('/some/path'))
})

test('only the known third-party origins are allowed', () => {
    const policy = buildContentSecurityPolicy('http://localhost:8080')

    assert.match(policy, /img-src [^;]*https:\/\/images\.igdb\.com/)
    assert.match(policy, /frame-src https:\/\/www\.youtube-nocookie\.com(;|$)/)
    assert.match(policy, /object-src 'none'/)
    assert.match(policy, /frame-ancestors 'none'/)
})

test('a malformed API url fails loudly instead of weakening the policy', () => {
    assert.throws(() => buildContentSecurityPolicy('not a url'))
})
