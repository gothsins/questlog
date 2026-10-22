import { useEffect } from 'react'
import { useEndSession } from '../hooks/useEndSession'
import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { getMyProfile } from '../api/profile'
import { getAvatarSrc } from '../api/profile'

function AppHeader() {
    const endSession = useEndSession()

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
            endSession()
        }
    }, [profileError, endSession])

    function handleLogout() {
        endSession()
    }

    return (
        <header className="app-header">
            <div className="app-header__content">

                <NavLink
                    to="/home"
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
                        to="/home"
                        className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}
                    >
                        Início
                    </NavLink>
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
