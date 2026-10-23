import { useEffect, useState } from 'react'
import { useEndSession } from '../hooks/useEndSession'
import { useQueryClient } from '@tanstack/react-query'
import { useReducedMotion } from 'motion/react'

import {
    LIBRARY_QUERY_KEY,
    type LibraryEntryChanges,
    SESSION_EXPIRED,
    patchLibraryEntry,
    useLibraryQuery,
} from '../api/library'
import { syncReviewRating } from '../components/reviewCache'
import type { LibraryEntry } from '../types/library'
import type { GameReview } from '../types/reviews'
import LibraryShelf from '../components/LibraryShelf'
import LibraryQuickFilters from '../components/LibraryQuickFilters'
import type { LibraryStatusFilter } from '../components/LibraryQuickFilters'
import { readLibraryViewMode, saveLibraryViewMode } from '../components/libraryViewPreference'

import '../styles/library.css'

const NO_GAMES: LibraryEntry[] = []

function LibraryPage() {
    const endSession = useEndSession()
    const queryClient = useQueryClient()
    const reducedMotion = Boolean(useReducedMotion())

    const libraryQuery = useLibraryQuery({ staleTime: 0 })
    const games = libraryQuery.data ?? NO_GAMES
    const loading = libraryQuery.isPending
    const error =
        libraryQuery.isError && libraryQuery.error.message !== SESSION_EXPIRED
            ? 'Não foi possível carregar sua biblioteca'
            : ''
    const [saveError, setSaveError] = useState('')
    const [saveNotice, setSaveNotice] = useState('')

    const [pendingUpdate, setPendingUpdate] = useState<{
        id: number
        status?: LibraryEntry['status']
    } | null>(null)

    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<LibraryStatusFilter>('ALL')
    const [sortOrder, setSortOrder] = useState<
        'recent' | 'oldest' | 'title'
    >('recent')
    const [viewMode, setViewMode] = useState(readLibraryViewMode)

    useEffect(() => saveLibraryViewMode(viewMode), [viewMode])

    useEffect(() => {
        if (libraryQuery.error?.message === SESSION_EXPIRED) endSession()
    }, [libraryQuery.error, endSession])

    async function updateLibraryEntry(
        entryId: number,
        changes: LibraryEntryChanges,
    ): Promise<boolean> {
        if (pendingUpdate !== null) return false

        setPendingUpdate({ id: entryId, status: changes.status })
        setSaveError('')
        setSaveNotice('')

        try {
            const updated = await patchLibraryEntry(entryId, changes)

            queryClient.setQueryData<LibraryEntry[]>(
                LIBRARY_QUERY_KEY,
                (current) =>
                    current
                        ? current.map((game) =>
                              game.id === updated.id ? updated : game,
                          )
                        : [updated],
            )

            if ('rating' in changes) {
                const reviewsKey = ['game-reviews', updated.gameId]
                await queryClient.cancelQueries({ queryKey: reviewsKey, exact: true })
                queryClient.setQueryData<GameReview[]>(reviewsKey, (current) =>
                    syncReviewRating(current, updated.id, updated.rating),
                )
                queryClient.setQueryData<GameReview | null>(['my-review', updated.id], (current) =>
                    current ? { ...current, rating: updated.rating } : current,
                )
                void queryClient.invalidateQueries({ queryKey: reviewsKey, exact: true })
            }

            if ('rating' in changes || 'hoursPlayed' in changes) {
                setSaveNotice('Avaliação e horas salvas com sucesso!')
            }

            return true
        } catch (error) {
            if (error instanceof Error && error.message === SESSION_EXPIRED) {
                endSession()
                return false
            }
            setSaveError(
                'Não foi possível salvar a alteração. Tente novamente.',
            )
            return false
        } finally {
            setPendingUpdate(null)
        }
    }

    function handleStatusChange(
        entryId: number,
        status: LibraryEntry['status'],
    ) {
        void updateLibraryEntry(entryId, { status })
    }

    function handleDetailsSave(
        entryId: number,
        details: { rating?: number; hoursPlayed: number },
    ): Promise<boolean> {
        return updateLibraryEntry(entryId, details)
    }

    const stats = {
        total: games.length,
        playing: games.filter((game) => game.status === 'PLAYING').length,
        completed: games.filter((game) => game.status === 'COMPLETED').length,
        hours: games.reduce(
            (total, game) => total + (game.hoursPlayed ?? 0),
            0,
        ),
    }

    const formattedHours = new Intl.NumberFormat('pt-BR', {
        maximumFractionDigits: 1,
    }).format(stats.hours)

    const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')

    const filteredGames = games
        .filter((game) => {
            const matchesSearch = game.title
                .toLocaleLowerCase('pt-BR')
                .includes(normalizedSearch)

            const matchesStatus =
                statusFilter === 'ALL' || game.status === statusFilter

            return matchesSearch && matchesStatus
        })
        .sort((a, b) => {
            if (sortOrder === 'title') {
                return a.title.localeCompare(b.title, 'pt-BR')
            }

            if (sortOrder === 'oldest') {
                return a.createdAt.localeCompare(b.createdAt)
            }

            return b.createdAt.localeCompare(a.createdAt)
        })

    if (loading) {
        return (
            <div className="library-state">
                Carregando sua biblioteca...
            </div>
        )
    }

    return (
        <section className="library-page">
            <header className="library-header">
                <div>
                    <span className="library-header__eyebrow">SUA COLEÇÃO</span>
                    <h1>Minha biblioteca</h1>
                    <p>Acompanhe sua jornada pelos jogos.</p>
                </div>
            </header>

            {!error && games.length > 0 && (
                <div className="library-overview">
                    <div className="library-overview__item">
                        <span>Total de jogos</span>
                        <strong>{stats.total}</strong>
                    </div>

                    <div className="library-overview__item">
                        <span>Jogando</span>
                        <strong>{stats.playing}</strong>
                    </div>

                    <div className="library-overview__item">
                        <span>Concluídos</span>
                        <strong>{stats.completed}</strong>
                    </div>

                    <div className="library-overview__item">
                        <span>Horas registradas</span>
                        <strong>{formattedHours}h</strong>
                    </div>
                </div>
            )}

            {!error && games.length > 0 && (
                <div className="library-toolbar">
                    <div className="library-toolbar__search">
                        <label htmlFor="library-search">
                            Pesquisar jogos
                        </label>
                        <input
                            id="library-search"
                            type="search"
                            placeholder="Buscar na minha biblioteca..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>

                    <div className="library-toolbar__field">
                        <label htmlFor="library-status-filter">Estado</label>
                        <select
                            id="library-status-filter"
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(
                                    event.target.value as
                                        LibraryStatusFilter,
                                )
                            }
                        >
                            <option value="ALL">Todos os estados</option>
                            <option value="WISHLIST">Quero jogar</option>
                            <option value="PLAYING">Jogando</option>
                            <option value="COMPLETED">Concluídos</option>
                            <option value="DROPPED">Abandonados</option>
                        </select>
                    </div>

                    <div className="library-toolbar__field">
                        <label htmlFor="library-sort">Ordenar por</label>
                        <select
                            id="library-sort"
                            value={sortOrder}
                            onChange={(event) =>
                                setSortOrder(
                                    event.target.value as
                                        'recent' | 'oldest' | 'title',
                                )
                            }
                        >
                            <option value="recent">Adicionados recentemente</option>
                            <option value="oldest">Adicionados primeiro</option>
                            <option value="title">Nome (A–Z)</option>
                        </select>
                    </div>

                    <fieldset className="library-view-switch">
                        <legend>Visualização</legend>
                        <div className="library-view-switch__options">
                            <button
                                type="button"
                                aria-pressed={viewMode === 'hybrid'}
                                onClick={() => setViewMode('hybrid')}
                            >
                                Híbrido
                            </button>
                            <button
                                type="button"
                                aria-pressed={viewMode === 'covers'}
                                onClick={() => setViewMode('covers')}
                            >
                                Capas
                            </button>
                        </div>
                    </fieldset>
                </div>
            )}

            {!error && games.length > 0 && (
                <LibraryQuickFilters
                    games={games}
                    selected={statusFilter}
                    onSelect={setStatusFilter}
                    reducedMotion={reducedMotion}
                />
            )}

            {error && (
                <div className="library-state" role="alert">
                    {error}
                </div>
            )}

            {saveError && (
                <p className="library-update-error" role="alert">
                    {saveError}
                </p>
            )}

            {saveNotice && (
                <p className="library-update-success" role="status">
                    {saveNotice}
                </p>
            )}

            {!error && games.length === 0 && (
                <div className="library-state">
                    Sua biblioteca ainda está vazia.
                </div>
            )}

            {!error && games.length > 0 && filteredGames.length === 0 && (
                <div className="library-state">
                    Nenhum jogo corresponde aos filtros selecionados.
                </div>
            )}

            {!error && filteredGames.length > 0 && (
                <div className="library-results" role="status">
                    {filteredGames.length === 1
                        ? '1 jogo na coleção'
                        : `${filteredGames.length} jogos na coleção`}
                </div>
            )}

            {!error && games.length > 0 && (
                <LibraryShelf
                    games={filteredGames}
                    viewMode={viewMode}
                    reducedMotion={reducedMotion}
                    pendingUpdate={pendingUpdate}
                    onStatusChange={handleStatusChange}
                    onSaveDetails={handleDetailsSave}
                />
            )}
        </section>
    )
}

export default LibraryPage
