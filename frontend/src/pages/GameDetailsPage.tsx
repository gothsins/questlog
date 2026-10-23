import { useEffect } from 'react'
import { useEndSession } from '../hooks/useEndSession'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { authenticatedFetch } from '../api/client'
import GameDetailsContent, { GameDetailsLoading } from '../components/GameDetailsContent'
import type { DetailsGame, DetailsMedia } from '../components/GameDetailsContent'
import SteamReviewsPanel from '../components/SteamReviewsPanel'
import type { SteamReviews } from '../components/SteamReviewsPanel'
import SteamWrittenReviewsPanel from '../components/SteamWrittenReviewsPanel'
import type { SteamWrittenReviews } from '../components/SteamWrittenReviewsPanel'
import GameReviewsSection from '../components/GameReviewsSection'
import '../styles/game-details.css'

function GameDetailsPage() {
    const { gameId } = useParams()
    const endSession = useEndSession()
    const id = Number(gameId)
    const validId = Number.isSafeInteger(id) && id > 0

    const gameQuery = useQuery<DetailsGame>({
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
            return (await response.json()) as DetailsGame
        },
    })

    const mediaQuery = useQuery<DetailsMedia>({
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
            return (await response.json()) as DetailsMedia
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
        endSession()
    }, [gameQuery.error, mediaQuery.error, steamQuery.error, writtenQuery.error, endSession])

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

    if (gameQuery.isPending) return <GameDetailsLoading />

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

    return (
        <main className="game-details">
            <nav className="game-details__breadcrumb" aria-label="Navegação estrutural">
                <Link to="/library">Biblioteca</Link>
                <span aria-hidden="true">/</span>
                <span aria-current="page">{game.title}</span>
            </nav>
            <GameDetailsContent
                game={game}
                media={mediaQuery.data}
                mediaPending={mediaQuery.isPending}
                mediaError={mediaQuery.isError}
                onMediaRetry={() => void mediaQuery.refetch()}
            />

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

            <GameReviewsSection key={game.id} gameId={game.id} />
        </main>
    )
}

export default GameDetailsPage
