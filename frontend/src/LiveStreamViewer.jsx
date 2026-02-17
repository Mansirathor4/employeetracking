import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

export default function LiveStreamViewer({ userId, userName, onClose }) {
  const [frame, setFrame] = useState(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('connecting');
  const [fps, setFps] = useState(0);
  const [mode, setMode] = useState('socket'); // socket | polling
  const socketRef = useRef(null);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const staleTimerRef = useRef(null);
  const pollingRef = useRef(null);

  // Start HTTP polling as fallback
  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    setMode('polling');
    console.log('[LiveStreamViewer] Starting HTTP polling fallback');
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/live-frame/${userId}`);
        const data = await res.json();
        if (data.success && data.frame) {
          setFrame(data.frame);
          setStatus('live');
          frameCountRef.current++;
          lastFrameTimeRef.current = Date.now();
        }
      } catch (err) {
        // Silent fail for polling
      }
    }, 3000);
  }, [userId]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // If no Socket.io frame arrives within 8 seconds, switch to HTTP polling
  const resetStaleTimer = useCallback(() => {
    if (staleTimerRef.current) clearTimeout(staleTimerRef.current);
    staleTimerRef.current = setTimeout(() => {
      if (frameCountRef.current === 0) {
        setStatus('stale');
        startPolling();
      }
    }, 8000);
  }, [startPolling]);

  useEffect(() => {
    if (!userId) return;

    setStatus('connecting');
    setFrame(null);
    setFps(0);
    setMode('socket');
    frameCountRef.current = 0;

    // Socket.io connection
    const socketUrl = BACKEND_URL || undefined;
    const socketOptions = {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      transports: ['websocket', 'polling'],
    };
    const socket = socketUrl ? io(socketUrl, socketOptions) : io(socketOptions);
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setStatus('connecting');
      socket.emit('watch-stream', { userId });
      console.log('[LiveStreamViewer] Connected via Socket.io, watching:', userId);
      resetStaleTimer();
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('[LiveStreamViewer] Socket.io disconnected');
      // Don't set error immediately - might reconnect. Start polling as backup.
      startPolling();
    });

    socket.on('connect_error', (err) => {
      setConnected(false);
      console.error('[LiveStreamViewer] Socket error:', err?.message);
      startPolling();
    });

    socket.on('live-frame', (data) => {
      if (data && data.userId === userId && data.frame) {
        setFrame(data.frame);
        setStatus('live');
        setMode('socket');
        frameCountRef.current++;
        lastFrameTimeRef.current = Date.now();
        // Got a socket frame - stop polling if it was running
        stopPolling();
        resetStaleTimer();
      }
    });

    // FPS counter
    const fpsInterval = setInterval(() => {
      setFps(Math.round(frameCountRef.current / 2));
      frameCountRef.current = 0;
    }, 2000);

    // Also start polling immediately as a safety net (will stop once socket frames arrive)
    const pollFallbackTimer = setTimeout(() => {
      if (!frame) startPolling();
    }, 5000);

    return () => {
      if (staleTimerRef.current) clearTimeout(staleTimerRef.current);
      clearTimeout(pollFallbackTimer);
      clearInterval(fpsInterval);
      stopPolling();
      socket.emit('stop-watching', { userId });
      socket.disconnect();
    };
    // eslint-disable-next-line
  }, [userId]);

  const statusConfig = {
    connecting: { color: '#f59e0b', label: 'Connecting...', dot: '🟡' },
    live:       { color: '#10b981', label: `Live ${mode === 'polling' ? '(poll)' : ''} (${fps} fps)`, dot: '🔴' },
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
              style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8, display: 'block' }}
            />
          ) : status === 'error' ? (
            <div style={{ color: '#ef4444', fontWeight: 600, padding: 32 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>&#x26A0;</div>
              <div>Could not connect to the server</div>
            </div>
          ) : status === 'stale' ? (
            <div style={{ color: '#f97316', fontWeight: 600, padding: 32 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>&#x23F3;</div>
              <div>Searching for live frames...</div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                Trying HTTP polling as fallback...
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
