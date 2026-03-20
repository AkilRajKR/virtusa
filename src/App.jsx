<<<<<<< HEAD
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DocumentUploadPage from './pages/DocumentUploadPage';
import ResultDashboard from './pages/ResultDashboard';
import HistoryPage from './pages/HistoryPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) return null;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    
    return (
        <>
            <Navbar />
            {children}
        </>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    
                    <Route path="/upload" element={
                        <ProtectedRoute>
                            <DocumentUploadPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/result" element={
                        <ProtectedRoute>
                            <ResultDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/history" element={
                        <ProtectedRoute>
                            <HistoryPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/" element={<Navigate to="/upload" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
=======
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DocumentUploadPage from './pages/DocumentUploadPage';
import ResultDashboard from './pages/ResultDashboard';
import HistoryPage from './pages/HistoryPage';
import AuditTrailPage from './pages/AuditTrailPage';

function ProtectedRoute({ children, roles }) {
    const { isAuthenticated, user } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
    return children;
}

function AppRoutes() {
    const { isAuthenticated } = useAuth();
    return (
        <>
            <Navbar />
            <Routes>
                <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/upload" element={<ProtectedRoute roles={['doctor','admin']}><DocumentUploadPage /></ProtectedRoute>} />
                <Route path="/result" element={<ProtectedRoute><ResultDashboard /></ProtectedRoute>} />
                <Route path="/result/:authId" element={<ProtectedRoute><ResultDashboard /></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
                <Route path="/audit" element={<ProtectedRoute roles={['admin','insurance']}><AuditTrailPage /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
            </Routes>
        </>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}
>>>>>>> dashboard
