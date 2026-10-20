import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Bookmark, 
  BookmarkCheck, 
  Play, 
  Check, 
  CheckCheck, 
  ArrowUpDown, 
  Download, 
  Share2, 
  Eye, 
  Clock, 
  Globe 
} from 'lucide-react';
import { storage } from '../services/storage';
import { mangadexApi } from '../services/mangadexApi';
import { inmanga } from '../services/inmangaService';

export default function MangaDetailsView({ manga, onBack, onOpenChapter, onToggleLibrary, isInLibrary }) {
  const [chapters, setChapters] = useState(manga.chapters || []);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [sortAsc, setSortAsc] = useState(false);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [readChaptersMap, setReadChaptersMap] = useState(storage.getReadChapters());
  const [descExpanded, setDescExpanded] = useState(false);

  // If this manga is from InManga or has a MangaDex rawId, fetch its real hosted chapters
  useEffect(() => {
    let active = true;

    // InManga Source
    if (manga.sourceId === 'inmanga' || manga.url?.includes('inmanga')) {
      setLoadingChapters(true);
      inmanga.getChapters(manga.id).then(res => {
        if (active) {
          if (res && res.chapters && res.chapters.length > 0) {
            setChapters(res.chapters.map(c => ({
              id: c.id,
              name: c.name,
              number: c.chapterNumber,
              url: c.url,
              dateUpload: c.dateUpload ? new Date(c.dateUpload).toLocaleDateString() : 'Reciente',
              scanlator: 'InManga'
            })));
          }
          setLoadingChapters(false);
        }
      }).catch(err => {
        console.warn('InManga chapters load error:', err);
        if (active) setLoadingChapters(false);
      });
      return () => { active = false; };
    }

    // MangaDex Source
    if (manga.rawId) {
      setLoadingChapters(true);
      mangadexApi.getChapters(manga.rawId, manga.lang || 'es').then(liveChaps => {
        if (active) {
          if (liveChaps && liveChaps.length > 0) {
            setChapters(liveChaps);
          } else if (manga.chapters && manga.chapters.length > 0) {
            setChapters(manga.chapters);
          }
          setLoadingChapters(false);
        }
      }).catch(() => {
        if (active) {
          if (manga.chapters) setChapters(manga.chapters);
          setLoadingChapters(false);
        }
      });
    } else if (manga.chapters) {
      setChapters(manga.chapters);
    }
    return () => { active = false; };
  }, [manga]);

  // Toggle chapter read status
  const handleToggleRead = (e, chapterId) => {
    e.stopPropagation();
    const currentlyRead = !!readChaptersMap[chapterId];
    const updated = storage.markChapterRead(chapterId, !currentlyRead);
    setReadChaptersMap({ ...updated });
  };

  // Mark all as read
  const handleMarkAllRead = () => {
    chapters.forEach(ch => {
      storage.markChapterRead(ch.id, true);
    });
    setReadChaptersMap(storage.getReadChapters());
  };

  // Sort and filter chapters
  const displayedChapters = [...chapters]
    .sort((a, b) => sortAsc ? a.number - b.number : b.number - a.number)
    .filter(ch => !filterUnreadOnly || !readChaptersMap[ch.id]);

  // First unread chapter or latest
  const firstUnread = chapters.find(ch => !readChaptersMap[ch.id]) || chapters[0];

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 'calc(var(--nav-height) + var(--sab) + 40px)', background: 'var(--bg-app)' }}>
      {/* Blurred Hero Header with Cover Backdrop */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '320px',
          overflow: 'hidden',
        }}
      >
        {/* Backdrop image */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${manga.banner || manga.cover})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(35px) brightness(0.35)',
            transform: 'scale(1.15)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(8, 7, 13, 0.4) 0%, rgba(8, 7, 13, 0.85) 70%, var(--bg-app) 100%)',
          }}
        />

        {/* Top bar back button */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'calc(var(--sat) + 12px) 16px 0',
          }}
        >
          <button
            onClick={onBack}
            className="btn-icon"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', color: '#ffffff' }}
          >
            <ArrowLeft size={22} />
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: manga.title, text: manga.description, url: window.location.href });
                }
              }}
              className="btn-icon"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', color: '#ffffff' }}
            >
              <Share2 size={19} />
            </button>
          </div>
        </div>

        {/* Hero Manga Meta Info */}
        <div
          style={{
            position: 'relative',
            zIndex: 5,
            display: 'flex',
            gap: '16px',
            padding: '20px 16px 10px',
          }}
        >
          {/* Main Cover */}
          <div
            style={{
              width: '115px',
              aspectRatio: '2/3',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid rgba(255,255,255,0.15)',
              flexShrink: 0,
              background: 'var(--bg-tertiary)',
            }}
          >
            <img
              src={manga.cover}
              alt={manga.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Titles & Info */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '5px' }}>
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.25,
                letterSpacing: '-0.4px',
              }}
            >
              {manga.title}
            </h1>

            {manga.altTitle && (
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                {manga.altTitle}
              </p>
            )}

            <p style={{ fontSize: '13px', color: 'var(--accent-hover)', fontWeight: 600 }}>
              {manga.author} {manga.artist && manga.artist !== manga.author ? `• ${manga.artist}` : ''}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              <span className="badge-source">{manga.sourceName || 'MangaDex'}</span>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                {manga.status}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', alignSelf: 'center' }}>
                {manga.type || 'Manga'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          padding: '12px 16px',
        }}
      >
        {/* Toggle Library Button */}
        <button
          onClick={() => onToggleLibrary(manga)}
          className={isInLibrary ? 'btn-secondary' : 'btn-primary'}
          style={{ flex: 1, padding: '12px 16px' }}
        >
          {isInLibrary ? (
            <>
              <BookmarkCheck size={18} color="var(--accent-hover)" /> En biblioteca
            </>
          ) : (
            <>
              <Bookmark size={18} /> Añadir a biblioteca
            </>
          )}
        </button>

        {/* Start / Resume Reading Button */}
        {firstUnread && (
          <button
            onClick={() => onOpenChapter(firstUnread, manga)}
            className="btn-primary"
            style={{ flex: 1.2, padding: '12px 16px' }}
          >
            <Play size={18} fill="#ffffff" /> Continuar Cap. {firstUnread.number}
          </button>
        )}
      </div>

      {/* Genres Chips */}
      {manga.genres && manga.genres.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            padding: '4px 16px 12px',
            scrollbarWidth: 'none',
          }}
        >
          {manga.genres.map((genre, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                background: 'var(--bg-secondary)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
                whiteSpace: 'nowrap',
              }}
            >
              {genre}
            </span>
          ))}
        </div>
      )}

      {/* Synopsis / Description */}
      {manga.description && (
        <div style={{ padding: '0 16px 16px' }}>
          <div
            onClick={() => setDescExpanded(!descExpanded)}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              cursor: 'pointer',
            }}
          >
            <p
              style={{
                fontSize: '13px',
                lineHeight: 1.5,
                color: 'var(--text-secondary)',
                display: descExpanded ? 'block' : '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {manga.description}
            </p>
            <span
              style={{
                display: 'block',
                marginTop: '6px',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--accent-hover)',
              }}
            >
              {descExpanded ? 'Mostrar menos' : 'Leer más...'}
            </span>
          </div>
        </div>
      )}

      {/* Chapters Header & Filters */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px 8px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
          {chapters.length} Capítulos
        </span>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
            className="btn-icon"
            title={filterUnreadOnly ? "Mostrando solo no leídos" : "Filtrar no leídos"}
            style={{ color: filterUnreadOnly ? 'var(--accent-hover)' : 'var(--text-secondary)' }}
          >
            <Eye size={18} />
          </button>

          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="btn-icon"
            title={sortAsc ? "Orden: Más antiguo primero" : "Orden: Más reciente primero"}
            style={{ color: sortAsc ? 'var(--accent-hover)' : 'var(--text-secondary)' }}
          >
            <ArrowUpDown size={18} />
          </button>

          <button
            onClick={handleMarkAllRead}
            className="btn-icon"
            title="Marcar todo como leído"
          >
            <CheckCheck size={18} />
          </button>
        </div>
      </div>

      {/* Chapters List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '0 16px' }}>
        {loadingChapters ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Cargando capítulos desde la fuente...
          </div>
        ) : displayedChapters.map((ch) => {
          const isRead = !!readChaptersMap[ch.id];

          return (
            <div
              key={ch.id}
              onClick={() => onOpenChapter(ch, manga)}
              className="ios-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                cursor: 'pointer',
                opacity: isRead ? 0.65 : 1,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: isRead ? 500 : 700,
                      color: isRead ? 'var(--text-secondary)' : 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {ch.title || `Capítulo ${ch.number}`}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                  <span>{ch.date || 'Reciente'}</span>
                  <span>•</span>
                  <span>{ch.scan || 'Scanlation'}</span>
                  {ch.pagesCount && (
                    <>
                      <span>•</span>
                      <span>{ch.pagesCount} págs</span>
                    </>
                  )}
                </div>
              </div>

              {/* Read toggle check icon */}
              <button
                onClick={(e) => handleToggleRead(e, ch.id)}
                className="btn-icon"
                style={{
                  color: isRead ? 'var(--status-success)' : 'var(--text-muted)',
                  marginLeft: '8px',
                }}
              >
                <Check size={20} strokeWidth={isRead ? 2.8 : 1.8} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
