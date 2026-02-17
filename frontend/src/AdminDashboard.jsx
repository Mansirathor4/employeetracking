import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopBar from "./AdminTopBar";
import AdminDashboardCards from "./AdminDashboardCards";
import MyTeamCard from "./MyTeamCard";
import ReportsCard from "./ReportsCard";
import AdminAttendanceReport from "./AdminAttendanceReport";
import LiveViewCard from "./LiveViewCard";
import ScreenshotGallery from "./ScreenshotGallery";
import LiveStreamViewer from "./LiveStreamViewer";
import ProjectManagementCard from "./ProjectManagementCard";

export default function AdminDashboard() {
  const [selectedSection, setSelectedSection] = useState("Dashboard");

  // Map sidebar label to component
  const sectionComponents = {
    Dashboard: <AdminDashboardCards />,
    Team: <MyTeamCard />,
    "Live Tracking": <LiveViewCard />,
    Screenshot: <LiveViewCard showScreenshotsOnly={true} />, // Show screenshot view for all employees
    "Live Streaming": <LiveViewCard showLiveStreamingOnly={true} />, // Show live streaming view for all employees
    Reports: <ReportsCard />,
    "Time Tracker": <div className="p-6">Time Tracker Report Coming Soon</div>,
    "Productive vs Idle": <div className="p-6">Productive vs Idle Report Coming Soon</div>,
    "Activity Logs": <div className="p-6">Activity Logs Report Coming Soon</div>,
    Attendance: <AdminAttendanceReport />,
    "Projects and Task": <ProjectManagementCard section="projects" />,
    Project: <div className="p-6">Project Management Coming Soon</div>,
    Task: <div className="p-6">Task Management Coming Soon</div>,
    Time: <ProjectManagementCard section="time" />,
    "Task Completion": <div className="p-6">Task Completion Coming Soon</div>,
    "Time Entry": <div className="p-6">Time Entry Coming Soon</div>,
  };

  // Pass setSelectedSection to sidebar
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar onSectionSelect={setSelectedSection} />
      <div className="flex-1 flex flex-col">
        <AdminTopBar />
        <main className="flex-1 overflow-y-auto">
          {sectionComponents[selectedSection] || <AdminDashboardCards />}
        </main>
      </div>
    </div>
  );
}
