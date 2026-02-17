import React, { useEffect, useState } from "react";

export default function AdminAttendanceReport() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/attendance/admin/all`)
      .then(res => res.json())
      .then(data => {
        setAttendance(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 text-purple-700">Attendance Report (All Employees)</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-purple-700 text-white">
                <th className="px-2 py-1">Employee</th>
                <th className="px-2 py-1">Date</th>
                <th className="px-2 py-1">Sessions</th>
                <th className="px-2 py-1">Punch In</th>
                <th className="px-2 py-1">Punch Out</th>
                <th className="px-2 py-1">Total Hours</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((a, idx) => (
                <tr key={idx} className="border-b bg-white text-gray-900 hover:bg-purple-50">
                  <td className="px-2 py-1 font-semibold">{a.user?.name || a.user?.email || "-"}</td>
                  <td className="px-2 py-1">{new Date(a.date).toLocaleDateString()}</td>
                  <td className="px-2 py-1">
                    {(a.sessions || []).map((s, j) => (
                      <div key={j}>
                        Session {j + 1}: {s.started ? new Date(s.started).toLocaleTimeString() : "--"} - {s.stopped ? new Date(s.stopped).toLocaleTimeString() : "--"}
                      </div>
                    ))}
                  </td>
                  <td className="px-2 py-1">{a.punchIn ? new Date(a.punchIn).toLocaleTimeString() : "--"}</td>
                  <td className="px-2 py-1">{a.punchOut ? new Date(a.punchOut).toLocaleTimeString() : "--"}</td>
                  <td className="px-2 py-1 font-mono">
                    {a.punchIn && a.punchOut ? (() => {
                      const diff = (new Date(a.punchOut) - new Date(a.punchIn)) / 1000;
                      const h = Math.floor(diff / 3600).toString().padStart(2, '0');
                      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
                      const s = Math.floor(diff % 60).toString().padStart(2, '0');
                      return `${h}:${m}:${s}`;
                    })() : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
