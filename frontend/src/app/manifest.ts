import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GiftWise — Family Gift Tracker',
    short_name: 'GiftWise',
    description: 'Family gift tracker with wishlists, Secret Santa, group gifts & price alerts across Cyprus & Greece',
    start_url: '/',
    id: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    background_color: '#fbfbfa',
    theme_color: '#c5a880',
    orientation: 'any',
    categories: ['lifestyle', 'productivity', 'shopping'],
    icons: [
      {
        src: '/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
    ],
    shortcuts: [
      {
        name: 'Wishlists',
        short_name: 'Wishlists',
        description: 'View family gift wishlists',
        url: '/wishlists',
        icons: [{ src: '/web-app-manifest-192x192.png', sizes: '192x192' }]
      },
      {
        name: 'Secret Santa',
        short_name: 'Secret Santa',
        description: 'Secret Santa group draws',
        url: '/secret-santa',
        icons: [{ src: '/web-app-manifest-192x192.png', sizes: '192x192' }]
      },
      {
        name: 'Price Tracker',
        short_name: 'Tracker',
        description: 'Monitor store price drops',
        url: '/tracker',
        icons: [{ src: '/web-app-manifest-192x192.png', sizes: '192x192' }]
      }
    ],
    share_target: {
      action: '/wishlists/add-shared',
      method: 'GET',
      params: {
        title: 'title',
        text: 'text',
        url: 'url',
      },
    },
  }
}
