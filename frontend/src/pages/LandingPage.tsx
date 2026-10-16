import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MotionConfig, motion, useReducedMotion } from 'motion/react'

import ProductTour from '../components/ProductTour'
import '../styles/landing.css'
import '../styles/product-tour.css'

const features = [
    {
        number: '01',
        title: 'Sua biblioteca, suas regras.',
        description:
            'Organize jogos por progresso, avaliações e tempo jogado. Tudo em um só lugar.',
    },
    {
        number: '02',
        title: 'Conheça cada jogo.',
        description:
            'Explore descrições, trailers, capturas de tela e a recepção dos jogadores.',
    },
    {
        number: '03',
        title: 'Compartilhe sua jornada.',
        description:
            'Registre suas opiniões e acompanhe as análises da comunidade.',
    },
]

function LandingPage() {
    const reducedMotion = useReducedMotion()
    const [paused, setPaused] = useState(false)
    const motionDisabled = Boolean(reducedMotion || paused)

    const initialAnimation = motionDisabled ? false : { opacity: 0, y: 24 }

    return (
        <MotionConfig
            reducedMotion={motionDisabled ? 'always' : 'user'}
            transition={{ duration: motionDisabled ? 0 : 0.5 }}
        >
            <div className="landing" data-motion-paused={motionDisabled}>
                <a href="#conteudo" className="landing__skip-link">
                    Pular para o conteúdo
                </a>
                <header className="landing__header">
                    <div className="landing__container landing__header-inner">
                        <Link
                            to="/"
                            className="landing__brand"
                            aria-label="Questlog, página inicial"
                        >
                            <span className="landing__logo">Q</span>
                            <span>Questlog</span>
                        </Link>

                        <nav
                            className="landing__navigation"
                            aria-label="Navegação pública"
                        >
                            <a href="#recursos">Recursos</a>
                            <button
                                type="button"
                                className="landing__motion-toggle"
                                aria-pressed={paused}
                                aria-label={
                                    reducedMotion
                                        ? 'Movimento reduzido pelo sistema'
                                        : paused
                                          ? 'Retomar animações'
                                          : 'Pausar animações'
                                }
                                disabled={Boolean(reducedMotion)}
                                onClick={() => setPaused((value) => !value)}
                            >
                                <span aria-hidden="true">
                                    {motionDisabled ? '▷' : 'Ⅱ'}
                                </span>
                                <span>
                                    {motionDisabled
                                        ? 'Sem movimento'
                                        : 'Pausar animação'}
                                </span>
                            </button>

                            <Link to="/login" className="landing__header-login">
                                Entrar
                            </Link>
                        </nav>
                    </div>
                </header>

                <main id="conteudo">
                    <div className="landing__ambient" aria-hidden="true">
                        <span />
                        <span />
                        <div />
                    </div>
                    <section className="landing__hero landing__container">
                        <motion.div
                            className="landing__hero-content"
                            initial={initialAnimation}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="landing__eyebrow">
                                SUA PRÓXIMA AVENTURA COMEÇA AQUI
                            </span>

                            <motion.h1
                                initial={initialAnimation}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: motionDisabled ? 0 : 0.7,
                                    delay: 0.12,
                                }}
                            >
                                Todo jogo tem uma história.
                                <span> A sua merece ser lembrada.</span>
                            </motion.h1>

                            <motion.p
                                className="landing__description"
                                initial={initialAnimation}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: motionDisabled ? 0 : 0.6,
                                    delay: 0.24,
                                }}
                            >
                                Descubra jogos, organize sua biblioteca,
                                acompanhe seu progresso e compartilhe suas
                                experiências em um só lugar.
                            </motion.p>

                            <motion.div
                                className="landing__actions"
                                initial={initialAnimation}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: motionDisabled ? 0 : 0.6,
                                    delay: 0.36,
                                }}
                            >
                                <Link
                                    to="/login"
                                    className="landing__button landing__button--primary"
                                >
                                    Entrar no Questlog
                                    <span aria-hidden="true">↗</span>
                                </Link>

                                <a
                                    href="#recursos"
                                    className="landing__button landing__button--secondary"
                                >
                                    Conhecer recursos
                                </a>
                            </motion.div>

                            <p className="landing__hero-note">
                                Um espaço para quem gosta de jogar e guardar
                                cada conquista.
                            </p>
                        </motion.div>

                        <ProductTour
                            reducedMotion={Boolean(reducedMotion)}
                            paused={paused}
                            onResume={() => setPaused(false)}
                        />
                    </section>

                    <div
                        className="landing__journey-strip landing__container"
                        aria-hidden="true"
                    >
                        <span>TODO JOGO É UM NOVO CAPÍTULO</span>
                        <div>
                            <span>Descubra</span>
                            <i />
                            <span>Jogue</span>
                            <i />
                            <span>Registre</span>
                            <i />
                            <span>Repita ↗</span>
                        </div>
                    </div>

                    <section
                        id="recursos"
                        className="landing__features"
                        aria-labelledby="landing-features-heading"
                    >
                        <div className="landing__container">
                            <motion.div
                                className="landing__section-heading"
                                initial={initialAnimation}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ duration: 0.5 }}
                            >
                                <span className="landing__eyebrow">
                                    FEITO PARA JOGADORES
                                </span>

                                <h2 id="landing-features-heading">
                                    Menos organização manual. Mais tempo
                                    jogando.
                                </h2>

                                <p>
                                    Um lugar para acompanhar sua jornada sem
                                    perder de vista o que importa.
                                </p>
                            </motion.div>

                            <div className="landing__feature-grid">
                                {features.map((feature, index) => (
                                    <motion.article
                                        key={feature.number}
                                        className="landing__feature-card"
                                        initial={initialAnimation}
                                        whileInView={{
                                            opacity: 1,
                                            y: 0,
                                        }}
                                        viewport={{
                                            once: true,
                                            amount: 0.2,
                                        }}
                                        transition={{
                                            duration: 0.45,
                                            delay: motionDisabled
                                                ? 0
                                                : index * 0.1,
                                        }}
                                        whileHover={
                                            motionDisabled
                                                ? undefined
                                                : { y: -5 }
                                        }
                                    >
                                        <span className="landing__feature-number">
                                            {feature.number}
                                        </span>

                                        <div
                                            className={`landing__feature-visual landing__feature-visual--${index + 1}`}
                                            aria-hidden="true"
                                        >
                                            <span />
                                            <span />
                                            <span />
                                            <i>{['✓', '⌕', '✦'][index]}</i>
                                        </div>
                                        <h3>{feature.title}</h3>
                                        <p>{feature.description}</p>
                                    </motion.article>
                                ))}
                            </div>
                        </div>
                    </section>

                    <motion.section
                        className="landing__closing landing__container"
                        initial={initialAnimation}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                    >
                        <div
                            className="landing__closing-emblem"
                            aria-hidden="true"
                        >
                            <span>Q</span>
                        </div>
                        <span className="landing__eyebrow">
                            O PRÓXIMO CAPÍTULO
                        </span>
                        <h2>Pronto para continuar sua jornada?</h2>

                        <p>Seu próximo jogo favorito pode estar esperando.</p>

                        <Link
                            to="/login"
                            className="landing__button landing__button--primary"
                        >
                            Acessar Questlog
                            <span aria-hidden="true">→</span>
                        </Link>
                    </motion.section>
                </main>

                <footer className="landing__footer">
                    <div className="landing__container">
                        <span>Questlog</span>
                        <span>Sua jornada pelos jogos.</span>
                    </div>
                </footer>
            </div>
        </MotionConfig>
    )
}

export default LandingPage
