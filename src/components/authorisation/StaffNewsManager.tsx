import React, { useState, useEffect } from 'react';
import {
  Newspaper,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Eye,
  Calendar,
  Clock,
  Sparkles,
  Search,
  ExternalLink,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import {
  NewsArticle,
  subscribeNewsArticles,
  addNewsArticleFirestore,
  updateNewsArticleFirestore,
  deleteNewsArticleFirestore,
} from '../../services/firestoreStorage.ts';

const CATEGORIES: NewsArticle['category'][] = [
  'MJJ RECORDS News',
  'Music',
  'Events',
  'Community',
  'Releases',
  'Exclusive Announcements',
  'Behind the Scenes',
];

export const StaffNewsManager: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [headline, setHeadline] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullArticle, setFullArticle] = useState('');
  const [category, setCategory] = useState<NewsArticle['category']>(CATEGORIES[0]);
  const [author, setAuthor] = useState('MJJ Records Editorial');
  const [readingTimeMinutes, setReadingTimeMinutes] = useState<number>(3);
  const [mainImage, setMainImage] = useState('');
  const [imageFileName, setImageFileName] = useState('');
  const [tagsInput, setTagsInput] = useState('Michael Jackson, Thriller, Music');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | null; text: string }>({
    type: null,
    text: '',
  });

  useEffect(() => {
    const unsub = subscribeNewsArticles((list) => {
      setArticles(list);
    });
    return () => unsub();
  }, []);

  const handleOpenNew = () => {
    setSelectedArticle(null);
    setHeadline('');
    setShortDescription('');
    setFullArticle('');
    setCategory(CATEGORIES[0]);
    setAuthor('MJJ Records Editorial');
    setReadingTimeMinutes(3);
    setMainImage('/src/assets/images/hero_mj_cinematic_stage_1794407118726.jpg');
    setTagsInput('Thriller, Michael Jackson, Press');
    setIsFeatured(false);
    setIsEditing(true);
    setStatusMsg({ type: null, text: '' });
  };

  const handleEdit = (article: NewsArticle) => {
    setSelectedArticle(article);
    setHeadline(article.headline);
    setShortDescription(article.shortDescription);
    setFullArticle(article.fullArticle);
    setCategory(article.category);
    setAuthor(article.author || 'MJJ Records Editorial');
    setReadingTimeMinutes(article.readingTimeMinutes || 3);
    setMainImage(article.mainImage || '');
    setTagsInput((article.tags || []).join(', '));
    setIsFeatured(!!article.featured);
    setIsEditing(true);
    setStatusMsg({ type: null, text: '' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim() || !fullArticle.trim()) {
      setStatusMsg({ type: 'error', text: 'Please fill in both the headline and the story body.' });
      return;
    }

    setIsSaving(true);
    setStatusMsg({ type: null, text: '' });

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (selectedArticle) {
        await updateNewsArticleFirestore(selectedArticle.id, {
          headline: headline.trim(),
          shortDescription: shortDescription.trim() || headline.trim(),
          fullArticle: fullArticle.trim(),
          category,
          author: author.trim() || 'MJJ Records Editorial',
          readingTimeMinutes: Number(readingTimeMinutes) || 3,
          mainImage: mainImage.trim(),
          tags,
          featured: isFeatured,
        });
        setStatusMsg({ type: 'success', text: 'Article updated successfully!' });
      } else {
        await addNewsArticleFirestore({
          headline: headline.trim(),
          shortDescription: shortDescription.trim() || headline.trim(),
          fullArticle: fullArticle.trim(),
          category,
          author: author.trim() || 'MJJ Records Editorial',
          readingTimeMinutes: Number(readingTimeMinutes) || 3,
          mainImage: mainImage.trim() || '/src/assets/images/hero_mj_cinematic_stage_1794407118726.jpg',
          tags,
          publishedDate: new Date().toISOString(),
          featured: isFeatured,
          published: true,
        });
        setStatusMsg({ type: 'success', text: 'New article published to the News Hub!' });
      }
      setIsEditing(false);
    } catch (err: any) {
      console.error('Failed to save article:', err);
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to save news article.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSaving(true);
    try {
      const ok = await deleteNewsArticleFirestore(id);
      if (ok) {
        setStatusMsg({ type: 'success', text: 'Article deleted from News Hub.' });
      } else {
        setStatusMsg({ type: 'error', text: 'Failed to delete article.' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Error deleting article.' });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredArticles = articles.filter(
    (a) =>
      a.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-neutral-100 font-sans p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-950/80 text-red-400 border border-red-500/40 flex items-center justify-center shadow-inner">
              <Newspaper className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h2 className="text-xl font-serif font-black text-white uppercase tracking-wider">
              Official News &amp; Editorial Management
            </h2>
          </div>
          <p className="text-xs text-neutral-400">
            Publish official announcements, press releases, music news, and behind-the-scenes features to the public News Hub.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-950/50 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Write New Article</span>
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

      {isEditing ? (
        <div className="bg-[#12121a] border border-[#232332] rounded-2xl p-6 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <h3 className="text-base font-serif font-bold text-white">
              {selectedArticle ? 'Edit Article' : 'Draft New Article'}
            </h3>
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">
                  Article Headline <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. MJJ Records Unveils Master Tape Remastering Series"
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs focus:outline-none focus:border-red-500 font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">
                  Category <span className="text-neutral-500 font-sans">(Pick or type any custom category)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Rare Vaults, World Tour, Hologram..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-amber-300 text-xs focus:outline-none focus:border-red-500 font-sans"
                    required
                  />
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) setCategory(e.target.value);
                    }}
                    className="px-2 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-neutral-300"
                    title="Choose from presets"
                  >
                    <option value="">Presets...</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-300 mb-1">
                Short Description / Excerpt
              </label>
              <textarea
                rows={2}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="A brief 1-2 sentence hook for the news card..."
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs focus:outline-none focus:border-red-500 font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-300 mb-1">
                Full Article Story <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={8}
                value={fullArticle}
                onChange={(e) => setFullArticle(e.target.value)}
                placeholder="Write the complete article body here..."
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs focus:outline-none focus:border-red-500 font-sans leading-relaxed"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">Author / Byline</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs focus:outline-none focus:border-red-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">Reading Time (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={readingTimeMinutes}
                  onChange={(e) => setReadingTimeMinutes(parseInt(e.target.value, 10))}
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs focus:outline-none focus:border-red-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs focus:outline-none focus:border-red-500 font-sans"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-mono text-neutral-300">
                Article Cover Image <span className="text-amber-400 font-sans">(Upload local image file from device)</span>
              </label>

              <div className="p-4 rounded-xl bg-neutral-950 border border-dashed border-neutral-700 hover:border-red-500/60 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {mainImage ? (
                      <div className="w-14 h-14 rounded-lg overflow-hidden border border-neutral-700 shrink-0 bg-black">
                        <img src={mainImage} alt="Cover Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 text-neutral-500">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                    <div className="space-y-0.5 text-left">
                      <p className="text-xs font-bold text-white">
                        {imageFileName ? imageFileName : mainImage.startsWith('data:') ? 'Local Device Image Loaded' : 'Select Local Cover Image'}
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        Select any local image (JPG, PNG, WEBP, GIF) directly from your computer/device.
                      </p>
                    </div>
                  </div>

                  <label className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>Upload Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setImageFileName(file.name);
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) {
                              setMainImage(ev.target.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="pt-2 border-t border-neutral-900 flex items-center gap-2">
                  <span className="text-[10px] font-mono text-neutral-500 shrink-0">Image Data:</span>
                  <input
                    type="text"
                    value={mainImage}
                    onChange={(e) => setMainImage(e.target.value)}
                    placeholder="Local image data or image URL..."
                    className="flex-1 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-300 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 accent-red-600 rounded"
                  />
                  <span className="text-xs text-neutral-200 font-medium">
                    Feature on News Hero / Home Page Spotlight
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-neutral-300 text-xs font-medium hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isSaving ? 'Publishing...' : 'Save & Publish Live'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles by headline or category..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500"
              />
            </div>
            <span className="text-xs font-mono text-neutral-400">
              Total Articles: {articles.length}
            </span>
          </div>

          <div className="bg-[#12121a] border border-[#232332] rounded-2xl overflow-hidden shadow-xl">
            {filteredArticles.length > 0 ? (
              <div className="divide-y divide-neutral-800/80">
                {filteredArticles.map((art) => (
                  <div
                    key={art.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-900/50 transition-colors"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                        <span className="px-2 py-0.5 rounded bg-red-950/60 border border-red-500/30 text-red-300 font-bold uppercase">
                          {art.category}
                        </span>
                        {art.featured && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                            FEATURED HERO
                          </span>
                        )}
                        <span className="text-neutral-500">
                          {new Date(art.publishedDate).toLocaleDateString()}
                        </span>
                        <span className="text-neutral-500">· {art.readingTimeMinutes || 3} min</span>
                      </div>

                      <h4 className="text-sm sm:text-base font-serif font-bold text-white hover:text-red-400 transition-colors">
                        {art.headline}
                      </h4>
                      <p className="text-xs text-neutral-400 line-clamp-1 max-w-2xl">
                        {art.shortDescription}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => handleEdit(art)}
                        className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(art.id)}
                        className="p-1.5 rounded-lg bg-neutral-900 hover:bg-red-950/60 text-neutral-400 hover:text-red-400 border border-neutral-800 transition-colors"
                        title="Delete Article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-neutral-500 font-mono">
                No articles found. Click "Write New Article" to draft your first news story.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
