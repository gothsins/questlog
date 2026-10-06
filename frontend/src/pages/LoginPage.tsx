import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import '../styles/login.css'

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
        <main className="login-page">
            <section className="login-card">
                <div className="login-brand">
                    <div className="login-logo">
                        Q
                    </div>

                    <div>
                        <h1>Questlog</h1>
                        <p>
                            Sua jornada pelos jogos começa aqui.
                        </p>
                    </div>
                </div>

                <div className="login-heading">
                    <h2>Bem-vindo de volta</h2>

                    <p>
                        Entre para continuar sua biblioteca.
                    </p>
                </div>

                <form
                    className="login-form"
                    onSubmit={handleSubmit}
                >
                    <div className="form-group">
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
                            placeholder="Digite seu usuário"
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div className="form-group">
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
                            placeholder="Digite sua senha"
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    {error && (
                        <div
                            className="login-error"
                            role="alert"
                        >
                            {error}
                        </div>
                    )}

                    <button
                        className="login-button"
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? 'Entrando...'
                            : 'Entrar'}
                    </button>
                </form>

                <p className="login-footer">
                    Acompanhe seus jogos, progresso e jornadas.
                </p>
            </section>
        </main>
    )
}

export default LoginPage