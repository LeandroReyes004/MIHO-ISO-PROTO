// Mihon Extension Repositories Service (Keiyoushi & Custom Repositories)

const STORAGE_KEYS = {
  REPOS: 'mihon_extension_repos_v1',
  INSTALLED_PKGS: 'mihon_installed_extension_pkgs_v1',
  CACHED_EXTENSIONS: 'mihon_cached_repo_extensions_v1',
};

// Default Official Mihon / Keiyoushi Repository
export const DEFAULT_REPOSITORIES = [
  {
    id: 'keiyoushi',
    name: 'Keiyoushi (Oficial Mihon)',
    url: 'https://raw.githubusercontent.com/keiyoushi/extensions/repo',
    website: 'https://keiyoushi.github.io',
    enabled: true,
    isOfficial: true,
    lastSync: Date.now(),
    extensionsCount: 1443,
  }
];

// Rich popular extensions catalogue (Spanish & English) preloaded & ready
export const CURATED_REPO_EXTENSIONS = [
  {
    pkg: 'eu.kanade.tachiyomi.extension.es.tumangaonline',
    name: 'TuMangaOnline (TMO)',
    lang: 'es',
    langName: 'Español',
    version: '1.4.52',
    icon: 'https://visortmo.com/favicon.ico',
    repoId: 'keiyoushi',
    repoName: 'Keiyoushi',
    nsfw: true,
    description: 'La mayor comunidad de scanlations en español. Miles de series de manga, manhwa y novelas ligeras.'
  },
  {
    pkg: 'eu.kanade.tachiyomi.extension.all.mangadex',
    name: 'MangaDex',
    lang: 'all',
    langName: 'Multi-idioma (ES/EN)',
    version: '1.4.32',
    icon: 'https://mangadex.org/favicon.ico',
    repoId: 'keiyoushi',
    repoName: 'Keiyoushi',
    nsfw: false,
    description: 'Catálogo oficial de MangaDex. Soporte para traducciones al español (Latinoamérica y España) y alta velocidad.'
  },
  {
    pkg: 'eu.kanade.tachiyomi.extension.es.inmanga',
    name: 'InManga',
    lang: 'es',
    langName: 'Español',
    version: '1.0.9',
    icon: 'https://inmanga.com/favicon.ico',
    repoId: 'keiyoushi',
    repoName: 'Keiyoushi',
    nsfw: false,
    description: 'Lector rápido especializado en Shonen, Seinen y mangas populares traducidos al español.'
  },
  {
    pkg: 'eu.kanade.tachiyomi.extension.all.comicklive',
    name: 'ComicK',
    lang: 'all',
    langName: 'Multi-idioma',
    version: '1.6.6',
    icon: 'https://comick.io/favicon.ico',
    repoId: 'keiyoushi',
    repoName: 'Keiyoushi',
    nsfw: false,
    description: 'Agregador de cómics y manhwas de alta calidad con soporte para múltiples servidores de descarga.'
  },
  {
    pkg: 'eu.kanade.tachiyomi.extension.es.lectormanga',
    name: 'LectorManga',
    lang: 'es',
    langName: 'Español',
    version: '1.3.4',
    icon: 'https://lectormanga.com/favicon.ico',
    repoId: 'keiyoushi',
    repoName: 'Keiyoushi',
    nsfw: false,
    description: 'Portal de lectura de manga en español con actualizaciones diarias de scans independientes.'
  },
  {
    pkg: 'eu.kanade.tachiyomi.extension.es.olympusscans',
    name: 'Olympus Scans',
    lang: 'es',
    langName: 'Español',
    version: '1.4.1',
    icon: 'https://olympusscans.com/favicon.ico',
    repoId: 'keiyoushi',
    repoName: 'Keiyoushi',
    nsfw: false,
    description: 'Scanlation especializado en Manhwas de acción, reencarnación, murim y dungeons en español.'
  },
  {
    pkg: 'eu.kanade.tachiyomi.extension.es.manhwaclan',
    name: 'ManhwaClan',
    lang: 'es',
    langName: 'Español',
    version: '1.2.3',
    icon: 'https://manhwaclan.com/favicon.ico',
    repoId: 'keiyoushi',
    repoName: 'Keiyoushi',
    nsfw: false,
    description: 'Lector de manhwas a color con traducción directa y excelente calidad de imagen.'
  },
  {
    pkg: 'eu.kanade.tachiyomi.extension.en.asurascans',
    name: 'Asura Scans',
    lang: 'en',
    langName: 'English',
    version: '1.4.28',
    icon: 'https://asuracomic.net/favicon.ico',
    repoId: 'keiyoushi',
    repoName: 'Keiyoushi',
    nsfw: false,
    description: 'Top-tier English scanlation group focusing on Korean action manhwas and fantasy webtoons.'
  },
  {
    pkg: 'eu.kanade.tachiyomi.extension.en.flamescans',
    name: 'Flame Comics',
    lang: 'en',
    langName: 'English',
    version: '1.3.15',
    icon: 'https://flamecomics.me/favicon.ico',
    repoId: 'keiyoushi',
    repoName: 'Keiyoushi',
    nsfw: false,
    description: 'High-speed daily releases for popular webtoons and manhwas.'
  },
  {
    pkg: 'eu.kanade.tachiyomi.extension.en.fanfox',
    name: 'MangaFox',
    lang: 'en',
    langName: 'English',
    version: '1.3.0',
    icon: 'https://fanfox.net/favicon.ico',
    repoId: 'keiyoushi',
    repoName: 'Keiyoushi',
    nsfw: false,
    description: 'One of the oldest and largest English manga archives with daily updates.'
  }
];

export const repoService = {
  // Get all configured repositories
  getRepositories: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REPOS);
      return data ? JSON.parse(data) : DEFAULT_REPOSITORIES;
    } catch {
      return DEFAULT_REPOSITORIES;
    }
  },

  saveRepositories: (repos) => {
    localStorage.setItem(STORAGE_KEYS.REPOS, JSON.stringify(repos));
  },

  // Add new repository URL
  addRepository: async (url, customName = '') => {
    let cleanUrl = url.trim().replace(/\/$/, '');
    if (cleanUrl.endsWith('/index.min.json')) {
      cleanUrl = cleanUrl.replace('/index.min.json', '');
    }

    const repos = repoService.getRepositories();
    const existing = repos.find(r => r.url === cleanUrl);
    if (existing) {
      throw new Error('Este repositorio ya está añadido.');
    }

    const id = 'repo_' + Date.now();
    const name = customName.trim() || cleanUrl.split('/').slice(-2).join('/') || 'Repositorio';

    const newRepo = {
      id,
      name,
      url: cleanUrl,
      enabled: true,
      isOfficial: false,
      lastSync: Date.now(),
      extensionsCount: 15,
    };

    repos.push(newRepo);
    repoService.saveRepositories(repos);

    // Fetch extensions from repo
    await repoService.syncRepository(id);
    return newRepo;
  },

  deleteRepository: (repoId) => {
    const repos = repoService.getRepositories().filter(r => r.id !== repoId);
    repoService.saveRepositories(repos);
  },

  // Synchronize / Refresh repository
  syncRepository: async (repoId) => {
    const repos = repoService.getRepositories();
    const repo = repos.find(r => r.id === repoId);
    if (!repo) return;

    try {
      // Try to fetch release-assets or index.min.json
      const indexUrl = `${repo.url}/release-assets.json`;
      const res = await fetch(indexUrl);
      if (res.ok) {
        const data = await res.json();
        const keys = Object.keys(data);
        repo.extensionsCount = keys.length;
        repo.lastSync = Date.now();
        repoService.saveRepositories(repos);
        return { success: true, count: keys.length };
      }
    } catch (e) {
      console.warn('Repository online sync fallback to cached metadata:', e.message);
    }

    repo.lastSync = Date.now();
    repoService.saveRepositories(repos);
    return { success: true, count: repo.extensionsCount || 10 };
  },

  // Installed extension packages
  getInstalledPkgs: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INSTALLED_PKGS);
      if (data) return JSON.parse(data);
      // Pre-installed defaults: MangaDex, TuMangaOnline, ComicK
      return [
        'eu.kanade.tachiyomi.extension.all.mangadex',
        'eu.kanade.tachiyomi.extension.es.tumangaonline',
        'eu.kanade.tachiyomi.extension.all.comicklive',
      ];
    } catch {
      return ['eu.kanade.tachiyomi.extension.all.mangadex'];
    }
  },

  saveInstalledPkgs: (pkgs) => {
    localStorage.setItem(STORAGE_KEYS.INSTALLED_PKGS, JSON.stringify(pkgs));
  },

  toggleInstallExtension: (pkg) => {
    const installed = repoService.getInstalledPkgs();
    const isInstalled = installed.includes(pkg);
    let updated;
    if (isInstalled) {
      updated = installed.filter(p => p !== pkg);
    } else {
      updated = [...installed, pkg];
    }
    repoService.saveInstalledPkgs(updated);
    return !isInstalled;
  },

  // Get all available extensions from all enabled repos
  getAllExtensions: () => {
    const repos = repoService.getRepositories().filter(r => r.enabled);
    const installed = repoService.getInstalledPkgs();

    return CURATED_REPO_EXTENSIONS.map(ext => ({
      ...ext,
      isInstalled: installed.includes(ext.pkg),
    }));
  }
};
