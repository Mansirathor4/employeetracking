import React from "react";

const timeEntries = [
  { user: "Amit Sharma", date: "2026-02-12", hours: 8, status: "Approved" },
  { user: "Priya Singh", date: "2026-02-12", hours: 7, status: "Pending" },
  { user: "Rahul Verma", date: "2026-02-12", hours: 6, status: "Approved" },
];

const statusColors = {
  Approved: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
};

export default function TimeEntryCard() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 text-purple-700">Time Entry</h2>
      <div className="flex flex-col gap-4">
        {timeEntries.map((entry, idx) => (
          <div key={idx} className="bg-gray-50 rounded-lg p-4 shadow flex flex-col md:flex-row md:items-center md:gap-6">
            <div className="font-semibold text-gray-800 text-lg">{entry.user}</div>
            <div className="text-sm text-gray-500">Date: {entry.date}</div>
            <div className="text-sm text-gray-500">Hours: {entry.hours}</div>
            <div className={`text-xs px-2 py-1 rounded-full font-bold ${statusColors[entry.status]}`}>{entry.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
