import React, { useEffect, useState } from 'react';
import { Search, X, BookOpen } from 'lucide-react';
import { suwayomi, imageUrl } from '../services/suwayomi';

export default function GlobalSearchModal({ isOpen, onClose, onSelectManga }) {
  const [query, setQuery] = useState('');
  const [lang, setLang] = useState('es');
  const [sources, setSources] = useState([]);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('');
  const [failed, setFailed] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setStatus('Cargando fuentes…');
    suwayomi.sources().then(items => { if (active) { setSources(items.filter(s => s.id !== '0')); setStatus(''); } }).catch(e => { if (active) setStatus(e.message); });
    return () => { active = false; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    const term = query.trim();
    setResults([]); setFailed(0);
    if (term.length < 2) return () => { active = false; };
    const timer = setTimeout(async () => {
      const selected = sources.filter(s => lang === 'all' || s.lang === lang || s.lang === 'all');
      if (!selected.length) { setStatus('No hay fuentes instaladas para este idioma.'); return; }
      let index = 0, completed = 0, failures = 0;
      setStatus(`Buscando en ${selected.length} fuentes…`);
      const worker = async () => {
        while (active && index < selected.length) {
          const source = selected[index++];
          try {
            const mangas = await suwayomi.catalog(source.id, { type: 'SEARCH', query: term });
            if (active && mangas.length) setResults(prev => [...prev, { source, mangas }]);
          } catch { failures++; }
          completed++;
          if (active) { setFailed(failures); setStatus(completed === selected.length ? '' : `Buscando: ${completed} de ${selected.length} fuentes…`); }
        }
      };
      await Promise.all(Array.from({ length: Math.min(4, selected.length) }, worker));
    }, 600);
    return () => { active = false; clearTimeout(timer); };
  }, [query, lang, sources, isOpen]);

  if (!isOpen) return null;
  return <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
    <div style={{ padding: 'calc(var(--sat) + 12px) 16px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="su-search" style={{ flex: 1 }}><Search size={18} /><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar en fuentes instaladas…" /><button type="button" onClick={() => setQuery('')} aria-label="Borrar búsqueda"><X size={15} /></button></div>
      <button className="btn-icon" onClick={onClose} aria-label="Cerrar"><X size={22} /></button>
    </div>
    <div className="su-filters">{[{id:'es', label:'Español'}, {id:'en', label:'English'}, {id:'all', label:'Todos'}].map(option => <button key={option.id} className={lang === option.id ? 'active' : ''} onClick={() => setLang(option.id)}>{option.label}</button>)}</div>
    <div style={{ overflowY: 'auto', padding: '0 16px 30px', flex: 1 }}>
      {status && <p style={{ color:'var(--text-secondary)', fontSize:13 }}>{status}</p>}
      {failed > 0 && <p style={{ color:'var(--text-secondary)', fontSize:12 }}>No se pudo buscar en {failed} {failed === 1 ? 'fuente' : 'fuentes'}; las demás siguen disponibles.</p>}
      {results.map(group => <section key={group.source.id} style={{ marginBottom:24 }}><h3 style={{ fontSize:15, margin:'14px 0' }}>{group.source.displayName} · {group.source.lang}</h3><div className="manga-grid">{group.mangas.map(manga => <button key={manga.id} className="su-manga" onClick={() => { onSelectManga({ source: group.source, manga }); onClose(); }}>{manga.thumbnailUrl ? <img src={imageUrl(manga.thumbnailUrl)} alt="" loading="lazy" onError={e => { e.currentTarget.style.visibility = 'hidden'; }} /> : <span className="su-cover-empty"><BookOpen /></span>}<span>{manga.title}</span></button>)}</div></section>)}
      {!status && !results.length && <p className="su-empty">{query.trim().length < 2 ? 'Escribe al menos dos letras para buscar.' : failed ? 'No hubo resultados disponibles. Algunas fuentes no respondieron.' : 'No se encontraron resultados.'}</p>}
    </div>
  </div>;
}
