// MangaDex API Service Client (Connected to Mihon Backend API Proxy)

const MANGADEX_BASE = 'https://api.mangadex.org';
const COVER_BASE = 'https://uploads.mangadex.org/covers';

export const mangadexApi = {
  // Search manga with cover art & authors
  searchManga: async (query, lang = 'es', limit = 20) => {
    // 1. Try Backend API first
    try {
      const res = await fetch(`/api/manga/search?q=${encodeURIComponent(query || '')}&lang=${lang}&limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch {
      // Backend not reached, fallback to client fetch
    }

    // 2. Direct MangaDex fetch fallback
    try {
      const url = new URL(`${MANGADEX_BASE}/manga`);
      if (query && query.trim()) {
        url.searchParams.append('title', query.trim());
      }
      url.searchParams.append('limit', limit.toString());
      url.searchParams.append('includes[]', 'cover_art');
      url.searchParams.append('includes[]', 'author');
      url.searchParams.append('includes[]', 'artist');
      url.searchParams.append('order[relevance]', 'desc');
      url.searchParams.append('contentRating[]', 'safe');
      url.searchParams.append('contentRating[]', 'suggestive');

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`MangaDex error: ${res.status}`);
      const json = await res.json();

      return (json.data || []).map(item => {
        const titleObj = item.attributes?.title || {};
        const title = titleObj.en || titleObj.ja || Object.values(titleObj)[0] || 'Sin título';
        const descObj = item.attributes?.description || {};
        const description = descObj.es || descObj['es-la'] || descObj.en || Object.values(descObj)[0] || '';

        const coverRel = (item.relationships || []).find(r => r.type === 'cover_art');
        const coverFileName = coverRel?.attributes?.fileName;
        const cover = coverFileName 
          ? `${COVER_BASE}/${item.id}/${coverFileName}.256.jpg`
          : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80';

        const authorRel = (item.relationships || []).find(r => r.type === 'author');
        const author = authorRel?.attributes?.name || 'Desconocido';
        const tags = (item.attributes?.tags || []).map(t => t.attributes?.name?.en).filter(Boolean);

        return {
          id: `md-${item.id}`,
          rawId: item.id,
          title,
          cover,
          banner: cover,
          author,
          artist: author,
          status: item.attributes?.status === 'completed' ? 'Completado' : 'En emisión',
          type: 'Manga',
          sourceId: 'mangadex',
          sourceName: 'MangaDex (Oficial)',
          lang: lang,
          description,
          genres: tags.slice(0, 5),
          inLibrary: false,
          unreadCount: 0,
        };
      });
    } catch (e) {
      console.warn('MangaDex API fetch fallback:', e.message);
      return [];
    }
  },

  // Popular manga list
  getPopularManga: async (limit = 20) => {
    return mangadexApi.searchManga('', 'es', limit);
  },

  // Get chapter feed for a manga
  getChapters: async (rawMangaId, lang = 'es') => {
    // 1. Try Backend API first
    try {
      const res = await fetch(`/api/manga/${rawMangaId}/chapters?lang=${lang}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch {
      // Backend not reached, fallback
    }

    // 2. Direct MangaDex fetch
    try {
      const url = new URL(`${MANGADEX_BASE}/manga/${rawMangaId}/feed`);
      url.searchParams.append('translatedLanguage[]', lang);
      url.searchParams.append('translatedLanguage[]', 'es-la');
      url.searchParams.append('translatedLanguage[]', 'en');
      url.searchParams.append('order[chapter]', 'desc');
      url.searchParams.append('limit', '100');
      url.searchParams.append('includes[]', 'scanlation_group');

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`MangaDex chapters error: ${res.status}`);
      const json = await res.json();

      return (json.data || [])
        .filter(ch => (ch.attributes?.pages > 0) && !ch.attributes?.externalUrl)
        .map(ch => {
          const scanRel = (ch.relationships || []).find(r => r.type === 'scanlation_group');
          const scan = scanRel?.attributes?.name || 'Scanlation';
          const num = parseFloat(ch.attributes?.chapter) || 0;
          const title = ch.attributes?.title 
            ? `Capítulo ${num} - ${ch.attributes.title}` 
            : `Capítulo ${num}`;

          return {
            id: ch.id,
            number: num,
            title,
            scan,
            date: ch.attributes?.publishAt?.slice(0, 10) || 'Reciente',
            pagesCount: ch.attributes?.pages || 24,
            lang: ch.attributes?.translatedLanguage
          };
        });
    } catch (e) {
      console.warn('Failed to fetch chapters from MangaDex:', e.message);
      return [];
    }
  },

  // Get Chapter page image URLs
  getChapterPages: async (chapterId) => {
    // 1. Try Backend API first (returns proxied images)
    try {
      const res = await fetch(`/api/chapter/${chapterId}/pages`);
      if (res.ok) {
        const json = await res.json();
        if (json.pages && json.pages.length > 0) {
          return json.pages;
        }
      }
    } catch {
      // Fallback
    }

    // 2. Direct MangaDex at-home fetch
    try {
      const res = await fetch(`${MANGADEX_BASE}/at-home/server/${chapterId}`);
      if (!res.ok) throw new Error(`MangaDex at-home error: ${res.status}`);
      const json = await res.json();
      const baseUrl = json.baseUrl;
      const hash = json.chapter?.hash;
      const hasFullData = json.chapter?.data && json.chapter.data.length > 0;
      const dataFiles = hasFullData ? json.chapter.data : (json.chapter?.dataSaver || []);
      const folder = hasFullData ? 'data' : 'data-saver';

      if (!baseUrl || !hash || !dataFiles.length) {
        throw new Error('No page data in response');
      }

      return dataFiles.map(file => `${baseUrl}/${folder}/${hash}/${file}`);
    } catch (e) {
      console.warn('MangaDex pages fallback:', e.message);
      return null;
    }
  }
};
