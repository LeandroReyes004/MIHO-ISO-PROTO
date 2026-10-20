import React, { useEffect, useState } from 'react';
import { ArrowLeft, ChevronRight, Download, Globe, Plus, RefreshCw, Search, Server, BookOpen } from 'lucide-react';
import { suwayomi, imageUrl } from '../services/suwayomi';
import './SuwayomiBrowse.css';

const language = (code) => ({ es: 'Español', en: 'English', all: 'Multi-idioma', localsourcelang: 'Archivos locales' }[code] || code.toUpperCase());

export default function SuwayomiBrowse() {
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

  const run = async (work) => {
    setBusy(true); setError('');
    try { await work(); } catch (e) { setError(e.message || 'No se pudo conectar con Suwayomi.'); }
    finally { setBusy(false); }
  };
  const refresh = async () => { const [s, e, r] = await Promise.all([suwayomi.sources(), suwayomi.extensions(), suwayomi.repos()]); setSources(s); setExtensions(e); setRepos(r); };
  useEffect(() => { run(refresh); }, []);
  const filtered = extensions.filter(e => (lang === 'all' || e.lang === lang || e.lang === 'all') && e.name.toLowerCase().includes(query.toLowerCase()));
  const shownSources = sources.filter(s => lang === 'all' || s.lang === lang || s.lang === 'all' || s.id === '0');
  const openSource = (s) => { setSource(s); setQuery(''); setMangas([]); setSourceDetails(null); setFilterValues({}); setShowFilters(false); setCatalogTab('POPULAR'); run(async () => { setSourceDetails(await suwayomi.sourceDetails(s.id)); setMangas(await suwayomi.catalog(s.id)); }); };
  const filterChanges = () => Object.entries(filterValues).map(([key, value]) => { const [position, child] = key.split('.').map(Number); return child === undefined ? { position, ...value } : { position, groupChange: { position: child, ...value } }; });
  const loadCatalog = (type, useFilters = false) => { setCatalogTab(type); run(async () => { setMangas([]); setMangas(await suwayomi.catalog(source.id, { type, query: query.trim(), filters: useFilters ? filterChanges() : [] })); }); };
  const renderFilter = (f, key) => {
    const value = filterValues[key] || {};
    const change = (field, v) => setFilterValues(prev => ({ ...prev, [key]: { [field]: v } }));
    if (f.__typename === 'GroupFilter') return <fieldset key={key}><legend>{f.name}</legend>{f.filters.map((child, i) => renderFilter(child, `${key}.${i}`))}</fieldset>;
    if (f.__typename === 'HeaderFilter') return <strong key={key}>{f.name}</strong>;
    if (f.__typename === 'SeparatorFilter') return <hr key={key} />;
    if (f.__typename === 'CheckBoxFilter') return <label key={key}><input type="checkbox" checked={value.checkBoxState ?? f.default} onChange={e => change('checkBoxState', e.target.checked)} /> {f.name}</label>;
    if (f.__typename === 'TextFilter') return <label key={key}>{f.name}<input type="text" value={value.textState ?? f.default} onChange={e => change('textState', e.target.value)} /></label>;
    if (f.__typename === 'TriStateFilter') return <label key={key}>{f.name}<select value={value.triState ?? f.default} onChange={e => change('triState', e.target.value)}><option value="IGNORE">Cualquiera</option><option value="INCLUDE">Incluir</option><option value="EXCLUDE">Excluir</option></select></label>;
    if (f.__typename === 'SelectFilter') return <label key={key}>{f.name}<select value={value.selectState ?? f.default} onChange={e => change('selectState', Number(e.target.value))}>{f.values.map((v, i) => <option key={i} value={i}>{v}</option>)}</select></label>;
    if (f.__typename === 'SortFilter') { const selected = value.sortState ?? f.default ?? { index: 0, ascending: true }; return <label key={key}>{f.name}<select value={selected.index} onChange={e => change('sortState', { ...selected, index: Number(e.target.value) })}>{f.values.map((v, i) => <option key={i} value={i}>{v}</option>)}</select><select value={String(selected.ascending)} onChange={e => change('sortState', { ...selected, ascending: e.target.value === 'true' })}><option value="true">Ascendente</option><option value="false">Descendente</option></select></label>; }
    return null;
  };
  const back = (fn, label) => <button className="su-back" onClick={fn}><ArrowLeft size={19} /> {label}</button>;

  return <div className="su-browse">
    {error && <div className="su-error" role="alert">{error} {error.includes('Inicia sesión') && <a href="/suwayomi/" target="_blank" rel="noreferrer">Iniciar sesión</a>}</div>}
    {busy && <div className="su-loading"><RefreshCw size={15} className="su-spin" /> Cargando…</div>}
    {pages ? <>{back(() => setPages(null), 'Capítulos')}<div className="su-pages">{pages.map((url, i) => <img key={i} src={url} alt={`Página ${i + 1}`} loading="lazy" />)}</div></>
      : manga ? <>{back(() => setManga(null), 'Catálogo')}<div className="su-detail"><h2>{manga.manga.title}</h2><p>{manga.manga.description || 'Sin descripción disponible.'}</p></div><div className="su-section-title">Capítulos · {manga.chapters.length}</div>{manga.chapters.map(ch => <button className="su-row su-chapter" key={ch.id} onClick={() => run(async () => setPages(await suwayomi.pages(ch.id)))}><span>{ch.name}</span><ChevronRight size={18} /></button>)}</>
      : source ? <>{back(() => { setSource(null); setMangas([]); setQuery(''); }, 'Fuentes')}<div className="su-detail"><h2>{source.displayName}</h2><p>Catálogo de la fuente · {language(source.lang)}</p></div><form className="su-search" onSubmit={e => { e.preventDefault(); loadCatalog('SEARCH', true); }}><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder={`Buscar en ${source.displayName}...`} /><button type="submit">Buscar</button></form><div className="su-filters"><button className={catalogTab === 'POPULAR' ? 'active' : ''} onClick={() => loadCatalog('POPULAR')}>Populares</button><button className={catalogTab === 'LATEST' ? 'active' : ''} disabled={!sourceDetails?.supportsLatest || busy} onClick={() => loadCatalog('LATEST')}>Recientes</button><button className={showFilters ? 'active' : ''} onClick={() => setShowFilters(!showFilters)}>Filtros</button></div>{showFilters && <div className="su-catalog-filters">{sourceDetails?.filters?.length ? sourceDetails.filters.map((f, i) => renderFilter(f, String(i))) : <p>Esta fuente no ofrece filtros.</p>}<button disabled={busy} onClick={() => loadCatalog('SEARCH', true)}>Aplicar filtros</button><button disabled={busy} onClick={() => setFilterValues({})}>Restablecer</button></div>}<div className="manga-grid">{mangas.map(m => <button className="su-manga" key={m.id} onClick={() => run(async () => setManga(await suwayomi.chapters(m.id)))}>{m.thumbnailUrl ? <img src={imageUrl(m.thumbnailUrl)} alt="" loading="lazy" /> : <span className="su-cover-empty"><BookOpen /></span>}<span>{m.title}</span></button>)}</div>{!busy && !error && !mangas.length && <p className="su-empty">No se encontraron títulos en esta fuente.</p>}</>
      : <><div className="su-tabs"><button className={tab === 'sources' ? 'active' : ''} onClick={() => { setTab('sources'); setQuery(''); }}>Fuentes <span>{sources.length}</span></button><button className={tab === 'extensions' ? 'active' : ''} onClick={() => { setTab('extensions'); setQuery(''); }}>Extensiones <span>{extensions.length}</span></button><button className="su-repos" onClick={() => setShowRepo(!showRepo)}><Server size={15} /> Repos</button><button className="su-refresh" aria-label="Actualizar fuentes" onClick={() => run(refresh)}><RefreshCw size={17} /></button></div>
        {showRepo && <form className="su-repo-form" onSubmit={e => { e.preventDefault(); run(async () => { await suwayomi.addRepo(repo.trim()); setRepo(''); await suwayomi.refreshExtensions(); await refresh(); setTab('extensions'); }); }}><label htmlFor="repo-url">Repositorios de extensiones</label><p>Introduce la URL de un repositorio de confianza.</p>{repos.length ? repos.map(r => <p key={r.indexUrl}><strong>{r.name}</strong><br />{r.indexUrl}</p>) : <p>No hay repositorios configurados.</p>}<div className="su-search"><input id="repo-url" value={repo} onChange={e => setRepo(e.target.value)} placeholder="https://.../index.min.json" required type="url" /><button type="submit" disabled={busy}><Plus size={15} /> Añadir</button></div><button type="button" disabled={busy} onClick={() => run(async () => { await suwayomi.refreshExtensions(); await refresh(); })}>Actualizar extensiones</button></form>}
        <div className="su-filters">{[{ id: 'all', label: 'Todos' }, { id: 'es', label: '🇪🇸 Español' }, { id: 'en', label: '🇬🇧 English' }].map(f => <button key={f.id} className={lang === f.id ? 'active' : ''} onClick={() => setLang(f.id)}>{f.label}</button>)}</div>
        {tab === 'sources' ? <div className="su-list">{shownSources.length === 0 && !busy && <p className="su-empty">No tienes fuentes instaladas. Añade un repositorio e instala una extensión.</p>}{shownSources.map(s => <button className="su-row" key={s.id} onClick={() => openSource(s)}><span className="su-icon">{s.iconUrl ? <img src={imageUrl(s.iconUrl)} alt="" /> : <Globe size={21} />}</span><span className="su-row-text"><strong>{s.id === '0' ? 'Fuente local' : s.displayName}</strong><small>{language(s.lang)}</small></span><span className="su-explore">Explorar</span><ChevronRight size={17} /></button>)}</div>
          : <><div className="su-search su-extension-search"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar extensión..." /></div><div className="su-section-title">Extensiones · {filtered.length}</div><div className="su-list">{filtered.length === 0 && !busy && <p className="su-empty">No hay extensiones disponibles. Añade un repositorio en «Repos».</p>}{filtered.map(e => <div className="su-row" key={e.pkgName}><span className="su-icon">{e.iconUrl ? <img src={imageUrl(e.iconUrl)} alt="" loading="lazy" /> : <Globe size={21} />}</span><span className="su-row-text"><strong>{e.name}</strong><small>{language(e.lang)} · v{e.versionName}</small></span><button className={e.isInstalled ? 'su-uninstall' : 'su-install'} disabled={busy} onClick={() => run(async () => { await suwayomi.install(e.pkgName, e.isInstalled); await refresh(); })}>{e.isInstalled ? 'Desinstalar' : <><Download size={14} /> Instalar</>}</button></div>)}</div></>}
      </>}
  </div>;
}
