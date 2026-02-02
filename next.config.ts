import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",

  // iOS-specific optimizations
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,

  // Fallback for offline
  fallbacks: {
    document: "/offline",
  },

  // Workbox options for better iOS support
  workboxOptions: {
    // Skip waiting is now in workboxOptions
    skipWaiting: true,
    clientsClaim: true,

    // Increase the maximum file size to cache (iOS needs full app shell)
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB

    // Runtime caching rules
    runtimeCaching: [
      {
        // Cache the start URL (homepage) with Network First strategy
        urlPattern: /^\/$/,
        handler: "NetworkFirst",
        options: {
          cacheName: "start-url",
          expiration: {
            maxEntries: 1,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
          networkTimeoutSeconds: 10,
        },
      },
      {
        // Cache page navigations
        urlPattern: ({ request }: { request: Request }) =>
          request.mode === "navigate",
        handler: "NetworkFirst",
        options: {
          cacheName: "pages",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60,
          },
          networkTimeoutSeconds: 10,
        },
      },
      {
        // Cache static assets (JS, CSS, fonts)
        urlPattern: /\.(?:js|css|woff2?)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-resources",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
        },
      },
      {
        // Cache images
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "images",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      {
        // Cache Google Fonts
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  // Use webpack for next-pwa compatibility
  turbopack: {},
  images: {
    unoptimized: true,
  },
};

export default withPWA(nextConfig);
