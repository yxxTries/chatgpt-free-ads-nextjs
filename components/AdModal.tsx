'use client';

import AdSlot from './AdSlot';

export default function AdModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl card relative">
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-white text-black rounded-full px-2 py-1 text-xs"
        >
          Close
        </button>
        <h2 className="text-lg font-semibold mb-3">Thanks for supporting free AI!</h2>
        <AdSlot />
        <p className="text-xs opacity-70 mt-3">The chat will resume after this short ad.</p>
      </div>
    </div>
  );
}
