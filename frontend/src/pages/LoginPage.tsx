import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'motion/react'

import { login } from '../api/auth'
import '../styles/login.css'

const REMEMBERED_USERNAME_KEY = 'questlog_remembered_username'

function LoginPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const registeredUsername = (location.state as { registeredUsername?: string } | null)?.registeredUsername
    const queryClient = useQueryClient()
    const reducedMotion = useReducedMotion()

    const [username, setUsername] = useState(
        () => registeredUsername ?? localStorage.getItem(REMEMBERED_USERNAME_KEY) ?? '',
    )
    const [password, setPassword] = useState('')
    const [rememberUsername, setRememberUsername] = useState(
        () => Boolean(localStorage.getItem(REMEMBERED_USERNAME_KEY)),
    )
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (loading) return

        const normalizedUsername = username.trim()

        setError('')
        setLoading(true)

        try {
            const response = await login({
                username: normalizedUsername,
                password,
            })

            if (rememberUsername) {
                localStorage.setItem(
                    REMEMBERED_USERNAME_KEY,
                    normalizedUsername,
                )
            } else {
                localStorage.removeItem(REMEMBERED_USERNAME_KEY)
            }

            sessionStorage.setItem('questlog_token', response.token)
            queryClient.clear()
            const requestedPath = (location.state as { from?: string } | null)?.from
            navigate(requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
                ? requestedPath : '/home', { replace: true })
        } catch (caughtError) {
            setError(
                caughtError instanceof Error
                    ? caughtError.message
                    : 'Não foi possível entrar. Tente novamente.',
            )
        } finally {
            setLoading(false)
        }
    }

    const enterFromLeft = reducedMotion
        ? false
        : { opacity: 0, x: -24 }

    const enterFromRight = reducedMotion
        ? false
        : { opacity: 0, x: 24 }

    return (
        <div className="login-v2">
            <div className="login-v2__layout">
                <motion.aside
                    className="login-v2__showcase"
                    initial={enterFromLeft}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                >
                    <Link to="/" className="login-v2__brand">
                        <span className="login-v2__brand-icon" aria-hidden="true">
                            Q
                        </span>
                        <span>Questlog</span>
                    </Link>

                    <div className="login-v2__story">
                        <span className="login-v2__eyebrow">
                            SUA JORNADA CONTINUA
                        </span>

                        <h1>
                            Seus jogos.
                            <br />
                            Suas histórias.
                            <br />
                            <span>Seu legado.</span>
                        </h1>

                        <p>
                            Volte para sua biblioteca, acompanhe cada
                            conquista e descubra a próxima aventura.
                        </p>

                        <div
                            className="login-v2__showcase-preview"
                            aria-hidden="true"
                        >
                            <div className="login-v2__preview-heading">
                                <span>NA SUA BIBLIOTECA</span>
                                <span className="login-v2__preview-mark">✦</span>
                            </div>

                            <div className="login-v2__preview-game">
                                <span className="login-v2__preview-art login-v2__preview-art--purple">
                                    ER
                                </span>
                                <div>
                                    <strong>Elden Ring</strong>
                                    <span>RPG de ação</span>
                                </div>
                                <span className="login-v2__preview-status">
                                    Jogando
                                </span>
                            </div>

                            <div className="login-v2__preview-game">
                                <span className="login-v2__preview-art login-v2__preview-art--blue">
                                    HK
                                </span>
                                <div>
                                    <strong>Hollow Knight</strong>
                                    <span>Metroidvania</span>
                                </div>
                                <span className="login-v2__preview-status login-v2__preview-status--done">
                                    Concluído
                                </span>
                            </div>
                        </div>
                    </div>

                    <p className="login-v2__showcase-footnote">
                        Organize. Descubra. Compartilhe.
                    </p>
                </motion.aside>

                <motion.main
                    className="login-v2__main"
                    initial={enterFromRight}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.55, ease: 'easeOut', delay: 0.08 }}
                >
                    <div className="login-v2__main-top">
                        <Link
                            to="/"
                            className="login-v2__mobile-brand"
                            aria-label="Questlog, página inicial"
                        >
                            <span className="login-v2__brand-icon" aria-hidden="true">
                                Q
                            </span>
                            <span>Questlog</span>
                        </Link>

                        <Link to="/" className="login-v2__back">
                            <span aria-hidden="true">←</span>
                            Voltar ao início
                        </Link>
                    </div>

                    <div className="login-v2__form-wrap">
                        <div className="login-v2__heading">
                            <span className="login-v2__eyebrow">BEM-VINDO DE VOLTA</span>
                            <h2>Entre na sua conta</h2>
                            <p>
                                Sua próxima aventura está a um clique.
                            </p>
                        </div>

                        {registeredUsername && (
                            <p className="login-v2__success" role="status">
                                Conta criada com sucesso! Entre com sua senha para começar.
                            </p>
                        )}

                        <form
                            className="login-v2__form"
                            onSubmit={handleSubmit}
                        >
                            <div className="login-v2__field">
                                <label htmlFor="login-username">Usuário</label>
                                <input
                                    id="login-username"
                                    className="ql-input"
                                    type="text"
                                    value={username}
                                    onChange={(event) => {
                                        setUsername(event.target.value)
                                        setError('')
                                    }}
                                    placeholder="Digite seu usuário"
                                    autoComplete="username"
                                    autoCapitalize="none"
                                    spellCheck={false}
                                    maxLength={50}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="login-v2__field">
                                <label htmlFor="login-password">Senha</label>
                                <div className="login-v2__password-wrap">
                                    <input
                                        id="login-password"
                                        className="ql-input"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(event) => {
                                            setPassword(event.target.value)
                                            setError('')
                                        }}
                                        placeholder="Digite sua senha"
                                        autoComplete="current-password"
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="login-v2__password-toggle"
                                        onClick={() => setShowPassword((value) => !value)}
                                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                        aria-pressed={showPassword}
                                        disabled={loading}
                                    >
                                        {showPassword ? 'Ocultar' : 'Mostrar'}
                                    </button>
                                </div>
                            </div>

                            <label className="login-v2__remember">
                                <input
                                    type="checkbox"
                                    checked={rememberUsername}
                                    onChange={(event) =>
                                        setRememberUsername(event.target.checked)
                                    }
                                    disabled={loading}
                                />
                                <span>Lembrar meu usuário neste dispositivo</span>
                            </label>

                            {error && (
                                <p
                                    id="login-error"
                                    className="login-v2__error"
                                    role="alert"
                                >
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                className="ql-button login-v2__submit"
                                disabled={loading}
                            >
                                {loading ? 'Entrando...' : 'Entrar no Questlog'}
                                {!loading && <span aria-hidden="true">→</span>}
                            </button>
                        </form>

                        <div className="login-v2__signup-note">
                            <p>Ainda não tem uma conta?</p>
                            <Link to="/register" className="login-v2__signup-link">
                                Criar minha conta →
                            </Link>
                        </div>
                    </div>

                    <p className="login-v2__security-note">
                        O Questlog não salva sua senha no armazenamento do navegador.
                    </p>
                </motion.main>
            </div>
        </div>
    )
}

export default LoginPage
