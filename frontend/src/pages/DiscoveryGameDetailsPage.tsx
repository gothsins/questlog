import { useEffect, useState } from 'react'
import { useEndSession } from '../hooks/useEndSession'
import { importIgdbGame, useLibraryQuery } from '../api/library'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authenticatedFetch } from '../api/client'
import GameDetailsContent, { GameDetailsLoading } from '../components/GameDetailsContent'
import type { LibraryEntry } from '../types/library'
import '../styles/game-details.css'

interface DiscoveryGameDetails {
    igdbId: number
    gameId: number | null
    title: string
    releaseDate: string | null
    coverUrl: string | null
    summary: string | null
    genres: string[]
    screenshots: string[]
    trailerVideoId: string | null
}

function DiscoveryGameDetailsPage() {
    const { igdbId } = useParams()
    const id = Number(igdbId)
    const validId = Number.isSafeInteger(id) && id > 0
    const navigate = useNavigate()
    const endSession = useEndSession()
    const queryClient = useQueryClient()
    const [feedback, setFeedback] = useState('')

    const details = useQuery<DiscoveryGameDetails>({
        queryKey: ['discovery-game', id],
        enabled: validId,
        staleTime: 5 * 60_000,
        retry: false,
        queryFn: async ({ signal }) => {
            const response = await authenticatedFetch(`/api/discovery/games/${id}`, { signal })
            if (response.status === 401 || response.status === 403) throw new Error('SESSION_EXPIRED')
            if (response.status === 404) throw new Error('GAME_NOT_FOUND')
            if (!response.ok) throw new Error('GAME_UNAVAILABLE')
            return response.json() as Promise<DiscoveryGameDetails>
        },
    })
    const library = useLibraryQuery({ enabled: validId && details.isSuccess })

    const importGame = useMutation<LibraryEntry, Error>({
        mutationFn: () => importIgdbGame(id),
        onSuccess: (entry) => {
            queryClient.setQueryData<LibraryEntry[]>(['library'], current =>
                current?.some(item => item.id === entry.id) ? current : [...(current ?? []), entry])
            void queryClient.invalidateQueries({ queryKey: ['library'] })
            navigate(`/games/${entry.gameId}`, { replace: true })
        },
        onError: async (error) => {
            if (error.message === 'SESSION_EXPIRED') return
            if (error.message === 'ALREADY_IN_LIBRARY') {
                const result = await library.refetch()
                const entry = result.data?.find(item => item.igdbId === id)
                setFeedback(entry
                    ? 'Esse jogo já está na sua biblioteca. Você pode abrir os detalhes da coleção.'
                    : 'O jogo já está na biblioteca, mas não foi possível recuperar a entrada. Tente atualizar a página.')
                return
            }
            setFeedback('Não foi possível adicionar o jogo. Tente novamente.')
        },
    })

    useEffect(() => {
        if ([details.error, library.error, importGame.error].some(error => error?.message === 'SESSION_EXPIRED')) {
            endSession()
        }
    }, [details.error, library.error, importGame.error, endSession])

    if (!validId) {
        return <main className="game-details">
            <div className="game-details__state" role="alert">
                Jogo inválido. <Link to="/explore">Voltar para Explorar</Link>
            </div>
        </main>
    }

    if (details.isPending) return <GameDetailsLoading />

    if (details.isError || !details.data) {
        return <main className="game-details">
            <div className="game-details__state" role="alert">
                <span className="game-details__eyebrow">QUESTLOG / DESCOBERTA</span>
                <h1>{details.error?.message === 'GAME_NOT_FOUND'
                    ? 'Jogo não encontrado'
                    : 'IGDB indisponível no momento'}</h1>
                <p>Você pode explorar outros jogos ou tentar novamente.</p>
                <div className="game-details__state-actions">
                    <Link to="/explore">Voltar para Explorar</Link>
                    {details.error?.message !== 'GAME_NOT_FOUND' && (
                        <button type="button" onClick={() => void details.refetch()}>
                            Tentar novamente
                        </button>
                    )}
                </div>
            </div>
        </main>
    }

    const game = details.data
    const owned = library.data?.find(entry => entry.igdbId === id)

    return (
        <main className="game-details">
            <nav className="game-details__breadcrumb" aria-label="Navegação estrutural">
                <Link to="/explore">Explorar</Link>
                <span aria-hidden="true">/</span>
                <span aria-current="page">{game.title}</span>
            </nav>
            <GameDetailsContent
                game={{
                    id: game.igdbId,
                    title: game.title,
                    releaseDate: game.releaseDate,
                    coverUrl: game.coverUrl,
                }}
                media={game}
                action={<div className="discovery-game__actions">
                    {owned ? (
                        <>
                            <span className="discovery-game__owned" role="status">Na sua biblioteca</span>
                            <Link className="discovery-game__primary" to={`/games/${owned.gameId}`}>
                                Abrir detalhes da coleção
                            </Link>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                className="discovery-game__primary"
                                disabled={library.isPending || library.isError || importGame.isPending}
                                onClick={() => {
                                    setFeedback('')
                                    importGame.mutate()
                                }}
                            >
                                {importGame.isPending ? 'Adicionando...' : 'Adicionar à biblioteca'}
                            </button>
                            {library.isError && <span role="alert">
                                Não foi possível verificar sua biblioteca.{' '}
                                <button type="button" onClick={() => void library.refetch()}>
                                    Tentar novamente
                                </button>
                            </span>}
                        </>
                    )}
                    {feedback && <p role="status">{feedback}</p>}
                </div>}
            />
            {game.gameId && !owned && (
                <p className="discovery-game__note">
                    Este jogo já está no catálogo Questlog. Adicione-o à sua biblioteca para acompanhar sua jornada.
                </p>
            )}
        </main>
    )
}

export default DiscoveryGameDetailsPage
