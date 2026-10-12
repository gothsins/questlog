import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

import { authenticatedFetch } from '../api/client'
import type { LibraryEntry } from '../types/library'
import GameCard from '../components/GameCard'

import '../styles/library.css'

type LibraryEntryChanges = {
    status?: LibraryEntry['status']
    rating?: number
    hoursPlayed?: number
}

function LibraryPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const [games, setGames] = useState<LibraryEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [saveError, setSaveError] = useState('')
    const [saveNotice, setSaveNotice] = useState('')

    const [pendingUpdate, setPendingUpdate] = useState<{
        id: number
        status?: LibraryEntry['status']
    } | null>(null)

    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<
        'ALL' | LibraryEntry['status']
    >('ALL')
    const [sortOrder, setSortOrder] = useState<
        'recent' | 'oldest' | 'title'
    >('recent')

    useEffect(() => {
        async function loadLibrary() {
            try {
                const response = await authenticatedFetch('/api/library')

                if (response.status === 401 || response.status === 403) {
                    sessionStorage.removeItem('questlog_token')
                    queryClient.clear()
                    navigate('/login', { replace: true })
                    return
                }

                if (!response.ok) {
                    throw new Error('Não foi possível carregar sua biblioteca')
                }

                const data: LibraryEntry[] = await response.json()
                setGames(data)
                queryClient.setQueryData<LibraryEntry[]>(['library'], data)
            } catch (error) {
                setError(
                    error instanceof Error ? error.message : 'Erro inesperado',
                )
            } finally {
                setLoading(false)
            }
        }

        void loadLibrary()
    }, [navigate, queryClient])

    async function updateLibraryEntry(
        entryId: number,
        changes: LibraryEntryChanges,
    ): Promise<boolean> {
        if (pendingUpdate !== null) return false

        setPendingUpdate({ id: entryId, status: changes.status })
        setSaveError('')
        setSaveNotice('')

        try {
            const response = await authenticatedFetch(
                `/api/library/${entryId}`,
                {
                    method: 'PATCH',
                    body: JSON.stringify(changes),
                },
            )

            if (response.status === 401 || response.status === 403) {
                sessionStorage.removeItem('questlog_token')
                queryClient.clear()
                navigate('/login', { replace: true })
                return false
            }

            if (!response.ok) {
                throw new Error('Não foi possível atualizar o jogo.')
            }

            const updated = (await response.json()) as LibraryEntry

            setGames((current) =>
                current.map((game) =>
                    game.id === updated.id ? updated : game,
                ),
            )

            queryClient.setQueryData<LibraryEntry[]>(
                ['library'],
                (current) =>
                    current
                        ? current.map((game) =>
                              game.id === updated.id ? updated : game,
                          )
                        : [updated],
            )

            if ('rating' in changes || 'hoursPlayed' in changes) {
                setSaveNotice('Avaliação e horas salvas com sucesso!')
            }

            return true
        } catch {
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
        <section>
            <header className="library-header">
                <div>
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
                                        'ALL' | LibraryEntry['status'],
                                )
                            }
                        >
                            <option value="ALL">Todos os estados</option>
                            <option value="BACKLOG">Backlog</option>
                            <option value="PLAYING">Jogando</option>
                            <option value="COMPLETED">Concluídos</option>
                            <option value="DROPPED">Abandonados</option>
                            <option value="WISHLIST">Lista de desejos</option>
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
                </div>
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
                <div className="library-grid">
                    {filteredGames.map((game) => (
                        <GameCard
                            key={game.id}
                            game={game}
                            isSaving={pendingUpdate?.id === game.id}
                            disabled={pendingUpdate !== null}
                            pendingStatus={
                                pendingUpdate?.id === game.id
                                    ? pendingUpdate.status
                                    : undefined
                            }
                            onStatusChange={handleStatusChange}
                            onSaveDetails={handleDetailsSave}
                        />
                    ))}
                </div>
            )}
        </section>
    )
}

export default LibraryPage
