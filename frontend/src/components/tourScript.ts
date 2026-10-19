// Local presentation state only. No API client, session or persistence is used by the tour.
export type TourScene = 'discover' | 'add' | 'track'
export type TourScreen = 'search' | 'detail' | 'library'
export type TourTarget = 'search' | 'result' | 'add' | 'game' | 'status'

export interface TourStep {
    scene: TourScene
    screen: TourScreen
    target: TourTarget
    duration: number
    query?: string
    click?: boolean
    results?: boolean
    added?: boolean
    selected?: boolean
    statusOpen?: boolean
    playing?: boolean
}

const search = (query = '', extra: Partial<TourStep> = {}): TourStep => ({
    scene: 'discover',
    screen: 'search',
    target: 'search',
    duration: 650,
    query,
    ...extra,
})

export const tourSteps: readonly TourStep[] = [
    search(),
    search('', { click: true, duration: 330 }),
    ...Array.from({ length: 'Elden Ring'.length }, (_, index) =>
        search('Elden Ring'.slice(0, index + 1), {
            duration: index === 5 ? 260 : 145,
        }),
    ),
    search('Elden Ring', { results: true, target: 'result', duration: 850 }),
    search('Elden Ring', {
        results: true,
        target: 'result',
        click: true,
        duration: 420,
    }),
    { scene: 'add', screen: 'detail', target: 'add', duration: 1000 },
    {
        scene: 'add',
        screen: 'detail',
        target: 'add',
        click: true,
        duration: 400,
    },
    {
        scene: 'add',
        screen: 'detail',
        target: 'add',
        added: true,
        duration: 1250,
    },
    {
        scene: 'track',
        screen: 'library',
        target: 'game',
        added: true,
        duration: 750,
    },
    {
        scene: 'track',
        screen: 'library',
        target: 'game',
        added: true,
        selected: true,
        click: true,
        duration: 650,
    },
    {
        scene: 'track',
        screen: 'library',
        target: 'status',
        added: true,
        selected: true,
        duration: 750,
    },
    {
        scene: 'track',
        screen: 'library',
        target: 'status',
        added: true,
        selected: true,
        statusOpen: true,
        click: true,
        duration: 750,
    },
    {
        scene: 'track',
        screen: 'library',
        target: 'status',
        added: true,
        selected: true,
        playing: true,
        duration: 1700,
    },
]

export const scenes: readonly {
    id: TourScene
    label: string
    title: string
    description: string
}[] = [
    {
        id: 'discover',
        label: 'Descobrir',
        title: 'Encontre a próxima aventura',
        description: 'Uma pesquisa leva você até o jogo.',
    },
    {
        id: 'add',
        label: 'Adicionar',
        title: 'Guarde o que chamou atenção',
        description: 'O jogo entra na biblioteca em um clique.',
    },
    {
        id: 'track',
        label: 'Acompanhar',
        title: 'Sua jornada começa aqui',
        description: 'Mude o estado do jogo para Jogando.',
    },
]

export function sceneSnapshot(scene: TourScene): number {
    if (scene === 'discover')
        return tourSteps.findIndex((step) => step.results && !step.click)
    if (scene === 'add')
        return tourSteps.findIndex((step) => step.scene === 'add' && step.added)
    return tourSteps.length - 1
}

export function nextStep(index: number): number | null {
    return index < tourSteps.length - 1 ? index + 1 : null
}

export interface TourState {
    index: number
    playing: boolean
    reducedMotion: boolean
}
export type TourAction =
    | { type: 'tick' | 'play' | 'pause' | 'restart' }
    | { type: 'scene'; scene: TourScene }
    | { type: 'motion'; reducedMotion: boolean }

export function initialTourState(reducedMotion: boolean): TourState {
    return {
        index: reducedMotion ? sceneSnapshot('discover') : 0,
        playing: !reducedMotion,
        reducedMotion,
    }
}

export function tourReducer(state: TourState, action: TourAction): TourState {
    switch (action.type) {
        case 'tick': {
            if (!state.playing || state.reducedMotion) return state
            const next = nextStep(state.index)
            return next === null
                ? { ...state, playing: false }
                : { ...state, index: next }
        }
        case 'pause':
            return { ...state, playing: false }
        case 'play': {
            if (state.reducedMotion) {
                const current = scenes.findIndex(
                    (scene) => scene.id === tourSteps[state.index].scene,
                )
                return {
                    ...state,
                    index: sceneSnapshot(
                        scenes[(current + 1) % scenes.length].id,
                    ),
                    playing: false,
                }
            }
            return {
                ...state,
                index: nextStep(state.index) === null ? 0 : state.index,
                playing: true,
            }
        }
        case 'restart':
            return initialTourState(state.reducedMotion)
        case 'scene':
            return {
                ...state,
                index: sceneSnapshot(action.scene),
                playing: false,
            }
        case 'motion':
            return action.reducedMotion
                ? {
                      index: sceneSnapshot(tourSteps[state.index].scene),
                      playing: false,
                      reducedMotion: true,
                  }
                : { ...state, reducedMotion: false }
    }
}
