'use client';

import { useEffect, useRef } from 'react';

export default function AdSlot() {
  const ref = useRef<HTMLInsElement>(null);
  const hasClient = !!process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const slot = process.env.NEXT_PUBLIC_ADSENSE_SLOT;

  useEffect(() => {
    if (!hasClient || !ref.current) return;
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, [hasClient]);

  if (!hasClient || !slot) {
    return (
      <div className="w-full h-24 rounded-lg border border-dashed border-white/10 flex items-center justify-center text-sm opacity-70">
        Ad placeholder (configure AdSense env vars for live ads)
      </div>
    );
  }

  return (
    <ins
      className="adsbygoogle block"
      style={{ display: 'block' }}
      data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
      ref={ref}
    />
  );
}
