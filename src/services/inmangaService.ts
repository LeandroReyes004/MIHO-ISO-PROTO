import { InMangaExtension } from '../extensions/es/InManga';

/**
 * Resilient fetch that attempts https://corsproxy.io/? first,
 * and if corsproxy.io rejects with 403 (due to anonymous legacy limits)
 * or network failure, falls back seamlessly to the local Express proxy (/api/image-proxy?url=)
 * so that localhost:3000 always loads chapters in green.
 */
const resilientFetch: typeof fetch = async (input, init) => {
  try {
    const res = await fetch(input, init);
    if (!res.ok && res.status === 403) {
      const urlStr = typeof input === 'string' ? input : input instanceof Request ? input.url : '';
      if (urlStr.includes('corsproxy.io/?')) {
        const target = urlStr.split('corsproxy.io/?')[1];
        if (target) {
          console.warn('[Proxy Fallback] corsproxy.io returned 403. Falling back to local proxy...');
          const fallbackUrl = typeof window !== 'undefined'
            ? `/api/image-proxy?url=${target}`
            : `http://localhost:3000/api/image-proxy?url=${target}`;
          return fetch(fallbackUrl, init);
        }
      }
    }
    return res;
  } catch (err: any) {
    const urlStr = typeof input === 'string' ? input : input instanceof Request ? input.url : '';
    if (urlStr.includes('corsproxy.io/?')) {
      const target = urlStr.split('corsproxy.io/?')[1];
      if (target) {
        console.warn('[Proxy Fallback] Network issue with corsproxy.io. Falling back to local proxy...', err.message);
        const fallbackUrl = typeof window !== 'undefined'
          ? `/api/image-proxy?url=${target}`
          : `http://localhost:3000/api/image-proxy?url=${target}`;
        return fetch(fallbackUrl, init);
      }
    }
    throw err;
  }
};

/**
 * Initialized InMangaExtension with 'https://corsproxy.io/?'
 */
export const inmanga = new InMangaExtension({
  proxyUrl: 'https://corsproxy.io/?',
  proxyImages: true,
  customFetch: resilientFetch,
});
