import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Restore session from localStorage
        const token = localStorage.getItem('surecare_token');
        const savedUser = localStorage.getItem('surecare_user');
        if (token && savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch {
                localStorage.removeItem('surecare_token');
                localStorage.removeItem('surecare_user');
            }
        }
        setLoading(false);
    }, []);

    const login = useCallback(async (email, password) => {
        setError(null);
        try {
            const res = await api.post('/api/auth/login', { email, password });
            const { token, user: userData } = res.data;
            localStorage.setItem('surecare_token', token);
            localStorage.setItem('surecare_user', JSON.stringify(userData));
            setUser(userData);
            return userData;
        } catch (err) {
            const msg = err.response?.data?.detail || 'Login failed';
            setError(msg);
            throw new Error(msg);
        }
    }, []);

    const register = useCallback(async (email, name, password, role) => {
        setError(null);
        try {
            const res = await api.post('/api/auth/register', { email, name, password, role });
            const { token, user: userData } = res.data;
            localStorage.setItem('surecare_token', token);
            localStorage.setItem('surecare_user', JSON.stringify(userData));
            setUser(userData);
            return userData;
        } catch (err) {
            const msg = err.response?.data?.detail || 'Registration failed';
            setError(msg);
            throw new Error(msg);
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('surecare_token');
        localStorage.removeItem('surecare_user');
        setUser(null);
    }, []);

    const isAuthenticated = !!user;
    const isDoctor = user?.role === 'doctor';
    const isInsurance = user?.role === 'insurance';
    const isAdmin = user?.role === 'admin';
    const hasRole = useCallback((role) => user?.role === role, [user]);

    return (
        <AuthContext.Provider value={{
            user, isAuthenticated, loading, error,
            login, register, logout,
            isDoctor, isInsurance, isAdmin, hasRole,
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
