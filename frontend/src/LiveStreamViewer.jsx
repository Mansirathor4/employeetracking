import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

export default function LiveStreamViewer({ userId, userName, onClose }) {
  const [frame, setFrame] = useState(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('connecting'); // connecting | live | stale | error
  const [fps, setFps] = useState(0);
  const socketRef = useRef(null);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const staleTimerRef = useRef(null);

  // Use VITE_BACKEND_URL if set, otherwise connect to same origin (production)
  const backendUrl = import.meta.env.VITE_BACKEND_URL || undefined;

  // Mark stream as stale if no frame received within 10 seconds
  const resetStaleTimer = useCallback(() => {
    if (staleTimerRef.current) clearTimeout(staleTimerRef.current);
    staleTimerRef.current = setTimeout(() => {
      setStatus('stale');
    }, 10000);
  }, []);

  useEffect(() => {
    if (!userId) return;

    setStatus('connecting');
    setFrame(null);
    setFps(0);
    frameCountRef.current = 0;

    // Socket.io: pass URL for dev, or undefined to auto-detect same origin in production
    const socketOptions = {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      transports: ['websocket', 'polling'],
    };
    const socket = backendUrl ? io(backendUrl, socketOptions) : io(socketOptions);
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setStatus('connecting');
      // Join the viewer room for this specific user
      socket.emit('watch-stream', { userId });
      console.log('[LiveStreamViewer] Connected, watching user:', userId);
      resetStaleTimer();
    });

    socket.on('disconnect', () => {
      setConnected(false);
      setStatus('error');
      console.log('[LiveStreamViewer] Disconnected');
    });

    socket.on('connect_error', (err) => {
      setConnected(false);
      setStatus('error');
      console.error('[LiveStreamViewer] Connection error:', err?.message);
    });

    socket.on('live-frame', (data) => {
      if (data && data.userId === userId && data.frame) {
        setFrame(data.frame);
        setStatus('live');
        frameCountRef.current++;
        lastFrameTimeRef.current = Date.now();
        resetStaleTimer();
      }
    });

    // FPS counter - update every 2 seconds
    const fpsInterval = setInterval(() => {
      setFps(Math.round(frameCountRef.current / 2));
      frameCountRef.current = 0;
    }, 2000);

    return () => {
      if (staleTimerRef.current) clearTimeout(staleTimerRef.current);
      clearInterval(fpsInterval);
      // Leave the viewer room before disconnecting
      socket.emit('stop-watching', { userId });
      socket.disconnect();
    };
    // eslint-disable-next-line
  }, [userId, backendUrl, resetStaleTimer]);

  const statusConfig = {
    connecting: { color: '#f59e0b', label: 'Connecting...', dot: '🟡' },
    live:       { color: '#10b981', label: `Live (${fps} fps)`, dot: '🔴' },
    stale:      { color: '#f97316', label: 'Waiting for frames...', dot: '🟠' },
    error:      { color: '#ef4444', label: 'Disconnected', dot: '⚪' },
  };
  const currentStatus = statusConfig[status] || statusConfig.error;

  return (
    <div className="screenshot-modal" onClick={onClose}>
      <div className="screenshot-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 1000 }}>
        <div className="screenshot-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="screenshot-modal-title">{userName} - Live Stream</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              color: currentStatus.color,
              fontWeight: 600,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: `${currentStatus.color}15`,
              padding: '4px 12px',
              borderRadius: 20,
            }}>
              {currentStatus.dot} {currentStatus.label}
            </span>
            <button className="screenshot-modal-close" onClick={onClose}>&times;</button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', borderRadius: 12, overflow: 'hidden' }}>
          {frame ? (
            <img
              src={frame}
              alt="Live Stream"
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                borderRadius: 8,
                display: 'block',
              }}
            />
          ) : status === 'error' ? (
            <div style={{ color: '#ef4444', fontWeight: 600, padding: 32 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>&#x26A0;</div>
              <div>Could not connect to the server</div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                Make sure the backend is running
              </div>
            </div>
          ) : status === 'stale' ? (
            <div style={{ color: '#f97316', fontWeight: 600, padding: 32 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>&#x23F3;</div>
              <div>Waiting for the Electron agent to send frames</div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                Make sure the desktop agent is running for this employee
              </div>
            </div>
          ) : (
            <div style={{ color: '#888', padding: 32 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>&#x1F4E1;</div>
              <div style={{ fontSize: 14 }}>Connecting to live stream...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
