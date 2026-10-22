import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronRight, Download, Globe, Plus, RefreshCw, Search, Server, BookOpen, Bookmark, Play } from 'lucide-react';
import { suwayomi, imageUrl } from '../services/suwayomi';
import { offline } from '../services/offline';
import { storage } from '../services/storage';
import './SuwayomiBrowse.css';

const chapterDate = (value) => { const time = Number(value); if (!Number.isFinite(time) || time <= 0) return 'Fecha no disponible'; const date = new Date(time); return Number.isNaN(date.getTime()) ? 'Fecha no disponible' : `Publicado: ${date.toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' })}`; };

const language = (code) => ({ es: 'Español', en: 'English', all: 'Multi-idioma', localsourcelang: 'Archivos locales' }[code] || code.toUpperCase());

export default function SuwayomiBrowse({ searchSelection, onSelectionHandled, library = [], onToggleLibrary, onBackToLibrary, onBackToSearch }) {
  const [tab, setTab] = useState('sources');
  const [sources, setSources] = useState([]);
  const [extensions, setExtensions] = useState([]);
  const [repos, setRepos] = useState([]);
  const [source, setSource] = useState(null);
  const [mangas, setMangas] = useState([]);
  const [sourceDetails, setSourceDetails] = useState(null);
  const [catalogTab, setCatalogTab] = useState('POPULAR');
  const [filterValues, setFilterValues] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [manga, setManga] = useState(null);
  const [pages, setPages] = useState(null);
  const [query, setQuery] = useState('');
  const [repo, setRepo] = useState('');
  const [showRepo, setShowRepo] = useState(false);
  const [lang, setLang] = useState('all');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [downloads, setDownloads] = useState([]);
  const [showDownloads, setShowDownloads] = useState(false);
  const [progress, setProgress] = useState('');
  const [offlineUrls, setOfflineUrls] = useState([]);
  const [newChapterIds, setNewChapterIds] = useState([]);
  const [lastChapterCheck, setLastChapterCheck] = useState(null);
  const [chapterOrder, setChapterOrder] = useState('original');
  const [chapterFilter, setChapterFilter] = useState('all');
  const [readChapters, setReadChapters] = useState(storage.getReadChapters);
  const [readingChapter, setReadingChapter] = useState(null);
  const lastPageRef = useRef(null);
  const markRead = (id, read) => setReadChapters(storage.markChapterRead(`suwayomi:${id}`, read));
  useEffect(() => {
    const element = lastPageRef.current;
    if (!pages?.length || readingChapter == null || !element) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting) && element.complete && element.naturalWidth > 0) markRead(readingChapter, true);
    }, { threshold: 0.5 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [pages, readingChapter]);
  const refreshDownloads = async () => setDownloads(await offline.list());
  useEffect(() => { refreshDownloads().catch(() => {}); }, []);
  useEffect(() => () => offlineUrls.forEach(URL.revokeObjectURL), [offlineUrls]);
  const openOffline = (item) => { setReadingChapter(item.id); setError(''); const urls = item.images.map(blob => URL.createObjectURL(blob)); setOfflineUrls(urls); setPages(urls); };
  const downloadChapter = (ch) => run(async () => { try { setProgress('Preparando descarga…'); const urls = await suwayomi.pages(ch.id); await offline.download(ch, manga.manga.title, urls, (done, total) => setProgress(`Descargando ${done}/${total} páginas…`)); await refreshDownloads(); } finally { setProgress(''); } });

  const run = async (work) => {
    setBusy(true); setError('');
    try { await work(); } catch (e) { setError(e.message || 'No se pudo conectar con Suwayomi.'); }
    finally { setBusy(false); }
  };
  const refresh = async () => { const [s, e, r] = await Promise.all([suwayomi.sources(), suwayomi.extensions(), suwayomi.repos()]); setSources(s); setExtensions(e); setRepos(r); };
  useEffect(() => { run(refresh); }, []);
  useEffect(() => { if (!searchSelection) return; const { source: selectedSource, manga: selectedManga } = searchSelection; setSource(selectedSource); setManga(null); setPages(null); setMangas([]); setQuery(''); onSelectionHandled(); run(async () => { setSourceDetails(await suwayomi.sourceDetails(selectedSource.id)); setManga(await suwayomi.chapters(selectedManga.id)); }); }, [searchSelection]);
  useEffect(() => {
    if (!manga?.manga?.id || pages || !navigator.onLine) return;
    const id = manga.manga.id;
    const check = async () => {
      try {
        const updated = await suwayomi.chapters(id);
        setManga(previous => {
          if (!previous || previous.manga.id !== id) return previous;
          const existing = new Set(previous.chapters.map(ch => ch.id));
          const added = updated.chapters.filter(ch => !existing.has(ch.id)).map(ch => ch.id);
          if (added.length) setNewChapterIds(current => [...new Set([...current, ...added])]);
          return updated;
        });
        setLastChapterCheck(Date.now());
      } catch { /* Keep the previous list when offline or a source fails. */ }
    };
    const timer = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [manga?.manga?.id, !!pages]);
  const refreshChapters = () => run(async () => {
    const updated = await suwayomi.chapters(manga.manga.id);
    const existing = new Set(manga.chapters.map(ch => ch.id));
    const added = updated.chapters.filter(ch => !existing.has(ch.id)).map(ch => ch.id);
    setNewChapterIds(current => [...new Set([...current, ...added])]);
    setManga(updated); setLastChapterCheck(Date.now());
  });
  const filtered = extensions.filter(e => (lang === 'all' || e.lang === lang || e.lang === 'all') && e.name.toLowerCase().includes(query.toLowerCase()));
  const shownSources = sources.filter(s => lang === 'all' || s.lang === lang || s.lang === 'all' || s.id === '0');
  const openSource = (s) => { setSource(s); setNewChapterIds([]); setLastChapterCheck(null); setQuery(''); setMangas([]); setSourceDetails(null); setFilterValues({}); setShowFilters(false); setCatalogTab('POPULAR'); run(async () => { setSourceDetails(await suwayomi.sourceDetails(s.id)); setMangas(await suwayomi.catalog(s.id)); }); };
  const filterChanges = () => Object.entries(filterValues).map(([key, value]) => { const [position, child] = key.split('.').map(Number); return child === undefined ? { position, ...value } : { position, groupChange: { position: child, ...value } }; });
  const loadCatalog = (type, useFilters = false) => { setCatalogTab(type); run(async () => { setMangas([]); setMangas(await suwayomi.catalog(source.id, { type, query: query.trim(), filters: useFilters ? filterChanges() : [] })); }); };
  const renderFilter = (f, key) => {
    const value = filterValues[key] || {};
    const change = (field, v) => setFilterValues(prev => ({ ...prev, [key]: { [field]: v } }));
    if (f.__typename === 'GroupFilter') return <fieldset key={key}><legend>{f.name}</legend>{f.filters.map((child, i) => renderFilter(child, `${key}.${i}`))}</fieldset>;
    if (f.__typename === 'HeaderFilter') return <strong key={key}>{f.name}</strong>;
    if (f.__typename === 'SeparatorFilter') return <hr key={key} />;
    if (f.__typename === 'CheckBoxFilter') return <label key={key}><input type="checkbox" checked={value.checkBoxState ?? f.checkboxDefault} onChange={e => change('checkBoxState', e.target.checked)} /> {f.name}</label>;
    if (f.__typename === 'TextFilter') return <label key={key}>{f.name}<input type="text" value={value.textState ?? f.textDefault} onChange={e => change('textState', e.target.value)} /></label>;
    if (f.__typename === 'TriStateFilter') return <label key={key}>{f.name}<select value={value.triState ?? f.triStateDefault} onChange={e => change('triState', e.target.value)}><option value="IGNORE">Cualquiera</option><option value="INCLUDE">Incluir</option><option value="EXCLUDE">Excluir</option></select></label>;
    if (f.__typename === 'SelectFilter') return <label key={key}>{f.name}<select value={value.selectState ?? f.selectDefault} onChange={e => change('selectState', Number(e.target.value))}>{f.values.map((v, i) => <option key={i} value={i}>{v}</option>)}</select></label>;
    if (f.__typename === 'SortFilter') { const selected = value.sortState ?? f.sortDefault ?? { index: 0, ascending: true }; return <label key={key}>{f.name}<select value={selected.index} onChange={e => change('sortState', { ...selected, index: Number(e.target.value) })}>{f.values.map((v, i) => <option key={i} value={i}>{v}</option>)}</select><select value={String(selected.ascending)} onChange={e => change('sortState', { ...selected, ascending: e.target.value === 'true' })}><option value="true">Ascendente</option><option value="false">Descendente</option></select></label>; }
    return null;
  };
  const sortedChapters = manga ? manga.chapters.filter(ch => chapterFilter === 'all' || (chapterFilter === 'read' ? !!readChapters[`suwayomi:${ch.id}`] : !readChapters[`suwayomi:${ch.id}`])).sort((a, b) => chapterOrder === 'original' ? 0 : chapterOrder === 'ascending' ? a.chapterNumber - b.chapterNumber : b.chapterNumber - a.chapterNumber) : [];
  const libraryId = manga ? `suwayomi:${manga.manga.id}` : null;
  const inLibrary = library.some(item => item.id === libraryId);
  const toggleSaved = () => onToggleLibrary({ id: libraryId, suwayomiId: manga.manga.id, suwayomiSource: source, title: manga.manga.title, author: manga.manga.author || '', cover: imageUrl(manga.manga.thumbnailUrl), sourceName: source?.displayName || 'Suwayomi', type: 'Manga', knownChapterIds: manga.chapters.map(ch => ch.id) });
  const back = (fn, label) => <button className="su-back" onClick={fn}><ArrowLeft size={19} /> {label}</button>;

  return <div className="su-browse">
    {error && <div className="su-error" role="alert">{error} {error.includes('Inicia sesión') && <a href="/suwayomi/" target="_blank" rel="noreferrer">Iniciar sesión</a>}</div>}
    {busy && <div className="su-loading"><RefreshCw size={15} className="su-spin" /> {progress || 'Cargando…'}</div>}
    {pages ? <>{back(() => { setPages(null); setOfflineUrls([]); }, showDownloads ? 'Descargas' : 'Capítulos')}<button className="su-reader-back" onClick={() => { setPages(null); setOfflineUrls([]); }}><ArrowLeft size={18} /> Volver</button><div className="su-pages">{pages.map((url, i) => <img key={i} ref={i === pages.length - 1 ? lastPageRef : undefined} src={url} alt={`Página ${i + 1}`} loading="lazy" onLoad={e => { if (i === pages.length - 1 && readingChapter != null) { const rect = e.currentTarget.getBoundingClientRect(); if (rect.bottom <= window.innerHeight && rect.bottom > 0) markRead(readingChapter, true); } }} />)}</div><button className="su-scroll-next" onClick={e => { const main = e.currentTarget.closest('main'); const container = main && getComputedStyle(main).overflowY === 'auto' ? main : window; container.scrollBy({ top: Math.round((container === window ? window.innerHeight : main.clientHeight) * 0.8), behavior: 'smooth' }); }} aria-label="Bajar en el capítulo">↓</button></>
      : manga ? <>{back(() => { if (onBackToLibrary) onBackToLibrary(); else if (onBackToSearch) { setManga(null); onBackToSearch(); } else setManga(null); }, onBackToLibrary ? 'Biblioteca' : onBackToSearch ? 'Búsqueda' : 'Catálogo')}<div className="su-detail su-manga-detail"><div className="su-detail-hero">{manga.manga.thumbnailUrl ? <img className="su-detail-cover" src={imageUrl(manga.manga.thumbnailUrl)} alt="" /> : <span className="su-detail-cover su-cover-empty"><BookOpen /></span>}<div><h2>{manga.manga.title}</h2>{manga.manga.author && <p className="su-detail-author">{manga.manga.author}</p>}<span className="su-detail-source">{source?.displayName || 'Suwayomi'}</span></div></div><div className="su-detail-actions"><button className={inLibrary ? 'su-library-active' : 'su-library-add'} onClick={toggleSaved}><Bookmark size={17} /> {inLibrary ? 'En biblioteca' : 'Añadir a biblioteca'}</button>{manga.chapters.length > 0 && <button className="su-read-first" disabled={busy} onClick={() => { const ch = manga.chapters.reduce((first, current) => current.chapterNumber < first.chapterNumber ? current : first); const saved = downloads.find(d => d.id === ch.id); saved ? openOffline(saved) : run(async () => { const result = await suwayomi.pages(ch.id); setReadingChapter(ch.id); setPages(result); }); }}><Play size={16} /> Leer</button>}</div><p className="su-description">{manga.manga.description || 'Sin descripción disponible.'}</p></div><div className="su-section-title">Capítulos · {manga.chapters.length} <button className="su-update-chapters" disabled={busy} onClick={refreshChapters}>↻ Actualizar capítulos</button>{lastChapterCheck && <span> · Actualizado</span>}</div><div className="su-chapter-order"><label htmlFor="chapter-order">Ordenar capítulos</label><select id="chapter-order" value={chapterOrder} onChange={e => setChapterOrder(e.target.value)}><option value="original">Orden de la fuente</option><option value="ascending">Primero al último</option><option value="descending">Último al primero</option></select></div><div className="su-chapter-order"><label htmlFor="chapter-filter">Filtrar capítulos</label><select id="chapter-filter" value={chapterFilter} onChange={e => setChapterFilter(e.target.value)}><option value="all">Todos</option><option value="unread">No leídos</option><option value="read">Leídos</option></select></div>{sortedChapters.length === 0 && <p className="su-empty">No hay capítulos para este filtro.</p>}{sortedChapters.map(ch => { const saved = downloads.find(d => d.id === ch.id); return <div className="su-row su-chapter" key={ch.id}><button className="su-chapter-open" onClick={() => saved ? openOffline(saved) : run(async () => { const result = await suwayomi.pages(ch.id); setReadingChapter(ch.id); setPages(result); })}><span>{ch.name}<small className="su-chapter-date">{chapterDate(ch.uploadDate)}</small>{readChapters[`suwayomi:${ch.id}`] && <small className="su-saved">✓ Leído</small>}{newChapterIds.includes(ch.id) && <small className="su-saved">● Nuevo</small>}{saved && <small className="su-saved">✓ Descargado</small>}</span><ChevronRight size={18} /></button><button className="su-read-toggle" onClick={() => markRead(ch.id, !readChapters[`suwayomi:${ch.id}`])}>{readChapters[`suwayomi:${ch.id}`] ? 'No leído' : 'Marcar leído'}</button><button className="su-install" disabled={busy || !!saved} onClick={() => downloadChapter(ch)} aria-label={`Descargar ${ch.name}`}><Download size={16} /> {saved ? 'Guardado' : 'Descargar'}</button></div>; })}</>
      : showDownloads ? <>{back(() => setShowDownloads(false), 'Explorar')}<div className="su-detail"><h2>Descargas en este dispositivo</h2><p>Disponibles sin conexión una vez guardadas.</p></div>{downloads.length === 0 && <p className="su-empty">Todavía no has descargado capítulos.</p>}{downloads.map(item => <div className="su-row su-chapter" key={item.id}><button className="su-chapter-open" onClick={() => openOffline(item)}><span>{item.mangaTitle}<small className="su-saved">{item.name} · ✓ Descargado</small></span><ChevronRight size={18} /></button><button className="su-uninstall" onClick={() => run(async () => { await offline.remove(item.id); await refreshDownloads(); })}>Eliminar</button></div>)}</>
      : source ? <>{back(() => { setSource(null); setMangas([]); setQuery(''); }, 'Fuentes')}<div className="su-detail"><h2>{source.displayName}</h2><p>Catálogo de la fuente · {language(source.lang)}</p></div><form className="su-search" onSubmit={e => { e.preventDefault(); loadCatalog('SEARCH', true); }}><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder={`Buscar en ${source.displayName}...`} /><button type="submit">Buscar</button></form><div className="su-filters"><button className={catalogTab === 'POPULAR' ? 'active' : ''} onClick={() => loadCatalog('POPULAR')}>Populares</button><button className={catalogTab === 'LATEST' ? 'active' : ''} disabled={!sourceDetails?.supportsLatest || busy} onClick={() => loadCatalog('LATEST')}>Recientes</button><button className={showFilters ? 'active' : ''} onClick={() => setShowFilters(!showFilters)}>Filtros</button></div>{showFilters && <div className="su-catalog-filters">{sourceDetails?.filters?.length ? sourceDetails.filters.map((f, i) => renderFilter(f, String(i))) : <p>Esta fuente no ofrece filtros.</p>}<button disabled={busy} onClick={() => loadCatalog('SEARCH', true)}>Aplicar filtros</button><button disabled={busy} onClick={() => setFilterValues({})}>Restablecer</button></div>}<div className="manga-grid">{mangas.map(m => <button className="su-manga" key={m.id} onClick={() => run(async () => setManga(await suwayomi.chapters(m.id)))}>{m.thumbnailUrl ? <img src={imageUrl(m.thumbnailUrl)} alt="" loading="lazy" /> : <span className="su-cover-empty"><BookOpen /></span>}<span>{m.title}</span></button>)}</div>{!busy && !error && !mangas.length && <p className="su-empty">No se encontraron títulos en esta fuente.</p>}</>
      : <><div className="su-tabs"><button className={tab === 'sources' ? 'active' : ''} onClick={() => { setTab('sources'); setQuery(''); }}>Fuentes <span>{sources.length}</span></button><button className={tab === 'extensions' ? 'active' : ''} onClick={() => { setTab('extensions'); setQuery(''); }}>Extensiones <span>{extensions.length}</span></button><button className="su-repos" onClick={() => setShowDownloads(true)}><Download size={15} /> {downloads.length}</button><button className="su-repos" onClick={() => setShowRepo(!showRepo)}><Server size={15} /> Repos</button><button className="su-refresh" aria-label="Actualizar fuentes" onClick={() => run(refresh)}><RefreshCw size={17} /></button></div>
        {showRepo && <form className="su-repo-form" onSubmit={e => { e.preventDefault(); run(async () => { await suwayomi.addRepo(repo.trim()); setRepo(''); await suwayomi.refreshExtensions(); await refresh(); setTab('extensions'); }); }}><label htmlFor="repo-url">Repositorios de extensiones</label><p>Introduce la URL de un repositorio de confianza.</p>{repos.length ? repos.map(r => <p key={r.indexUrl}><strong>{r.name}</strong><br />{r.indexUrl}</p>) : <p>No hay repositorios configurados.</p>}<div className="su-search"><input id="repo-url" value={repo} onChange={e => setRepo(e.target.value)} placeholder="https://.../index.min.json" required type="url" /><button type="submit" disabled={busy}><Plus size={15} /> Añadir</button></div><button type="button" disabled={busy} onClick={() => run(async () => { await suwayomi.refreshExtensions(); await refresh(); })}>Actualizar extensiones</button></form>}
        <div className="su-filters">{[{ id: 'all', label: 'Todos' }, { id: 'es', label: '🇪🇸 Español' }, { id: 'en', label: '🇬🇧 English' }].map(f => <button key={f.id} className={lang === f.id ? 'active' : ''} onClick={() => setLang(f.id)}>{f.label}</button>)}</div>
        {tab === 'sources' ? <div className="su-list">{shownSources.length === 0 && !busy && <p className="su-empty">No tienes fuentes instaladas. Añade un repositorio e instala una extensión.</p>}{shownSources.map(s => <button className="su-row" key={s.id} onClick={() => openSource(s)}><span className="su-icon">{s.iconUrl ? <img src={imageUrl(s.iconUrl)} alt="" /> : <Globe size={21} />}</span><span className="su-row-text"><strong>{s.id === '0' ? 'Fuente local' : s.displayName}</strong><small>{language(s.lang)}</small></span><span className="su-explore">Explorar</span><ChevronRight size={17} /></button>)}</div>
          : <><div className="su-search su-extension-search"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar extensión..." /></div><div className="su-section-title">Extensiones · {filtered.length}</div><div className="su-list">{filtered.length === 0 && !busy && <p className="su-empty">No hay extensiones disponibles. Añade un repositorio en «Repos».</p>}{filtered.map(e => <div className="su-row" key={e.pkgName}><span className="su-icon">{e.iconUrl ? <img src={imageUrl(e.iconUrl)} alt="" loading="lazy" /> : <Globe size={21} />}</span><span className="su-row-text"><strong>{e.name}</strong><small>{language(e.lang)} · v{e.versionName}</small></span><button className={e.isInstalled ? 'su-uninstall' : 'su-install'} disabled={busy} onClick={() => run(async () => { await suwayomi.install(e.pkgName, e.isInstalled); await refresh(); })}>{e.isInstalled ? 'Desinstalar' : <><Download size={14} /> Instalar</>}</button></div>)}</div></>}
      </>}
  </div>;
}
