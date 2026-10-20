const prefix = '/suwayomi';

export function imageUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url, 'https://suwayomi.invalid');
    // Suwayomi returns API paths for protected images; never send credentials to arbitrary URLs.
    if (url.startsWith('/') || parsed.hostname === 'suwayomi.invalid') return prefix + parsed.pathname + parsed.search;
    return url;
  } catch { return ''; }
}

async function graphql(query, variables = {}) {
  const response = await fetch(`${prefix}/api/graphql`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin', body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(response.status === 401 ? 'Inicia sesión en el servidor Suwayomi.' : `Error del servidor (${response.status}).`);
  const result = await response.json();
  if (result.errors?.length) throw new Error(result.errors.map(e => e.message).join(', '));
  return result.data;
}

export const suwayomi = {
  async sources() {
    const data = await graphql('{ sources { nodes { id displayName lang iconUrl extension { isInstalled } } } }');
    return data.sources.nodes.filter(source => source.id === '0' || source.extension.isInstalled);
  },
  async extensions() {
    const data = await graphql('{ extensions { nodes { pkgName name lang versionName isInstalled iconUrl } } }');
    return data.extensions.nodes;
  },
  async install(id, installed) {
    await graphql('mutation($input: UpdateExtensionInput!) { updateExtension(input: $input) { extension { pkgName isInstalled } } }', { input: { id, patch: installed ? { uninstall: true } : { install: true } } });
  },
  async addRepo(indexUrl) {
    await graphql('mutation($input: AddExtensionStoreInput!) { addExtensionStore(input: $input) { extensionStore { indexUrl } } }', { input: { indexUrl } });
  },
  async catalog(source, query = '') {
    const data = await graphql('mutation($input: FetchSourceMangaInput!) { fetchSourceManga(input: $input) { mangas { id title thumbnailUrl } } }', { input: { source, page: 1, type: query ? 'SEARCH' : 'POPULAR', ...(query ? { query } : {}) } });
    return data.fetchSourceManga.mangas;
  },
  async chapters(id) {
    const data = await graphql('mutation($input: FetchMangaAndChaptersInput!) { fetchMangaAndChapters(input: $input) { manga { id title description author thumbnailUrl } chapters { id name chapterNumber } } }', { input: { id, fetchManga: true, fetchChapters: true } });
    return data.fetchMangaAndChapters;
  },
  async pages(chapterId) {
    const data = await graphql('mutation($input: FetchChapterPagesInput!) { fetchChapterPages(input: $input) { pages } }', { input: { chapterId } });
    return data.fetchChapterPages.pages.map(imageUrl);
  },
};
