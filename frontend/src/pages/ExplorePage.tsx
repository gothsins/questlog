
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query'

import { authenticatedFetch } from '../api/client'
import SearchGameCard from '../components/SearchGameCard'
import type { IgdbSearchResult } from '../types/igdb'
import type { LibraryEntry } from '../types/library'

import '../styles/explore.css'

function ExplorePage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const [input, setInput] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [feedback, setFeedback] = useState('')
    const [confirmedIds, setConfirmedIds] = useState<number[]>([])

    const {
        data: games = [],
        isFetching,
        isError: searchHasError,
        error: searchError,
    } = useQuery<IgdbSearchResult[]>({
        queryKey: ['igdb-search', searchTerm.toLowerCase()],
        enabled: searchTerm.length >= 2,
        staleTime: 5 * 60 * 1000,
        retry: false,

        queryFn: async ({ signal }) => {
            const response = await authenticatedFetch(
                `/api/games/search?query=${encodeURIComponent(searchTerm)}`,
                { signal },
            )

            if (response.status === 401 || response.status === 403) {
                throw new Error('SESSION_EXPIRED')
            }

            if (!response.ok) {
                throw new Error('Falha ao buscar jogos')
            }

            return (await response.json()) as IgdbSearchResult[]
        },
    })

    const {
        data: library = [],
        isPending: libraryPending,
        isError: libraryHasError,
        error: libraryError,
    } = useQuery<LibraryEntry[]>({
        queryKey: ['library'],
        staleTime: 30_000,
        retry: false,

        queryFn: async () => {
            const response = await authenticatedFetch('/api/library')

            if (response.status === 401 || response.status === 403) {
                throw new Error('SESSION_EXPIRED')
            }

            if (!response.ok) {
                throw new Error('Falha ao carregar biblioteca')
            }

            return (await response.json()) as LibraryEntry[]
        },
    })

    useEffect(() => {
        const sessionExpired = [searchError, libraryError].some(
            (error) =>
                error instanceof Error &&
                error.message === 'SESSION_EXPIRED',
        )

        if (sessionExpired) {
            sessionStorage.removeItem('questlog_token')
            queryClient.clear()
            navigate('/login', { replace: true })
        }
    }, [searchError, libraryError, navigate, queryClient])

    const {
        mutate: addGame,
        isPending: isAdding,
        variables: addingId,
    } = useMutation<LibraryEntry, Error, number>({
        mutationFn: async (igdbId) => {
            const response = await authenticatedFetch(
                '/api/library/import',
                {
                    method: 'POST',
                    body: JSON.stringify({ igdbId }),
                },
            )

            if (response.status === 401 || response.status === 403) {
                throw new Error('SESSION_EXPIRED')
            }

            if (response.status === 409) {
                throw new Error('ALREADY_IN_LIBRARY')
            }

            if (!response.ok) {
                throw new Error('IMPORT_FAILED')
            }

            return (await response.json()) as LibraryEntry
        },

        onMutate: () => {
            setFeedback('')
        },

        onSuccess: (newEntry, igdbId) => {
            setConfirmedIds((current) =>
                current.includes(igdbId)
                    ? current
                    : [...current, igdbId],
            )

            queryClient.setQueryData<LibraryEntry[]>(
                ['library'],
                (current = []) => {
                    if (current.some((entry) => entry.id === newEntry.id)) {
                        return current
                    }

                    return [...current, newEntry]
                },
            )

            void queryClient.invalidateQueries({
                queryKey: ['library'],
            })

            setFeedback(`${newEntry.title} foi adicionado à biblioteca!`)
        },

        onError: (error, igdbId) => {
            if (error.message === 'SESSION_EXPIRED') {
                sessionStorage.removeItem('questlog_token')
                queryClient.clear()
                navigate('/login', { replace: true })
                return
            }

            if (error.message === 'ALREADY_IN_LIBRARY') {
                setConfirmedIds((current) =>
                    current.includes(igdbId)
                        ? current
                        : [...current, igdbId],
                )

                void queryClient.invalidateQueries({
                    queryKey: ['library'],
                })

                setFeedback('Esse jogo já estava na sua biblioteca.')
                return
            }

            setFeedback(
                'Não foi possível adicionar o jogo. Tente novamente.',
            )
        },
    })

    function handleSearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const normalized = input.trim()

        if (normalized.length < 2) return

        setFeedback('')
        setSearchTerm(normalized)
    }

    const hasSearched = searchTerm.length >= 2

    const ownedIds = new Set(
        library
            .map((entry) => entry.igdbId)
            .filter((id): id is number => id !== null),
    )

    return (
        <div className="explore-page">
            <section className="explore-hero">
                <span className="explore-hero__eyebrow">
                    SEU PRÓXIMO JOGO COMEÇA AQUI
                </span>

                <h1>
                    Um universo de jogos.
                    <span> Sua próxima descoberta.</span>
                </h1>

                <p>
                    Encontre seus jogos favoritos, descubra novos
                    títulos e construa sua jornada no Questlog.
                </p>

                <form
                    className="explore-search"
                    onSubmit={handleSearch}
                    role="search"
                >
                    <label htmlFor="game-search">
                        Buscar no catálogo
                    </label>

                    <div className="explore-search__controls">
                        <input
                            id="game-search"
                            type="search"
                            value={input}
                            onChange={(event) =>
                                setInput(event.target.value)
                            }
                            placeholder="Hollow Knight, Elden Ring..."
                            minLength={2}
                            maxLength={80}
                            required
                        />

                        <button
                            type="submit"
                            disabled={input.trim().length < 2}
                        >
                            Buscar jogos
                        </button>
                    </div>
                </form>
            </section>

            <section className="explore-results">
                <div className="explore-results__header">
                    <div>
                        <span className="explore-results__eyebrow">
                            CATÁLOGO
                        </span>

                        <h2>
                            {hasSearched
                                ? `Resultados para "${searchTerm}"`
                                : 'Explore novos mundos'}
                        </h2>
                    </div>

                    {hasSearched && !isFetching && !searchHasError && (
                        <span className="explore-results__count">
                            {games.length} resultados
                        </span>
                    )}
                </div>

                {feedback && (
                    <div
                        className="explore-feedback"
                        role="status"
                        aria-live="polite"
                    >
                        {feedback}
                    </div>
                )}

                {libraryHasError && (
                    <p className="explore-library-warning" role="alert">
                        Não foi possível verificar sua biblioteca.
                        Atualize a página para tentar novamente.
                    </p>
                )}

                {!hasSearched && (
                    <div className="explore-state">
                        <span className="explore-state__symbol">
                            ✦
                        </span>

                        <h3>O que vamos jogar hoje?</h3>

                        <p>
                            Pesquise um título para começar
                            a explorar o catálogo.
                        </p>
                    </div>
                )}

                {hasSearched && isFetching && (
                    <div className="explore-state" role="status">
                        Buscando jogos no catálogo...
                    </div>
                )}

                {hasSearched &&
                    searchHasError &&
                    !isFetching && (
                        <div className="explore-state" role="alert">
                            Não foi possível carregar os jogos.
                            Tente novamente.
                        </div>
                    )}

                {hasSearched &&
                    !isFetching &&
                    !searchHasError &&
                    games.length === 0 && (
                        <div className="explore-state">
                            Nenhum jogo encontrado.
                            Que tal tentar outro nome?
                        </div>
                    )}

                {hasSearched &&
                    !isFetching &&
                    !searchHasError &&
                    games.length > 0 && (
                        <div className="explore-grid">
                            {games.map((game) => (
                                <SearchGameCard
                                    key={game.igdbId}
                                    game={game}
                                    isInLibrary={
                                        ownedIds.has(game.igdbId) ||
                                        confirmedIds.includes(game.igdbId)
                                    }
                                    isAdding={
                                        isAdding &&
                                        addingId === game.igdbId
                                    }
                                    disabled={
                                        libraryPending ||
                                        libraryHasError ||
                                        isAdding
                                    }
                                    onAdd={addGame}
                                />
                            ))}
                        </div>
                    )}
            </section>
        </div>
    )
}

export default ExplorePage
