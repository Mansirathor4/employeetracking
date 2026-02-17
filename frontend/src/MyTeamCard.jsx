import React, { useState, useEffect } from 'react';
const apiUrl = import.meta.env.VITE_BACKEND_URL || '';

export default function MyTeamCard() {
  const [open, setOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    if (open) {
      fetch(`${apiUrl}/api/user/employees`)
        .then((res) => res.json())
        .then((data) => setTeamMembers(data))
        .catch(() => setTeamMembers([]));
    }
  }, [open]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-0 mb-6">
      <button
        className="w-full flex items-center justify-between px-6 py-4 focus:outline-none hover:bg-purple-50 rounded-t-xl"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-xl font-bold text-purple-700">My Team</span>
        <svg className={`w-5 h-5 transform transition-transform ${open ? "rotate-180" : "rotate-0"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6 pb-6">
          {teamMembers.length === 0 && (
            <div className="text-gray-400 italic">No team members found.</div>
          )}
          {teamMembers.map((member) => (
            <div key={member._id} className="flex items-center gap-4 bg-gray-50 rounded-lg p-3 shadow">
              <img src={member.avatar ? `${apiUrl}${member.avatar}` : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt={member.name} className="w-12 h-12 rounded-full border-2 border-purple-200" />
              <div>
                <div className="font-semibold text-gray-800">{member.name}</div>
                <div className="text-sm text-gray-500">{member.role}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
