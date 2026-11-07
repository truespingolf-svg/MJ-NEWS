import { NewspaperProject } from '../types/newspaper.ts';
import {
  createNewProject,
  createInteriorPage,
  updateImageElement,
  updateTextElement,
} from '../utils/newspaperLogic.ts';

const STORAGE_KEY = 'mj_newspaper_studio_projects_v1';
const ACTIVE_PROJECT_KEY = 'mj_newspaper_studio_active_id_v1';

/**
 * Creates an authentic starter newspaper project with clean editable placeholders.
 */
function createStarterProject(): NewspaperProject {
  const project = createNewProject('The King of Pop Chronicle');
  project.subtitle = 'Commemorative Newspaper Edition';

  // Front Cover with clean placeholders (no AI presets)
  let cover = project.pages[0];

  // Add Page 2: Top Hero layout
  const page2 = createInteriorPage('layout-top-hero', 2);
  page2.pageHeader.sectionTitle = 'HISTORIC ARCHIVES • PAGE 2';

  // Add Page 3: Panoramic Triptych layout
  const page3 = createInteriorPage('layout-horizontal-triptych', 3);
  page3.pageHeader.sectionTitle = 'HISTORIC ARCHIVES • PAGE 3';

  project.pages = [cover, page2, page3];
  return project;
}

/**
 * Low-level reader for localStorage projects without recursion.
 */
function readProjectsFromStorage(): NewspaperProject[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Loads all saved projects from storage.
 */
export function loadAllProjects(): NewspaperProject[] {
  const existing = readProjectsFromStorage();
  if (existing) {
    return existing;
  }
  const starter = createStarterProject();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([starter]));
    localStorage.setItem(ACTIVE_PROJECT_KEY, starter.id);
  } catch (e) {
    console.error('Storage write error:', e);
  }
  return [starter];
}

/**
 * Saves or updates a project.
 */
export function saveProject(project: NewspaperProject): boolean {
  try {
    const existing = readProjectsFromStorage() || [];
    const remaining = existing.filter((p) => p.id !== project.id);
    const updatedProject = {
      ...project,
      updatedAt: new Date().toISOString(),
    };
    const updatedList = [updatedProject, ...remaining];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    localStorage.setItem(ACTIVE_PROJECT_KEY, project.id);
    return true;
  } catch (err) {
    console.error('Failed to save project:', err);
    return false;
  }
}

/**
 * Gets a single project by ID.
 */
export function getProjectById(id: string): NewspaperProject | null {
  const all = loadAllProjects();
  return all.find((p) => p.id === id) || null;
}

/**
 * Gets the last active project or the first project available.
 */
export function getActiveProject(): NewspaperProject {
  const activeId = localStorage.getItem(ACTIVE_PROJECT_KEY);
  const all = loadAllProjects();
  if (activeId) {
    const found = all.find((p) => p.id === activeId);
    if (found) return found;
  }
  return all[0] || createStarterProject();
}

/**
 * Sets the active project ID.
 */
export function setActiveProjectId(id: string) {
  localStorage.setItem(ACTIVE_PROJECT_KEY, id);
}

/**
 * Duplicates an entire project on the dashboard.
 */
export function duplicateProject(projectId: string): NewspaperProject | null {
  const original = getProjectById(projectId);
  if (!original) return null;

  const now = new Date().toISOString();
  const newProject: NewspaperProject = {
    ...original,
    id: `project-${Date.now()}`,
    title: `${original.title} (Copy)`,
    createdAt: now,
    updatedAt: now,
    pages: original.pages.map((p, idx) => ({
      ...p,
      id: `page-${Date.now()}-${idx}`,
    })),
  };

  saveProject(newProject);
  return newProject;
}

/**
 * Deletes a project by ID.
 */
export function deleteProject(projectId: string): NewspaperProject[] {
  const projects = loadAllProjects().filter((p) => p.id !== projectId);
  if (projects.length === 0) {
    const starter = createStarterProject();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([starter]));
    setActiveProjectId(starter.id);
    return [starter];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  const activeId = localStorage.getItem(ACTIVE_PROJECT_KEY);
  if (activeId === projectId) {
    setActiveProjectId(projects[0].id);
  }
  return projects;
}

/**
 * Exports project as downloadable JSON backup.
 */
export function exportProjectToJson(project: NewspaperProject) {
  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_newspaper.json`;
  a.click();
  URL.revokeObjectURL(url);
}
