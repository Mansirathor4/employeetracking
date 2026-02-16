const apiUrl = import.meta.env.VITE_BACKEND_URL;
import React, { useEffect, useState } from 'react';
import './ScreenshotGallery.css';

export default function ScreenshotGallery({ userId, userName, onClose }) {
  const [screenshots, setScreenshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    
    fetch(`${apiUrl}/api/screenshot/user/${userId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch screenshots: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        // Handle backend response shape: { success, count, screenshots }
        const shots = Array.isArray(data) ? data : data.screenshots;
        if (!Array.isArray(shots)) throw new Error('Invalid screenshots response');
        // Sort by timestamp descending
        const sorted = shots.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setScreenshots(sorted);
        setLoading(false);
        console.log('[ScreenshotGallery] Screenshots loaded:', sorted.length);
      })
      .catch(err => {
        console.error('[ScreenshotGallery] Error fetching screenshots:', err);
        setError(err.message || 'Failed to load screenshots');
        setScreenshots([]);
        setLoading(false);
      });
  }, [userId]);

  // Group screenshots by 30-second intervals
  const groupByInterval = (shots) => {
    const groups = [];
    shots.forEach((shot) => {
      const time = new Date(shot.timestamp);
      const totalSeconds = time.getHours() * 3600 + time.getMinutes() * 60 + time.getSeconds();
      const interval = Math.floor(totalSeconds / 30) * 30;
      const minutes = Math.floor(interval / 60);
      const seconds = interval % 60;
      const label = `${time.getHours().toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      let group = groups.find(g => g.label === label);
      if (!group) {
        group = { label, shots: [] };
        groups.push(group);
      }
      group.shots.push(shot);
    });
    return groups;
  };

  const grouped = groupByInterval(screenshots);

  if (error) {
    return (
      <div className="screenshot-modal" onClick={onClose}>
        <div className="screenshot-modal-content" onClick={e => e.stopPropagation()}>
          <div className="screenshot-modal-header">
            <span className="screenshot-modal-title">{userName} - Screenshots</span>
            <button className="screenshot-modal-close" onClick={onClose}>×</button>
          </div>
          <div style={{color:'#e53e3e',padding:24}}>
            <b>Error loading screenshots:</b><br/>{error}
          </div>
        </div>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle image load error
  const handleImageError = (e, shot) => {
    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iODAiIGZpbGw9IiNmN2Y3ZmEiLz48dGV4dCB4PSI2MCIgeT0iNDAiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiNjY2MiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlIEVycm9yPC90ZXh0Pjwvc3ZnPg==';
  };

  return (
    <div className="screenshot-modal" onClick={onClose}>
      <div className="screenshot-modal-content" onClick={e => e.stopPropagation()}>
        <div className="screenshot-modal-header">
          <div className="screenshot-modal-title-section">
            <span className="screenshot-modal-title">{userName}</span>
            <span className="screenshot-modal-subtitle">Screenshots every 30 seconds</span>
          </div>
          <div className="screenshot-modal-actions">
            <span className="screenshot-count">
              {screenshots.length} screenshot{screenshots.length !== 1 ? 's' : ''}
            </span>
            <button className="screenshot-modal-close" onClick={onClose}>×</button>
          </div>
        </div>
        
        {loading ? (
          <div className="screenshot-loading">
            <div className="loading-spinner"></div>
            <span>Loading screenshots...</span>
          </div>
        ) : error ? (
          <div className="screenshot-error">
            <div className="error-icon">⚠️</div>
            <span>{error}</span>
            <button className="retry-button" onClick={() => {
              setLoading(true);
              setError(null);
              fetch(`${apiUrl}/api/screenshot/user/${userId}`)
                .then(res => res.json())
                .then(data => {
                  const sorted = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                  setScreenshots(sorted);
                  setLoading(false);
                })
                .catch(err => {
                  setError(err.message);
                  setLoading(false);
                });
            }}>
              Retry
            </button>
          </div>
        ) : grouped.length === 0 ? (
          <div className="screenshot-empty">
            <div className="empty-icon">📷</div>
            <span>No screenshots found</span>
            <span className="empty-hint">Screenshots will appear here when captured</span>
          </div>
        ) : (
          <div className="screenshot-gallery">
            <div className="screenshot-timeline">
              {grouped.map((group, idx) => (
                <div key={group.label} className="screenshot-group">
                  <div className="screenshot-time-label">
                    <span className="time">{group.label}</span>
                    <span className="count">{group.shots.length} {group.shots.length === 1 ? 'shot' : 'shots'}</span>
                  </div>
                  <div className="screenshot-thumbs">
                    {group.shots.map((shot) => (
                      <div 
                        key={shot._id} 
                        className="screenshot-thumb"
                        onClick={() => setSelectedImage(shot)}
                      >
                        <img 
                          src={shot.url} 
                          alt={`Screenshot at ${formatDate(shot.timestamp)}`} 
                          className="screenshot-img"
                          onError={(e) => handleImageError(e, shot)}
                          loading="lazy"
                        />
                        <div className="screenshot-time">
                          {formatDate(shot.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Full-screen image viewer */}
      {selectedImage && (
        <div className="image-viewer" onClick={() => setSelectedImage(null)}>
          <div className="image-viewer-content" onClick={e => e.stopPropagation()}>
            <button className="image-viewer-close" onClick={() => setSelectedImage(null)}>×</button>
            <img src={selectedImage.url} alt="Full screenshot" className="image-viewer-img" />
            <div className="image-viewer-info">
              <span>Captured: {formatDate(selectedImage.timestamp)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
