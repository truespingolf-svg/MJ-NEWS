import React, { useState, useEffect } from 'react';
import {
  reactToNewspaper,
  subscribeNewspaperReactions,
  UserProfile,
} from '../../services/firestoreStorage.ts';
import { Sparkles, Heart, Flame, Crown, Award, Newspaper } from 'lucide-react';
import confetti from 'canvas-confetti';

interface NewspaperReactionBarProps {
  newspaperId: string;
  currentUser: UserProfile | null;
  onRequireAuth: () => void;
}

const REACTIONS = [
  { emoji: '🔥', label: 'Groundbreaking' },
  { emoji: '👑', label: 'King of Pop' },
  { emoji: '💎', label: 'Iconic' },
  { emoji: '📰', label: 'Historic' },
  { emoji: '👏', label: 'Standing Ovation' },
];

export const NewspaperReactionBar: React.FC<NewspaperReactionBarProps> = ({
  newspaperId,
  currentUser,
  onRequireAuth,
}) => {
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [activeFeedback, setActiveFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!newspaperId) return;
    const unsub = subscribeNewspaperReactions(newspaperId, (counts) => {
      setReactionCounts(counts);
    });
    return () => unsub();
  }, [newspaperId]);

  const handleReact = async (emoji: string) => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await reactToNewspaper(currentUser.uid, newspaperId, emoji);
      if (res.success) {
        if (res.pointsAwarded > 0) {
          confetti({
            particleCount: 110,
            spread: 75,
            origin: { y: 0.6 },
            colors: ['#EAB308', '#D97706', '#10B981', '#FFFFFF'],
          });
        }
        setActiveFeedback(res.message);
        setTimeout(() => setActiveFeedback(null), 3500);
      }
    } catch (e) {
      console.error('Reaction error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasReactedAlready = (currentUser?.reactedNewspaperIds || []).includes(newspaperId);

  return (
    <div className="space-y-2 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111118]/90 border border-amber-500/30 rounded-2xl p-3 sm:p-4 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-vinyl-reverse" />
            <span>React &amp; Earn +1,000 Points:</span>
          </span>
          {hasReactedAlready && (
            <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              +1,000 PTS CLAIMED ✓
            </span>
          )}
        </div>

        {/* Reaction Buttons */}
        <div className="flex items-center gap-2">
          {REACTIONS.map(({ emoji, label }) => {
            const count = reactionCounts[emoji] || 0;
            return (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                disabled={isSubmitting}
                className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-mono border border-neutral-700 hover:border-amber-400 transition-all flex items-center gap-1.5 transform active:scale-95 shadow-sm"
                title={`${label} - Click to react`}
              >
                <span className="text-base">{emoji}</span>
                <span className="font-bold text-neutral-300">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeFeedback && (
        <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs rounded-xl font-medium animate-fade-in flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{activeFeedback}</span>
        </div>
      )}
    </div>
  );
};
