import React, { useState, useEffect } from 'react';
import {
  Search,
  Calendar,
  User,
  Share2,
  Check,
  ArrowRight,
  Sparkles,
  BookOpen,
  Filter,
  X,
  Clock,
  Flame,
  Star,
} from 'lucide-react';
import { NewsArticle, subscribeNewsArticles } from '../../services/firestoreStorage';

const CATEGORIES = [
  'All Categories',
  'MJJ RECORDS News',
  'Music',
  'Events',
  'Community',
  'Releases',
  'Exclusive Announcements',
  'Behind the Scenes',
] as const;

export const NewsPlatformSection: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeNewsArticles((list) => {
      if (list && list.length > 0) {
        setArticles(list.filter((a) => a.published !== false));
      } else {
        setArticles([]);
      }
    });
    return () => unsub();
  }, []);

  const filteredArticles = articles.filter((a) => {
    const matchesCat = selectedCategory === 'All Categories' || a.category === selectedCategory;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      a.headline.toLowerCase().includes(term) ||
      a.shortDescription.toLowerCase().includes(term) ||
      (a.author && a.author.toLowerCase().includes(term)) ||
      (a.tags && a.tags.some((t) => t.toLowerCase().includes(term)));
    return matchesCat && matchesSearch;
  });

  const featuredArticle = filteredArticles.find((a) => a.featured) || filteredArticles[0];
  const gridArticles = filteredArticles.filter((a) => a.id !== featuredArticle?.id);

  const handleShare = (article: NewsArticle) => {
    navigator.clipboard.writeText(`${window.location.origin}/#news-${article.id}`);
    setCopiedId(article.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-12">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-red-950/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-red-500 uppercase tracking-widest mb-1.5">
            <Star className="w-3.5 h-3.5 fill-red-500 text-red-500" />
            <span>MJJ RECORDS OFFICIAL PRESS &amp; MEDIA DISPATCH</span>
          </div>
          <h1 className="font-serif font-black tracking-tight text-3xl sm:text-5xl text-white uppercase">
            News &amp; Bulletins
          </h1>
          <p className="text-sm text-neutral-400 max-w-xl mt-2 leading-relaxed">
            Exclusive announcements, archival revelations, release chronicles, and community dispatches direct from the label.
          </p>
        </div>

        {/* Search Input */}
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search news, topics, tags..."
            className="w-full bg-[#12070a] border border-red-950/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-red-500 transition-colors shadow-inner"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-2 text-xs">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-red-600 text-white font-bold shadow-md shadow-red-950/60'
                  : 'bg-[#150a0e] text-neutral-400 hover:text-white border border-red-950/50 hover:border-red-900/60'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredArticles.length === 0 ? (
        <div className="p-14 sm:p-16 bg-[#100609] border border-dashed border-red-950/60 rounded-3xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-950/40 border border-red-900/50 flex items-center justify-center mx-auto text-red-400">
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-serif font-bold text-lg sm:text-xl text-white">
              {articles.length === 0 ? 'No News Bulletins Published Yet' : 'No Articles Found'}
            </h3>
            <p className="text-xs text-neutral-400 font-mono max-w-md mx-auto leading-relaxed">
              {articles.length === 0
                ? 'Official press bulletins, archival announcements, and release notes will appear here once published by the MJJ Records News Desk.'
                : 'Try adjusting your search query or selecting "All Categories".'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Featured Hero Story */}
          {featuredArticle && (
            <div
              onClick={() => setActiveArticle(featuredArticle)}
              className="bg-[#12070a] border border-red-900/40 hover:border-red-600/70 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 group cursor-pointer grid grid-cols-1 lg:grid-cols-12 gap-0"
            >
              <div className="lg:col-span-7 relative h-72 sm:h-96 lg:h-auto overflow-hidden">
                <img
                  src={featuredArticle.mainImage}
                  alt={featuredArticle.headline}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#12070a] via-transparent to-transparent lg:hidden" />
              </div>

              <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  {/* Clean unboxed metadata (Anti-slop discipline) */}
                  <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
                    <span className="text-red-400 font-bold uppercase">{featuredArticle.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{new Date(featuredArticle.publishedDate).toLocaleDateString()}</span>
                    <span aria-hidden="true">·</span>
                    <span>{featuredArticle.readingTimeMinutes || 4} min read</span>
                  </div>

                  <h2 className="font-serif font-black text-2xl sm:text-3xl text-white group-hover:text-red-300 transition-colors leading-tight">
                    {featuredArticle.headline}
                  </h2>

                  <p className="text-sm text-neutral-300 font-sans leading-relaxed line-clamp-3">
                    {featuredArticle.shortDescription}
                  </p>
                </div>

                <div className="pt-4 border-t border-red-950/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-red-950 border border-red-600/40 text-red-300 font-bold text-xs flex items-center justify-center">
                      {(featuredArticle.author || 'M')[0]}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">{featuredArticle.author}</span>
                      <span className="text-[10px] text-neutral-500 font-mono block">
                        {featuredArticle.authorRole || 'Editorial Staff'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-400 group-hover:translate-x-1 transition-transform">
                    <span>Read Article</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grid of Remaining Articles */}
          {gridArticles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => setActiveArticle(article)}
                  className="bg-[#100609] border border-red-950/60 hover:border-red-600/60 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col group cursor-pointer"
                >
                  <div className="relative h-48 overflow-hidden bg-neutral-950">
                    <img
                      src={article.mainImage}
                      alt={article.headline}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#100609] via-transparent to-transparent opacity-80" />
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
                        <span className="text-red-400 font-bold uppercase">{article.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{new Date(article.publishedDate).toLocaleDateString()}</span>
                      </div>

                      <h3 className="font-serif font-bold text-base text-white group-hover:text-red-300 transition-colors leading-snug line-clamp-2">
                        {article.headline}
                      </h3>

                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                        {article.shortDescription}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-red-950/50 flex items-center justify-between text-xs">
                      <span className="text-neutral-500 text-[11px] font-mono">{article.author}</span>
                      <span className="text-red-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>Read</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Full Article Reader Modal */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="bg-[#0f0609] border border-red-900/60 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden text-neutral-100">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-red-950/80 bg-neutral-950/80 flex items-center justify-between gap-4 sticky top-0 z-10">
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                <span className="text-red-400 font-bold uppercase">{activeArticle.category}</span>
                <span aria-hidden="true">·</span>
                <span>{new Date(activeArticle.publishedDate).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShare(activeArticle)}
                  className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 flex items-center gap-1 text-xs cursor-pointer transition-colors"
                  title="Share / Copy Link"
                >
                  {copiedId === activeArticle.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-mono text-[11px]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="text-[11px] font-mono">Share</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setActiveArticle(null)}
                  className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-10 overflow-y-auto space-y-6">
              <h1 className="font-serif font-black text-2xl sm:text-4xl text-white leading-tight">
                {activeArticle.headline}
              </h1>

              <div className="flex items-center gap-3 py-2 border-y border-red-950/60 text-xs font-mono text-neutral-400">
                <span>By {activeArticle.author}</span>
                <span aria-hidden="true">·</span>
                <span>{activeArticle.authorRole || 'MJJ Records Staff'}</span>
                <span aria-hidden="true">·</span>
                <span>{activeArticle.readingTimeMinutes || 4} min read</span>
              </div>

              {/* Main Banner Image */}
              <div className="rounded-2xl overflow-hidden border border-red-950/60 max-h-96">
                <img
                  src={activeArticle.mainImage}
                  alt={activeArticle.headline}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Lead Paragraph */}
              <p className="text-base sm:text-lg font-serif italic text-red-200/90 leading-relaxed border-l-2 border-red-600 pl-4 py-1">
                "{activeArticle.shortDescription}"
              </p>

              {/* Full Article Content */}
              <div className="prose prose-invert max-w-none text-neutral-200 text-sm sm:text-base leading-relaxed space-y-4 font-sans whitespace-pre-line">
                {activeArticle.fullArticle}
              </div>

              {/* Tags */}
              {activeArticle.tags && activeArticle.tags.length > 0 && (
                <div className="pt-4 border-t border-red-950/60 flex flex-wrap gap-2 text-xs font-mono text-neutral-400">
                  <span className="text-neutral-500">TAGS:</span>
                  {activeArticle.tags.map((t) => (
                    <span key={t} className="text-red-300">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-neutral-950 border-t border-red-950 flex justify-end">
              <button
                onClick={() => setActiveArticle(null)}
                className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl uppercase tracking-wider transition-colors"
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
