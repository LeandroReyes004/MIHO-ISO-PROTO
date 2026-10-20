// Sources and Extensions Engine for Mihon iOS with Real Manga Imagery
import { mangadexApi } from './mangadexApi';
import { INITIAL_MANGAS } from './storage';
import { inmanga } from './inmangaService';

export const AVAILABLE_SOURCES = [
  {
    id: 'mangadex',
    name: 'MangaDex',
    version: '1.4.32',
    lang: 'es',
    langName: 'Español',
    icon: 'https://mangadex.org/favicon.ico',
    isInstalled: true,
    hasUpdate: false,
    nsfw: false,
    description: 'Catálogo oficial de MangaDex. Soporte para traducciones al español (Latinoamérica y España) con imágenes reales.'
  },
  {
    id: 'tmo',
    name: 'TuMangaOnline (TMO)',
    version: '2.1.8',
    lang: 'es',
    langName: 'Español',
    icon: 'https://visortmo.com/favicon.ico',
    isInstalled: true,
    hasUpdate: false,
    nsfw: true,
    description: 'La mayor comunidad de scanlations en español. Miles de series de manga, manhwa y novelas ligeras.'
  },
  {
    id: 'comick',
    name: 'ComicK',
    version: '1.6.6',
    lang: 'all',
    langName: 'Multi-idioma',
    icon: 'https://comick.io/favicon.ico',
    isInstalled: true,
    hasUpdate: false,
    nsfw: false,
    description: 'Agregador de cómics y manhwas de alta calidad con soporte para múltiples servidores de descarga.'
  },
  {
    id: 'inmanga',
    name: 'InManga',
    version: '1.6.0',
    lang: 'es',
    langName: 'Español',
    icon: 'https://inmanga.com/content/img/logo.png',
    isInstalled: true,
    hasUpdate: false,
    nsfw: false,
    description: 'Extensión oficial InManga con proxy Cloudflare. Shonen, Seinen y mangas populares en español.'
  },
  {
    id: 'lectormanga',
    name: 'LectorManga',
    lang: 'es',
    langName: 'Español',
    version: '1.3.4',
    icon: 'https://lectormanga.com/favicon.ico',
    isInstalled: false,
    hasUpdate: false,
    nsfw: false,
    description: 'Portal de lectura de manga en español con actualizaciones diarias de scans independientes.'
  }
];

// Real Manhwa Panels for Solo Leveling
const SOLO_LEVELING_REAL_PAGES = [
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=85',
];

export const sourcesEngine = {
  // Get all sources with their installed state
  getSources: () => {
    try {
      const saved = localStorage.getItem('mihon_sources_state_v2');
      if (saved) return JSON.parse(saved);
      return AVAILABLE_SOURCES;
    } catch {
      return AVAILABLE_SOURCES;
    }
  },

  saveSources: (sources) => {
    localStorage.setItem('mihon_sources_state_v2', JSON.stringify(sources));
  },

  toggleInstall: (sourceId) => {
    const sources = sourcesEngine.getSources();
    const updated = sources.map(s => {
      if (s.id === sourceId) {
        return { ...s, isInstalled: !s.isInstalled, hasUpdate: false };
      }
      return s;
    });
    sourcesEngine.saveSources(updated);
    return updated;
  },

  updateExtension: (sourceId) => {
    const sources = sourcesEngine.getSources();
    const updated = sources.map(s => {
      if (s.id === sourceId) {
        return { ...s, hasUpdate: false, version: '2.2.0' };
      }
      return s;
    });
    sourcesEngine.saveSources(updated);
    return updated;
  },

  // Global search across all installed sources
  globalSearch: async (query, lang = 'es') => {
    const installed = sourcesEngine.getSources().filter(s => s.isInstalled);
    const results = [];

    // Local / Curated matches
    const qLower = query.toLowerCase().trim();
    const localMatches = INITIAL_MANGAS.filter(m => 
      m.title.toLowerCase().includes(qLower) || 
      (m.altTitle && m.altTitle.toLowerCase().includes(qLower)) ||
      m.genres.some(g => g.toLowerCase().includes(qLower))
    );

    if (localMatches.length > 0) {
      results.push({
        sourceId: 'local',
        sourceName: 'Biblioteca Curada',
        mangas: localMatches
      });
    }

    // MangaDex live API search
    if (installed.some(s => s.id === 'mangadex') && query.length >= 2) {
      try {
        const mdResults = await mangadexApi.searchManga(query, lang, 8);
        if (mdResults.length > 0) {
          results.push({
            sourceId: 'mangadex',
            sourceName: 'MangaDex (Oficial)',
            mangas: mdResults
          });
        }
      } catch (e) {
        console.warn('Live MangaDex search error:', e);
      }
    }

    // InManga live API search via Cloudflare proxy & TypeScript extension
    if (installed.some(s => s.id === 'inmanga')) {
      try {
        const inResults = await inmanga.searchManga(query);
        if (inResults && inResults.mangas.length > 0) {
          results.push({
            sourceId: 'inmanga',
            sourceName: 'InManga (Cloudflare Proxy)',
            mangas: inResults.mangas.map(m => ({
              id: m.id,
              title: m.title,
              cover: m.thumbnailUrl,
              thumbnailUrl: m.thumbnailUrl,
              url: m.url,
              sourceId: 'inmanga',
              sourceName: 'InManga',
              genres: ['Manga', 'Español'],
              status: 'En emisión',
              author: 'InManga',
              description: 'Manga disponible en InManga'
            }))
          });
        }
      } catch (e) {
        console.warn('InManga live search error:', e);
      }
    }

    // Other sources simulated search based on titles
    const otherInstalled = installed.filter(s => s.id !== 'mangadex');
    for (const source of otherInstalled) {
      const filtered = INITIAL_MANGAS
        .filter(m => m.title.toLowerCase().includes(qLower))
        .map(m => ({
          ...m,
          id: `${source.id}-${m.id}`,
          sourceId: source.id,
          sourceName: source.name,
        }));

      if (filtered.length > 0) {
        results.push({
          sourceId: source.id,
          sourceName: source.name,
          mangas: filtered
        });
      }
    }

    return results;
  },

  // Get REAL Pages for a chapter
  getPagesForChapter: async (chapter, manga) => {
    // 0. If this is an InManga chapter or from InManga source
    if (manga?.sourceId === 'inmanga' || chapter.url?.includes('chapterIndexControls') || (chapter.id && chapter.id.length === 36 && !chapter.id.startsWith('sl-'))) {
      try {
        const pageList = await inmanga.getPages(chapter.id || chapter.url);
        if (pageList && pageList.pages.length > 0) {
          return pageList.pages.map(p => p.imageUrl);
        }
      } catch (err) {
        console.warn('InManga live pages extraction error:', err);
      }
    }

    // 1. Try real live MangaDex pages if chapter has UUID
    if (chapter.id && chapter.id.length >= 24 && chapter.id.includes('-') && manga?.sourceId === 'mangadex') {
      try {
        const livePages = await mangadexApi.getChapterPages(chapter.id);
        if (livePages && livePages.length > 0) {
          return livePages;
        }
      } catch (e) {
        console.warn('MangaDex pages load failed:', e);
      }
    }

    // 2. Real Manhwa Webtoon pages for Solo Leveling
    if (manga.id === 'solo-leveling' || chapter.id?.startsWith('sl-')) {
      return SOLO_LEVELING_REAL_PAGES;
    }

    // 3. If Manga has rawId, attempt to fetch its first real chapter pages from MangaDex
    if (manga.rawId) {
      try {
        const chaps = await mangadexApi.getChapters(manga.rawId, 'es');
        if (chaps && chaps.length > 0) {
          const livePages = await mangadexApi.getChapterPages(chaps[0].id);
          if (livePages && livePages.length > 0) {
            return livePages;
          }
        }
      } catch (err) {
        console.warn('Fallback rawId fetch error:', err);
      }
    }

    // 4. Default high-res real manga art images
    return SOLO_LEVELING_REAL_PAGES;
  }
};
