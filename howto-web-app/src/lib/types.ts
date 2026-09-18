// Data types for HowTo-Web

export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  createdAt: number;
}

export type SlideElementType = 'text' | 'image' | 'shape' | 'table' | 'code' | 'excalidraw';

export interface SlideElement {
  id: string;
  type: SlideElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string; // text content, image URL, code, SVG string, or description
  style: Record<string, string>;
  shapeType?: 'rect' | 'circle' | 'arrow' | 'callout' | 'star';
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
  originalTitle: string;
  baseVersion: number;
  lastSyncedVersion: number;
}

export interface Presentation {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  ownerName: string;
  ownerPhoto: string | null;
  visibility: 'private' | 'public';
  version: number;
  createdAt: number;
  updatedAt: number;
  slideOrder: string[];
  slides: Slide[];
  forkOf: ForkInfo | null;
  forkCount: number;
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
