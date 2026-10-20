import React, { useState } from 'react';
import MangaCard from '../components/MangaCard';
import { BookOpen, Search, Compass, Plus } from 'lucide-react';

export default function LibraryView({
  library = [],
  categories = [],
  selectedCategory,
  onSelectCategory,
  onMangaClick,
  onNavigateToBrowse,
  viewMode = 'grid',
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter by category and search term
  const filteredMangas = library.filter((manga) => {
    // Category match
    const matchesCategory =
      selectedCategory === 'Todos' ||
      (manga.categories && manga.categories.includes(selectedCategory));

    // Search query match
    const matchesSearch =
      !searchQuery.trim() ||
      manga.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (manga.author && manga.author.toLowerCase().includes(searchQuery.toLowerCase().trim()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ paddingBottom: 'calc(var(--nav-height) + var(--sab) + 30px)' }}>
      {/* Category Tabs (Mihon horizontal chips) */}
      <div className="category-tabs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Manga Grid or Empty State */}
      {filteredMangas.length > 0 ? (
        <div className={viewMode === 'grid' ? 'manga-grid' : 'manga-list'}>
          {filteredMangas.map((manga) => (
            <MangaCard
              key={manga.id}
              manga={manga}
              onClick={onMangaClick}
              viewMode={viewMode}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 24px',
            textAlign: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'var(--accent-subtle)',
              color: 'var(--accent-hover)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BookOpen size={36} />
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
              {searchQuery ? 'No se encontraron resultados' : 'Tu biblioteca está vacía'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '300px' }}>
              {searchQuery
                ? 'Intenta con otro término de búsqueda o limpia el filtro.'
                : 'Explora fuentes de manga como MangaDex o TMO para añadir tus series favoritas.'}
            </p>
          </div>

          {!searchQuery && (
            <button
              onClick={onNavigateToBrowse}
              className="btn-primary"
              style={{ marginTop: '8px' }}
            >
              <Compass size={18} /> Explorar mangas
            </button>
          )}
        </div>
      )}
    </div>
  );
}
