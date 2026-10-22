import React, { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import Reader from './components/Reader';
import GlobalSearchModal from './components/GlobalSearchModal';
import FilterModal from './components/FilterModal';

import LibraryView from './views/LibraryView';
import UpdatesView from './views/UpdatesView';
import HistoryView from './views/HistoryView';
import SuwayomiBrowse from './views/SuwayomiBrowse';
import MoreView from './views/MoreView';
import MangaDetailsView from './views/MangaDetailsView';

import { storage } from './services/storage';
import { suwayomi } from './services/suwayomi';

export default function App() {
  const [activeTab, setActiveTab] = useState('library');
  const [searchSelection, setSearchSelection] = useState(null);
  const [openedFromLibrary, setOpenedFromLibrary] = useState(false);
  const [openedFromSearch, setOpenedFromSearch] = useState(false);
  const [library, setLibrary] = useState(storage.getLibrary());
  const [categories, setCategories] = useState(storage.getCategories());
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [history, setHistory] = useState(storage.getHistory());
  const [updates, setUpdates] = useState([]);
  const [settings, setSettings] = useState(storage.getSettings());

  // Views & modals state
  const [selectedManga, setSelectedManga] = useState(null);
  const [readingSession, setReadingSession] = useState(null); // { manga, chapter }
  const [viewMode, setViewMode] = useState('grid');
  const [isSimulator, setIsSimulator] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter & sort
  const [sortBy, setSortBy] = useState('manual');
  const [libraryUpdating, setLibraryUpdating] = useState(false);
  const [libraryMessage, setLibraryMessage] = useState('');
  const [filters, setFilters] = useState({ unreadOnly: false, startedOnly: false, completedOnly: false });

  // Reload data from storage
  const reloadData = () => {
    setLibrary(storage.getLibrary());
    setCategories(storage.getCategories());
    setHistory(storage.getHistory());
    setSettings(storage.getSettings());
  };

  const refreshLibraryChapters = async () => {
    const titles = storage.getLibrary().filter(m => m.suwayomiId != null);
    if (!titles.length) { setLibraryMessage('Añade mangas de Suwayomi a tu biblioteca para buscar capítulos nuevos.'); return; }
    setLibraryUpdating(true); setLibraryMessage('Buscando capítulos nuevos…');
    let failures = 0, found = 0;
    for (const item of titles) {
      try {
        const result = await suwayomi.chapters(item.suwayomiId);
        const ids = result.chapters.map(ch => ch.id);
        const known = item.knownChapterIds;
        const count = Array.isArray(known) ? ids.filter(id => !known.includes(id)).length : 0;
        found += count;
        const current = storage.getLibrary();
        const index = current.findIndex(m => m.id === item.id);
        if (index >= 0) { current[index] = { ...current[index], knownChapterIds: ids, unreadCount: (current[index].unreadCount || 0) + count }; storage.saveLibrary(current); setLibrary(current); }
      } catch { failures++; }
    }
    setLibraryMessage(`${found ? `${found} capítulos nuevos encontrados.` : 'No se encontraron capítulos nuevos.'}${failures ? ` No se pudieron actualizar ${failures} mangas.` : ''}`);
    setLibraryUpdating(false);
  };
  const moveLibraryManga = (id, direction) => {
    const current = storage.getLibrary();
    const index = current.findIndex(m => m.id === id), next = index + direction;
    if (index < 0 || next < 0 || next >= current.length) return;
    [current[index], current[next]] = [current[next], current[index]];
    storage.saveLibrary(current); setLibrary(current); setSortBy('manual');
  };

  // Open manga details
  const handleOpenManga = (mangaOrId) => {
    if (typeof mangaOrId === 'object' && mangaOrId.suwayomiId != null) {
      setSelectedManga(null);
      setOpenedFromLibrary(true);
      setOpenedFromSearch(false);
      setSearchSelection({ source: mangaOrId.suwayomiSource, manga: { id: mangaOrId.suwayomiId } });
      setActiveTab('browse');
      return;
    }
    if (typeof mangaOrId === 'string') {
      const found = library.find(m => m.id === mangaOrId) || {
        id: mangaOrId,
        title: mangaOrId.replace(/-/g, ' ').toUpperCase(),
        cover: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
        author: 'Autor',
        status: 'En emisión',
        sourceName: 'MangaDex',
        chapters: [
          { id: `${mangaOrId}-ch1`, number: 1, title: 'Capítulo 1', scan: 'Scan', date: 'Reciente', pagesCount: 22 }
        ]
      };
      setSelectedManga(found);
    } else {
      setSelectedManga(mangaOrId);
    }
  };

  // Open chapter in Reader
  const handleOpenChapter = (chapter, manga) => {
    setReadingSession({ manga, chapter });
  };

  // Handle next / previous chapter navigation in Reader
  const handleChapterNavigation = (direction) => {
    if (!readingSession) return;
    const { manga, chapter } = readingSession;
    const chapters = manga.chapters || [];
    const currentIndex = chapters.findIndex(c => c.id === chapter.id);

    if (currentIndex === -1) return;

    if (direction === 'next') {
      // In descending order, next chapter is index - 1 (or + 1 depending on sort)
      const nextIndex = currentIndex - 1;
      if (nextIndex >= 0 && chapters[nextIndex]) {
        setReadingSession({ manga, chapter: chapters[nextIndex] });
      }
    } else if (direction === 'prev') {
      const prevIndex = currentIndex + 1;
      if (prevIndex < chapters.length && chapters[prevIndex]) {
        setReadingSession({ manga, chapter: chapters[prevIndex] });
      }
    }
  };

  // Toggle in/out of Library
  const handleToggleLibrary = (manga) => {
    const isNowIn = storage.toggleLibraryManga(manga);
    setLibrary(storage.getLibrary());
    if (selectedManga && selectedManga.id === manga.id) {
      setSelectedManga(prev => ({ ...prev, inLibrary: isNowIn }));
    }
  };

  // Resume reading from history entry
  const handleResumeReading = (historyEntry) => {
    const manga = library.find(m => m.id === historyEntry.mangaId) || {
      id: historyEntry.mangaId,
      title: historyEntry.mangaTitle,
      cover: historyEntry.cover,
      chapters: [
        { id: historyEntry.chapterId, number: historyEntry.chapterNumber, title: historyEntry.chapterTitle, pagesCount: historyEntry.totalPages || 25 }
      ]
    };

    const chapter = (manga.chapters || []).find(c => c.id === historyEntry.chapterId) || {
      id: historyEntry.chapterId,
      number: historyEntry.chapterNumber,
      title: historyEntry.chapterTitle,
      pagesCount: historyEntry.totalPages || 25,
    };

    setReadingSession({ manga, chapter });
  };

  // Clear history
  const handleClearHistory = () => {
    if (window.confirm('¿Deseas vaciar todo el historial de lectura?')) {
      storage.clearHistory();
      setHistory([]);
    }
  };

  // Dynamic Page Title
  const getTabTitle = () => {
    switch (activeTab) {
      case 'library': return 'Biblioteca';
      case 'updates': return 'Novedades';
      case 'history': return 'Historial';
      case 'browse': return 'Explorar';
      case 'more': return 'Más';
      default: return 'Mihon';
    }
  };

  // Unread badge calculation
  const totalUnreadCount = library.reduce((acc, m) => acc + (m.unreadCount || 0), 0);
  const updatesBadgeCount = updates.filter(u => u.unread).length;

  // Filtered and sorted library
  const getFilteredLibrary = () => {
    let list = [...library];

    if (filters.unreadOnly) {
      list = list.filter(m => (m.unreadCount || 0) > 0);
    }
    if (filters.completedOnly) {
      list = list.filter(m => m.status === 'Completado');
    }

    if (sortBy === 'alphabetical') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'unreadCount') {
      list.sort((a, b) => (b.unreadCount || 0) - (a.unreadCount || 0));
    } else if (sortBy === 'lastRead') {
      list.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    }

    return list;
  };

  // Render Inner Content
  const renderContent = () => {
    if (selectedManga) {
      const inLib = library.some(m => m.id === selectedManga.id);
      return (
        <MangaDetailsView
          manga={selectedManga}
          isInLibrary={inLib}
          onBack={() => setSelectedManga(null)}
          onOpenChapter={handleOpenChapter}
          onToggleLibrary={handleToggleLibrary}
        />
      );
    }

    switch (activeTab) {
      case 'library':
        return (
          <LibraryView
            library={getFilteredLibrary()}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onMangaClick={handleOpenManga}
            onNavigateToBrowse={() => setActiveTab('browse')}
            viewMode={viewMode}
            onRefresh={refreshLibraryChapters}
            updating={libraryUpdating}
            message={libraryMessage}
            onMove={moveLibraryManga}
          />
        );
      case 'updates':
        return (
          <UpdatesView
            updates={updates}
            onOpenManga={handleOpenManga}
            onReadChapter={(item) => {
              const manga = library.find(m => m.id === item.mangaId) || {
                id: item.mangaId,
                title: item.mangaTitle,
                cover: item.cover,
                chapters: [{ id: `up-${item.chapterNumber}`, number: item.chapterNumber, title: item.chapterTitle, pagesCount: 26 }]
              };
              handleOpenChapter(manga.chapters[0], manga);
            }}
          />
        );
      case 'history':
        return (
          <HistoryView
            history={history}
            onResumeReading={handleResumeReading}
            onClearHistory={handleClearHistory}
          />
        );
      case 'browse':
        return (
          <SuwayomiBrowse searchSelection={searchSelection} onSelectionHandled={() => setSearchSelection(null)} library={library} onToggleLibrary={handleToggleLibrary} onBackToLibrary={openedFromLibrary ? () => { setOpenedFromLibrary(false); setActiveTab('library'); } : null} onBackToSearch={openedFromSearch ? () => { setOpenedFromSearch(false); setIsSearchOpen(true); } : null} />
        );
      case 'more':
        return (
          <MoreView
            settings={settings}
            onUpdateSettings={(newSettings) => {
              setSettings(newSettings);
              storage.saveSettings(newSettings);
            }}
            isSimulator={isSimulator}
            onToggleSimulator={() => setIsSimulator(!isSimulator)}
            onReloadData={reloadData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-app)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: isSimulator ? 'center' : 'stretch',
        padding: isSimulator ? '30px 10px' : 0,
      }}
    >
      {/* Container - adapts to Full Screen or iPhone 16 Pro Frame */}
      <div
        style={{
          width: '100%',
          maxWidth: isSimulator ? '420px' : '720px',
          height: isSimulator ? '890px' : 'auto',
          minHeight: isSimulator ? '890px' : '100vh',
          background: 'var(--bg-primary)',
          borderRadius: isSimulator ? '54px' : '0px',
          border: isSimulator ? '12px solid #282730' : 'none',
          boxShadow: isSimulator ? '0 25px 70px rgba(0,0,0,0.85), 0 0 0 2px rgba(255,255,255,0.1)' : 'none',
          position: 'relative',
          overflow: isSimulator ? 'hidden' : 'visible',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Dynamic Island on Simulator Frame */}
        {isSimulator && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '120px',
              height: '32px',
              background: '#000000',
              borderRadius: '20px',
              zIndex: 90,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#1c1b24' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#0a0a14', border: '1.5px solid #232230' }} />
          </div>
        )}

        {/* Top Bar (shown when not in manga details) */}
        {!selectedManga && (
          <TopBar
            title={openedFromLibrary && activeTab === 'browse' ? 'Biblioteca' : getTabTitle()}
            onSearchClick={() => setIsSearchOpen(true)}
            onFilterClick={activeTab === 'library' ? () => setIsFilterOpen(true) : null}
            viewMode={viewMode}
            onToggleViewMode={activeTab === 'library' ? () => setViewMode(v => v === 'grid' ? 'list' : 'grid') : null}
            isSimulator={isSimulator}
            onToggleSimulator={() => setIsSimulator(!isSimulator)}
          />
        )}

        {/* View Content */}
        <main style={{ flex: 1, overflowY: isSimulator ? 'auto' : 'visible' }}>
          {renderContent()}
        </main>

        {/* Bottom Tab Bar (shown when not in manga details and not in reader) */}
        {!selectedManga && !readingSession && (
          <BottomNav
            activeTab={openedFromLibrary && activeTab === 'browse' ? 'library' : activeTab}
            setActiveTab={(tab) => { setOpenedFromLibrary(false); setOpenedFromSearch(false); setActiveTab(tab); }}
            unreadCount={totalUnreadCount}
            updatesCount={updatesBadgeCount}
            extensionUpdates={1}
            isSimulator={isSimulator}
          />
        )}

        {/* iPhone Home Indicator on Simulator */}
        {isSimulator && (
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '136px',
              height: '5px',
              background: 'rgba(255, 255, 255, 0.45)',
              borderRadius: '3px',
              zIndex: 90,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectManga={(selection) => { setOpenedFromLibrary(false); setOpenedFromSearch(true); setSelectedManga(null); setSearchSelection(selection); setActiveTab('browse'); }}
      />

      {/* Library Filter Modal */}
      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        sortBy={sortBy}
        onSelectSort={setSortBy}
        filters={filters}
        onToggleFilter={(fId) => setFilters(prev => ({ ...prev, [fId]: !prev[fId] }))}
        onResetFilters={() => setFilters({ unreadOnly: false, startedOnly: false, completedOnly: false })}
      />

      {/* Active Manga Reader */}
      {readingSession && (
        <Reader
          manga={readingSession.manga}
          chapter={readingSession.chapter}
          onBack={() => setReadingSession(null)}
          onChapterChange={handleChapterNavigation}
        />
      )}
    </div>
  );
}
