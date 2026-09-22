import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            try {
                const decoded = jwtDecode(token);
                // Check expiry
                if (decoded.exp * 1000 < Date.now()) {
                    console.warn("[Auth] Token expired, logging out");
                    logout();
                } else {
                    const parsed = JSON.parse(storedUser);
                    console.log("[Auth] Session restored for:", parsed.username);
                    setUser(parsed);
                }
            } catch (e) {
                console.error("[Auth] Stored session corrupted", e);
                logout();
            }
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            console.log("[Auth] Attempting login for:", username);
            const response = await api.post('/auth/login', { username, password });
            const { token, user, shop } = response.data;

            const userData = { ...user, shop };

            // Critical: Set state and storage synchronously
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));

            console.log("[Auth] Login successful, user plan:", shop.plan);
            setUser(userData);
            return userData; // Return data so caller can use it immediately if needed
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.message;
            console.error("[Auth] Login failed:", errorMsg);
            throw error;
        }
    };

    const register = async (data) => {
        try {
            const response = await api.post('/auth/register', data);
            const { token, user, shop } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify({ ...user, shop }));
            setUser({ ...user, shop });
            return true;
        } catch (error) {
            console.error("Registration failed", error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const updateUser = (updatedUser) => {
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    const loginWithData = (token, user, shop) => {
        const userData = { ...user, shop };
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('[Auth] Demo/external login, user plan:', shop?.plan);
        setUser(userData);
    };

    return (
        <AuthContext.Provider value={{ user, setUser: updateUser, login, loginWithData, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
