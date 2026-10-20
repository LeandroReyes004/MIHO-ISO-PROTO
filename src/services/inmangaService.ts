import { InMangaExtension } from '../extensions/es/InManga';

/**
 * Primary Cloudflare Worker CORS proxy.
 * In development or local testing, if HTTPS SSL handshake is still pending in Cloudflare,
 * the client can seamlessly fallback to HTTP.
 */
const DEFAULT_PROXY = 'https://mihon-cors-proxy.leandro-elias1025.workers.dev/?url=';
const FALLBACK_HTTP_PROXY = 'http://mihon-cors-proxy.leandro-elias1025.workers.dev/?url=';

// Custom fetch that falls back to HTTP proxy if HTTPS has an SSL alert / handshake issue
const resilientFetch: typeof fetch = async (input, init) => {
  try {
    const res = await fetch(input, init);
    return res;
  } catch (err: any) {
    const urlStr = typeof input === 'string' ? input : input instanceof Request ? input.url : '';
    if (urlStr.startsWith('https://mihon-cors-proxy')) {
      const fallbackUrl = urlStr.replace('https://mihon-cors-proxy', 'http://mihon-cors-proxy');
      console.warn('[Proxy Fallback] Retrying via HTTP proxy due to SSL propagation:', err.message);
      return fetch(fallbackUrl, init);
    }
    throw err;
  }
};

/**
 * Singleton instance of InMangaExtension configured with the user's Cloudflare Worker proxy.
 */
export const inmanga = new InMangaExtension({
  proxyUrl: DEFAULT_PROXY,
  proxyImages: true,
  customFetch: resilientFetch,
});
