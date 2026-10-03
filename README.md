# AWA AUTO MALL

Premium automotive marketplace frontend for **AWA AUTO MALL**, a Guangzhou-based vehicle sourcing business serving customers internationally.

**Production domain:** `https://awaautos.com`
**Frontend repository:** `https://github.com/devdavix2/wheels-global-link`

> This repository contains the frontend only. The PHP/MySQL API is maintained separately and must never be copied into this repository.

## What is included

The current application includes a responsive car marketplace, vehicle detail pages, search and filters, vehicle comparison, sourcing requests, WhatsApp contact paths, order tracking, multi-currency display, shipping information, news, PWA installation support, an admin dashboard, analytics, and a guided AWA Assistant widget.

Spare-parts screens and backend support are retained for the planned follow-on phase. The launch scope should remain the car marketplace unless the business explicitly approves activating spare-parts inventory.

## Technology

- React and TypeScript
- TanStack Router
- Vite/Nitro build and deployment output
- Tailwind CSS and shadcn-style UI components
- PWA manifest and service worker
- PHP 8.1+/MySQL API deployed separately on cPanel or compatible hosting

## Local development

```bash
npm ci
cp .env.example .env
npm run dev
```

The development server is normally available at `http://localhost:3000`.

## Environment variables

```dotenv
VITE_API_BASE_URL=https://api.awaautos.com/api
VITE_API_HEALTH_PATH=/health
# Optional temporary migration fallback; prefer admin JWT login.
VITE_ADMIN_API_KEY=
```

Never commit a real API key, database password, JWT secret, admin password, or `.env` file. The browser must not receive database credentials or server-side AI keys.

## API boundary

The frontend calls the separately deployed API through `VITE_API_BASE_URL`.

| Method | Route                         | Purpose                                  |
| ------ | ----------------------------- | ---------------------------------------- |
| GET    | `/health`                     | API health check                         |
| GET    | `/catalog`                    | Published vehicle/parts catalog          |
| GET    | `/catalog/{slug}`             | Published vehicle detail                 |
| GET    | `/news`                       | Published news list                      |
| GET    | `/news/{slug}`                | Published news article                   |
| POST   | `/inquiries`                  | Vehicle and customer inquiry submission  |
| POST   | `/analytics`                  | Public page, compare, and inquiry events |
| GET    | `/orders/track/{orderNumber}` | Protected order tracking lookup          |
| POST   | `/admin/auth/login`           | Admin JWT login                          |

The request-vehicle form uses `POST /inquiries` with `type: "vehicle_request"`. Keep this contract synchronized with the separate backend.

## Main routes

- `/` — homepage
- `/cars` — vehicle marketplace
- `/cars/{slug}` — vehicle detail
- `/compare` — side-by-side vehicle comparison
- `/request-vehicle` — sourcing request form
- `/shipping` — shipping and export information
- `/track-order` — order tracking
- `/news` and `/news/{slug}` — content
- `/contact`, `/about`, `/why-awa` — company information
- `/admin/*` — protected staff tools

## Deployment checklist

1. Deploy the frontend build to the approved Vercel/hosting project.
2. Configure `VITE_API_BASE_URL` for the production API.
3. Configure the API `CORS_ORIGIN` to the exact production frontend origin.
4. Confirm DNS and HTTPS for `awaautos.com` and any approved `www` redirect.
5. Confirm `GET https://api.awaautos.com/api/health` from the production domain.
6. Test catalog, vehicle detail, news, inquiry, analytics, admin login, and order tracking against real data.
7. Verify the sitemap, robots file, canonical metadata, social previews, PWA installation, and mobile navigation.

## Timeline status

The majority of the original six-week feature scope is implemented in code. The remaining launch work is production deployment, real inventory/content loading, live API contract testing, mail/cron verification, mobile performance QA, canonical-domain cleanup, and owner sign-off. The implementation summary is documented in `docs/timeline-implementation.md`.

## Quality checks

```bash
npm run lint
npm run build
```

Lint completes with zero errors. Existing non-blocking warnings are primarily Fast Refresh export warnings in shared UI files and one admin effect dependency warning.

## Security and privacy

- Do not send card numbers, passwords, identity documents, or database credentials through the assistant or inquiry form.
- Keep all AI provider keys server-side if a real AI endpoint is added later.
- Use JWT admin sessions rather than exposing an admin API key in a public browser bundle.
- Keep API CORS allowlisted and serve both frontend and backend over HTTPS.
- Confirm final prices, availability, shipping, duties, and delivery timing with AWA before accepting an order.

## Project boundary

The backend package, database schema, migrations, cron workers, upload directory, and production environment values are separate deliverables. This separation is intentional: the frontend repository can be published safely without exposing server credentials or API implementation files.
