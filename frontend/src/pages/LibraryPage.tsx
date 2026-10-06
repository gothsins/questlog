import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authenticatedFetch } from '../api/client'
import type { LibraryEntry } from '../types/library'
import GameCard from '../components/GameCard'
import '../styles/library.css'

function LibraryPage() {
    const navigate = useNavigate()

    const [games, setGames] = useState<LibraryEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        async function loadLibrary() {
            try {
                const response = await authenticatedFetch(
                    '/api/library',
                )

                if (response.status === 401 || response.status === 403) {
                    sessionStorage.removeItem('questlog_token')
                    navigate('/login')
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

        loadLibrary()
    }, [navigate])

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
                <div className="library-state">
                    {error}
                </div>
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
                        />
                    ))}
                </div>
            )}
        </section>
    )
}

export default LibraryPage