import { parseHTML } from 'linkedom';
import { InMangaExtension } from '../es/InManga';

export async function runInMangaTest() {
  console.log('--- Testing InManga Extension Port ---');

  const extension = new InMangaExtension({
    htmlParser: (html: string) => parseHTML(html).document as unknown as Document,
  });

  // 1. Search Manga
  console.log('[1/4] Testing searchManga("one piece")...');
  const searchResult = await extension.searchManga('one piece', 1);
  console.log(`Found ${searchResult.mangas.length} mangas.`);
  if (searchResult.mangas.length === 0) {
    throw new Error('No manga returned from search');
  }
  const firstManga = searchResult.mangas[0];

  // 2. Manga Details
  console.log('[2/4] Testing getMangaDetails(firstManga.id)...');
  const details = await extension.getMangaDetails(firstManga.id);
  console.log(`Manga Details: "${details.title}", Status: ${details.status}`);

  // 3. Chapters
  console.log('[3/4] Testing getChapters(firstManga.id)...');
  const chapterList = await extension.getChapters(firstManga.id);
  console.log(`Found ${chapterList.chapters.length} chapters.`);
  if (chapterList.chapters.length === 0) {
    throw new Error('No chapters returned');
  }
  const latestChapter = chapterList.chapters[0];

  // 4. Pages
  console.log('[4/4] Testing getPages(latestChapter.id)...');
  const pageList = await extension.getPages(latestChapter.id);
  console.log(`Found ${pageList.pages.length} pages.`);

  console.log('>>> InManga Extension test PASSED! <<<');
}

if (process.argv[1]?.includes('InManga.test')) {
  runInMangaTest().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
