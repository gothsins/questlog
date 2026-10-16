import { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'motion/react'

import { initialTourState, scenes, tourReducer, tourSteps } from './tourScript'
import type { TourStep } from './tourScript'

interface ProductTourProps {
    reducedMotion: boolean
    paused: boolean
    onResume: () => void
}

const demoGame = {
    title: 'Elden Ring',
    genre: 'RPG de ação',
    year: '2022',
    developer: 'FromSoftware',
} as const

function DemoCursor({
    position,
    click,
}: {
    position: { x: number; y: number } | null
    click?: boolean
}) {
    return (
        <motion.div
            className="tour__cursor"
            aria-hidden="true"
            initial={false}
            animate={{
                x: position?.x ?? 0,
                y: position?.y ?? 0,
                opacity: position ? 1 : 0,
            }}
            transition={{
                x: { duration: 0.48, ease: [0.22, 1, 0.36, 1] },
                y: { duration: 0.48, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: 0.15 },
            }}
        >
            <svg viewBox="0 0 28 32" focusable="false">
                <path d="M3 2v24l6.4-6.1 4.2 9 4.2-2-4.2-8.8H24L3 2Z" />
            </svg>
            {click && (
                <span
                    key={`${position?.x}-${position?.y}`}
                    className="tour__cursor-ripple"
                />
            )}
        </motion.div>
    )
}

function DemoCover({ large = false }: { large?: boolean }) {
    return (
        <div
            className={`tour__cover ${large ? 'tour__cover--large' : ''}`}
            aria-hidden="true"
        >
            <span className="tour__cover-ring" />
            <span className="tour__cover-land" />
            <strong>
                ELDEN
                <br />
                RING
            </strong>
        </div>
    )
}

function DemoSearch({ step }: { step: TourStep }) {
    const searching = Boolean(step.query && !step.results)
    return (
        <div className="tour__screen-content">
            <p className="tour__eyebrow">EXPLORAR JOGOS</p>
            <h3>O que vamos jogar?</h3>
            <p className="tour__muted">
                Descubra jogos para sua próxima jornada.
            </p>
            <div
                className={`tour__search ${step.target === 'search' && step.click ? 'tour__highlight' : ''}`}
                data-tour-target="search"
            >
                <span aria-hidden="true">⌕</span>
                <span>
                    {step.query || 'Buscar um jogo'}
                    {step.query && !step.results && (
                        <i className="tour__caret" />
                    )}
                </span>
                <span className="tour__shortcut">↵</span>
            </div>
            <div className="tour__results-heading">
                <span>
                    {step.results
                        ? 'RESULTADOS PARA “ELDEN RING”'
                        : searching
                          ? 'PESQUISANDO...'
                          : 'EM DESTAQUE'}
                </span>
                <span>{step.results ? '01 RESULTADO' : ''}</span>
            </div>
            {step.results ? (
                <div
                    className={`tour__result ${step.target === 'result' ? 'tour__highlight' : ''}`}
                    data-tour-target="result"
                >
                    <DemoCover />
                    <div>
                        <strong>{demoGame.title}</strong>
                        <span>
                            {demoGame.genre} · {demoGame.year}
                        </span>
                    </div>
                    <b aria-hidden="true">↗</b>
                </div>
            ) : searching ? (
                <div className="tour__searching">
                    <i />
                    <span>Encontrando jogos...</span>
                </div>
            ) : (
                <div className="tour__result">
                    <span className="tour__mini-cover tour__mini-cover--blue">
                        HK
                    </span>
                    <div>
                        <strong>Hollow Knight</strong>
                        <span>Metroidvania · 2017</span>
                    </div>
                </div>
            )}
            {!searching && (
                <div className="tour__result tour__result--muted">
                    <span className="tour__mini-cover tour__mini-cover--red">
                        H
                    </span>
                    <div>
                        <strong>Hades</strong>
                        <span>Roguelike · 2020</span>
                    </div>
                </div>
            )}
        </div>
    )
}

function DemoGameCard({ step }: { step: TourStep }) {
    return (
        <div className="tour__screen-content">
            <p className="tour__eyebrow">EXPLORAR / DETALHES DO JOGO</p>
            <div className="tour__detail">
                <DemoCover large />
                <div className="tour__detail-copy">
                    <span className="tour__pill">RPG DE AÇÃO</span>
                    <h3>{demoGame.title}</h3>
                    <p>
                        {demoGame.developer} · {demoGame.year}
                    </p>
                    <p>Um mundo vasto para descobrir no seu tempo.</p>
                    <div
                        className={`tour__add ${step.click ? 'tour__highlight' : ''} ${step.added ? 'tour__add--done' : ''}`}
                        data-tour-target="add"
                    >
                        {step.added
                            ? '✓ Na biblioteca'
                            : '+ Adicionar à biblioteca'}
                    </div>
                </div>
            </div>
            {step.added && (
                <div className="tour__notice">
                    <span>✓</span>
                    <div>
                        <strong>Adicionado à biblioteca</strong>
                        <small>Pronto para acompanhar sua jornada.</small>
                    </div>
                </div>
            )}
            <div className="tour__detail-meta">
                <span>
                    GÊNERO <b>RPG de ação</b>
                </span>
                <span>
                    LANÇAMENTO <b>2022</b>
                </span>
            </div>
        </div>
    )
}

function DemoLibrary({ step }: { step: TourStep }) {
    return (
        <div className="tour__screen-content">
            <p className="tour__eyebrow">MINHA BIBLIOTECA</p>
            <h3>Seus jogos, sua história.</h3>
            <p className="tour__muted">Acompanhe tudo em um só lugar.</p>
            <div className="tour__library-stats">
                <div>
                    <strong>01</strong>
                    <span>Na biblioteca</span>
                </div>
                <div>
                    <strong>{step.playing ? '01' : '00'}</strong>
                    <span>Jogando</span>
                </div>
            </div>
            <div
                className={`tour__library-game ${step.selected ? 'tour__library-game--selected' : ''}`}
                data-tour-target="game"
            >
                <DemoCover />
                <div>
                    <strong>{demoGame.title}</strong>
                    <span>{demoGame.genre}</span>
                </div>
                <span
                    className={`tour__status ${step.playing ? 'tour__status--playing' : ''}`}
                >
                    {step.playing ? 'Jogando' : 'Backlog'}
                </span>
            </div>
            {step.selected && (
                <div className="tour__library-detail">
                    <div>
                        <span>ELDEN RING / SUA JORNADA</span>
                        <strong>Estado do jogo</strong>
                    </div>
                    <div
                        className="tour__status-field"
                        data-tour-target="status"
                    >
                        <span>{step.playing ? 'Jogando' : 'Backlog'}</span>
                        <b>⌄</b>
                    </div>
                    {step.statusOpen && (
                        <div className="tour__status-menu">
                            <span>Backlog</span>
                            <strong>
                                Jogando <span>✓</span>
                            </strong>
                        </div>
                    )}
                </div>
            )}
            {step.playing && (
                <div className="tour__notice tour__notice--playing">
                    <span>↗</span>
                    <div>
                        <strong>Agora você está jogando</strong>
                        <small>A jornada de Elden Ring começou.</small>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function ProductTour({
    reducedMotion,
    paused,
    onResume,
}: ProductTourProps) {
    const [{ index, playing }, dispatch] = useReducer(
        tourReducer,
        reducedMotion,
        initialTourState,
    )
    const [pageVisible, setPageVisible] = useState(() => !document.hidden)
    const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
    const tourRef = useRef<HTMLDivElement>(null)
    const windowRef = useRef<HTMLDivElement>(null)
    const inView = useInView(tourRef, { amount: 0.2 })
    const step = tourSteps[index]
    const scene = scenes.find((item) => item.id === step.scene) ?? scenes[0]
    const running =
        playing && !paused && inView && pageVisible && !reducedMotion

    useEffect(() => {
        const onVisibility = () => setPageVisible(!document.hidden)
        document.addEventListener('visibilitychange', onVisibility)
        return () =>
            document.removeEventListener('visibilitychange', onVisibility)
    }, [])

    useEffect(() => {
        if (!running) return
        const timer = window.setTimeout(
            () => dispatch({ type: 'tick' }),
            step.duration,
        )
        return () => window.clearTimeout(timer)
    }, [index, running, step.duration])

    useEffect(() => {
        dispatch({ type: 'motion', reducedMotion })
    }, [reducedMotion])

    useLayoutEffect(() => {
        if (reducedMotion) return
        const update = () => {
            const panel = windowRef.current
            const target = panel?.querySelector(
                `[data-tour-target="${step.target}"]`,
            )
            if (!panel || !target) return
            const bounds = panel.getBoundingClientRect()
            const rect = target.getBoundingClientRect()
            setCursor({
                x: rect.left - bounds.left + Math.min(42, rect.width * 0.4),
                y: rect.top - bounds.top + rect.height * 0.55,
            })
        }
        const frame = requestAnimationFrame(update)
        // AnimatePresence swaps screens after its exit transition; measure the new target then.
        const afterScreenChange = window.setTimeout(update, 320)
        const observer = new ResizeObserver(update)
        if (windowRef.current) observer.observe(windowRef.current)
        window.addEventListener('resize', update)
        return () => {
            cancelAnimationFrame(frame)
            window.clearTimeout(afterScreenChange)
            observer.disconnect()
            window.removeEventListener('resize', update)
        }
    }, [index, reducedMotion, step.target, step.screen])

    const togglePlayback = () => {
        if (playing && !paused) dispatch({ type: 'pause' })
        else {
            onResume()
            dispatch({ type: 'play' })
        }
    }
    const restart = () => {
        onResume()
        dispatch({ type: 'restart' })
    }
    const visiblyPlaying = playing && !paused

    return (
        <div className="tour" ref={tourRef} data-running={running}>
            <div className="tour__topline">
                <span>
                    <i /> DEMONSTRAÇÃO DO PRODUTO
                </span>
                <span>0{scenes.indexOf(scene) + 1} / 03</span>
            </div>
            <div
                className="tour__window"
                ref={windowRef}
                aria-label={`Demonstração visual: ${scene.title}`}
            >
                <div className="tour__chrome">
                    <span className="tour__dots" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                    </span>
                    <span>
                        QUESTLOG /{' '}
                        {step.screen === 'search'
                            ? 'EXPLORAR'
                            : step.screen === 'detail'
                              ? 'JOGO'
                              : 'BIBLIOTECA'}
                    </span>
                    <span className="tour__chrome-logo">Q</span>
                </div>
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={step.screen}
                        className="tour__screen"
                        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                        transition={{ duration: reducedMotion ? 0 : 0.24 }}
                        aria-hidden="true"
                    >
                        {step.screen === 'search' && <DemoSearch step={step} />}
                        {step.screen === 'detail' && (
                            <DemoGameCard step={step} />
                        )}
                        {step.screen === 'library' && (
                            <DemoLibrary step={step} />
                        )}
                    </motion.div>
                </AnimatePresence>
                {!reducedMotion && (
                    <DemoCursor
                        position={cursor}
                        click={running && step.click}
                    />
                )}
                <div className="tour__footnote">
                    SIMULAÇÃO VISUAL · DADOS ILUSTRATIVOS
                </div>
            </div>
            <div
                className="tour__controls"
                aria-label="Controles da demonstração"
            >
                <div
                    className="tour__scene-buttons"
                    role="group"
                    aria-label="Escolher cena"
                >
                    {scenes.map((item, position) => (
                        <button
                            key={item.id}
                            type="button"
                            aria-pressed={step.scene === item.id}
                            onClick={() =>
                                dispatch({ type: 'scene', scene: item.id })
                            }
                        >
                            <span>0{position + 1}</span>
                            {item.label}
                        </button>
                    ))}
                </div>
                <div className="tour__play-buttons">
                    <button
                        type="button"
                        onClick={togglePlayback}
                        aria-label={
                            visiblyPlaying
                                ? 'Pausar demonstração'
                                : reducedMotion
                                  ? 'Próxima cena'
                                  : 'Reproduzir demonstração'
                        }
                    >
                        {visiblyPlaying
                            ? 'Ⅱ Pausar'
                            : reducedMotion
                              ? '▷ Próxima'
                              : '▷ Reproduzir'}
                    </button>
                    <button
                        type="button"
                        onClick={restart}
                        aria-label="Reiniciar demonstração"
                    >
                        ↺ Reiniciar
                    </button>
                </div>
            </div>
            <div
                className="tour__caption"
                aria-live="polite"
                aria-atomic="true"
            >
                <strong>{scene.title}</strong>
                <p>
                    {step.playing
                        ? 'Elden Ring agora está marcado como Jogando.'
                        : step.added && step.scene === 'add'
                          ? 'Elden Ring foi adicionado à biblioteca.'
                          : scene.description}
                </p>
            </div>
        </div>
    )
}
