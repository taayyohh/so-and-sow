'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <h2 className="text-xl font-medium mb-4 text-white">Something went wrong</h2>
      <p className="text-sm text-white/60 mb-6">{error.message}</p>
      <button onClick={reset} className="py-2 px-6 border border-white text-white text-sm hover:bg-white hover:text-[#131313] transition-colors">
        Try Again
      </button>
    </div>
  );
}
