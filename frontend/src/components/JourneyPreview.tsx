import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'motion/react'

const chapters = [
    {
        label: 'Descubra',
        title: 'Uma nova aventura.',
        subtitle: 'Seu próximo favorito começa com uma descoberta.',
        status: 'Na lista',
        tone: 'backlog',
        progress: 0,
        hours: '0 h',
        message: 'Adicionado à sua lista',
        detail: 'Toda jornada começa com uma escolha.',
    },
    {
        label: 'Jogue',
        title: 'Cada hora conta.',
        subtitle: 'Acompanhe os jogos que fazem parte da sua história.',
        status: 'Jogando',
        tone: 'playing',
        progress: 64,
        hours: '42 h',
        message: 'Sua jornada em movimento',
        detail: 'Guarde o progresso. Aproveite a aventura.',
    },
    {
        label: 'Registre',
        title: 'Uma história para guardar.',
        subtitle: 'Conclua, avalie e encontre sua próxima aventura.',
        status: 'Concluído',
        tone: 'completed',
        progress: 100,
        hours: '68 h',
        message: 'Mais uma história concluída',
        detail: 'O jogo termina. A experiência fica.',
    },
]

const games = [
    { name: 'Elden Ring', genre: 'RPG de ação', initials: 'ER', art: 'gold' },
    {
        name: 'Hollow Knight',
        genre: 'Metroidvania',
        initials: 'HK',
        art: 'blue',
    },
    { name: 'Hades', genre: 'Roguelike', initials: 'H', art: 'red' },
]

interface JourneyPreviewProps {
    motionDisabled: boolean
}

export default function JourneyPreview({
    motionDisabled,
}: JourneyPreviewProps) {
    const [chapter, setChapter] = useState(0)
    const [hovered, setHovered] = useState(false)
    const [focused, setFocused] = useState(false)
    const [pageVisible, setPageVisible] = useState(() => !document.hidden)
    const sceneRef = useRef<HTMLDivElement>(null)
    const inView = useInView(sceneRef, { amount: 0.25 })
    const running =
        !motionDisabled && !hovered && !focused && pageVisible && inView
    const current = chapters[chapter]

    useEffect(() => {
        const onVisibilityChange = () => setPageVisible(!document.hidden)
        document.addEventListener('visibilitychange', onVisibilityChange)
        return () =>
            document.removeEventListener('visibilitychange', onVisibilityChange)
    }, [])

    useEffect(() => {
        if (!running) return
        const timer = window.setTimeout(
            () => setChapter((value) => (value + 1) % chapters.length),
            6000,
        )
        return () => window.clearTimeout(timer)
    }, [chapter, running])

    return (
        <motion.div
            ref={sceneRef}
            className="journey"
            data-running={running}
            initial={motionDisabled ? false : { opacity: 0, y: 32, rotate: 2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{
                duration: motionDisabled ? 0 : 0.8,
                delay: 0.2,
                ease: [0.22, 1, 0.36, 1],
            }}
        >
            <div
                className="journey__orbit journey__orbit--one"
                aria-hidden="true"
            />
            <div
                className="journey__orbit journey__orbit--two"
                aria-hidden="true"
            />
            <span
                className="journey__spark journey__spark--one"
                aria-hidden="true"
            >
                ✦
            </span>
            <span
                className="journey__spark journey__spark--two"
                aria-hidden="true"
            >
                +
            </span>

            <div className="journey__scene-label">
                <span>
                    <i /> SUA JORNADA, EM MOVIMENTO
                </span>
                <span>0{chapter + 1} / 03</span>
            </div>

            <div className="landing__preview journey__window">
                <div className="landing__preview-top">
                    <div className="landing__window-dots" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                    </div>
                    <span>QUESTLOG / MINHA BIBLIOTECA</span>
                    <span aria-hidden="true">↗</span>
                </div>

                <div className="landing__preview-body">
                    <div className="landing__preview-heading">
                        <div>
                            <span>UM JOGO. MUITAS HISTÓRIAS.</span>
                            <h2>Sua biblioteca</h2>
                        </div>
                        <span
                            className="landing__preview-icon"
                            aria-hidden="true"
                        >
                            Q
                        </span>
                    </div>

                    <div
                        className={`journey__art journey__art--${current.tone}`}
                        aria-hidden="true"
                    >
                        <div className="journey__art-grid" />
                        <div className="journey__moon" />
                        <div className="journey__halo" />
                        <div className="journey__mountain journey__mountain--back" />
                        <div className="journey__mountain journey__mountain--front" />
                        <div className="journey__portal">
                            <span />
                        </div>
                        <div className="journey__art-caption">
                            <span>O PRÓXIMO CAPÍTULO É SEU</span>
                            <strong>Explore. Viva. Lembre.</strong>
                        </div>
                        <span className="journey__art-coordinate">
                            QL — 001
                        </span>
                    </div>

                    <div className="landing__preview-stats">
                        <div>
                            <strong>03</strong>
                            <span>Na biblioteca</span>
                        </div>
                        <div>
                            <strong>{chapter === 1 ? '01' : '00'}</strong>
                            <span>Jogando</span>
                        </div>
                        <div>
                            <strong>{chapter === 2 ? '02' : '01'}</strong>
                            <span>Concluídos</span>
                        </div>
                    </div>

                    <div className="landing__preview-list">
                        {games.map((game, index) => (
                            <div
                                key={game.name}
                                className={`landing__preview-game ${index === 0 ? 'journey__game--active' : ''}`}
                            >
                                <span
                                    className={`landing__game-cover journey__cover--${game.art}`}
                                    aria-hidden="true"
                                >
                                    {game.initials}
                                </span>
                                <div className="landing__game-info">
                                    <strong>{game.name}</strong>
                                    <span>{game.genre}</span>
                                </div>
                                <span
                                    className={`landing__status landing__status--${index === 0 ? current.tone : index === 1 ? 'completed' : 'backlog'}`}
                                >
                                    {index === 0
                                        ? current.status
                                        : index === 1
                                          ? 'Concluído'
                                          : 'Na lista'}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="journey__progress-heading">
                        <span>Tempo registrado · Elden Ring</span>
                        <strong>{current.hours}</strong>
                    </div>
                    <div className="journey__progress" aria-hidden="true">
                        <motion.span
                            animate={{ width: `${current.progress}%` }}
                            transition={{
                                duration: motionDisabled ? 0 : 0.9,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                        />
                    </div>
                </div>
                <div className="landing__preview-footer">
                    Demonstração ilustrativa · dados fictícios
                </div>
            </div>

            <div className="journey__notification" aria-hidden="true">
                <span
                    className={`journey__notification-icon journey__notification-icon--${current.tone}`}
                >
                    {chapter === 2 ? '✓' : chapter === 1 ? '▷' : '+'}
                </span>
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={chapter}
                        initial={{
                            opacity: motionDisabled ? 1 : 0,
                            y: motionDisabled ? 0 : 6,
                        }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{
                            opacity: motionDisabled ? 1 : 0,
                            y: motionDisabled ? 0 : -6,
                        }}
                        transition={{ duration: motionDisabled ? 0 : 0.18 }}
                    >
                        <strong>{current.message}</strong>
                        <span>{current.detail}</span>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div
                className="journey__chapters"
                role="group"
                aria-label="Etapas da demonstração"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onFocus={() => setFocused(true)}
                onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget))
                        setFocused(false)
                }}
            >
                {chapters.map((item, index) => (
                    <button
                        key={item.label}
                        type="button"
                        aria-pressed={chapter === index}
                        aria-controls="journey-caption"
                        onClick={() => setChapter(index)}
                    >
                        <span className="journey__chapter-number">
                            0{index + 1}
                        </span>
                        {item.label}
                        {chapter === index && (
                            <span
                                key={`${chapter}-${running}`}
                                className="journey__chapter-timer"
                                aria-hidden="true"
                            />
                        )}
                    </button>
                ))}
            </div>
            <div id="journey-caption" className="journey__caption">
                <strong>{current.title}</strong>
                <p>{current.subtitle}</p>
            </div>
        </motion.div>
    )
}
