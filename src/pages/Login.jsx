import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Lock, Mail, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // In real life, point to backend config. We use the updated port 8080.
    const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.20.112:8000';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const formBody = new URLSearchParams();
            formBody.append('username', email); // OAuth2 expects username
            formBody.append('password', password);

            const res = await fetch(`${API_URL}/api/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formBody.toString(),
            });

            if (!res.ok) {
                throw new Error('E-Mail oder Passwort falsch');
            }

            const data = await res.json();
            login(data.access_token);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 sm:px-6 lg:px-8 relative overflow-hidden dark">
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--ring)] opacity-10 blur-[120px] rounded-full mix-blend-screen animate-pulse duration-[10s]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 opacity-10 blur-[120px] rounded-full mix-blend-screen"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-md w-full relative z-10"
            >
                <div className="glass-card p-8 rounded-3xl">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[var(--ring)] to-purple-400 mb-6 shadow-lg shadow-purple-500/30">
                            <Activity className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-[var(--foreground)] font-sans tracking-tight">Willkommen zurück</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            Melde dich an um deine Performance auszuwerten
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 text-sm text-red-400 bg-red-900/20 border border-red-500/20 rounded-lg text-center">
                                {error}
                            </motion.div>
                        )}

                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[var(--ring)] transition-colors">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    required
                                    className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-100 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all placeholder:text-slate-500 shadow-inner"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[var(--ring)] transition-colors">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-100 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all placeholder:text-slate-500 shadow-inner"
                                    placeholder="Passwort"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="text-sm">
                                <a href="#" className="font-medium text-[var(--ring)] hover:text-purple-400 transition-colors">
                                    Passwort vergessen?
                                </a>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-[var(--ring)] to-purple-500 hover:from-purple-500 hover:to-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--ring)] focus:ring-offset-slate-900 transition-all shadow-lg shadow-purple-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Wird angemeldet...
                                </span>
                            ) : (
                                <span className="flex items-center">
                                    Einloggen
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center bg-slate-900/30 p-4 rounded-xl border border-slate-800/50">
                        <p className="text-sm text-slate-400">
                            Neu hier?{' '}
                            <Link to="/register" className="font-semibold text-white hover:text-[var(--ring)] transition-colors">
                                Kostenlos registrieren
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
