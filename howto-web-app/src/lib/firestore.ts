import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  writeBatch,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from './firebase';
import { generateId } from './utils';
import type { Presentation, Slide, Resource, CreatePresentationData, ForkInfo, User, UserRole } from './types';

// Helper to recursively strip undefined values so Firestore never rejects data
export function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (key, value) => (value === undefined ? null : value))
  );
}

// Convert base64 data URL to Blob for cloud storage upload
export function dataURLtoBlob(dataUrl: string): Blob | null {
  try {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/webp';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (err) {
    console.warn('Failed to convert dataURL to Blob:', err);
    return null;
  }
}

// ─── Presentation CRUD ───────────────────────────────────────

export async function createPresentation(
  userId: string,
  userName: string,
  userPhoto: string | null,
  data: CreatePresentationData,
  ownerUsername?: string
): Promise<Presentation> {
  const id = generateId();
  const now = Date.now();

  // Clean empty starter slide (no annoying automated heading)
  const defaultSlide: Slide = {
    id: generateId(),
    order: 0,
    elements: [],
    background: { type: 'color', value: '#1a1f35' },
    resources: [],
    notes: [],
  };

  const presentation: Presentation = {
    id,
    title: data.title,
    description: data.description || '',
    ownerId: userId,
    ownerName: userName,
    ownerPhoto: userPhoto,
    ownerUsername: ownerUsername || (data as any).ownerUsername || undefined,
    visibility: data.visibility || 'private',
    version: 1,
    createdAt: now,
    updatedAt: now,
    slideOrder: [defaultSlide.id],
    slides: [defaultSlide],
    forkOf: null,
    forkCount: 0,
  };

  const payload: any = sanitizeForFirestore(presentation);
  await setDoc(doc(db, 'presentations', id), payload);
  return presentation;
}

export async function getPresentation(id: string): Promise<Presentation | null> {
  const snap = await getDoc(doc(db, 'presentations', id));
  if (!snap.exists()) return null;
  const data = snap.data() as any;

  let slides = data.slides || [];

  // 1. Restore from subcollection chunks if presentation exceeded document limit
  if (data.hasSlideChunks) {
    try {
      const chunksSnap = await getDocs(
        query(collection(db, 'presentations', id, 'slides_chunks'), orderBy('chunkIndex', 'asc'))
      );
      const combinedSlides: Slide[] = [];
      chunksSnap.forEach((cDoc) => {
        const cData = cDoc.data();
        if (Array.isArray(cData.slides)) {
          combinedSlides.push(...cData.slides);
        }
      });
      if (combinedSlides.length > 0) {
        slides = combinedSlides;
      }
    } catch (err) {
      console.warn('Failed to load slide chunks from subcollection:', err);
    }
  } else if (data.slidesJson) {
    // Backward compatibility for legacy docs
    try {
      slides = JSON.parse(data.slidesJson);
    } catch {
      slides = data.slides || [];
    }
  }

  // Restore table rows if serialized as pipe-separated strings
  if (Array.isArray(slides)) {
    slides = slides.map((slide: any) => ({
      ...slide,
      elements: (slide.elements || []).map((el: any) => {
        if (el.tableData?.rows && Array.isArray(el.tableData.rows)) {
          return {
            ...el,
            tableData: {
              ...el.tableData,
              rows: el.tableData.rows.map((row: any) =>
                typeof row === 'string' ? row.split('|||') : row
              ),
            },
          };
        }
        return el;
      }),
    }));
  }

  return {
    ...data,
    slides: slides || [],
  } as Presentation;
}

export async function getUserPresentations(userId: string): Promise<Presentation[]> {
  const q = query(
    collection(db, 'presentations'),
    where('ownerId', '==', userId)
  );
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => {
    const data = d.data() as any;
    if (data.slidesJson && !data.hasSlideChunks) {
      try {
        data.slides = JSON.parse(data.slidesJson);
      } catch {}
    }
    return data as Presentation;
  });
  return items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export async function getPublicPresentations(): Promise<Presentation[]> {
  try {
    const q = query(
      collection(db, 'presentations'),
      where('visibility', '==', 'public')
    );
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => {
      const data = d.data() as any;
      if (data.slidesJson && !data.hasSlideChunks) {
        try {
          data.slides = JSON.parse(data.slidesJson);
        } catch {}
      }
      return data as Presentation;
    });
    return items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch (err) {
    console.error('Failed to fetch public presentations:', err);
    return [];
  }
}

export async function updatePresentation(
  id: string,
  data: Partial<Presentation>
): Promise<void> {
  await updateDoc(doc(db, 'presentations', id), sanitizeForFirestore({
    ...data,
    updatedAt: Date.now(),
  }));
}

export async function deletePresentation(id: string): Promise<void> {
  try {
    const chunksSnap = await getDocs(collection(db, 'presentations', id, 'slides_chunks'));
    const batch = writeBatch(db);
    chunksSnap.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(db, 'presentations', id));
    await batch.commit();
  } catch {
    await deleteDoc(doc(db, 'presentations', id));
  }
}

export async function saveSlides(
  presentationId: string,
  slides: Slide[],
  slideOrder: string[]
): Promise<void> {
  const cleanSlides = sanitizeForFirestore(slides);
  const now = Date.now();

  // 1. Instant local persistence (< 1ms)
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        `pres_${presentationId}_cache`,
        JSON.stringify({
          slides: cleanSlides,
          slideOrder,
          updatedAt: now,
        })
      );
    }
  } catch (e) {
    console.warn('LocalStorage backup quota reached or unavailable:', e);
  }

  // 2. Offload any heavy base64 data URLs to Firebase Storage (converts ~600KB base64 strings to ~100B URLs)
  for (let sIdx = 0; sIdx < cleanSlides.length; sIdx++) {
    const slide = cleanSlides[sIdx];
    for (let eIdx = 0; eIdx < (slide.elements || []).length; eIdx++) {
      const el = slide.elements[eIdx];
      if (
        el.type === 'image' &&
        typeof el.content === 'string' &&
        el.content.startsWith('data:image/')
      ) {
        const blob = dataURLtoBlob(el.content);
        if (blob) {
          try {
            const path = `presentations/${presentationId}/${slide.id}/${el.id}_${Date.now()}.webp`;
            const storageRef = ref(storage, path);
            await uploadBytes(storageRef, blob);
            const downloadUrl = await getDownloadURL(storageRef);
            el.content = downloadUrl;
          } catch (storageErr) {
            console.warn('Could not offload base64 image to Storage, keeping inline:', storageErr);
          }
        }
      }
    }
  }

  // 3. Flatten 2D table arrays so Firestore never rejects
  const safeSlides = cleanSlides.map((slide) => ({
    ...slide,
    elements: (slide.elements || []).map((el) => {
      if (el.tableData && Array.isArray(el.tableData.rows)) {
        return {
          ...el,
          tableData: {
            ...el.tableData,
            rows: el.tableData.rows.map((row) => (Array.isArray(row) ? row.join('|||') : row)),
          },
        };
      }
      return el;
    }),
  }));

  // 4. Calculate estimated size to guarantee never exceeding 1,048,576 bytes
  const estimatedSize = new Blob([JSON.stringify(safeSlides)]).size;
  const CHUNK_SIZE_THRESHOLD = 650000; // 650 KB (well below the 1MB Firestore limit)

  if (estimatedSize > CHUNK_SIZE_THRESHOLD) {
    // Break into chunks of slides and write to subcollection
    const batch = writeBatch(db);
    const CHUNK_SLIDE_COUNT = 4;
    const totalChunks = Math.ceil(safeSlides.length / CHUNK_SLIDE_COUNT);

    for (let c = 0; c < totalChunks; c++) {
      const chunkSlides = safeSlides.slice(c * CHUNK_SLIDE_COUNT, (c + 1) * CHUNK_SLIDE_COUNT);
      const chunkRef = doc(db, 'presentations', presentationId, 'slides_chunks', `chunk_${c}`);
      batch.set(chunkRef, {
        chunkIndex: c,
        slides: chunkSlides,
        updatedAt: now,
      });
    }

    // Update main presentation document without the bloated slides array
    const presDocRef = doc(db, 'presentations', presentationId);
    batch.update(presDocRef, {
      hasSlideChunks: true,
      totalChunks,
      slideOrder,
      slides: [], // Keep main doc lightweight
      slidesJson: deleteField(), // Strip legacy bloated field
      updatedAt: now,
    });

    await batch.commit();
  } else {
    // Normal save: single document update, strictly without duplicate slidesJson
    await updateDoc(doc(db, 'presentations', presentationId), {
      slides: safeSlides,
      hasSlideChunks: false,
      slidesJson: deleteField(), // Always remove duplicate field to cut size in half!
      slideOrder,
      updatedAt: now,
    });
  }
}

// ─── File Upload ─────────────────────────────────────────────

export async function uploadResource(
  presentationId: string,
  slideId: string,
  file: File
): Promise<{ url: string; path: string }> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `presentations/${presentationId}/${slideId}/${Date.now()}_${safeName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { url, path };
}

/**
 * Upload with a reliable timeout (default 15,000ms) to allow PDFs and images to upload properly while preventing infinite hangs.
 */
export async function uploadResourceWithTimeout(
  presentationId: string,
  slideId: string,
  file: File,
  timeoutMs: number = 15000
): Promise<{ url: string; path: string }> {
  const uploadPromise = uploadResource(presentationId, slideId, file);
  const timeoutPromise = new Promise<{ url: string; path: string }>((_, reject) =>
    setTimeout(() => reject(new Error('Storage upload timed out')), timeoutMs)
  );
  return Promise.race([uploadPromise, timeoutPromise]);
}

export async function deleteResource(storagePath: string): Promise<void> {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn('Failed to delete storage object:', err);
  }
}

// ─── Fork System ─────────────────────────────────────────────

export async function forkPresentation(
  originalId: string,
  userId: string,
  userName: string,
  userPhoto: string | null,
  userUsername?: string
): Promise<Presentation> {
  const original = await getPresentation(originalId);
  if (!original) throw new Error('Original presentation not found');
  if (original.visibility === 'private' && original.ownerId !== userId) {
    throw new Error('Cannot fork a private presentation');
  }

  // Ensure original owner's username is resolved for attribution
  let originalOwnerUsername = original.ownerUsername;
  if (!originalOwnerUsername && original.ownerId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', original.ownerId));
      if (userDoc.exists()) {
        const uData = userDoc.data();
        if (uData?.username) originalOwnerUsername = uData.username;
      }
    } catch {}
  }

  const id = generateId();
  const now = Date.now();

  const forkInfo: ForkInfo = {
    originalId: original.id,
    originalOwnerId: original.ownerId,
    originalOwnerName: original.ownerName,
    originalOwnerUsername: originalOwnerUsername || undefined,
    originalTitle: original.title,
    forkedAt: now,
    baseVersion: original.version || 1,
    lastSyncedVersion: original.version || 1,
  };

  // Deep copy slides with new IDs
  const newSlides = original.slides.map((slide) => ({
    ...slide,
    id: generateId(),
    resources: slide.resources.map((r) => ({ ...r, id: generateId() })),
    notes: slide.notes.map((n) => ({ ...n, id: generateId() })),
  }));

  const fork: Presentation = {
    id,
    title: `${original.title} — ${userName}'s Fork`,
    description: original.description,
    ownerId: userId,
    ownerName: userName,
    ownerUsername: userUsername || undefined,
    ownerPhoto: userPhoto,
    visibility: 'private',
    version: 1,
    createdAt: now,
    updatedAt: now,
    slideOrder: newSlides.map((s) => s.id),
    slides: newSlides,
    forkOf: forkInfo,
    forkCount: 0,
  };

  // Save fork, increment original's fork count, and award +25 Creator Points to original author
  const batch = writeBatch(db);
  batch.set(doc(db, 'presentations', id), fork);
  batch.update(doc(db, 'presentations', originalId), {
    forkCount: increment(1),
  });

  if (original.ownerId && original.ownerId !== userId) {
    batch.update(doc(db, 'users', original.ownerId), {
      creatorScore: increment(25),
      forksReceived: increment(1),
    });
  }

  await batch.commit();

  return fork;
}

export async function checkForUpdates(forkId: string): Promise<{
  hasUpdates: boolean;
  originalVersion: number;
  forkVersion: number;
} | null> {
  const fork = await getPresentation(forkId);
  if (!fork || !fork.forkOf) return null;

  const original = await getPresentation(fork.forkOf.originalId);
  if (!original) return null;

  return {
    hasUpdates: original.version > fork.forkOf.lastSyncedVersion,
    originalVersion: original.version,
    forkVersion: fork.forkOf.lastSyncedVersion,
  };
}

export async function pullUpdates(forkId: string): Promise<{
  success: boolean;
  conflicts: Array<{ slideIndex: number; field: string }>;
}> {
  const fork = await getPresentation(forkId);
  if (!fork || !fork.forkOf) {
    return { success: false, conflicts: [] };
  }

  const original = await getPresentation(fork.forkOf.originalId);
  if (!original) {
    return { success: false, conflicts: [] };
  }

  // Simple merge: for slides that haven't been modified in the fork,
  // take the original's version. For modified slides, flag as conflict.
  const conflicts: Array<{ slideIndex: number; field: string }> = [];

  // For MVP: Replace non-conflicting slides, keep fork's changes where conflicts exist
  const mergedSlides = original.slides.map((origSlide, index) => {
    const forkSlide = fork.slides[index];
    if (!forkSlide) {
      // New slide in original, add it
      return { ...origSlide, id: generateId() };
    }

    // Check if fork modified this slide (simple content comparison)
    const origElements = JSON.stringify(origSlide.elements);
    const forkElements = JSON.stringify(forkSlide.elements);

    if (origElements !== forkElements) {
      // Both modified — conflict
      conflicts.push({ slideIndex: index, field: 'content' });
      return forkSlide; // Keep fork's version for now
    }

    // Not modified in fork, take original's version
    return { ...origSlide, id: forkSlide.id };
  });

  // Update fork
  await updatePresentation(forkId, {
    slides: mergedSlides,
    slideOrder: mergedSlides.map((s) => s.id),
    forkOf: {
      ...fork.forkOf,
      lastSyncedVersion: original.version,
    },
  });

  return { success: true, conflicts };
}

// ─── Username & Creator Search ───────────────────────────────

export function normalizeUsername(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  return cleaned ? `@${cleaned}` : '';
}

export async function checkUsernameAvailable(
  username: string,
  currentUserId?: string
): Promise<boolean> {
  const norm = normalizeUsername(username);
  if (!norm || norm.length < 4) return false;

  const q = query(
    collection(db, 'users'),
    where('username', '==', norm)
  );
  const snap = await getDocs(q);
  if (snap.empty) return true;

  if (currentUserId && snap.docs[0].data().uid === currentUserId) {
    return true;
  }
  return false;
}

export async function updateUserUsername(
  userId: string,
  rawUsername: string
): Promise<{ success: boolean; error?: string }> {
  const norm = normalizeUsername(rawUsername);
  if (!norm || norm.length < 4) {
    return { success: false, error: 'Username must be at least 3 characters (e.g. @abc123)' };
  }

  const isAvailable = await checkUsernameAvailable(norm, userId);
  if (!isAvailable) {
    return { success: false, error: `Username ${norm} is already taken. Please choose another.` };
  }

  await updateDoc(doc(db, 'users', userId), {
    username: norm,
  });

  return { success: true };
}

export async function searchUsersByUsername(searchQuery: string): Promise<User[]> {
  const norm = searchQuery.trim().toLowerCase().replace(/^@/, '');
  if (!norm) return [];

  const snap = await getDocs(collection(db, 'users'));
  const allUsers = snap.docs.map((d) => d.data() as User);

  return allUsers.filter((u) => {
    const uName = (u.username || '').toLowerCase();
    const dName = (u.displayName || '').toLowerCase();
    return uName.includes(norm) || dName.includes(norm);
  });
}

export async function getPublicPresentationsByUserId(userId: string): Promise<Presentation[]> {
  try {
    const q = query(
      collection(db, 'presentations'),
      where('ownerId', '==', userId),
      where('visibility', '==', 'public')
    );
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => {
      const data = d.data() as any;
      if (data.slidesJson && !data.hasSlideChunks) {
        try {
          data.slides = JSON.parse(data.slidesJson);
        } catch {}
      }
      return data as Presentation;
    });
    return items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch (err) {
    console.error('Failed to get public presentations for user:', err);
    return [];
  }
}

export async function getFeaturedCreators(limitCount = 12): Promise<User[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const users = snap.docs.map((d) => d.data() as User);
    return users
      .filter((u) => Boolean(u.username))
      .sort((a, b) => (b.creatorScore || 0) - (a.creatorScore || 0) || (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, limitCount);
  } catch (err) {
    console.error('Failed to get featured creators:', err);
    return [];
  }
}

export async function toggleLikePresentation(
  presentationId: string,
  userId: string
): Promise<{ liked: boolean; likesCount: number; creatorScoreDelta: number }> {
  const presRef = doc(db, 'presentations', presentationId);
  const presSnap = await getDoc(presRef);
  if (!presSnap.exists()) throw new Error('Presentation not found');

  const presData = presSnap.data() as Presentation;
  const likedBy = presData.likedBy || [];
  const isCurrentlyLiked = likedBy.includes(userId);
  const ownerId = presData.ownerId;

  const batch = writeBatch(db);

  if (isCurrentlyLiked) {
    // Unlike: remove userId, decrement likesCount
    batch.update(presRef, {
      likedBy: arrayRemove(userId),
      likesCount: increment(-1),
    });
    // Deduct 10 points from presentation author if not self-like
    if (ownerId && ownerId !== userId) {
      batch.update(doc(db, 'users', ownerId), {
        creatorScore: increment(-10),
        likesReceived: increment(-1),
      });
    }
    await batch.commit();
    return {
      liked: false,
      likesCount: Math.max(0, (presData.likesCount || 1) - 1),
      creatorScoreDelta: -10,
    };
  } else {
    // Like: add userId, increment likesCount
    batch.update(presRef, {
      likedBy: arrayUnion(userId),
      likesCount: increment(1),
    });
    // Award 10 points to presentation author if not self-like
    if (ownerId && ownerId !== userId) {
      batch.update(doc(db, 'users', ownerId), {
        creatorScore: increment(10),
        likesReceived: increment(1),
      });
    }
    await batch.commit();
    return {
      liked: true,
      likesCount: (presData.likesCount || 0) + 1,
      creatorScoreDelta: 10,
    };
  }
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateDoc(doc(db, 'users', userId), { role });
    return { success: true };
  } catch (err: any) {
    console.error('Failed to update user role:', err);
    return { success: false, error: err?.message || 'Failed to update role' };
  }
}

export async function toggleFollowUser(
  currentUserId: string,
  targetUserId: string
): Promise<{ following: boolean }> {
  if (currentUserId === targetUserId) {
    throw new Error('You cannot follow yourself');
  }

  const currentUserRef = doc(db, 'users', currentUserId);
  const targetUserRef = doc(db, 'users', targetUserId);

  const currentUserSnap = await getDoc(currentUserRef);
  if (!currentUserSnap.exists()) throw new Error('Current user not found');

  const currentUserData = currentUserSnap.data() as User;
  const followingList = currentUserData.following || [];
  const isCurrentlyFollowing = followingList.includes(targetUserId);

  const batch = writeBatch(db);

  if (isCurrentlyFollowing) {
    // Unfollow
    batch.update(currentUserRef, {
      following: arrayRemove(targetUserId),
      followingCount: increment(-1),
    });
    batch.update(targetUserRef, {
      followers: arrayRemove(currentUserId),
      followersCount: increment(-1),
      creatorScore: increment(-15),
    });
    await batch.commit();
    return { following: false };
  } else {
    // Follow
    batch.update(currentUserRef, {
      following: arrayUnion(targetUserId),
      followingCount: increment(1),
    });
    batch.update(targetUserRef, {
      followers: arrayUnion(currentUserId),
      followersCount: increment(1),
      creatorScore: increment(15),
    });
    await batch.commit();
    return { following: true };
  }
}

export async function getFollowedUsers(userId: string): Promise<User[]> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return [];

    const data = snap.data() as User;
    const followingIds = data.following || [];
    if (followingIds.length === 0) return [];

    const userDocs = await Promise.all(
      followingIds.map((id) => getDoc(doc(db, 'users', id)))
    );

    const followedUsers: User[] = [];
    for (const d of userDocs) {
      if (d.exists()) {
        followedUsers.push(d.data() as User);
      }
    }

    return followedUsers.sort((a, b) => (b.creatorScore || 0) - (a.creatorScore || 0));
  } catch (err) {
    console.error('Failed to get followed users:', err);
    return [];
  }
}


