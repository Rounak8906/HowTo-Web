import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Firestore collection/document path helpers
export const COLLECTIONS = {
  USERS: 'users',
  PRESENTATIONS: 'presentations',
  SLIDES: 'slides',
} as const;

// File type detection and categorization
export type ResourceType = 'note' | 'image' | 'video' | 'audio' | 'document' | 'code' | 'link' | 'archive' | 'excalidraw' | 'other';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv'];
const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'];
const DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'ppt', 'pptx', 'xls', 'xlsx', 'csv'];
const CODE_EXTENSIONS = ['html', 'css', 'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'go', 'rb', 'php', 'swift', 'kt', 'rs', 'json', 'xml', 'yaml', 'yml', 'md', 'sql', 'sh', 'bash'];
const ARCHIVE_EXTENSIONS = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];

export function getResourceType(filename: string): ResourceType {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (ext === 'excalidraw') return 'excalidraw';
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video';
  if (AUDIO_EXTENSIONS.includes(ext)) return 'audio';
  if (DOCUMENT_EXTENSIONS.includes(ext)) return 'document';
  if (CODE_EXTENSIONS.includes(ext)) return 'code';
  if (ARCHIVE_EXTENSIONS.includes(ext)) return 'archive';
  return 'other';
}

export function getResourceIcon(type: ResourceType): string {
  switch (type) {
    case 'note': return '📝';
    case 'excalidraw': return '✏️';
    case 'image': return '🖼';
    case 'video': return '🎥';
    case 'audio': return '🎵';
    case 'document': return '📕';
    case 'code': return '📄';
    case 'link': return '🔗';
    case 'archive': return '📦';
    default: return '📎';
  }
}

export function getResourceActions(type: ResourceType): string[] {
  switch (type) {
    case 'excalidraw': return ['Open', 'Edit'];
    case 'image': return ['View'];
    case 'video': return ['Play'];
    case 'audio': return ['Play'];
    case 'document': return ['Open'];
    case 'code': return ['View', 'Run'];
    case 'link': return ['Open'];
    default: return ['Download'];
  }
}

export function canRunInBrowser(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return ['html', 'htm'].includes(ext);
}

export function getCodeLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    py: 'python', java: 'java', c: 'c', cpp: 'cpp', cs: 'csharp',
    go: 'go', rb: 'ruby', php: 'php', swift: 'swift', kt: 'kotlin',
    rs: 'rust', html: 'html', css: 'css', json: 'json', xml: 'xml',
    yaml: 'yaml', yml: 'yaml', md: 'markdown', sql: 'sql', sh: 'bash',
    bash: 'bash', txt: 'text',
  };
  return map[ext] || 'text';
}

// Generate unique IDs
export function generateId(): string {
  return crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Format date for display
export function formatDate(date: Date | number | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Clamp a number between min and max
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Adjust hex color brightness for realistic lighting
export function adjustColor(color: string, percent: number): string {
  if (!color || !color.startsWith('#')) return color;
  let hex = color.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(hex, 16);
  if (isNaN(num)) return color;
  let r = (num >> 16);
  let g = ((num >> 8) & 0x00ff);
  let b = (num & 0x0000ff);

  if (percent > 0) {
    r += Math.round((255 - r) * (percent / 100));
    g += Math.round((255 - g) * (percent / 100));
    b += Math.round((255 - b) * (percent / 100));
  } else {
    const factor = (100 + percent) / 100;
    r = Math.round(r * factor);
    g = Math.round(g * factor);
    b = Math.round(b * factor);
  }
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
