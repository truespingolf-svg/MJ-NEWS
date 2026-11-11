import React from 'react';
import { ShieldCheck, Lock, Award, Sparkles, Mail, MessageSquare, Star, ArrowRight } from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  position: string;
  role: 'OWNER' | 'ADMINISTRATOR' | 'EDITOR' | 'CHALLENGE MANAGER' | 'STAFF';
  bio: string;
  discordHandle?: string;
  avatarUrl: string;
  department: string;
}

const OFFICIAL_STAFF: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Executive Management',
    position: 'Chief Executive & Label Director',
    role: 'OWNER',
    bio: 'Oversees the global multimedia legacy, multi-track archival preservation, world concert streaming rights, and executive operations for MJJ Records.',
    discordHandle: 'mjj_executive',
    avatarUrl: '/src/assets/images/hero_mj_cinematic_stage_1794407118726.jpg',
    department: 'Executive Board',
  },
  {
    id: 'staff-2',
    name: 'Marcus Vance',
    position: 'Archival Director & Master Audio Engineer',
    role: 'ADMINISTRATOR',
    bio: 'Curates 2-inch multi-track master tapes, Westlake Audio console restorations, 4K film transfers, and studio disc remasters from the golden Thriller and Bad eras.',
    discordHandle: 'vance_archival',
    avatarUrl: '/src/assets/images/streaming_thriller_vinyl_1794407118068.jpg',
    department: 'Sound & Restoration',
  },
  {
    id: 'staff-3',
    name: 'Elena Rostova',
    position: 'Creative Director & Visual Design Lead',
    role: 'EDITOR',
    bio: 'Directs theatrical stage lighting design, promotional poster art, collector vinyl packaging, and global digital aesthetic presentation.',
    discordHandle: 'elena_mjj_creative',
    avatarUrl: '/src/assets/images/event_countdown_backdrop_1794407119370.jpg',
    department: 'Creative & Visuals',
  },
  {
    id: 'staff-4',
    name: 'Jordan Chase',
    position: 'Community Challenge Manager & Curator',
    role: 'CHALLENGE MANAGER',
    bio: 'Coordinates community competitions, photo challenges, trophy leaderboards, Discord points rewards, and voter moderation across all events.',
    discordHandle: 'jordan_contests',
    avatarUrl: '/src/assets/images/streaming_bad_tour_live_1794407119769.jpg',
    department: 'Community Operations',
  },
  {
    id: 'staff-5',
    name: 'Devon Reed',
    position: 'Head of Media Broadcasting & Streaming Vault',
    role: 'STAFF',
    bio: 'Manages the 24-bit audiophile streaming vault, concert film broadcasts, live ticker announcements, and international server distribution.',
    discordHandle: 'devon_broadcast',
    avatarUrl: '/src/assets/images/hero_mj_cinematic_stage_1794407118726.jpg',
    department: 'Media & Streaming',
  },
];

interface PublicStaffRosterSectionProps {
  onOpenStaffPortal: () => void;
}

export const PublicStaffRosterSection: React.FC<PublicStaffRosterSectionProps> = ({
  onOpenStaffPortal,
}) => {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-red-950/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-red-500 uppercase tracking-widest mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
            <span>EXECUTIVE ROSTER &amp; PRODUCTION TEAM</span>
          </div>
          <h1 className="font-serif font-black tracking-tight text-3xl sm:text-5xl text-white uppercase">
            Staff &amp; Leadership
          </h1>
          <p className="text-sm text-neutral-400 max-w-xl mt-2 leading-relaxed">
            The dedicated archival team, sound engineers, creative directors, and community coordinators stewarding the King of Pop's timeless kingdom.
          </p>
        </div>

        {/* Staff Portal Access Button */}
        <div>
          <button
            onClick={onOpenStaffPortal}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-950/60 transition-all cursor-pointer transform hover:scale-105 active:scale-95 font-sans"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Staff Administration Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {OFFICIAL_STAFF.map((member) => (
          <div
            key={member.id}
            className="bg-[#12070a] border border-red-950/60 hover:border-red-600/60 rounded-3xl p-6 shadow-xl space-y-5 transition-all duration-300 group flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Photo & Role */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-red-600/40 shadow-lg relative shrink-0 bg-neutral-900">
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="min-w-0">
                  {/* Clean unboxed metadata (anti-slop) */}
                  <span className="text-[10px] font-mono uppercase tracking-wider text-red-400 block truncate font-bold">
                    {member.department} · {member.role}
                  </span>
                  <h3 className="font-serif font-black text-lg text-white group-hover:text-red-300 transition-colors truncate">
                    {member.name}
                  </h3>
                  <span className="text-xs text-neutral-300 font-medium block truncate">
                    {member.position}
                  </span>
                </div>
              </div>

              {/* Bio */}
              <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                {member.bio}
              </p>
            </div>

            {/* Footer & Discord */}
            <div className="pt-3 border-t border-red-950/60 flex items-center justify-between text-xs font-mono text-neutral-400">
              {member.discordHandle ? (
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <MessageSquare className="w-3.5 h-3.5 text-red-400" />
                  <span>@{member.discordHandle}</span>
                </span>
              ) : (
                <span className="text-neutral-500">Official MJJ Staff</span>
              )}
              <span className="text-[10px] uppercase text-red-500 font-bold tracking-wider">
                VERIFIED
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Staff Application / Promotion Callout */}
      <div className="bg-gradient-to-r from-red-950/40 via-[#100609] to-red-950/40 border border-red-900/40 rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <h3 className="font-serif font-black text-xl text-white">
            Join the MJJ Records Marketing &amp; Media Crew
          </h3>
          <p className="text-xs text-neutral-300 max-w-xl">
            Passionate about Michael Jackson's creative legacy, archival journalism, and community curation? Submit an application to participate in our verified media teams.
          </p>
        </div>

        <button
          onClick={onOpenStaffPortal}
          className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-red-950/80 rounded-xl text-xs font-bold font-mono uppercase tracking-wider shrink-0 transition-colors"
        >
          Staff &amp; Governance Center
        </button>
      </div>
    </div>
  );
};
