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

// ANN이 다른 도메인에서 오는 이미지 요청을 막는 경우(핫링크 차단, 광고 차단
// 확장 프로그램 등)가 있어 우리 서버를 거쳐 가도록 감싼다.
export function proxiedImage(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
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
