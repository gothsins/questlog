import { NavLink, useNavigate } from 'react-router-dom'

function AppHeader() {
    const navigate = useNavigate()

    function handleLogout() {
        sessionStorage.removeItem('questlog_token')
        navigate('/login')
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

                <nav className="app-navigation">
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

                    <button
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