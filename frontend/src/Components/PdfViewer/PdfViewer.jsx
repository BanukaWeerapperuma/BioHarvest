import React, { useState, useEffect } from 'react';
import './PdfViewer.css';

const PdfViewer = ({ pdfUrl, fileName, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      setIsMobile(mobileRegex.test(userAgent.toLowerCase()));
    };
    
    checkMobile();
    
    // Reset state when PDF URL changes
    setLoading(true);
    setError(null);
    setZoom(isMobile ? 75 : 100); // Start with smaller zoom on mobile
    setCurrentPage(1);
    setTotalPages(0);
  }, [pdfUrl, isMobile]);

  const handleLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleError = () => {
    setLoading(false);
    setError('Failed to load PDF. Please try downloading the file instead.');
  };

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName || 'document.pdf';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      // Fallback: open in new tab
      window.open(pdfUrl, '_blank');
    }
  };

  const handleOpenInNewTab = () => {
    window.open(pdfUrl, '_blank');
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleZoomReset = () => {
    setZoom(isMobile ? 75 : 100);
  };

  const handlePageChange = (e) => {
    const page = parseInt(e.target.value);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Mobile-specific PDF URL with better mobile parameters
  const getMobilePdfUrl = () => {
    if (isMobile) {
      // For mobile, use simpler parameters that work better
      return `${pdfUrl}#view=FitH&scrollbar=1`;
    }
    return `${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=${zoom}&page=${currentPage}`;
  };

  return (
    <div className="pdf-viewer-overlay" onClick={handleBackdropClick}>
      <div className="pdf-viewer-modal">
        <div className="pdf-viewer-header">
          <div className="pdf-viewer-title">
            <h3>📄 {fileName || 'PDF Document'}</h3>
            {isMobile && <span className="mobile-indicator">📱 Mobile View</span>}
          </div>
          <div className="pdf-viewer-actions">
            {!isMobile && (
              <div className="pdf-zoom-controls">
                <button 
                  className="pdf-zoom-btn"
                  onClick={handleZoomOut}
                  title="Zoom Out"
                  disabled={zoom <= 50}
                >
                  🔍-
                </button>
                <span className="pdf-zoom-level">{zoom}%</span>
                <button 
                  className="pdf-zoom-btn"
                  onClick={handleZoomIn}
                  title="Zoom In"
                  disabled={zoom >= 200}
                >
                  🔍+
                </button>
                <button 
                  className="pdf-zoom-btn"
                  onClick={handleZoomReset}
                  title="Reset Zoom"
                >
                  🔄
                </button>
              </div>
            )}
            <button 
              className="pdf-download-btn"
              onClick={handleDownload}
              title="Download PDF"
            >
              📥 Download
            </button>
            {isMobile && (
              <button 
                className="pdf-open-btn"
                onClick={handleOpenInNewTab}
                title="Open in new tab"
              >
                🔗 Open
              </button>
            )}
            <button 
              className="pdf-close-btn"
              onClick={onClose}
              title="Close viewer"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="pdf-viewer-content">
          {loading && (
            <div className="pdf-loading">
              <div className="loading-spinner"></div>
              <p>Loading PDF...</p>
              {isMobile && (
                <p className="mobile-tip">
                  💡 Tip: If PDF doesn't load, try the "Open" button to view in your browser
                </p>
              )}
            </div>
          )}
          
          {error && (
            <div className="pdf-error">
              <div className="error-icon">⚠️</div>
              <p>{error}</p>
              <div className="error-actions">
                <button onClick={handleDownload} className="pdf-download-btn">
                  Download PDF
                </button>
                <button onClick={handleOpenInNewTab} className="pdf-open-btn">
                  Open in Browser
                </button>
              </div>
            </div>
          )}
          
          {!error && (
            <div className="pdf-container">
              <iframe
                src={getMobilePdfUrl()}
                className="pdf-iframe"
                onLoad={handleLoad}
                onError={handleError}
                title={fileName || 'PDF Document'}
                style={!isMobile ? { 
                  transform: `scale(${zoom / 100})`, 
                  transformOrigin: 'top left',
                  width: `${100 / (zoom / 100)}%`,
                  height: `${100 / (zoom / 100)}%`
                } : {}}
              />
            </div>
          )}
        </div>

        {/* Page Navigation - Hide on mobile for simplicity */}
        {!error && totalPages > 0 && !isMobile && (
          <div className="pdf-navigation">
            <button 
              onClick={handlePreviousPage}
              disabled={currentPage <= 1}
              className="nav-btn"
            >
              ← Previous
            </button>
            <div className="page-info">
              <span>Page</span>
              <input
                type="number"
                value={currentPage}
                onChange={handlePageChange}
                min="1"
                max={totalPages}
                className="page-input"
              />
              <span>of {totalPages}</span>
            </div>
            <button 
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className="nav-btn"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfViewer; 