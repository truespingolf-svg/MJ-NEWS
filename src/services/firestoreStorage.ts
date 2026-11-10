import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../firebase.ts';
import type { User } from 'firebase/auth';
import { NewspaperProject } from '../types/newspaper.ts';
import { createNewProject, createInteriorPage } from '../utils/newspaperLogic.ts';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

const LOCAL_STORAGE_BACKUP_KEY = 'mj_newspaper_studio_projects_v1';
const ACTIVE_PROJECT_KEY = 'mj_newspaper_studio_active_id_v1';

export function createStarterProject(): NewspaperProject {
  const project = createNewProject('The King of Pop Chronicle');
  project.subtitle = 'Commemorative Newspaper Edition';

  const cover = project.pages[0];
  const page2 = createInteriorPage('layout-top-hero', 2);
  page2.pageHeader.sectionTitle = 'HISTORIC ARCHIVES • PAGE 2';

  const page3 = createInteriorPage('layout-horizontal-triptych', 3);
  page3.pageHeader.sectionTitle = 'HISTORIC ARCHIVES • PAGE 3';

  project.pages = [cover, page2, page3];
  return project;
}

// -------------------------------------------------------------
// 1. REAL-TIME NEWSPAPER PROJECTS (CRUD & SYNC)
// -------------------------------------------------------------

export function subscribeProjects(callback: (projects: NewspaperProject[]) => void): () => void {
  const colRef = collection(db, 'projects');
  const unsubscribe = onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        // If Firestore projects collection is empty, seed starter project so all devices start with it
        const starter = createStarterProject();
        try {
          await setDoc(doc(db, 'projects', starter.id), starter);
          localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify([starter]));
          callback([starter]);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, 'projects/' + starter.id);
          callback([starter]);
        }
      } else {
        const list: NewspaperProject[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as NewspaperProject);
        });
        list.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
        try {
          localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(list));
        } catch {
          // ignore storage quota
        }
        callback(list);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'projects');
      // Fallback to local cache if offline
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
        if (raw) callback(JSON.parse(raw));
      } catch {
        callback([createStarterProject()]);
      }
    }
  );
  return unsubscribe;
}

export async function saveProjectFirestore(project: NewspaperProject): Promise<boolean> {
  const path = `projects/${project.id}`;
  const updatedProject = {
    ...project,
    updatedAt: new Date().toISOString(),
  };

  // Immediate local cache update
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const remaining = existing.filter((p: any) => p.id !== project.id);
    localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify([updatedProject, ...remaining]));
    localStorage.setItem(ACTIVE_PROJECT_KEY, project.id);
  } catch (e) {
    console.warn('Local storage cache update note:', e);
  }

  try {
    await setDoc(doc(db, 'projects', project.id), updatedProject);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return true; // Still preserved locally
  }
}

export async function deleteProjectFirestore(projectId: string): Promise<boolean> {
  const path = `projects/${projectId}`;
  try {
    await deleteDoc(doc(db, 'projects', projectId));
    const raw = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
    if (raw) {
      const remaining = JSON.parse(raw).filter((p: any) => p.id !== projectId);
      localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(remaining));
    }
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    return false;
  }
}

export async function duplicateProjectFirestore(projectId: string): Promise<NewspaperProject | null> {
  try {
    const docSnap = await getDoc(doc(db, 'projects', projectId));
    let original: NewspaperProject | null = null;
    if (docSnap.exists()) {
      original = docSnap.data() as NewspaperProject;
    } else {
      const raw = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
      if (raw) {
        original = JSON.parse(raw).find((p: any) => p.id === projectId) || null;
      }
    }

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

    await saveProjectFirestore(newProject);
    return newProject;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `projects/${projectId}`);
    return null;
  }
}

// -------------------------------------------------------------
// 2. REAL-TIME PUBLISHED NEWSPAPER & MODERATION QUEUE
// -------------------------------------------------------------

export function subscribePublishedNewspaper(callback: (pub: any) => void): () => void {
  const docRef = doc(db, 'system', 'publishedNewspaper');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.isActive && data.expiresAt) {
          const now = Date.now();
          const expires = new Date(data.expiresAt).getTime();
          if (now >= expires) {
            // Expired -> automatically archive
            setDoc(doc(db, 'system', 'publishedNewspaper'), { ...data, isActive: false }, { merge: true });
            callback({ ...data, isActive: false });
            return;
          }
        }
        callback(data);
      } else {
        callback(null);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'system/publishedNewspaper');
    }
  );
}

export async function submitModerationFirestore(project: NewspaperProject, durationMinutes: number): Promise<boolean> {
  const subId = `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const safeDuration = Math.max(1, Math.round(Number(durationMinutes) || 1440));
  const subData = {
    id: subId,
    project,
    projectTitle: project.title || 'MJJ Records Broadsheet Press',
    durationMinutes: safeDuration,
    submittedAt: new Date().toISOString(),
    status: 'Pending Moderation',
  };

  try {
    await setDoc(doc(db, 'submissions', subId), subData);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `submissions/${subId}`);
    return false;
  }
}

export function subscribeSubmissions(callback: (submissions: any[]) => void): () => void {
  const colRef = collection(db, 'submissions');
  return onSnapshot(
    colRef,
    (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push(d.data()));
      list.sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'submissions');
    }
  );
}

export async function acceptSubmissionFirestore(submissionId: string): Promise<boolean> {
  try {
    const subSnap = await getDoc(doc(db, 'submissions', submissionId));
    if (!subSnap.exists()) return false;
    const submission = subSnap.data();

    const now = new Date();
    const durationMinutes = submission.durationMinutes || 1440;
    const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);
    const pubId = submission.project.id || `project-${Date.now()}`;

    const publishedRecord = {
      id: pubId,
      projectId: pubId,
      projectTitle: submission.projectTitle,
      name: submission.projectTitle,
      title: submission.projectTitle,
      pages: submission.project.pages || [],
      publishedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      durationMinutes,
      isActive: true,
      projectData: submission.project,
    };

    // Update system live published doc and store in published newspapers collection
    await setDoc(doc(db, 'system', 'publishedNewspaper'), publishedRecord);
    await setDoc(doc(db, 'newspapers', pubId), publishedRecord);
    await deleteDoc(doc(db, 'submissions', submissionId));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'system/publishedNewspaper');
    return false;
  }
}

export async function rejectSubmissionFirestore(submissionId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'submissions', submissionId));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `submissions/${submissionId}`);
    return false;
  }
}

export async function publishDirectFirestore(project: NewspaperProject, durationMinutes: number): Promise<boolean> {
  const now = new Date();
  const safeMinutes = Math.max(1, Math.round(Number(durationMinutes) || 1440));
  const expiresAt = new Date(now.getTime() + safeMinutes * 60 * 1000);
  const projectTitle = project.title || 'MJJ Records Broadsheet Press';
  const pubId = project.id || `project-${Date.now()}`;

  const publishedRecord = {
    id: pubId,
    projectId: pubId,
    projectTitle,
    name: projectTitle,
    title: projectTitle,
    pages: project.pages || [],
    publishedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    durationMinutes: safeMinutes,
    isActive: true,
    projectData: project,
  };

  try {
    await setDoc(doc(db, 'system', 'publishedNewspaper'), publishedRecord);
    await setDoc(doc(db, 'newspapers', pubId), publishedRecord);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'system/publishedNewspaper');
    return false;
  }
}

export async function unpublishFirestore(): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'system', 'publishedNewspaper'));
    if (snap.exists()) {
      const data = snap.data();
      await setDoc(doc(db, 'system', 'publishedNewspaper'), { ...data, isActive: false }, { merge: true });
      if (data.id) {
        await setDoc(doc(db, 'newspapers', data.id), { ...data, isActive: false }, { merge: true });
      }
    }
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'system/publishedNewspaper');
    return false;
  }
}

// Subscribe to all published broadsheets for the Public Archival Library
export function subscribeAllPublishedNewspapers(callback: (newspapers: any[]) => void): () => void {
  const colRef = collection(db, 'newspapers');
  return onSnapshot(
    colRef,
    (snap) => {
      const list: any[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() });
      });
      // Sort newest published first
      list.sort((a, b) => new Date(b.publishedAt || b.createdAt || 0).getTime() - new Date(a.publishedAt || a.createdAt || 0).getTime());
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'newspapers');
    }
  );
}

export async function deletePublishedNewspaperFirestore(newspaperId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'newspapers', newspaperId));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `newspapers/${newspaperId}`);
    return false;
  }
}

// -------------------------------------------------------------
// 3. REAL-TIME ANNOUNCEMENTS TICKER
// -------------------------------------------------------------

export function subscribeAnnouncements(callback: (announcements: any[]) => void): () => void {
  const colRef = collection(db, 'announcements');
  return onSnapshot(
    colRef,
    (snap) => {
      const list: any[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({ id: d.id, ...data });
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'announcements');
    }
  );
}

export async function addAnnouncementFirestore(text: string): Promise<boolean> {
  if (!text || !text.trim()) return false;
  const id = `ann-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const annData = {
    id,
    text: text.trim(),
    active: true,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'announcements', id), annData);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `announcements/${id}`);
    return false;
  }
}

export async function deleteAnnouncementFirestore(id: string): Promise<boolean> {
  if (!id) return false;
  try {
    await deleteDoc(doc(db, 'announcements', id));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `announcements/${id}`);
    return false;
  }
}

// -------------------------------------------------------------
// 3.5. REAL-TIME GLOBAL HOME SCREEN TIMER TAKEOVER LOCK
// -------------------------------------------------------------

export interface HomeLockConfig {
  isLocked: boolean;
  message: string;
  endTime: number; // Unix timestamp ms
  durationMinutes: number;
  createdAt?: string;
  createdBy?: string;
}

export function subscribeHomeLockConfig(callback: (config: HomeLockConfig | null) => void): () => void {
  const docRef = doc(db, 'system', 'homeLock');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as HomeLockConfig);
      } else {
        callback(null);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'system/homeLock');
    }
  );
}

export async function setHomeLockConfigInFirestore(config: HomeLockConfig): Promise<boolean> {
  try {
    const docRef = doc(db, 'system', 'homeLock');
    await setDoc(docRef, config, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'system/homeLock');
    return false;
  }
}

export async function clearHomeLockConfigInFirestore(): Promise<boolean> {
  try {
    const docRef = doc(db, 'system', 'homeLock');
    await setDoc(docRef, { isLocked: false, endTime: 0 }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'system/homeLock');
    return false;
  }
}

// -------------------------------------------------------------
// 4. REAL-TIME SECRET REWARD CODES & DISCORD REDEMPTIONS
// -------------------------------------------------------------

export function subscribePromoCodes(callback: (codes: any[]) => void): () => void {
  const colRef = collection(db, 'promoCodes');
  return onSnapshot(
    colRef,
    (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push(d.data()));
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'promoCodes');
    }
  );
}

export function subscribeRedemptions(callback: (redemptions: any[]) => void): () => void {
  const colRef = collection(db, 'redemptions');
  return onSnapshot(
    colRef,
    (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push(d.data()));
      list.sort((a, b) => new Date(b.redeemedAt || 0).getTime() - new Date(a.redeemedAt || 0).getTime());
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'redemptions');
    }
  );
}

export async function createPromoCodeFirestore(data: {
  code: string;
  projectId?: string;
  pageIndex?: number;
  probability?: number;
  maxRedemptions?: number;
  customMessage?: string;
}): Promise<boolean> {
  const id = `code-${Date.now()}`;
  const codeDoc = {
    id,
    code: (data.code || `MJJ-${Math.floor(100000 + Math.random() * 900000)}`).trim().toUpperCase(),
    projectId: data.projectId || 'all',
    pageIndex: data.pageIndex !== undefined ? Number(data.pageIndex) : 1,
    probability: data.probability !== undefined ? Number(data.probability) : 50,
    maxRedemptions: data.maxRedemptions !== undefined ? Number(data.maxRedemptions) : 1,
    redemptionsCount: 0,
    customMessage: data.customMessage || '🎉 Congratulations! You unlocked an exclusive MJJ Records reward!',
    active: true,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'promoCodes', id), codeDoc);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `promoCodes/${id}`);
    return false;
  }
}

export async function deletePromoCodeFirestore(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'promoCodes', id));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `promoCodes/${id}`);
    return false;
  }
}

export async function redeemCodeFirestore(
  rawCode: string,
  rawDiscordUser: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  if (!rawCode?.trim() || !rawDiscordUser?.trim()) {
    return { success: false, error: 'Please enter both the secret code and your Discord handle.' };
  }

  const cleanCode = rawCode.trim().toUpperCase();
  const cleanDiscord = rawDiscordUser.trim();

  try {
    const codesSnap = await getDocs(collection(db, 'promoCodes'));
    let targetDoc: any = null;
    let targetDocId = '';

    codesSnap.forEach((d) => {
      const data = d.data();
      if (data.code?.toUpperCase() === cleanCode && data.active) {
        targetDoc = data;
        targetDocId = d.id;
      }
    });

    if (!targetDoc) {
      return { success: false, error: 'Invalid secret code. Please verify the code and try again.' };
    }

    if (targetDoc.redemptionsCount >= targetDoc.maxRedemptions) {
      return { success: false, error: 'This code has reached its maximum redemptions limit.' };
    }

    // Check if user already claimed
    const redSnap = await getDocs(collection(db, 'redemptions'));
    let alreadyClaimed = false;
    redSnap.forEach((d) => {
      const r = d.data();
      if (r.code?.toUpperCase() === cleanCode && r.discordUser?.toLowerCase() === cleanDiscord.toLowerCase()) {
        alreadyClaimed = true;
      }
    });

    if (alreadyClaimed) {
      return { success: false, error: 'You have already redeemed this reward code with this Discord account.' };
    }

    // Increment count & deactivate if reached max
    const newCount = (targetDoc.redemptionsCount || 0) + 1;
    await setDoc(
      doc(db, 'promoCodes', targetDocId),
      {
        redemptionsCount: newCount,
        active: newCount < targetDoc.maxRedemptions,
      },
      { merge: true }
    );

    // Record redemption
    const redemptionId = `red-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await setDoc(doc(db, 'redemptions', redemptionId), {
      id: redemptionId,
      code: targetDoc.code,
      discordUser: cleanDiscord,
      customMessage: targetDoc.customMessage,
      redeemedAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: targetDoc.customMessage || 'Reward code redeemed successfully! Check Discord for your roles.',
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'redemptions');
    return { success: false, error: 'Connection error redeeming code. Please try again.' };
  }
}

// -------------------------------------------------------------
// 5. REAL-TIME MARKETING APPLICATIONS
// -------------------------------------------------------------

export function subscribeMarketingApplications(callback: (apps: any[]) => void): () => void {
  const colRef = collection(db, 'marketingApplications');
  return onSnapshot(
    colRef,
    (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push(d.data()));
      list.sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'marketingApplications');
    }
  );
}

export async function submitApplicationFirestore(data: {
  discordUser: string;
  fullName?: string;
  reason: string;
}): Promise<boolean> {
  const id = `app-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const appDoc = {
    id,
    discordUser: data.discordUser.trim(),
    fullName: (data.fullName || 'Anonymous Applicant').trim(),
    reason: data.reason.trim(),
    submittedAt: new Date().toISOString(),
    status: 'Pending',
  };

  try {
    await setDoc(doc(db, 'marketingApplications', id), appDoc);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `marketingApplications/${id}`);
    return false;
  }
}

export async function updateApplicationStatusFirestore(id: string, status: string): Promise<boolean> {
  try {
    await setDoc(doc(db, 'marketingApplications', id), { status }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `marketingApplications/${id}`);
    return false;
  }
}

export async function deleteApplicationFirestore(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'marketingApplications', id));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `marketingApplications/${id}`);
    return false;
  }
}

// -------------------------------------------------------------
// 6. REAL-TIME USER PROFILES, GOOGLE AUTH, POINTS & COMMUNITY
// -------------------------------------------------------------

export interface UserTicketGrant {
  id: string;
  ticketNumber: string;
  eventTitle: string;
  seatTier: string;
  accessLevel?: string;
  dressCode?: string;
  dateText?: string;
  timeText?: string;
  issuedAt: string;
  staffNote?: string;
}

export interface UserAssignedCode {
  id: string;
  code: string;
  points: number;
  customMessage: string;
  issuedAt: string;
}

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  type: 'ticket' | 'code' | 'invite' | 'system';
  issuedAt: string;
  read?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  discordUser: string;
  discordUsername?: string;
  accountPassword?: string;
  points: number;
  votes: number;
  photoURL: string | null;
  reactedNewspaperIds: string[];
  votedUserIds: string[];
  lastVotedMap?: Record<string, number>;
  tickets: UserTicketGrant[];
  assignedCodes: UserAssignedCode[];
  notifications?: UserNotification[];
  createdAt: string;
  updatedAt: string;
}

export async function syncUserProfile(user: User, customDiscord?: string): Promise<UserProfile | null> {
  if (!user || !user.uid) return null;
  const userRef = doc(db, 'users', user.uid);

  try {
    const snap = await getDoc(userRef);
    const now = new Date().toISOString();

    if (snap.exists()) {
      const existing = snap.data() as UserProfile;
      const updated: UserProfile = {
        ...existing,
        email: user.email || existing.email,
        displayName: user.displayName || existing.displayName,
        photoURL: user.photoURL || existing.photoURL,
        discordUser: customDiscord !== undefined ? customDiscord.trim() : existing.discordUser || '',
        updatedAt: now,
      };
      await setDoc(userRef, updated, { merge: true });
      return updated;
    } else {
      const initial: UserProfile = {
        uid: user.uid,
        email: user.email || null,
        displayName: user.displayName || user.email?.split('@')[0] || 'Community Member',
        discordUser: customDiscord?.trim() || '',
        points: 0,
        votes: 0,
        photoURL: user.photoURL || null,
        reactedNewspaperIds: [],
        votedUserIds: [],
        tickets: [],
        assignedCodes: [],
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(userRef, initial);
      return initial;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    return null;
  }
}

export async function updateUserDiscord(uid: string, discordUser: string): Promise<boolean> {
  if (!uid) return false;
  try {
    await setDoc(
      doc(db, 'users', uid),
      {
        discordUser: discordUser.trim(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    return false;
  }
}

export function subscribeCurrentUser(uid: string, callback: (profile: UserProfile | null) => void): () => void {
  if (!uid) {
    callback(null);
    return () => {};
  }
  const userRef = doc(db, 'users', uid);
  return onSnapshot(
    userRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as UserProfile);
      } else {
        callback(null);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${uid}`);
    }
  );
}

export function subscribeUsers(callback: (users: UserProfile[]) => void): () => void {
  const colRef = collection(db, 'users');
  return onSnapshot(
    colRef,
    (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((d) => {
        list.push(d.data() as UserProfile);
      });
      // Sort by points descending, then votes descending
      list.sort((a, b) => (b.points || 0) - (a.points || 0) || (b.votes || 0) - (a.votes || 0));
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'users');
    }
  );
}

// React to newspaper (+1000 points on first reaction)
export async function reactToNewspaper(
  uid: string,
  newspaperId: string,
  reactionEmoji: string
): Promise<{ success: boolean; pointsAwarded: number; message: string }> {
  if (!uid || !newspaperId) {
    return { success: false, pointsAwarded: 0, message: 'Please sign in to react to broadsheets and earn points.' };
  }

  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      return { success: false, pointsAwarded: 0, message: 'User profile not found.' };
    }

    const profile = snap.data() as UserProfile;
    const reactedList = profile.reactedNewspaperIds || [];
    const alreadyReacted = reactedList.includes(newspaperId);

    if (alreadyReacted) {
      return {
        success: false,
        pointsAwarded: 0,
        message: 'You have already reacted to this edition! Only 1 reaction is permitted per newspaper.',
      };
    }

    const pointsAwarded = 1000;
    const newPoints = (profile.points || 0) + 1000;
    const updatedReacted = [...reactedList, newspaperId];

    await setDoc(
      userRef,
      {
        points: newPoints,
        reactedNewspaperIds: updatedReacted,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // Update global newspaper reactions counter
    const rxRef = doc(db, 'reactions', newspaperId);
    const rxSnap = await getDoc(rxRef);
    const currentCounts = rxSnap.exists() ? rxSnap.data() : {};
    const count = (currentCounts[reactionEmoji] || 0) + 1;
    await setDoc(rxRef, { ...currentCounts, [reactionEmoji]: count }, { merge: true });

    return {
      success: true,
      pointsAwarded,
      message: `🎉 You reacted with ${reactionEmoji} and earned +1,000 Points!`,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
    return { success: false, pointsAwarded: 0, message: 'Could not record reaction.' };
  }
}

export function subscribeNewspaperReactions(
  newspaperId: string,
  callback: (reactions: Record<string, number>) => void
): () => void {
  if (!newspaperId) {
    callback({});
    return () => {};
  }
  const docRef = doc(db, 'reactions', newspaperId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as Record<string, number>);
      } else {
        callback({});
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, `reactions/${newspaperId}`);
    }
  );
}

// Upvote / vote for player (+1 vote and configurable points to target player, 5-hour cooldown per target)
export async function voteForUser(
  voterUid: string,
  targetUid: string
): Promise<{ success: boolean; message: string }> {
  if (!voterUid) {
    return { success: false, message: 'Please sign in to vote for community members.' };
  }
  if (voterUid === targetUid) {
    return { success: false, message: 'You cannot vote for yourself!' };
  }

  const VOTE_COOLDOWN_MS = 5 * 60 * 60 * 1000; // 5 Hours (18,000,000 ms)

  try {
    const configSnap = await getDoc(doc(db, 'system', 'votingConfig'));
    const pointsPerVote = configSnap.exists() ? Math.max(1, Number(configSnap.data().pointsPerVote) || 1000) : 1000;

    const voterRef = doc(db, 'users', voterUid);
    const targetRef = doc(db, 'users', targetUid);

    const [voterSnap, targetSnap] = await Promise.all([getDoc(voterRef), getDoc(targetRef)]);
    if (!voterSnap.exists() || !targetSnap.exists()) {
      return { success: false, message: 'User profile not found.' };
    }

    const voter = voterSnap.data() as UserProfile;
    const target = targetSnap.data() as UserProfile;

    // Check 5-hour voting cooldown for this target user
    const lastVotedMap = voter.lastVotedMap || {};
    const lastVotedTime = lastVotedMap[targetUid] || 0;
    const elapsed = Date.now() - lastVotedTime;

    if (lastVotedTime > 0 && elapsed < VOTE_COOLDOWN_MS) {
      const remainingMs = VOTE_COOLDOWN_MS - elapsed;
      const hours = Math.floor(remainingMs / (3600 * 1000));
      const mins = Math.ceil((remainingMs % (3600 * 1000)) / (60 * 1000));
      return {
        success: false,
        message: `⏳ Voting Cooldown: You can vote for @${target.discordUser || target.displayName} again in ${hours}h ${mins}m! (1 vote allowed every 5 hours)`,
      };
    }

    const votedList = voter.votedUserIds || [];
    const updatedLastVotedMap = { ...lastVotedMap, [targetUid]: Date.now() };

    // Update voter's record
    await setDoc(
      voterRef,
      {
        votedUserIds: Array.from(new Set([...votedList, targetUid])),
        lastVotedMap: updatedLastVotedMap,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // Award +1 vote and +pointsPerVote points to target
    await setDoc(
      targetRef,
      {
        votes: (target.votes || 0) + 1,
        points: (target.points || 0) + pointsPerVote,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return {
      success: true,
      message: `🎉 Vote cast! @${target.discordUser || target.displayName} received +1 Vote and +${pointsPerVote.toLocaleString()} Points!`,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${targetUid}`);
    return { success: false, message: 'Failed to record vote. Please try again.' };
  }
}

// Staff Send Ticket / Pass to User (Fully Customizable)
export async function sendTicketToUser(
  targetUid: string,
  ticketData: {
    eventTitle: string;
    seatTier: string;
    ticketNumber?: string;
    accessLevel?: string;
    dressCode?: string;
    dateText?: string;
    timeText?: string;
    staffNote?: string;
  }
): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', targetUid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return false;

    const user = snap.data() as UserProfile;
    const existingTickets = user.tickets || [];
    const existingNotifs = user.notifications || [];

    const newTicket = {
      id: `ticket-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ticketNumber: ticketData.ticketNumber || `MJJ-PASS-${Math.floor(100000 + Math.random() * 900000)}`,
      eventTitle: ticketData.eventTitle || 'MJJ Records Official VIP Press Event',
      seatTier: ticketData.seatTier || 'VIP Front Row Access',
      accessLevel: ticketData.accessLevel || 'All Access & VIP Lounge',
      dressCode: ticketData.dressCode || 'Black Tie / Smart Casual',
      dateText: ticketData.dateText || new Date().toLocaleDateString(),
      timeText: ticketData.timeText || '8:00 PM EST',
      issuedAt: new Date().toISOString(),
      staffNote: ticketData.staffNote || 'Issued with compliments of the MJJ Records Authorisation Centre.',
    };

    const newNotif = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: 'New VIP Pass Granted',
      message: `You have been issued a VIP concert pass for "${newTicket.eventTitle}" (${newTicket.seatTier})!`,
      type: 'ticket' as const,
      issuedAt: new Date().toISOString(),
      read: false,
    };

    await setDoc(
      userRef,
      {
        tickets: [newTicket, ...existingTickets],
        notifications: [newNotif, ...existingNotifs],
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${targetUid}`);
    return false;
  }
}

// Staff Send Direct Reward Code to User
export async function sendCodeToUser(
  targetUid: string,
  codeData: { code: string; points: number; customMessage?: string }
): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', targetUid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return false;

    const user = snap.data() as UserProfile;
    const existingCodes = user.assignedCodes || [];
    const existingNotifs = user.notifications || [];

    const newAssigned = {
      id: `code-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      code: codeData.code.trim().toUpperCase(),
      points: Number(codeData.points) || 1000,
      customMessage: codeData.customMessage || 'Exclusive reward code granted by the Authorisation Centre.',
      issuedAt: new Date().toISOString(),
    };

    const newNotif = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: `Reward Code Granted (+${newAssigned.points} PTS)`,
      message: `Code "${newAssigned.code}" was sent to your inbox: "${newAssigned.customMessage}"`,
      type: 'code' as const,
      issuedAt: new Date().toISOString(),
      read: false,
    };

    await setDoc(
      userRef,
      {
        assignedCodes: [newAssigned, ...existingCodes],
        notifications: [newNotif, ...existingNotifs],
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${targetUid}`);
    return false;
  }
}

// Staff Delete User Account (Wipe from Database)
export async function deleteUserAccountInFirestore(targetUid: string): Promise<boolean> {
  if (!targetUid) return false;
  try {
    await deleteDoc(doc(db, 'users', targetUid));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${targetUid}`);
    return false;
  }
}

// Staff Adjust User Points directly
export async function adjustUserPoints(targetUid: string, pointDelta: number): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', targetUid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return false;

    const user = snap.data() as UserProfile;
    const currentPoints = user.points || 0;
    const nextPoints = Math.max(0, currentPoints + pointDelta);

    await setDoc(
      userRef,
      {
        points: nextPoints,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${targetUid}`);
    return false;
  }
}

// -------------------------------------------------------------
// 7. REAL-TIME GENERAL POINTS REWARD CODES (Universal & Limited)
// -------------------------------------------------------------

export interface GeneralPointsCode {
  id: string;
  code: string;
  points: number;
  isUniversal: boolean;
  maxRedemptions: number;
  redemptionsCount: number;
  claimedUserIds: string[];
  active: boolean;
  customNote?: string;
  createdAt: string;
}

export function subscribeGeneralCodes(callback: (codes: GeneralPointsCode[]) => void): () => void {
  const colRef = collection(db, 'generalCodes');
  return onSnapshot(
    colRef,
    (snap) => {
      const list: GeneralPointsCode[] = [];
      snap.forEach((d) => list.push(d.data() as GeneralPointsCode));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'generalCodes');
    }
  );
}

export async function createGeneralCodeFirestore(data: {
  code: string;
  points: number;
  isUniversal: boolean;
  maxRedemptions?: number;
  customNote?: string;
}): Promise<boolean> {
  const cleanCode = (data.code || `PTS-${Math.floor(100000 + Math.random() * 900000)}`).trim().toUpperCase();
  const id = `ptscode-${Date.now()}`;
  const codeDoc: GeneralPointsCode = {
    id,
    code: cleanCode,
    points: Math.max(10, Number(data.points) || 1000),
    isUniversal: !!data.isUniversal,
    maxRedemptions: data.isUniversal ? 999999 : Math.max(1, Number(data.maxRedemptions) || 1),
    redemptionsCount: 0,
    claimedUserIds: [],
    active: true,
    customNote: data.customNote || 'MJJ Records Community Points Reward',
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'generalCodes', id), codeDoc);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `generalCodes/${id}`);
    return false;
  }
}

export async function revokeGeneralCodeFirestore(id: string): Promise<boolean> {
  try {
    await setDoc(doc(db, 'generalCodes', id), { active: false }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `generalCodes/${id}`);
    return false;
  }
}

export async function deleteGeneralCodeFirestore(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'generalCodes', id));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `generalCodes/${id}`);
    return false;
  }
}

// Redeem either General Points Code OR Secret Discord Code
export async function redeemGeneralPointsCode(
  rawCode: string,
  userUid?: string,
  discordUser?: string
): Promise<{ success: boolean; pointsAwarded?: number; message?: string; error?: string }> {
  if (!rawCode?.trim()) {
    return { success: false, error: 'Please enter a code.' };
  }

  const cleanCode = rawCode.trim().toUpperCase();
  const cleanUser = userUid || discordUser?.trim() || 'anonymous';

  try {
    const codesSnap = await getDocs(collection(db, 'generalCodes'));
    let matchedCode: GeneralPointsCode | null = null;
    let targetDocId = '';

    for (const d of codesSnap.docs) {
      const c = d.data() as GeneralPointsCode;
      if (c.code?.toUpperCase() === cleanCode) {
        matchedCode = c;
        targetDocId = d.id;
        break;
      }
    }

    if (!matchedCode) {
      return { success: false, error: 'Code not found in Points database.' };
    }

    if (!matchedCode.active) {
      return { success: false, error: 'This points code has been revoked or expired.' };
    }

    if (!matchedCode.isUniversal && matchedCode.redemptionsCount >= matchedCode.maxRedemptions) {
      return { success: false, error: 'This points code has reached its maximum claim limit.' };
    }

    const claimedList = matchedCode.claimedUserIds || [];
    const hasClaimed =
      (userUid && claimedList.includes(userUid)) ||
      (discordUser && claimedList.includes(discordUser.toLowerCase()));

    if (hasClaimed) {
      return { success: false, error: 'You have already redeemed this points code!' };
    }

    // Increment redemption
    const newCount = (matchedCode.redemptionsCount || 0) + 1;
    const shouldDeactivate = !matchedCode.isUniversal && newCount >= matchedCode.maxRedemptions;
    const newClaimedList = [...claimedList, userUid || discordUser || 'user'];

    await setDoc(
      doc(db, 'generalCodes', targetDocId),
      {
        redemptionsCount: newCount,
        claimedUserIds: newClaimedList,
        active: !shouldDeactivate,
      },
      { merge: true }
    );

    // If userUid is known, add points directly to user's profile
    let pointsAwarded = matchedCode.points || 1000;
    if (userUid) {
      const userRef = doc(db, 'users', userUid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const u = userSnap.data() as UserProfile;
        await setDoc(
          userRef,
          {
            points: (u.points || 0) + pointsAwarded,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    }

    return {
      success: true,
      pointsAwarded,
      message: `🎉 Success! You unlocked +${pointsAwarded.toLocaleString()} Points! (${matchedCode.customNote || 'Reward Redeemed'})`,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'generalCodes');
    return { success: false, error: 'Failed to redeem points code. Please try again.' };
  }
}

// -------------------------------------------------------------
// 9. COMMUNITY CHALLENGES & FAN PHOTO CONTESTS (CRUD & REAL-TIME)
// -------------------------------------------------------------

export interface CommunityChallenge {
  id: string;
  title: string;
  description: string;
  category: 'photo' | 'headline' | 'trivia' | 'general';
  pointsReward: number;
  status: 'active' | 'closed';
  winnerEntryId?: string | null;
  winnerDiscord?: string | null;
  winnerUserId?: string | null;
  winnerCaption?: string | null;
  winnerImageUrl?: string | null;
  winnerPointsAwarded?: number;
  entriesCount?: number;
  createdAt: string;
  closedAt?: string | null;
}

export interface ChallengeEntry {
  id: string;
  challengeId: string;
  userId: string;
  discordUser: string;
  userDisplayName?: string;
  userPhotoURL?: string | null;
  caption: string;
  imageUrl?: string;
  votes: number;
  votedUserIds: string[];
  createdAt: string;
}

// Subscribe to all challenges
export function subscribeChallenges(callback: (challenges: CommunityChallenge[]) => void): () => void {
  const colRef = collection(db, 'challenges');
  return onSnapshot(
    colRef,
    (snap) => {
      const list: CommunityChallenge[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as CommunityChallenge);
      });
      // Sort: active challenges first, then newest
      list.sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (b.status === 'active' && a.status !== 'active') return 1;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'challenges');
    }
  );
}

// Subscribe to entries for a specific challenge
export function subscribeChallengeEntries(
  challengeId: string,
  callback: (entries: ChallengeEntry[]) => void
): () => void {
  if (!challengeId) {
    callback([]);
    return () => {};
  }
  const colRef = collection(db, 'challengeEntries');
  return onSnapshot(
    colRef,
    (snap) => {
      const list: ChallengeEntry[] = [];
      snap.forEach((d) => {
        const item = { id: d.id, ...d.data() } as ChallengeEntry;
        if (item.challengeId === challengeId) {
          list.push(item);
        }
      });
      // Sort by votes descending, then date
      list.sort((a, b) => (b.votes || 0) - (a.votes || 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'challengeEntries');
    }
  );
}

// Create new challenge in Firestore (from Auth Centre)
export async function createChallengeFirestore(
  data: Omit<CommunityChallenge, 'id' | 'createdAt' | 'entriesCount' | 'status'>
): Promise<string> {
  const id = `challenge-${Date.now()}`;
  const now = new Date().toISOString();
  const challengeDoc: CommunityChallenge = {
    ...data,
    id,
    status: 'active',
    entriesCount: 0,
    createdAt: now,
  };

  try {
    await setDoc(doc(db, 'challenges', id), challengeDoc);
    return id;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `challenges/${id}`);
    throw err;
  }
}

// Close or reopen a challenge
export async function setChallengeStatusFirestore(
  challengeId: string,
  status: 'active' | 'closed'
): Promise<boolean> {
  try {
    await setDoc(
      doc(db, 'challenges', challengeId),
      {
        status,
        closedAt: status === 'closed' ? new Date().toISOString() : null,
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `challenges/${challengeId}`);
    return false;
  }
}

// Submit a user entry for a challenge
export async function submitChallengeEntryFirestore(data: {
  challengeId: string;
  userId: string;
  discordUser: string;
  userDisplayName?: string;
  userPhotoURL?: string | null;
  caption: string;
  imageUrl?: string;
}): Promise<{ success: boolean; entryId?: string; error?: string }> {
  if (!data.challengeId || !data.discordUser?.trim()) {
    return { success: false, error: 'Challenge and Discord username are required.' };
  }

  const id = `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const entry: ChallengeEntry = {
    id,
    challengeId: data.challengeId,
    userId: data.userId || `user-${data.discordUser.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    discordUser: data.discordUser.trim(),
    userDisplayName: data.userDisplayName || data.discordUser.trim(),
    userPhotoURL: data.userPhotoURL || null,
    caption: data.caption?.trim() || 'Michael Jackson Community Submission',
    imageUrl: data.imageUrl || '',
    votes: 0,
    votedUserIds: [],
    createdAt: now,
  };

  try {
    await setDoc(doc(db, 'challengeEntries', id), entry);

    // Increment challenge entriesCount
    const chRef = doc(db, 'challenges', data.challengeId);
    const chSnap = await getDoc(chRef);
    if (chSnap.exists()) {
      const current = chSnap.data() as CommunityChallenge;
      await setDoc(
        chRef,
        { entriesCount: (current.entriesCount || 0) + 1 },
        { merge: true }
      );
    }

    return { success: true, entryId: id };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `challengeEntries/${id}`);
    return { success: false, error: 'Failed to submit challenge entry.' };
  }
}

// Vote for a challenge entry (each user votes once per entry, awards entrant points)
export async function voteForChallengeEntry(
  entryId: string,
  voterUid: string,
  voterDiscord?: string
): Promise<{ success: boolean; message: string; error?: string }> {
  if (!entryId || !voterUid) {
    return { success: false, message: '', error: 'Please sign in or enter your name to vote.' };
  }

  try {
    const configSnap = await getDoc(doc(db, 'system', 'votingConfig'));
    const pointsPerVote = configSnap.exists() ? Math.max(1, Number(configSnap.data().pointsPerVote) || 1000) : 1000;

    const entryRef = doc(db, 'challengeEntries', entryId);
    const snap = await getDoc(entryRef);
    if (!snap.exists()) {
      return { success: false, message: '', error: 'Entry not found.' };
    }

    const entry = snap.data() as ChallengeEntry;
    const votedList = entry.votedUserIds || [];

    const voterIdKey = voterUid.toLowerCase();
    const voterDiscordKey = voterDiscord ? voterDiscord.toLowerCase() : '';

    if (votedList.includes(voterIdKey) || (voterDiscordKey && votedList.includes(voterDiscordKey))) {
      return { success: false, message: '', error: 'You have already voted for this entry!' };
    }

    const newVotes = (entry.votes || 0) + 1;
    const newVotedList = [...votedList, voterIdKey];
    if (voterDiscordKey) newVotedList.push(voterDiscordKey);

    await setDoc(
      entryRef,
      {
        votes: newVotes,
        votedUserIds: newVotedList,
      },
      { merge: true }
    );

    // Reward entrant pointsPerVote points for each community vote!
    if (entry.userId) {
      const authorRef = doc(db, 'users', entry.userId);
      const authorSnap = await getDoc(authorRef);
      if (authorSnap.exists()) {
        const u = authorSnap.data() as UserProfile;
        await setDoc(
          authorRef,
          {
            points: (u.points || 0) + pointsPerVote,
            votes: (u.votes || 0) + 1,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    }

    return {
      success: true,
      message: `Vote counted for @${entry.discordUser}! (+1 Vote, +${pointsPerVote.toLocaleString()} PTS)`,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `challengeEntries/${entryId}`);
    return { success: false, message: '', error: 'Failed to cast vote.' };
  }
}

// Staff Authorisation: Declare Winner & Distribute Points Reward
export async function declareChallengeWinnerFirestore(
  challengeId: string,
  winnerEntry: ChallengeEntry,
  pointsReward: number
): Promise<{ success: boolean; message: string }> {
  try {
    const now = new Date().toISOString();
    const chRef = doc(db, 'challenges', challengeId);

    // 1. Mark challenge as closed with winner details
    await setDoc(
      chRef,
      {
        status: 'closed',
        winnerEntryId: winnerEntry.id,
        winnerDiscord: winnerEntry.discordUser,
        winnerUserId: winnerEntry.userId,
        winnerCaption: winnerEntry.caption,
        winnerImageUrl: winnerEntry.imageUrl || null,
        winnerPointsAwarded: pointsReward,
        closedAt: now,
      },
      { merge: true }
    );

    // 2. Award points to winner user profile
    let winnerCredited = false;
    if (winnerEntry.userId) {
      const userRef = doc(db, 'users', winnerEntry.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const u = userSnap.data() as UserProfile;
        await setDoc(
          userRef,
          {
            points: (u.points || 0) + pointsReward,
            updatedAt: now,
          },
          { merge: true }
        );
        winnerCredited = true;
      }
    }

    // Fallback: search users by discord handle if user wasn't credited directly by uid
    if (!winnerCredited && winnerEntry.discordUser) {
      const usersSnap = await getDocs(collection(db, 'users'));
      for (const d of usersSnap.docs) {
        const u = d.data() as UserProfile;
        const uDiscord = (u.discordUser || u.discordUsername || '').toLowerCase();
        if (uDiscord === winnerEntry.discordUser.toLowerCase()) {
          await setDoc(
            doc(db, 'users', d.id),
            {
              points: (u.points || 0) + pointsReward,
              updatedAt: now,
            },
            { merge: true }
          );
          break;
        }
      }
    }

    // 3. Post a public announcement ticker celebrating the winner!
    await addDoc(collection(db, 'announcements'), {
      text: `🏆 CONTEST WINNER: @${winnerEntry.discordUser} has won the community challenge and claimed +${pointsReward.toLocaleString()} PTS!`,
      active: true,
      createdAt: now,
    });

    return {
      success: true,
      message: `🏆 Winner declared! @${winnerEntry.discordUser} was awarded +${pointsReward.toLocaleString()} points!`,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `challenges/${challengeId}`);
    return { success: false, message: 'Failed to declare winner in Firestore.' };
  }
}

// Delete challenge and its entries
export async function deleteChallengeFirestore(challengeId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'challenges', challengeId));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `challenges/${challengeId}`);
    return false;
  }
}

// Foolproof community login / profile creator (supports direct Discord / display name when Google popup is blocked)
export async function loginOrCreateCommunityPlayer(
  discordUser: string,
  displayName?: string,
  photoURL?: string
): Promise<UserProfile> {
  const cleanDiscord = discordUser.trim().replace(/^@/, '');
  const cleanUid = `player_${cleanDiscord.toLowerCase().replace(/[^a-z0-9_]/g, '')}`;
  const now = new Date().toISOString();

  const userRef = doc(db, 'users', cleanUid);
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const existing = snap.data() as UserProfile;
      const updated: UserProfile = {
        ...existing,
        discordUser: cleanDiscord,
        discordUsername: cleanDiscord,
        displayName: displayName || existing.displayName || cleanDiscord,
        photoURL: photoURL || existing.photoURL || null,
        updatedAt: now,
      };
      await setDoc(userRef, updated, { merge: true });
      return updated;
    } else {
      const newProfile: UserProfile = {
        uid: cleanUid,
        email: null,
        displayName: displayName || cleanDiscord,
        discordUser: cleanDiscord,
        discordUsername: cleanDiscord,
        points: 1000, // Welcome gift of 1,000 points!
        votes: 0,
        photoURL: photoURL || null,
        reactedNewspaperIds: [],
        votedUserIds: [],
        tickets: [],
        assignedCodes: [],
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(userRef, newProfile);
      return newProfile;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${cleanUid}`);
    throw err;
  }
}

// Password-Protected Community Account Authentication
export async function loginOrCreateCommunityPlayerWithPassword(
  discordUser: string,
  passwordInput: string,
  displayName?: string,
  photoURL?: string
): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  const cleanDiscord = discordUser.trim().replace(/^@/, '');
  if (!cleanDiscord) {
    return { success: false, error: 'Please enter a valid Discord username or handle.' };
  }
  if (!passwordInput || !passwordInput.trim()) {
    return { success: false, error: 'Please enter your account password.' };
  }

  const cleanUid = `player_${cleanDiscord.toLowerCase().replace(/[^a-z0-9_]/g, '')}`;
  const now = new Date().toISOString();
  const userRef = doc(db, 'users', cleanUid);

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const existing = snap.data() as UserProfile;
      // If user already set a password, verify it
      if (existing.accountPassword && existing.accountPassword !== passwordInput.trim()) {
        return {
          success: false,
          error: `Incorrect password for @${cleanDiscord}. Please check your password and try again.`,
        };
      }

      // Update password & login
      const updated: UserProfile = {
        ...existing,
        discordUser: cleanDiscord,
        discordUsername: cleanDiscord,
        accountPassword: passwordInput.trim(),
        displayName: displayName || existing.displayName || cleanDiscord,
        photoURL: photoURL || existing.photoURL || null,
        updatedAt: now,
      };
      await setDoc(userRef, updated, { merge: true });
      return { success: true, profile: updated };
    } else {
      // Create new account with password
      const newProfile: UserProfile = {
        uid: cleanUid,
        email: null,
        displayName: displayName || cleanDiscord,
        discordUser: cleanDiscord,
        discordUsername: cleanDiscord,
        accountPassword: passwordInput.trim(),
        points: 1000, // Welcome gift of 1,000 points!
        votes: 0,
        photoURL: photoURL || null,
        reactedNewspaperIds: [],
        votedUserIds: [],
        lastVotedMap: {},
        tickets: [],
        assignedCodes: [],
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(userRef, newProfile);
      return { success: true, profile: newProfile };
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${cleanUid}`);
    return { success: false, error: 'Connection error logging into player account.' };
  }
}

// -------------------------------------------------------------
// 10. REAL-TIME VOTING CONFIG & POINTS PER VOTE
// -------------------------------------------------------------

export interface VotingConfig {
  pointsPerVote: number;
}

export function subscribeVotingConfig(callback: (config: VotingConfig) => void): () => void {
  const configRef = doc(db, 'system', 'votingConfig');
  return onSnapshot(
    configRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        callback({ pointsPerVote: Math.max(1, Number(data.pointsPerVote) || 1000) });
      } else {
        // Default 1000 points per vote
        callback({ pointsPerVote: 1000 });
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'system/votingConfig');
      callback({ pointsPerVote: 1000 });
    }
  );
}

export async function setPointsPerVoteInFirestore(points: number): Promise<boolean> {
  const safePoints = Math.max(1, Math.round(Number(points) || 1000));
  try {
    await setDoc(doc(db, 'system', 'votingConfig'), { pointsPerVote: safePoints }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'system/votingConfig');
    return false;
  }
}


