'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Trash2, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import AdModal from '@/components/AdModal';
import AdSlot from '@/components/AdSlot';

type Message = { role: 'user' | 'assistant'; content: string };

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hey! Ask me anything. You'll see a short ad every 10 prompts so everyone can use this for free." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  // Ad roll check
  useEffect(() => {
    const count = Number(localStorage.getItem('promptCount') || '0');
    // Show ad immediately if user lands and count is multiple of 10 and not zero (resume state)
    if (count !== 0 && count % 10 === 0) setShowAd(true);
  }, []);

  async function send() {
    if (!input.trim() || loading) return;
    const newMessages = [...messages, { role: 'user', content: input } as Message];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // increment prompt counter
    const prev = Number(localStorage.getItem('promptCount') || '0') + 1;
    localStorage.setItem('promptCount', String(prev));
    if (prev % 10 === 0) {
      setShowAd(true);
      // Slight delay so modal opens first
      setTimeout(() => {}, 300);
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({} as any));
        throw new Error(e.error || 'Request failed');
      }
      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      setMessages([...newMessages, { role: 'assistant', content: `⚠️ ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([{ role: 'assistant', content: "Cleared! What should we talk about next?" }]);
  }

  return (
    <main className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-2">
          <Sparkles className="inline-block" /> Free ChatGPT Playground
        </h1>
        <button
          onClick={clearChat}
          className="text-sm px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2"
          title="Clear chat"
        >
          <Trash2 size={16} /> Clear
        </button>
      </div>

      <div className="grid gap-4">
        <div ref={listRef} className="card h-[60vh] overflow-y-auto space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={clsx("p-3 rounded-xl", m.role === 'assistant' ? 'bg-white/5' : 'bg-black/20')}>
              <div className="text-xs uppercase opacity-60 mb-1">{m.role}</div>
              <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
            </div>
          ))}
          {loading && (
            <div className="p-3 rounded-xl bg-white/5 animate-pulse">
              <div className="text-xs uppercase opacity-60 mb-1">assistant</div>
              <div>Thinking…</div>
            </div>
          )}
        </div>

        {/* Chat bar (input) comes first */}
        <div className="card">
          <div className="flex gap-2 items-center">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={3}
              placeholder="Type your message…"
              className="w-full p-3 rounded-xl border border-white/10"
            />
            <button
              onClick={send}
              disabled={loading}
              className="h-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60"
            >
              <Send />
            </button>
          </div>
          <p className="mt-2 text-xs opacity-70">
            Tip: An ad pops up every 10 prompts. No sign-up needed.
          </p>
        </div>

        {/* Inline responsive ad now below chat bar */}
        <div className="card">
          <AdSlot />
        </div>
      </div>

      <AdModal open={showAd} onClose={() => setShowAd(false)} />
    </main>
  );
}
