import { SubcultureTheme } from '@/lib/types';

interface Props {
  word: string;
  theme?: SubcultureTheme;
}

function getLinks(word: string, theme: SubcultureTheme) {
  const enc = encodeURIComponent(word);
  const themeEnc = encodeURIComponent(theme);

  const base = [
    { label: 'Jisho',     url: `https://jisho.org/search/${enc}`,                                        title: 'Dictionary entry' },
    { label: 'X',         url: `https://twitter.com/search?q=${enc}&lang=ja&f=live`,                     title: 'Live Japanese posts' },
    { label: 'YouTube',   url: `https://www.youtube.com/results?search_query=${enc}+${themeEnc}`,        title: `${theme} videos` },
  ];

  const themeLinks: Record<SubcultureTheme, { label: string; url: string; title: string }[]> = {
    anime: [
      { label: 'AniList',     url: `https://anilist.co/search/anime?search=${enc}`,         title: 'Find anime' },
      { label: 'Crunchyroll', url: `https://www.crunchyroll.com/search?q=${enc}`,            title: 'Watch on Crunchyroll' },
    ],
    manga: [
      { label: 'MangaDex',    url: `https://mangadex.org/search?q=${enc}`,                  title: 'Find manga' },
      { label: 'AniList',     url: `https://anilist.co/search/manga?search=${enc}`,         title: 'Find manga on AniList' },
    ],
    gaming: [
      { label: 'VNDB',        url: `https://vndb.org/v?q=${enc}`,                           title: 'Visual novel database' },
      { label: 'GameFAQs',    url: `https://gamefaqs.gamespot.com/search?game=${enc}`,       title: 'Game guides' },
    ],
    'idol groups': [
      { label: 'LastFM',      url: `https://www.last.fm/search?q=${enc}`,                   title: 'Music search' },
      { label: 'Genius',      url: `https://genius.com/search?q=${enc}`,                    title: 'Lyrics' },
    ],
    'street fashion': [
      { label: 'Pinterest',   url: `https://www.pinterest.com/search/pins/?q=${enc}+japan+fashion`, title: 'Fashion inspiration' },
      { label: 'Lolibrary',   url: `https://lolibrary.org/search?s=${enc}`,                 title: 'J-fashion database' },
    ],
    general: [],
  };

  return [...base, ...(themeLinks[theme] ?? [])];
}

export default function ContextLinks({ word, theme = 'general' }: Props) {
  const links = getLinks(word, theme);
  return (
    <div className="flex flex-wrap gap-2">
      {links.map(({ label, url, title }) => (
        <a
          key={label}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          title={title}
          className="inline-flex items-center text-xs px-3 py-1 rounded-full transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#5a5a7a' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#a0a0c0'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.15)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#5a5a7a'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'; }}
        >
          {label}
        </a>
      ))}
    </div>
  );
}
