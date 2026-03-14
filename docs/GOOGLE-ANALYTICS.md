# Google Analytics Setup

## Overview

Google Analytics 4 (GA4) is installed via gtag.js across all public-facing pages.

## Configuration

| Setting | Value |
|---------|-------|
| Stream Name | Coherence |
| Stream URL | https://coherence.viewyonder.com |
| Stream ID | 13906259524 |
| Measurement ID | G-6WQENHCM9S |

## Implementation

The gtag snippet lives in a single reusable component:

**`site/src/components/GoogleAnalytics.astro`**

This component is included in the `<head>` of the base layout:

- `site/src/layouts/Base.astro` — all pages

## Production Only

The component checks `import.meta.env.PROD` and only renders the scripts in production builds. Local dev (`npm run dev`) will not send analytics data.

## Verifying

1. Open https://coherence.viewyonder.com in an incognito window (no ad blocker)
2. In Google Analytics, go to **Reports > Realtime** to confirm active users
3. Alternatively, use **Admin > Data Streams > Web > Test installation**
