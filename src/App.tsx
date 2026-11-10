import React, { useState, useEffect, useRef } from 'react';
import { NewspaperProject, PageLayoutId, TextElement, ImageElement } from './types/newspaper.ts';
import {
  createNewProject,
  createInteriorPage,
  duplicatePage,
  deletePage,
  reorderPages,
  changePageLayout,
  updateTextElement,
  updateImageElement,
  resetImageSlot,
} from './utils/newspaperLogic.ts';
import {
  loadAllProjects,
  saveProject,
  deleteProject,
  duplicateProject,
  exportProjectToJson,
} from './services/storage.ts';

import { Dashboard } from './components/dashboard/Dashboard.tsx';
import { Header } from './components/common/Header.tsx';
import { PageManagerSidebar } from './components/editor/PageManagerSidebar.tsx';
import { InspectorSidebar } from './components/editor/InspectorSidebar.tsx';
import { NewspaperPageRenderer } from './components/canvas/NewspaperPageRenderer.tsx';
import { LayoutPickerModal } from './components/editor/LayoutPickerModal.tsx';
import { PdfExportModal } from './components/export/PdfExportModal.tsx';
import { PublishNewspaperModal } from './components/editor/PublishNewspaperModal.tsx';
import { FlipbookReader } from './components/canvas/FlipbookReader.tsx';
import { downloadProjectPdf } from './services/pdfExport.ts';

// New Feature Expansion & MJJ Records Portal Modules
import { MjjRecordsPortal } from './components/portal/MjjRecordsPortal.tsx';
import { HomeScreenLockTakeover } from './components/home/HomeScreenLockTakeover.tsx';
import { NewsprintTextureOverlay } from './components/common/NewsprintTextureOverlay.tsx';
import { StaffPasscodeModal } from './components/common/StaffPasscodeModal.tsx';
import { TopNavigation, MainAppView } from './components/common/TopNavigation.tsx';
import { TicketStudio } from './components/ticket/TicketStudio.tsx';
import { AuthorisationCentre } from './components/authorisation/AuthorisationCentre.tsx';
import { DocumentLibrary } from './components/library/DocumentLibrary.tsx';
import { BrandingKitModal } from './components/branding/BrandingKitModal.tsx';
import { loadAllTickets, duplicateTicket, deleteTicket } from './services/ticketStorage.ts';
import {
  loadAllAuthorisationDocs,
  duplicateAuthorisationDoc,
  deleteAuthorisationDoc,
} from './services/authorisationStorage.ts';
import { loadOrganizationBranding } from './services/brandingStorage.ts';
import { OrganizationBranding } from './types/branding.ts';
import { StaffAiNewspaperModal } from './components/editor/StaffAiNewspaperModal.tsx';

type AppMode = 'public' | 'staff';

export default function App() {
  // App mode: public portal (default) vs staff studio
  const [appMode, setAppMode] = useState<AppMode>('public');
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState<boolean>(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState<boolean>(false);
  const [textureEnabled, setTextureEnabled] = useState<boolean>(true);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);

  // Top-level staff view
  const [mainView, setMainView] = useState<MainAppView>('newspaper');
  const [isAuthorisationUnlocked, setIsAuthorisationUnlocked] = useState<boolean>(false);
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState<boolean>(false);
  const [branding, setBranding] = useState<OrganizationBranding>(() => loadOrganizationBranding());

  // Existing Newspaper state
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  const [projects, setProjects] = useState<NewspaperProject[]>([]);
  const [currentProject, setCurrentProject] = useState<NewspaperProject | null>(null);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);

  // Cross-module documents state for Document Library
  const [ticketsList, setTicketsList] = useState(() => loadAllTickets());
  const [authorisationList, setAuthorisationList] = useState(() => loadAllAuthorisationDocs());

  // Canvas selection & zoom state
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedImageSlot, setSelectedImageSlot] = useState<'image1' | 'image2' | 'image3' | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(0.85);
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  // PDF Export state
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [exportProgressText, setExportProgressText] = useState<string>('');
  const offscreenPagesRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState<boolean>(false);
  const [layoutModalMode, setLayoutModalMode] = useState<'add' | 'change'>('add');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [activeFlipbookDoc, setActiveFlipbookDoc] = useState<NewspaperProject | null>(null);

  // Auto-save debounce state
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refresh lists helper
  const refreshLibraryData = () => {
    setProjects(loadAllProjects());
    setTicketsList(loadAllTickets());
    setAuthorisationList(loadAllAuthorisationDocs());
  };

  // Initial load
  useEffect(() => {
    const loaded = loadAllProjects();
    setProjects(loaded);
    if (loaded.length > 0) {
      setCurrentProject(loaded[0]);
    }

    // Fetch initial texture setting from server
    fetch('/api/public/data')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings && typeof data.settings.newsprintTexture === 'boolean') {
          setTextureEnabled(data.settings.newsprintTexture);
        }
      })
      .catch(() => {});
  }, []);

  // Toggle global newsprint texture setting & persist to backend
  const handleToggleTexture = async () => {
    const nextVal = !textureEnabled;
    setTextureEnabled(nextVal);
    try {
      await fetch('/api/staff/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsprintTexture: nextVal }),
      });
    } catch (err) {
      console.error('Failed to sync texture setting with server:', err);
    }
  };

  // Staff passcode trigger (always require passcode entry)
  const handleOpenStaffRequest = () => {
    setShowPasscodeModal(true);
  };

  // Debounced auto-save whenever currentProject changes
  useEffect(() => {
    if (!currentProject) return;

    setSaveStatus('saving');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveProject(currentProject);
      setProjects((prev) =>
        prev.map((p) => (p.id === currentProject.id ? currentProject : p))
      );
      setSaveStatus('saved');
    }, 600);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [currentProject]);

  // Handle creating new blank newspaper
  const handleCreateNewProject = () => {
    const fresh = createNewProject('My Michael Jackson Broadsheet');
    saveProject(fresh);
    setProjects((prev) => [fresh, ...prev]);
    setCurrentProject(fresh);
    setActivePageIndex(0);
    setSelectedElementId(null);
    setSelectedImageSlot(null);
    setView('editor');
  };

  // Open an existing project
  const handleOpenProject = (projectId: string) => {
    const found = projects.find((p) => p.id === projectId);
    if (found) {
      setCurrentProject(found);
      setActivePageIndex(0);
      setSelectedElementId(null);
      setSelectedImageSlot(null);
      setView('editor');
    }
  };

  // Duplicate project on dashboard
  const handleDuplicateProject = (projectId: string) => {
    const dup = duplicateProject(projectId);
    if (dup) {
      setProjects(loadAllProjects());
    }
  };

  // Delete project on dashboard
  const handleDeleteProject = (projectId: string) => {
    const updated = deleteProject(projectId);
    setProjects(updated);
    if (currentProject?.id === projectId) {
      setCurrentProject(updated[0] || null);
    }
  };

  // Rename project on dashboard or in header
  const handleRenameProject = (projectId: string, newTitle: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, title: newTitle } : p))
    );
    if (currentProject && currentProject.id === projectId) {
      setCurrentProject((prev) => (prev ? { ...prev, title: newTitle } : null));
    }
    const target = projects.find((p) => p.id === projectId);
    if (target) {
      saveProject({ ...target, title: newTitle });
    }
  };

  // Import JSON project
  const handleImportJson = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr) as NewspaperProject;
      if (parsed.id && parsed.pages && Array.isArray(parsed.pages)) {
        parsed.id = `project-${Date.now()}`;
        saveProject(parsed);
        const all = loadAllProjects();
        setProjects(all);
        setCurrentProject(parsed);
        setActivePageIndex(0);
        setView('editor');
      } else {
        console.error('Invalid newspaper project file format.');
      }
    } catch (e) {
      console.error('Failed to parse newspaper JSON project:', e);
    }
  };

  // Page Operations
  const handleAddPage = (layoutId: PageLayoutId) => {
    if (!currentProject) return;
    const newPageNumber = currentProject.pages.length + 1;
    const newPage = createInteriorPage(layoutId, newPageNumber);
    const updatedProject: NewspaperProject = {
      ...currentProject,
      pages: [...currentProject.pages, newPage],
    };
    setCurrentProject(updatedProject);
    setActivePageIndex(updatedProject.pages.length - 1);
    setSelectedElementId(null);
    setSelectedImageSlot(null);
  };

  const handleDuplicatePage = (pageId: string) => {
    if (!currentProject) return;
    const updated = duplicatePage(currentProject, pageId);
    setCurrentProject(updated);
    setActivePageIndex((prev) => Math.min(prev + 1, updated.pages.length - 1));
  };

  const handleDeletePage = (pageId: string) => {
    if (!currentProject || currentProject.pages.length <= 1) return;
    const updated = deletePage(currentProject, pageId);
    setCurrentProject(updated);
    setActivePageIndex((prev) => Math.max(0, Math.min(prev, updated.pages.length - 1)));
    setSelectedElementId(null);
    setSelectedImageSlot(null);
  };

  const handleMovePage = (fromIndex: number, toIndex: number) => {
    if (!currentProject) return;
    const updated = reorderPages(currentProject, fromIndex, toIndex);
    setCurrentProject(updated);
    setActivePageIndex(toIndex);
  };

  const handleChangeCurrentLayout = (newLayoutId: PageLayoutId) => {
    if (!currentProject) return;
    const activePage = currentProject.pages[activePageIndex];
    if (!activePage) return;

    const modifiedPage = changePageLayout(activePage, newLayoutId);
    const newPages = [...currentProject.pages];
    newPages[activePageIndex] = modifiedPage;

    setCurrentProject({
      ...currentProject,
      pages: newPages,
    });
  };

  // Element Mutators for Active Page
  const handleUpdateText = (textId: string, updates: Partial<TextElement>) => {
    if (!currentProject) return;
    const activePage = currentProject.pages[activePageIndex];
    if (!activePage) return;

    const updatedPage = updateTextElement(activePage, textId, updates);
    const newPages = [...currentProject.pages];
    newPages[activePageIndex] = updatedPage;

    setCurrentProject({
      ...currentProject,
      pages: newPages,
    });
  };

  const handleUpdateImage = (
    slot: 'image1' | 'image2' | 'image3',
    updates: Partial<ImageElement>
  ) => {
    if (!currentProject) return;
    const activePage = currentProject.pages[activePageIndex];
    if (!activePage) return;

    const updatedPage = updateImageElement(activePage, slot, updates);
    const newPages = [...currentProject.pages];
    newPages[activePageIndex] = updatedPage;

    setCurrentProject({
      ...currentProject,
      pages: newPages,
    });
  };

  const handleResetImage = (slot: 'image1' | 'image2' | 'image3') => {
    if (!currentProject) return;
    const activePage = currentProject.pages[activePageIndex];
    if (!activePage) return;

    const updatedPage = resetImageSlot(activePage, slot);
    const newPages = [...currentProject.pages];
    newPages[activePageIndex] = updatedPage;

    setCurrentProject({
      ...currentProject,
      pages: newPages,
    });
  };

  const handleUpdatePageHeader = (updates: Partial<NewspaperProject['pages'][0]['pageHeader']>) => {
    if (!currentProject) return;
    const activePage = currentProject.pages[activePageIndex];
    if (!activePage) return;

    const updatedPage = {
      ...activePage,
      pageHeader: {
        ...activePage.pageHeader,
        ...updates,
      },
    };
    const newPages = [...currentProject.pages];
    newPages[activePageIndex] = updatedPage;

    setCurrentProject({
      ...currentProject,
      pages: newPages,
    });
  };

  // Keyboard escape deselect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedElementId(null);
        setSelectedImageSlot(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Straight direct PDF download handler
  const handleDownloadPdfStraight = async () => {
    if (!currentProject) return;
    setIsExportingPdf(true);
    await downloadProjectPdf(
      currentProject,
      offscreenPagesRef.current,
      (msg) => setExportProgressText(msg)
    );
    setIsExportingPdf(false);
    setExportProgressText('');
  };

  // Active page for newspaper editor
  const activePage = currentProject?.pages[activePageIndex] || currentProject?.pages[0];

  return (
    <div className="h-screen w-screen flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden font-sans-studio relative">
      {/* Global Newsprint Paper Texture Overlay */}
      <NewsprintTextureOverlay enabled={textureEnabled} />

      {/* Global Home Screen Timer Takeover Lock Overlay */}
      <HomeScreenLockTakeover />

      {/* PUBLIC PORTAL VS STAFF STUDIO ROUTER */}
      {appMode === 'public' ? (
        <MjjRecordsPortal
          onOpenStaffPortal={handleOpenStaffRequest}
          textureEnabled={textureEnabled}
          onToggleTexture={handleToggleTexture}
        />
      ) : (
        /* STAFF CREATOR STUDIO */
        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          {/* Top Staff Navigation Bar */}
          <TopNavigation
            activeView={mainView}
            onSelectView={(v) => {
              if (v === 'authorisation') {
                setIsAuthorisationUnlocked(false);
              }
              setMainView(v);
              refreshLibraryData();
            }}
            isAuthorisationUnlocked={isAuthorisationUnlocked}
            onOpenBrandingKit={() => setIsBrandingModalOpen(true)}
            onOpenAiModal={() => setIsAiModalOpen(true)}
            onReturnToPublicPortal={() => {
              setAppMode('public');
              setIsStaffAuthenticated(false);
              setIsAuthorisationUnlocked(false);
            }}
            textureEnabled={textureEnabled}
            onToggleTexture={handleToggleTexture}
          />

          {/* Staff Main View Router */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* VIEW 1: TICKETS & INVITATIONS STUDIO */}
            {mainView === 'tickets' && (
              <TicketStudio
                onOpenBrandingKit={() => setIsBrandingModalOpen(true)}
                brandingOrganizationName={branding.name}
              />
            )}

            {/* VIEW 2: AUTHORISATION CENTRE & CODES / PUBLISHING */}
            {mainView === 'authorisation' && (
              <AuthorisationCentre
                isUnlocked={isAuthorisationUnlocked}
                onUnlock={() => setIsAuthorisationUnlocked(true)}
                onLock={() => setIsAuthorisationUnlocked(false)}
                onOpenBrandingKit={() => setIsBrandingModalOpen(true)}
                brandingOrganizationName={branding.name}
              />
            )}

            {/* VIEW 3: CENTRAL DOCUMENT LIBRARY */}
            {mainView === 'library' && (
              <DocumentLibrary
                newspapers={projects}
                tickets={ticketsList}
                authorisationDocs={authorisationList}
                onOpenNewspaper={(id) => {
                  handleOpenProject(id);
                  setMainView('newspaper');
                  setView('editor');
                }}
                onOpenTicket={() => {
                  setMainView('tickets');
                }}
                onOpenAuthorisationDoc={() => {
                  setIsAuthorisationUnlocked(true);
                  setMainView('authorisation');
                }}
                onDuplicateNewspaper={(id) => {
                  handleDuplicateProject(id);
                  refreshLibraryData();
                }}
                onDuplicateTicket={(id) => {
                  duplicateTicket(id);
                  refreshLibraryData();
                }}
                onDuplicateAuthorisationDoc={(id) => {
                  duplicateAuthorisationDoc(id);
                  refreshLibraryData();
                }}
                onDeleteNewspaper={(id) => {
                  handleDeleteProject(id);
                  refreshLibraryData();
                }}
                onDeleteTicket={(id) => {
                  deleteTicket(id);
                  refreshLibraryData();
                }}
                onDeleteAuthorisationDoc={(id) => {
                  deleteAuthorisationDoc(id);
                  refreshLibraryData();
                }}
                onNavigateToTab={(tab) => setMainView(tab)}
              />
            )}

            {/* VIEW 4: BROADSHEET NEWSPAPER STUDIO */}
            {mainView === 'newspaper' && (
              <>
                {view === 'dashboard' || !currentProject ? (
                  <div className="flex-1 overflow-y-auto w-full">
                    <Dashboard
                      projects={projects}
                      onCreateNew={handleCreateNewProject}
                      onOpenProject={handleOpenProject}
                      onDuplicateProject={handleDuplicateProject}
                      onDeleteProject={handleDeleteProject}
                      onRenameProject={handleRenameProject}
                      onExportJson={exportProjectToJson}
                      onImportJson={handleImportJson}
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Broadsheet Studio Sub-Header */}
                    <Header
                      projectTitle={currentProject.title}
                      onUpdateTitle={(title) => handleRenameProject(currentProject.id, title)}
                      onBackToDashboard={() => setView('dashboard')}
                      zoomLevel={zoomLevel}
                      onSetZoom={setZoomLevel}
                      previewMode={previewMode}
                      onTogglePreviewMode={() => setPreviewMode(!previewMode)}
                      onDownloadPdfStraight={handleDownloadPdfStraight}
                      onPrintClick={() => window.print()}
                      isExportingPdf={isExportingPdf}
                      exportProgressText={exportProgressText}
                      saveStatus={saveStatus}
                      pageCount={currentProject.pages.length}
                      onOpenPublishModal={() => setIsPublishModalOpen(true)}
                      onOpenFlipbookPreview={() => setActiveFlipbookDoc(currentProject)}
                      onOpenAiModal={() => setIsAiModalOpen(true)}
                    />

                    {/* 3-Section Newspaper Studio Workspace */}
                    <div className="flex-1 flex overflow-hidden">
                      {/* LEFT SIDEBAR: Page Management */}
                      <PageManagerSidebar
                        project={currentProject}
                        activePageIndex={activePageIndex}
                        onSelectPage={(index) => {
                          setActivePageIndex(index);
                          setSelectedElementId(null);
                          setSelectedImageSlot(null);
                        }}
                        onAddPageClick={() => {
                          setLayoutModalMode('add');
                          setIsLayoutModalOpen(true);
                        }}
                        onDuplicatePage={handleDuplicatePage}
                        onDeletePage={handleDeletePage}
                        onMovePage={handleMovePage}
                        onChangeLayoutClick={() => {
                          setLayoutModalMode('change');
                          setIsLayoutModalOpen(true);
                        }}
                      />

                      {/* CENTER: Canvas Drafting Board */}
                      <main
                        className="flex-1 bg-[#1a191b] overflow-auto flex items-start justify-center p-2 sm:p-4 md:p-8 relative select-none"
                        onClick={() => {
                          setSelectedElementId(null);
                          setSelectedImageSlot(null);
                        }}
                      >
                        {/* Subtle grid pattern background */}
                        <div
                          className="absolute inset-0 pointer-events-none opacity-10"
                          style={{
                            backgroundImage:
                              'radial-gradient(circle at 1px 1px, #d4af37 1px, transparent 0)',
                            backgroundSize: '24px 24px',
                          }}
                        />

                        {/* Scaled Newspaper Sheet */}
                        {activePage && (
                          <div
                            className="transition-transform duration-100 ease-out origin-top shadow-2xl relative my-4"
                            style={{
                              transform: `scale(${zoomLevel})`,
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <NewspaperPageRenderer
                              page={activePage}
                              selectedElementId={selectedElementId}
                              selectedImageSlot={selectedImageSlot}
                              onSelectText={(id) => {
                                setSelectedElementId(id);
                                setSelectedImageSlot(null);
                              }}
                              onSelectImage={(slot) => {
                                setSelectedImageSlot(slot);
                                setSelectedElementId(null);
                              }}
                              previewMode={previewMode}
                            />
                          </div>
                        )}
                      </main>

                      {/* RIGHT SIDEBAR: Element Formatting & Inspector */}
                      {activePage && (
                        <InspectorSidebar
                          page={activePage}
                          selectedElementId={selectedElementId}
                          selectedImageSlot={selectedImageSlot}
                          onUpdateText={handleUpdateText}
                          onUpdateImage={handleUpdateImage}
                          onResetImage={handleResetImage}
                          onUpdatePageHeader={handleUpdatePageHeader}
                          onChangeLayoutClick={() => {
                            setLayoutModalMode('change');
                            setIsLayoutModalOpen(true);
                          }}
                          onDeselect={() => {
                            setSelectedElementId(null);
                            setSelectedImageSlot(null);
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Staff Passcode Gate Modal (Code 2526) */}
      <StaffPasscodeModal
        isOpen={showPasscodeModal}
        onClose={() => setShowPasscodeModal(false)}
        onSuccess={() => {
          setIsStaffAuthenticated(true);
          setShowPasscodeModal(false);
          setAppMode('staff');
        }}
      />

      {/* Global Organisation Branding Kit Modal */}
      <BrandingKitModal
        isOpen={isBrandingModalOpen}
        onClose={() => setIsBrandingModalOpen(false)}
        onSaved={(b) => setBranding(b)}
      />

      {/* Layout Selection Modal */}
      {currentProject && activePage && (
        <LayoutPickerModal
          isOpen={isLayoutModalOpen}
          onClose={() => setIsLayoutModalOpen(false)}
          onSelectLayout={(layoutId) => {
            if (layoutModalMode === 'add') {
              handleAddPage(layoutId);
            } else {
              handleChangeCurrentLayout(layoutId);
            }
          }}
          mode={layoutModalMode}
          currentLayoutId={activePage.layoutId}
        />
      )}

      {/* PDF Export & Print Modal */}
      {currentProject && (
        <PdfExportModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          project={currentProject}
        />
      )}

      {/* Publish as Current Paper Modal */}
      {currentProject && (
        <PublishNewspaperModal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          project={currentProject}
          onOpenFlipbookPreview={() => setActiveFlipbookDoc(currentProject)}
        />
      )}

      {/* 3D Flipbook Newspaper Reader Modal */}
      {activeFlipbookDoc && (
        <FlipbookReader
          project={activeFlipbookDoc}
          onClose={() => setActiveFlipbookDoc(null)}
        />
      )}

      {/* Staff AI Broadsheet Newspaper Copilot Modal */}
      <StaffAiNewspaperModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onProjectCreated={(newProject) => {
          setProjects((prev) => [newProject, ...prev]);
          setCurrentProject(newProject);
          setActivePageIndex(0);
          setMainView('newspaper');
          setView('editor');
        }}
      />

      {/* Offscreen container holding all sequential newspaper pages for straight PDF export & print */}
      {currentProject && (
        <div
          ref={offscreenPagesRef}
          className="fixed top-0 left-0 w-[800px] pointer-events-none opacity-[0.001] -z-50 overflow-hidden"
          aria-hidden="true"
        >
          {currentProject.pages.map((p) => (
            <div key={p.id} className="export-page-target newspaper-print-page bg-white">
              <NewspaperPageRenderer
                page={p}
                selectedElementId={null}
                selectedImageSlot={null}
                onSelectText={() => {}}
                onSelectImage={() => {}}
                previewMode={true}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
