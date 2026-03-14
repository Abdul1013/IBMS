import { useState, useRef, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';

export default function AISummaryButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {/* Popover */}
      {open && (
        <div className="w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-indigo-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">AI Daily Summary</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 py-5 text-center space-y-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">AI Summary — Coming Soon</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Get an AI-generated digest of today's announcements, highlighting what matters most
                to you.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-left space-y-1.5">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                Planned features
              </p>
              {[
                'Daily bulletin digest',
                'Priority highlights',
                'Personalised to your categories',
                'Missed announcements recap',
              ].map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          open
            ? 'bg-gray-800 scale-95'
            : 'bg-gradient-to-br from-primary to-indigo-500 hover:scale-110 hover:shadow-primary/40'
        }`}
        aria-label="AI Summary"
        title="AI Daily Summary"
      >
        <Sparkles className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}
