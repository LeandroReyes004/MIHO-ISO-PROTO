import {
  ChapterList,
  ExtensionConfig,
  ExtensionMetadata,
  MangaDetails,
  MangaExtension,
  MangaList,
  PageList,
} from './types';

/**
 * Abstract Base Class for ported Tachiyomi/Mihon extensions in TypeScript.
 * Handles:
 * 1. Configurable CORS proxy routing (Cloudflare Workers, Express reverse-proxy, etc.)
 * 2. Header spoofing (User-Agent, Referer, X-Requested-With)
 * 3. Client-side DOM parsing (translating Jsoup idioms to DOMParser)
 */
export abstract class BaseExtension implements MangaExtension {
  abstract readonly metadata: ExtensionMetadata;

  protected config: ExtensionConfig;

  constructor(config: ExtensionConfig = {}) {
    this.config = {
      proxyImages: false,
      ...config,
    };
  }

  /**
   * Helper to update configuration dynamically (e.g. when user changes proxy settings in UI).
   */
  public updateConfig(newConfig: Partial<ExtensionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Transforms a direct target URL into a proxied URL if a proxy is configured.
   * Avoids CORS blocking in browser/PWA environments.
   */
  public buildProxiedUrl(targetUrl: string): string {
    if (!this.config.proxyUrl) {
      return targetUrl;
    }

    const trimmedProxy = this.config.proxyUrl.trim();

    // Query param style: e.g. "https://cors-proxy.workers.dev/?url=" or "/api/proxy?url="
    if (trimmedProxy.endsWith('=')) {
      return `${trimmedProxy}${encodeURIComponent(targetUrl)}`;
    }

    // Path prefix style: e.g. "https://cors-proxy.workers.dev/"
    if (trimmedProxy.endsWith('/')) {
      return `${trimmedProxy}${encodeURIComponent(targetUrl)}`;
    }

    // Default fallback
    return `${trimmedProxy}?url=${encodeURIComponent(targetUrl)}`;
  }

  /**
   * Transforms image URLs according to proxy settings.
   */
  public proxiedImageUrl(imageUrl: string): string {
    if (this.config.proxyImages && this.config.proxyUrl) {
      return this.buildProxiedUrl(imageUrl);
    }
    return imageUrl;
  }

  /**
   * Standard headers required by Tachiyomi/Mihon sources.
   * Subclasses can override to add source-specific headers.
   */
  protected getDefaultHeaders(): Record<string, string> {
    return {
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    };
  }

  /**
   * Executes an HTTP request with proper proxying, headers, and error handling.
   */
  protected async request(
    targetUrl: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const fetchFn = this.config.customFetch || globalThis.fetch;
    const proxiedUrl = this.buildProxiedUrl(targetUrl);

    const mergedHeaders: Record<string, string> = {
      ...this.getDefaultHeaders(),
      ...(this.config.headers || {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    const response = await fetchFn(proxiedUrl, {
      ...options,
      headers: mergedHeaders,
    });

    if (!response.ok) {
      throw new Error(
        `[${this.metadata.name}] HTTP ${response.status} (${response.statusText}) for request: ${targetUrl}`
      );
    }

    return response;
  }

  /**
   * Fetches the raw HTML text from a target URL.
   */
  protected async fetchText(
    targetUrl: string,
    options: RequestInit = {}
  ): Promise<string> {
    const response = await this.request(targetUrl, options);
    return response.text();
  }

  /**
   * Fetches and parses JSON from a target URL.
   */
  protected async fetchJson<T>(
    targetUrl: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await this.request(targetUrl, options);
    return response.json() as Promise<T>;
  }

  /**
   * Fetches and parses an HTML document using the client-side DOMParser.
   * Equivalent to Tachiyomi's Kotlin `client.newCall(request).asJsoup()`.
   */
  protected async fetchHtml(
    targetUrl: string,
    options: RequestInit = {}
  ): Promise<Document> {
    const html = await this.fetchText(targetUrl, options);
    return this.parseHtml(html);
  }

  /**
   * Parses raw HTML string into a DOM Document.
   * Uses browser native DOMParser in PWA / iOS Safari, or custom htmlParser from config in Node.js.
   */
  public parseHtml(html: string): Document {
    if (typeof globalThis.DOMParser !== 'undefined') {
      const parser = new globalThis.DOMParser();
      return parser.parseFromString(html, 'text/html') as unknown as Document;
    }

    if (this.config.htmlParser) {
      return this.config.htmlParser(html);
    }

    throw new Error(
      'DOMParser is not available in the current runtime environment. Ensure you are running in a browser or provide htmlParser in ExtensionConfig.'
    );
  }

  // =========================================================================
  // Jsoup -> DOMParser Translation Utilities
  // =========================================================================

  /**
   * Equivalent to Jsoup `element.selectFirst(selector)?.text()`.
   */
  protected selectText(
    parent: Element | Document,
    selector: string
  ): string | undefined {
    return parent.querySelector(selector)?.textContent?.trim() || undefined;
  }

  /**
   * Equivalent to Jsoup `element.selectFirst(selector)?.attr(attr)`.
   */
  protected selectAttr(
    parent: Element | Document,
    selector: string,
    attr: string
  ): string | undefined {
    return parent.querySelector(selector)?.getAttribute(attr)?.trim() || undefined;
  }

  /**
   * Resolves relative URLs to absolute URLs.
   * Equivalent to Jsoup `element.absUrl(attr)`.
   */
  protected selectAbsUrl(
    parent: Element | Document,
    selector: string,
    attr: string,
    baseUrl = this.metadata.baseUrl
  ): string | undefined {
    const relative = this.selectAttr(parent, selector, attr);
    if (!relative) return undefined;
    try {
      return new URL(relative, baseUrl).href;
    } catch {
      return relative;
    }
  }

  /**
   * Emulates Jsoup's `:contains(text)` pseudo-selector, which is not supported in standard CSS querySelector.
   */
  protected findByText(
    parent: Element | Document,
    selector: string,
    textToFind: string
  ): Element | null {
    const elements = Array.from(parent.querySelectorAll(selector));
    const target = textToFind.toLowerCase();
    for (const el of elements) {
      if (el.textContent && el.textContent.toLowerCase().includes(target)) {
        return el;
      }
    }
    return null;
  }

  // =========================================================================
  // MangaExtension Contract Methods (Must be implemented by subclasses)
  // =========================================================================

  abstract searchManga(query: string, page?: number): Promise<MangaList>;
  abstract getMangaDetails(mangaId: string): Promise<MangaDetails>;
  abstract getChapters(mangaId: string): Promise<ChapterList>;
  abstract getPages(chapterId: string): Promise<PageList>;

  getPopularManga?(page?: number): Promise<MangaList>;
  getLatestUpdates?(page?: number): Promise<MangaList>;
}
