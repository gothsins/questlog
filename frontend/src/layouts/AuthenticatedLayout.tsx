import { Outlet } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import '../styles/app-shell.css'

function AuthenticatedLayout() {
    return (
        <div className="app-shell">
            <AppHeader />

            <main className="app-content">
                <Outlet />
            </main>
        </div>
    )
}

export default AuthenticatedLayout