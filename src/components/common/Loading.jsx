import React from 'react';

export const Loader = ({ fullPage = false }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${fullPage ? 'h-screen w-screen bg-dark-bg text-white' : 'h-full w-full'}`}>
      <div className="relative flex items-center justify-center">
        {/* Glow backdrop spinner */}
        <div className="absolute h-16 w-16 animate-ping rounded-full bg-primary/20 blur-xl"></div>
        {/* Main spinning gradient circle */}
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-t-primary border-r-accent-indigo border-b-accent-rose border-l-transparent"></div>
      </div>
      <p className="mt-4 text-sm font-medium tracking-wide text-gray-400 animate-pulse">Loading Workspace...</p>
    </div>
  );
};

export const ChatSkeleton = () => {
  return (
    <div className="w-full space-y-4 p-4 animate-pulse">
      {[1, 2, 3].map((n) => (
        <div key={n} className={`flex items-start gap-3.5 ${n % 2 === 0 ? 'flex-row-reverse' : ''}`}>
          <div className="h-9 w-9 rounded-full bg-gray-700/50"></div>
          <div className="space-y-1.5 max-w-[70%]">
            <div className="h-3.5 w-24 rounded bg-gray-700/50"></div>
            <div className="h-12 w-48 rounded-xl bg-gray-700/30"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const ConversationSkeleton = () => {
  return (
    <div className="space-y-3 p-4 animate-pulse">
      {[1, 2, 3, 4, 5].map((n) => (
        <div key={n} className="flex items-center gap-3.5 rounded-lg p-2">
          <div className="h-11 w-11 rounded-full bg-gray-700/50"></div>
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <div className="h-3.5 w-28 rounded bg-gray-700/50"></div>
              <div className="h-3 w-8 rounded bg-gray-700/40"></div>
            </div>
            <div className="h-3 w-40 rounded bg-gray-700/30"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const AnalyticsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4 animate-pulse">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="h-28 rounded-2xl bg-gray-700/40 p-5"></div>
      ))}
    </div>
  );
};
