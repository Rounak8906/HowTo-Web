// Data types for HowTo-Web

export type UserRole = 'teacher' | 'learner' | 'creator';

export interface RoleDetails {
  label: string;
  title: string;
  network: string;
  icon: string;
  desc: string;
}

export const ROLE_INFO: Record<UserRole, RoleDetails> = {
  teacher: {
    label: 'Teacher',
    title: 'Teacher',
    network: 'Teachers Network',
    icon: '🎓',
    desc: 'Educators, professors, tutors & instructors creating interactive lessons and course material.',
  },
  learner: {
    label: 'Learner',
    title: 'Learner',
    network: 'Learners Network',
    icon: '📚',
    desc: 'Students, researchers & knowledge seekers exploring, learning, and remixing presentations.',
  },
  creator: {
    label: 'Creator',
    title: 'Creator',
    network: 'Creator Network',
    icon: '💡',
    desc: 'Builders, tech speakers & innovators designing dynamic presentation experiences.',
  },
};

export interface User {
  uid: string;
  displayName: string;
  username: string; // e.g. '@abc123'
  email: string;
  photoURL: string | null;
  role?: UserRole;
  creatorScore?: number;
  likesReceived?: number;
  forksReceived?: number;
  following?: string[]; // Array of user UIDs this user follows
  followers?: string[]; // Array of user UIDs who follow this user
  followingCount?: number;
  followersCount?: number;
  createdAt: number;
}

export type SlideElementType = 'text' | 'image' | 'shape' | 'table' | 'code' | 'excalidraw' | 'drawing';

export interface SlideElement {
  id: string;
  type: SlideElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string; // text content, image URL, code, SVG string, or description
  style: Record<string, string>;
  shapeType?: 'rect' | 'circle' | 'arrow' | 'callout' | 'star' | 'cylinder' | 'cube' | 'diamond' | 'hexagon' | 'sticky';
  shapeRealisticStyle?: 'shaded' | 'glass' | 'glossy' | 'neumorphic' | 'metallic';
  tableData?: {
    rows: string[][];
  };
  // Excalidraw native slide component data
  excalidrawElements?: any[]; // Raw elements for 100% full re-editing
  excalidrawAppState?: any; // App state (theme, background, viewMode)
  excalidrawFiles?: any; // Embedded files
  diagramName?: string; // Name/title of the diagram component
}

export interface Resource {
  id: string;
  type: 'note' | 'image' | 'video' | 'audio' | 'document' | 'code' | 'link' | 'archive' | 'excalidraw' | 'other';
  name: string;
  url?: string; // Firebase Storage URL or external link
  content?: string; // For notes (text content), code (file content), or SVG string
  mimeType?: string;
  size?: number;
  createdAt: number;
  updatedAt?: number;
  excalidrawElements?: any[]; // For whiteboard resource files
}

export interface Slide {
  id: string;
  order: number;
  elements: SlideElement[];
  background: {
    type: 'color' | 'gradient' | 'image';
    value: string;
  };
  resources: Resource[];
  notes: Resource[]; // Notes are separated for easier access
}

export interface ForkInfo {
  originalId: string;
  originalOwnerId: string;
  originalOwnerName: string;
  originalOwnerUsername?: string;
  originalTitle: string;
  forkedAt?: number;
  baseVersion: number;
  lastSyncedVersion: number;
}

export interface Presentation {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  ownerName: string;
  ownerUsername?: string;
  ownerRole?: UserRole;
  ownerPhoto: string | null;
  visibility: 'private' | 'public';
  version: number;
  createdAt: number;
  updatedAt: number;
  slideOrder: string[];
  slides: Slide[];
  forkOf: ForkInfo | null;
  forkCount: number;
  likesCount?: number;
  likedBy?: string[];
}

// For creating a new presentation
export interface CreatePresentationData {
  title: string;
  description?: string;
  visibility?: 'private' | 'public';
}

// Editor state
export interface EditorState {
  presentationId: string;
  currentSlideIndex: number;
  dividerPosition: number; // percentage for the main panel (e.g., 70)
  isPresenting: boolean;
  selectedElementId: string | null;
  isDraggingDivider: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}
