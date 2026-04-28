import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import CreatePollPage from './pages/CreatePollPage';
import EditPollPage from './pages/EditPollPage';
import VotingDetailPage from './pages/VotingDetailPage';
import ResultsPage from './pages/ResultsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import './index.css';

// ProtectedRoute component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-brand rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Routes>
            {/* Auth pages — no navbar/footer */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* App pages — with navbar/footer */}
            <Route path="/*" element={
              <>
                <Navbar />
                <main className="flex-1 w-full">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    
                    {/* Protected Routes */}
                    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                    <Route path="/create" element={<ProtectedRoute><CreatePollPage /></ProtectedRoute>} />
                    <Route path="/edit/:id" element={<ProtectedRoute><EditPollPage /></ProtectedRoute>} />
                    <Route path="/votings/:id" element={<ProtectedRoute><VotingDetailPage /></ProtectedRoute>} />
                    <Route path="/results/:id" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
                  </Routes>
                </main>
                <Footer />
              </>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
