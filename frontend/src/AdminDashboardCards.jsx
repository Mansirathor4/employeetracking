import React, { useEffect, useState } from "react";

export default function AdminDashboardCards() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/dashboard-stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load dashboard stats");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading dashboard...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }
  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8">
      <div className="bg-linear-to-br from-purple-600 via-indigo-500 to-blue-400 text-white rounded-xl shadow-lg p-6 flex flex-col items-start">
        <span className="text-lg font-semibold">Total Employees</span>
        <span className="text-3xl font-bold mt-2">{stats.totalEmployees}</span>
      </div>
      <div className="bg-linear-to-br from-green-400 via-teal-400 to-blue-300 text-white rounded-xl shadow-lg p-6 flex flex-col items-start">
        <span className="text-lg font-semibold">Attendance Today</span>
        <span className="text-3xl font-bold mt-2">{stats.attendanceToday}</span>
      </div>
      <div className="bg-linear-to-br from-yellow-400 via-orange-400 to-pink-400 text-white rounded-xl shadow-lg p-6 flex flex-col items-start">
        <span className="text-lg font-semibold">Productivity</span>
        <span className="text-3xl font-bold mt-2">{stats.productivityPercent}%</span>
      </div>
      <div className="bg-linear-to-br from-pink-500 via-red-400 to-purple-400 text-white rounded-xl shadow-lg p-6 flex flex-col items-start">
        <span className="text-lg font-semibold">Projects & Tasks</span>
        <span className="text-3xl font-bold mt-2">{stats.totalProjects}</span>
        <span className="mt-1 text-sm">Tasks: {stats.totalTasks}</span>
        <span className="mt-1 text-sm">Task Completion: {stats.taskCompletion}</span>
        <span className="mt-1 text-sm">Time Entry: {stats.timeEntry}</span>
      </div>
    </div>
  );
}
