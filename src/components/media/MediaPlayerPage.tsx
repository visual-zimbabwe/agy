"use client";

import { liveQuery } from "dexie";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { formatAudioDuration } from "@/features/wall/audio-notes";
import { deriveMediaLibrary, type MediaLibraryItem } from "@/features/wall/media-library";
import { loadWallSnapshot } from "@/features/wall/storage";
import { getVideoPlayback } from "@/features/wall/video-notes";

const navLinkClassName =
  "relative inline-flex items-center justify-center px-1 py-2 text-sm font-medium text-[#6f665f] transition hover:text-[#1c1c19] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a33818]/30";

const iconButtonClassName =
  "inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#eadfd3] bg-white/70 text-[#5b5048] shadow-[0_10px_24px_rgba(28,28,25,0.05)] transition hover:-translate-y-0.5 hover:text-[#a33818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a33818]/30";

const headerIconClassName = "h-5 w-5";

const formatClock = (value: number) => {
  if (!Number.isFinite(value) || value < 0) {
    return "00:00";
  }

  const totalSeconds = Math.floor(value);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const formatLibraryDuration = (seconds?: number) => {
  if (typeof seconds !== "number") {
    return "Duration pending";
  }
  return formatAudioDuration(seconds);
};

const formatCapturedDate = (timestamp: number) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(timestamp);

const describeMediaItem = (item: MediaLibraryItem) => {
  const descriptiveTags = item.tags.filter((tag) => tag !== item.kind);
  if (descriptiveTags.length > 0) {
    return `Tagged on the wall with ${descriptiveTags.slice(0, 4).join(", ")}.`;
  }

  if (item.kind === "audio") {
    return item.source === "link"
      ? "Saved from a linked source and ready to play alongside the rest of the wall library."
      : "Uploaded directly to the wall and available as part of the shared audio library.";
  }

  return item.source === "link"
    ? "Linked into the wall as a playable video fragment and grouped into the live media library."
    : "Uploaded to the wall as a local-first video fragment with its playback state preserved in the shared library.";
};

const getActiveSectionLabel = (item: MediaLibraryItem) => (item.kind === "video" ? "Video fragments" : "Audio fragments");

const canUseFullscreen = (element: HTMLDivElement | null) =>
  Boolean(element && typeof element.requestFullscreen === "function");

export const MediaPlayerPage = () => {
  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [activeId, setActiveId] = useState<string>();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.72);
  const [playIntent, setPlayIntent] = useState(false);
  const [pendingSeekTime, setPendingSeekTime] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const subscription = liveQuery(async () => {
      const snapshot = await loadWallSnapshot();
      return deriveMediaLibrary(snapshot.notes);
    }).subscribe({
      next: (nextItems) => {
        setItems(nextItems);
        setIsLoaded(true);
      },
      error: () => {
        setItems([]);
        setIsLoaded(true);
      },
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (items.length === 0) {
      setActiveId(undefined);
      return;
    }

    if (activeId && items.some((item) => item.id === activeId)) {
      return;
    }

    const nextDefault = items.find((item) => item.kind === "video") ?? items[0];
    setActiveId(nextDefault?.id);
  }, [activeId, items]);

  const activeItem = items.find((item) => item.id === activeId) ?? items[0];
  const videoPlayback = activeItem?.kind === "video" ? getVideoPlayback(activeItem.video) : undefined;
  const videoItems = items.filter((item) => item.kind === "video");
  const audioItems = items.filter((item) => item.kind === "audio");
  const activeDuration = activeItem?.durationSeconds ?? 0;
  const canSeekActiveMedia = Boolean(activeItem && (activeItem.kind === "audio" || videoPlayback?.kind === "direct"));

  useEffect(() => {
    setCurrentTime(0);
    setDuration(activeDuration);
    setIsPlaying(false);
  }, [activeDuration, activeItem?.id]);

  useEffect(() => {
    const media =
      activeItem?.kind === "audio"
        ? audioRef.current
        : videoPlayback?.kind === "direct"
          ? videoRef.current
          : null;
    if (!media) {
      return;
    }

    media.volume = volume;

    const syncCurrentTime = () => setCurrentTime(media.currentTime);
    const syncDuration = () => {
      const nextDuration = Number.isFinite(media.duration) && media.duration > 0 ? media.duration : activeItem?.durationSeconds ?? 0;
      setDuration(nextDuration);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setPlayIntent(false);
    };

    media.addEventListener("timeupdate", syncCurrentTime);
    media.addEventListener("loadedmetadata", syncDuration);
    media.addEventListener("durationchange", syncDuration);
    media.addEventListener("play", handlePlay);
    media.addEventListener("pause", handlePause);
    media.addEventListener("ended", handleEnded);

    syncDuration();
    syncCurrentTime();

    if (playIntent) {
      void media.play().catch(() => {
        setIsPlaying(false);
      });
    } else {
      media.pause();
    }

    return () => {
      media.removeEventListener("timeupdate", syncCurrentTime);
      media.removeEventListener("loadedmetadata", syncDuration);
      media.removeEventListener("durationchange", syncDuration);
      media.removeEventListener("play", handlePlay);
      media.removeEventListener("pause", handlePause);
      media.removeEventListener("ended", handleEnded);
    };
  }, [activeDuration, activeItem?.durationSeconds, activeItem?.id, activeItem?.kind, playIntent, videoPlayback?.kind, volume]);

  useEffect(() => {
    if (pendingSeekTime === null) {
      return;
    }

    const media =
      activeItem?.kind === "audio"
        ? audioRef.current
        : videoPlayback?.kind === "direct"
          ? videoRef.current
          : null;

    if (media) {
      // eslint-disable-next-line react-hooks/immutability
      media.currentTime = pendingSeekTime;
    }

    setPendingSeekTime(null);
  }, [activeItem?.kind, pendingSeekTime, videoPlayback?.kind]);

  const togglePlayback = () => {
    if (!activeItem) {
      return;
    }

    if (activeItem.kind === "video" && videoPlayback?.kind === "embed") {
      window.open(activeItem.url, "_blank", "noopener,noreferrer");
      return;
    }

    setPlayIntent((previous) => !previous);
  };

  const stepSelection = (direction: -1 | 1) => {
    if (!activeItem || items.length === 0) {
      return;
    }

    const currentIndex = items.findIndex((item) => item.id === activeItem.id);
    if (currentIndex < 0) {
      return;
    }

    const nextIndex = (currentIndex + direction + items.length) % items.length;
    setActiveId(items[nextIndex]?.id);
    setPlayIntent(true);
  };

  const handleSeek = (nextValue: number) => {
    if (!canSeekActiveMedia) {
      return;
    }
    setPendingSeekTime(nextValue);
    setCurrentTime(nextValue);
  };

  const handleVolumeChange = (nextVolume: number) => {
    setVolume(nextVolume);
  };

  const handleFullscreen = () => {
    if (!canUseFullscreen(stageRef.current)) {
      return;
    }
    void stageRef.current?.requestFullscreen();
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fdf9f3_0%,#f8f1e8_100%)] text-[#1c1c19]">
      <div className="border-b border-[#efe3d6] bg-white/55 backdrop-blur-xl">
        <header className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-8">
            <Link href="/wall" className="font-[Newsreader] text-[2rem] italic leading-none text-[#a33818] no-underline">
              Agy
            </Link>
            <nav className="hidden items-center gap-6 md:flex">
              <Link href="/wall" className={navLinkClassName}>Wall</Link>
              <Link href="/decks" className={navLinkClassName}>Decks</Link>
              <Link href="/page" className={navLinkClassName}>Page</Link>
              <span className={`${navLinkClassName} text-[#a33818]`}>
                Media
                <span className="absolute inset-x-1 -bottom-0.5 h-[2px] rounded-full bg-[#a33818]" />
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/settings" className={iconButtonClassName} aria-label="Open settings">
              <svg viewBox="0 0 24 24" fill="none" className={headerIconClassName} aria-hidden="true">
                <path d="M12 4.75 13.4 5.14 14.2 6.42 15.63 6.33 16.78 7.18 16.69 8.61 17.97 9.41 18.36 10.81 17.45 11.92 18.36 13.03 17.97 14.43 16.69 15.23 16.78 16.66 15.63 17.51 14.2 17.42 13.4 18.7 12 19.09 10.6 18.7 9.8 17.42 8.37 17.51 7.22 16.66 7.31 15.23 6.03 14.43 5.64 13.03 6.55 11.92 5.64 10.81 6.03 9.41 7.31 8.61 7.22 7.18 8.37 6.33 9.8 6.42 10.6 5.14 12 4.75Z" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" />
                <circle cx="12" cy="11.92" r="2.7" stroke="currentColor" strokeWidth="1.35" />
              </svg>
            </Link>
            <Link href="/wall" className={iconButtonClassName} aria-label="Return to wall">
              <svg viewBox="0 0 24 24" fill="none" className={headerIconClassName} aria-hidden="true">
                <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.35" />
                <path d="M5.5 19.25c1.7-3.6 4.24-5.4 6.5-5.4s4.8 1.8 6.5 5.4" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
              </svg>
            </Link>
          </div>
        </header>
      </div>

      <section className="mx-auto grid max-w-[1440px] gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.45fr)_22rem] lg:px-8 lg:py-8">
        <div className="space-y-4 lg:space-y-5">
          <div
            ref={stageRef}
            className="overflow-hidden rounded-[28px] border border-[#eadfd3] bg-[linear-gradient(145deg,#22372f_0%,#46594d_44%,#ece0cd_100%)] shadow-[0_28px_60px_rgba(62,45,30,0.16)]"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-[#161614]">
              {!activeItem ? (
                <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.12),transparent_35%),linear-gradient(135deg,#233429,#101311)] px-6 text-center">
                  <div className="max-w-xl space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f0dfc8]/78">Wall media fragments</p>
                    <h1 className="font-[Newsreader] text-4xl italic text-[#fff8ef] sm:text-5xl">No media on the wall yet.</h1>
                    <p className="text-sm leading-7 text-[#eadfce]/78 sm:text-base">
                      Add audio or video notes on the wall and this player will populate automatically from the shared library.
                    </p>
                  </div>
                </div>
              ) : activeItem.kind === "video" ? (
                videoPlayback?.kind === "direct" ? (
                  <video
                    key={activeItem.id}
                    ref={videoRef}
                    src={videoPlayback.url}
                    poster={activeItem.posterUrl}
                    className="h-full w-full object-cover"
                    playsInline
                    preload="metadata"
                  />
                ) : videoPlayback?.kind === "embed" ? (
                  <iframe
                    key={activeItem.id}
                    src={videoPlayback.url}
                    title={activeItem.title}
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.14),transparent_28%),linear-gradient(135deg,#47372e,#111111)] px-6 text-center">
                    <div className="space-y-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f0dfc8]/78">Playback unavailable</p>
                      <h2 className="font-[Newsreader] text-4xl italic text-[#fff8ef]">{activeItem.title}</h2>
                      <p className="mx-auto max-w-xl text-sm leading-7 text-[#eadfce]/78">
                        This video was saved on the wall, but its source cannot be embedded directly here. Use the original link action below.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="relative flex h-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_24%,rgba(248,245,236,0.18),transparent_22%),linear-gradient(135deg,#21342f_0%,#0f1311_66%)] px-6">
                  <audio key={activeItem.id} ref={audioRef} src={activeItem.url} preload="metadata" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(251,234,198,0.14),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(212,240,222,0.12),transparent_24%)]" />
                  <div className="relative flex max-w-2xl flex-col items-center text-center">
                    <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-full border border-white/14 bg-white/8 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur">
                      <svg viewBox="0 0 24 24" fill="none" className="h-12 w-12 text-[#fff5e9]" aria-hidden="true">
                        <path d="M8 9.5v5m4-7v9m4-5v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        <path d="M6 12h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.48" />
                      </svg>
                    </div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#eadfce]/76">Audio fragment</p>
                    <h2 className="mt-3 font-[Newsreader] text-4xl italic text-[#fff8ef] sm:text-5xl">{activeItem.title}</h2>
                    <p className="mt-4 max-w-xl text-sm leading-7 text-[#eadfce]/78 sm:text-base">{describeMediaItem(activeItem)}</p>
                    <div className="mt-8 flex w-full max-w-lg items-end justify-center gap-2">
                      {[22, 38, 54, 72, 58, 88, 64, 40, 28, 48, 70, 44, 26, 58, 36].map((height, index) => (
                        <span
                          key={`${activeItem.id}:${index}`}
                          className="w-3 rounded-full bg-[linear-gradient(180deg,rgba(255,245,233,0.96),rgba(195,114,72,0.9))]"
                          style={{ height }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-[#eadfd3] bg-[linear-gradient(180deg,rgba(255,252,247,0.96),rgba(250,242,233,0.96))] px-4 py-4 sm:px-5">
              <div className="flex items-center gap-3">
                <span className="w-12 text-[11px] font-semibold tracking-[0.16em] text-[#8b7669]">{formatClock(currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={Math.max(duration, activeItem?.durationSeconds ?? 0, 1)}
                  step={0.1}
                  value={Math.min(currentTime, Math.max(duration, activeItem?.durationSeconds ?? 0, 1))}
                  onChange={(event) => handleSeek(Number(event.target.value))}
                  disabled={!canSeekActiveMedia}
                  className="h-1 flex-1 cursor-pointer accent-[#b34722] disabled:cursor-default"
                />
                <span className="w-12 text-right text-[11px] font-semibold tracking-[0.16em] text-[#8b7669]">
                  {formatClock(duration || activeItem?.durationSeconds || 0)}
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => stepSelection(-1)} className={iconButtonClassName} aria-label="Previous media">
                    <svg viewBox="0 0 24 24" fill="none" className={headerIconClassName} aria-hidden="true">
                      <path d="M8 7v10M16 8l-5 4 5 4V8Z" fill="currentColor" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={togglePlayback}
                    className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#b34722] text-white shadow-[0_16px_36px_rgba(179,71,34,0.34)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a33818]/30"
                    aria-label={isPlaying ? "Pause playback" : activeItem?.kind === "video" && videoPlayback?.kind === "embed" ? "Open original video" : "Start playback"}
                  >
                    {isPlaying ? (
                      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
                        <path d="M9 7.5h2.5v9H9v-9Zm4.5 0H16v9h-2.5v-9Z" fill="currentColor" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 translate-x-[1px]" aria-hidden="true">
                        <path d="m9 7 8 5-8 5V7Z" fill="currentColor" />
                      </svg>
                    )}
                  </button>
                  <button type="button" onClick={() => stepSelection(1)} className={iconButtonClassName} aria-label="Next media">
                    <svg viewBox="0 0 24 24" fill="none" className={headerIconClassName} aria-hidden="true">
                      <path d="M16 7v10M8 8l5 4-5 4V8Z" fill="currentColor" />
                    </svg>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 rounded-full border border-[#eadfd3] bg-white/72 px-3 py-2 shadow-[0_10px_24px_rgba(28,28,25,0.04)]">
                    <svg viewBox="0 0 24 24" fill="none" className={headerIconClassName} aria-hidden="true">
                      <path d="M5 9v6h3l4 4V5L8 9H5Z" fill="currentColor" />
                      {volume > 0.01 ? <path d="M16 9.5a4 4 0 0 1 0 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /> : null}
                      {volume > 0.45 ? <path d="M18.5 7a7.2 7.2 0 0 1 0 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /> : null}
                    </svg>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      onChange={(event) => handleVolumeChange(Number(event.target.value))}
                      className="h-1 w-24 cursor-pointer accent-[#1c1c19]"
                      aria-label="Adjust volume"
                    />
                  </div>

                  <a
                    href={activeItem?.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full border border-[#eadfd3] bg-white/72 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#5b5048] shadow-[0_10px_24px_rgba(28,28,25,0.04)] transition hover:-translate-y-0.5 hover:text-[#a33818]"
                  >
                    Open Original
                  </a>

                  <button type="button" onClick={handleFullscreen} className={iconButtonClassName} aria-label="Enter fullscreen">
                    <svg viewBox="0 0 24 24" fill="none" className={headerIconClassName} aria-hidden="true">
                      <path d="M8 4.5H4.5V8M16 4.5h3.5V8M8 19.5H4.5V16M16 19.5h3.5V16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {activeItem ? (
            <article className="rounded-[28px] border border-[#eadfd3] bg-white/78 p-6 shadow-[0_24px_50px_rgba(52,38,25,0.08)] backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a98b71]">{getActiveSectionLabel(activeItem)}</p>
              <h1 className="mt-3 font-[Newsreader] text-4xl italic leading-tight text-[#322720] sm:text-5xl">{activeItem.title}</h1>

              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-[#efe3d6] pb-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#847162]">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#b34722]" />
                  Captured {formatCapturedDate(activeItem.createdAt)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#617462]" />
                  {activeItem.source === "upload" ? "Local upload" : "Linked source"}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#aa8d49]" />
                  {formatLibraryDuration(duration || activeItem.durationSeconds)}
                </span>
              </div>

              <div className="space-y-4 pt-6 text-[15px] leading-8 text-[#5f5148]">
                <p>{describeMediaItem(activeItem)}</p>
                <p>
                  This player reads directly from the wall’s shared media notes, so new audio and video added on the wall are reflected here without maintaining a second media library.
                </p>
              </div>

              {activeItem.tags.length > 0 ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  {activeItem.tags.map((tag) => (
                    <span
                      key={`${activeItem.id}:${tag}`}
                      className="rounded-full border border-[#ebdfd2] bg-[#faf5ef] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7d6658]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ) : null}
        </div>

        <aside className="rounded-[28px] border border-[#eadfd3] bg-[linear-gradient(180deg,rgba(255,252,247,0.92),rgba(251,245,238,0.94))] p-4 shadow-[0_24px_50px_rgba(52,38,25,0.08)] backdrop-blur lg:sticky lg:top-6 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto">
          <div className="px-2 pb-6 pt-2">
            <h2 className="font-[Newsreader] text-3xl text-[#322720]">Studio Library</h2>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a98b71]">Wall media fragments</p>
          </div>

          {!isLoaded ? (
            <div className="px-2 py-12 text-sm text-[#7d6658]">Loading wall media…</div>
          ) : items.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-[#e8dbcd] bg-white/52 px-5 py-8 text-sm leading-7 text-[#7d6658]">
              Add audio or video notes on the wall and they will appear here automatically.
            </div>
          ) : (
            <div className="space-y-8">
              <section className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#efe3d6] px-2 pb-2">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#847162]">Video fragments</h3>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b34722]">{videoItems.length}</span>
                </div>

                {videoItems.length === 0 ? (
                  <p className="px-2 text-sm text-[#8c786a]">No video notes on the wall yet.</p>
                ) : (
                  videoItems.map((item) => {
                    const active = item.id === activeItem?.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveId(item.id);
                          setPlayIntent(true);
                        }}
                        className={`flex w-full items-center gap-4 rounded-[22px] border p-3 text-left transition ${
                          active
                            ? "border-[#efcdbd] bg-[#fff4ec] shadow-[0_12px_26px_rgba(179,71,34,0.1)]"
                            : "border-transparent bg-transparent hover:border-[#efe3d6] hover:bg-white/72"
                        }`}
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[14px] bg-[linear-gradient(135deg,#2c3c34,#111312)]">
                          {item.posterUrl ? (
                            <Image src={item.posterUrl} alt="" fill unoptimized className="object-cover" />
                          ) : null}
                          <div className={`absolute inset-0 flex items-center justify-center ${item.posterUrl ? "bg-black/24" : "bg-[linear-gradient(145deg,#46372d,#161616)]"}`}>
                            <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-white" aria-hidden="true">
                              <path d="m9 7 8 5-8 5V7Z" fill="currentColor" />
                            </svg>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className={`truncate font-[Newsreader] text-2xl italic leading-tight ${active ? "text-[#b34722]" : "text-[#3d3028]"}`}>
                            {item.title}
                          </p>
                          <p className={`mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${active ? "text-[#b34722]/76" : "text-[#8c786a]"}`}>
                            {active ? "Active" : item.subtitle} • {formatLibraryDuration(item.durationSeconds)}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#efe3d6] px-2 pb-2">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#847162]">Audio fragments</h3>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#617462]">{audioItems.length}</span>
                </div>

                {audioItems.length === 0 ? (
                  <p className="px-2 text-sm text-[#8c786a]">No audio notes on the wall yet.</p>
                ) : (
                  audioItems.map((item) => {
                    const active = item.id === activeItem?.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveId(item.id);
                          setPlayIntent(true);
                        }}
                        className={`flex w-full items-center gap-4 rounded-[22px] border p-3 text-left transition ${
                          active
                            ? "border-[#d5dfd6] bg-[#eff7f0] shadow-[0_12px_26px_rgba(77,99,86,0.12)]"
                            : "border-transparent bg-transparent hover:border-[#efe3d6] hover:bg-white/72"
                        }`}
                      >
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#edf5ee,#d5e1d6)] text-[#4d6356]">
                          <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" aria-hidden="true">
                            <path d="M8 9.5v5m4-7v9m4-5v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className={`truncate font-[Newsreader] text-2xl italic leading-tight ${active ? "text-[#4d6356]" : "text-[#3d3028]"}`}>
                            {item.title}
                          </p>
                          <p className={`mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${active ? "text-[#4d6356]/76" : "text-[#8c786a]"}`}>
                            {active ? "Active" : item.subtitle} • {formatLibraryDuration(item.durationSeconds)}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </section>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
};
