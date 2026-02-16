import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export default function LiveStreamViewer({ userId, userName, onClose }) {
  const [frame, setFrame] = useState(null);
  const [connected, setConnected] = useState(false);
  const [noFrameTimeout, setNoFrameTimeout] = useState(false);
  const socketRef = useRef(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!userId) return;
    setNoFrameTimeout(false);
    setFrame(null);
    const socket = io(backendUrl);
    socketRef.current = socket;
    let timeoutId = null;
    function startNoFrameTimer() {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (!frame) {
          setNoFrameTimeout(true);
          console.error('[LiveStreamViewer] No live frame received from Electron agent. Possible reasons: Electron agent not running, network issue, or userId mismatch.');
        }
      }, 8000); // 8 seconds without frame
    }
    startNoFrameTimer();
    socket.on('connect', () => {
      setConnected(true);
      console.log('[LiveStreamViewer] Connected to Socket.io');
      startNoFrameTimer();
    });
    socket.on('disconnect', () => {
      setConnected(false);
      console.error('[LiveStreamViewer] Disconnected from Socket.io');
    });
    socket.on('connect_error', (err) => {
      setConnected(false);
      console.error('[LiveStreamViewer] Socket.io connection error:', err);
    });
    socket.on('live-frame', (data) => {
      if (data.userId === userId) {
        setFrame(data.frame);
        setNoFrameTimeout(false);
        startNoFrameTimer();
        console.log('[LiveStreamViewer] Received live frame for user:', userId);
      }
    });
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      socket.disconnect();
    };
    // eslint-disable-next-line
  }, [userId]);

  return (
    <div className="screenshot-modal" onClick={onClose}>
      <div className="screenshot-modal-content" onClick={e => e.stopPropagation()}>
        <div className="screenshot-modal-header">
          <span className="screenshot-modal-title">{userName} - Live Stream</span>
          <button className="screenshot-modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{textAlign:'center',marginTop:24}}>
          <div style={{marginBottom:12}}>
            <span style={{color:connected?'#28a745':'#dc3545',fontWeight:600}}>
              {connected ? 'Live' : 'Disconnected'}
            </span>
          </div>
          {frame ? (
            <img src={frame} alt="Live Stream" style={{maxWidth:'100%',borderRadius:12,boxShadow:'0 2px 12px rgba(80,40,200,0.10)'}} />
          ) : noFrameTimeout ? (
            <div style={{color:'#e53e3e',fontWeight:600}}>
              <span>Live streaming is not coming.<br/>Check whether Electron agent is running for this user.<br/>See browser console for details.</span>
            </div>
          ) : (
            <div style={{color:'#888'}}>Waiting for live frame...<br/><span style={{color:'#e53e3e',fontSize:12}}>[Live streaming not received]</span></div>
          )}
        </div>
      </div>
    </div>
  );
}
