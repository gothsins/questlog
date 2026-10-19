import test from 'node:test'
import assert from 'node:assert/strict'

import { registrationPasswordError } from '../src/pages/registrationPassword.ts'

test('registration checks code points and BCrypt UTF-8 byte limit', () => {
    assert.equal(registrationPasswordError('🦊'.repeat(8)), null)
    assert.equal(registrationPasswordError('é'.repeat(36)), null)
    assert.match(registrationPasswordError('é'.repeat(37)), /72 bytes/)
    assert.match(registrationPasswordError('🦊'.repeat(7)), /8 caracteres/)
    assert.match(registrationPasswordError('a'.repeat(73)), /72 bytes/)
})

test('registration rejects blank and malformed Unicode inputs', () => {
    assert.match(registrationPasswordError(' '.repeat(8)), /Informe/)
    assert.match(registrationPasswordError('abcdefgh\uD800'), /inválidos/)
})
