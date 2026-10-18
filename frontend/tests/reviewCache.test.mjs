import test from 'node:test'
import assert from 'node:assert/strict'

import { removeReview, syncReviewRating, upsertReview } from '../src/components/reviewCache.ts'

const own = { id: 1, libraryEntryId: 7, gameId: 42, rating: 4, content: 'old' }
const other = { id: 2, libraryEntryId: 8, gameId: 42, rating: 8, content: 'other' }

test('upsert immediately reconciles create and edit without duplicate cards', () => {
    assert.deepEqual(upsertReview([other], own), [own, other])
    assert.deepEqual(upsertReview([other, own, own], { ...own, content: 'new' }),
        [other, { ...own, content: 'new' }])
    assert.deepEqual(upsertReview(undefined, own), [own])
})

test('confirmed deletion and library rating changes touch only the matching entry', () => {
    assert.deepEqual(removeReview([own, other], 7), [other])
    assert.deepEqual(syncReviewRating([own, other], 7, 9), [{ ...own, rating: 9 }, other])
    assert.equal(removeReview(undefined, 7), undefined)
})
