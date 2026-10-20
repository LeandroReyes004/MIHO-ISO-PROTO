import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend files from dist
app.use(express.static(path.join(__dirname, 'dist')));

const MANGADEX_BASE = 'https://api.mangadex.org';
const COVER_BASE = 'https://uploads.mangadex.org/covers';

// 1. Health check & status
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', service: 'Mihon iOS API Server', time: new Date().toISOString() });
});

// 2. Manga Search API (Server-side fetch, no CORS restrictions)
app.get('/api/manga/search', async (req, res) => {
  try {
    const { q = '', lang = 'es', limit = 20 } = req.query;
    const url = new URL(`${MANGADEX_BASE}/manga`);
    if (q) url.searchParams.append('title', q);
    url.searchParams.append('limit', limit.toString());
    url.searchParams.append('includes[]', 'cover_art');
    url.searchParams.append('includes[]', 'author');
    url.searchParams.append('includes[]', 'artist');
    url.searchParams.append('order[relevance]', 'desc');
    url.searchParams.append('contentRating[]', 'safe');
    url.searchParams.append('contentRating[]', 'suggestive');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mihon-iOS/1.0.0 (https://github.com/mihonapp/mihon)',
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'MangaDex upstream error' });
    }

    const json = await response.json();
    const mangas = (json.data || []).map(item => {
      const titleObj = item.attributes?.title || {};
      const title = titleObj.en || titleObj.ja || Object.values(titleObj)[0] || 'Manga';
      const descObj = item.attributes?.description || {};
      const description = descObj.es || descObj['es-la'] || descObj.en || Object.values(descObj)[0] || '';

      const coverRel = (item.relationships || []).find(r => r.type === 'cover_art');
      const coverFileName = coverRel?.attributes?.fileName;
      const rawCover = coverFileName 
        ? `${COVER_BASE}/${item.id}/${coverFileName}.256.jpg`
        : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80';

      const cover = `/api/image-proxy?url=${encodeURIComponent(rawCover)}`;
      const authorRel = (item.relationships || []).find(r => r.type === 'author');
      const author = authorRel?.attributes?.name || 'Autor';
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
        lang,
        description,
        genres: tags.slice(0, 5),
        inLibrary: false,
        unreadCount: 0,
      };
    });

    res.json(mangas);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Manga Chapters API (Filtered for hosted chapters with real pages)
app.get('/api/manga/:rawId/chapters', async (req, res) => {
  try {
    const { rawId } = req.params;
    const { lang = 'es' } = req.query;

    const url = new URL(`${MANGADEX_BASE}/manga/${rawId}/feed`);
    url.searchParams.append('translatedLanguage[]', lang);
    if (lang === 'es') url.searchParams.append('translatedLanguage[]', 'es-la');
    url.searchParams.append('translatedLanguage[]', 'en'); // Fallback
    url.searchParams.append('order[chapter]', 'desc');
    url.searchParams.append('limit', '100');
    url.searchParams.append('includes[]', 'scanlation_group');

    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': 'Mihon-iOS/1.0.0' }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch chapters' });
    }

    const json = await response.json();
    const chapters = (json.data || [])
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

    res.json(chapters);
  } catch (error) {
    console.error('Chapters error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Chapter Pages API (Returns real images routed through our proxy)
app.get('/api/chapter/:chapterId/pages', async (req, res) => {
  try {
    const { chapterId } = req.params;
    const response = await fetch(`${MANGADEX_BASE}/at-home/server/${chapterId}`);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'MangaDex at-home error' });
    }

    const json = await response.json();
    const baseUrl = json.baseUrl;
    const hash = json.chapter?.hash;
    const hasFullData = json.chapter?.data && json.chapter.data.length > 0;
    const dataFiles = hasFullData ? json.chapter.data : (json.chapter?.dataSaver || []);
    const folder = hasFullData ? 'data' : 'data-saver';

    if (!baseUrl || !hash || !dataFiles.length) {
      return res.status(404).json({ error: 'No pages found for chapter' });
    }

    // Wrap each image through our server proxy to prevent ANY CORS/hotlinking issues
    const pages = dataFiles.map(file => {
      const rawUrl = `${baseUrl}/${folder}/${hash}/${file}`;
      return `/api/image-proxy?url=${encodeURIComponent(rawUrl)}`;
    });

    res.json({ pages, count: pages.length });
  } catch (error) {
    console.error('Pages error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Image Proxy (Crucial for mobile! Bypasses Referer & CORS blocks)
app.get('/api/image-proxy', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).send('Missing url parameter');

    const imageResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': new URL(url).origin,
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      }
    });

    if (!imageResponse.ok) {
      return res.status(imageResponse.status).send('Upstream image error');
    }

    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable'); // Cache for 7 days

    const arrayBuffer = await imageResponse.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(500).send('Error proxying image');
  }
});

// Fallback all SPA routes to index.html (Express 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Mihon iOS API Server running at:`);
  console.log(`   - Local:    http://localhost:${PORT}`);
  console.log(`   - Red Wi-Fi: http://10.0.0.162:${PORT}`);
});
