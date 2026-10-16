import {
    Navigate, Route, Routes,} from 'react-router-dom'

import RegisterPage from './pages/RegisterPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import LibraryPage from './pages/LibraryPage'
import ProtectedRoute from './routes/ProtectedRoute'
import AuthenticatedLayout from './layouts/AuthenticatedLayout'
import ExplorePage from './pages/ExplorePage'
import GameDetailsPage from './pages/GameDetailsPage'
import ProfilePage from './pages/ProfilePage'

function App() {
    return (
        <Routes>
            <Route
                path="/login"
                element={<LoginPage />}
            />
            <Route
                path="/register"
                element={<RegisterPage />}
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
                <Route
                    path="/games/:gameId"
                    element={<GameDetailsPage />}
                />
            </Route>

            <Route
                path="/profile"
                element={<ProfilePage />}
            />

            <Route
                path="/"
                element={<LandingPage />}
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