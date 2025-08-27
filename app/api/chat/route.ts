import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs';

// Simple per-IP rate limit (memory). For production, use Upstash or Redis.
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQ = 100; // per IP per hour
const hits = new Map<string, { count: number; reset: number }>();
function ipOf(req: NextRequest) {
  const fwd = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  // Next.js middleware could attach real IP; fallback to 'unknown'
  return fwd || 'unknown';
}

function checkRate(req: NextRequest) {
  const ip = ipOf(req);
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return true;
  }
  entry.count++;
  if (entry.count > MAX_REQ) return false;
  return true;
}

export async function POST(req: NextRequest) {
  if (!checkRate(req)) {
    return NextResponse.json({ error: "Rate limit exceeded. Please try later." }, { status: 429 });
  }

  const { messages } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server missing OPENAI_API_KEY" }, { status: 500 });
  }

  const sysPrompt = "You are a helpful, concise assistant in a public ad-supported playground. Avoid unsafe content.";
  const payload = {
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: sysPrompt },
      ...(Array.isArray(messages) ? messages : []),
    ],
    temperature: 0.7
  };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Upstream error: ${err}` }, { status: 500 });
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";
    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}
