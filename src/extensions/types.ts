/**
 * Core types and interfaces for Mihon/Tachiyomi TypeScript extension architecture.
 * Designed for iOS PWA environments with proxy and CORS support.
 */

export type MangaStatus =
  | 'UNKNOWN'
  | 'ONGOING'
  | 'COMPLETED'
  | 'LICENSED'
  | 'PUBLISHING_FINISHED'
  | 'CANCELLED'
  | 'ON_HIATUS';

export interface MangaItem {
  id: string; // Unique manga identifier or relative path
  title: string;
  thumbnailUrl: string;
  url: string;
  extensionId: string;
}

export interface MangaList {
  mangas: MangaItem[];
  hasNextPage: boolean;
  page?: number;
}

export interface MangaDetails {
  id: string;
  title: string;
  thumbnailUrl: string;
  description?: string;
  author?: string;
  artist?: string;
  genres: string[];
  status: MangaStatus;
  url: string;
  extensionId: string;
}

export interface ChapterItem {
  id: string; // Unique chapter identifier or controls path
  name: string;
  chapterNumber: number;
  dateUpload?: number; // Unix timestamp in milliseconds
  scanlator?: string;
  url: string;
}

export interface ChapterList {
  chapters: ChapterItem[];
}

export interface PageItem {
  index: number;
  imageUrl: string;
  headers?: Record<string, string>;
}

export interface PageList {
  pages: PageItem[];
}

export interface ExtensionMetadata {
  id: string;
  name: string;
  lang: string;
  baseUrl: string;
  version: string;
  iconUrl?: string;
  isNsfw?: boolean;
}

export interface ExtensionConfig {
  /**
   * Base URL of a CORS proxy (e.g. Cloudflare Worker or backend proxy).
   * Supports both query parameter style (e.g., 'https://proxy.example.com/?url=')
   * and path prefix style (e.g., 'https://proxy.example.com/').
   */
  proxyUrl?: string;

  /**
   * Custom fetch implementation (e.g., for Node.js environments or mock testing).
   */
  customFetch?: typeof fetch;

  /**
   * Additional custom HTTP headers to pass along with requests.
   */
  headers?: Record<string, string>;

  /**
   * Whether to route page image URLs through the proxy as well.
   * Crucial for iOS Safari PWA when CDNs block direct canvas/image rendering.
   */
  proxyImages?: boolean;

  /**
   * Optional custom HTML-to-Document parser function.
   * Useful when running outside a browser (Node.js, workers, or unit tests)
   * where global DOMParser is not automatically present.
   */
  htmlParser?: (html: string) => Document;
}

/**
 * Standardized Manga Extension Interface.
 * Every ported Tachiyomi/Mihon source must implement this contract.
 */
export interface MangaExtension {
  readonly metadata: ExtensionMetadata;

  /**
   * Search manga with query string and optional page number.
   */
  searchManga(query: string, page?: number): Promise<MangaList>;

  /**
   * Get detailed metadata for a given manga.
   */
  getMangaDetails(mangaId: string): Promise<MangaDetails>;

  /**
   * Get all available chapters for a given manga.
   */
  getChapters(mangaId: string): Promise<ChapterList>;

  /**
   * Get all page image URLs for a given chapter.
   */
  getPages(chapterId: string): Promise<PageList>;

  /**
   * Optional: Fetch popular manga catalog.
   */
  getPopularManga?(page?: number): Promise<MangaList>;

  /**
   * Optional: Fetch latest updated manga.
   */
  getLatestUpdates?(page?: number): Promise<MangaList>;
}
