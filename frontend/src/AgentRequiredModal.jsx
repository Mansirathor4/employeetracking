import React, { useEffect, useState } from 'react';

const AGENT_CHECK_URL = 'http://localhost:56789/agent-status'; // Example: Electron agent could serve a local endpoint
const AGENT_DOWNLOAD_URL = 'https://yourdomain.com/downloads/employee-agent-installer.exe'; // Change to your actual download link

export default function AgentRequiredModal({ show, onClose }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ background: '#fff', padding: 32, borderRadius: 12, maxWidth: 400, textAlign: 'center' }}>
        <h2>Employee Agent Required</h2>
        <p>You must download and install the Employee Tracking Agent to continue.</p>
        <a href={AGENT_DOWNLOAD_URL} download style={{ display: 'inline-block', margin: '16px 0', padding: '12px 24px', background: '#6c63ff', color: '#fff', borderRadius: 6, textDecoration: 'none', fontWeight: 'bold' }}>Download Agent</a>
        <p style={{ color: '#888', fontSize: 13 }}>After installing, please restart this page.</p>
        {onClose && (
          <button onClick={onClose} style={{ marginTop: 16, padding: '8px 20px', background: '#eee', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>
            Continue
          </button>
        )}
      </div>
    </div>
  );
}

// Usage example (in App.jsx or Dashboard):
//
// const [agentMissing, setAgentMissing] = useState(false);
// useEffect(() => {
//   fetch(AGENT_CHECK_URL)
//     .then(res => res.json())
//     .then(data => { if (!data.running) setAgentMissing(true); })
//     .catch(() => setAgentMissing(true));
// }, []);
//
// <AgentRequiredModal show={agentMissing} />
