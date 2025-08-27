# Free ChatGPT Playground (Ad-supported)

A super user-friendly Next.js app that lets users chat with the ChatGPT API **without sign-up** and shows an ad **every 10 prompts**.

## Stack
- **Next.js 14 (App Router)** + **Tailwind CSS**
- **OpenAI API** via `/api/chat`
- **Google AdSense** responsive units (modal every 10 prompts + inline slot)
- **Deployment**: Vercel (app). DB not required.

> You proposed NextAuth + Supabase, but since there's **no sign-up**, this template drops auth/DB to stay lightweight. You can add them later.

## Quickstart

   ```bash
   npm run dev
   ```

Open http://localhost:3000

## Environment

```
OPENAI_API_KEY=sk-...
# Optional: change the model
OPENAI_MODEL=gpt-4o-mini

# Optional but recommended for live ads
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxxxxxx
NEXT_PUBLIC_ADSENSE_SLOT=1234567890
```

When AdSense variables are not configured, the app shows **placeholders** so you can still develop locally.

## Notes
- A simple in-memory per-IP rate limit protects the proxy. For production, use Upstash Redis or a proper gateway.
- The "ad roll" is implemented with a modal that triggers on every 10th prompt via `localStorage` counter.
- The UI is intentionally minimal and responsive, with a glassy card aesthetic.
