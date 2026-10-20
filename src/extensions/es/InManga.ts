import { BaseExtension } from '../BaseExtension';
import {
  ChapterItem,
  ChapterList,
  ExtensionConfig,
  ExtensionMetadata,
  MangaDetails,
  MangaItem,
  MangaList,
  MangaStatus,
  PageItem,
  PageList,
} from '../types';

/**
 * Raw DTOs matching InManga's double-serialized JSON response.
 * Ported from Keiyoushi's Dto.kt.
 */
interface InMangaResultDto {
  data?: string;
}

interface InMangaResultObjectDto<T> {
  success: boolean;
  result?: T[];
}

interface InMangaChapterDto {
  Number?: number;
  RegistrationDate?: string;
  Identification?: string;
  FriendlyChapterNumber?: string;
  PagesCount?: number;
}

/**
 * TypeScript port of Keiyoushi's InManga extension (InManga.kt).
 *
 * Characteristics:
 * - Language: Spanish (es)
 * - Base URL: https://inmanga.com
 * - Image CDN: https://cdn1.intomanga.com
 * - Catalog: Form-urlencoded POST to /manga/getMangasConsultResult
 * - Chapters: Double JSON-serialized string in GET /chapter/getall
 * - Pages: HTML index control parsing with reconstructed CDN URLs
 */
export class InMangaExtension extends BaseExtension {
  readonly metadata: ExtensionMetadata = {
    id: 'es.inmanga',
    name: 'InManga',
    lang: 'es',
    baseUrl: 'https://inmanga.com',
    version: '1.6.0',
    iconUrl: 'https://inmanga.com/content/img/logo.png',
  };

  private readonly imageCDN = 'https://cdn1.intomanga.com';

  constructor(config: ExtensionConfig = {}) {
    super(config);
  }

  /**
   * Required custom headers replicating Kotlin OkHttp interceptors.
   * Prevents Cloudflare or anti-bot drops on InManga endpoints.
   */
  protected override getDefaultHeaders(): Record<string, string> {
    return {
      ...super.getDefaultHeaders(),
      Referer: 'https://inmanga.com/',
      'X-Requested-With': 'XMLHttpRequest',
    };
  }

  /**
   * Builds the x-www-form-urlencoded body matching `mangaRequestBody` in InManga.kt.
   */
  private buildMangaRequestBody(
    page: number,
    sortBy: number,
    query = ''
  ): URLSearchParams {
    const params = new URLSearchParams();
    params.append('filter[generes][]', '-1');
    params.append('filter[queryString]', query);
    params.append('filter[skip]', ((page - 1) * 10).toString());
    params.append('filter[take]', '10');
    params.append('filter[sortby]', sortBy.toString());
    params.append('filter[broadcastStatus]', '0');
    params.append('filter[onlyFavorites]', 'false');
    params.append('d', '');
    return params;
  }

  /**
   * Parses the HTML result of manga search/catalog queries.
   * Direct translation of Kotlin `parseMangasPage(document: Document): MangasPage`.
   */
  private parseMangasPage(doc: Document, page = 1): MangaList {
    // InManga returns results wrapped in <a> elements inside body
    const elements = Array.from(
      doc.querySelectorAll<HTMLAnchorElement>('body > a, a.manga-result')
    );

    const mangas: MangaItem[] = elements
      .map((el) => {
        const rawHref = el.getAttribute('href') || '';
        if (!rawHref) return null;

        const url = new URL(rawHref, this.metadata.baseUrl).href;
        // InManga URLs: /ver/manga/{slug}/{identification}
        const id = rawHref.startsWith('/') ? rawHref : `/${rawHref}`;

        const title =
          el.querySelector('h4.m0')?.textContent?.trim() ||
          el.querySelector('h4')?.textContent?.trim() ||
          '';

        const imgEl = el.querySelector('img');
        const rawThumb =
          imgEl?.getAttribute('data-src') ||
          imgEl?.getAttribute('src') ||
          '';

        const thumbnailUrl = rawThumb
          ? new URL(rawThumb, this.metadata.baseUrl).href
          : '';

        return {
          id,
          title,
          thumbnailUrl: this.proxiedImageUrl(thumbnailUrl),
          url,
          extensionId: this.metadata.id,
        };
      })
      .filter((m): m is MangaItem => m !== null);

    // Each page in InManga has a batch size of 10
    const hasNextPage = elements.length === 10;

    return {
      mangas,
      hasNextPage,
      page,
    };
  }

  /**
   * Search for manga matching `query`.
   * Translated from Kotlin:
   * override suspend fun getSearchMangaList(page: Int, query: String, filters: FilterList): MangasPage
   */
  async searchManga(query: string, page = 1): Promise<MangaList> {
    const body = this.buildMangaRequestBody(page, 1, query);

    const html = await this.fetchText(
      `${this.metadata.baseUrl}/manga/getMangasConsultResult`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: body.toString(),
      }
    );

    const doc = this.parseHtml(html);
    return this.parseMangasPage(doc, page);
  }

  /**
   * Popular manga catalog (sortBy = 1).
   * Translated from Kotlin:
   * override suspend fun getPopularManga(page: Int): MangasPage
   */
  async getPopularManga(page = 1): Promise<MangaList> {
    const body = this.buildMangaRequestBody(page, 1, '');

    const html = await this.fetchText(
      `${this.metadata.baseUrl}/manga/getMangasConsultResult`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: body.toString(),
      }
    );

    const doc = this.parseHtml(html);
    return this.parseMangasPage(doc, page);
  }

  /**
   * Latest updates catalog (sortBy = 3).
   * Translated from Kotlin:
   * override suspend fun getLatestUpdates(page: Int): MangasPage
   */
  async getLatestUpdates(page = 1): Promise<MangaList> {
    const body = this.buildMangaRequestBody(page, 3, '');

    const html = await this.fetchText(
      `${this.metadata.baseUrl}/manga/getMangasConsultResult`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: body.toString(),
      }
    );

    const doc = this.parseHtml(html);
    return this.parseMangasPage(doc, page);
  }

  /**
   * Parses manga status string according to Kotlin logic:
   * "En emisión" -> ONGOING
   * "Finalizado" -> COMPLETED
   */
  private parseStatus(statusText: string | null | undefined): MangaStatus {
    if (!statusText) return 'UNKNOWN';
    const normalized = statusText.toLowerCase();
    if (normalized.includes('emisión') || normalized.includes('emision')) {
      return 'ONGOING';
    }
    if (normalized.includes('finalizado')) {
      return 'COMPLETED';
    }
    return 'UNKNOWN';
  }

  /**
   * Fetches full metadata for a manga.
   * Translated from Kotlin:
   * private suspend fun fetchMangaDetails(manga: SManga): SManga
   */
  async getMangaDetails(mangaId: string): Promise<MangaDetails> {
    const normalizedPath = mangaId.startsWith('http')
      ? mangaId
      : `${this.metadata.baseUrl}${mangaId.startsWith('/') ? '' : '/'}${mangaId}`;

    const doc = await this.fetchHtml(normalizedPath);

    // Cover & Status container
    const leftPanel = doc.querySelector('div.col-md-3 div.panel.widget');
    const coverRaw = leftPanel?.querySelector('img')?.getAttribute('src');
    const coverUrl = coverRaw
      ? new URL(coverRaw, this.metadata.baseUrl).href
      : '';

    // Status: <a class="list-group-item">...estado... <span>En emisión</span></a>
    const statusAnchor = this.findByText(
      leftPanel || doc,
      'a.list-group-item',
      'estado'
    );
    const statusRaw = statusAnchor?.querySelector('span')?.textContent?.trim();
    const status = this.parseStatus(statusRaw);

    // Title & Description container
    const rightPanel = doc.querySelector('div.col-md-9');
    const title = rightPanel?.querySelector('h1')?.textContent?.trim() || '';
    const description =
      rightPanel?.querySelector('div.panel-body')?.textContent?.trim() ||
      undefined;

    // Genres extracted from badge tags if present
    const genres: string[] = [];
    doc.querySelectorAll('a[href*="/manga/consult?genres="]').forEach((el) => {
      const g = el.textContent?.trim();
      if (g) genres.push(g);
    });

    return {
      id: mangaId,
      title,
      thumbnailUrl: this.proxiedImageUrl(coverUrl),
      description,
      genres,
      status,
      url: normalizedPath,
      extensionId: this.metadata.id,
    };
  }

  /**
   * Fetches chapters for a manga.
   * Handles InManga's unique double-serialized JSON payload.
   *
   * Translated from Kotlin:
   * private suspend fun fetchChapterList(manga: SManga): List<SChapter>
   */
  async getChapters(mangaId: string): Promise<ChapterList> {
    // Extract manga UUID (last URL segment)
    const segments = mangaId.split('/').filter(Boolean);
    const mangaIdentification = segments[segments.length - 1];

    if (!mangaIdentification) {
      throw new Error(`Invalid mangaId provided to getChapters: ${mangaId}`);
    }

    const apiUrl = `${this.metadata.baseUrl}/chapter/getall?mangaIdentification=${mangaIdentification}`;

    const outerJson = await this.fetchJson<InMangaResultDto>(apiUrl, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!outerJson.data) {
      return { chapters: [] };
    }

    // Double JSON parse: the server responds with a stringified JSON inside `data`
    let inner: InMangaResultObjectDto<InMangaChapterDto>;
    try {
      inner = JSON.parse(outerJson.data);
    } catch (err) {
      throw new Error(
        `[${this.metadata.name}] Failed to deserialize inner chapter JSON: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }

    if (!inner.success || !Array.isArray(inner.result)) {
      return { chapters: [] };
    }

    const chapters: ChapterItem[] = inner.result.map((ch) => {
      const chapterNumber = ch.Number !== undefined ? Number(ch.Number) : 0;
      const friendlyNum = ch.FriendlyChapterNumber || String(chapterNumber);
      const identification = ch.Identification || '';

      let dateUpload: number | undefined;
      if (ch.RegistrationDate) {
        const parsed = Date.parse(ch.RegistrationDate);
        if (!isNaN(parsed)) {
          dateUpload = parsed;
        }
      }

      return {
        id: identification,
        name: `Capítulo ${friendlyNum}`,
        chapterNumber,
        dateUpload,
        url: `/chapter/chapterIndexControls?identification=${identification}`,
      };
    });

    // Tachiyomi sorts chapters descending: .sortedByDescending { it.chapter_number }
    chapters.sort((a, b) => b.chapterNumber - a.chapterNumber);

    return { chapters };
  }

  /**
   * Fetches all page images for a chapter.
   * Reconstructs the CDN URL format:
   * https://cdn1.intomanga.com/i/m/{mangaId}/c/{chapterId}/o/{imageId}.jpg
   *
   * Translated from Kotlin:
   * override suspend fun getPageList(chapter: SChapter): List<Page>
   */
  async getPages(chapterId: string): Promise<PageList> {
    // chapterId can be either the UUID or the full controls path
    const url = chapterId.includes('chapterIndexControls')
      ? `${this.metadata.baseUrl}${chapterId.startsWith('/') ? '' : '/'}${chapterId}`
      : `${this.metadata.baseUrl}/chapter/chapterIndexControls?identification=${chapterId}`;

    const doc = await this.fetchHtml(url);

    // Extract hidden inputs
    const chapterIdInput = doc.querySelector<HTMLInputElement>(
      'input#ChapterIdentification'
    );
    const mangaIdInput = doc.querySelector<HTMLInputElement>(
      'input#MangaIdentification'
    );

    const resolvedChapterId =
      chapterIdInput?.getAttribute('value') ||
      chapterIdInput?.value ||
      chapterId;

    const resolvedMangaId =
      mangaIdInput?.getAttribute('value') || mangaIdInput?.value;

    if (!resolvedMangaId) {
      throw new Error(
        `[${this.metadata.name}] Failed to extract MangaIdentification for chapter: ${chapterId}`
      );
    }

    // Extract all image containers
    const imgElements = Array.from(
      doc.querySelectorAll<HTMLImageElement>('img.ImageContainer')
    );

    const pages: PageItem[] = imgElements.map((img, index) => {
      const imageId = img.getAttribute('id') || '';
      const cdnUrl = `${this.imageCDN}/i/m/${resolvedMangaId}/c/${resolvedChapterId}/o/${imageId}.jpg`;

      return {
        index,
        imageUrl: this.proxiedImageUrl(cdnUrl),
        headers: {
          Referer: 'https://inmanga.com/',
        },
      };
    });

    return { pages };
  }
}
