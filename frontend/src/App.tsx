import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from './routes/ProtectedRoute'

const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const LibraryPage = lazy(() => import('./pages/LibraryPage'))
const HomePage = lazy(() => import('./pages/HomePage'))
const AuthenticatedLayout = lazy(() => import('./layouts/AuthenticatedLayout'))
const ExplorePage = lazy(() => import('./pages/ExplorePage'))
const GameDetailsPage = lazy(() => import('./pages/GameDetailsPage'))
const DiscoveryGameDetailsPage = lazy(() => import('./pages/DiscoveryGameDetailsPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))

function App() {
    return (
        <Suspense fallback={<div role="status" className="route-loading">Carregando página...</div>}>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                <Route element={<ProtectedRoute />}>
                    <Route element={<AuthenticatedLayout />}>
                        <Route path="/home" element={<HomePage />} />
                        <Route path="/library" element={<LibraryPage />} />
                        <Route path="/explore" element={<ExplorePage />} />
                    </Route>
                    <Route path="/games/igdb/:igdbId" element={<DiscoveryGameDetailsPage />} />
                    <Route path="/games/:gameId" element={<GameDetailsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                </Route>

                <Route path="/" element={<LandingPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    )
}

export default App
