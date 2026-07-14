"useClient";

import React, { useEffect } from "react";

const PlayerCore = ({
  src,
  videoRef,
  autoPlay = true,
  onTimeUpdate,
  onPlay,
  onPause,
  onClick,
  className,
  keyProp,
}) => {
  useEffect(() => {
    if (!src || !videoRef || !videoRef.current) return;

    let hls = null;
    const video = videoRef.current;
    const isHls = typeof src === "string" && src.includes(".m3u8");

    const attach = async () => {
      if (isHls) {
        try {
          const HlsModule = await import("hls.js");
          const Hls = HlsModule.default || HlsModule;
          if (Hls && Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(src);
            hls.attachMedia(video);
          } else {
            video.src = src;
          }
        } catch (err) {
          console.warn(
            "Failed to load hls.js, falling back to native src",
            err
          );
          video.src = src;
        }
      } else {
        // plain mp4 or other playable source
        try {
          video.src = src;
        } catch (err) {
          console.warn("Failed to set video src", err);
        }
      }

      if (autoPlay) {
        const playPromise = video.play();
        if (playPromise && playPromise.then) playPromise.catch(() => {});
      }
    };

    attach();

    return () => {
      try {
        if (hls) {
          hls.destroy();
          hls = null;
        }
      } catch (e) {
        // ignore
      }
    };
  }, [src, videoRef, autoPlay]);

  return (
    <video
      ref={videoRef}
      autoPlay={autoPlay}
      crossOrigin="anonymous"
      className={className}
      onTimeUpdate={onTimeUpdate}
      onPlay={onPlay}
      onPause={onPause}
      onClick={onClick}
      key={keyProp}
    />
  );
};

export default PlayerCore;
