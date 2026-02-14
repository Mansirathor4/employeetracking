import { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import EmployeeDashboard from './EmployeeDashboard';
import AdminDashboard from './AdminDashboard';
import Login from './Login';

function App() {
  const [userId, setUserId] = useState(localStorage.getItem('userId') || '');
  const [role, setRole] = useState(localStorage.getItem('role') || '');
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  // Utility: force logout
  const forceLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('token');
    setUserId('');
    setRole('');
    setToken('');
  };

  // Always check localStorage on mount (handles manual localStorage changes)
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId') || '';
    const storedRole = localStorage.getItem('role') || '';
    const storedToken = localStorage.getItem('token') || '';
    setUserId(storedUserId);
    setRole(storedRole);
    setToken(storedToken);
    // If userId, role, or token is missing, force logout
    if (!storedUserId || !storedRole || !storedToken) {
      forceLogout();
    }
  }, []);

  // Update role on login
  const handleLogin = (id) => {
    setUserId(id);
    setRole(localStorage.getItem('role') || '');
    setToken(localStorage.getItem('token') || '');
  };

  // If not logged in, always redirect to login
  const isLoggedIn = userId && role && token;

  return (
    <Router>
      <Routes>
        {/* Always show Login page at / and /login, regardless of login state */}
        <Route path="/" element={<Login onLogin={handleLogin} />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        {/* Dashboards only accessible if logged in, else show nothing or redirect to login */}
        <Route
          path="/employee"
          element={isLoggedIn && role === 'employee' ? <EmployeeDashboard userId={userId} /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/admin"
          element={isLoggedIn && role === 'admin' ? <AdminDashboard /> : <Login onLogin={handleLogin} />}
        />
        {/* Catch-all: show Login page */}
        <Route path="*" element={<Login onLogin={handleLogin} />} />
      </Routes>
    </Router>
  );
}

export default App;
