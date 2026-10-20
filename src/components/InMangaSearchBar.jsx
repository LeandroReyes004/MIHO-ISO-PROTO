import React from 'react';
import { Search, Loader2, AlertCircle, Sparkles, BookOpen } from 'lucide-react';
import { useMangaSearch } from '../hooks/useMangaSearch';

/**
 * Visual Search Component wired directly to InMangaExtension and Cloudflare Worker.
 */
export default function InMangaSearchBar({ onSelectManga }) {
  const { query, setQuery, mangaResults, isLoading, error, search, clearResults } = useMangaSearch();

  const handleSubmit = (e) => {
    e.preventDefault();
    search();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Search Input Bar */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', width: '100%' }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-full)',
            padding: '10px 16px',
            border: '1px solid var(--border-active)',
          }}
        >
          {isLoading ? (
            <Loader2 size={18} className="spin" color="var(--accent-hover)" />
          ) : (
            <Search size={18} color="var(--accent-hover)" />
          )}

          <input
            type="text"
            placeholder="Buscar en InManga (ej. One Piece, Berserk, Bleach)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '14.5px',
              outline: 'none',
            }}
          />

          {query && (
            <button
              type="button"
              onClick={clearResults}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Borrar
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          style={{
            background: 'var(--accent-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            padding: '0 20px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: isLoading || !query.trim() ? 'not-allowed' : 'pointer',
            opacity: isLoading || !query.trim() ? 0.6 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {isLoading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {/* Error Message */}
      {error && !isLoading && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#f87171',
            fontSize: '13.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton / State */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
          <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px' }} color="var(--accent-primary)" />
          <p style={{ fontSize: '14px' }}>Consultando InManga a través de Cloudflare Worker...</p>
        </div>
      )}

      {/* Search Results Grid */}
      {!isLoading && mangaResults.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Sparkles size={16} color="var(--accent-hover)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {mangaResults.length} resultados encontrados en InManga:
            </span>
          </div>

          <div className="manga-grid">
            {mangaResults.map((manga) => (
              <div
                key={manga.id}
                onClick={() => onSelectManga && onSelectManga(manga)}
                className="manga-card"
                style={{
                  cursor: 'pointer',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ position: 'relative', width: '100%', paddingTop: '140%', background: '#18171f' }}>
                  <img
                    src={manga.thumbnailUrl}
                    alt={manga.title}
                    loading="lazy"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      // Fallback placeholder if image load fails
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      background: 'rgba(0, 0, 0, 0.75)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: 'var(--accent-hover)',
                    }}
                  >
                    InManga
                  </div>
                </div>

                <div style={{ padding: '8px 10px' }}>
                  <h4
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.3,
                    }}
                  >
                    {manga.title}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
