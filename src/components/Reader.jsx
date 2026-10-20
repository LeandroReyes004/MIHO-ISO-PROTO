import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowLeft, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Columns, 
  ScrollText, 
  BookOpen, 
  Sun, 
  Battery, 
  Wifi,
  Sliders,
  CheckCircle2,
  Maximize,
  Minimize
} from 'lucide-react';
import { storage } from '../services/storage';

import { sourcesEngine } from '../services/sourcesEngine';

export default function Reader({ manga, chapter, onBack, onChapterChange }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0); // 0-indexed
  const [showControls, setShowControls] = useState(true);
  const [readingMode, setReadingMode] = useState('webtoon'); // 'webtoon', 'rtl', 'ltr'
  const [colorFilter, setColorFilter] = useState('oled'); // 'oled', 'sepia', 'dark'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const containerRef = useRef(null);
  const webtoonListRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const pageRefs = useRef([]);

  // Load pages for the chapter
  useEffect(() => {
    let isMounted = true;
    async function loadPages() {
      setLoading(true);
      try {
        const loadedPages = await sourcesEngine.getPagesForChapter(chapter, manga);
        if (isMounted) {
          setPages(loadedPages);
          setLoading(false);
          // Restore previous progress if available
          const history = storage.getHistory();
          const existing = history.find(h => h.mangaId === manga.id && h.chapterId === chapter.id);
          if (existing && existing.page) {
            setCurrentPage(Math.min(existing.page - 1, loadedPages.length - 1));
          } else {
            setCurrentPage(0);
          }
        }
      } catch (err) {
        console.error('Error loading pages:', err);
        if (isMounted) setLoading(false);
      }
    }
    loadPages();
    return () => { isMounted = false; };
  }, [chapter, manga]);

  // Save progress on page change
  useEffect(() => {
    if (!pages.length) return;
    const pageNum = currentPage + 1;
    storage.addHistoryEntry({
      mangaId: manga.id,
      mangaTitle: manga.title,
      cover: manga.cover,
      chapterId: chapter.id,
      chapterNumber: chapter.number,
      chapterTitle: chapter.title,
      page: pageNum,
      totalPages: pages.length,
      sourceId: manga.sourceId,
    });

    // Mark as read if user reached the end
    if (pageNum >= pages.length) {
      storage.markChapterRead(chapter.id, true);
    }
  }, [currentPage, pages.length, manga, chapter]);

  // Handle controls auto-hide after 4 seconds
  const resetControlsTimer = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4500);
  }, []);

  const toggleControls = () => {
    setShowControls(prev => {
      const next = !prev;
      if (next) resetControlsTimer();
      return next;
    });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'ArrowRight') {
        if (readingMode === 'rtl') handlePrev();
        else handleNext();
      } else if (e.key === 'ArrowLeft') {
        if (readingMode === 'rtl') handleNext();
        else handlePrev();
      } else if (e.key === 'Escape') {
        setShowControls(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readingMode, currentPage, pages.length]);

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(p => p + 1);
    } else {
      // Prompt for next chapter
      if (onChapterChange) onChapterChange('next');
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(p => p - 1);
    } else {
      if (onChapterChange) onChapterChange('prev');
    }
  };

  // Tap zones handler for paged modes
  const handleScreenTap = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const leftThreshold = width * 0.32;
    const rightThreshold = width * 0.68;

    if (x < leftThreshold) {
      // Left tap
      if (readingMode === 'rtl') handleNext();
      else handlePrev();
    } else if (x > rightThreshold) {
      // Right tap
      if (readingMode === 'rtl') handlePrev();
      else handleNext();
    } else {
      // Center tap toggles UI
      toggleControls();
    }
  };

  // Webtoon scroll listener to track current page
  const handleWebtoonScroll = (e) => {
    if (readingMode !== 'webtoon') return;
    const container = e.target;
    const scrollTop = container.scrollTop;
    const pageHeight = 1350 * (container.clientWidth / 900); // Approximate
    const pageIndex = Math.min(Math.floor(scrollTop / (pageHeight || 800)), pages.length - 1);
    if (pageIndex !== currentPage && pageIndex >= 0) {
      setCurrentPage(pageIndex);
    }
  };

  // Scroll webtoon to page when slider is used
  const jumpToPage = (index) => {
    setCurrentPage(index);
    if (readingMode === 'webtoon' && webtoonListRef.current) {
      const targetElem = pageRefs.current[index];
      if (targetElem) {
        targetElem.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Background styling based on colorFilter
  const bgStyles = {
    oled: { background: '#000000', color: '#ffffff' },
    dark: { background: '#121217', color: '#f1f5f9' },
    sepia: { background: '#1c1611', color: '#fed7aa', filter: 'sepia(0.2)' },
  }[colorFilter] || { background: '#000000', color: '#ffffff' };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        ...bgStyles,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* iOS Top Status Bar Simulation */}
      {showControls && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 'calc(var(--sat) + 24px)',
            paddingTop: 'var(--sat)',
            paddingLeft: '20px',
            paddingRight: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 110,
            pointerEvents: 'none',
            fontSize: '13px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.8)',
          }}
        >
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wifi size={14} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>96%</span>
              <Battery size={16} />
            </div>
          </div>
        </div>
      )}

      {/* Top Controls Overlay */}
      {showControls && (
        <header
          className="fade-in"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            paddingTop: 'calc(var(--sat) + 24px)',
            background: 'linear-gradient(to bottom, rgba(8, 7, 13, 0.95) 0%, rgba(8, 7, 13, 0.6) 80%, transparent 100%)',
            zIndex: 105,
            paddingBottom: '24px',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px',
            }}
          >
            <button
              onClick={onBack}
              className="btn-icon"
              style={{ color: '#ffffff', background: 'rgba(255,255,255,0.1)' }}
            >
              <ArrowLeft size={22} />
            </button>

            <div style={{ textAlign: 'center', flex: 1, margin: '0 12px', minWidth: 0 }}>
              <h2
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: '#ffffff',
                }}
              >
                {manga.title}
              </h2>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--accent-hover)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {chapter.title || `Capítulo ${chapter.number}`}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => {
                  const modes = ['webtoon', 'rtl', 'ltr'];
                  const nextIdx = (modes.indexOf(readingMode) + 1) % modes.length;
                  setReadingMode(modes[nextIdx]);
                }}
                className="btn-icon"
                title={`Modo actual: ${readingMode.toUpperCase()}`}
                style={{ color: 'var(--accent-hover)', background: 'rgba(255,255,255,0.1)' }}
              >
                {readingMode === 'webtoon' && <ScrollText size={19} />}
                {readingMode === 'rtl' && <BookOpen size={19} />}
                {readingMode === 'ltr' && <Columns size={19} />}
              </button>

              <button
                onClick={() => {
                  const filters = ['oled', 'dark', 'sepia'];
                  const nextFilter = filters[(filters.indexOf(colorFilter) + 1) % filters.length];
                  setColorFilter(nextFilter);
                }}
                className="btn-icon"
                title={`Tema: ${colorFilter}`}
                style={{ color: '#ffffff', background: 'rgba(255,255,255,0.1)' }}
              >
                <Sun size={19} />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Reading Canvas */}
      <div
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={readingMode !== 'webtoon' ? handleScreenTap : undefined}
      >
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                border: '3px solid var(--accent-subtle)',
                borderTopColor: 'var(--accent-primary)',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Cargando capítulo de Mihon...</p>
          </div>
        ) : readingMode === 'webtoon' ? (
          /* Webtoon Continuous Vertical Scroll */
          <div
            ref={webtoonListRef}
            onScroll={handleWebtoonScroll}
            onClick={toggleControls}
            style={{
              width: '100%',
              height: '100%',
              overflowY: 'auto',
              overflowX: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              scrollBehavior: 'smooth',
            }}
          >
            <div style={{ maxWidth: '800px', width: '100%', display: 'flex', flexDirection: 'column' }}>
              {pages.map((pageUrl, idx) => (
                <div
                  key={idx}
                  ref={el => pageRefs.current[idx] = el}
                  style={{ width: '100%', minHeight: '300px', position: 'relative' }}
                >
                  <img
                    src={pageUrl}
                    alt={`Página ${idx + 1}`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      objectFit: 'contain',
                      userSelect: 'none',
                    }}
                  />
                </div>
              ))}
              {/* End of chapter indicator */}
              <div
                style={{
                  padding: '60px 20px 100px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'var(--bg-secondary)',
                  margin: '20px 0',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <CheckCircle2 size={40} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>¡Capítulo finalizado!</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Has leído {pages.length} páginas</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onChapterChange) onChapterChange('next');
                  }}
                  className="btn-primary"
                >
                  Siguiente capítulo <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Paged Mode (RTL Japanese Manga or LTR Comic) */
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none',
            }}
          >
            {pages[currentPage] && (
              <img
                src={pages[currentPage]}
                alt={`Página ${currentPage + 1}`}
                referrerPolicy="no-referrer"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  transform: `scale(${zoomLevel})`,
                  transition: 'transform 0.2s ease',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Discrete Floating Page Counter when reading */}
      {!showControls && !loading && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(var(--sab) + 16px)',
            right: '16px',
            background: 'rgba(15, 13, 24, 0.75)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            color: 'var(--text-primary)',
            fontSize: '11px',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(255,255,255,0.12)',
            zIndex: 90,
            pointerEvents: 'none',
          }}
        >
          {currentPage + 1} / {pages.length} ({readingMode.toUpperCase()})
        </div>
      )}

      {/* Bottom Controls Overlay */}
      {showControls && (
        <footer
          className="fade-in"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingBottom: 'calc(var(--sab) + 12px)',
            paddingTop: '20px',
            background: 'linear-gradient(to top, rgba(8, 7, 13, 0.98) 0%, rgba(8, 7, 13, 0.8) 75%, transparent 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            zIndex: 105,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            paddingLeft: '16px',
            paddingRight: '16px',
          }}
        >
          {/* Page Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, minWidth: '40px', color: 'var(--text-secondary)' }}>
              {currentPage + 1} / {pages.length}
            </span>

            <input
              type="range"
              min="0"
              max={Math.max(pages.length - 1, 0)}
              value={currentPage}
              onChange={(e) => jumpToPage(Number(e.target.value))}
              style={{
                flex: 1,
                accentColor: 'var(--accent-primary)',
                cursor: 'pointer',
                height: '6px',
                borderRadius: '3px',
              }}
            />

            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-hover)' }}>
              {Math.round(((currentPage + 1) / (pages.length || 1)) * 100)}%
            </span>
          </div>

          {/* Quick Actions Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={() => onChapterChange && onChapterChange('prev')}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '12.5px' }}
            >
              <ChevronLeft size={16} /> Cap. Anterior
            </button>

            {/* Reading Mode Selector Pill */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 'var(--radius-full)',
                padding: '3px',
                gap: '2px',
              }}
            >
              <button
                onClick={() => setReadingMode('webtoon')}
                style={{
                  background: readingMode === 'webtoon' ? 'var(--accent-primary)' : 'transparent',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Webtoon
              </button>
              <button
                onClick={() => setReadingMode('rtl')}
                style={{
                  background: readingMode === 'rtl' ? 'var(--accent-primary)' : 'transparent',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Manga (RTL)
              </button>
              <button
                onClick={() => setReadingMode('ltr')}
                style={{
                  background: readingMode === 'ltr' ? 'var(--accent-primary)' : 'transparent',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cómic (LTR)
              </button>
            </div>

            <button
              onClick={() => onChapterChange && onChapterChange('next')}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '12.5px' }}
            >
              Siguiente <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      )}

      {/* CSS Keyframe for spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
