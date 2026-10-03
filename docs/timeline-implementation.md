# AWA Auto Mall timeline implementation

This repository contains the **frontend only**. The PHP/MySQL API is maintained and delivered separately.

## Implemented frontend scope

- **Week 1 — project setup:** responsive page shell, shared design tokens, logo/favicon, PWA manifest and service worker.
- **Week 2 — core marketplace:** vehicle catalog, filters, search suggestions, brand/model/type routes, vehicle detail pages, image gallery, and 360-degree viewer support.
- **Week 3 — buyer tools:** vehicle inquiry flow, WhatsApp contact paths, compare tray/page, contact and sourcing forms.
- **Week 4 — orders and currency:** currency selector and conversion display, shipping/export guidance, and protected public order-tracking screen.
- **Week 5 — content and mobile:** news list/detail routes with API fallback, admin content module, installable PWA, mobile navigation, and a detailed guided AWA Assistant with sourcing, pricing, shipping, comparison, inspection, order-tracking, and privacy guidance.
- **Week 6 — testing and launch:** admin vehicles/inquiries/orders/settings/analytics modules, route metadata, sitemap, robots configuration, page/compare analytics events, lint and production build validation.

## API boundary

The frontend calls the separately deployed API through `VITE_API_BASE_URL`. API source files, database schema, migrations, uploads, and server credentials are intentionally not stored in this repository.

The assistant is intentionally client-side guidance for now; it does not send customer questions to an external AI provider or require a browser-exposed model key. A future server-side AI endpoint must preserve the same privacy and rate-limit rules.

Public API contracts used by the frontend include:

- `GET /api/health`
- `GET /api/catalog`
- `GET /api/catalog/{slug}`
- `GET /api/news`
- `GET /api/news/{slug}`
- `POST /api/inquiries`
- `POST /api/analytics`
- `GET /api/orders/track/{orderNumber}`
