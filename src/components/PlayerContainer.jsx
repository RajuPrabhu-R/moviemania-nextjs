import React, { useEffect, useCallback } from "react";
import PlayerCore from "./PlayerCore";
import { Play, X, Maximize, Volume2 } from "lucide-react";

const formatTime = (s) => {
  if (!s || !isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${sec}`;
};

const PlayerContainer = ({
  src,
  videoRef,
  isPlaying,
  setIsPlaying,
  progress,
  setProgress,
  handleTimeUpdate,
  handleSeek,
  className,
}) => {
  const onPlay = useCallback(() => setIsPlaying(true), [setIsPlaying]);
  const onPause = useCallback(() => setIsPlaying(false), [setIsPlaying]);

  useEffect(() => {
    const el = videoRef?.current;
    if (!el) return;

    const onTime = (e) => {
      if (handleTimeUpdate) handleTimeUpdate(e);
      if (el.duration && isFinite(el.duration)) {
        const pct = (el.currentTime / el.duration) * 100;
        setProgress(pct);
      }
    };

    el.addEventListener("timeupdate", onTime);
    return () => el.removeEventListener("timeupdate", onTime);
  }, [videoRef, handleTimeUpdate, setProgress]);

  const togglePlay = useCallback(() => {
    if (!videoRef?.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [videoRef]);

  const handleFullscreen = useCallback(() => {
    try {
      const el = videoRef?.current;
      if (!el) return;
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        el.requestFullscreen?.();
      }
    } catch (e) {}
  }, [videoRef]);

  const onSeekBarClick = (e) => {
    if (!videoRef?.current) return;
    if (handleSeek) handleSeek(e);
  };

  return (
    <div className={`relative w-full h-full ${className || ""}`}>
      {/* Debug badge to confirm custom player is rendered */}
      <div className="absolute top-3 left-3 z-60 px-2 py-1 bg-pink-600 text-xs font-semibold rounded-md shadow-md text-black/90">
        Custom Player
      </div>
      <PlayerCore
        src={src}
        videoRef={videoRef}
        autoPlay={true}
        onTimeUpdate={handleTimeUpdate}
        onPlay={onPlay}
        onPause={onPause}
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer"
        keyProp={src}
      />

      {/* Big Center Play Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-pink-600/80 p-6 rounded-full animate-pulse shadow-2xl shadow-pink-500/50">
            <Play size={40} fill="white" />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover/player:opacity-100 transition-opacity duration-300 z-50">
        <div
          className="w-full h-1.5 bg-white/20 rounded-full mb-4 cursor-pointer relative overflow-hidden"
          onClick={onSeekBarClick}
          role="slider"
          aria-valuenow={Math.round(progress)}
        >
          <div
            className="absolute top-0 left-0 h-full bg-pink-600"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-6">
            <button
              onClick={togglePlay}
              className="hover:text-pink-500 transition-colors p-1"
            >
              {isPlaying ? (
                <X size={24} />
              ) : (
                <Play size={24} fill="currentColor" />
              )}
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <Volume2 size={20} className="text-gray-400" />
              <div className="w-16 h-1 bg-white/20 rounded-full">
                <div className="w-full h-full bg-white rounded-full" />
              </div>
            </div>

            <span className="text-xs font-mono text-gray-300">
              {videoRef.current
                ? formatTime(videoRef.current.currentTime)
                : "0:00"}
              <span className="mx-2 opacity-40">/</span>
              {videoRef.current
                ? formatTime(videoRef.current.duration)
                : "0:00"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleFullscreen}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Maximize size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerContainer;
