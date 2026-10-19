import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'

import { register } from '../api/auth'
import { registrationPasswordError } from './registrationPassword'
import '../styles/login.css'
import '../styles/register.css'

function RegisterPage() {
    const navigate = useNavigate()
    const reducedMotion = useReducedMotion()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (loading) return

        const normalizedUsername = username.trim()
        setError('')

        if (normalizedUsername.length < 3 || normalizedUsername.length > 50) {
            setError('O usuário deve ter entre 3 e 50 caracteres.')
            return
        }

        const passwordError = registrationPasswordError(password)
        if (passwordError) {
            setError(passwordError)
            return
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.')
            return
        }

        setLoading(true)
        try {
            await register({ username: normalizedUsername, password })

            navigate('/login', {
                replace: true,
                state: { registeredUsername: normalizedUsername },
            })
        } catch (caughtError) {
            setError(
                caughtError instanceof Error
                    ? caughtError.message
                    : 'Não foi possível criar sua conta. Tente novamente.',
            )
        } finally {
            setLoading(false)
        }
    }

    const leftStart = reducedMotion ? false : { opacity: 0, x: -24 }
    const rightStart = reducedMotion ? false : { opacity: 0, x: 24 }

    return (
        <div className="login-v2 register-v2">
            <div className="login-v2__layout">
                <motion.aside
                    className="login-v2__showcase"
                    initial={leftStart}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                >
                    <Link to="/" className="login-v2__brand">
                        <span className="login-v2__brand-icon" aria-hidden="true">Q</span>
                        <span>Questlog</span>
                    </Link>

                    <div className="login-v2__story">
                        <span className="login-v2__eyebrow">UMA NOVA JORNADA COMEÇA</span>
                        <h1>
                            Descubra.<br />
                            Organize.<br />
                            <span>Compartilhe.</span>
                        </h1>
                        <p>
                            Crie sua biblioteca, acompanhe cada conquista e transforme
                            os jogos que você ama em histórias para recordar.
                        </p>

                        <div className="register-v2__steps" aria-hidden="true">
                            <div><span>01</span><strong>Crie sua conta</strong><small>Seu espaço no Questlog.</small></div>
                            <div><span>02</span><strong>Monte sua biblioteca</strong><small>Jogando, concluídos ou na lista.</small></div>
                            <div><span>03</span><strong>Compartilhe sua jornada</strong><small>Seu perfil, seus jogos, suas opiniões.</small></div>
                        </div>
                    </div>
                    <p className="login-v2__showcase-footnote">Cada grande jornada começa por um primeiro jogo.</p>
                </motion.aside>

                <motion.main
                    className="login-v2__main"
                    initial={rightStart}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.55, ease: 'easeOut', delay: 0.08 }}
                >
                    <div className="login-v2__main-top">
                        <Link to="/" className="login-v2__mobile-brand" aria-label="Questlog, página inicial">
                            <span className="login-v2__brand-icon" aria-hidden="true">Q</span>
                            <span>Questlog</span>
                        </Link>
                        <Link to="/login" className="login-v2__back">
                            <span aria-hidden="true">←</span> Voltar ao login
                        </Link>
                    </div>

                    <div className="login-v2__form-wrap">
                        <div className="login-v2__heading">
                            <span className="login-v2__eyebrow">JUNTE-SE AO QUESTLOG</span>
                            <h2>Crie sua conta</h2>
                            <p>Sua jornada pelos jogos começa aqui.</p>
                        </div>

                        <form className="login-v2__form" onSubmit={handleSubmit}>
                            <div className="login-v2__field">
                                <label htmlFor="register-username">Usuário</label>
                                <input
                                    id="register-username"
                                    className="ql-input"
                                    type="text"
                                    value={username}
                                    onChange={(event) => { setUsername(event.target.value); setError('') }}
                                    placeholder="Como você quer entrar?"
                                    autoComplete="username"
                                    autoCapitalize="none"
                                    spellCheck={false}
                                    minLength={3}
                                    maxLength={50}
                                    disabled={loading}
                                    required
                                    aria-describedby="register-username-help"
                                />
                                <small id="register-username-help" className="register-v2__help">De 3 a 50 caracteres.</small>
                            </div>

                            <div className="login-v2__field">
                                <label htmlFor="register-password">Senha</label>
                                <div className="login-v2__password-wrap">
                                    <input
                                        id="register-password"
                                        className="ql-input"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(event) => { setPassword(event.target.value); setError('') }}
                                        placeholder="Crie uma senha"
                                        autoComplete="new-password"
                                        disabled={loading}
                                        required
                                        aria-describedby="register-password-help"
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
                                <small id="register-password-help" className="register-v2__help">Pelo menos 8 caracteres e no máximo 72 bytes em UTF-8. Evite senhas comuns.</small>
                            </div>

                            <div className="login-v2__field">
                                <label htmlFor="register-confirm-password">Confirmar senha</label>
                                <div className="login-v2__password-wrap">
                                    <input
                                        id="register-confirm-password"
                                        className="ql-input"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(event) => { setConfirmPassword(event.target.value); setError('') }}
                                        placeholder="Digite a senha novamente"
                                        autoComplete="new-password"
                                        disabled={loading}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="login-v2__password-toggle"
                                        onClick={() => setShowConfirmPassword((value) => !value)}
                                        aria-label={showConfirmPassword ? 'Ocultar confirmação da senha' : 'Mostrar confirmação da senha'}
                                        aria-pressed={showConfirmPassword}
                                        disabled={loading}
                                    >
                                        {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
                                    </button>
                                </div>
                            </div>

                            {error && <p className="login-v2__error" role="alert">{error}</p>}

                            <button type="submit" className="ql-button login-v2__submit" disabled={loading}>
                                {loading ? 'Criando conta...' : 'Criar minha conta'}
                                {!loading && <span aria-hidden="true">→</span>}
                            </button>
                        </form>

                        <div className="login-v2__signup-note">
                            <p>Já tem uma conta?</p>
                            <Link to="/login" className="register-v2__account-link">Entrar no Questlog →</Link>
                        </div>
                    </div>
                    <p className="login-v2__security-note">Nunca compartilhe sua senha. Seus dados de acesso são enviados à nossa API.</p>
                </motion.main>
            </div>
        </div>
    )
}

export default RegisterPage
