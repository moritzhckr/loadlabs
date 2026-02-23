import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ThemeProvider from './context/ThemeContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import StravaCallback from './pages/StravaCallback';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

const PrivateRoute = ({ children }) => {
    const { token, isLoading } = useAuth();

    if (isLoading) {
        return <div className="h-screen w-screen flex items-center justify-center text-white bg-slate-900">Lädt...</div>;
    }

    return token ? children : <Navigate to="/login" />;
};

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/oauth/strava/callback" element={<StravaCallback />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={
                    <PrivateRoute>
                        <Profile />
                    </PrivateRoute>
                } />
            <Route
                path="/"
                element={
                    <PrivateRoute>
                        <Dashboard />
                    </PrivateRoute>
                }
            />
        </Routes>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <ThemeProvider>
                    <AppRoutes />
                </ThemeProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
