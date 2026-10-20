import React from 'react';
import { BookOpen, Check } from 'lucide-react';

export default function MangaCard({ manga, onClick, viewMode = 'grid' }) {
  const isRead = manga.unreadCount === 0;

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onClick(manga)}
        className="ios-card"
        style={{
          display: 'flex',
          gap: '12px',
          padding: '10px',
          margin: '0 16px 10px',
          cursor: 'pointer',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '80px',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            flexShrink: 0,
            background: 'var(--bg-tertiary)',
            position: 'relative',
          }}
        >
          <img
            src={manga.cover}
            alt={manga.title}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {manga.title}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {manga.author || 'Autor desconocido'} • {manga.type || 'Manga'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span className="badge-source">{manga.sourceName || 'MangaDex'}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
              {manga.status}
            </span>
          </div>
        </div>

        {manga.unreadCount > 0 ? (
          <span className="badge-unread">
            {manga.unreadCount}
          </span>
        ) : (
          <span style={{ color: 'var(--status-success)' }}>
            <Check size={18} />
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick(manga)}
      className="manga-card"
    >
      <div className="manga-cover-wrap">
        <img
          src={manga.cover}
          alt={manga.title}
          loading="lazy"
          className="manga-cover"
        />

        <div className="manga-gradient-overlay" />

        {/* Unread Badge (Mihon style top-right) */}
        {manga.unreadCount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'var(--accent-primary)',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: 'var(--radius-full)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
              zIndex: 2,
            }}
          >
            {manga.unreadCount}
          </div>
        )}

        {/* Status chip (Bottom-left over cover) */}
        <div
          style={{
            position: 'absolute',
            bottom: '6px',
            left: '6px',
            background: 'rgba(15, 13, 24, 0.75)',
            backdropFilter: 'blur(6px)',
            color: 'var(--text-secondary)',
            fontSize: '9.5px',
            fontWeight: 700,
            padding: '1px 6px',
            borderRadius: '4px',
            border: '1px solid rgba(255,255,255,0.1)',
            zIndex: 2,
          }}
        >
          {manga.type || 'Manga'}
        </div>
      </div>

      <div className="manga-card-info">
        <h3 className="manga-card-title">{manga.title}</h3>
        <span className="manga-card-sub">
          {manga.sourceName || 'MangaDex'}
        </span>
      </div>
    </div>
  );
}
