import React from "react";

const configOptions = [
  { name: "Screenshot Interval", value: "10 min" },
  { name: "Idle Timeout", value: "15 min" },
  { name: "Working Hours", value: "9:00 AM - 6:00 PM" },
];

export default function ConfigurationCard() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 text-purple-700">Configuration</h2>
      <div className="flex flex-col gap-4">
        {configOptions.map((option, idx) => (
          <div key={idx} className="bg-gray-50 rounded-lg p-4 shadow flex flex-col md:flex-row md:items-center md:gap-6">
            <div className="font-semibold text-gray-800 text-lg">{option.name}</div>
            <div className="text-sm text-gray-500">{option.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
