import { useState } from 'react'
import type { FormEvent } from 'react'
import { login } from '../api/auth'
import { useNavigate } from 'react-router-dom'

function LoginPage() {
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)


    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        setError('')
        setLoading(true)

        try {
            const response = await login({
                username,
                password,
            })

            sessionStorage.setItem(
                'questlog_token',
                response.token,
            )

            navigate('/library')

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

    return (
        <main>
            <h1>Questlog</h1>
            <h2>Login</h2>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="username">
                        Usuário
                    </label>

                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(event) =>
                            setUsername(event.target.value)
                        }
                        placeholder="Seu usuário"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="password">
                        Senha
                    </label>

                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                        placeholder="Sua senha"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                >
                    {loading ? 'Entrando...' : 'Entrar'}
                </button>

                {error && (
                    <p>{error}</p>
                )}
            </form>
        </main>
    )
}

export default LoginPage