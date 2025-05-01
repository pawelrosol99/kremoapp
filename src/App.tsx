import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LoginForm } from './components/LoginForm';
import { SuperAdminPanel } from './components/SuperAdminPanel';
import { ContractorAdminPanel } from './components/ContractorAdminPanel';
import { WorkerPanel } from './components/WorkerPanel';
import { Toaster } from './components/ui/toaster';
import './index.css';

interface User {
  id: number;
  login: string;
  role: 'super_admin' | 'admin' | 'worker';
  employee_id?: number;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Add Google Fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Navigate to={getRedirectPath(user.role)} /> : <LoginForm />} />
        <Route path="/super-admin" element={
          user && user.role === 'super_admin' ? <SuperAdminPanel /> : <Navigate to="/" />
        } />
        <Route path="/contractor-admin" element={
          user && (user.role === 'admin' || user.role === 'worker') ? <ContractorAdminPanel /> : <Navigate to="/" />
        } />
        <Route path="/worker" element={
          user && user.role === 'worker' ? <WorkerPanel /> : <Navigate to="/" />
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

function getRedirectPath(role: string) {
  switch (role) {
    case 'super_admin': return '/super-admin';
    case 'admin': return '/contractor-admin';
    case 'worker': return '/worker';
    default: return '/';
  }
}

export default App;
