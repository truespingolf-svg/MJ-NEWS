import React, { useState } from 'react';
import { NewspaperProject } from '../../types/newspaper.ts';
import { TicketProject } from '../../types/ticket.ts';
import { AuthorisationDocument } from '../../types/authorisation.ts';
import {
  FolderOpen,
  Search,
  Filter,
  Newspaper,
  Ticket,
  ShieldCheck,
  Calendar,
  ExternalLink,
  Copy,
  Trash2,
  Plus,
} from 'lucide-react';

interface DocumentLibraryProps {
  newspapers: NewspaperProject[];
  tickets: TicketProject[];
  authorisationDocs: AuthorisationDocument[];
  onOpenNewspaper: (id: string) => void;
  onOpenTicket: (id: string) => void;
  onOpenAuthorisationDoc: (id: string) => void;
  onDuplicateNewspaper: (id: string) => void;
  onDuplicateTicket: (id: string) => void;
  onDuplicateAuthorisationDoc: (id: string) => void;
  onDeleteNewspaper: (id: string) => void;
  onDeleteTicket: (id: string) => void;
  onDeleteAuthorisationDoc: (id: string) => void;
  onNavigateToTab: (tab: 'newspaper' | 'tickets' | 'authorisation') => void;
}

type CategoryFilter = 'all' | 'newspaper' | 'ticket' | 'authorisation';

export const DocumentLibrary: React.FC<DocumentLibraryProps> = ({
  newspapers,
  tickets,
  authorisationDocs,
  onOpenNewspaper,
  onOpenTicket,
  onOpenAuthorisationDoc,
  onDuplicateNewspaper,
  onDuplicateTicket,
  onDuplicateAuthorisationDoc,
  onDeleteNewspaper,
  onDeleteTicket,
  onDeleteAuthorisationDoc,
  onNavigateToTab,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  // Unified document item wrapper
  interface LibraryItem {
    id: string;
    category: 'newspaper' | 'ticket' | 'authorisation';
    title: string;
    subtitle: string;
    date: string;
    meta: string;
    itemRef: any;
  }

  const allItems: LibraryItem[] = [
    ...newspapers.map((n) => ({
      id: n.id,
      category: 'newspaper' as const,
      title: n.title,
      subtitle: 'Multi-column Broadsheet Newspaper',
      date: n.updatedAt || n.createdAt,
      meta: `${n.pages?.length || 1} Pages • Broadsheet Masthead`,
      itemRef: n,
    })),
    ...tickets.map((t) => ({
      id: t.id,
      category: 'ticket' as const,
      title: t.title,
      subtitle: `${t.eventTitle} (${t.ticketCategory})`,
      date: t.updatedAt || t.createdAt,
      meta: `Guest: ${t.guestName} • Pass #${t.ticketNumber}`,
      itemRef: t,
    })),
    ...authorisationDocs.map((a) => ({
      id: a.id,
      category: 'authorisation' as const,
      title: a.title,
      subtitle: `Recipient: ${a.recipientName} (${a.recipientTitle})`,
      date: a.updatedAt || a.createdAt,
      meta: `Ref: ${a.referenceNumber} • ${a.department}`,
      itemRef: a,
    })),
  ];

  // Filtering
  const filteredItems = allItems.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.meta.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sorting
  filteredItems.sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    const timeA = new Date(a.date).getTime() || 0;
    const timeB = new Date(b.date).getTime() || 0;
    return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
  });

  const getCategoryBadge = (cat: 'newspaper' | 'ticket' | 'authorisation') => {
    switch (cat) {
      case 'newspaper':
        return (
          <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Newspaper className="w-3 h-3" />
            Broadsheet
          </span>
        );
      case 'ticket':
        return (
          <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
            <Ticket className="w-3 h-3" />
            Ticket Pass
          </span>
        );
      case 'authorisation':
        return (
          <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Personnel
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090c] text-neutral-100 overflow-y-auto p-8 font-sans">
      <div className="max-w-6xl w-full mx-auto space-y-6">
        {/* Top Header & Metrics */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#22222a] pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-400">
              <FolderOpen className="w-4 h-4" />
              <span>Central Registry</span>
            </div>
            <h1 className="font-serif font-black text-2xl text-white tracking-tight mt-1">
              Document Library
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              Unified archive of all newspapers, tickets, invitations, and formal personnel instruments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#14141a] border border-[#2a2a36] rounded-xl px-4 py-2 text-xs">
              <span className="text-neutral-400">Total Records:</span>
              <span className="font-mono font-bold text-amber-400">{allItems.length}</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#111116] border border-[#22222a] p-3 rounded-xl">
          {/* Category Tabs (Functional Buttons, No Pills) */}
          <div className="flex items-center gap-1 bg-[#171720] p-1 rounded-lg text-xs">
            {[
              { id: 'all', label: 'All Documents' },
              { id: 'newspaper', label: 'Broadsheets' },
              { id: 'ticket', label: 'Tickets & Passes' },
              { id: 'authorisation', label: 'Authorisations' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id as CategoryFilter)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  selectedCategory === tab.id
                    ? 'bg-amber-400 text-black font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Sort */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents, guests, ref..."
                className="w-full bg-[#171720] border border-[#2e2e3e] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#171720] border border-[#2e2e3e] rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-amber-400"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Documents Grid */}
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center bg-[#111116] border border-[#22222a] rounded-xl text-neutral-400">
            <FolderOpen className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-neutral-200">No documents found</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Try adjusting your search criteria or create a new document in one of the studios.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={`${item.category}-${item.id}`}
                className="bg-[#121217] border border-[#242430] hover:border-amber-500/40 rounded-xl p-5 flex flex-col justify-between transition-all group shadow-sm hover:shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    {getCategoryBadge(item.category)}
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-sm text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 line-clamp-1">
                    {item.subtitle}
                  </p>
                  <p className="text-[11px] text-neutral-500 font-mono mt-2 truncate">
                    {item.meta}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#1e1e28] flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (item.category === 'newspaper') onOpenNewspaper(item.id);
                      else if (item.category === 'ticket') onOpenTicket(item.id);
                      else onOpenAuthorisationDoc(item.id);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#1a1a24] hover:bg-amber-400 hover:text-black text-amber-400 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Editor</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (item.category === 'newspaper') onDuplicateNewspaper(item.id);
                        else if (item.category === 'ticket') onDuplicateTicket(item.id);
                        else onDuplicateAuthorisationDoc(item.id);
                      }}
                      className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (item.category === 'newspaper') onDeleteNewspaper(item.id);
                        else if (item.category === 'ticket') onDeleteTicket(item.id);
                        else onDeleteAuthorisationDoc(item.id);
                      }}
                      className="p-1.5 text-neutral-400 hover:text-red-400 rounded hover:bg-neutral-800"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
