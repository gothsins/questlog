import test from 'node:test'
import assert from 'node:assert/strict'

import { reviewDate, reviewInitial, reviewValidation } from '../src/components/reviewPresentation.ts'

test('review validation uses trimmed minimum and raw maximum without changing content', () => {
    assert.match(reviewValidation('  1234567890123456789  '), /20 caracteres/)
    assert.equal(reviewValidation('  12345678901234567890  '), null)
    assert.equal(reviewValidation('x'.repeat(2000)), null)
    assert.match(reviewValidation('x'.repeat(2001)), /2.000 caracteres/)
})

test('review presentation formats backend dates and neutral initials', () => {
    assert.equal(reviewDate('2026-01-02T13:00:00'), '02/01/2026')
    assert.equal(reviewDate('not-a-date'), 'Data indisponível')
    assert.equal(reviewInitial(' álvaro '), 'Á')
    assert.equal(reviewInitial(''), '?')
})
