import React, { useState, useEffect, useRef } from 'react';
// Use Vite-friendly static imports for pdf.js and the worker URL.
// Make sure to install `pdfjs-dist`: `npm install pdfjs-dist`
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import './PdfViewer.css';

const PdfViewer = ({ pdfUrl, fileName, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const [resolvedFileName, setResolvedFileName] = useState(null);
  const canvasRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pdfJsAvailable, setPdfJsAvailable] = useState(false);
  const renderTaskRef = useRef(null);

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

  // Helper: parse filename from Content-Disposition header
  const parseFilenameFromContentDisposition = (header) => {
    if (!header) return null;
    // Try filename*=UTF-8''encoded or filename="name" or filename=name
    const fileNameStarMatch = header.match(/filename\*=(?:UTF-8'')?([^;]+)/i);
    if (fileNameStarMatch && fileNameStarMatch[1]) {
      try {
        return decodeURIComponent(fileNameStarMatch[1].trim().replace(/"/g, ''));
      } catch (_) {
        return fileNameStarMatch[1].trim().replace(/"/g, '');
      }
    }
    const fileNameMatch = header.match(/filename="?([^";]+)"?/i);
    if (fileNameMatch && fileNameMatch[1]) return fileNameMatch[1].trim();
    return null;
  };

  // Fetch pdfUrl as blob and create object URL so iframe can display it even
  // if Cloudinary sends a content-disposition attachment header.
  useEffect(() => {
    if (!pdfUrl) return;

    // If it's already a blob url, just use it
    if (pdfUrl.startsWith('blob:')) {
      setBlobUrl(pdfUrl);
      setResolvedFileName(fileName || null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let didCancel = false;

    const doFetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(pdfUrl, { signal: controller.signal });
        if (!res.ok) throw new Error(`Network response not ok: ${res.status}`);
        // Try to derive filename from headers
        const contentDisp = res.headers.get('content-disposition');
        const headerName = parseFilenameFromContentDisposition(contentDisp);
        // Fallback: try to extract name from URL
        const urlName = (() => {
          try {
            const parts = pdfUrl.split('/');
            const last = parts.pop() || parts.pop();
            return last ? decodeURIComponent(last.split('?')[0]) : null;
          } catch (_) { return null; }
        })();

        const blob = await res.blob();
        if (didCancel) return;
        const newBlobUrl = URL.createObjectURL(blob);
        setBlobUrl(prev => {
          if (prev && prev !== newBlobUrl) URL.revokeObjectURL(prev);
          return newBlobUrl;
        });
        setResolvedFileName(headerName || fileName || urlName || 'document.pdf');
        setLoading(false);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Error fetching PDF blob:', err);
        if (!didCancel) {
          setError('Failed to load PDF. Please try downloading the file instead.');
          setLoading(false);
        }
      }
    };

    doFetch();

    return () => {
      didCancel = true;
      controller.abort();
    };
  }, [pdfUrl, fileName]);

  // Revoke blobUrl on unmount
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  // Load pdf.js dynamically and open the document when blobUrl/pdfUrl is ready
  useEffect(() => {
    let cancelled = false;
    let loadingTask = null;

    const loadPdf = async () => {
      const src = blobUrl || pdfUrl;
      if (!src) return;

      try {
        // Configure worker from the imported worker URL (Vite provides this URL)
        if (pdfjsLib && pdfWorkerUrl) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
        }

        setPdfJsAvailable(true);
        loadingTask = pdfjsLib.getDocument(src);
        const doc = await loadingTask.promise;
        if (cancelled) return;
        setPdfDoc(doc);
        setTotalPages(doc.numPages || 0);
      } catch (err) {
        console.error('pdf.js load error:', err);
        setPdfJsAvailable(false);
        setPdfDoc(null);
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
      if (loadingTask && loadingTask.destroy) loadingTask.destroy();
    };
  }, [blobUrl, pdfUrl]);

  // Render current page to canvas when pdfDoc/currentPage/zoom change
  useEffect(() => {
    let cancelled = false;
    const renderPage = async (pageNum) => {
      if (!pdfDoc || !canvasRef.current) return;
      try {
        const page = await pdfDoc.getPage(pageNum);
        if (cancelled) return;
        const viewport = page.getViewport({ scale: zoom / 100 });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        // Cancel previous render if any
        if (renderTaskRef.current && renderTaskRef.current.cancel) {
          try { renderTaskRef.current.cancel(); } catch (e) {}
        }

        const renderContext = {
          canvasContext: context,
          viewport,
        };
        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        renderTaskRef.current = null;
        if (cancelled) return;
      } catch (err) {
        if (err && err.name === 'RenderingCancelledException') return;
        console.error('Error rendering PDF page:', err);
      }
    };

    if (pdfDoc) {
      // clamp currentPage
      const p = Math.max(1, Math.min(currentPage, pdfDoc.numPages || totalPages || 1));
      setCurrentPage(p);
      renderPage(p);
    }

    return () => {
      cancelled = true;
      if (renderTaskRef.current && renderTaskRef.current.cancel) {
        try { renderTaskRef.current.cancel(); } catch (e) {}
      }
    };
  }, [pdfDoc, currentPage, zoom]);

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
      const ensureAndDownload = async () => {
        let href = blobUrl;
        if (!href) {
          // fetch the PDF as blob now (useful when server forces attachment)
          const res = await fetch(pdfUrl);
          if (!res.ok) throw new Error(`Network response not ok: ${res.status}`);
          const b = await res.blob();
          href = URL.createObjectURL(b);
          setBlobUrl(prev => {
            if (prev && prev !== href) URL.revokeObjectURL(prev);
            return href;
          });
          // try to parse filename from headers if available
          const contentDisp = res.headers.get('content-disposition');
          const headerName = parseFilenameFromContentDisposition(contentDisp);
          setResolvedFileName(headerName || resolvedFileName || fileName || 'document.pdf');
        }

        const link = document.createElement('a');
        link.href = href;
        link.download = resolvedFileName || fileName || 'document.pdf';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      ensureAndDownload();
    } catch (error) {
      console.error('Download error:', error);
      // Fallback: open in new tab
      window.open(blobUrl || pdfUrl, '_blank');
    }
  };

  const handleOpenInNewTab = () => {
    window.open(blobUrl || pdfUrl, '_blank');
  };

  // Allow user to open a local PDF file from disk into the viewer
  const fileInputRef = useRef(null);
  const handleOpenLocalClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleLocalFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setBlobUrl(prev => {
      if (prev && prev !== url) URL.revokeObjectURL(prev);
      return url;
    });
    setResolvedFileName(f.name || 'document.pdf');
    setLoading(false);
    setError(null);
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
    const base = blobUrl || pdfUrl || '';
    if (!base) return '';
    if (isMobile) {
      return `${base}#view=FitH&scrollbar=1`;
    }
    return `${base}#toolbar=1&navpanes=1&scrollbar=1&zoom=${zoom}&page=${currentPage}`;
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
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={handleLocalFileChange}
            />
            <button
              className="pdf-open-local-btn"
              onClick={handleOpenLocalClick}
              title="Open local PDF"
            >
              📂 Open Local
            </button>
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