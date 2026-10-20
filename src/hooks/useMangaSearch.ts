import { useState, useCallback } from 'react';
import { inmanga } from '../services/inmangaService';
import { MangaItem } from '../extensions/types';

export interface UseMangaSearchResult {
  query: string;
  setQuery: (q: string) => void;
  mangaResults: MangaItem[];
  isLoading: boolean;
  error: string | null;
  search: (searchQuery?: string) => Promise<void>;
  clearResults: () => void;
}

/**
 * Custom React hook for searching manga via the InManga extension.
 * Provides isLoading, error, mangaResults, and trigger actions.
 */
export function useMangaSearch(): UseMangaSearchResult {
  const [query, setQuery] = useState('');
  const [mangaResults, setMangaResults] = useState<MangaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(
    async (overrideQuery?: string) => {
      const q = (overrideQuery !== undefined ? overrideQuery : query).trim();
      if (!q) {
        setMangaResults([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await inmanga.searchManga(q);
        setMangaResults(result.mangas);
        if (result.mangas.length === 0) {
          setError(`No se encontraron mangas para "${q}"`);
        }
      } catch (err: any) {
        console.error('[useMangaSearch] Search error:', err);
        setError(err?.message || 'Error al conectar con InManga a través del proxy');
        setMangaResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [query]
  );

  const clearResults = useCallback(() => {
    setQuery('');
    setMangaResults([]);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    mangaResults,
    isLoading,
    error,
    search,
    clearResults,
  };
}
