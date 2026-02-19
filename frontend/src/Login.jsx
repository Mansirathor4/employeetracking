

import React, { useState } from 'react';

<<<<<<< HEAD
const apiUrl = import.meta.env.VITE_BACKEND_URL;
=======
const apiUrl = import.meta.env.VITE_BACKEND_URL || '';
>>>>>>> f5baf6e1142e12cf81cce8165e6174e327ad0c6f
import { useNavigate } from 'react-router-dom';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const res = await fetch(`${apiUrl}/api/user/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role })
        });
        const data = await res.json();
        console.log('Login response:', res);
        console.log('Login data:', data);
        if (res.ok) {
          localStorage.setItem('userId', data.user._id);
          localStorage.setItem('token', data.token);
          localStorage.setItem('role', data.user.role || role);

          // --- Timer/attendance reset logic on login ---
          // Always reset timer state on login
          localStorage.setItem('working', JSON.stringify(false));
          localStorage.setItem('workStart', JSON.stringify(null));
          localStorage.setItem('workStop', JSON.stringify(null));
          localStorage.setItem('workSeconds', JSON.stringify(0));

          // Auto punch-out previous session if needed
          fetch(`${apiUrl}/api/attendance/punch-out`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: data.user._id })
          });

          onLogin(data.user._id);
          // Redirect to dashboard after login
          if ((data.user.role || role) === 'admin') {
            navigate('/admin');
          } else {
            navigate('/employee');
          }
        } else {
          setError(data.error || 'Login failed');
          console.log('Login error:', data.error || 'Login failed');
        }
      } else {
        const res = await fetch(`${apiUrl}/api/user/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role })
        });
        const data = await res.json();
        console.log('Register response:', res);
        console.log('Register data:', data);
        if (res.ok) {
          setIsLogin(true);
          setError('Registration successful! Please login.');
        } else {
          setError(data.error || 'Registration failed');
          console.log('Register error:', data.error || 'Registration failed');
        }
      }
    } catch (err) {
      setError('Network error');
      console.log('Network error:', err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#0f2027] via-[#203a43] to-[#2c5364]">
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-center gap-0 md:gap-8 p-4">
        {/* Left Illustration and Heading */}
        <div className="hidden md:flex flex-col items-center justify-center flex-1 h-full">
          <img src="https://cdni.iconscout.com/illustration/premium/thumb/remote-working-team-4480472-3723272.png" alt="Workforce" className="w-80 mb-6 rounded-xl shadow-xl" />
          <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight text-left">JOIN OUR GLOBAL<br />WORKFORCE</h1>
        </div>
        {/* Right Glass Card */}
        <div className="flex-1 w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-blue-200 p-10 flex flex-col items-center relative">
          {/* Role Toggle Switch */}
          <div className="w-full flex items-center justify-center mb-8">
            <div className="flex items-center bg-[#1a2233] rounded-full px-2 py-2 shadow-inner border border-blue-400">
              <span className={`px-4 py-2 rounded-full text-sm font-bold cursor-pointer transition ${role === 'employee' ? 'bg-linear-to-r from-blue-500 to-blue-400 text-white shadow' : 'text-blue-300'}`}
                onClick={() => setRole('employee')}>
                  {isLogin ? 'LOGIN AS: EMPLOYEE' : 'REGISTER AS: EMPLOYEE'}
              </span>
              <span className={`px-4 py-2 rounded-full text-sm font-bold cursor-pointer transition ml-2 ${role === 'admin' ? 'bg-linear-to-r from-blue-500 to-blue-400 text-white shadow' : 'text-blue-300'}`}
                onClick={() => setRole('admin')}>ADMIN</span>
            </div>
          </div>
          {error && <div className={`mb-4 text-center w-full ${error.includes('success') ? 'text-green-400' : 'text-red-400'}`}>{error}</div>}
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            {!isLogin && (
              <input
                type="text"
                placeholder="FULL NAME"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-3 rounded-lg bg-[#232b3e] text-white placeholder-blue-200 border border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg shadow"
                required
              />
            )}
            <input
              type="email"
              placeholder="WORK EMAIL"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#232b3e] text-white placeholder-blue-200 border border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg shadow"
              required
            />
            <input
              type="password"
              placeholder="PASSWORD"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#232b3e] text-white placeholder-blue-200 border border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg shadow"
              required
            />
            {!isLogin && (
              <input
                type="password"
                placeholder="CONFIRM PASSWORD"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full p-3 rounded-lg bg-[#232b3e] text-white placeholder-blue-200 border border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg shadow"
                required
              />
            )}
            <button
              type="submit"
              className="w-full bg-linear-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-3 rounded-lg text-lg shadow-lg transition duration-150 mt-2 tracking-wide"
              disabled={loading}
            >
              {loading ? (isLogin ? 'Signing In...' : 'Registering...') : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
          </form>
          <div className="mt-6 text-center w-full flex flex-col items-center">
            {isLogin ? (
              <span>
                <button className="text-blue-200 hover:text-white font-semibold underline underline-offset-2 mt-2" onClick={() => setIsLogin(false)}>
                  Don't have an account? Sign up
                </button>
              </span>
            ) : (
              <span>
                <button className="text-blue-200 hover:text-white font-semibold underline underline-offset-2 mt-2" onClick={() => setIsLogin(true)}>
                  Already have your account? Log in
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
