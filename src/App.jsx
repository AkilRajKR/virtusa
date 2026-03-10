import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DocumentUploadPage from './pages/DocumentUploadPage';
import ResultDashboard from './pages/ResultDashboard';
import { AuthProvider } from './context/AuthContext';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/upload" element={<DocumentUploadPage />} />
                    <Route path="/result" element={<ResultDashboard />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
