import React from "react";

const holidays = [
  { name: "Republic Day", date: "2026-01-26" },
  { name: "Holi", date: "2026-03-17" },
  { name: "Diwali", date: "2026-11-06" },
];

export default function HolidayCard() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 text-purple-700">Holiday</h2>
      <div className="flex flex-col gap-4">
        {holidays.map((holiday, idx) => (
          <div key={idx} className="bg-gray-50 rounded-lg p-4 shadow flex flex-col md:flex-row md:items-center md:gap-6">
            <div className="font-semibold text-gray-800 text-lg">{holiday.name}</div>
            <div className="text-sm text-gray-500">Date: {holiday.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
