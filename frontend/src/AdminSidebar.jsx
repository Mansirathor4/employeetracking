import React, { useState } from "react";

const sidebarItems = [
  { label: "Dashboard", icon: "fa-solid fa-gauge" },
  { label: "Team", icon: "fa-solid fa-users" },
  { label: "Live Tracking", icon: "fa-solid fa-eye", children: [
    { label: "Screenshot", icon: "fa-solid fa-image" },
    { label: "Live Streaming", icon: "fa-solid fa-video" },
  ] },
  { label: "Reports", icon: "fa-solid fa-file-lines", children: [
    { label: "Time Tracker", icon: "fa-solid fa-clock" },
    { label: "Productive vs Idle", icon: "fa-solid fa-chart-line" },
    { label: "Activity Logs", icon: "fa-solid fa-list" },
    { label: "Attendance", icon: "fa-solid fa-calendar-check" },
  ] },
  { label: "Projects and Task", icon: "fa-solid fa-diagram-project", children: [
    { label: "Project", icon: "fa-solid fa-folder-open" },
    { label: "Task", icon: "fa-solid fa-tasks" },
  ] },
  { label: "Time", icon: "fa-solid fa-clock", children: [
    { label: "Task Completion", icon: "fa-solid fa-check-circle" },
    { label: "Time Entry", icon: "fa-solid fa-calendar-plus" },
  ] },
];

export default function AdminSidebar({ onSectionSelect }) {
  const [openDropdown, setOpenDropdown] = useState({});

  const handleDropdown = (label) => {
    setOpenDropdown((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleSectionClick = (label) => {
    if (onSectionSelect) onSectionSelect(label);
  };

  return (
    <aside className="bg-white text-gray-800 w-64 min-h-screen shadow-lg border-r border-gray-200 flex flex-col">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-200">
        <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Logo" className="w-10 h-10" />
        <span className="font-bold text-xl text-purple-700">MeraMonitor</span>
      </div>
      <nav className="flex-1 px-4 py-6">
        {sidebarItems.map((item, idx) => (
          <div key={item.label} className="mb-2">
            <div
              className={`flex items-center gap-3 text-lg font-semibold py-2 px-3 rounded-lg hover:bg-purple-100 cursor-pointer transition ${item.children ? "justify-between" : ""}`}
              onClick={() => item.children ? handleDropdown(item.label) : handleSectionClick(item.label)}
            >
              <span className="flex items-center gap-3">
                <i className={item.icon + " text-purple-500"}></i>
                <span>{item.label}</span>
              </span>
              {item.children && (
                <svg className={`w-4 h-4 ml-auto transition-transform ${openDropdown[item.label] ? "rotate-90" : "rotate-0"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
            {item.children && openDropdown[item.label] && (
              <div className="ml-8">
                {item.children.map((child) => (
                  <div key={child.label} className="flex items-center gap-2 text-base py-1 px-2 rounded hover:bg-purple-50 cursor-pointer" onClick={() => handleSectionClick(child.label)}>
                    <i className={child.icon + " text-purple-400"}></i>
                    <span>{child.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
