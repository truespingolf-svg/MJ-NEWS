import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Disc3,
  Film,
  Music,
  Sparkles,
  ListMusic,
  Share2,
  Flame,
  Radio,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { StreamingTrack, subscribeStreamingContent, DEFAULT_STREAMING_TRACKS } from '../../services/firestoreStorage';
import { getLocalMedia } from '../../services/localMediaRegistry';

export const StreamingPlatformSection: React.FC = () => {
  const [tracks, setTracks] = useState<StreamingTrack[]>(DEFAULT_STREAMING_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(294);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'audio' | 'video' | 'premiere'>('all');

  const [resolvedMediaUrl, setResolvedMediaUrl] = useState<string>('');
  const [resolvedCoverUrl, setResolvedCoverUrl] = useState<string>('');

  // Video Premiere Countdown State
  const [premiereTimeLeft, setPremiereTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isLiveNow: boolean;
  } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsub = subscribeStreamingContent((list) => {
      if (list && list.length > 0) {
        setTracks(list);
      }
    });
    return () => unsub();
  }, []);

  const activeTrack: StreamingTrack | undefined = tracks[currentTrackIndex] || tracks[0];

  useEffect(() => {
    if (activeTrack) {
      if (activeTrack.mediaUrl) {
        getLocalMedia(activeTrack.mediaUrl).then((url) => setResolvedMediaUrl(url || activeTrack.mediaUrl));
      } else {
        setResolvedMediaUrl('');
      }

      if (activeTrack.coverImage) {
        getLocalMedia(activeTrack.coverImage).then((url) => setResolvedCoverUrl(url || activeTrack.coverImage));
      } else {
        setResolvedCoverUrl('');
      }
    }
  }, [activeTrack?.id, activeTrack?.mediaUrl, activeTrack?.coverImage]);

  // Scheduled Premiere Detection
  const scheduledPremiere = tracks.find((t) => t.isPremiere && t.premiereTimestamp);

  // Premiere Live Countdown Hook
  useEffect(() => {
    if (!scheduledPremiere || !scheduledPremiere.premiereTimestamp) {
      setPremiereTimeLeft(null);
      return;
    }

    const target = scheduledPremiere.premiereTimestamp;
    const updateCountdown = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setPremiereTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isLiveNow: true });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setPremiereTimeLeft({ days, hours, minutes, seconds, isLiveNow: false });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [scheduledPremiere]);

  // Audio Playback Events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || activeTrack?.durationSeconds || 240);
    const handleEnded = () => handleNextTrack();

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [activeTrack]);

  // Sync Audio & Video Playback when track changes or resolved URL updates
  useEffect(() => {
    if (isPlaying) {
      window.dispatchEvent(new CustomEvent('mjj_stop_bg_audio'));
      if (activeTrack?.mediaType === 'audio' && audioRef.current) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else if (activeTrack?.mediaType === 'video' && videoRef.current) {
        videoRef.current.play().catch(() => setIsPlaying(false));
      }
    } else {
      if (audioRef.current) audioRef.current.pause();
      if (videoRef.current) videoRef.current.pause();
    }
  }, [isPlaying, activeTrack?.id, resolvedMediaUrl]);

  // Listen for global stop event from site entrance music
  useEffect(() => {
    const handleStopVault = () => {
      if (audioRef.current) audioRef.current.pause();
      if (videoRef.current) videoRef.current.pause();
      setIsPlaying(false);
    };
    window.addEventListener('mjj_stop_vault_audio', handleStopVault);
    return () => window.removeEventListener('mjj_stop_vault_audio', handleStopVault);
  }, []);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNextTrack = () => {
    if (tracks.length === 0) return;
    const nextIdx = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(nextIdx);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handlePrevTrack = () => {
    if (tracks.length === 0) return;
    const prevIdx = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    setCurrentTrackIndex(prevIdx);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (activeTrack?.mediaType === 'audio' && audioRef.current) {
      audioRef.current.currentTime = newTime;
    } else if (activeTrack?.mediaType === 'video' && videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val;
    if (videoRef.current) videoRef.current.volume = val;
    setIsMuted(val === 0);
  };

  const formatTime = (sec: number) => {
    if (isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const filteredTracks = tracks.filter((t) => {
    if (mediaFilter === 'audio') return t.mediaType === 'audio';
    if (mediaFilter === 'video') return t.mediaType === 'video';
    if (mediaFilter === 'premiere') return t.isPremiere;
    return true;
  });

  if (!activeTrack) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs font-mono text-neutral-500">
        No tracks in the streaming vault. Staff can add audio recordings and live video streams in the Authorisation Centre.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 select-none text-neutral-100 font-sans">
      {/* Hidden Audio Element */}
      {activeTrack.mediaType === 'audio' && (
        <audio ref={audioRef} src={resolvedMediaUrl || activeTrack.mediaUrl} preload="auto" />
      )}

      {/* SCHEDULED VIDEO PREMIERE COUNTDOWN STAGE (IF SCHEDULED) */}
      {scheduledPremiere && premiereTimeLeft && (
        <section className="relative rounded-3xl overflow-hidden border-2 border-red-600/70 shadow-[0_0_80px_rgba(220,38,38,0.35)] bg-gradient-to-b from-[#18060a] via-[#0e0305] to-[#080103] p-6 sm:p-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Premiere Teaser Info & Live Countdown */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/50 text-red-300 text-xs font-mono font-bold uppercase tracking-widest">
                <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                <span>
                  {premiereTimeLeft.isLiveNow ? '🔴 BROADCASTING LIVE NOW' : 'WORLDWIDE SCHEDULED VIDEO PREMIERE'}
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-serif font-black text-white tracking-tight">
                {scheduledPremiere.title}
              </h2>

              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-xl">
                {scheduledPremiere.description || 'Exclusive broadcast premiere streaming in ultra high-definition directly from the MJJ Records archives.'}
              </p>

              {/* Countdown Clocks */}
              {!premiereTimeLeft.isLiveNow ? (
                <div className="pt-2">
                  <div className="grid grid-cols-4 gap-3 max-w-md font-mono text-center">
                    <div className="p-3 rounded-2xl bg-black/80 border border-red-950 shadow-inner">
                      <span className="text-2xl sm:text-3xl font-black text-amber-400 block">
                        {String(premiereTimeLeft.days).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Days</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-black/80 border border-red-950 shadow-inner">
                      <span className="text-2xl sm:text-3xl font-black text-amber-400 block">
                        {String(premiereTimeLeft.hours).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Hours</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-black/80 border border-red-950 shadow-inner">
                      <span className="text-2xl sm:text-3xl font-black text-amber-400 block">
                        {String(premiereTimeLeft.minutes).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Mins</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-black/80 border border-red-950 shadow-inner">
                      <span className="text-2xl sm:text-3xl font-black text-red-500 block animate-pulse">
                        {String(premiereTimeLeft.seconds).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Secs</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      const idx = tracks.findIndex((t) => t.id === scheduledPremiere.id);
                      if (idx !== -1) {
                        setCurrentTrackIndex(idx);
                        setIsPlaying(true);
                      }
                    }}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Watch Live Broadcast Premiere Now</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right: Premiere Teaser Backdrop / Screen Preview */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full aspect-video rounded-2xl overflow-hidden border border-red-950/80 shadow-2xl relative group bg-black">
                <img
                  src={scheduledPremiere.coverImage || '/src/assets/images/streaming_bad_tour_live_1794407119769.jpg'}
                  alt={scheduledPremiere.title}
                  className="w-full h-full object-cover brightness-[0.7]"
                />
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-2xl animate-pulse">
                    <Radio className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-mono font-bold text-red-300 uppercase tracking-widest mt-2">
                    {premiereTimeLeft.isLiveNow ? 'LIVE BROADCAST READY' : 'COUNTDOWN IN PROGRESS'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Section Header & Media Type Filter Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-red-950 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Disc3 className="w-5 h-5 text-red-500 animate-spin-slow" />
            <h2 className="text-2xl font-serif font-black text-white uppercase tracking-wider">
              Streaming Audio &amp; Concert Video Vault
            </h2>
          </div>
          <p className="text-xs text-neutral-400">
            Official 24-bit studio masters, live world tour concerts, and historical rehearsals.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
          <button
            onClick={() => setMediaFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              mediaFilter === 'all'
                ? 'bg-red-600/30 text-red-300 border border-red-500/50'
                : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
            }`}
          >
            All Vault ({tracks.length})
          </button>
          <button
            onClick={() => setMediaFilter('audio')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              mediaFilter === 'audio'
                ? 'bg-red-600/30 text-red-300 border border-red-500/50'
                : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
            }`}
          >
            🎵 Songs ({tracks.filter((t) => t.mediaType === 'audio').length})
          </button>
          <button
            onClick={() => setMediaFilter('video')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              mediaFilter === 'video'
                ? 'bg-red-600/30 text-red-300 border border-red-500/50'
                : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
            }`}
          >
            🎥 Videos ({tracks.filter((t) => t.mediaType === 'video').length})
          </button>
        </div>
      </div>

      {/* MAIN MEDIA PLAYER STATION */}
      <div
        ref={playerContainerRef}
        className="bg-gradient-to-br from-[#16070a] via-[#0d0406] to-[#1a080d] border border-red-900/50 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Side: Video Player OR Spinning Vinyl Disc (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            {activeTrack.mediaType === 'video' ? (
              /* High-Def Video Player */
              <div className="w-full aspect-video rounded-2xl overflow-hidden border border-red-950/80 shadow-2xl bg-black relative">
                <video
                  ref={videoRef}
                  src={resolvedMediaUrl || activeTrack.mediaUrl}
                  poster={resolvedCoverUrl || activeTrack.coverImage}
                  controls
                  className="w-full h-full object-contain"
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                />
              </div>
            ) : (
              /* Spinning Turntable Disc */
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
                <div
                  className={`absolute -inset-4 rounded-full bg-gradient-to-tr from-red-600/30 to-amber-500/20 blur-2xl transition-all duration-700 ${
                    isPlaying ? 'opacity-100 scale-105' : 'opacity-20 scale-95'
                  }`}
                />
                <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl border-4 border-[#280c11] bg-black">
                  <img
                    src={resolvedCoverUrl || activeTrack.coverImage || '/src/assets/images/streaming_thriller_vinyl_1794407118068.jpg'}
                    alt={activeTrack.title}
                    className={`w-full h-full object-cover ${isPlaying ? 'animate-spin-vinyl' : ''}`}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 rounded-full bg-black/90 border-2 border-red-500/60 flex items-center justify-center text-red-400 shadow-xl">
                      <Disc3 className={`w-8 h-8 ${isPlaying ? 'animate-spin-slow text-red-400' : 'text-neutral-500'}`} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Track Metadata & Audio Controls (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                <span className="text-red-400 font-bold uppercase">{activeTrack.era} ERA</span>
                <span>·</span>
                <span>{activeTrack.album}</span>
                <span>·</span>
                <span>{activeTrack.releaseYear}</span>
                {activeTrack.isPremiere && (
                  <span className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[9px]">
                    PREMIERE
                  </span>
                )}
              </div>

              <h2 className="font-serif font-black text-2xl sm:text-4xl text-white tracking-tight">
                {activeTrack.title}
              </h2>

              <p className="text-xs sm:text-sm text-neutral-300 font-sans leading-relaxed line-clamp-2">
                {activeTrack.description}
              </p>
            </div>

            {/* Seek Bar & Timers */}
            <div className="space-y-1.5">
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                className="w-full accent-red-600 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
              />
              <div className="flex justify-between items-center text-[11px] font-mono text-neutral-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Transport Control Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrevTrack}
                  className="p-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 transition-colors cursor-pointer"
                  title="Previous Track"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white flex items-center justify-center shadow-xl shadow-red-950/60 transition-transform active:scale-95 cursor-pointer"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-white" />
                  ) : (
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  )}
                </button>

                <button
                  onClick={handleNextTrack}
                  className="p-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 transition-colors cursor-pointer"
                  title="Next Track"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const nextMute = !isMuted;
                    setIsMuted(nextMute);
                    if (audioRef.current) audioRef.current.muted = nextMute;
                    if (videoRef.current) videoRef.current.muted = nextMute;
                  }}
                  className="text-neutral-400 hover:text-white"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 accent-red-600 cursor-pointer h-1 bg-neutral-800 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Playlist Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-red-950 pb-3">
          <h3 className="text-base font-serif font-black text-white uppercase tracking-wider flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-red-500" />
            <span>Vault Tracklist ({filteredTracks.length})</span>
          </h3>
          <span className="text-xs font-mono text-neutral-400">Click to listen</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTracks.map((track, idx) => {
            const isCurrent = track.id === activeTrack.id;

            return (
              <div
                key={track.id}
                onClick={() => {
                  const globalIdx = tracks.findIndex((t) => t.id === track.id);
                  if (globalIdx !== -1) {
                    setCurrentTrackIndex(globalIdx);
                    setCurrentTime(0);
                    setIsPlaying(true);
                  }
                }}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 group cursor-pointer ${
                  isCurrent
                    ? 'bg-red-950/40 border-red-500/60 shadow-[0_0_25px_rgba(239,68,68,0.2)]'
                    : 'bg-[#11090d] border-red-950/70 hover:border-red-500/40 hover:bg-[#1a0e14]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-black border border-neutral-800 overflow-hidden relative flex items-center justify-center shrink-0">
                    {track.coverImage ? (
                      <img src={track.coverImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Music className="w-5 h-5 text-red-500" />
                    )}
                    {isCurrent && isPlaying && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5 max-w-[180px] sm:max-w-[210px]">
                    <h4 className="text-sm font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                      {track.title}
                    </h4>
                    <p className="text-xs text-neutral-400 truncate">
                      {track.album} · <span className="text-red-400/90">{track.era}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono text-neutral-400 block">
                    {formatTime(track.durationSeconds || 240)}
                  </span>
                  <span className="text-[9px] font-mono uppercase text-red-400 font-bold block mt-1">
                    {track.mediaType}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
