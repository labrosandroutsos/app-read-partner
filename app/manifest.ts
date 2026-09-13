import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Read Partner — Study Together',
    short_name: 'Read Partner',
    description:
      'Find your ideal study partner at university. Match, chat, and study together.',
    start_url: '/app',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f6f4ec',
    theme_color: '#285943',
    categories: ['education', 'social', 'productivity'],
    lang: 'el',
    dir: 'ltr',
    icons: [
      { src: '/icon.svg', type: 'image/svg+xml', sizes: 'any', purpose: 'any' },
      { src: '/apple-icon.png', type: 'image/png', sizes: '180x180', purpose: 'maskable' },
    ],
  }
}
