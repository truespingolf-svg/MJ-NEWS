import React, { useState, useEffect } from 'react';
import {
  Music,
  Video,
  Plus,
  Trash2,
  Play,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Disc,
  Clock,
  Radio,
  Volume2,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import {
  StreamingTrack,
  subscribeStreamingContent,
  addStreamingTrackFirestore,
  deleteStreamingTrackFirestore,
  SiteAudioSettings,
  subscribeSiteAudioSettings,
  setSiteAudioSettingsFirestore,
  addStaffAuditLogFirestore,
} from '../../services/firestoreStorage.ts';

const DEFAULT_ERAS: StreamingTrack['era'][] = [
  'Thriller',
  'Bad',
  'Off The Wall',
  'Dangerous',
  'HIStory',
  'Invincible',
  'Live Archive',
];

export const StaffStreamingManager: React.FC = () => {
  const [tracks, setTracks] = useState<StreamingTrack[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalog' | 'premiere' | 'entrySong'>('catalog');

  // Track Form state
  const [title, setTitle] = useState('');
  const [album, setAlbum] = useState('Thriller (1982)');
  const [era, setEra] = useState<StreamingTrack['era']>(DEFAULT_ERAS[0]);
  const [durationSeconds, setDurationSeconds] = useState<number>(357);
  const [releaseYear, setReleaseYear] = useState<number>(1982);
  const [coverImage, setCoverImage] = useState('');
  const [coverFileName, setCoverFileName] = useState('');
  const [mediaType, setMediaType] = useState<'audio' | 'video'>('audio');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaFileName, setMediaFileName] = useState('');
  const [description, setDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPremiere, setIsPremiere] = useState(false);
  const [premiereDateString, setPremiereDateString] = useState('');

  // Site Entry Song state
  const [siteAudioSettings, setSiteAudioSettings] = useState<SiteAudioSettings>({
    entrySongUrl: '/assets/aistudio/THRILLER_AUDIO_IDEA_533b2f46.mp3',
    entrySongTitle: 'Thriller (Official Studio Master)',
    autoplayEnabled: true,
  });
  const [entrySongUrl, setEntrySongUrl] = useState('');
  const [entrySongFileName, setEntrySongFileName] = useState('');
  const [entrySongTitle, setEntrySongTitle] = useState('');
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | null; text: string }>({
    type: null,
    text: '',
  });

  useEffect(() => {
    const unsubTracks = subscribeStreamingContent((list) => {
      setTracks(list);
    });

    const unsubAudio = subscribeSiteAudioSettings((settings) => {
      setSiteAudioSettings(settings);
      setEntrySongUrl(settings.entrySongUrl || '/assets/aistudio/THRILLER_AUDIO_IDEA_533b2f46.mp3');
      setEntrySongTitle(settings.entrySongTitle || 'Thriller (Official Studio Master)');
      setAutoplayEnabled(settings.autoplayEnabled !== false);
    });

    return () => {
      unsubTracks();
      unsubAudio();
    };
  }, []);

  const handleSaveTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter a track or performance title.' });
      return;
    }

    setIsSaving(true);
    setStatusMsg({ type: null, text: '' });

    try {
      const premiereTs = isPremiere && premiereDateString ? new Date(premiereDateString).getTime() : undefined;

      await addStreamingTrackFirestore({
        title: title.trim(),
        album: album.trim() || 'Thriller',
        era,
        durationSeconds: Number(durationSeconds) || 240,
        releaseYear: Number(releaseYear) || 1982,
        coverImage: coverImage.trim() || '/src/assets/images/streaming_thriller_vinyl_1794407118068.jpg',
        mediaType,
        mediaUrl: mediaUrl.trim() || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        description: description.trim() || 'Official master audio archive recording from MJJ Records.',
        featured: isFeatured,
        playCount: 0,
        isPremiere,
        premiereTimestamp: premiereTs,
      });

      await addStaffAuditLogFirestore({
        staffName: 'Staff Executive',
        staffRole: 'ADMINISTRATOR',
        actionType: 'PUBLISH_NEWS',
        targetEntityId: title.trim(),
        targetEntityLabel: title.trim(),
        details: `Published ${mediaType} "${title}" (Premiere: ${isPremiere ? 'YES' : 'NO'})`,
      });

      setStatusMsg({
        type: 'success',
        text: `"${title}" has been saved and published live to the Streaming Platform!`,
      });
      setTitle('');
      setMediaUrl('');
      setIsAdding(false);
      setIsPremiere(false);
    } catch (err: any) {
      console.error('Failed to add track:', err);
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to save streaming item.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSiteEntrySong = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg({ type: null, text: '' });

    try {
      await setSiteAudioSettingsFirestore({
        entrySongUrl: entrySongUrl.trim() || '/assets/aistudio/THRILLER_AUDIO_IDEA_533b2f46.mp3',
        entrySongTitle: entrySongTitle.trim() || 'Thriller (Official Studio Master)',
        autoplayEnabled,
      });

      await addStaffAuditLogFirestore({
        staffName: 'Staff Executive',
        staffRole: 'ADMINISTRATOR',
        actionType: 'UPDATE_COUNTDOWN',
        targetEntityId: 'siteAudioSettings',
        targetEntityLabel: entrySongTitle,
        details: `Updated site entrance theme to "${entrySongTitle}"`,
      });

      setStatusMsg({
        type: 'success',
        text: 'Site Entrance Background Audio settings saved and applied!',
      });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to update audio settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, trackTitle: string) => {
    setIsSaving(true);
    try {
      const ok = await deleteStreamingTrackFirestore(id);
      if (ok) {
        setStatusMsg({ type: 'success', text: `"${trackTitle}" deleted from catalog.` });
      } else {
        setStatusMsg({ type: 'error', text: 'Failed to delete track.' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Error deleting track.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAll = async () => {
    setIsSaving(true);
    try {
      for (const t of tracks) {
        await deleteStreamingTrackFirestore(t.id);
      }
      setStatusMsg({ type: 'success', text: 'All tracks and videos cleared from streaming vault.' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Error clearing tracks.' });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6 text-neutral-100 font-sans p-4 sm:p-8">
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-inner">
              <Disc className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h2 className="text-xl font-serif font-black text-white uppercase tracking-wider">
              Streaming Audio, Video &amp; Premiere Studio
            </h2>
          </div>
          <p className="text-xs text-neutral-400">
            Add master tracks, live concert videos, schedule synchronized video premieres, or choose the site entrance theme song.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              setIsAdding(true);
              setIsPremiere(false);
              setTitle('');
              setStatusMsg({ type: null, text: '' });
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Track / Video</span>
          </button>

          <button
            onClick={() => {
              setIsAdding(true);
              setIsPremiere(true);
              setMediaType('video');
              setTitle('');
              const d = new Date(Date.now() + 86400000);
              const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
              setPremiereDateString(iso);
              setStatusMsg({ type: null, text: '' });
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Radio className="w-4 h-4" />
            <span>Schedule Premiere</span>
          </button>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
            activeTab === 'catalog'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          🎵 Catalog Items ({tracks.length})
        </button>
        <button
          onClick={() => setActiveTab('entrySong')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
            activeTab === 'entrySong'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          🔊 Site Entrance Background Song
        </button>
      </div>

      {statusMsg.text && (
        <div
          className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* TAB 1: ADD OR EDIT TRACK / PREMIERE */}
      {isAdding && (
        <div className="bg-[#12121a] border border-[#232332] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
              {isPremiere ? <Radio className="w-4 h-4 text-red-500 animate-pulse" /> : <Music className="w-4 h-4 text-amber-400" />}
              <span>{isPremiere ? 'Schedule Live Video Premiere' : 'Add New Media Item'}</span>
            </h3>
            <button
              onClick={() => setIsAdding(false)}
              className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSaveTrack} className="space-y-4">
            {isPremiere && (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 space-y-2">
                <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Scheduled Premiere Countdown Date &amp; Time</span>
                </span>
                <input
                  type="datetime-local"
                  value={premiereDateString}
                  onChange={(e) => setPremiereDateString(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-red-500/60 text-amber-300 text-xs font-mono focus:outline-none"
                  required
                />
                <p className="text-[11px] text-neutral-400">
                  When the countdown timer expires, the video automatically unlocks with a "🔴 BROADCASTING LIVE NOW" state for all connected visitors.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">
                  Title <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isPremiere ? "e.g. Smooth Criminal (Moonwalker Premiere 4K)" : "e.g. Billie Jean (Live at Wembley '88)"}
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">Era / Category</label>
                <select
                  value={era}
                  onChange={(e) => setEra(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-amber-300 text-xs focus:outline-none focus:border-amber-400 font-sans"
                >
                  {DEFAULT_ERAS.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">Album / Release</label>
                <input
                  type="text"
                  value={album}
                  onChange={(e) => setAlbum(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">Duration (Seconds)</label>
                <input
                  type="number"
                  min="1"
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(parseInt(e.target.value, 10))}
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">Media Format</label>
                <select
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-amber-300 text-xs focus:outline-none focus:border-amber-400 font-sans"
                >
                  <option value="audio">🎵 Studio Master Audio (MP3 / Audio)</option>
                  <option value="video">🎥 Concert Video Stream (MP4 / Web Video)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cover Art Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-mono text-neutral-300">
                  Cover Artwork <span className="text-amber-400 font-sans">(Upload local image file)</span>
                </label>
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-dashed border-neutral-700 hover:border-amber-400 transition-colors space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {coverImage ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-neutral-700 shrink-0 bg-black">
                          <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 text-neutral-500">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {coverFileName ? coverFileName : coverImage.startsWith('data:') ? 'Local Image Loaded' : 'Local Cover Image'}
                        </p>
                        <p className="text-[10px] text-neutral-400 truncate">
                          Select JPG, PNG, WEBP artwork
                        </p>
                      </div>
                    </div>

                    <label className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shrink-0 border border-neutral-700">
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>Choose Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setCoverFileName(file.name);
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) {
                                setCoverImage(ev.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>

                  <input
                    type="text"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="Local image data or image URL..."
                    className="w-full px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-300 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Direct Media Upload (MP3 / MP4) */}
              <div className="space-y-2">
                <label className="block text-xs font-mono text-neutral-300">
                  {mediaType === 'video' ? 'Concert Video File (MP4/WebM)' : 'Master Audio File (MP3/WAV/M4A)'} <span className="text-amber-400 font-sans">(Upload local file)</span>
                </label>
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-dashed border-amber-500/40 hover:border-amber-400 transition-colors space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
                        {mediaType === 'video' ? <Video className="w-5 h-5" /> : <Music className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {mediaFileName ? mediaFileName : mediaUrl.startsWith('data:') ? 'Local Media Loaded' : 'Local Track / Video'}
                        </p>
                        <p className="text-[10px] text-neutral-400 truncate">
                          Select local MP3, MP4, WAV file
                        </p>
                      </div>
                    </div>

                    <label className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shrink-0 shadow-md">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload File</span>
                      <input
                        type="file"
                        accept={mediaType === 'video' ? 'video/*,audio/*' : 'audio/*,video/*'}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setMediaFileName(file.name);
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) {
                                setMediaUrl(ev.target.result as string);
                                if (!title.trim()) {
                                  const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
                                  setTitle(cleanTitle);
                                }
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>

                  <input
                    type="text"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="Local media data or file stream URL..."
                    className="w-full px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-300 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-300 mb-1">Description / Notes</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notes about this recording or broadcast..."
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-neutral-300 text-xs font-medium hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-xs flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Publishing...' : 'Save & Publish Live'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: SITE ENTRANCE BACKGROUND AUDIO SETTINGS */}
      {activeTab === 'entrySong' && (
        <div className="bg-[#12121a] border border-[#232332] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="space-y-1">
            <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-amber-400" />
              <span>Configure Site Entrance Theme Song</span>
            </h3>
            <p className="text-xs text-neutral-400">
              Pick an MP3, MP4 or audio file to play as atmospheric background music when visitors enter the site.
            </p>
          </div>

          <form onSubmit={handleSaveSiteEntrySong} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-mono text-neutral-300">
                Site Entrance Background Song <span className="text-amber-400 font-sans">(Upload local MP3, MP4, WAV, M4A from device)</span>
              </label>

              <div className="p-4 rounded-xl bg-neutral-950 border border-dashed border-amber-500/40 hover:border-amber-400 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
                      <Volume2 className="w-6 h-6" />
                    </div>
                    <div className="space-y-0.5 text-left">
                      <p className="text-xs font-bold text-white">
                        {entrySongFileName ? entrySongFileName : entrySongUrl.startsWith('data:') ? 'Local Entrance Audio Loaded' : 'Local Site Theme Audio'}
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        Select any local MP3, WAV, M4A, or MP4 file directly from your computer.
                      </p>
                    </div>
                  </div>

                  <label className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>Upload Audio File</span>
                    <input
                      type="file"
                      accept="audio/*,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setEntrySongFileName(file.name);
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) {
                              setEntrySongUrl(ev.target.result as string);
                              if (!entrySongTitle || entrySongTitle === 'Thriller (Official Studio Master)') {
                                const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
                                setEntrySongTitle(cleanTitle);
                              }
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                <input
                  type="text"
                  value={entrySongUrl}
                  onChange={(e) => setEntrySongUrl(e.target.value)}
                  placeholder="Local audio data or MP3 URL..."
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-300 mb-1">
                Display Title
              </label>
              <input
                type="text"
                value={entrySongTitle}
                onChange={(e) => setEntrySongTitle(e.target.value)}
                placeholder="e.g. Thriller (Official Studio Master)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div className="pt-2">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoplayEnabled}
                  onChange={(e) => setAutoplayEnabled(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span className="text-xs text-neutral-200 font-medium">
                  Attempt browser background playback upon user arrival (with mute control)
                </span>
              </label>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Apply Site Entrance Audio'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: STREAMING CATALOG ITEMS LIST */}
      {activeTab === 'catalog' && !isAdding && (
        <div className="bg-[#12121a] border border-[#232332] rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-neutral-800 flex flex-wrap justify-between items-center gap-2 text-xs font-mono text-neutral-400">
            <span>Total Catalog Items: {tracks.length}</span>
            {tracks.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="text-xs text-rose-400 hover:text-rose-300 underline font-sans"
              >
                Clear all songs and videos
              </button>
            )}
          </div>

          <div className="divide-y divide-neutral-800/80">
            {tracks.length > 0 ? (
              tracks.map((t) => (
                <div
                  key={t.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-900/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden relative flex items-center justify-center shrink-0">
                      {t.coverImage ? (
                        <img src={t.coverImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Music className="w-5 h-5 text-amber-400" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{t.title}</h4>
                        {t.isPremiere && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-red-600/20 text-red-400 border border-red-500/40 font-bold flex items-center gap-1">
                            <Radio className="w-2.5 h-2.5 animate-pulse" />
                            <span>PREMIERE</span>
                          </span>
                        )}
                        {t.featured && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300">
                            FEATURED
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-400">
                        <span className="text-amber-400/90">{t.album}</span> · {t.era} · {formatDuration(t.durationSeconds || 240)}
                      </div>
                      {t.isPremiere && t.premiereTimestamp && (
                        <div className="text-[11px] font-mono text-red-400">
                          Premiere Date: {new Date(t.premiereTimestamp).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-[10px] font-mono uppercase text-neutral-400 px-2 py-1 rounded bg-neutral-900 border border-neutral-800">
                      {t.mediaType}
                    </span>
                    <button
                      onClick={() => handleDelete(t.id, t.title)}
                      className="p-1.5 rounded-lg bg-neutral-900 hover:bg-red-950/60 text-neutral-400 hover:text-red-400 border border-neutral-800 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-xs text-neutral-500 font-mono space-y-2">
                <Disc className="w-8 h-8 mx-auto text-neutral-600" />
                <p>No tracks or videos currently in the streaming catalog.</p>
                <button
                  onClick={() => setIsAdding(true)}
                  className="text-amber-400 underline font-bold"
                >
                  Click here to add your first track or premiere video
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
