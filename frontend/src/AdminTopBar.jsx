import React from "react";

export default function AdminTopBar() {
  return (
    <header className="flex items-center justify-between px-8 py-4 bg-linear-to-r from-purple-700 via-indigo-600 to-blue-500 shadow-md">
      <div className="flex items-center gap-4">
        <span className="text-white font-bold text-2xl">Admin Dashboard</span>
        <span className="bg-white text-purple-700 px-3 py-1 rounded-full text-sm font-semibold shadow">Premium</span>
      </div>
      <div className="flex items-center gap-6">
        <button className="bg-white text-purple-700 px-4 py-2 rounded-lg font-semibold shadow hover:bg-purple-100 transition">Invite Team</button>
        <div className="flex items-center gap-2">
          <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Admin" className="w-8 h-8 rounded-full border-2 border-white" />
          <span className="text-white font-medium">Admin</span>
        </div>
      </div>
    </header>
  );
}
