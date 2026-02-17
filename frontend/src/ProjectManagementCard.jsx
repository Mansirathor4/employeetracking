import React from "react";

const projects = [
  { name: "CRM App", progress: 90, tasks: 12, manager: "Amit Sharma" },
  { name: "Website Redesign", progress: 65, tasks: 8, manager: "Sneha Patel" },
  { name: "Mobile App", progress: 40, tasks: 6, manager: "Priya Singh" },
];

export default function ProjectManagementCard({ section }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 text-purple-700">
        {section === "time" ? "Time" : "Projects and Task"}
      </h2>
      <div className="flex flex-col gap-4">
        {section === "projects" && (
          <>
            <div className="bg-gray-50 rounded-lg p-4 shadow">
              <div className="font-semibold text-gray-800 text-lg mb-2">Project</div>
              {/* Project details here */}
            </div>
            <div className="bg-gray-50 rounded-lg p-4 shadow">
              <div className="font-semibold text-gray-800 text-lg mb-2">Task</div>
              {/* Task details here */}
            </div>
          </>
        )}
        {section === "time" && (
          <>
            <div className="bg-gray-50 rounded-lg p-4 shadow">
              <div className="font-semibold text-gray-800 text-lg mb-2">Task Completion</div>
              {/* Task Completion details here */}
            </div>
            <div className="bg-gray-50 rounded-lg p-4 shadow">
              <div className="font-semibold text-gray-800 text-lg mb-2">Time Entry</div>
              {/* Time Entry details here */}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
