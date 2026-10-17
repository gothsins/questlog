import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { authenticatedFetch } from '../api/client'
import GameGallery from '../components/GameGallery'
import {
    formatReleaseDate,
    youtubeEmbedUrl,
} from '../components/gameDetailsPresentation'
import SteamReviewsPanel from '../components/SteamReviewsPanel'
import type { SteamReviews } from '../components/SteamReviewsPanel'
import SteamWrittenReviewsPanel from '../components/SteamWrittenReviewsPanel'
import type { SteamWrittenReviews } from '../components/SteamWrittenReviewsPanel'
import '../styles/game-details.css'

interface GameDetails {
    id: number
    title: string
    releaseDate: string | null
    coverUrl: string | null
}

interface GameMedia {
    summary: string | null
    genres: string[]
    screenshots: string[]
    trailerVideoId: string | null
}

function Trailer({ title, url }: { title: string; url: string }) {
    const [playing, setPlaying] = useState(false)

    return (
        <section
            className="game-details__trailer"
            aria-labelledby="game-trailer-heading"
        >
            <div className="game-details__section-heading">
                <div>
                    <span className="game-details__eyebrow">EM MOVIMENTO</span>
                    <h2 id="game-trailer-heading">Trailer</h2>
                </div>
                <span>Vídeo hospedado no YouTube</span>
            </div>
            <div className="game-details__video">
                {playing ? (
                    <iframe
                        src={url}
                        title={`Trailer de ${title}`}
                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => setPlaying(true)}
                        aria-label={`Carregar trailer de ${title} no YouTube`}
                    >
                        <span
                            className="game-details__play-icon"
                            aria-hidden="true"
                        >
                            ▶
                        </span>
                        <strong>Assistir ao trailer</strong>
                        <small>O vídeo será carregado ao reproduzir</small>
                    </button>
                )}
            </div>
        </section>
    )
}

function GameCover({ title, url }: { title: string; url: string | null }) {
    const [failed, setFailed] = useState(false)
    return (
        <div className="game-details__cover">
            {url && !failed ? (
                <img
                    src={url}
                    alt={`Capa de ${title}`}
                    onError={() => setFailed(true)}
                />
            ) : (
                <div
                    className="game-details__placeholder"
                    role="img"
                    aria-label="Capa indisponível"
                >
                    Q
                </div>
            )}
        </div>
    )
}

function GameDetailsPage() {
    const { gameId } = useParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const id = Number(gameId)
    const validId = Number.isSafeInteger(id) && id > 0

    const gameQuery = useQuery<GameDetails>({
        queryKey: ['game-details', id],
        enabled: validId,
        staleTime: 5 * 60 * 1000,
        retry: false,
        queryFn: async ({ signal }) => {
            const response = await authenticatedFetch(`/api/games/${id}`, {
                signal,
            })
            if (response.status === 401 || response.status === 403)
                throw new Error('SESSION_EXPIRED')
            if (response.status === 404) throw new Error('GAME_NOT_FOUND')
            if (!response.ok) throw new Error('GAME_LOAD_FAILED')
            return (await response.json()) as GameDetails
        },
    })

    const mediaQuery = useQuery<GameMedia>({
        queryKey: ['game-media', id],
        enabled: validId && Boolean(gameQuery.data),
        staleTime: 5 * 60 * 1000,
        retry: false,
        queryFn: async ({ signal }) => {
            const response = await authenticatedFetch(
                `/api/games/${id}/media`,
                {
                    signal,
                },
            )
            if (response.status === 401 || response.status === 403)
                throw new Error('SESSION_EXPIRED')
            if (!response.ok) throw new Error('MEDIA_UNAVAILABLE')
            return (await response.json()) as GameMedia
        },
    })

    const steamQuery = useQuery<SteamReviews>({
        queryKey: ['game-steam-reviews', id],
        enabled: validId && Boolean(gameQuery.data),
        staleTime: 10 * 60 * 1000,
        retry: false,
        queryFn: async ({ signal }) => {
            const response = await authenticatedFetch(
                `/api/games/${id}/steam-reviews`,
                { signal },
            )
            if (response.status === 401 || response.status === 403)
                throw new Error('SESSION_EXPIRED')
            if (!response.ok) throw new Error('STEAM_REVIEWS_UNAVAILABLE')
            return (await response.json()) as SteamReviews
        },
    })

    const writtenQuery = useQuery<SteamWrittenReviews>({
        queryKey: ['game-steam-written-reviews', id],
        enabled: validId && Boolean(gameQuery.data),
        staleTime: 5 * 60 * 1000,
        retry: false,
        queryFn: async ({ signal }) => {
            const response = await authenticatedFetch(
                `/api/games/${id}/steam-review-texts`,
                { signal },
            )
            if (response.status === 401 || response.status === 403)
                throw new Error('SESSION_EXPIRED')
            if (!response.ok) throw new Error('WRITTEN_REVIEWS_UNAVAILABLE')
            return (await response.json()) as SteamWrittenReviews
        },
    })

    useEffect(() => {
        const expired = [
            gameQuery.error,
            mediaQuery.error,
            steamQuery.error,
            writtenQuery.error,
        ].some((error) => error?.message === 'SESSION_EXPIRED')
        if (!expired) return
        sessionStorage.removeItem('questlog_token')
        queryClient.clear()
        navigate('/login', { replace: true })
    }, [
        gameQuery.error,
        mediaQuery.error,
        steamQuery.error,
        writtenQuery.error,
        navigate,
        queryClient,
    ])

    if (!validId) {
        return (
            <main className="game-details">
                <div className="game-details__state" role="alert">
                    Jogo inválido.{' '}
                    <Link to="/library">Voltar para biblioteca</Link>
                </div>
            </main>
        )
    }

    if (gameQuery.isPending) {
        return (
            <main className="game-details" aria-busy="true">
                <div className="game-details__skeleton game-details__skeleton--back" />
                <div className="game-details__hero game-details__hero--loading">
                    <div className="game-details__skeleton game-details__skeleton--cover" />
                    <div className="game-details__skeleton-copy">
                        <div className="game-details__skeleton game-details__skeleton--eyebrow" />
                        <div className="game-details__skeleton game-details__skeleton--title" />
                        <div className="game-details__skeleton game-details__skeleton--line" />
                        <div className="game-details__skeleton game-details__skeleton--line" />
                    </div>
                </div>
                <span className="game-details__sr-only" role="status">
                    Carregando jogo...
                </span>
            </main>
        )
    }

    if (gameQuery.error || !gameQuery.data) {
        return (
            <main className="game-details">
                <div className="game-details__state" role="alert">
                    <span className="game-details__eyebrow">
                        QUESTLOG / JOGO
                    </span>
                    <h1>
                        {gameQuery.error?.message === 'GAME_NOT_FOUND'
                            ? 'Jogo não encontrado'
                            : 'Não foi possível carregar o jogo'}
                    </h1>
                    <p>Confira a biblioteca ou tente novamente.</p>
                    <div className="game-details__state-actions">
                        <Link to="/library">Voltar para biblioteca</Link>
                        {gameQuery.error?.message !== 'GAME_NOT_FOUND' && (
                            <button
                                type="button"
                                onClick={() => void gameQuery.refetch()}
                            >
                                Tentar novamente
                            </button>
                        )}
                    </div>
                </div>
            </main>
        )
    }

    const game = gameQuery.data
    const media = mediaQuery.data
    const trailerUrl = youtubeEmbedUrl(media?.trailerVideoId)

    return (
        <main className="game-details">
            <nav
                className="game-details__breadcrumb"
                aria-label="Navegação estrutural"
            >
                <Link to="/library">Biblioteca</Link>
                <span aria-hidden="true">/</span>
                <span aria-current="page">{game.title}</span>
            </nav>

            <section
                className="game-details__hero"
                aria-labelledby="game-title"
            >
                <GameCover
                    key={game.id}
                    title={game.title}
                    url={game.coverUrl}
                />
                <div className="game-details__info">
                    <span className="game-details__eyebrow">
                        QUESTLOG / DETALHES DO JOGO
                    </span>
                    <h1 id="game-title">{game.title}</h1>
                    <div className="game-details__metadata">
                        <span>Lançamento</span>
                        <strong>{formatReleaseDate(game.releaseDate)}</strong>
                    </div>
                    {media?.genres && media.genres.length > 0 && (
                        <div
                            className="game-details__genres"
                            aria-label="Gêneros"
                        >
                            {media.genres.map((genre) => (
                                <span key={genre}>{genre}</span>
                            ))}
                        </div>
                    )}
                    <div className="game-details__synopsis">
                        <h2>Sobre o jogo</h2>
                        {mediaQuery.isPending ? (
                            <div
                                className="game-details__skeleton game-details__skeleton--summary"
                                role="status"
                                aria-label="Carregando descrição"
                            />
                        ) : mediaQuery.isError ? (
                            <div
                                className="game-details__inline-state"
                                role="status"
                            >
                                Não foi possível carregar as informações extras.{' '}
                                <button
                                    type="button"
                                    onClick={() => void mediaQuery.refetch()}
                                >
                                    Tentar novamente
                                </button>
                            </div>
                        ) : (
                            <p>
                                {media?.summary ||
                                    'Ainda não temos uma descrição disponível para este jogo.'}
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {mediaQuery.isPending ? (
                <section
                    className="game-details__media-state"
                    aria-label="Carregando galeria"
                >
                    <div className="game-details__skeleton game-details__skeleton--media" />
                </section>
            ) : mediaQuery.isError ? null : (
                <>
                    {media?.screenshots && media.screenshots.length > 0 ? (
                        <GameGallery
                            key={game.id}
                            title={game.title}
                            screenshots={media.screenshots}
                        />
                    ) : (
                        <section className="game-details__media-state">
                            <h2>Galeria</h2>
                            <p>
                                Este jogo ainda não tem capturas de tela
                                disponíveis.
                            </p>
                        </section>
                    )}
                    {trailerUrl && (
                        <Trailer
                            key={`${game.id}-${trailerUrl}`}
                            title={game.title}
                            url={trailerUrl}
                        />
                    )}
                </>
            )}

            <SteamReviewsPanel
                reviews={steamQuery.data}
                loading={steamQuery.isPending}
                error={steamQuery.isError}
                onRetry={() => void steamQuery.refetch()}
            />
            <SteamWrittenReviewsPanel
                data={writtenQuery.data}
                loading={writtenQuery.isPending}
                error={writtenQuery.isError}
                onRetry={() => void writtenQuery.refetch()}
            />

            <section className="game-details__reviews">
                <span className="game-details__eyebrow">
                    COMUNIDADE QUESTLOG
                </span>
                <h2>Análises dos jogadores</h2>
                <p>Em breve, as análises da comunidade aparecerão aqui.</p>
            </section>
        </main>
    )
}

export default GameDetailsPage
