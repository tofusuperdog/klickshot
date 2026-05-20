# MinChap API

This is the standalone API app for `api.minchapseries.com`.

## Local Development

```bash
npm install
npm run dev
```

The local API runs on:

```text
http://localhost:4000
```

Set the web app env to:

```env
NEXT_PUBLIC_MINCHAP_API_BASE_URL=http://localhost:4000
```

## Vercel

Create a separate Vercel project with this folder as the project root:

```text
api
```

Production domain:

```text
api.minchapseries.com
```

Required environment variables are listed in `.env.example`.
