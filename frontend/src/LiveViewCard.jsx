import React, { useState, useEffect } from 'react';
import ScreenshotGallery from './ScreenshotGallery';
import LiveStreamViewer from './LiveStreamViewer';
import './ScreenshotGallery.css';

export default function LiveViewCard() {
  const [employees, setEmployees] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [liveStreamUser, setLiveStreamUser] = useState(null);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/user/employees`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch employees: ' + res.status);
        return res.json();
      })
      .then(data => {
        setEmployees(data);
        console.log('[LiveViewCard] Employees loaded:', data.length);
      })
      .catch(err => {
        setEmployees([]);
        console.error('[LiveViewCard] Error fetching employees:', err);
      });
  }, []);
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 text-purple-700">Live View</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {employees.map((user, idx) => (
          <div key={user._id} className="flex flex-col items-center bg-gray-50 rounded-lg p-3 shadow" style={{cursor:'pointer',position:'relative'}}>
            <img src={user.avatar ? `${BACKEND_URL}${user.avatar}` : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt={user.name} className="w-32 h-20 rounded-lg object-cover border-2 border-purple-200 mb-2" />
            <div className="font-semibold text-gray-800">{user.name}</div>
            <div className={`text-xs mt-1 px-2 py-1 rounded-full ${user.isActive ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{user.isActive ? "Active" : "Idle"}</div>
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button className="btn btn-primary" style={{fontSize:'0.85em',padding:'4px 10px'}} onClick={() => {console.log('[LiveViewCard] Open screenshot gallery for', user._id); setSelectedUser(user);}}>Screenshots</button>
              <button className="btn btn-success" style={{fontSize:'0.85em',padding:'4px 10px'}} onClick={() => {console.log('[LiveViewCard] Open live streaming for', user._id); setLiveStreamUser(user);}}>Live Streaming</button>
            </div>
          </div>
        ))}
      </div>
      {selectedUser && (
        <ScreenshotGallery
          userId={selectedUser._id}
          userName={selectedUser.name}
          onClose={() => setSelectedUser(null)}
        />
      )}
      {liveStreamUser && (
        <LiveStreamViewer
          userId={liveStreamUser._id}
          userName={liveStreamUser.name}
          onClose={() => setLiveStreamUser(null)}
        />
      )}
    </div>
  );
}
