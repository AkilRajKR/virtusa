import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const MOCK_USERS = {
    doctor: {
        id: 1,
        name: 'Dr. Sarah Mitchell',
        role: 'doctor',
        email: 'dr.mitchell@hospital.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=doctor',
        department: 'Orthopedics'
    },
    reviewer: {
        id: 2,
        name: 'James Carter',
        role: 'reviewer',
        email: 'j.carter@bluecross.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=reviewer',
        department: 'Claims Review'
    },
    admin: {
        id: 3,
        name: 'Lisa Thompson',
        role: 'admin',
        email: 'l.thompson@hospital.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        department: 'Hospital Administration'
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('mock_user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const login = (role) => {
        const mockUser = MOCK_USERS[role] || MOCK_USERS.doctor;
        setUser(mockUser);
        localStorage.setItem('mock_user', JSON.stringify(mockUser));
        return mockUser;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('mock_user');
    };

    const isAuthenticated = !!user;

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading: false, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
