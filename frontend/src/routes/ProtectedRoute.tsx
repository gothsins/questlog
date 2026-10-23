import { getToken } from '../api/session'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

function ProtectedRoute() {
    const location = useLocation()
    const token = getToken()

    if (!token) {
        return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
    }

    return <Outlet />
}

export default ProtectedRoute
