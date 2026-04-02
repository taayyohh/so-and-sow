'use client';

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <h2 className="text-xl font-medium mb-4 text-white">Something went wrong</h2>
      <p className="text-sm text-white/60 mb-6">{error.message}</p>
      <button onClick={reset} className="py-2 px-6 border border-white text-white text-sm hover:bg-white hover:text-[black] transition-colors">
        Try Again
      </button>
    </div>
  );
}
