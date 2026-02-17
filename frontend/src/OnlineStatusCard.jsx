import React, { useState, useEffect } from "react";

const statusColors = {
  Online: "bg-green-500",
  Idle: "bg-yellow-400",
  Offline: "bg-gray-400",
};

export default function OnlineStatusCard() {
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    if (open) {
      fetch("/api/users")
        .then((res) => res.json())
        .then((data) => setEmployees(data))
        .catch(() => setEmployees([]));
    }
  }, [open]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-0 mb-6">
      <button
        className="w-full flex items-center justify-between px-6 py-4 focus:outline-none hover:bg-purple-50 rounded-t-xl"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-xl font-bold text-purple-700">Online Status</span>
        <svg className={`w-5 h-5 transform transition-transform ${open ? "rotate-180" : "rotate-0"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="flex flex-wrap gap-6 px-6 pb-6">
          {employees.length === 0 && (
            <div className="text-gray-400 italic">No employees found.</div>
          )}
          {employees.map((emp) => (
            <div key={emp._id} className="flex items-center gap-4 bg-gray-50 rounded-lg p-3 shadow">
              <img src={emp.avatar || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt={emp.name} className="w-12 h-12 rounded-full border-2 border-purple-200" />
              <div>
                <div className="font-semibold text-gray-800">{emp.name}</div>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${statusColors[emp.status] || "bg-gray-300"}`}></span>
                  <span className="text-sm text-gray-600">{emp.status || "Offline"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
