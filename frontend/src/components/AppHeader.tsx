import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { getMyProfile } from '../api/profile'
import { getAvatarSrc } from '../api/profile'

function AppHeader() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const {
        data: profile,
        error: profileError,
    } = useQuery({
        queryKey: ['my-profile'],
        queryFn: getMyProfile,
        staleTime: 5 * 60 * 1000,
        retry: false,
    })

    const displayName =
        profile?.nickname || profile?.username || 'Jogador'

    const initial = displayName.charAt(0).toUpperCase()
    const avatarSrc = getAvatarSrc(profile?.avatarUrl)

    useEffect(() => {
        if (profileError?.message === 'SESSION_EXPIRED') {
            sessionStorage.removeItem('questlog_token')
            queryClient.clear()
            navigate('/login', { replace: true })
        }
    }, [profileError, queryClient, navigate])

    function handleLogout() {
        sessionStorage.removeItem('questlog_token')
        queryClient.clear()
        navigate('/login', { replace: true })
    }

    return (
        <header className="app-header">
            <div className="app-header__content">

                <NavLink
                    to="/library"
                    className="app-brand"
                >
                    <div className="app-brand__logo">
                        Q
                    </div>

                    <span>Questlog</span>
                </NavLink>

                <nav
                    className="app-navigation"
                    aria-label="Navegação principal"
                >
                    <NavLink
                        to="/explore"
                        className={({ isActive }) =>
                            isActive
                                ? 'nav-link nav-link--active'
                                : 'nav-link'
                        }
                    >
                        Explorar
                    </NavLink>

                    <NavLink
                        to="/library"
                        className={({ isActive }) =>
                            isActive
                                ? 'nav-link nav-link--active'
                                : 'nav-link'
                        }
                    >
                        Biblioteca
                    </NavLink>

                    <NavLink
                        to="/profile"
                        className="app-profile-link"
                        aria-label={`Meu perfil: ${displayName}`}
                    >
                        <span className="app-profile-avatar">
                            {avatarSrc ? (
                                <img
                                    src={avatarSrc}
                                    alt=""
                                />
                            ) : (
                                initial
                            )}
                        </span>

                        <span className="app-profile-name">
                            {displayName}
                        </span>
                    </NavLink>

                    <button
                        type="button"
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        Sair
                    </button>
                </nav>
            </div>
        </header>
    )
}

export default AppHeader
