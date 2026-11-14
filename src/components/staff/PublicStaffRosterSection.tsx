import React from 'react';
import { ShieldCheck, Lock, MessageSquare, ArrowRight } from 'lucide-react';

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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-neutral-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-red-400 uppercase tracking-widest mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Executive Roster</span>
          </div>
          <h2 className="font-serif font-black tracking-tight text-2xl sm:text-4xl text-white uppercase">
            Staff &amp; Leadership
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mt-1.5 leading-relaxed">
            The archival engineers, creative directors, and community curators running MJJ Records.
          </p>
        </div>

        <button
          onClick={onOpenStaffPortal}
          className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer self-start md:self-auto"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Staff Studio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {OFFICIAL_STAFF.map((member) => (
          <div
            key={member.id}
            className="interactive-card bg-[#0d0d11] border border-neutral-800/90 hover:border-red-500/40 rounded-2xl p-5 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3.5">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-neutral-700 shrink-0 bg-neutral-900">
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="min-w-0">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-red-400 block truncate font-bold">
                    {member.department} · {member.role}
                  </span>
                  <h3 className="font-serif font-bold text-base text-white truncate">
                    {member.name}
                  </h3>
                  <span className="text-xs text-neutral-400 block truncate">
                    {member.position}
                  </span>
                </div>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                {member.bio}
              </p>
            </div>

            <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs font-mono text-neutral-400">
              {member.discordHandle ? (
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <MessageSquare className="w-3.5 h-3.5 text-red-400" />
                  <span>@{member.discordHandle}</span>
                </span>
              ) : (
                <span className="text-neutral-500">MJJ Staff</span>
              )}
              <span className="text-[10px] uppercase text-neutral-500 font-semibold tracking-wider">
                Verified
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
