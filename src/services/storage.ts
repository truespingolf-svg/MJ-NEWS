import { NewspaperProject } from '../types/newspaper.ts';
import {
  createStarterProject,
  subscribeProjects,
  saveProjectFirestore,
  deleteProjectFirestore,
  duplicateProjectFirestore,
} from './firestoreStorage.ts';

const STORAGE_KEY = 'mj_newspaper_studio_projects_v1';
const ACTIVE_PROJECT_KEY = 'mj_newspaper_studio_active_id_v1';

let cachedProjects: NewspaperProject[] = [];

// Initialize memory cache from localStorage if available
try {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    cachedProjects = JSON.parse(raw);
  }
} catch {
  // ignore
}

// Start real-time Firestore subscriber to keep cachedProjects in sync across all devices
subscribeProjects((projects) => {
  cachedProjects = projects;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // ignore
  }
});

/**
 * Loads all saved projects from real-time cache / storage.
 */
export function loadAllProjects(): NewspaperProject[] {
  if (cachedProjects && cachedProjects.length > 0) {
    return cachedProjects;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedProjects = parsed;
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  const starter = createStarterProject();
  cachedProjects = [starter];
  return [starter];
}

/**
 * Saves or updates a project to Firebase Firestore and local cache.
 */
export function saveProject(project: NewspaperProject): boolean {
  try {
    const remaining = cachedProjects.filter((p) => p.id !== project.id);
    const updated = {
      ...project,
      updatedAt: new Date().toISOString(),
    };
    cachedProjects = [updated, ...remaining];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedProjects));
    localStorage.setItem(ACTIVE_PROJECT_KEY, project.id);
    // Persist asynchronously to Firebase Firestore
    saveProjectFirestore(updated).catch((err) => console.error('Firestore save project error:', err));
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
 * Duplicates an entire project on the dashboard and syncs to Firestore.
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
 * Deletes a project by ID and syncs to Firestore.
 */
export function deleteProject(projectId: string): NewspaperProject[] {
  cachedProjects = cachedProjects.filter((p) => p.id !== projectId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedProjects));
  } catch {
    // ignore
  }
  deleteProjectFirestore(projectId).catch((err) => console.error('Firestore delete project error:', err));

  if (cachedProjects.length === 0) {
    const starter = createStarterProject();
    cachedProjects = [starter];
    saveProject(starter);
    setActiveProjectId(starter.id);
    return [starter];
  }

  const activeId = localStorage.getItem(ACTIVE_PROJECT_KEY);
  if (activeId === projectId) {
    setActiveProjectId(cachedProjects[0].id);
  }
  return cachedProjects;
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
