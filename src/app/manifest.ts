import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Lupin — Japanese Vocabulary',
    short_name: 'Lupin',
    description: 'Learn Japanese vocabulary through subculture.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#1a0f00',
    theme_color: '#c8973e',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
