import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { authenticatedFetch } from '../api/client'
import '../styles/game-details.css'
import SteamReviewsPanel from '../components/SteamReviewsPanel'
import type { SteamReviews } from '../components/SteamReviewsPanel'
import GameGallery from '../components/GameGallery'
import SteamWrittenReviewsPanel from '../components/SteamWrittenReviewsPanel'

import type {
    SteamWrittenReviews,
} from '../components/SteamWrittenReviewsPanel'

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

function GameDetailsPage() {
    const { gameId } = useParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const id = Number(gameId)
    const validId = Number.isSafeInteger(id) && id > 0



    const {
        data: game,
        isPending,
        error,
    } = useQuery<GameDetails>({
        queryKey: ['game-details', id],
        enabled: validId,
        retry: false,

        queryFn: async ({ signal }) => {
            const response = await authenticatedFetch(
                `/api/games/${id}`,
                { signal },
            )

            if (response.status === 401 || response.status === 403) {
                throw new Error('SESSION_EXPIRED')
            }

            if (response.status === 404) {
                throw new Error('GAME_NOT_FOUND')
            }

            if (!response.ok) {
                throw new Error('GAME_LOAD_FAILED')
            }

            return (await response.json()) as GameDetails
        },
    })

    const {
        data: writtenReviews,
        isPending: writtenReviewsPending,
        error: writtenReviewsError,
    } = useQuery<SteamWrittenReviews>({
        queryKey: ['game-steam-written-reviews', id],
        enabled: validId && Boolean(game),
        staleTime: 5 * 60 * 1000,
        retry: false,

        queryFn: async ({ signal }) => {
            const response = await authenticatedFetch(
                `/api/games/${id}/steam-review-texts`,
                { signal },
            )

            if (
                response.status === 401
                || response.status === 403
            ) {
                throw new Error('SESSION_EXPIRED')
            }

            if (!response.ok) {
                throw new Error('WRITTEN_REVIEWS_UNAVAILABLE')
            }

            return (await response.json()) as SteamWrittenReviews
        },
    })

    const {
        data: media,
        isPending: mediaPending,
        isError: mediaError,
    } = useQuery<GameMedia>({
        queryKey: ['game-media', id],
        enabled: validId && Boolean(game),
        staleTime: 5 * 60 * 1000,
        retry: false,

        queryFn: async ({ signal }) => {
            const response = await authenticatedFetch(
                `/api/games/${id}/media`,
                { signal },
            )

            if (!response.ok) {
                throw new Error(
                    'Não foi possível carregar as mídias.'
                )
            }

            return (await response.json()) as GameMedia
        },
    })

    const {
        data: steamReviews,
        isPending: steamPending,
        error: steamError,
    } = useQuery<SteamReviews>({
        queryKey: ['game-steam-reviews', id],
        enabled: validId && Boolean(game),
        staleTime: 10 * 60 * 1000,
        retry: false,

        queryFn: async ({ signal }) => {
            const response = await authenticatedFetch(
                `/api/games/${id}/steam-reviews`,
                { signal },
            )

            if (response.status === 401 || response.status === 403) {
                throw new Error('SESSION_EXPIRED')
            }

            if (!response.ok) {
                throw new Error('STEAM_REVIEWS_UNAVAILABLE')
            }

            return (await response.json()) as SteamReviews
        },
    })

    useEffect(() => {
        if (
            error?.message === 'SESSION_EXPIRED'
            || steamError?.message === 'SESSION_EXPIRED'
            || writtenReviewsError?.message === 'SESSION_EXPIRED'
        ) {
            sessionStorage.removeItem('questlog_token')
            queryClient.clear()
            navigate('/login', { replace: true })
        }
    }, [
        error,
        steamError,
        writtenReviewsError,
        navigate,
        queryClient,
    ])

    if (!validId) {
        return <p className="game-details__state">Jogo inválido.</p>
    }

    if (isPending) {
        return <p className="game-details__state">Carregando jogo...</p>
    }

    if (error || !game) {
        return (
            <p className="game-details__state" role="alert">
                {error?.message === 'GAME_NOT_FOUND'
                    ? 'Jogo não encontrado.'
                    : 'Não foi possível carregar o jogo.'}
            </p>
        )
    }

    const releaseDate = game.releaseDate
        ? new Date(`${game.releaseDate}T00:00:00`).toLocaleDateString(
            'pt-BR',
            { day: 'numeric', month: 'long', year: 'numeric' },
        )
        : 'Data não informada'

    return (
        <main className="game-details">
            <Link to="/library" className="game-details__back">
                ← Voltar para biblioteca
            </Link>

            <section className="game-details__hero">
                <div className="game-details__cover">
                    {game.coverUrl ? (
                        <img
                            src={game.coverUrl}
                            alt={`Capa de ${game.title}`}
                        />
                    ) : (
                        <div className="game-details__placeholder">
                            Q
                        </div>
                    )}
                </div>

                <div className="game-details__info">
                    <span className="game-details__eyebrow">
                        QUESTLOG / JOGO
                    </span>

                    <h1>{game.title}</h1>

                    <div className="game-details__metadata">
                        <span>Lançamento</span>
                        <strong>{releaseDate}</strong>
                    </div>

                    {media?.genres && media.genres.length > 0 && (
                        <div className="game-details__genres">
                            {media.genres.map((genre) => (
                                <span key={genre}>{genre}</span>
                            ))}
                        </div>
                    )}

                    {mediaPending ? (
                        <p>Carregando informações do jogo...</p>
                    ) : mediaError ? (
                        <p>Não foi possível carregar as informações extras.</p>
                    ) : media?.summary ? (
                        <p className="game-details__summary">
                            {media.summary}
                        </p>
                    ) : (
                        <p>
                            Ainda não temos uma descrição disponível
                            para este jogo.
                        </p>
                    )}
                </div>
            </section>


            {media && media.screenshots.length > 0 && (
                <GameGallery
                    title={game.title}
                    screenshots={media.screenshots}
                />
            )}

            {media?.trailerVideoId && (
                <section className="game-details__trailer">
                    <h2>Trailer</h2>

                    <div className="game-details__video">
                        <iframe
                            src={`https://www.youtube-nocookie.com/embed/${media.trailerVideoId}`}
                            title={`Trailer de ${game.title}`}
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                        />
                    </div>
                </section>
            )}

            <SteamReviewsPanel
                reviews={steamReviews}
                loading={steamPending}
                error={Boolean(steamError)}
            />

            <SteamWrittenReviewsPanel
                data={writtenReviews}
                loading={writtenReviewsPending}
                error={Boolean(writtenReviewsError)}
            />

            <section className="game-details__reviews">
                <span className="game-details__eyebrow">
                    COMUNIDADE
                </span>

                <h2>Análises dos jogadores</h2>

                <p>
                    Em breve, as análises da comunidade
                    aparecerão aqui.
                </p>
            </section>
        </main>
    )
}

export default GameDetailsPage