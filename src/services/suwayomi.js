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
  if (result.errors?.length) { const message = result.errors.map(e => e.message).join(', '); throw new Error(message.includes('Cloudflare bypass currently disabled') ? 'Esta fuente requiere protección Cloudflare: activa FlareSolverr o Byparr en tu servidor Suwayomi.' : message.split('\n')[0].split(' at ')[0]); }
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
  async repos() {
    const data = await graphql('{ extensionStores { nodes { name indexUrl } } }');
    return data.extensionStores.nodes;
  },
  async refreshExtensions() {
    await graphql('mutation { fetchExtensions(input: {}) { extensionStores { indexUrl } } }');
  },
  async sourceDetails(id) {
    const fields = `__typename ... on CheckBoxFilter { name default } ... on TriStateFilter { name default } ... on TextFilter { name default } ... on SelectFilter { name default values } ... on SortFilter { name default { index ascending } values } ... on HeaderFilter { name } ... on SeparatorFilter { name }`;
    const data = await graphql(`query($id: LongString!) { source(id: $id) { supportsLatest filters { ${fields} ... on GroupFilter { name filters { ${fields} } } } } }`, { id });
    return data.source;
  },
  async catalog(source, { query = '', type = 'POPULAR', filters = [] } = {}) {
    const data = await graphql('mutation($input: FetchSourceMangaInput!) { fetchSourceManga(input: $input) { mangas { id title thumbnailUrl } } }', { input: { source, page: 1, type, ...(type === 'SEARCH' ? { query, filters } : {}) } });
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
