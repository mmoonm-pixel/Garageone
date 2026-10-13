import { useEffect, useRef, useState } from 'react';

const videoSource = '/videos/garage-one-institucional.mp4';
const videoPoster = '/images/garage-one-video-poster.webp';
const crossfadeMilliseconds = 650;
const crossfadeSeconds = crossfadeMilliseconds / 1000;

export default function BookingVideo() {
  const layerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([null, null]);
  const activeVideoRef = useRef(0);
  const [nearViewport, setNearViewport] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [activeVideo, setActiveVideo] = useState(0);
  const [ready, setReady] = useState<[boolean, boolean]>([false, false]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotionChange = () => setReducedMotion(preference.matches);
    const onVisibilityChange = () => setPageVisible(!document.hidden);
    onMotionChange();
    onVisibilityChange();
    preference.addEventListener('change', onMotionChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      preference.removeEventListener('change', onMotionChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const nearObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setNearViewport(true);
        nearObserver.disconnect();
      }
    }, { rootMargin: '300px 0px', threshold: 0 });
    const visibleObserver = new IntersectionObserver(entries => {
      setVisible(entries.some(entry => entry.isIntersecting && entry.intersectionRatio > 0));
    }, { threshold: [0, 0.01] });

    nearObserver.observe(layer);
    visibleObserver.observe(layer);
    return () => {
      nearObserver.disconnect();
      visibleObserver.disconnect();
    };
  }, []);

  const source = nearViewport && !reducedMotion && !failed ? videoSource : undefined;
  const shouldPlay = Boolean(source && visible && pageVisible && !reducedMotion);

  useEffect(() => {
    const videos = videoRefs.current;
    videos.forEach(video => {
      if (!video) return;
      video.defaultMuted = true;
      video.muted = true;
      video.volume = 0;
    });
    if (!source) {
      videos.forEach(video => { video?.pause(); video?.load(); });
      setReady([false, false]);
      activeVideoRef.current = 0;
      setActiveVideo(0);
    }
  }, [source]);

  useEffect(() => {
    const first = videoRefs.current[0];
    const second = videoRefs.current[1];
    if (!first || !second) return;
    const videos = [first, second];
    let cancelled = false;
    let frame: number | undefined;
    let fadeTimer: number | undefined;
    let fadingOut: number | undefined;
    let preparing = false;
    let nextPlaybackBlocked = false;

    const reset = (video: HTMLVideoElement) => {
      video.pause();
      video.loop = true;
      if (video.readyState >= 1 && video.currentTime !== 0) {
        try { video.currentTime = 0; } catch { /* A source may have been removed during cleanup. */ }
      }
    };
    const finishFade = () => {
      if (fadeTimer !== undefined) window.clearTimeout(fadeTimer);
      fadeTimer = undefined;
      if (fadingOut !== undefined) reset(videos[fadingOut]);
      fadingOut = undefined;
    };

    // Keep the second decoder paused except during the brief transition.
    videos.forEach((video, index) => {
      video.pause();
      video.loop = true;
      if (index !== activeVideoRef.current) reset(video);
    });

    const beginFade = () => {
      preparing = true;
      const outgoingIndex = activeVideoRef.current;
      const incomingIndex = 1 - outgoingIndex;
      const outgoing = videos[outgoingIndex];
      const incoming = videos[incomingIndex];
      reset(incoming);
      incoming.muted = true;
      incoming.volume = 0;
      // Hold the final frame if loading takes longer than the remaining edge.
      outgoing.loop = false;

      void incoming.play().then(() => {
        if (cancelled) return;
        setReady(previous => {
          const next: [boolean, boolean] = [...previous];
          next[incomingIndex] = true;
          return next;
        });
        activeVideoRef.current = incomingIndex;
        setActiveVideo(incomingIndex);
        fadingOut = outgoingIndex;
        preparing = false;
        fadeTimer = window.setTimeout(() => {
          if (!cancelled) finishFade();
        }, crossfadeMilliseconds);
      }).catch(() => {
        if (cancelled) return;
        reset(incoming);
        outgoing.loop = true;
        preparing = false;
        nextPlaybackBlocked = true;
      });
    };

    const monitor = () => {
      if (cancelled) return;
      const active = videos[activeVideoRef.current];
      if (!preparing && fadingOut === undefined && !nextPlaybackBlocked && Number.isFinite(active.duration) && active.duration > crossfadeSeconds && active.currentTime >= active.duration - crossfadeSeconds) {
        beginFade();
      }
      frame = window.requestAnimationFrame(monitor);
    };

    if (shouldPlay) {
      const active = videos[activeVideoRef.current];
      active.muted = true;
      active.volume = 0;
      void active.play().then(() => {
        if (!cancelled) frame = window.requestAnimationFrame(monitor);
      }).catch(() => {
        // A poster or the last frame remains available if playback is blocked.
      });
    }

    return () => {
      cancelled = true;
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      finishFade();
      videos.forEach((video, index) => {
        video.pause();
        video.loop = true;
        if (index !== activeVideoRef.current) reset(video);
      });
    };
  }, [shouldPlay, source]);

  return <div ref={layerRef} className={`booking-video-layer${ready[activeVideo] ? ' is-ready' : ''}`} style={{ backgroundImage: `url("${videoPoster}")` }} aria-hidden="true">
    {[0, 1].map(index => <video key={index} ref={node => { videoRefs.current[index] = node; }} className={`booking-video${ready[index] ? ' is-ready' : ''}${activeVideo === index ? ' is-active' : ''}`} src={source} poster={videoPoster} preload={source ? 'metadata' : 'none'} autoPlay={shouldPlay} muted loop playsInline aria-hidden="true" tabIndex={-1}
      onLoadedData={() => {
        if (!source) return;
        setReady(previous => {
          const next: [boolean, boolean] = [...previous];
          next[index] = true;
          return next;
        });
      }}
      onError={() => {
        setFailed(true);
        setReady([false, false]);
        videoRefs.current.forEach(video => video?.pause());
      }} />)}
  </div>;
}
