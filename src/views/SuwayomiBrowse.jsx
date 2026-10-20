import React, { useEffect, useState } from 'react';
import { suwayomi, imageUrl } from '../services/suwayomi';

export default function SuwayomiBrowse() {
  const [tab, setTab] = useState('sources');
  const [sources, setSources] = useState([]);
  const [extensions, setExtensions] = useState([]);
  const [source, setSource] = useState(null);
  const [mangas, setMangas] = useState([]);
  const [manga, setManga] = useState(null);
  const [pages, setPages] = useState(null);
  const [query, setQuery] = useState('');
  const [repo, setRepo] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (work) => {
    setBusy(true); setError('');
    try { await work(); } catch (e) { setError(e.message || 'No se pudo conectar con Suwayomi.'); }
    finally { setBusy(false); }
  };
  const refresh = async () => { const [s, e] = await Promise.all([suwayomi.sources(), suwayomi.extensions()]); setSources(s); setExtensions(e); };
  useEffect(() => { run(refresh); }, []);
  const button = { padding: '9px 14px', cursor: 'pointer' };
  const input = { padding: '10px', color: 'var(--text-primary)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', minWidth: 0, flex: 1 };

  return <div style={{ padding: '16px', paddingBottom: '100px' }}>
    {error && <p role="alert" style={{ color: '#ff7777', marginBottom: 12 }}>{error} <a href="/suwayomi/" target="_blank" rel="noreferrer">Abrir inicio de sesión</a></p>}
    {busy && <p>Cargando…</p>}
    {pages ? <><button style={button} onClick={() => setPages(null)}>← Capítulos</button><div>{pages.map((url, i) => <img key={i} src={url} alt={`Página ${i + 1}`} style={{ display: 'block', width: '100%', height: 'auto' }} />)}</div></>
      : manga ? <><button style={button} onClick={() => setManga(null)}>← Catálogo</button><h2>{manga.manga.title}</h2><p>{manga.manga.description}</p>{manga.chapters.map(ch => <button className="ios-card" style={{ display: 'block', width: '100%', textAlign: 'left', padding: 14, marginTop: 8 }} key={ch.id} onClick={() => run(async () => setPages(await suwayomi.pages(ch.id)))}>{ch.name}</button>)}</>
      : source ? <><button style={button} onClick={() => { setSource(null); setMangas([]); }}>← Fuentes</button><h2>{source.displayName}</h2><form style={{ display: 'flex', gap: 8, margin: '12px 0' }} onSubmit={e => { e.preventDefault(); run(async () => setMangas(await suwayomi.catalog(source.id, query.trim()))); }}><input style={input} value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar manga" /><button style={button}>Buscar</button></form><div className="manga-grid">{mangas.map(m => <div key={m.id} onClick={() => run(async () => setManga(await suwayomi.chapters(m.id)))} style={{ cursor: 'pointer' }}><img src={imageUrl(m.thumbnailUrl)} alt="" style={{ width: '100%', borderRadius: 8 }} /><p>{m.title}</p></div>)}</div>{!busy && !mangas.length && <p>No hay resultados.</p>}</>
      : <><div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><button style={button} onClick={() => setTab('sources')}>Fuentes</button><button style={button} onClick={() => setTab('extensions')}>Extensiones</button><button style={button} onClick={() => run(refresh)}>Actualizar</button></div>
        {tab === 'sources' ? <>{sources.length === 0 && !busy && <p>No hay fuentes instaladas. Añade un repositorio en Extensiones.</p>}{sources.map(s => <button className="ios-card" style={{ display: 'block', width: '100%', padding: 14, marginBottom: 8, textAlign: 'left' }} key={s.id} onClick={() => { setSource(s); setQuery(''); run(async () => setMangas(await suwayomi.catalog(s.id))); }}>{s.displayName} · {s.lang}</button>)}</>
          : <><form style={{ display: 'flex', gap: 8, marginBottom: 16 }} onSubmit={e => { e.preventDefault(); run(async () => { await suwayomi.addRepo(repo.trim()); setRepo(''); await refresh(); }); }}><input style={input} value={repo} onChange={e => setRepo(e.target.value)} placeholder="URL del índice del repositorio" required type="url" /><button style={button}>Añadir</button></form><input style={{ ...input, width: '100%', marginBottom: 12 }} value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar extensión" />{extensions.filter(e => e.name.toLowerCase().includes(query.toLowerCase())).map(e => <div className="ios-card" key={e.pkgName} style={{ padding: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between', gap: 8 }}><span>{e.name} · {e.lang}</span><button style={button} disabled={busy} onClick={() => run(async () => { await suwayomi.install(e.pkgName, e.isInstalled); await refresh(); })}>{e.isInstalled ? 'Desinstalar' : 'Instalar'}</button></div>)}</>}
      </>}
  </div>;
}
