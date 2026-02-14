import React, { useState, useEffect } from "react";

export default function CustomAlertsCard() {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (open) {
      fetch("/api/alerts")
        .then((res) => res.json())
        .then((data) => setAlerts(data))
        .catch(() => setAlerts([]));
    }
  }, [open]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-0 mb-6">
      <button
        className="w-full flex items-center justify-between px-6 py-4 focus:outline-none hover:bg-purple-50 rounded-t-xl"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-xl font-bold text-purple-700">Custom Alerts</span>
        <svg className={`w-5 h-5 transform transition-transform ${open ? "rotate-180" : "rotate-0"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="flex flex-col gap-4 px-6 pb-6">
          {alerts.length === 0 && (
            <div className="text-gray-400 italic">No alerts found.</div>
          )}
          {alerts.map((alert, idx) => (
            <div key={idx} className={`flex items-center gap-4 rounded-lg p-3 shadow ${alert.color || "bg-gray-100 text-gray-700"}`}> 
              <i className={(alert.icon || "fa-solid fa-bell") + " text-2xl mr-2"}></i>
              <div>
                <div className="font-semibold">{alert.type}</div>
                <div className="text-sm">{alert.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
