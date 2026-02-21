
import React, { useState, useEffect, useRef } from 'react';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://your-backend-url.com';

export default function EmployeeDashboard({ userId }) {
  const [screenshots, setScreenshots] = useState([]);
  const [avatar, setAvatar] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const fileInputRef = useRef();

  // Helper to check if a date string is today
  function isToday(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }

  // On first load, if workStart is not today, stop work and punch-out (auto punch-out logic)
  useEffect(() => {
    const savedStart = localStorage.getItem('workStart');
    const savedWorking = localStorage.getItem('working');
    if (savedStart && savedWorking && JSON.parse(savedWorking) && !isToday(JSON.parse(savedStart))) {
      // Auto punch-out previous session
      fetch(`${BACKEND_URL}/api/attendance/punch-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      // Reset local timer state
      localStorage.setItem('working', JSON.stringify(false));
      localStorage.setItem('workStart', JSON.stringify(null));
      localStorage.setItem('workStop', JSON.stringify(null));
      localStorage.setItem('workSeconds', JSON.stringify(0));
    }
  }, [userId]);

  const [working, setWorking] = useState(() => {
    try {
      const saved = localStorage.getItem('working');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [workStart, setWorkStart] = useState(() => {
    try {
      const saved = localStorage.getItem('workStart');
      return saved && isToday(JSON.parse(saved)) ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [workStop, setWorkStop] = useState(() => {
    try {
      const saved = localStorage.getItem('workStop');
      return saved && isToday(JSON.parse(saved)) ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [workSeconds, setWorkSeconds] = useState(() => {
    try {
      const saved = localStorage.getItem('workSeconds');
      return saved ? JSON.parse(saved) : 0;
    } catch {
      return 0;
    }
  });
  const [tasks, setTasks] = useState([]);
  const [productivity, setProductivity] = useState({ percent: 0, idle: 0 });
  // Attendance: [{date, status, sessions: [{started, stopped}]}]
  const [attendance, setAttendance] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [activityStats, setActivityStats] = useState({ actions: 0, lastActive: '' });

  // Fetch user profile (avatar)
  useEffect(() => {
    if (!userId) return;
    fetch(`${BACKEND_URL}/api/user/profile?id=${userId}`)
      .then(res => res.json())
      .then(data => {
        setAvatar(data.avatar || "");
        setAvatarPreview(data.avatar ? `${BACKEND_URL}${data.avatar}` : "");
      });
  }, [userId]);

  // Handle avatar upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append('avatar', file);
    // Optionally add other fields
    formData.append('id', userId);
    await fetch(`${BACKEND_URL}/api/user/upload-avatar`, {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.avatar) {
          setAvatar(data.avatar);
          setAvatarPreview(`${BACKEND_URL}${data.avatar}`);
        }
      });
  };

  // Fetch screenshots every 10 minutes
  useEffect(() => {
    if (!userId) return;
    const fetchScreenshots = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/screenshot/user/${userId}`);
        const data = await res.json();
        setScreenshots(data.reverse());
      } catch (err) {
        setScreenshots([]);
      }
    };
    fetchScreenshots();
    const interval = setInterval(fetchScreenshots, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId]);

  // Fetch attendance from backend for real-time calendar
  useEffect(() => {
    if (!userId) return;
    fetch(`${BACKEND_URL}/api/attendance/history?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        // Map backend attendance to calendar format
        setAttendance(
          (data || []).map(a => ({
            date: new Date(a.date).toISOString().slice(0, 10),
            status: a.punchIn ? 'Present' : 'Absent',
            sessions: a.sessions || [],
            punchIn: a.punchIn,
            punchOut: a.punchOut
          }))
        );
      });
    // Optionally, poll every few minutes for real-time update
    const interval = setInterval(() => {
      fetch(`${BACKEND_URL}/api/attendance/history?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          setAttendance(
            (data || []).map(a => ({
              date: new Date(a.date).toISOString().slice(0, 10),
              status: a.punchIn ? 'Present' : 'Absent',
              sessions: a.sessions || [],
              punchIn: a.punchIn,
              punchOut: a.punchOut
            }))
          );
        });
    }, 60 * 1000); // 1 min poll
    return () => clearInterval(interval);
  }, [userId]);

  // Working hours calculation
  useEffect(() => {
    let timer;
    if (working && workStart) {
      timer = setInterval(() => {
        const seconds = Math.floor((Date.now() - workStart) / 1000);
        setWorkSeconds(seconds);
        localStorage.setItem('workSeconds', JSON.stringify(seconds));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [working, workStart]);

  // Persist working state
  useEffect(() => {
    localStorage.setItem('working', JSON.stringify(working));
  }, [working]);
  useEffect(() => {
    localStorage.setItem('workStart', JSON.stringify(workStart));
  }, [workStart]);
  useEffect(() => {
    localStorage.setItem('workStop', JSON.stringify(workStop));
  }, [workStop]);

  // Persist attendance to localStorage on change
  useEffect(() => {
    localStorage.setItem('attendance', JSON.stringify(attendance));
  }, [attendance]);

  const handleStartWork = async () => {
    setWorking(true);
    const now = Date.now();
    setWorkStart(now);
    setWorkStop(null);
    setWorkSeconds(0);
    localStorage.setItem('workStart', JSON.stringify(now));
    localStorage.setItem('workStop', JSON.stringify(null));
    localStorage.setItem('workSeconds', JSON.stringify(0));

    // Backend punch-in API call
    await fetch(`${BACKEND_URL}/api/attendance/punch-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
  };
  const handleStopWork = async () => {
    setWorking(false);
    const now = Date.now();
    setWorkStop(now);
    localStorage.setItem('workStop', JSON.stringify(now));
    // Call backend punch-out API
    await fetch(`${BACKEND_URL}/api/attendance/punch-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    // Refresh attendance from backend
    fetch(`${BACKEND_URL}/api/attendance/history?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        setAttendance(
          (data || []).map(a => ({
            date: new Date(a.date).toISOString().slice(0, 10),
            status: a.punchIn ? 'Present' : 'Absent',
            sessions: a.sessions || [],
            punchIn: a.punchIn,
            punchOut: a.punchOut
          }))
        );
      });
  };

  // Format time to HH:mm:ss and to readable time
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, '0');
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };
  const formatClock = (ms) => {
    if (!ms) return '--';
    const d = new Date(ms);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-700 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-4xl font-extrabold text-white mb-4 md:mb-0">Employee Dashboard</h1>
          <button className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded-lg shadow" onClick={() => window.location.reload()}>Logout</button>
        </div>
        <div className="flex items-center gap-6 mb-8">
          <div className="flex flex-col items-center">
            <img
              src={avatarPreview || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
              alt="Profile"
              className="w-24 h-24 rounded-full border-4 border-purple-400 object-cover mb-2"
            />
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
            <button
              className="bg-purple-600 text-white px-4 py-1 rounded shadow hover:bg-purple-700 text-sm"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              {avatarPreview ? "Change Photo" : "Upload Photo"}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-start">
            <span className="text-lg font-semibold text-gray-700">Working Hours</span>
            <span className="text-3xl font-bold mt-2 text-purple-700">{formatTime(workSeconds)}</span>
            <div className="mt-2 text-gray-600 text-sm">
              Start: <span className="font-mono">{workStart ? formatClock(workStart) : '--'}</span>
            </div>
            <div className="text-gray-600 text-sm">
              Stop: <span className="font-mono">{workStop ? formatClock(workStop) : '--'}</span>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={handleStartWork} disabled={working} className={`px-4 py-2 rounded font-bold ${working ? 'bg-gray-300 text-gray-500' : 'bg-green-500 text-white hover:bg-green-600'}`}>Start Work</button>
              <button onClick={handleStopWork} disabled={!working} className={`px-4 py-2 rounded font-bold ${!working ? 'bg-gray-300 text-gray-500' : 'bg-red-500 text-white hover:bg-red-600'}`}>Stop Work</button>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-start">
            <span className="text-lg font-semibold text-gray-700">Productivity</span>
            <span className="text-3xl font-bold mt-2 text-green-600">{productivity.percent}%</span>
            <span className="mt-1 text-sm text-gray-500">Idle: {productivity.idle}%</span>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-start">
            <span className="text-lg font-semibold text-gray-700">Tasks Assigned</span>
            <ul className="mt-2 w-full">
              {tasks.map(task => (
                <li key={task.id} className={`flex justify-between items-center py-1 px-2 rounded ${task.status === 'Completed' ? 'bg-green-100 text-green-700' : task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{task.title}<span className="text-xs font-bold">{task.status}</span></li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-start">
            <span className="text-lg font-semibold text-gray-700">Activity Stats</span>
            <span className="text-3xl font-bold mt-2 text-blue-700">{activityStats.actions}</span>
            <span className="mt-1 text-sm text-gray-500">Last Active: {activityStats.lastActive}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <span className="text-lg font-semibold text-gray-700">Attendance Calendar</span>
            <div className="mt-4 flex flex-col gap-2">
              {attendance.length === 0 && <span className="text-gray-400">No attendance yet.</span>}
              {attendance.map((a, idx) => (
                <div key={idx} className={`px-3 py-2 rounded font-bold bg-green-100 text-green-700 mb-2`}>
                  <div className="mb-1">{a.date}: {a.status}</div>
                  <div className="ml-2 flex flex-col gap-1">
                    {(a.sessions || []).map((s, j) => {
                      let duration = '';
                      if (s.started && s.stopped) {
                        const diff = Math.floor((new Date(s.stopped) - new Date(s.started)) / 1000);
                        const h = Math.floor(diff / 3600).toString().padStart(2, '0');
                        const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
                        const sec = (diff % 60).toString().padStart(2, '0');
                        duration = ` | Duration: ${h}:${m}:${sec}`;
                      }
                      return (
                        <div key={j} className="text-xs text-gray-700">
                          Session {j + 1}: Start: {s.started ? new Date(s.started).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--'}
                          {s.stopped && (
                            <span> | Stop: {new Date(s.stopped).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                          )}
                          {duration}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
