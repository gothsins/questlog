
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

import { authenticatedFetch } from '../api/client'
import type { LibraryEntry } from '../types/library'
import GameCard from '../components/GameCard'

import '../styles/library.css'

function LibraryPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const [games, setGames] = useState<LibraryEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [saveError, setSaveError] = useState('')

    const [pendingUpdate, setPendingUpdate] = useState<{
        id: number
        status: LibraryEntry['status']
    } | null>(null)

    useEffect(() => {
        async function loadLibrary() {
            try {
                const response = await authenticatedFetch(
                    '/api/library',
                )

                if (
                    response.status === 401 ||
                    response.status === 403
                ) {
                    sessionStorage.removeItem('questlog_token')
                    queryClient.clear()
                    navigate('/login', { replace: true })
                    return
                }

                if (!response.ok) {
                    throw new Error(
                        'Não foi possível carregar sua biblioteca',
                    )
                }

                const data: LibraryEntry[] =
                    await response.json()

                setGames(data)

                queryClient.setQueryData<LibraryEntry[]>(
                    ['library'],
                    data,
                )
            } catch (error) {
                if (error instanceof Error) {
                    setError(error.message)
                } else {
                    setError('Erro inesperado')
                }
            } finally {
                setLoading(false)
            }
        }

        void loadLibrary()
    }, [navigate, queryClient])

    async function handleStatusChange(
        entryId: number,
        status: LibraryEntry['status'],
    ) {
        if (pendingUpdate !== null) return

        setPendingUpdate({ id: entryId, status })
        setSaveError('')

        try {
            const response = await authenticatedFetch(
                `/api/library/${entryId}`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ status }),
                },
            )

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                sessionStorage.removeItem('questlog_token')
                queryClient.clear()
                navigate('/login', { replace: true })
                return
            }

            if (!response.ok) {
                throw new Error(
                    'Não foi possível atualizar o jogo.',
                )
            }

            const updated =
                (await response.json()) as LibraryEntry

            setGames((current) =>
                current.map((game) =>
                    game.id === updated.id
                        ? updated
                        : game,
                ),
            )

            queryClient.setQueryData<LibraryEntry[]>(
                ['library'],
                (current) =>
                    current
                        ? current.map((game) =>
                            game.id === updated.id
                                ? updated
                                : game,
                        )
                        : [updated],
            )
        } catch {
            setSaveError(
                'Não foi possível salvar a alteração. Tente novamente.',
            )
        } finally {
            setPendingUpdate(null)
        }
    }

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

                    <p>
                        Acompanhe sua jornada pelos jogos.
                    </p>
                </div>
            </header>

            {error && (
                <div className="library-state" role="alert">
                    {error}
                </div>
            )}

            {saveError && (
                <p
                    className="library-update-error"
                    role="alert"
                >
                    {saveError}
                </p>
            )}

            {!error && games.length === 0 && (
                <div className="library-state">
                    Sua biblioteca ainda está vazia.
                </div>
            )}

            {!error && games.length > 0 && (
                <div className="library-grid">
                    {games.map((game) => (
                        <GameCard
                            key={game.id}
                            game={game}
                            isSaving={
                                pendingUpdate?.id === game.id
                            }
                            disabled={pendingUpdate !== null}
                            pendingStatus={
                                pendingUpdate?.id === game.id
                                    ? pendingUpdate.status
                                    : undefined
                            }
                            onStatusChange={handleStatusChange}
                        />
                    ))}
                </div>
            )}
        </section>
    )
}

export default LibraryPage
