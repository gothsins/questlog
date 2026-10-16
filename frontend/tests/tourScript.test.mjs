import test from 'node:test'
import assert from 'node:assert/strict'

import {
    initialTourState,
    scenes,
    sceneSnapshot,
    tourReducer,
    tourSteps,
} from '../src/components/tourScript.ts'

test('the scripted journey has typed search, an add confirmation and a playing update in order', () => {
    const queries = tourSteps
        .filter((step) => step.query)
        .map((step) => step.query)
    assert.equal(queries.at(-1), 'Elden Ring')
    assert.ok(queries.some((query) => query === 'Elden'))
    assert.deepEqual(
        [...new Set(tourSteps.map((step) => step.scene))],
        scenes.map((scene) => scene.id),
    )
    assert.ok(
        tourSteps.findIndex((step) => step.added) <
            tourSteps.findIndex((step) => step.playing),
    )
    assert.equal(tourSteps.at(-1).playing, true)
})

test('play, pause, restart and scene selection control the timeline', () => {
    let state = initialTourState(false)
    state = tourReducer(state, { type: 'tick' })
    assert.equal(state.index, 1)
    state = tourReducer(state, { type: 'pause' })
    assert.deepEqual(tourReducer(state, { type: 'tick' }), state)
    state = tourReducer(state, { type: 'scene', scene: 'add' })
    assert.equal(state.index, sceneSnapshot('add'))
    assert.equal(state.playing, false)
    state = tourReducer(state, { type: 'play' })
    assert.equal(state.playing, true)
    state = tourReducer(state, { type: 'restart' })
    assert.deepEqual(state, initialTourState(false))
    for (let i = 0; i < tourSteps.length; i++)
        state = tourReducer(state, { type: 'tick' })
    assert.equal(state.index, tourSteps.length - 1)
    assert.equal(state.playing, false)
})

test('reduced motion offers stable scenes with manual navigation', () => {
    let state = initialTourState(true)
    assert.equal(state.index, sceneSnapshot('discover'))
    assert.equal(state.playing, false)
    state = tourReducer(state, { type: 'play' })
    assert.equal(state.index, sceneSnapshot('add'))
    state = tourReducer(state, { type: 'play' })
    assert.equal(state.index, sceneSnapshot('track'))
    assert.deepEqual(tourReducer(state, { type: 'tick' }), state)
    state = tourReducer(state, { type: 'restart' })
    assert.equal(state.index, sceneSnapshot('discover'))
    assert.equal(state.playing, false)
})
