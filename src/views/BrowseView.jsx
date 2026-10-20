import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Search, 
  Download, 
  Check, 
  RefreshCw, 
  Layers, 
  ArrowLeft, 
  Sparkles,
  ExternalLink,
  Plus,
  Server
} from 'lucide-react';
import { sourcesEngine } from '../services/sourcesEngine';
import { mangadexApi } from '../services/mangadexApi';
import { repoService } from '../services/repoService';
import { inmanga } from '../services/inmangaService';
import { INITIAL_MANGAS } from '../services/storage';
import MangaCard from '../components/MangaCard';
import RepoManagerModal from '../components/RepoManagerModal';

export default function BrowseView({ onOpenManga }) {
  const [activeSubTab, setActiveSubTab] = useState('sources'); // 'sources' | 'extensions'
  const [sources, setSources] = useState(sourcesEngine.getSources());
  const [repoExtensions, setRepoExtensions] = useState(repoService.getAllExtensions());
  const [langFilter, setLangFilter] = useState('all'); // 'all', 'es', 'en'
  const [extensionSearch, setExtensionSearch] = useState('');
  const [selectedSource, setSelectedSource] = useState(null);
  const [isRepoModalOpen, setIsRepoModalOpen] = useState(false);

  // Live source catalog state
  const [catalogMangas, setCatalogMangas] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [sourceSearchQuery, setSourceSearchQuery] = useState('');

  // Reload extensions from repoService
  const refreshExtensions = () => {
    setRepoExtensions(repoService.getAllExtensions());
  };

  // Toggle install / uninstall extension from repo
  const handleToggleRepoInstall = (pkg) => {
    repoService.toggleInstallExtension(pkg);
    refreshExtensions();

    // Also update installed sources in sourcesEngine
    const ext = repoExtensions.find(e => e.pkg === pkg);
    if (ext) {
      sourcesEngine.toggleInstall(ext.name.toLowerCase().replace(/[^a-z0-9]/g, ''));
      setSources(sourcesEngine.getSources());
    }
  };

  // Load catalog when ANY source is selected
  useEffect(() => {
    let active = true;
    if (selectedSource) {
      setLoadingCatalog(true);

      // InManga live catalog
      if (selectedSource.id === 'inmanga') {
        inmanga.getPopularManga(1).then(res => {
          if (active) {
            setCatalogMangas(res.mangas.map(m => ({
              ...m,
              cover: m.thumbnailUrl,
              sourceId: 'inmanga',
              sourceName: 'InManga',
              status: 'Popular'
            })));
            setLoadingCatalog(false);
          }
        }).catch(err => {
          console.warn('InManga catalog error:', err);
          if (active) setLoadingCatalog(false);
        });
        return () => { active = false; };
      }

      const lang = selectedSource.lang || (selectedSource.langName?.includes('Español') ? 'es' : 'all');
      
      mangadexApi.searchManga('', lang, 20).then(results => {
        if (active) {
          const tagged = results.map(m => ({
            ...m,
            sourceId: selectedSource.id,
            sourceName: selectedSource.name,
          }));
          setCatalogMangas(tagged);
          setLoadingCatalog(false);
        }
      }).catch(() => {
        if (active) {
          setCatalogMangas(INITIAL_MANGAS.map(m => ({
            ...m,
            sourceId: selectedSource.id,
            sourceName: selectedSource.name,
          })));
          setLoadingCatalog(false);
        }
      });
    }
    return () => { active = false; };
  }, [selectedSource]);

  // Handle live search in ANY source catalog
  const handleSourceSearch = async (e) => {
    e.preventDefault();
    if (!sourceSearchQuery.trim()) return;
    setLoadingCatalog(true);

    if (selectedSource?.id === 'inmanga') {
      try {
        const res = await inmanga.searchManga(sourceSearchQuery);
        setCatalogMangas(res.mangas.map(m => ({
          ...m,
          cover: m.thumbnailUrl,
          sourceId: 'inmanga',
          sourceName: 'InManga',
          status: 'En emisión'
        })));
      } catch (err) {
        console.warn('InManga search error:', err);
      } finally {
        setLoadingCatalog(false);
      }
      return;
    }

    const lang = selectedSource?.lang || (selectedSource?.langName?.includes('Español') ? 'es' : 'all');
    try {
      const results = await mangadexApi.searchManga(sourceSearchQuery, lang, 20);
      const tagged = results.map(m => ({
        ...m,
        sourceId: selectedSource?.id || 'source',
        sourceName: selectedSource?.name || 'Fuente',
      }));
      setCatalogMangas(tagged);
    } catch (err) {
      console.warn('Source search error:', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  // Filter extensions from repo by language and search term
  const filteredRepoExtensions = repoExtensions.filter(ext => {
    const matchesLang = langFilter === 'all' || ext.lang === langFilter || ext.lang === 'all';
    const matchesSearch = !extensionSearch.trim() || 
      ext.name.toLowerCase().includes(extensionSearch.toLowerCase().trim()) ||
      ext.description.toLowerCase().includes(extensionSearch.toLowerCase().trim());
    return matchesLang && matchesSearch;
  });

  const installedExtensions = filteredRepoExtensions.filter(e => e.isInstalled);
  const availableExtensions = filteredRepoExtensions.filter(e => !e.isInstalled);

  // If viewing a source's catalog
  if (selectedSource) {
    return (
      <div style={{ paddingBottom: 'calc(var(--nav-height) + var(--sab) + 30px)' }}>
        {/* Source Catalog Header */}
        <div
          className="ios-glass-header"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            padding: 'calc(var(--sat) + 8px) 16px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <button
            onClick={() => setSelectedSource(null)}
            className="btn-icon"
            style={{ color: '#ffffff' }}
          >
            <ArrowLeft size={20} />
          </button>

          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700 }}>{selectedSource.name}</h2>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
              Catálogo de la fuente • {selectedSource.langName}
            </span>
          </div>
        </div>

        {/* Catalog Search Bar */}
        <form onSubmit={handleSourceSearch} style={{ padding: '12px 16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-full)',
              padding: '0 14px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Search size={18} color="var(--text-tertiary)" />
            <input
              type="text"
              placeholder={`Buscar en ${selectedSource.name}...`}
              value={sourceSearchQuery}
              onChange={(e) => setSourceSearchQuery(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                padding: '10px 12px',
                fontSize: '13.5px',
                outline: 'none',
              }}
            />
            {sourceSearchQuery && (
              <button
                type="submit"
                style={{
                  background: 'var(--accent-primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Buscar
              </button>
            )}
          </div>
        </form>

        {/* Catalog Results Grid */}
        {loadingCatalog ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Cargando títulos desde {selectedSource.name}...
          </div>
        ) : catalogMangas.length > 0 ? (
          <div className="manga-grid">
            {catalogMangas.map((manga) => (
              <MangaCard
                key={manga.id}
                manga={manga}
                onClick={onOpenManga}
              />
            ))}
          </div>
        ) : (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No se encontraron mangas en esta búsqueda.
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 'calc(var(--nav-height) + var(--sab) + 30px)' }}>
      {/* Sub Tabs: Fuentes vs Extensiones + Botón Repositorios */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 16px',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <button
          onClick={() => setActiveSubTab('sources')}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeSubTab === 'sources' ? 'var(--accent-subtle)' : 'transparent',
            color: activeSubTab === 'sources' ? 'var(--accent-hover)' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '13.5px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          Fuentes ({installedExtensions.length})
        </button>

        <button
          onClick={() => setActiveSubTab('extensions')}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeSubTab === 'extensions' ? 'var(--accent-subtle)' : 'transparent',
            color: activeSubTab === 'extensions' ? 'var(--accent-hover)' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '13.5px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          Extensiones ({repoExtensions.length})
        </button>

        {/* Repositories Button */}
        <button
          onClick={() => setIsRepoModalOpen(true)}
          className="btn-secondary"
          title="Gestionar Repositorios de Extensiones"
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            gap: '6px',
            borderColor: 'var(--border-active)',
            color: 'var(--accent-hover)',
          }}
        >
          <Server size={14} /> Repos
        </button>
      </div>

      {/* Language Filter Chips */}
      <div className="category-tabs" style={{ padding: '10px 16px' }}>
        {[
          { id: 'all', label: 'Todos' },
          { id: 'es', label: '🇪🇸 Español' },
          { id: 'en', label: '🇬🇧 English' },
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setLangFilter(filter.id)}
            className={`category-pill ${langFilter === filter.id ? 'active' : ''}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Sources Tab Content */}
      {activeSubTab === 'sources' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {installedExtensions.length > 0 ? (
            installedExtensions.map((ext) => (
              <div
                key={ext.pkg}
                onClick={() => setSelectedSource({ id: ext.pkg, name: ext.name, langName: ext.langName })}
                className="ios-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border-subtle)',
                      fontWeight: 800,
                      color: 'var(--accent-hover)',
                    }}
                  >
                    {ext.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {ext.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span className="badge-source">{ext.langName}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        v{ext.version} • {ext.repoName}
                      </span>
                    </div>
                  </div>
                </div>

                <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '12.5px' }}>
                  Explorar
                </button>
              </div>
            ))
          ) : (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No tienes fuentes instaladas para este filtro. Ve a la pestaña <strong>Extensiones</strong> para instalar fuentes desde los repositorios.
            </div>
          )}
        </div>
      )}

      {/* Extensions Tab Content with Repo Search */}
      {activeSubTab === 'extensions' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Extension Search Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-full)',
              padding: '0 14px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Search size={17} color="var(--text-tertiary)" />
            <input
              type="text"
              placeholder="Buscar en el repositorio (TuMangaOnline, InManga, ComicK...)"
              value={extensionSearch}
              onChange={(e) => setExtensionSearch(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                padding: '9px 12px',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          {/* Installed Extensions */}
          {installedExtensions.length > 0 && (
            <div>
              <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Instaladas ({installedExtensions.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {installedExtensions.map((ext) => (
                  <div
                    key={ext.pkg}
                    className="ios-card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                    }}
                  >
                    <div style={{ flex: 1, marginRight: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 700 }}>{ext.name}</h4>
                        <span className="badge-source">{ext.langName}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                        {ext.description}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleRepoInstall(ext.pkg)}
                      className="btn-secondary"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        color: 'var(--status-danger)',
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                      }}
                    >
                      Desinstalar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available in Repository */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Disponibles en el repositorio ({availableExtensions.length})
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--accent-hover)' }}>
                Keiyoushi Repo
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {availableExtensions.map((ext) => (
                <div
                  key={ext.pkg}
                  className="ios-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ flex: 1, marginRight: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 700 }}>{ext.name}</h4>
                      <span className="badge-source">{ext.langName}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                      {ext.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleRepoInstall(ext.pkg)}
                    className="btn-primary"
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    <Download size={14} /> Instalar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Extension Repositories Manager Modal */}
      <RepoManagerModal
        isOpen={isRepoModalOpen}
        onClose={() => setIsRepoModalOpen(false)}
        onReposUpdated={refreshExtensions}
      />
    </div>
  );
}
