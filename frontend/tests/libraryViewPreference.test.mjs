import assert from 'node:assert/strict'
import test from 'node:test'
import {
    LIBRARY_VIEW_STORAGE_KEY,
    readLibraryViewMode,
    saveLibraryViewMode,
} from '../src/components/libraryViewPreference.ts'

test('library view defaults to hybrid for missing, invalid and unavailable storage', () => {
    const previousWindow = globalThis.window
    try {
        delete globalThis.window
        assert.equal(readLibraryViewMode(), 'hybrid')
        globalThis.window = { localStorage: { getItem: () => 'unexpected' } }
        assert.equal(readLibraryViewMode(), 'hybrid')
        globalThis.window = Object.defineProperty({}, 'localStorage', { get: () => { throw new Error('blocked') } })
        assert.equal(readLibraryViewMode(), 'hybrid')
        assert.doesNotThrow(() => saveLibraryViewMode('covers'))
    } finally {
        globalThis.window = previousWindow
    }
})

test('library view stores only the versioned visual preference', () => {
    const previousWindow = globalThis.window
    const entries = new Map()
    try {
        globalThis.window = {
            localStorage: {
                getItem: (key) => entries.get(key) ?? null,
                setItem: (key, value) => entries.set(key, value),
            },
        }
        saveLibraryViewMode('covers')
        assert.deepEqual([...entries], [[LIBRARY_VIEW_STORAGE_KEY, 'covers']])
        assert.equal(readLibraryViewMode(), 'covers')
    } finally {
        globalThis.window = previousWindow
    }
})
