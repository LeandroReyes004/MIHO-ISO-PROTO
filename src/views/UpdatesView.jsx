import React from 'react';
import { Play, Check, Bell, RefreshCw } from 'lucide-react';

export default function UpdatesView({ updates = [], onOpenManga, onReadChapter }) {
  // Group updates by date
  const groups = [
    { title: 'Hoy', items: updates.filter(u => u.date.startsWith('Hoy')) },
    { title: 'Ayer', items: updates.filter(u => u.date.startsWith('Ayer')) },
    { title: 'Esta semana', items: updates.filter(u => !u.date.startsWith('Hoy') && !u.date.startsWith('Ayer')) },
  ].filter(g => g.items.length > 0);

  return (
    <div style={{ padding: '0 16px calc(var(--nav-height) + var(--sab) + 30px)' }}>
      {groups.length > 0 ? (
        groups.map((group, gIdx) => (
          <div key={gIdx} style={{ marginBottom: '24px' }}>
            <h2
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                margin: '16px 0 10px',
              }}
            >
              {group.title}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {group.items.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onOpenManga(item.mangaId)}
                  className="ios-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                  }}
                >
                  {/* Cover */}
                  <div
                    style={{
                      width: '48px',
                      height: '68px',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      flexShrink: 0,
                      background: 'var(--bg-tertiary)',
                    }}
                  >
                    <img
                      src={item.cover}
                      alt={item.mangaTitle}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
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
                      {item.mangaTitle}
                    </h3>
                    <p
                      style={{
                        fontSize: '12.5px',
                        color: 'var(--accent-hover)',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.chapterTitle}
                    </p>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {item.date}
                    </span>
                  </div>

                  {/* Quick Read Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onReadChapter) onReadChapter(item);
                    }}
                    className="btn-icon"
                    style={{
                      background: 'var(--accent-subtle)',
                      color: 'var(--accent-hover)',
                      width: '36px',
                      height: '36px',
                    }}
                  >
                    <Play size={16} fill="var(--accent-hover)" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 24px',
            textAlign: 'center',
            gap: '14px',
          }}
        >
          <Bell size={40} color="var(--text-tertiary)" />
          <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Sin novedades recientes</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '280px' }}>
            Los nuevos capítulos lanzados por tus mangas en biblioteca aparecerán aquí automáticamente.
          </p>
        </div>
      )}
    </div>
  );
}
