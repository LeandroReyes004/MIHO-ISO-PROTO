import React, { useState } from 'react';
import { Search, X, Layers, ArrowRight } from 'lucide-react';
import { sourcesEngine } from '../services/sourcesEngine';
import MangaCard from './MangaCard';

export default function GlobalSearchModal({ isOpen, onClose, onSelectManga }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    try {
      const res = await sourcesEngine.globalSearch(query);
      setResults(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        background: 'rgba(8, 7, 13, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Search Header */}
      <div
        style={{
          padding: 'calc(var(--sat) + 12px) 16px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'var(--bg-secondary)',
        }}
      >
        <form
          onSubmit={handleSearch}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-full)',
            padding: '8px 14px',
            border: '1px solid var(--border-active)',
          }}
        >
          <Search size={19} color="var(--accent-hover)" />
          <input
            autoFocus
            type="text"
            placeholder="Buscar en todas las fuentes..."
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
              onClick={() => setQuery('')}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          )}
        </form>

        <button
          onClick={onClose}
          className="btn-icon"
          style={{ color: 'var(--text-primary)' }}
        >
          <X size={22} />
        </button>
      </div>

      {/* Results or Helper Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
        }}
      >
        {searching ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '14px' }}>Buscando en MangaDex y fuentes activas...</p>
          </div>
        ) : results.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {results.map((group) => (
              <div key={group.sourceId}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Layers size={17} color="var(--accent-hover)" />
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {group.sourceName}
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    ({group.mangas.length} resultados)
                  </span>
                </div>

                <div className="manga-grid">
                  {group.mangas.map((manga) => (
                    <MangaCard
                      key={manga.id}
                      manga={manga}
                      onClick={(m) => {
                        onClose();
                        onSelectManga(m);
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : query && !searching ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No se encontraron resultados para "{query}". Presiona Enter o prueba con otro título.
          </div>
        ) : (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <p style={{ fontSize: '14px', lineHeight: 1.6 }}>
              Escribe el nombre de un manga (ej. <em>Solo Leveling, One Piece, Frieren</em>) para buscar simultáneamente en todas las extensiones instaladas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
