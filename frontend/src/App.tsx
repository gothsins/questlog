import {
    Navigate,
    Route,
    Routes,
} from 'react-router-dom'

import LoginPage from './pages/LoginPage'
import LibraryPage from './pages/LibraryPage'
import ProtectedRoute from './routes/ProtectedRoute'
import AuthenticatedLayout from './layouts/AuthenticatedLayout'
import ExplorePage from './pages/ExplorePage'

function App() {
    return (
        <Routes>
            <Route
                path="/login"
                element={<LoginPage />}
            />

            <Route element={<ProtectedRoute />}>
                <Route element={<AuthenticatedLayout />}>
                    <Route
                        path="/library"
                        element={<LibraryPage />}
                    />
                    <Route
                        path="/explore"
                        element={<ExplorePage />}
                    />
                </Route>
            </Route>

            <Route
                path="/"
                element={
                    <Navigate
                        to="/login"
                        replace
                    />
                }
            />

            <Route
                path="*"
                element={
                    <Navigate
                        to="/"
                        replace
                    />
                }
            />
        </Routes>
    )
}

export default App