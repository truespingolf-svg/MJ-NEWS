import React, { useState } from 'react';
import { NewspaperProject, PageLayoutId } from '../../types/newspaper.ts';
import { createFrontCoverPage, createInteriorPage } from '../../utils/newspaperLogic.ts';
import { saveProjectFirestore } from '../../services/firestoreStorage.ts';
import {
  Sparkles,
  Bot,
  Send,
  Loader2,
  BookOpen,
  CheckCircle2,
  Globe,
  ExternalLink,
  Flame,
  Search,
  History,
  FileText,
  X,
  Plus,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sources?: Array<{ uri: string; title: string }>;
  projectData?: any;
  createdAt: string;
}

interface StaffAiNewspaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: NewspaperProject) => void;
}

const PRESET_TOPICS = [
  {
    title: 'Motown 25: Moonwalk Debut',
    prompt: 'Create a 2-page historical broadsheet covering the March 25, 1983 Motown 25 Billie Jean performance and first moonwalk debut. Include quotes from attendees and historical reception.',
  },
  {
    title: '1984 Grammy Awards Sweep',
    prompt: 'Create a front page headline newspaper on the February 1984 Grammy Awards where Michael Jackson won a record-breaking 8 Grammys in a single evening. Include album sales figures.',
  },
  {
    title: '1985 USA for Africa Charity',
    prompt: 'Research and create a broadsheet edition on the January 1985 recording of We Are the World at A&M Studios, fundraising impact, and Quincy Jones sign on the studio door.',
  },
  {
    title: '1987-1989 Bad World Tour',
    prompt: 'Generate an authentic broadsheet newspaper covering the record-breaking Bad World Tour, Wembley Stadium sold-out records, and live performance reviews.',
  },
];

export const StaffAiNewspaperModal: React.FC<StaffAiNewspaperModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "👋 Welcome to the **MJJ Records AI Newspaper Copilot**! I have real-time Google Search grounding enabled to research historical facts, concert dates, Grammy statistics, album sales, and verified quotes. Tell me what kind of broadsheet newspaper you would like me to research and create!",
      createdAt: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBuildingProject, setIsBuildingProject] = useState(false);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputText).trim();
    if (!prompt || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: prompt,
      createdAt: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await fetch('/api/staff/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          history,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: data.reply || data.fullText || 'I have researched your request.',
        sources: data.sources || [],
        projectData: data.projectData || null,
        createdAt: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('AI Copilot request error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: `⚠️ Error researching topic: ${err?.message || 'Failed to connect to AI server'}. Please try again.`,
          createdAt: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert AI generated projectData to full NewspaperProject and save to Firestore
  const handleConvertAndSave = async (aiData: any) => {
    if (!aiData) return;
    setIsBuildingProject(true);

    try {
      const projectId = `project-${Date.now()}`;
      const now = new Date().toISOString();

      // Build pages
      const rawPages = Array.isArray(aiData.pages) && aiData.pages.length > 0 ? aiData.pages : [{}];
      const builtPages = rawPages.map((pageData: any, idx: number) => {
        const pageNum = idx + 1;
        const layoutId: PageLayoutId = pageData.layoutId || (pageNum === 1 ? 'front-cover' : 'layout-top-hero');

        const basePage = pageNum === 1 && layoutId === 'front-cover'
          ? createFrontCoverPage(1)
          : createInteriorPage(layoutId, pageNum);

        // Customize header
        basePage.pageHeader = {
          editionName: aiData.editionName || 'THE MJJ DAILY PRESS',
          dateText: aiData.dateText || 'HISTORIC PRESS ARCHIVE',
          issueNumber: aiData.issueNumber || `ISSUE #${pageNum}`,
          priceText: aiData.priceText || 'PRICE 25 CENTS',
          sectionTitle: pageData.sectionTitle || basePage.pageHeader.sectionTitle || 'SPECIAL DISPATCH',
        };

        // Customize text elements if provided
        const texts = { ...basePage.texts };
        if (texts.masthead && aiData.editionName) {
          texts.masthead.content = aiData.editionName.toUpperCase();
        }
        if (texts.headline && pageData.leadHeadline) {
          texts.headline.content = pageData.leadHeadline;
        }
        if (texts.kicker && pageData.leadKicker) {
          texts.kicker.content = pageData.leadKicker;
        }
        if (texts.subhead && pageData.leadSubhead) {
          texts.subhead.content = pageData.leadSubhead;
        }
        if (texts.lead && pageData.leadBody) {
          texts.lead.content = pageData.leadBody.slice(0, 300);
        }
        if (texts.body && pageData.leadBody) {
          texts.body.content = pageData.leadBody;
        }
        if (texts.byline && pageData.leadByline) {
          texts.byline.content = pageData.leadByline;
        }

        // Secondary & tertiary articles
        if (texts['sec-headline'] && pageData.secondaryHeadline) {
          texts['sec-headline'].content = pageData.secondaryHeadline;
        }
        if (texts['sec-body'] && pageData.secondaryBody) {
          texts['sec-body'].content = pageData.secondaryBody;
        }
        if (texts['col3-headline'] && pageData.tertiaryHeadline) {
          texts['col3-headline'].content = pageData.tertiaryHeadline;
        }
        if (texts['col3-body'] && pageData.tertiaryBody) {
          texts['col3-body'].content = pageData.tertiaryBody;
        }
        if (texts.quote && pageData.quote) {
          texts.quote.content = `"${pageData.quote}"`;
        }

        // Customize photo captions
        if (pageData.image1Caption && basePage.images.image1) {
          basePage.images.image1.caption = pageData.image1Caption;
        }
        if (pageData.image2Caption && basePage.images.image2) {
          basePage.images.image2.caption = pageData.image2Caption;
        }
        if (pageData.image3Caption && basePage.images.image3) {
          basePage.images.image3.caption = pageData.image3Caption;
        }

        basePage.texts = texts;
        return basePage;
      });

      const newProject: NewspaperProject = {
        id: projectId,
        title: aiData.projectTitle || 'MJJ Records AI Research Broadsheet',
        subtitle: aiData.subtitle || 'Generated with Google Search Historical Grounding',
        createdAt: now,
        updatedAt: now,
        pages: builtPages,
      };

      // Save to real-time Firestore database
      await saveProjectFirestore(newProject);

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#EAB308', '#D97706', '#10B981', '#FFFFFF'],
      });

      onProjectCreated(newProject);
      onClose();
    } catch (e) {
      console.error('Failed to build newspaper project:', e);
    } finally {
      setIsBuildingProject(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 select-none font-sans animate-fade-in">
      <div className="bg-[#0e0e15] border border-amber-500/40 rounded-3xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl relative overflow-hidden text-neutral-100">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#222232] bg-gradient-to-r from-neutral-950 via-[#13131c] to-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-black flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Bot className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-black text-lg text-white">
                  MJJ Broadsheet AI Copilot
                </h3>
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Globe className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>Google Search Grounded</span>
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Researches historical archives and generates complete, publishable broadsheets.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Prompt Presets */}
        <div className="px-5 py-2.5 bg-[#14141f] border-b border-[#242436] flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3" />
            <span>Presets:</span>
          </span>
          {PRESET_TOPICS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(preset.prompt)}
              disabled={isLoading}
              className="text-xs shrink-0 px-3 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-amber-300 border border-neutral-700 hover:border-amber-500/40 transition-colors disabled:opacity-50"
            >
              {preset.title}
            </button>
          ))}
        </div>

        {/* Chat History Messages */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-neutral-950/80">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-2.5 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-medium shadow-lg shadow-amber-500/10'
                    : 'bg-[#151522] border border-[#2b2b3e] text-neutral-200 shadow-md'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] opacity-75 font-mono mb-1">
                  <span>{msg.role === 'user' ? 'Staff Member' : 'MJJ AI Copilot'}</span>
                  <span>{msg.createdAt}</span>
                </div>

                <div className="whitespace-pre-wrap font-sans text-sm">{msg.text}</div>

                {/* Grounding Web Sources Citations */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="pt-2 border-t border-[#2d2d42] space-y-1">
                    <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      <span>Verified Google Search Sources:</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.sources.slice(0, 4).map((src, i) => (
                        <a
                          key={i}
                          href={src.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-amber-300 text-[10px]"
                        >
                          <span className="truncate max-w-[150px]">{src.title}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Generated Broadsheet Project Action Card */}
                {msg.projectData && (
                  <div className="mt-3 p-3.5 bg-neutral-950 border border-amber-500/50 rounded-xl space-y-2 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40 font-bold">
                        NEWSPAPER PROJECT READY
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {msg.projectData.pages?.length || 1} Broadsheet Pages
                      </span>
                    </div>

                    <h4 className="font-serif font-black text-base text-white">
                      {msg.projectData.projectTitle}
                    </h4>
                    <p className="text-xs text-neutral-300">
                      {msg.projectData.subtitle}
                    </p>

                    <button
                      onClick={() => handleConvertAndSave(msg.projectData)}
                      disabled={isBuildingProject}
                      className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
                    >
                      {isBuildingProject ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-black" />
                          <span>Building Newspaper Project in Firestore...</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-4 h-4 stroke-[2.2]" />
                          <span>SAVE PROJECT &amp; OPEN IN NEWSPAPER STUDIO</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2.5 text-xs text-amber-300 font-mono bg-[#151522] border border-[#2b2b3e] p-3 rounded-2xl max-w-sm">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Researching historical archives via Google Search...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-[#222232] bg-[#111118]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. Create a 2-page edition covering the 1988 Wembley Stadium record concert..."
              disabled={isLoading}
              className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-sm flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 stroke-[2.5]" />
                  <span>Send</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
