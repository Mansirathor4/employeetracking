import React, { useEffect, useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://your-backend-url.com";

export default function AdminActivityLogs({ userId }) {
  const [logs, setLogs] = useState([]);
  const [ratio, setRatio] = useState({ online: 0, idle: 0, offline: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`${BACKEND_URL}/api/activitylog/user/${userId}`)
      .then(res => res.json())
      .then(data => {
        setLogs(data);
        setLoading(false);
      });
    fetch(`${BACKEND_URL}/api/activitylog/user/${userId}/ratio`)
      .then(res => res.json())
      .then(data => setRatio(data));
  }, [userId]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 text-purple-700">Activity Logs</h2>
      <div className="mb-4 flex gap-6">
        <div className="font-semibold bg-green-100 text-green-800 px-3 py-1 rounded">Online: {ratio.online}%</div>
        <div className="font-semibold bg-yellow-100 text-yellow-800 px-3 py-1 rounded">Idle: {ratio.idle}%</div>
        <div className="font-semibold bg-red-100 text-red-800 px-3 py-1 rounded">Offline: {ratio.offline}%</div>
      </div>
      {loading ? <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded">Loading...</div> : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-purple-700 text-white">
                <th className="px-2 py-1">Time</th>
                <th className="px-2 py-1">Type</th>
                <th className="px-2 py-1">Event</th>
                <th className="px-2 py-1">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={idx} className="border-b bg-white text-gray-900 hover:bg-purple-50">
                  <td className="px-2 py-1">{new Date(log.date).toLocaleTimeString()}</td>
                  <td className="px-2 py-1">{log.type}</td>
                  <td className="px-2 py-1">{log.event}</td>
                  <td className="px-2 py-1">{log.details ? JSON.stringify(log.details) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
