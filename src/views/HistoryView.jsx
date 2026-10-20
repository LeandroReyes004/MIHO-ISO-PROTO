import React, { useState } from 'react';
import { History, Play, Trash2, Clock } from 'lucide-react';
import { storage } from '../services/storage';

export default function HistoryView({ history = [], onResumeReading, onClearHistory }) {
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Reciente';
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Justo ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} d`;
  };

  return (
    <div style={{ padding: '0 16px calc(var(--nav-height) + var(--sab) + 30px)' }}>
      {/* History Header Action */}
      {history.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 0 8px',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-tertiary)' }}>
            {history.length} Capítulos leídos recientemente
          </span>

          <button
            onClick={onClearHistory}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--status-danger)',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Trash2 size={14} /> Borrar historial
          </button>
        </div>
      )}

      {/* History Entries */}
      {history.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {history.map((entry, idx) => {
            const progressPct = entry.totalPages ? Math.round((entry.page / entry.totalPages) * 100) : 0;

            return (
              <div
                key={entry.id || idx}
                onClick={() => onResumeReading(entry)}
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
                    src={entry.cover}
                    alt={entry.mangaTitle}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* Info & Progress */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                    {entry.mangaTitle}
                  </h3>

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
                    {entry.chapterTitle || `Capítulo ${entry.chapterNumber}`}
                  </p>

                  {/* Progress Bar & Page Numbers */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        flex: 1,
                        height: '4px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${progressPct}%`,
                          height: '100%',
                          background: 'var(--accent-gradient)',
                          borderRadius: '2px',
                        }}
                      />
                    </div>

                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', minWidth: '70px', textAlign: 'right' }}>
                      Pág. {entry.page}/{entry.totalPages || '?'} ({progressPct}%)
                    </span>
                  </div>

                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {formatTimeAgo(entry.readAt)}
                  </span>
                </div>

                {/* Resume Play Icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onResumeReading(entry);
                  }}
                  className="btn-icon"
                  style={{
                    background: 'var(--accent-subtle)',
                    color: 'var(--accent-hover)',
                    width: '38px',
                    height: '38px',
                  }}
                >
                  <Play size={16} fill="var(--accent-hover)" />
                </button>
              </div>
            );
          })}
        </div>
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
          <Clock size={42} color="var(--text-tertiary)" />
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Sin historial de lectura</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '280px' }}>
            Los capítulos que leas se guardarán aquí con su progreso para que puedas reanudar fácilmente.
          </p>
        </div>
      )}
    </div>
  );
}
