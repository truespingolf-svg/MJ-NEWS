import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
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

    const publishedRecord = {
      id: submission.project.id || `project-${Date.now()}`,
      projectId: submission.project.id || `project-${Date.now()}`,
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

    // Update published record and remove from moderation submissions
    await setDoc(doc(db, 'system', 'publishedNewspaper'), publishedRecord);
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

  const publishedRecord = {
    id: project.id || `project-${Date.now()}`,
    projectId: project.id || `project-${Date.now()}`,
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
    }
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'system/publishedNewspaper');
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
      snap.forEach((d) => list.push(d.data()));
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
  try {
    await deleteDoc(doc(db, 'announcements', id));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `announcements/${id}`);
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

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  discordUser: string;
  discordUsername?: string;
  points: number;
  votes: number;
  photoURL: string | null;
  reactedNewspaperIds: string[];
  votedUserIds: string[];
  tickets: UserTicketGrant[];
  assignedCodes: UserAssignedCode[];
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

    let pointsAwarded = 0;
    let newPoints = profile.points || 0;
    const updatedReacted = [...reactedList];

    if (!alreadyReacted) {
      pointsAwarded = 1000;
      newPoints += 1000;
      updatedReacted.push(newspaperId);
    }

    await setDoc(
      userRef,
      {
        points: newPoints,
        reactedNewspaperIds: updatedReacted,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // Also update global newspaper reactions counter
    const rxRef = doc(db, 'reactions', newspaperId);
    const rxSnap = await getDoc(rxRef);
    const currentCounts = rxSnap.exists() ? rxSnap.data() : {};
    const count = (currentCounts[reactionEmoji] || 0) + 1;
    await setDoc(rxRef, { ...currentCounts, [reactionEmoji]: count }, { merge: true });

    return {
      success: true,
      pointsAwarded,
      message: alreadyReacted
        ? `Reaction ${reactionEmoji} recorded!`
        : `🎉 You reacted with ${reactionEmoji} and earned +1,000 Points!`,
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

// Upvote / vote for player (+1 vote and +1,000 points to target player)
export async function voteForUser(
  voterUid: string,
  targetUid: string
): Promise<{ success: boolean; message: string }> {
  if (!voterUid) {
    return { success: false, message: 'Please sign in with Google to vote for community members.' };
  }
  if (voterUid === targetUid) {
    return { success: false, message: 'You cannot vote for yourself!' };
  }

  try {
    const voterRef = doc(db, 'users', voterUid);
    const targetRef = doc(db, 'users', targetUid);

    const [voterSnap, targetSnap] = await Promise.all([getDoc(voterRef), getDoc(targetRef)]);
    if (!voterSnap.exists() || !targetSnap.exists()) {
      return { success: false, message: 'User profile not found.' };
    }

    const voter = voterSnap.data() as UserProfile;
    const target = targetSnap.data() as UserProfile;

    const votedList = voter.votedUserIds || [];
    if (votedList.includes(targetUid)) {
      return { success: false, message: `You have already voted for @${target.discordUser || target.displayName}!` };
    }

    // Update voter's record
    await setDoc(
      voterRef,
      {
        votedUserIds: [...votedList, targetUid],
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // Award +1 vote and +1,000 points to target
    await setDoc(
      targetRef,
      {
        votes: (target.votes || 0) + 1,
        points: (target.points || 0) + 1000,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return {
      success: true,
      message: `🎉 Vote cast! @${target.discordUser || target.displayName} received +1 Vote and +1,000 Points!`,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${targetUid}`);
    return { success: false, message: 'Failed to record vote. Please try again.' };
  }
}

// Staff Send Ticket / Pass to User
export async function sendTicketToUser(
  targetUid: string,
  ticketData: { eventTitle: string; seatTier: string; staffNote?: string }
): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', targetUid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return false;

    const user = snap.data() as UserProfile;
    const existingTickets = user.tickets || [];

    const newTicket: UserTicketGrant = {
      id: `ticket-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ticketNumber: `MJJ-PASS-${Math.floor(100000 + Math.random() * 900000)}`,
      eventTitle: ticketData.eventTitle || 'MJJ Records Official VIP Press Event',
      seatTier: ticketData.seatTier || 'VIP Front Row Access',
      issuedAt: new Date().toISOString(),
      staffNote: ticketData.staffNote || 'Issued with compliments of the MJJ Records Authorisation Centre.',
    };

    await setDoc(
      userRef,
      {
        tickets: [newTicket, ...existingTickets],
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

    const newAssigned: UserAssignedCode = {
      id: `code-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      code: codeData.code.trim().toUpperCase(),
      points: Number(codeData.points) || 1000,
      customMessage: codeData.customMessage || 'Exclusive reward code granted by the Authorisation Centre.',
      issuedAt: new Date().toISOString(),
    };

    await setDoc(
      userRef,
      {
        assignedCodes: [newAssigned, ...existingCodes],
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

