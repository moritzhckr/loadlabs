import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Lock, Mail, ArrowRight, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Register() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // In real life point to exact URL 
    const API_URL = "http://localhost:8080";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Register User
            const res = await fetch(`${API_URL}/api/v1/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                throw new Error('Registrierung fehlgeschlagen');
            }

            // 2. Auto-Login
            const formBody = new URLSearchParams();
            formBody.append('username', email);
            formBody.append('password', password);

            const loginRes = await fetch(`${API_URL}/api/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formBody.toString(),
            });

            if (!loginRes.ok) throw new Error('Auto-Login fehlgeschlagen');

            const data = await loginRes.json();
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
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--ring)] opacity-10 blur-[120px] rounded-full mix-blend-screen animate-pulse duration-[10s]"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 opacity-10 blur-[120px] rounded-full mix-blend-screen"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-md w-full relative z-10"
            >
                <div className="glass-card p-8 rounded-3xl">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[var(--ring)] to-orange-400 mb-6 shadow-lg shadow-orange-500/30">
                            <UserIcon className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-[var(--foreground)] font-sans tracking-tight">Account erstellen</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            Starte jetzt mit deinem persönlichen Sport Dashboard
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
                                    placeholder="Dein Passwort wählen"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-[var(--ring)] to-orange-500 hover:from-orange-500 hover:to-orange-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--ring)] focus:ring-offset-slate-900 transition-all shadow-lg shadow-orange-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Account wird erstellt...
                                </span>
                            ) : (
                                <span className="flex items-center">
                                    Kostenlos registrieren
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center bg-slate-900/30 p-4 rounded-xl border border-slate-800/50">
                        <p className="text-sm text-slate-400">
                            Bereits einen Account?{' '}
                            <Link to="/login" className="font-semibold text-white hover:text-[var(--ring)] transition-colors">
                                Hier einloggen
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
