import { XMLParser } from "fast-xml-parser";

export interface AnimeNews {
  id: string;
  title: string;
  url: string;
  date: string;
  categories: string[];
  excerpt: string;
  image: string | null;
}

const ANN_RSS_URL = "https://www.animenewsnetwork.com/all/rss.xml";
const PAGE_SIZE = 12;

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, "").trim();
}

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export async function fetchAnimeNews(page = 1): Promise<AnimeNews[]> {
  const res = await fetch(ANN_RSS_URL, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`ANN RSS 오류: ${res.status}`);

  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xml);

  const rawItems = parsed?.rss?.channel?.item ?? [];
  const items = Array.isArray(rawItems) ? rawItems : [rawItems];

  const allItems = items.map((item: any) => {
    const categories = item.category
      ? Array.isArray(item.category)
        ? item.category
        : [item.category]
      : [];
    return {
      id: String(item.guid?.["#text"] ?? item.guid ?? item.link),
      title: stripHtml(String(item.title ?? "")),
      url: String(item.link ?? ""),
      date: String(item.pubDate ?? ""),
      categories,
      excerpt: stripHtml(String(item.description ?? "")),
    };
  });

  const start = (page - 1) * PAGE_SIZE;
  const pageItems = allItems.slice(start, start + PAGE_SIZE);

  const withImages: AnimeNews[] = await Promise.all(
    pageItems.map(async (item) => ({
      ...item,
      image: await fetchOgImage(item.url),
    }))
  );

  return withImages;
}
