// Mihon iOS Persistence & State Layer (LocalStorage + IndexedDB abstraction)

const STORAGE_KEYS = {
  LIBRARY: 'mihon_library_v2', // bumped to v2 for real MangaDex chapters
  CATEGORIES: 'mihon_categories_v2',
  HISTORY: 'mihon_history_v2',
  READ_CHAPTERS: 'mihon_read_chapters_v2',
  BOOKMARKS: 'mihon_bookmarked_chapters_v2',
  SETTINGS: 'mihon_settings_v2',
  INSTALLED_SOURCES: 'mihon_installed_sources_v2',
};

// Real curated mangas with real MangaDex IDs and working chapters
export const INITIAL_MANGAS = [
  {
    id: 'berserk',
    rawId: '801513ba-a712-498c-8f57-cae55b38cc92',
    title: 'Berserk',
    altTitle: 'ベルセルク',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    author: 'Kentaro Miura',
    artist: 'Studio Gaga',
    status: 'En emisión',
    type: 'Manga',
    sourceId: 'mangadex',
    sourceName: 'MangaDex (Oficial)',
    lang: 'es',
    description: 'Guts, conocido como el Espadachín Negro, busca venganza contra su antiguo amigo Griffith en un mundo medieval oscuro plagado de apóstoles demoníacos y un destino implacable. Imágenes 100% reales en español de MangaDex.',
    genres: ['Fantasía oscura', 'Acción', 'Tragedia', 'Gore', 'Seinen'],
    categories: ['Favoritos', 'Leyendo'],
    inLibrary: true,
    addedAt: Date.now() - 86400000 * 3,
    unreadCount: 3,
    chapters: [
      { 
        id: 'd120a2fb-67b7-4b3f-b551-ab973ac66a85', 
        number: 1, 
        title: 'Capítulo 1 - El Espadachín Negro (Español)', 
        scan: 'Berserk Project ES', 
        date: 'Reciente', 
        pagesCount: 90 
      },
      { 
        id: 'ae5cd49d-21f5-4472-b47b-b72661aee20e', 
        number: 2, 
        title: 'Capítulo 2 - El Estigma de los Condenados', 
        scan: 'Berserk Project ES', 
        date: 'Reciente', 
        pagesCount: 69 
      },
      { 
        id: '2ffb6363-0001-4359-a63f-262e22b5ff40', 
        number: 3, 
        title: 'Capítulo 3 - Ángeles Guardianes del Deseo', 
        scan: 'Berserk Project ES', 
        date: 'Reciente', 
        pagesCount: 56 
      }
    ]
  },
  {
    id: 'fate-type-redline',
    rawId: '510f29a8-99b4-46af-ba5e-916e96bc6f37',
    title: 'Fate/type Redline',
    altTitle: 'フェイト／タイプ レッドライン',
    cover: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    author: 'Keisuke Hirai',
    artist: 'TYPE-MOON',
    status: 'En emisión',
    type: 'Manga',
    sourceId: 'mangadex',
    sourceName: 'MangaDex (Oficial)',
    lang: 'es',
    description: 'Kanata Akagi, un joven descendiente de una familia de magos en declive, es transportado misteriosamente a la Tokio de 1945 durante la Segunda Guerra Mundial, en medio del ritual de la Guerra Imperial del Santo Grial. Páginas oficiales en español.',
    genres: ['Acción', 'Fantasía', 'Sobrenatural', 'Guerra'],
    categories: ['Leyendo'],
    inLibrary: true,
    addedAt: Date.now() - 86400000 * 2,
    unreadCount: 1,
    chapters: [
      { 
        id: '340630e8-84d0-439b-8cbb-0f4c22692eb0', 
        number: 13, 
        title: 'Capítulo 13 - Choque de Servants (Español)', 
        scan: 'MangaDex Scans', 
        date: 'Reciente', 
        pagesCount: 18 
      }
    ]
  },
  {
    id: 'yaiba',
    rawId: '18543708-eed6-4b84-b3fd-f67540b4ebbd',
    title: 'Yaiba!',
    altTitle: 'YAIBA',
    cover: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    author: 'Gosho Aoyama',
    artist: 'Gosho Aoyama',
    status: 'Completado',
    type: 'Manga',
    sourceId: 'mangadex',
    sourceName: 'MangaDex (Oficial)',
    lang: 'es',
    description: 'Yaiba Kurogane es un joven samurái que entrena en la selva. Tras regresar a la civilización japonesa, descubre una legendaria espada mágica con poderes elementales que lo llevará a enfrentar a demonios y samuráis legendarios.',
    genres: ['Acción', 'Aventura', 'Comedia', 'Shounen'],
    categories: ['Completados'],
    inLibrary: true,
    addedAt: Date.now() - 86400000 * 5,
    unreadCount: 2,
    chapters: [
      { 
        id: 'd2ef14b7-99e0-4e90-b02b-87964c6c120c', 
        number: 16, 
        title: 'Capítulo 16 - La Espada del Dragón de Viento', 
        scan: 'Gosho Fansub ES', 
        date: 'Reciente', 
        pagesCount: 18 
      },
      { 
        id: 'eba9074d-4db3-434d-a08d-b15701b8615b', 
        number: 15, 
        title: 'Capítulo 15 - El Desafío del Templo', 
        scan: 'Gosho Fansub ES', 
        date: 'Reciente', 
        pagesCount: 18 
      }
    ]
  },
  {
    id: 'solo-leveling',
    title: 'Solo Leveling (Manhwa Webtoon)',
    altTitle: 'Na Honjaman Lebeleop',
    cover: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    author: 'Chugong',
    artist: 'DUBU (REDICE Studio)',
    status: 'Completado',
    type: 'Manhwa',
    sourceId: 'tmo',
    sourceName: 'TuMangaOnline (TMO)',
    lang: 'es',
    description: 'Sung Jin-woo, el cazador más débil de rango E, despierta el poder del Sistema tras sobrevivir a la Mazmorra Doble, convirtiéndose en el Monarca de las Sombras.',
    genres: ['Acción', 'Fantasía', 'Supervivencia', 'Subir de nivel'],
    categories: ['Leyendo'],
    inLibrary: true,
    addedAt: Date.now() - 86400000 * 10,
    unreadCount: 2,
    chapters: [
      { 
        id: 'sl-real-1', 
        number: 1, 
        title: 'Capítulo 1 - El Despertar del Cazador Rango E', 
        scan: 'Olympus Scans', 
        date: '2024-01-10', 
        pagesCount: 10 
      },
      { 
        id: 'sl-real-2', 
        number: 2, 
        title: 'Capítulo 2 - El Santuario de Cartenon', 
        scan: 'Olympus Scans', 
        date: '2024-01-15', 
        pagesCount: 10 
      }
    ]
  },
  {
    id: 'bleach',
    rawId: '52212b10-6adb-4186-9db8-eaee6997db67',
    title: 'Bleach',
    altTitle: 'ブリーチ',
    cover: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
    author: 'Tite Kubo',
    artist: 'Tite Kubo',
    status: 'Completado',
    type: 'Manga',
    sourceId: 'mangadex',
    sourceName: 'MangaDex (Oficial)',
    lang: 'es',
    description: 'Ichigo Kurosaki es un estudiante de secundaria con la habilidad de ver fantasmas. Su vida cambia cuando conoce a Rukia Kuchiki, una Shinigami.',
    genres: ['Acción', 'Aventura', 'Shounen', 'Sobrenatural'],
    categories: ['Favoritos'],
    inLibrary: true,
    addedAt: Date.now() - 86400000 * 4,
    unreadCount: 4,
    chapters: [
      {
        id: '35ec896c-9aa7-4c7b-bca2-8417c80ee915',
        number: 336,
        title: 'Capítulo 336 - El Verdugo',
        scan: 'Ju-Ni Scans',
        date: 'Reciente',
        pagesCount: 22
      }
    ]
  },
  {
    id: 'jojo-lands',
    rawId: 'ab8cbb82-d0ed-45a7-8ffe-4bfa6d43d79c',
    title: 'The JOJOLands (JoJo Parte 9)',
    altTitle: 'ザ・ジョジョランズ',
    cover: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    author: 'Hirohiko Araki',
    artist: 'Hirohiko Araki',
    status: 'En emisión',
    type: 'Manga',
    sourceId: 'mangadex',
    sourceName: 'MangaDex (Oficial)',
    lang: 'es',
    description: 'Ambientada en Oahu, Hawái, la historia sigue a Jodio Joestar y su hermano Dragona en su búsqueda de riquezas en la isla.',
    genres: ['Acción', 'Aventura', 'Misterio', 'Sobrenatural'],
    categories: ['Leyendo'],
    inLibrary: true,
    addedAt: Date.now() - 86400000 * 1,
    unreadCount: 1,
    chapters: [
      {
        id: '49209cbc-e03e-43af-881f-fbaed176c4b9',
        number: 41,
        title: 'Capítulo 41 - El Secreto de la Roca de Lava',
        scan: 'JoJo Project ES',
        date: 'Reciente',
        pagesCount: 20
      }
    ]
  }
];

export const INITIAL_CATEGORIES = ['Todos', 'Leyendo', 'Completados', 'Pendientes', 'Favoritos'];

export const DEFAULT_SETTINGS = {
  theme: 'oled',
  accentColor: '#9d5cf5',
  readingMode: 'webtoon',
  backgroundColor: '#000000',
  showPageNumber: true,
  showBatteryTime: true,
  invertTapZones: false,
  cropBorders: false,
  doubleTapZoom: true,
  autoScroll: false,
  autoScrollSpeed: 2,
  quality: 'high',
  preferredLanguage: 'es',
  nsfwAllowed: false,
  iosSimulatorFrame: false,
};

export const INITIAL_UPDATES = [
  {
    mangaId: 'berserk',
    mangaTitle: 'Berserk',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    chapterNumber: 1,
    chapterTitle: 'Capítulo 1 - El Espadachín Negro',
    chapterId: 'd120a2fb-67b7-4b3f-b551-ab973ac66a85',
    date: 'Hoy, 15:42',
    unread: true,
  },
  {
    mangaId: 'fate-type-redline',
    mangaTitle: 'Fate/type Redline',
    cover: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    chapterNumber: 13,
    chapterTitle: 'Capítulo 13 - Choque de Servants',
    chapterId: '340630e8-84d0-439b-8cbb-0f4c22692eb0',
    date: 'Hoy, 11:20',
    unread: true,
  },
  {
    mangaId: 'yaiba',
    mangaTitle: 'Yaiba!',
    cover: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
    chapterNumber: 16,
    chapterTitle: 'Capítulo 16 - La Espada del Dragón de Viento',
    chapterId: 'd2ef14b7-99e0-4e90-b02b-87964c6c120c',
    date: 'Ayer',
    unread: false,
  }
];

export const storage = {
  // Library
  getLibrary: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LIBRARY);
      return data ? JSON.parse(data) : INITIAL_MANGAS;
    } catch {
      return INITIAL_MANGAS;
    }
  },
  saveLibrary: (mangas) => {
    try {
      localStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(mangas));
    } catch (e) {
      console.error('Error saving library:', e);
    }
  },
  toggleLibraryManga: (manga) => {
    const list = storage.getLibrary();
    const existingIndex = list.findIndex(m => m.id === manga.id);
    if (existingIndex >= 0) {
      list.splice(existingIndex, 1);
      storage.saveLibrary(list);
      return false;
    } else {
      const newManga = {
        ...manga,
        inLibrary: true,
        addedAt: Date.now(),
        categories: manga.categories?.length ? manga.categories : ['Leyendo']
      };
      list.unshift(newManga);
      storage.saveLibrary(list);
      return true;
    }
  },

  // Categories
  getCategories: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  },
  saveCategories: (categories) => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  },

  // History
  getHistory: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (data) return JSON.parse(data);
      return [
        {
          id: 'hist-1',
          mangaId: 'berserk',
          mangaTitle: 'Berserk',
          cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
          chapterId: 'd120a2fb-67b7-4b3f-b551-ab973ac66a85',
          chapterNumber: 1,
          chapterTitle: 'Capítulo 1 - El Espadachín Negro',
          page: 5,
          totalPages: 90,
          readAt: Date.now() - 3600000 * 2,
        }
      ];
    } catch {
      return [];
    }
  },
  addHistoryEntry: (entry) => {
    try {
      const history = storage.getHistory();
      const filtered = history.filter(h => h.mangaId !== entry.mangaId);
      filtered.unshift({
        ...entry,
        id: 'hist_' + Date.now(),
        readAt: Date.now(),
      });
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filtered.slice(0, 100)));
    } catch (e) {
      console.error(e);
    }
  },
  clearHistory: () => {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
  },

  // Read chapters
  getReadChapters: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.READ_CHAPTERS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },
  markChapterRead: (chapterId, isRead = true) => {
    try {
      const readMap = storage.getReadChapters();
      if (isRead) {
        readMap[chapterId] = true;
      } else {
        delete readMap[chapterId];
      }
      localStorage.setItem(STORAGE_KEYS.READ_CHAPTERS, JSON.stringify(readMap));
      return readMap;
    } catch (e) {
      console.error(e);
      return {};
    }
  },

  // Settings
  getSettings: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },
  saveSettings: (settings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // Mihon / Tachiyomi Backup
  exportBackup: () => {
    const backupData = {
      version: 2,
      app: 'Mihon-iOS',
      exportedAt: new Date().toISOString(),
      library: storage.getLibrary(),
      categories: storage.getCategories(),
      history: storage.getHistory(),
      readChapters: storage.getReadChapters(),
      settings: storage.getSettings(),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mihon_ios_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
  importBackup: (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.library) storage.saveLibrary(data.library);
      if (data.categories) storage.saveCategories(data.categories);
      if (data.settings) storage.saveSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      if (data.readChapters) localStorage.setItem(STORAGE_KEYS.READ_CHAPTERS, JSON.stringify(data.readChapters));
      if (data.history) localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(data.history));
      return { success: true, count: data.library?.length || 0 };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};
