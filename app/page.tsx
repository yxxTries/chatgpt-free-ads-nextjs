'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Send, Trash2, Sparkles, Paperclip, X } from 'lucide-react';
import clsx from 'clsx';
import AdModal from '@/components/AdModal';
import AdSlot from '@/components/AdSlot';

type Message = { role: 'user' | 'assistant'; content: string };

const SUPPORTED_MODELS = [
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', fileSupport: false },
  { id: 'gpt-4o', name: 'GPT-4o', fileSupport: true },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', fileSupport: true },
];

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hey! Ask me anything. You'll see a short ad every 10 prompts so everyone can use this for free." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [model, setModel] = useState(SUPPORTED_MODELS[2].id); // default: gpt-4o-mini
  const [files, setFiles] = useState<File[]>([]);
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
      // Prepare form data if files are present and model supports files
      let res;
      if (
        files.length > 0 &&
        SUPPORTED_MODELS.find((m) => m.id === model)?.fileSupport
      ) {
        const formData = new FormData();
        formData.append('messages', JSON.stringify(newMessages));
        formData.append('model', model);
        files.forEach((file, idx) => formData.append('files', file, file.name));
        res = await fetch('/api/chat', {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: newMessages, model }),
        });
      }
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

  function handleModelChange(e: ChangeEvent<HTMLSelectElement>) {
    setModel(e.target.value);
    setFiles([]); // clear files when switching model
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  }

  const selectedModel = SUPPORTED_MODELS.find((m) => m.id === model);

  return (
    <main className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-2">
          <Sparkles className="inline-block" /> Unlimited GPT
        </h1>
        <div className="flex items-center gap-2">
          {/* Model selector - color matches dark theme */}
          <div className="relative">
            <select
              value={model}
              onChange={handleModelChange}
              className="text-sm px-4 py-2 rounded-xl font-semibold border-2 border-[color:var(--border)] shadow-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] transition-all duration-150"
              style={{
                minWidth: 160,
                appearance: 'none',
                background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)',
                color: 'var(--text-main)',
              }}
              title="Change ChatGPT Model"
            >
              {SUPPORTED_MODELS.map((m) => (
                <option key={m.id} value={m.id} style={{ color: '#222' }}>
                  {m.name}
                </option>
              ))}
            </select>
            {/* Custom dropdown arrow */}
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--text-main)] opacity-80">
              ▼
            </span>
          </div>
        </div>
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

        {/* Chat bar (input) comes next */}
        <div className="card">
          <div className="flex gap-2 items-center">
            {/* File upload for supported models, as attachment icon left of textarea */}
            {selectedModel?.fileSupport && (
              <div className="flex flex-col items-center">
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                  <Paperclip className="w-5 h-5 opacity-80" />
                  <span className="sr-only">Attach files</span>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.txt,.doc,.docx"
                />
                {files.length > 0 && (
                  <div className="mt-1 text-xs opacity-70 flex flex-col items-start">
                    <div>
                      {files.map((file, idx) => (
                        <span key={file.name + idx} className="mr-1">
                          {file.name}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setFiles([])}
                      className="mt-1 px-2 py-1 rounded bg-red-700 hover:bg-red-800 text-xs text-white flex items-center gap-1"
                      title="Remove all attachments"
                    >
                      <X size={14} /> Remove All
                    </button>
                  </div>
                )}
              </div>
            )}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={input ? 3 : 1}
              placeholder="Type your message…"
              className={input
                ? "w-full p-3 rounded-xl border border-white/10 transition-all duration-150"
                : "w-full p-2 rounded-xl border border-white/10 transition-all duration-150"}
              style={{
                minHeight: input ? '3.5rem' : '2.2rem',
                maxHeight: '8rem',
                resize: 'vertical'
              }}
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

        {/* Inline responsive ad below chat bar */}
        <div className="card">
          <AdSlot />
        </div>
      </div>

      <AdModal open={showAd} onClose={() => setShowAd(false)} />
    </main>
  );
}
