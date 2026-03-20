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
import PatientDashboard from './pages/PatientDashboard';
import DoctorCasesPage from './pages/DoctorCasesPage';
import InsuranceDashboard from './pages/InsuranceDashboard';

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

                {/* Shared dashboard — role-aware redirect inside DashboardPage */}
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

                {/* Doctor / Admin */}
                <Route path="/upload" element={<ProtectedRoute roles={['doctor','admin']}><DocumentUploadPage /></ProtectedRoute>} />
                <Route path="/doctor/cases" element={<ProtectedRoute roles={['doctor','admin']}><DoctorCasesPage /></ProtectedRoute>} />
                <Route path="/result" element={<ProtectedRoute><ResultDashboard /></ProtectedRoute>} />
                <Route path="/result/:authId" element={<ProtectedRoute><ResultDashboard /></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />

                {/* Patient */}
                <Route path="/patient" element={<ProtectedRoute roles={['patient']}><PatientDashboard /></ProtectedRoute>} />

                {/* Insurance */}
                <Route path="/insurance" element={<ProtectedRoute roles={['insurance','admin']}><InsuranceDashboard /></ProtectedRoute>} />

                {/* Admin */}
                <Route path="/audit" element={<ProtectedRoute roles={['admin','insurance']}><AuditTrailPage /></ProtectedRoute>} />

                <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
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
