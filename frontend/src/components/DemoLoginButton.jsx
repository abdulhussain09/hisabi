import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Sparkles, Loader2 } from 'lucide-react';

export const DemoLoginButton = () => {
    const { loginWithData } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleDemoLogin = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.post('/auth/demo-login');
            if (res.data && res.data.token) {
                loginWithData(res.data.token, res.data.user, res.data.shop);
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Demo login error:', err);
            setError(err.response?.data?.error || 'Demo login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full mt-3">
            <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 group disabled:opacity-70"
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                    <>
                        <Sparkles className="w-4 h-4 text-amber-200 group-hover:rotate-12 transition-transform" />
                        <span>Try Instant Demo</span>
                    </>
                )}
            </button>
            {error && <p className="text-xs text-red-500 text-center mt-1 font-bold">{error}</p>}
        </div>
    );
};

export default DemoLoginButton;
