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
