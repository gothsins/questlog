import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import LibraryPage from './pages/LibraryPage'
import ProtectedRoute from './routes/ProtectedRoute'

function App() {
    return (
        <Routes>
            <Route
                path="/login"
                element={<LoginPage />}
            />

            <Route element={<ProtectedRoute />}>
                <Route
                    path="/library"
                    element={<LibraryPage />}
                />
            </Route>

            <Route
                path="/"
                element={<Navigate to="/login" replace />}
            />

            <Route
                path="*"
                element={<Navigate to="/" replace />}
            />
        </Routes>
    )
}

export default App