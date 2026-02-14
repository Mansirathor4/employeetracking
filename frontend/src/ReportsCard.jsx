import React from "react";
const reports = [
  { title: "Time Tracker", value: "7h 45m", icon: "fa-solid fa-clock", color: "bg-blue-100 text-blue-700" },
  { title: "Productive vs Idle", value: "87% / 13%", icon: "fa-solid fa-chart-line", color: "bg-green-100 text-green-700" },
  { title: "Activity Log", value: "124 actions", icon: "fa-solid fa-list", color: "bg-purple-100 text-purple-700" },
  { title: "Project Report", value: "CRM App: 90% done", icon: "fa-solid fa-diagram-project", color: "bg-pink-100 text-pink-700" },
];

export default function ReportsCard() {
  return (
    <div>
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-purple-700">Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report, idx) => (
            <div key={idx} className={`flex items-center gap-4 rounded-lg p-3 shadow ${report.color}`}> 
              <i className={report.icon + " text-2xl mr-2"}></i>
              <div>
                <div className="font-semibold">{report.title}</div>
                <div className="text-sm">{report.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
