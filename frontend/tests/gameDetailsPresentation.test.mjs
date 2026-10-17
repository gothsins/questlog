import test from 'node:test'
import assert from 'node:assert/strict'

import { formatReleaseDate, youtubeEmbedUrl, reviewPercentage } from '../src/components/gameDetailsPresentation.ts'
import { galleryIndex, swipeMovement } from '../src/components/gameGalleryState.ts'

test('gallery wraps in both directions and handles empty media', () => {
    assert.equal(galleryIndex(2, 1, 3), 0)
    assert.equal(galleryIndex(0, -1, 3), 2)
    assert.equal(galleryIndex(0, 1, 0), 0)
    assert.equal(swipeMovement(200, 149), 1)
    assert.equal(swipeMovement(100, 155), -1)
    assert.equal(swipeMovement(100, 140), 0)
})

test('external media IDs are constrained to a YouTube video ID', () => {
    assert.equal(youtubeEmbedUrl('dQw4w9WgXcQ'), 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
    assert.equal(youtubeEmbedUrl('https://example.com'), null)
    assert.equal(youtubeEmbedUrl('../malicious'), null)
    assert.equal(youtubeEmbedUrl(null), null)
})

test('missing or invalid presentation values do not produce misleading data', () => {
    assert.equal(formatReleaseDate(null), 'Data não informada')
    assert.equal(formatReleaseDate('invalid'), 'Data não informada')
    assert.equal(reviewPercentage(null), null)
    assert.equal(reviewPercentage(Number.NaN), null)
    assert.equal(reviewPercentage(117), 100)
    assert.equal(reviewPercentage(-10), 0)
})
