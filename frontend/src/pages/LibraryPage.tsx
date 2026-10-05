import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authenticatedFetch } from '../api/client'
import type { LibraryEntry } from '../types/library'

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

    function handleLogout() {
        sessionStorage.removeItem('questlog_token')
        navigate('/login')
    }

    if (loading) {
        return <p>Carregando biblioteca...</p>
    }

    return (
        <main>
            <h1>Minha biblioteca</h1>

            <button onClick={handleLogout}>
                Sair
            </button>

            {error && <p>{error}</p>}

            {!error && games.length === 0 && (
                <p>Sua biblioteca está vazia.</p>
            )}

            {games.map((game) => (
                <article key={game.id}>
                    <h2>{game.title}</h2>

                    <p>Status: {game.status}</p>
                    <p>Nota: {game.rating ?? 'Sem nota'}</p>
                    <p>Horas: {game.hoursPlayed}</p>
                </article>
            ))}
        </main>
    )
}

export default LibraryPage