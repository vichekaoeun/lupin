/**
 * GET /api/context?refs=Title1|type1,Title2|type2
 *
 * Fetches thumbnails + summaries for cultural references.
 * - anime/manga → AniList GraphQL (free, no key)
 * - everything else → Wikipedia REST API (free, no key)
 *
 * Results are not persisted — this is a pure proxy to avoid CORS issues
 * with calling external APIs from the browser.
 */
import { NextRequest, NextResponse } from 'next/server';

interface ContextCard {
  title: string;
  type: string;
  image?: string;
  description?: string;
  url?: string;
}

async function fetchAniList(title: string, type: 'ANIME' | 'MANGA'): Promise<ContextCard | null> {
  const query = `
    query ($search: String, $type: MediaType) {
      Media(search: $search, type: $type) {
        title { romaji english }
        coverImage { large }
        description(asHtml: false)
        siteUrl
      }
    }
  `;
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { search: title, type } }),
      signal: AbortSignal.timeout(5000),
    });
    const json = await res.json();
    const media = json?.data?.Media;
    if (!media) return null;
    const desc = media.description?.replace(/<[^>]*>/g, '').slice(0, 180) ?? '';
    return {
      title: media.title.english ?? media.title.romaji ?? title,
      type,
      image: media.coverImage?.large,
      description: desc ? desc + (desc.length === 180 ? '…' : '') : undefined,
      url: media.siteUrl,
    };
  } catch {
    return null;
  }
}

async function fetchWikipedia(title: string, type: string): Promise<ContextCard | null> {
  try {
    const enc = encodeURIComponent(title);
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${enc}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return {
      title: json.title ?? title,
      type,
      image: json.thumbnail?.source,
      description: json.extract ? json.extract.slice(0, 180) + (json.extract.length > 180 ? '…' : '') : undefined,
      url: json.content_urls?.desktop?.page,
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const refsParam = req.nextUrl.searchParams.get('refs') ?? '';
  if (!refsParam) return NextResponse.json({ results: [] });

  const refs = refsParam.split(',').slice(0, 3).map((r) => {
    const [title, type] = r.split('|');
    return { title: decodeURIComponent(title ?? ''), type: type ?? 'other' };
  });

  const results = await Promise.all(
    refs.map(async ({ title, type }) => {
      if (!title) return null;
      // Try AniList first for anime/manga
      if (type === 'anime') return (await fetchAniList(title, 'ANIME')) ?? (await fetchWikipedia(title, type));
      if (type === 'manga') return (await fetchAniList(title, 'MANGA')) ?? (await fetchWikipedia(title, type));
      return fetchWikipedia(title, type);
    })
  );

  return NextResponse.json({
    results: results.filter(Boolean) as ContextCard[],
  });
}
