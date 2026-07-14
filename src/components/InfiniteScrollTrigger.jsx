import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

const InfiniteScrollTrigger = ({ onTrigger, hasMore, isLoading }) => {
  const observerRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onTrigger();
        }
      },
      { threshold: 0.1 } 
    );

    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onTrigger]);

  if (!hasMore && !isLoading) return (
    <div className="w-full py-10 text-center text-gray-500 text-sm font-medium">
      You've reached the end of the multiverse.
    </div>
  );

  return (
    <div ref={observerRef} className="w-full py-12 flex flex-col items-center justify-center gap-3">
      <div className="relative">
        {/* Pulsing Outer Ring */}
        <div className="absolute inset-0 rounded-full bg-pink-600/20 animate-ping" />
        {/* Custom Spinner Icon */}
        <img 
            src="/Mangekyou-Sharingan-PNG-Transparent-Image.png" 
            className="w-10 h-10 animate-spin relative z-10 brightness-110 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]" 
            alt="Loading..."
        />
      </div>
      <p className="text-pink-500 font-bold text-xs uppercase tracking-[0.2em] animate-pulse">
        Summoning More Content
      </p>
    </div>
  );
};

export default InfiniteScrollTrigger;