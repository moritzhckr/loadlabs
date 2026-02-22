import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // If we have a token but no user, try to silently fetch the current user profile
        if (token && !user) {
            // For now, we simulate a fake user to keep things going since we didn't hook up a /me endpoint yet
            setUser({ email: 'user@example.com' });
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [token, user]);

    const login = (newToken) => {
        setToken(newToken);
        localStorage.setItem('token', newToken);
        setUser({ email: 'user@example.com' }); // Mock user
        navigate('/');
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
