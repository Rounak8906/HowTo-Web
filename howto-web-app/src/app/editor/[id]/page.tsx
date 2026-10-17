'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getPresentation, saveSlides } from '@/lib/firestore';
import { saveLocalFile, getLocalFileUrl } from '@/lib/localFileStore';
import type { Presentation, Slide, SlideElement, Resource } from '@/lib/types';
import { generateId, getResourceIcon, clamp, adjustColor } from '@/lib/utils';
import toast from 'react-hot-toast';
import Logo from '@/components/ui/Logo';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Eye,
  Undo2,
  Redo2,
  Plus,
  Type,
  Square,
  Circle,
  ArrowRight,
  MessageSquare,
  Star,
  Image as ImageIcon,
  Table2,
  Code2,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  UploadCloud,
  Folder,
  FileText,
  ExternalLink,
  Sun,
  Moon,
  GitFork,
  X,
  Sparkles,
  Layers,
  HelpCircle,
  Camera,
  PenTool,
  MonitorPlay,
  PanelLeftClose,
  PanelLeft,
  Palette,
  Layout,
  Highlighter,
  Box,
  StickyNote,
  Check,
} from 'lucide-react';
import WhiteboardModal from '@/components/draw/WhiteboardModal';
import SlideDrawingCanvas from '@/components/draw/SlideDrawingCanvas';
import RealisticShape from '@/components/ui/RealisticShape';
import styles from './editor.module.css';

const SAMPLE_IMAGES = [
  { label: 'Technology', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80', thumb: '💻' },
  { label: 'Teamwork', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&auto=format&fit=crop&q=80', thumb: '👥' },
  { label: 'Coding UI', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80', thumb: '⚡' },
  { label: 'Analytics', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&auto=format&fit=crop&q=80', thumb: '📊' },
  { label: 'Creative', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80', thumb: '🎨' },
  { label: 'Nature', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1000&auto=format&fit=crop&q=80', thumb: '🌿' },
];

const GRADIENT_PRESETS = [
  { name: 'Studio White', value: '#ffffff' },
  { name: 'Warm Pearl', value: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' },
  { name: 'Soft Azure', value: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)' },
  { name: 'Clean Mint', value: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' },
  { name: 'Sunset Cream', value: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)' },
  { name: 'Royal Lavender', value: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)' },
  { name: 'Clean Slate', value: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' },
  { name: 'Midnight Obsidian', value: 'linear-gradient(135deg, #07090e 0%, #131929 100%)' },
];

const DEFAULT_PRESENTATION: Presentation = {
  id: 'starter',
  title: 'HowTo-Web Dynamic Presentation',
  description: 'Interactive presentation with slide-specific resources and 70/30 split',
  ownerId: 'guest-user',
  ownerName: 'Presenter',
  ownerPhoto: null,
  visibility: 'public',
  version: 1,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  forkOf: null,
  forkCount: 0,
  slideOrder: ['s1', 's2', 's3'],
  slides: [
    {
      id: 's1',
      order: 0,
      background: { type: 'color', value: '#ffffff' },
      elements: [
        {
          id: 'e1',
          type: 'text',
          x: 10,
          y: 26,
          width: 80,
          height: 20,
          content: 'HowTo-Web Presentation',
          style: {
            fontSize: '3rem',
            fontWeight: '800',
            fontFamily: 'var(--font-sans)',
            color: '#0f172a',
            textAlign: 'center',
          },
        },
        {
          id: 'e2',
          type: 'text',
          x: 15,
          y: 50,
          width: 70,
          height: 14,
          content: '70% Presentation Canvas / 30% Interactive Slide Resources',
          style: {
            fontSize: '1.35rem',
            fontWeight: '500',
            fontFamily: 'var(--font-sans)',
            color: '#818cf8',
            textAlign: 'center',
          },
        },
      ],
      resources: [
        {
          id: 'r1',
          type: 'code',
          name: 'index.html',
          content: '<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: sans-serif; background: #0f172a; color: #38bdf8; padding: 20px; text-align: center; }\n    h1 { color: #818cf8; }\n  </style>\n</head>\n<body>\n  <h1>Hello from HowTo-Web!</h1>\n  <p>Live sandbox executed directly in slide resources.</p>\n</body>\n</html>',
          createdAt: Date.now(),
          size: 320,
        },
        {
          id: 'r2',
          type: 'link',
          name: 'Project Documentation',
          url: 'https://github.com',
          createdAt: Date.now(),
        },
      ],
      notes: [
        {
          id: 'n1',
          type: 'note',
          name: 'Speaker Note',
          content: 'Welcome everyone! Explore the signature 70/30 split layout with live file attachments.',
          createdAt: Date.now(),
        },
      ],
    },
    {
      id: 's2',
      order: 1,
      background: { type: 'gradient', value: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' },
      elements: [
        {
          id: 'e3',
          type: 'text',
          x: 8,
          y: 10,
          width: 84,
          height: 16,
          content: 'Slide-Specific Context & Resources',
          style: { fontSize: '2.2rem', fontWeight: '700', color: '#0f172a' },
        },
        {
          id: 'e4',
          type: 'text',
          x: 8,
          y: 30,
          width: 84,
          height: 52,
          content:
            '• 70% Presentation Area: Focus on high-impact visual slides\n• 30% Interactive Panel: Attach PDFs, live code sandboxes, docs, and links\n• Signature Draggable Divider: Smoothly resize between 70/30, 60/40, and 80/20\n• Comic-Style Notes: Clean, engaging speaker reminders on every slide\n• GitHub-style Fork & Pull: Collaborate without overwriting originals',
          style: { fontSize: '1.25rem', color: '#334155', lineHeight: '1.6' },
        },
      ],
      resources: [],
      notes: [
        {
          id: 'n2',
          type: 'note',
          name: 'Tip',
          content: 'Drag the diagonal divider to the left or right to customize your workspace view!',
          createdAt: Date.now(),
        },
      ],
    },
    {
      id: 's3',
      order: 2,
      background: { type: 'gradient', value: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)' },
      elements: [
        {
          id: 'e5',
          type: 'text',
          x: 8,
          y: 10,
          width: 84,
          height: 16,
          content: 'Interactive Live Code Snippet',
          style: { fontSize: '2.2rem', fontWeight: '700', color: '#0f172a' },
        },
        {
          id: 'e6',
          type: 'code',
          x: 8,
          y: 28,
          width: 84,
          height: 54,
          content: '// Interactive slide code execution\nfunction calculateSplit(totalWidth, ratio = 0.70) {\n  const presentation = totalWidth * ratio;\n  const resources = totalWidth * (1 - ratio);\n  return { presentation, resources };\n}\n\nconsole.log(calculateSplit(1920)); // { presentation: 1344, resources: 576 }',
          style: {},
        },
      ],
      resources: [],
      notes: [],
    },
  ],
};

export default function EditorPage() {
  const params = useParams();
  const id = params.id as string;
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  // Core Presentation State
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Layout & 70/30 Divider State
  const [dividerPosition, setDividerPosition] = useState(70);
  const [isDraggingDivider, setIsDraggingDivider] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  // PowerPoint Ribbon & Top Bar State
  const [activeRibbonTab, setActiveRibbonTab] = useState<'home' | 'insert' | 'draw' | 'design' | 'slideshow'>('home');
  const [showWhiteboardModal, setShowWhiteboardModal] = useState(false);

  // In-Slide Vector Drawing Canvas State
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawTool, setDrawTool] = useState<'pen' | 'highlighter' | 'marker' | 'eraser'>('pen');
  const [drawColor, setDrawColor] = useState('#4f46e5');
  const [drawSize, setDrawSize] = useState(3);

  // Horizontal Top Slide Strip Ref
  const slideStripRef = useRef<HTMLDivElement | null>(null);

  // Realistic Shape Preset State
  const [shapeRealisticStyle, setShapeRealisticStyle] = useState<'shaded' | 'glass' | 'glossy' | 'neumorphic' | 'metallic'>('shaded');

  // Active Selection & Contextual Formatting
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activeResourceTab, setActiveResourceTab] = useState<'resources' | 'notes' | 'design'>('resources');

  // Dropdown Menus
  const [showAddSlideMenu, setShowAddSlideMenu] = useState(false);
  const [showTextMenu, setShowTextMenu] = useState(false);
  const [showShapesMenu, setShowShapesMenu] = useState(false);

  // Modals
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageModalTab, setImageModalTab] = useState<'upload' | 'url' | 'samples'>('upload');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [previewPdfResource, setPreviewPdfResource] = useState<{ name: string; url: string } | null>(null);
  const [previewCodeResource, setPreviewCodeResource] = useState<Resource | null>(null);
  const [codeRunnerHtml, setCodeRunnerHtml] = useState<string>('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');

  // Dragging & Resizing Element on Canvas
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; elemX: number; elemY: number } | null>(null);
  const [resizingElementId, setResizingElementId] = useState<string | null>(null);
  const resizeStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    elemX: number;
    elemY: number;
    elemW: number;
    elemH: number;
    corner: string;
  } | null>(null);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const slideCanvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Undo / Redo History
  const [history, setHistory] = useState<Slide[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Load Presentation
  useEffect(() => {
    if (id === 'demo' || id === 'starter') {
      setPresentation(DEFAULT_PRESENTATION);
      setHistory([DEFAULT_PRESENTATION.slides]);
      setHistoryIndex(0);
      return;
    }
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    if (user && id) {
      loadPresentation();
    }
  }, [user, loading, id]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleWindowClick = () => {
      setShowAddSlideMenu(false);
      setShowTextMenu(false);
      setShowShapesMenu(false);
    };
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  const loadPresentation = async () => {
    try {
      const pres = await getPresentation(id);
      if (!pres) {
        toast.error('Presentation not found');
        router.push('/dashboard');
        return;
      }
      if (pres.ownerId !== user?.uid) {
        toast.error('You do not have permission to edit this presentation');
        router.push('/dashboard');
        return;
      }
      setPresentation(pres);
      setHistory([pres.slides]);
      setHistoryIndex(0);
    } catch {
      toast.error('Failed to load presentation');
      router.push('/dashboard');
    }
  };

  const currentSlide = presentation?.slides[currentSlideIndex] || null;
  const selectedElement = currentSlide?.elements.find((el) => el.id === selectedElementId) || null;

  // Record History State for Undo/Redo
  const pushHistory = useCallback((newSlides: Slide[]) => {
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, newSlides];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0 && presentation) {
      const newIndex = historyIndex - 1;
      const targetSlides = history[newIndex];
      setHistoryIndex(newIndex);
      setPresentation({ ...presentation, slides: targetSlides });
      setHasChanges(true);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1 && presentation) {
      const newIndex = historyIndex + 1;
      const targetSlides = history[newIndex];
      setHistoryIndex(newIndex);
      setPresentation({ ...presentation, slides: targetSlides });
      setHasChanges(true);
    }
  };

  // Whiteboard Integration Handlers
  const handleExportWhiteboardToSlide = (imageDataUrl: string) => {
    if (!presentation || !currentSlide) return;

    // 1. Insert image element onto the current slide
    const newElement: SlideElement = {
      id: generateId(),
      type: 'image',
      x: 20,
      y: 20,
      width: 60,
      height: 55,
      content: imageDataUrl,
      style: {
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      },
    };

    // 2. Also save as an image resource in the current slide's resources
    const newResource: Resource = {
      id: generateId(),
      type: 'image',
      name: `Whiteboard-${new Date().toLocaleTimeString().replace(/:/g, '-')}.png`,
      url: imageDataUrl,
      createdAt: Date.now(),
      size: Math.round(imageDataUrl.length * 0.75),
    };

    const updatedElements = [...currentSlide.elements, newElement];
    const updatedResources = [...(currentSlide.resources || []), newResource];

    const newSlides = [...presentation.slides];
    newSlides[currentSlideIndex] = {
      ...currentSlide,
      elements: updatedElements,
      resources: updatedResources,
    };

    setPresentation({ ...presentation, slides: newSlides });
    pushHistory(newSlides);
    setSelectedElementId(newElement.id);
    setHasChanges(true);
  };

  const handleSaveWhiteboardResource = (imageDataUrl: string) => {
    if (!presentation || !currentSlide) return;

    const newResource: Resource = {
      id: generateId(),
      type: 'image',
      name: `Whiteboard-${new Date().toLocaleTimeString().replace(/:/g, '-')}.png`,
      url: imageDataUrl,
      createdAt: Date.now(),
      size: Math.round(imageDataUrl.length * 0.75),
    };

    const updatedResources = [...(currentSlide.resources || []), newResource];
    const newSlides = [...presentation.slides];
    newSlides[currentSlideIndex] = {
      ...currentSlide,
      resources: updatedResources,
    };

    setPresentation({ ...presentation, slides: newSlides });
    pushHistory(newSlides);
    setHasChanges(true);
  };

  // Slide CRUD
  const updateSlide = (updates: Partial<Slide>) => {
    if (!presentation || !currentSlide) return;
    const newSlides = [...presentation.slides];
    newSlides[currentSlideIndex] = {
      ...currentSlide,
      ...updates,
    };
    setPresentation({ ...presentation, slides: newSlides });
    pushHistory(newSlides);
    setHasChanges(true);
  };

  const addSlide = (layout: 'title' | 'titleAndContent' | 'twoContent' | 'code' | 'blank' = 'titleAndContent') => {
    if (!presentation) return;
    let initialElements: SlideElement[] = [];

    if (layout === 'title') {
      initialElements = [
        {
          id: generateId(),
          type: 'text',
          x: 10,
          y: 25,
          width: 80,
          height: 22,
          content: 'Click to add Title',
          style: {
            fontSize: '3rem',
            fontWeight: '800',
            fontFamily: 'var(--font-sans)',
            color: '#0f172a',
            textAlign: 'center',
          },
        },
        {
          id: generateId(),
          type: 'text',
          x: 15,
          y: 52,
          width: 70,
          height: 14,
          content: 'Click to add Subtitle',
          style: {
            fontSize: '1.4rem',
            fontWeight: '400',
            fontFamily: 'var(--font-sans)',
            color: '#475569',
            textAlign: 'center',
          },
        },
      ];
    } else if (layout === 'titleAndContent') {
      initialElements = [
        {
          id: generateId(),
          type: 'text',
          x: 8,
          y: 10,
          width: 84,
          height: 16,
          content: 'Slide Title',
          style: {
            fontSize: '2.2rem',
            fontWeight: '700',
            fontFamily: 'var(--font-sans)',
            color: '#0f172a',
            textAlign: 'left',
          },
        },
        {
          id: generateId(),
          type: 'text',
          x: 8,
          y: 30,
          width: 84,
          height: 55,
          content: '• Key concept explanation\n• Supporting detail\n• Practical takeaways',
          style: {
            fontSize: '1.25rem',
            fontWeight: '400',
            fontFamily: 'var(--font-sans)',
            color: '#334155',
            textAlign: 'left',
          },
        },
      ];
    } else if (layout === 'twoContent') {
      initialElements = [
        {
          id: generateId(),
          type: 'text',
          x: 8,
          y: 10,
          width: 84,
          height: 16,
          content: 'Comparative Analysis',
          style: { fontSize: '2.2rem', fontWeight: '700', color: '#0f172a' },
        },
        {
          id: generateId(),
          type: 'text',
          x: 8,
          y: 30,
          width: 40,
          height: 55,
          content: 'Approach A:\n• Simple implementation\n• Fast delivery\n• Lower overhead',
          style: { fontSize: '1.15rem', color: '#334155' },
        },
        {
          id: generateId(),
          type: 'text',
          x: 52,
          y: 30,
          width: 40,
          height: 55,
          content: 'Approach B:\n• High scalability\n• Strict typing\n• Long-term stability',
          style: { fontSize: '1.15rem', color: '#334155' },
        },
      ];
    } else if (layout === 'code') {
      initialElements = [
        {
          id: generateId(),
          type: 'text',
          x: 8,
          y: 10,
          width: 84,
          height: 14,
          content: 'Live Code Execution',
          style: { fontSize: '2.2rem', fontWeight: '700', color: '#0f172a' },
        },
        {
          id: generateId(),
          type: 'code',
          x: 8,
          y: 28,
          width: 84,
          height: 56,
          content: '// Implementation logic\nfunction processData(items) {\n  return items.map(item => item * 2);\n}',
          style: {},
        },
      ];
    }

    const newSlide: Slide = {
      id: generateId(),
      order: presentation.slides.length,
      background: { type: 'color', value: '#ffffff' },
      elements: initialElements,
      resources: [],
      notes: [],
    };

    const newSlides = [...presentation.slides, newSlide];
    setPresentation({
      ...presentation,
      slides: newSlides,
      slideOrder: [...presentation.slideOrder, newSlide.id],
    });
    setCurrentSlideIndex(newSlides.length - 1);
    pushHistory(newSlides);
    setHasChanges(true);
    setShowAddSlideMenu(false);
  };

  const deleteSlide = (index: number) => {
    if (!presentation || presentation.slides.length <= 1) {
      toast.error('Cannot delete the only slide');
      return;
    }
    const newSlides = presentation.slides.filter((_, i) => i !== index);
    setPresentation({ ...presentation, slides: newSlides });
    setCurrentSlideIndex(Math.min(currentSlideIndex, newSlides.length - 1));
    pushHistory(newSlides);
    setHasChanges(true);
  };

  const duplicateSlide = (index: number) => {
    if (!presentation) return;
    const source = presentation.slides[index];
    const newSlide: Slide = {
      ...source,
      id: generateId(),
      order: index + 1,
      elements: source.elements.map((el) => ({ ...el, id: generateId() })),
    };
    const newSlides = [...presentation.slides];
    newSlides.splice(index + 1, 0, newSlide);
    setPresentation({ ...presentation, slides: newSlides });
    setCurrentSlideIndex(index + 1);
    pushHistory(newSlides);
    setHasChanges(true);
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    if (!presentation) return;
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= presentation.slides.length) return;
    const newSlides = [...presentation.slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[target];
    newSlides[target] = temp;
    setPresentation({ ...presentation, slides: newSlides });
    setCurrentSlideIndex(target);
    pushHistory(newSlides);
    setHasChanges(true);
  };

  // Element CRUD
  const addTextElement = (type: 'heading' | 'subheading' | 'body' | 'bullets' = 'body') => {
    if (!currentSlide) return;
    let content = 'New text block';
    let fontSize = '1.25rem';
    let fontWeight = '400';

    if (type === 'heading') {
      content = 'Slide Heading';
      fontSize = '2.5rem';
      fontWeight = '700';
    } else if (type === 'subheading') {
      content = 'Section Subheading';
      fontSize = '1.75rem';
      fontWeight = '600';
    } else if (type === 'bullets') {
      content = '• First key takeaway\n• Second supporting fact\n• Final conclusion';
    }

    const newEl: SlideElement = {
      id: generateId(),
      type: 'text',
      x: 12,
      y: 24,
      width: 76,
      height: type === 'bullets' ? 32 : 18,
      content,
      style: {
        fontSize,
        fontWeight,
        color: '#0f172a',
        fontFamily: 'var(--font-sans)',
        textAlign: 'left',
      },
    };

    updateSlide({ elements: [...currentSlide.elements, newEl] });
    setSelectedElementId(newEl.id);
    setShowTextMenu(false);
  };

  const addShapeElement = (
    shapeType: 'rect' | 'circle' | 'arrow' | 'callout' | 'star' | 'cylinder' | 'cube' | 'diamond' | 'hexagon' | 'sticky',
    stylePreset: 'shaded' | 'glass' | 'glossy' | 'neumorphic' | 'metallic' = 'shaded'
  ) => {
    if (!currentSlide) return;
    const defaultColor =
      shapeType === 'sticky' ? '#fef08a' :
      shapeType === 'star' ? '#f59e0b' :
      shapeType === 'diamond' ? '#38bdf8' :
      shapeType === 'cylinder' ? '#0ea5e9' :
      shapeType === 'cube' ? '#6366f1' :
      shapeType === 'arrow' ? '#10b981' :
      '#4f46e5';

    const newEl: SlideElement = {
      id: generateId(),
      type: 'shape',
      shapeType,
      shapeRealisticStyle: stylePreset,
      x: 35,
      y: 30,
      width: shapeType === 'arrow' ? 32 : (shapeType === 'circle' || shapeType === 'cylinder' || shapeType === 'cube' || shapeType === 'star') ? 25 : 28,
      height: shapeType === 'arrow' ? 18 : 28,
      content: '',
      style: {
        backgroundColor: defaultColor,
        color: shapeType === 'sticky' ? '#0f172a' : '#ffffff',
      },
    };
    updateSlide({ elements: [...currentSlide.elements, newEl] });
    setSelectedElementId(newEl.id);
    setShowShapesMenu(false);
  };

  const addTableElement = () => {
    if (!currentSlide) return;
    const newEl: SlideElement = {
      id: generateId(),
      type: 'table',
      x: 10,
      y: 25,
      width: 80,
      height: 40,
      content: '',
      style: {},
      tableData: {
        rows: [
          ['Feature', 'Status', 'Impact'],
          ['70/30 Split Layout', 'Shipped', 'High'],
          ['Interactive Code Sandbox', 'Ready', 'Critical'],
          ['Cloud Sync', 'Active', 'Standard'],
        ],
      },
    };
    updateSlide({ elements: [...currentSlide.elements, newEl] });
    setSelectedElementId(newEl.id);
  };

  const addCodeElement = () => {
    if (!currentSlide) return;
    const newEl: SlideElement = {
      id: generateId(),
      type: 'code',
      x: 10,
      y: 25,
      width: 80,
      height: 48,
      content: '// Sample algorithm\nfunction solve(input) {\n  return input.trim().toUpperCase();\n}',
      style: {},
    };
    updateSlide({ elements: [...currentSlide.elements, newEl] });
    setSelectedElementId(newEl.id);
  };

  const updateElement = (elementId: string, updates: Partial<SlideElement>) => {
    if (!currentSlide) return;
    const newElements = currentSlide.elements.map((el) =>
      el.id === elementId ? { ...el, ...updates } : el
    );
    updateSlide({ elements: newElements });
  };

  const deleteElement = (elementId: string) => {
    if (!currentSlide) return;
    updateSlide({ elements: currentSlide.elements.filter((el) => el.id !== elementId) });
    if (selectedElementId === elementId) setSelectedElementId(null);
  };

  const duplicateElement = (elementId: string) => {
    if (!currentSlide) return;
    const el = currentSlide.elements.find((e) => e.id === elementId);
    if (!el) return;
    const duplicated: SlideElement = {
      ...el,
      id: generateId(),
      x: Math.min(el.x + 4, 85),
      y: Math.min(el.y + 4, 85),
    };
    updateSlide({ elements: [...currentSlide.elements, duplicated] });
    setSelectedElementId(duplicated.id);
  };

  const bringToFront = (elementId: string) => {
    if (!currentSlide) return;
    const el = currentSlide.elements.find((e) => e.id === elementId);
    if (!el) return;
    const others = currentSlide.elements.filter((e) => e.id !== elementId);
    updateSlide({ elements: [...others, el] });
  };

  const sendToBack = (elementId: string) => {
    if (!currentSlide) return;
    const el = currentSlide.elements.find((e) => e.id === elementId);
    if (!el) return;
    const others = currentSlide.elements.filter((e) => e.id !== elementId);
    updateSlide({ elements: [el, ...others] });
  };

  // Dragging Elements on Canvas
  const startDragElement = (e: React.MouseEvent, el: SlideElement) => {
    e.stopPropagation();
    setSelectedElementId(el.id);
    setDraggingElementId(el.id);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: el.x,
      elemY: el.y,
    };
  };

  // Resizing Elements on Canvas
  const startResizeElement = (e: React.MouseEvent, el: SlideElement, corner: string) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingElementId(el.id);
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: el.x,
      elemY: el.y,
      elemW: el.width,
      elemH: el.height,
      corner,
    };
  };

  // Mouse Move & Up Listeners for Canvas Elements
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingElementId && dragStartRef.current && slideCanvasRef.current) {
        const rect = slideCanvasRef.current.getBoundingClientRect();
        const deltaX = ((e.clientX - dragStartRef.current.mouseX) / rect.width) * 100;
        const deltaY = ((e.clientY - dragStartRef.current.mouseY) / rect.height) * 100;
        const newX = clamp(dragStartRef.current.elemX + deltaX, 0, 95);
        const newY = clamp(dragStartRef.current.elemY + deltaY, 0, 95);
        updateElement(draggingElementId, { x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 });
      }

      if (resizingElementId && resizeStartRef.current && slideCanvasRef.current) {
        const rect = slideCanvasRef.current.getBoundingClientRect();
        const deltaX = ((e.clientX - resizeStartRef.current.mouseX) / rect.width) * 100;
        const deltaY = ((e.clientY - resizeStartRef.current.mouseY) / rect.height) * 100;
        const { elemX, elemY, elemW, elemH, corner } = resizeStartRef.current;

        let newW = elemW;
        let newH = elemH;
        let newX = elemX;
        let newY = elemY;

        if (corner.includes('e')) newW = clamp(elemW + deltaX, 5, 100 - elemX);
        if (corner.includes('s')) newH = clamp(elemH + deltaY, 5, 100 - elemY);
        if (corner.includes('w')) {
          const maxDelta = elemW - 5;
          const appliedDelta = Math.min(deltaX, maxDelta);
          newX = elemX + appliedDelta;
          newW = elemW - appliedDelta;
        }
        if (corner.includes('n')) {
          const maxDelta = elemH - 5;
          const appliedDelta = Math.min(deltaY, maxDelta);
          newY = elemY + appliedDelta;
          newH = elemH - appliedDelta;
        }

        updateElement(resizingElementId, {
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
          width: Math.round(newW * 10) / 10,
          height: Math.round(newH * 10) / 10,
        });
      }
    };

    const handleMouseUp = () => {
      setDraggingElementId(null);
      setResizingElementId(null);
      dragStartRef.current = null;
      resizeStartRef.current = null;
    };

    if (draggingElementId || resizingElementId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingElementId, resizingElementId]);

  // 70/30 Divider Drag
  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingDivider(true);
  };

  useEffect(() => {
    if (!isDraggingDivider) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = (x / rect.width) * 100;
      setDividerPosition(clamp(pct, 40, 85));
    };
    const handleMouseUp = () => setIsDraggingDivider(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingDivider]);

  // Save Function
  const save = useCallback(async (isManual: boolean = false) => {
    if (!presentation || isSaving) return;
    setIsSaving(true);
    try {
      await saveSlides(presentation.id, presentation.slides, presentation.slideOrder);
      setHasChanges(false);
      if (isManual) {
        toast.success('Presentation saved to cloud');
      }
    } catch {
      toast.error('Failed to save presentation');
    } finally {
      setIsSaving(false);
    }
  }, [presentation, isSaving]);

  // Auto-Save Effect
  useEffect(() => {
    if (!hasChanges || isSaving || !presentation || !autoSaveEnabled) return;
    const timer = setTimeout(() => {
      save(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [hasChanges, isSaving, presentation, autoSaveEnabled, save]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (selectedElementId) duplicateElement(selectedElementId);
      } else if (e.key === 'F5') {
        e.preventDefault();
        if (presentation) router.push(`/present/${presentation.id}`);
      } else if (e.key === 'Escape') {
        setSelectedElementId(null);
        setShowAddSlideMenu(false);
        setShowTextMenu(false);
        setShowShapesMenu(false);
        setPreviewPdfResource(null);
        setPreviewCodeResource(null);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeEl = document.activeElement;
        const isEditingText =
          activeEl &&
          (activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.getAttribute('contenteditable') === 'true');
        if (selectedElementId && !isEditingText) {
          e.preventDefault();
          deleteElement(selectedElementId);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [save, selectedElementId, currentSlide, presentation, historyIndex, history]);

  // Upload File as Resource
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !presentation || !currentSlide) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isCode = file.name.endsWith('.js') || file.name.endsWith('.html') || file.name.endsWith('.css') || file.name.endsWith('.py');
      const isPdf = file.name.toLowerCase().endsWith('.pdf');
      let contentText = '';
      let url = '';

      if (isCode || file.type.startsWith('text/')) {
        contentText = await file.text();
      } else {
        const fileId = generateId();
        await saveLocalFile(fileId, file, file.name);
        url = `local:${fileId}`;
      }

      const resType = isPdf ? 'document' : isCode ? 'code' : file.type.startsWith('image/') ? 'image' : 'other';
      const newRes: Resource = {
        id: generateId(),
        type: resType,
        name: file.name,
        size: file.size,
        url,
        content: contentText,
        createdAt: Date.now(),
      };

      updateSlide({ resources: [...currentSlide.resources, newRes] });
      toast.success(`Attached ${file.name}`);
    }
  };

  // Add Note to Slide
  const addNote = () => {
    if (!currentSlide) return;
    const newNote: Resource = {
      id: generateId(),
      type: 'note',
      name: 'Speaker Note',
      content: 'New reminder for this slide...',
      createdAt: Date.now(),
    };
    updateSlide({ notes: [...currentSlide.notes, newNote] });
  };

  // Run Code Live Sandbox
  const runCodeResource = (res: Resource) => {
    setPreviewCodeResource(res);
    const code = res.content || '';
    const isHtml = /<[a-z][\s\S]*>/i.test(code);
    if (isHtml) {
      setCodeRunnerHtml(code);
    } else {
      const wrapped = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: monospace; padding: 14px; background: #070a12; color: #38bdf8; margin: 0; }
            .log { border-bottom: 1px solid #1e293b; padding: 6px 0; font-size: 13px; }
            .err { color: #f87171; }
          </style>
        </head>
        <body>
          <div id="logs"></div>
          <script>
            const logEl = document.getElementById('logs');
            const originalLog = console.log;
            const originalError = console.error;
            console.log = (...args) => {
              const div = document.createElement('div');
              div.className = 'log';
              div.textContent = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
              logEl.appendChild(div);
              originalLog(...args);
            };
            console.error = (...args) => {
              const div = document.createElement('div');
              div.className = 'log err';
              div.textContent = '❌ ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
              logEl.appendChild(div);
              originalError(...args);
            };
            try {
              ${code}
            } catch (err) {
              console.error(err.message);
            }
          <\/script>
        </body>
        </html>
      `;
      setCodeRunnerHtml(wrapped);
    }
  };

  // Open PDF Modal
  const openPdfResource = async (res: Resource) => {
    let resolvedUrl = res.url || '';
    if (resolvedUrl.startsWith('local:')) {
      resolvedUrl = (await getLocalFileUrl(resolvedUrl)) || '';
    }
    setPreviewPdfResource({ name: res.name, url: resolvedUrl });
  };

  if (!presentation) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loadingSpinner} />
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Loading Presentation Studio...
        </p>
      </div>
    );
  }

  return (
    <div className={styles.editor}>
      {/* ─── 1. TOP STUDIO NAVIGATION BAR ─── */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <button className={styles.backBtn} onClick={() => router.push('/dashboard')}>
            <ChevronLeft size={16} />
            <span>Workspace</span>
          </button>

          <Logo size={26} style={{ borderRadius: 7 }} />

          {/* Editable Presentation Title */}
          <div className={styles.titleCapsule}>
            <input
              type="text"
              className={styles.titleInput}
              value={presentation.title}
              onChange={(e) => {
                setPresentation({ ...presentation, title: e.target.value });
                setHasChanges(true);
              }}
              title="Click to rename presentation"
            />
          </div>

          {/* Cloud Sync Badge */}
          <div className={styles.saveIndicator}>
            <span
              className={`${styles.statusDot} ${
                isSaving ? styles.statusSaving : hasChanges ? styles.statusUnsaved : styles.statusSaved
              }`}
            />
            <span>{isSaving ? 'Saving...' : hasChanges ? 'Unsaved' : 'Saved to Cloud'}</span>
          </div>

          {/* Fork Attribution Pill */}
          {presentation.forkOf && (
            <div className={styles.forkPill} title={`Forked from "${presentation.forkOf.originalTitle}"`}>
              <GitFork size={12} />
              <span>
                Forked from{' '}
                <a
                  href={`/view/${presentation.forkOf.originalId}`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.forkLink}
                >
                  {presentation.forkOf.originalOwnerUsername || presentation.forkOf.originalOwnerName}/{presentation.forkOf.originalTitle}
                </a>
              </span>
            </div>
          )}

          {/* Split View Segmented Controller */}
          <div className={styles.presetGroup}>
            <button
              className={`${styles.presetBtn} ${dividerPosition === 70 ? styles.presetBtnActive : ''}`}
              onClick={() => setDividerPosition(70)}
              title="70% Presentation / 30% Resources"
            >
              70/30
            </button>
            <button
              className={`${styles.presetBtn} ${dividerPosition === 60 ? styles.presetBtnActive : ''}`}
              onClick={() => setDividerPosition(60)}
              title="60% Presentation / 40% Resources"
            >
              60/40
            </button>
            <button
              className={`${styles.presetBtn} ${dividerPosition === 80 ? styles.presetBtnActive : ''}`}
              onClick={() => setDividerPosition(80)}
              title="80% Presentation / 20% Resources"
            >
              80/20
            </button>
            <button
              className={`${styles.presetBtn} ${dividerPosition === 100 ? styles.presetBtnActive : ''}`}
              onClick={() => setDividerPosition(dividerPosition === 100 ? 70 : 100)}
              title="Focus Canvas (Hide Resources)"
            >
              {dividerPosition === 100 ? 'Restore' : '100%'}
            </button>
          </div>
        </div>

        <div className={styles.topBarRight}>
          {/* Undo / Redo */}
          <button
            className={styles.iconActionBtn}
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </button>
          <button
            className={styles.iconActionBtn}
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={16} />
          </button>

          {/* Theme Toggle */}
          <button
            className={styles.iconActionBtn}
            onClick={toggleTheme}
            aria-label="Toggle theme"
            type="button"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* View Presentation */}
          <button
            className={`${styles.actionBtn} ${styles.btnSecondary}`}
            onClick={() => router.push(`/view/${presentation.id}`)}
            title="Open Public Viewer"
          >
            <Eye size={15} />
            <span>View</span>
          </button>

          {/* Present Mode */}
          <button
            className={`${styles.actionBtn} ${styles.btnPrimary}`}
            onClick={() => router.push(`/present/${presentation.id}`)}
            title="Fullscreen Presentation Mode (F5)"
          >
            <Play size={15} fill="currentColor" />
            <span>Present</span>
          </button>
        </div>
      </header>

      {/* ─── 2. POWERPOINT RIBBON NAVIGATION TABS ─── */}
      <nav className={styles.ribbonNavTabs} aria-label="Presentation Ribbon">
        <button
          className={`${styles.ribbonTabBtn} ${activeRibbonTab === 'home' ? styles.ribbonTabBtnActive : ''}`}
          onClick={() => setActiveRibbonTab('home')}
        >
          <Layout size={14} />
          <span>Home</span>
        </button>
        <button
          className={`${styles.ribbonTabBtn} ${activeRibbonTab === 'insert' ? styles.ribbonTabBtnActive : ''}`}
          onClick={() => setActiveRibbonTab('insert')}
        >
          <Plus size={14} />
          <span>Insert</span>
        </button>
        <button
          className={`${styles.ribbonTabBtn} ${activeRibbonTab === 'draw' ? styles.ribbonTabBtnActive : ''}`}
          onClick={() => setActiveRibbonTab('draw')}
        >
          <PenTool size={14} />
          <span>Draw / Whiteboard</span>
        </button>
        <button
          className={`${styles.ribbonTabBtn} ${activeRibbonTab === 'design' ? styles.ribbonTabBtnActive : ''}`}
          onClick={() => setActiveRibbonTab('design')}
        >
          <Palette size={14} />
          <span>Design</span>
        </button>
        <button
          className={`${styles.ribbonTabBtn} ${activeRibbonTab === 'slideshow' ? styles.ribbonTabBtnActive : ''}`}
          onClick={() => setActiveRibbonTab('slideshow')}
        >
          <MonitorPlay size={14} />
          <span>Slide Show</span>
        </button>

        <div className={styles.ribbonDivider} />

        {/* Quick Launch Whiteboard Studio */}
        <button
          className={styles.whiteboardLaunchBtn}
          onClick={() => setShowWhiteboardModal(true)}
          title="Open Whiteboard Studio (Draw and Export to Slide)"
        >
          <Sparkles size={14} />
          <span>🎨 Whiteboard Studio</span>
        </button>
      </nav>

      {/* ─── RIBBON ACTIVE TAB TOOL SHELF & CONTEXTUAL FORMATTING ─── */}
      <div className={styles.toolShelf}>
        <div className={styles.toolGroup}>
          {/* HOME TAB TOOLS */}
          {activeRibbonTab === 'home' && (
            <>
              {/* Add New Slide */}
              <div className={styles.dropdownContainer}>
                <button
                  className={`${styles.toolPill} ${styles.btnPrimary}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddSlideMenu(!showAddSlideMenu);
                    setShowTextMenu(false);
                    setShowShapesMenu(false);
                  }}
                  title="Add New Slide"
                  style={{ background: 'var(--accent-primary)', color: '#fff', fontWeight: 600 }}
                >
                  <Plus size={14} />
                  <span>New Slide ▾</span>
                </button>
                {showAddSlideMenu && (
                  <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                    <button
                      className={styles.dropdownItem}
                      onClick={() => {
                        addSlide('titleAndContent');
                        setShowAddSlideMenu(false);
                      }}
                    >
                      <FileText size={15} className={styles.dropdownItemIcon} />
                      <span>Title & Content</span>
                    </button>
                    <button
                      className={styles.dropdownItem}
                      onClick={() => {
                        addSlide('title');
                        setShowAddSlideMenu(false);
                      }}
                    >
                      <Type size={15} className={styles.dropdownItemIcon} />
                      <span>Title Slide</span>
                    </button>
                    <button
                      className={styles.dropdownItem}
                      onClick={() => {
                        addSlide('twoContent');
                        setShowAddSlideMenu(false);
                      }}
                    >
                      <Table2 size={15} className={styles.dropdownItemIcon} />
                      <span>Two Columns</span>
                    </button>
                    <button
                      className={styles.dropdownItem}
                      onClick={() => {
                        addSlide('code');
                        setShowAddSlideMenu(false);
                      }}
                    >
                      <Code2 size={15} className={styles.dropdownItemIcon} />
                      <span>Code Focus</span>
                    </button>
                    <button
                      className={styles.dropdownItem}
                      onClick={() => {
                        addSlide('blank');
                        setShowAddSlideMenu(false);
                      }}
                    >
                      <Square size={15} className={styles.dropdownItemIcon} />
                      <span>Blank Slide</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Add Text Dropdown */}
              <div className={styles.dropdownContainer}>
                <button
                  className={styles.toolPill}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTextMenu(!showTextMenu);
                    setShowShapesMenu(false);
                    setShowAddSlideMenu(false);
                  }}
                  title="Insert Text"
                >
                  <Type size={15} />
                  <span>Text ▾</span>
                </button>
                {showTextMenu && (
                  <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                    <button
                      className={styles.dropdownItem}
                      onClick={() => {
                        addTextElement('heading');
                        setShowTextMenu(false);
                      }}
                    >
                      <span className={styles.dropdownItemIcon} style={{ fontWeight: 800 }}>H1</span>
                      <span>Title Heading</span>
                    </button>
                    <button
                      className={styles.dropdownItem}
                      onClick={() => {
                        addTextElement('subheading');
                        setShowTextMenu(false);
                      }}
                    >
                      <span className={styles.dropdownItemIcon} style={{ fontWeight: 600 }}>H2</span>
                      <span>Section Subheading</span>
                    </button>
                    <button
                      className={styles.dropdownItem}
                      onClick={() => {
                        addTextElement('body');
                        setShowTextMenu(false);
                      }}
                    >
                      <span className={styles.dropdownItemIcon}>¶</span>
                      <span>Paragraph Text</span>
                    </button>
                    <button
                      className={styles.dropdownItem}
                      onClick={() => {
                        addTextElement('bullets');
                        setShowTextMenu(false);
                      }}
                    >
                      <span className={styles.dropdownItemIcon}>•</span>
                      <span>Bullet Points</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Add Shapes Dropdown */}
              <div className={styles.dropdownContainer}>
                <button
                  className={styles.toolPill}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowShapesMenu(!showShapesMenu);
                    setShowTextMenu(false);
                    setShowAddSlideMenu(false);
                  }}
                  title="Insert Shape"
                >
                  <Square size={15} />
                  <span>Shape ▾</span>
                </button>
                {showShapesMenu && (
                  <div className={styles.dropdownMenu} style={{ minWidth: 260, padding: 10 }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>
                      Realistic 3D & Vector Shapes
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => { addShapeElement('cube', shapeRealisticStyle); setShowShapesMenu(false); }}
                      >
                        <span style={{ fontSize: 14 }}>🧊</span>
                        <span>3D Cube</span>
                      </button>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => { addShapeElement('cylinder', shapeRealisticStyle); setShowShapesMenu(false); }}
                      >
                        <span style={{ fontSize: 14 }}>🛢️</span>
                        <span>3D Cylinder</span>
                      </button>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => { addShapeElement('circle', shapeRealisticStyle); setShowShapesMenu(false); }}
                      >
                        <span style={{ fontSize: 14 }}>🔮</span>
                        <span>3D Sphere</span>
                      </button>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => { addShapeElement('rect', shapeRealisticStyle); setShowShapesMenu(false); }}
                      >
                        <span style={{ fontSize: 14 }}>💳</span>
                        <span>Glass Card</span>
                      </button>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => { addShapeElement('arrow', shapeRealisticStyle); setShowShapesMenu(false); }}
                      >
                        <span style={{ fontSize: 14 }}>➡️</span>
                        <span>3D Arrow</span>
                      </button>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => { addShapeElement('callout', shapeRealisticStyle); setShowShapesMenu(false); }}
                      >
                        <span style={{ fontSize: 14 }}>💬</span>
                        <span>Callout Bubble</span>
                      </button>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => { addShapeElement('star', shapeRealisticStyle); setShowShapesMenu(false); }}
                      >
                        <span style={{ fontSize: 14 }}>⭐</span>
                        <span>Faceted Star</span>
                      </button>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => { addShapeElement('diamond', shapeRealisticStyle); setShowShapesMenu(false); }}
                      >
                        <span style={{ fontSize: 14 }}>💎</span>
                        <span>Diamond Prism</span>
                      </button>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => { addShapeElement('hexagon', shapeRealisticStyle); setShowShapesMenu(false); }}
                      >
                        <span style={{ fontSize: 14 }}>⬡</span>
                        <span>Hexagon Badge</span>
                      </button>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => { addShapeElement('sticky', shapeRealisticStyle); setShowShapesMenu(false); }}
                      >
                        <span style={{ fontSize: 14 }}>📝</span>
                        <span>3D Sticky Note</span>
                      </button>
                    </div>

                    <div style={{ margin: '8px 0 6px', borderTop: '1px solid #e2e8f0', paddingTop: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 5 }}>
                        Material Finish:
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(['shaded', 'glass', 'glossy', 'metallic', 'neumorphic'] as const).map((st) => (
                          <button
                            key={st}
                            className={`${styles.formatBtn} ${shapeRealisticStyle === st ? styles.formatBtnActive : ''}`}
                            style={{ fontSize: 10, padding: '3px 6px', textTransform: 'capitalize' }}
                            onClick={() => setShapeRealisticStyle(st)}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Add Image */}
              <button
                className={styles.toolPill}
                onClick={() => setShowImageModal(true)}
                title="Insert Image"
              >
                <ImageIcon size={15} />
                <span>Image</span>
              </button>

              {/* Add Table */}
              <button
                className={styles.toolPill}
                onClick={addTableElement}
                title="Insert Structured Table"
              >
                <Table2 size={15} />
                <span>Table</span>
              </button>

              {/* Add Code Block */}
              <button
                className={styles.toolPill}
                onClick={addCodeElement}
                title="Insert Code Snippet"
              >
                <Code2 size={15} />
                <span>Code</span>
              </button>
            </>
          )}

          {/* INSERT TAB TOOLS */}
          {activeRibbonTab === 'insert' && (
            <>
              <button
                className={styles.toolPill}
                onClick={() => addTextElement('body')}
                title="Insert Textbox"
              >
                <Type size={15} />
                <span>Textbox</span>
              </button>
              <button
                className={styles.toolPill}
                onClick={() => setShowImageModal(true)}
                title="Insert Picture"
              >
                <ImageIcon size={15} />
                <span>Picture</span>
              </button>
              <button
                className={styles.toolPill}
                onClick={addTableElement}
                title="Insert Grid Table"
              >
                <Table2 size={15} />
                <span>Table</span>
              </button>
              <button
                className={styles.toolPill}
                onClick={() => addShapeElement('rect')}
                title="Insert Rectangle"
              >
                <Square size={15} />
                <span>Rectangle</span>
              </button>
              <button
                className={styles.toolPill}
                onClick={() => addShapeElement('circle')}
                title="Insert Circle"
              >
                <Circle size={15} />
                <span>Circle</span>
              </button>
              <button
                className={styles.toolPill}
                onClick={() => addShapeElement('arrow')}
                title="Insert Arrow"
              >
                <ArrowRight size={15} />
                <span>Arrow</span>
              </button>
              <button
                className={styles.toolPill}
                onClick={addCodeElement}
                title="Insert Live Code Sandbox"
              >
                <Code2 size={15} />
                <span>Code Block</span>
              </button>
              <button
                className={styles.toolPill}
                onClick={() => fileInputRef.current?.click()}
                title="Attach Document or Resource File"
              >
                <UploadCloud size={15} />
                <span>Attach File</span>
              </button>
              <button
                className={styles.toolPill}
                onClick={() => setShowLinkModal(true)}
                title="Attach Web Link"
              >
                <ExternalLink size={15} />
                <span>Link</span>
              </button>
            </>
          )}

          {/* DRAW / VECTOR DRAWING TOOLS */}
          {activeRibbonTab === 'draw' && (
            <>
              <button
                className={`${styles.toolPill} ${isDrawingMode ? styles.toolPillActive : ''}`}
                onClick={() => setIsDrawingMode(!isDrawingMode)}
                title="Toggle Vector Drawing Mode on Slide"
                style={{
                  background: isDrawingMode ? '#eff6ff' : undefined,
                  borderColor: isDrawingMode ? '#6366f1' : undefined,
                  color: isDrawingMode ? '#4f46e5' : undefined,
                  fontWeight: 700,
                }}
              >
                <PenTool size={14} />
                <span>{isDrawingMode ? 'Drawing Active (Click to Exit)' : 'Draw on Slide'}</span>
              </button>

              <div className={styles.dividerSep} />

              <div className={styles.drawToolGroup}>
                <button
                  className={`${styles.drawToolBtn} ${drawTool === 'pen' ? styles.drawToolBtnActive : ''}`}
                  onClick={() => { setDrawTool('pen'); setIsDrawingMode(true); }}
                  title="Smooth Pen"
                >
                  <span>✏️ Pen</span>
                </button>
                <button
                  className={`${styles.drawToolBtn} ${drawTool === 'highlighter' ? styles.drawToolBtnActive : ''}`}
                  onClick={() => { setDrawTool('highlighter'); setIsDrawingMode(true); }}
                  title="Highlighter (Semi-transparent)"
                >
                  <span>🖍️ Highlighter</span>
                </button>
                <button
                  className={`${styles.drawToolBtn} ${drawTool === 'marker' ? styles.drawToolBtnActive : ''}`}
                  onClick={() => { setDrawTool('marker'); setIsDrawingMode(true); }}
                  title="Bold Marker"
                >
                  <span>🖌️ Marker</span>
                </button>
                <button
                  className={`${styles.drawToolBtn} ${drawTool === 'eraser' ? styles.drawToolBtnActive : ''}`}
                  onClick={() => { setDrawTool('eraser'); setIsDrawingMode(true); }}
                  title="Eraser"
                >
                  <span>🧹 Eraser</span>
                </button>
              </div>

              <div className={styles.dividerSep} />

              {/* Color Swatches */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {['#0f172a', '#ef4444', '#f59e0b', '#10b981', '#0ea5e9', '#6366f1', '#ec4899'].map((c) => (
                  <button
                    key={c}
                    className={`${styles.drawColorSwatch} ${drawColor === c ? styles.drawColorSwatchActive : ''}`}
                    style={{ background: c }}
                    onClick={() => { setDrawColor(c); setIsDrawingMode(true); }}
                    title={`Color ${c}`}
                  />
                ))}
                <div
                  className={styles.colorPickerBtn}
                  style={{ width: 22, height: 22, borderRadius: '50%', background: drawColor }}
                  title="Custom Draw Color"
                >
                  <input
                    type="color"
                    className={styles.hiddenColorInput}
                    value={drawColor}
                    onChange={(e) => { setDrawColor(e.target.value); setIsDrawingMode(true); }}
                  />
                </div>
              </div>

              <div className={styles.dividerSep} />

              {/* Stroke Size */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {[
                  { label: 'Fine', size: 2 },
                  { label: 'Med', size: 5 },
                  { label: 'Bold', size: 10 },
                ].map((s) => (
                  <button
                    key={s.label}
                    className={`${styles.formatBtn} ${drawSize === s.size ? styles.formatBtnActive : ''}`}
                    onClick={() => { setDrawSize(s.size); setIsDrawingMode(true); }}
                    title={`${s.label} Stroke (${s.size}px)`}
                    style={{ fontSize: 11, padding: '3px 7px' }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className={styles.dividerSep} />

              <button
                className={styles.whiteboardLaunchBtn}
                onClick={() => setShowWhiteboardModal(true)}
                title="Launch Whiteboard Studio"
              >
                <Sparkles size={14} />
                <span>Whiteboard Studio</span>
              </button>
            </>
          )}

          {/* DESIGN TAB TOOLS */}
          {activeRibbonTab === 'design' && (
            <>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, marginRight: 4 }}>
                Slide Background:
              </span>
              {GRADIENT_PRESETS.slice(0, 4).map((p) => (
                <button
                  key={p.name}
                  className={styles.toolPill}
                  style={{
                    border: currentSlide?.background?.value === p.value ? '2px solid #818cf8' : undefined,
                    padding: '4px 10px',
                    fontSize: 11.5,
                  }}
                  onClick={() => updateSlide({ background: { type: 'gradient', value: p.value } })}
                  title={p.name}
                >
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      background: p.value,
                      display: 'inline-block',
                      marginRight: 4,
                    }}
                  />
                  <span>{p.name}</span>
                </button>
              ))}
              <div
                className={styles.colorPickerBtn}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: currentSlide?.background?.value || '#0a0d16',
                }}
                title="Choose Custom Slide Background Color"
              >
                <input
                  type="color"
                  className={styles.hiddenColorInput}
                  value={currentSlide?.background?.value?.startsWith('#') ? currentSlide.background.value : '#0a0d16'}
                  onChange={(e) => updateSlide({ background: { type: 'color', value: e.target.value } })}
                />
              </div>
            </>
          )}

          {/* SLIDESHOW TAB TOOLS */}
          {activeRibbonTab === 'slideshow' && (
            <>
              <button
                className={`${styles.toolPill} ${styles.btnPrimary}`}
                onClick={() => router.push(`/present/${presentation?.id}`)}
                title="Play Presentation From Beginning"
                style={{ background: 'var(--accent-primary)', color: '#fff' }}
              >
                <Play size={14} fill="currentColor" />
                <span>From Beginning (F5)</span>
              </button>
              <button
                className={styles.toolPill}
                onClick={() => router.push(`/present/${presentation?.id}?slide=${currentSlideIndex}`)}
                title="Play From Current Slide"
              >
                <MonitorPlay size={14} />
                <span>From Current Slide</span>
              </button>
              <button
                className={styles.toolPill}
                onClick={() => {
                  setActiveResourceTab('notes');
                  setIsRightPanelCollapsed(false);
                }}
                title="View Speaker Talking Notes"
              >
                <MessageSquare size={14} />
                <span>Presenter Notes</span>
              </button>
            </>
          )}
        </div>

        {/* Contextual Format Bar when element is selected */}
        {selectedElement && (
          <div className={styles.formatBar}>
            {selectedElement.type === 'text' && (
              <>
                <select
                  className={styles.formatSelect}
                  value={selectedElement.style?.fontFamily || 'var(--font-sans)'}
                  onChange={(e) =>
                    updateElement(selectedElement.id, {
                      style: { ...selectedElement.style, fontFamily: e.target.value },
                    })
                  }
                >
                  <option value="var(--font-sans)">Sans-Serif</option>
                  <option value="var(--font-display)">Display</option>
                  <option value="var(--font-comic)">Comic Neue</option>
                  <option value="var(--font-mono)">Code Mono</option>
                  <option value="var(--font-serif)">Editorial Serif</option>
                </select>

                <select
                  className={styles.formatSelect}
                  value={selectedElement.style?.fontSize || '1.25rem'}
                  onChange={(e) =>
                    updateElement(selectedElement.id, {
                      style: { ...selectedElement.style, fontSize: e.target.value },
                    })
                  }
                >
                  <option value="1rem">Small (16px)</option>
                  <option value="1.25rem">Body (20px)</option>
                  <option value="1.75rem">H2 (28px)</option>
                  <option value="2.5rem">H1 (40px)</option>
                  <option value="3.5rem">Display (56px)</option>
                </select>

                <button
                  className={`${styles.formatBtn} ${
                    selectedElement.style?.fontWeight === '700' || selectedElement.style?.fontWeight === '800'
                      ? styles.formatBtnActive
                      : ''
                  }`}
                  onClick={() =>
                    updateElement(selectedElement.id, {
                      style: {
                        ...selectedElement.style,
                        fontWeight: selectedElement.style?.fontWeight === '700' ? '400' : '700',
                      },
                    })
                  }
                  title="Bold"
                >
                  <Bold size={14} />
                </button>

                <button
                  className={`${styles.formatBtn} ${
                    selectedElement.style?.fontStyle === 'italic' ? styles.formatBtnActive : ''
                  }`}
                  onClick={() =>
                    updateElement(selectedElement.id, {
                      style: {
                        ...selectedElement.style,
                        fontStyle: selectedElement.style?.fontStyle === 'italic' ? 'normal' : 'italic',
                      },
                    })
                  }
                  title="Italic"
                >
                  <Italic size={14} />
                </button>

                {/* Text Alignment */}
                <button
                  className={`${styles.formatBtn} ${
                    selectedElement.style?.textAlign === 'left' || !selectedElement.style?.textAlign ? styles.formatBtnActive : ''
                  }`}
                  onClick={() =>
                    updateElement(selectedElement.id, {
                      style: { ...selectedElement.style, textAlign: 'left' },
                    })
                  }
                  title="Align Left"
                >
                  <AlignLeft size={14} />
                </button>

                <button
                  className={`${styles.formatBtn} ${
                    selectedElement.style?.textAlign === 'center' ? styles.formatBtnActive : ''
                  }`}
                  onClick={() =>
                    updateElement(selectedElement.id, {
                      style: { ...selectedElement.style, textAlign: 'center' },
                    })
                  }
                  title="Align Center"
                >
                  <AlignCenter size={14} />
                </button>

                <button
                  className={`${styles.formatBtn} ${
                    selectedElement.style?.textAlign === 'right' ? styles.formatBtnActive : ''
                  }`}
                  onClick={() =>
                    updateElement(selectedElement.id, {
                      style: { ...selectedElement.style, textAlign: 'right' },
                    })
                  }
                  title="Align Right"
                >
                  <AlignRight size={14} />
                </button>

                <div className={styles.colorPickerBtn} style={{ background: selectedElement.style?.color || '#f8fafc' }}>
                  <input
                    type="color"
                    className={styles.hiddenColorInput}
                    value={selectedElement.style?.color || '#f8fafc'}
                    onChange={(e) =>
                      updateElement(selectedElement.id, {
                        style: { ...selectedElement.style, color: e.target.value },
                      })
                    }
                    title="Text Color"
                  />
                </div>
              </>
            )}

            {selectedElement.type === 'shape' && (
              <div
                className={styles.colorPickerBtn}
                style={{ background: selectedElement.style?.backgroundColor || '#1e293b' }}
              >
                <input
                  type="color"
                  className={styles.hiddenColorInput}
                  value={selectedElement.style?.backgroundColor || '#1e293b'}
                  onChange={(e) =>
                    updateElement(selectedElement.id, {
                      style: { ...selectedElement.style, backgroundColor: e.target.value },
                    })
                  }
                  title="Fill Color"
                />
              </div>
            )}

            <div className={styles.dividerSep} />

            {/* Layer Ordering */}
            <button
              className={styles.formatBtn}
              onClick={() => bringToFront(selectedElement.id)}
              title="Bring to Front"
            >
              <ChevronUp size={15} />
            </button>
            <button
              className={styles.formatBtn}
              onClick={() => sendToBack(selectedElement.id)}
              title="Send to Back"
            >
              <ChevronDown size={15} />
            </button>
            <button
              className={styles.formatBtn}
              onClick={() => duplicateElement(selectedElement.id)}
              title="Duplicate (Ctrl+D)"
            >
              <Copy size={14} />
            </button>
            <button
              className={styles.formatBtn}
              onClick={() => deleteElement(selectedElement.id)}
              title="Delete (Del)"
              style={{ color: 'var(--accent-rose)' }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ─── 2.5 TOP HORIZONTAL SLIDE DECK BAR (AT TOP BAR, NOT LEFT) ─── */}
      <div className={styles.topSlideBar} aria-label="Slide Deck Ribbon">
        {/* Left Controls: Add Slide + Navigation + Counter */}
        <div className={styles.topSlideBarLeft}>
          <div className={styles.dropdownContainer}>
            <button
              className={styles.newSlideTopBtn}
              onClick={(e) => {
                e.stopPropagation();
                setShowAddSlideMenu(!showAddSlideMenu);
              }}
              title="Add New Slide"
            >
              <Plus size={14} />
              <span>New Slide</span>
            </button>
            {showAddSlideMenu && (
              <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    addSlide('titleAndContent');
                    setShowAddSlideMenu(false);
                  }}
                >
                  <FileText size={14} className={styles.dropdownItemIcon} />
                  <span>Title & Content</span>
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    addSlide('title');
                    setShowAddSlideMenu(false);
                  }}
                >
                  <Type size={14} className={styles.dropdownItemIcon} />
                  <span>Title Slide</span>
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    addSlide('twoContent');
                    setShowAddSlideMenu(false);
                  }}
                >
                  <Table2 size={14} className={styles.dropdownItemIcon} />
                  <span>Two Columns</span>
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    addSlide('code');
                    setShowAddSlideMenu(false);
                  }}
                >
                  <Code2 size={14} className={styles.dropdownItemIcon} />
                  <span>Code Focus</span>
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    addSlide('blank');
                    setShowAddSlideMenu(false);
                  }}
                >
                  <Square size={14} className={styles.dropdownItemIcon} />
                  <span>Blank Slide</span>
                </button>
              </div>
            )}
          </div>

          <div className={styles.slideCounterPill}>
            <span>Slide {currentSlideIndex + 1} of {presentation.slides.length}</span>
          </div>

          <div className={styles.slideNavBtnGroup}>
            <button
              className={styles.slideNavBtn}
              disabled={currentSlideIndex <= 0}
              onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
              title="Previous Slide (PageUp / Left)"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              className={styles.slideNavBtn}
              disabled={currentSlideIndex >= presentation.slides.length - 1}
              onClick={() => setCurrentSlideIndex((prev) => Math.min(presentation.slides.length - 1, prev + 1))}
              title="Next Slide (PageDown / Right)"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Center: Horizontal Scrolling Slide Strip */}
        <div className={styles.topSlideStrip} ref={slideStripRef}>
          {presentation.slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`${styles.topSlideCard} ${index === currentSlideIndex ? styles.topSlideCardActive : ''}`}
              onClick={() => setCurrentSlideIndex(index)}
              title={`Jump to Slide ${index + 1}`}
            >
              <span className={styles.topSlideNumberBadge}>{index + 1}</span>
              <div
                className={styles.topSlideThumbnail}
                style={{ background: slide.background?.value || '#ffffff' }}
              >
                {slide.elements.slice(0, 4).map((el) => (
                  <div
                    key={el.id}
                    className={styles.miniElement}
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      width: `${el.width}%`,
                      height: `${el.height}%`,
                      background: el.type === 'text' ? 'rgba(15, 23, 42, 0.4)' : el.type === 'shape' ? '#6366f1' : '#0ea5e9',
                    }}
                  />
                ))}
              </div>

              {/* Hover actions */}
              <div className={styles.topSlideActions} onClick={(e) => e.stopPropagation()}>
                {index > 0 && (
                  <button
                    className={styles.miniSlideBtn}
                    onClick={() => moveSlide(index, 'up')}
                    title="Move Left"
                  >
                    <ChevronLeft size={11} />
                  </button>
                )}
                {index < presentation.slides.length - 1 && (
                  <button
                    className={styles.miniSlideBtn}
                    onClick={() => moveSlide(index, 'down')}
                    title="Move Right"
                  >
                    <ChevronRight size={11} />
                  </button>
                )}
                <button
                  className={styles.miniSlideBtn}
                  onClick={() => duplicateSlide(index)}
                  title="Duplicate Slide"
                >
                  <Copy size={11} />
                </button>
                {presentation.slides.length > 1 && (
                  <button
                    className={`${styles.miniSlideBtn} ${styles.miniSlideBtnDelete}`}
                    onClick={() => deleteSlide(index)}
                    title="Delete Slide"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Quick Add Slide Card Button at End of Strip */}
          <button
            className={styles.topSlideAddQuickCard}
            onClick={() => addSlide('titleAndContent')}
            title="Append New Slide"
          >
            <Plus size={16} />
            <span>Add Slide</span>
          </button>
        </div>

        {/* Right Quick Actions */}
        <div className={styles.topSlideBarRight}>
          <button
            className={styles.topBarToolBtn}
            onClick={() => setShowWhiteboardModal(true)}
            title="Whiteboard Studio"
          >
            <PenTool size={13} />
            <span>Whiteboard</span>
          </button>
          <button
            className={styles.topBarPresentBtn}
            onClick={() => router.push(`/present/${presentation.id}`)}
            title="Enter Presentation Mode"
          >
            <Play size={13} fill="currentColor" />
            <span>Present</span>
          </button>
        </div>
      </div>

      {/* ─── 3. MAIN WORKSPACE: 70% PRESENTATION CANVAS + DIAGONAL DIVIDER + 30% RESOURCES ─── */}
      <div className={styles.workspaceStage} ref={containerRef}>
        {/* ─── MAIN POWERPOINT SLIDE CANVAS AREA ─── */}
        <main
          className={styles.slideArea}
          style={{
            width: isRightPanelCollapsed ? '100%' : `calc(${dividerPosition}% - 14px)`,
            flex: isRightPanelCollapsed ? 1 : 'none',
          }}
          onClick={() => setSelectedElementId(null)}
        >
          <div className={styles.slideViewport}>
            <div
              className={styles.slideStage}
              style={{
                background: currentSlide?.background?.value || '#ffffff',
                transform: `scale(${zoomLevel / 100})`,
              }}
              ref={slideCanvasRef}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedElementId(null);
              }}
            >
              {currentSlide?.elements.map((el) => (
                <div
                  key={el.id}
                  className={`${styles.slideElement} ${el.id === selectedElementId ? styles.slideElementSelected : ''}`}
                  style={{
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    width: `${el.width}%`,
                    height: `${el.height}%`,
                    zIndex: el.id === selectedElementId ? 30 : 10,
                  }}
                  onMouseDown={(e) => {
                    startDragElement(e, el);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElementId(el.id);
                  }}
                >
                  <div className={styles.elementInner}>
                    {/* Text Element */}
                    {el.type === 'text' && (
                      <div
                        className={styles.editableText}
                        style={el.style}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const newText = e.currentTarget.textContent || '';
                          updateElement(el.id, { content: newText });
                        }}
                      >
                        {el.content}
                      </div>
                    )}

                    {/* Image Element */}
                    {el.type === 'image' && (
                      <img
                        src={el.content}
                        alt="Slide element"
                        className={styles.slideImage}
                        draggable={false}
                      />
                    )}

                    {/* Realistic 3D Shape Element */}
                    {el.type === 'shape' && (
                      <RealisticShape
                        element={el}
                        isEditable={true}
                        onContentChange={(newContent) => updateElement(el.id, { content: newContent })}
                      />
                    )}

                    {/* Vector Freehand Drawing Element */}
                    {el.type === 'drawing' && el.content && (
                      <div
                        className={styles.drawingElementWrapper}
                        dangerouslySetInnerHTML={{ __html: el.content }}
                      />
                    )}

                    {/* Table Element */}
                    {el.type === 'table' && el.tableData && (
                      <div className={styles.slideTableWrapper}>
                        <table className={styles.slideTable}>
                          <tbody>
                            {el.tableData.rows.map((row, rIdx) => (
                              <tr key={rIdx}>
                                {row.map((cell, cIdx) => (
                                  <td
                                    key={cIdx}
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => {
                                      const newRows = el.tableData!.rows.map((r, ri) =>
                                        r.map((c, ci) => (ri === rIdx && ci === cIdx ? e.currentTarget.textContent || '' : c))
                                      );
                                      updateElement(el.id, { tableData: { rows: newRows } });
                                    }}
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Code Snippet Block */}
                    {el.type === 'code' && (
                      <div className={styles.codeBlockElement}>
                        <div className={styles.codeBlockHeader}>
                          <span className={styles.codeDot} style={{ background: '#f87171' }} />
                          <span className={styles.codeDot} style={{ background: '#fbbf24' }} />
                          <span className={styles.codeDot} style={{ background: '#34d399' }} />
                          <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>code snippet</span>
                        </div>
                        <pre
                          className={styles.codePre}
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const newCode = e.currentTarget.textContent || '';
                            updateElement(el.id, { content: newCode });
                          }}
                        >
                          {el.content}
                        </pre>
                      </div>
                    )}

                    {/* Excalidraw / Diagram SVG */}
                    {el.type === 'excalidraw' && el.content && (
                      <div
                        className={styles.excalidrawElementWrapper}
                        dangerouslySetInnerHTML={{ __html: el.content }}
                      />
                    )}
                  </div>

                  {/* 8-point Resize Handles when selected */}
                  {el.id === selectedElementId && (
                    <>
                      <div className={`${styles.resizeHandle} ${styles.handle_nw}`} onMouseDown={(e) => startResizeElement(e, el, 'nw')} />
                      <div className={`${styles.resizeHandle} ${styles.handle_ne}`} onMouseDown={(e) => startResizeElement(e, el, 'ne')} />
                      <div className={`${styles.resizeHandle} ${styles.handle_se}`} onMouseDown={(e) => startResizeElement(e, el, 'se')} />
                      <div className={`${styles.resizeHandle} ${styles.handle_sw}`} onMouseDown={(e) => startResizeElement(e, el, 'sw')} />
                      <div className={`${styles.resizeHandle} ${styles.handle_n}`}  onMouseDown={(e) => startResizeElement(e, el, 'n')} />
                      <div className={`${styles.resizeHandle} ${styles.handle_s}`}  onMouseDown={(e) => startResizeElement(e, el, 's')} />
                      <div className={`${styles.resizeHandle} ${styles.handle_w}`}  onMouseDown={(e) => startResizeElement(e, el, 'w')} />
                      <div className={`${styles.resizeHandle} ${styles.handle_e}`}  onMouseDown={(e) => startResizeElement(e, el, 'e')} />
                    </>
                  )}
                </div>
              ))}

              {/* In-Slide Vector Drawing Canvas Overlay */}
              {isDrawingMode && (
                <SlideDrawingCanvas
                  activeTool={drawTool}
                  color={drawColor}
                  size={drawSize}
                  onSaveDrawing={(svgString: string) => {
                    if (!currentSlide) return;
                    const newEl: SlideElement = {
                      id: generateId(),
                      type: 'drawing',
                      x: 5,
                      y: 5,
                      width: 90,
                      height: 90,
                      content: svgString,
                      style: { pointerEvents: 'none' },
                    };
                    updateSlide({ elements: [...currentSlide.elements, newEl] });
                    setIsDrawingMode(false);
                    toast.success('Vector drawing inserted onto slide!');
                  }}
                  onClose={() => setIsDrawingMode(false)}
                />
              )}
            </div>
          </div>

          {/* Canvas Floating Zoom Bar */}
          <div className={styles.canvasZoomBar}>
            <button className={styles.zoomBtn} onClick={() => setZoomLevel((z) => Math.max(50, z - 10))} title="Zoom Out">
              <ZoomOut size={13} />
            </button>
            <span className={styles.zoomLabel}>{zoomLevel}%</span>
            <button className={styles.zoomBtn} onClick={() => setZoomLevel((z) => Math.min(150, z + 10))} title="Zoom In">
              <ZoomIn size={13} />
            </button>
            <button className={styles.zoomBtn} onClick={() => setZoomLevel(100)} title="Reset Zoom">
              <RotateCcw size={13} />
            </button>
          </div>
        </main>

        {/* ─── SIGNATURE DIAGONAL SLASH DIVIDER ─── */}
        {!isRightPanelCollapsed && (
          <div
            className={`${styles.diagonalDivider} ${isDraggingDivider ? styles.dividerActive : ''}`}
            onMouseDown={handleDividerMouseDown}
            onDoubleClick={() => setDividerPosition(70)}
            title="Drag to adjust presentation / resource split (Double-click to reset)"
          >
            <svg
              className={styles.slashSvg}
              preserveAspectRatio="none"
              viewBox="0 0 28 1000"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="editorSlashGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                  <stop offset="25%" stopColor="#f97316" stopOpacity="0.95" />
                  <stop offset="50%" stopColor="#fb923c" stopOpacity="1" />
                  <stop offset="75%" stopColor="#f59e0b" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
                </linearGradient>
                <filter id="editorSlashGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <line
                x1="22"
                y1="0"
                x2="6"
                y2="1000"
                stroke="#f97316"
                strokeWidth="5"
                opacity="0.2"
                filter="url(#editorSlashGlow)"
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1="22"
                y1="0"
                x2="6"
                y2="1000"
                stroke="url(#editorSlashGrad)"
                strokeWidth="2.5"
                filter="url(#editorSlashGlow)"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <div className={styles.slashPillHandle}>
              <span className={styles.slashRatioLabel}>
                {Math.round(dividerPosition)} / {Math.round(100 - dividerPosition)}
              </span>
            </div>
          </div>
        )}

        {/* ─── 30% RIGHT WORKSPACE PANEL (RESOURCES + NOTES) ─── */}
        <aside
          className={styles.rightWorkspacePanel}
          style={{
            width: isRightPanelCollapsed ? '0px' : `calc(${100 - dividerPosition}% - 14px)`,
            display: isRightPanelCollapsed ? 'none' : 'flex',
          }}
          aria-label="Interactive Resources and Notes"
        >
          {/* Header Tabs: Resources | Notes | Collapse */}
          <div className={styles.rightPanelHeaderTabs}>
            <button
              className={`${styles.rightPanelTabBtn} ${activeResourceTab === 'resources' ? styles.rightPanelTabBtnActive : ''}`}
              onClick={() => setActiveResourceTab('resources')}
              title="Slide Resources"
            >
              <Folder size={13} />
              <span>Resources</span>
              <span className={styles.resourceTabBadge}>{currentSlide?.resources?.length || 0}</span>
            </button>
            <button
              className={`${styles.rightPanelTabBtn} ${activeResourceTab === 'notes' ? styles.rightPanelTabBtnActive : ''}`}
              onClick={() => setActiveResourceTab('notes')}
              title="Speaker Notes"
            >
              <MessageSquare size={13} />
              <span>Notes</span>
              <span className={styles.resourceTabBadge}>{currentSlide?.notes?.length || 0}</span>
            </button>
            <button
              className={styles.rightPanelToggleBtn}
              onClick={() => setIsRightPanelCollapsed(true)}
              title="Collapse Resource Panel"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Panel Content Area */}
          <div className={styles.rightPanelContentArea}>
            {/* 1. RESOURCES TAB */}
            {activeResourceTab === 'resources' && (
              <>
                {/* Whiteboard Studio Quick Integration Card */}
                <div
                  style={{
                    padding: '12px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(56, 189, 248, 0.05))',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '12px', color: '#4f46e5' }}>
                      <Sparkles size={14} color="#6366f1" />
                      <span>Whiteboard Studio</span>
                    </div>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(99,102,241,0.12)', color: '#4f46e5', fontWeight: 600 }}>
                      Excalidraw
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                    Draw diagrams & sketches, then export directly to active slide as an image.
                  </p>
                  <button
                    className={styles.whiteboardLaunchBtn}
                    onClick={() => setShowWhiteboardModal(true)}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <PenTool size={13} />
                    <span>Open Whiteboard Studio</span>
                  </button>
                </div>

                {/* Drag & Drop Upload Zone */}
                <div
                  className={styles.dropzone}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFileUpload(e.dataTransfer.files);
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    multiple
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                  <UploadCloud size={24} className={styles.dropzoneIcon} />
                  <span className={styles.dropzoneText}>Click or drop files to attach</span>
                  <span className={styles.dropzoneSub}>PDF, Code (.js, .html, .py), Docs, Images</span>
                </div>

                {/* Action Buttons */}
                <div className={styles.actionRow}>
                  <button
                    className={styles.subActionBtn}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus size={14} />
                    <span>Upload File</span>
                  </button>
                  <button
                    className={styles.subActionBtn}
                    onClick={() => setShowLinkModal(true)}
                  >
                    <ExternalLink size={14} />
                    <span>Add Link</span>
                  </button>
                </div>

                {/* Attached Resources List */}
                {currentSlide?.resources && currentSlide.resources.length > 0 ? (
                  currentSlide.resources.map((res) => (
                    <div key={res.id} className={styles.resourceCard}>
                      <div className={styles.resourceLeft}>
                        <div className={styles.resourceIcon}>
                          {res.type === 'code' ? (
                            <Code2 size={16} />
                          ) : res.type === 'document' || res.name.toLowerCase().endsWith('.pdf') ? (
                            <FileText size={16} />
                          ) : res.type === 'link' ? (
                            <ExternalLink size={16} />
                          ) : (
                            <Folder size={16} />
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div className={styles.resourceName} title={res.name}>{res.name}</div>
                          <div className={styles.resourceMeta}>
                            {res.type} {res.size ? `• ${(res.size / 1024).toFixed(1)} KB` : ''}
                          </div>
                        </div>
                      </div>

                      <div className={styles.resourceActions}>
                        {(res.type === 'document' || res.name.toLowerCase().endsWith('.pdf')) && (
                          <button
                            className={styles.resBtn}
                            onClick={() => openPdfResource(res)}
                            title="Preview PDF"
                          >
                            View
                          </button>
                        )}

                        {res.type === 'code' && (
                          <button
                            className={`${styles.resBtn} ${styles.resBtnRun}`}
                            onClick={() => runCodeResource(res)}
                            title="Run Live Sandbox"
                          >
                            <Play size={12} fill="currentColor" />
                            <span>Run</span>
                          </button>
                        )}

                        {res.type === 'image' && res.url && (
                          <button
                            className={styles.resBtn}
                            onClick={() => {
                              const newElem: SlideElement = {
                                id: generateId(),
                                type: 'image',
                                x: 25,
                                y: 25,
                                width: 50,
                                height: 50,
                                content: res.url || '',
                                style: { borderRadius: '6px' },
                              };
                              const updatedElements = [...currentSlide.elements, newElem];
                              const newSlides = [...presentation.slides];
                              newSlides[currentSlideIndex] = { ...currentSlide, elements: updatedElements };
                              setPresentation({ ...presentation, slides: newSlides });
                              pushHistory(newSlides);
                              setSelectedElementId(newElem.id);
                              setHasChanges(true);
                              toast.success('Inserted image onto slide');
                            }}
                            title="Insert image onto current slide"
                          >
                            Insert
                          </button>
                        )}

                        {res.type === 'link' && res.url && (
                          <button
                            className={styles.resBtn}
                            onClick={() => window.open(res.url, '_blank')}
                            title="Open Link"
                          >
                            <ExternalLink size={12} />
                          </button>
                        )}

                        <button
                          className={`${styles.resBtn} ${styles.resBtnDelete}`}
                          onClick={() =>
                            updateSlide({
                              resources: currentSlide.resources.filter((r) => r.id !== res.id),
                            })
                          }
                          title="Delete resource"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, padding: '24px 0' }}>
                    No resources attached to this slide yet.
                  </div>
                )}
              </>
            )}

            {/* 2. NOTES TAB */}
            {activeResourceTab === 'notes' && (
              <>
                <button
                  className={styles.subActionBtn}
                  onClick={addNote}
                  style={{ width: '100%' }}
                >
                  <Plus size={14} />
                  <span>Add Speaker Note</span>
                </button>

                {currentSlide?.notes && currentSlide.notes.length > 0 ? (
                  currentSlide.notes.map((note, nIdx) => (
                    <div key={note.id} className={styles.comicNoteCard}>
                      <div className={styles.comicNoteHeader}>
                        <span>💬 Note #{nIdx + 1}</span>
                        <button
                          className={styles.comicNoteDeleteBtn}
                          onClick={() =>
                            updateSlide({
                              notes: currentSlide.notes.filter((n) => n.id !== note.id),
                            })
                          }
                          title="Delete Note"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <textarea
                        className={styles.comicNoteTextarea}
                        rows={4}
                        value={note.content || ''}
                        onChange={(e) => {
                          const updated = currentSlide.notes.map((n) =>
                            n.id === note.id ? { ...n, content: e.target.value } : n
                          );
                          updateSlide({ notes: updated });
                        }}
                        placeholder="Type talking points or speaker notes here..."
                      />
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, padding: '24px 0' }}>
                    No speaker notes for this slide yet.
                  </div>
                )}
              </>
            )}
          </div>
        </aside>

        {/* Floating Expand Button for Right Panel when collapsed */}
        {isRightPanelCollapsed && (
          <button
            className={styles.rightPanelToggleBtn}
            style={{
              position: 'absolute',
              right: 12,
              top: 12,
              zIndex: 40,
              background: '#ffffff',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.12)',
            }}
            onClick={() => setIsRightPanelCollapsed(false)}
            title="Expand Resources Panel"
          >
            <Folder size={14} />
          </button>
        )}
      </div>

      {/* ─── POWERPOINT STATUS FOOTER BAR ─── */}
      <footer className={styles.powerpointStatusBar} aria-label="Status Bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span>Slide {currentSlideIndex + 1} of {presentation.slides.length}</span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span>{selectedElement ? `Selected: ${selectedElement.type.toUpperCase()}` : 'Ready'}</span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span>Resources: {currentSlide?.resources?.length || 0} attached</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className={styles.toolPill}
            onClick={() => setShowWhiteboardModal(true)}
            style={{
              height: 22,
              padding: '0 8px',
              fontSize: 11,
              background: 'rgba(99, 102, 241, 0.15)',
              borderColor: 'rgba(99, 102, 241, 0.3)',
              color: '#c7d2fe',
              cursor: 'pointer',
            }}
            title="Launch Whiteboard Studio"
          >
            <PenTool size={11} />
            <span>Whiteboard Studio</span>
          </button>
          <span style={{ opacity: 0.3 }}>|</span>
          <span>Zoom: {zoomLevel}%</span>
          <button
            className={styles.zoomBtn}
            onClick={() => setZoomLevel((prev) => Math.max(50, prev - 10))}
            title="Zoom Out"
            style={{ width: 22, height: 22 }}
          >
            <ZoomOut size={12} />
          </button>
          <button
            className={styles.zoomBtn}
            onClick={() => setZoomLevel((prev) => Math.min(200, prev + 10))}
            title="Zoom In"
            style={{ width: 22, height: 22 }}
          >
            <ZoomIn size={12} />
          </button>
          <button
            className={styles.zoomBtn}
            onClick={() => setZoomLevel(100)}
            title="Reset Zoom"
            style={{ width: 22, height: 22 }}
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </footer>

      {/* ─── MODAL 1: ADD IMAGE ─── */}
      {showImageModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowImageModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                <ImageIcon size={18} />
                <span>Insert Image</span>
              </span>
              <button className={styles.modalCloseBtn} onClick={() => setShowImageModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <button
                  className={`${styles.subActionBtn} ${imageModalTab === 'upload' ? styles.presetBtnActive : ''}`}
                  onClick={() => setImageModalTab('upload')}
                >
                  Upload File
                </button>
                <button
                  className={`${styles.subActionBtn} ${imageModalTab === 'samples' ? styles.presetBtnActive : ''}`}
                  onClick={() => setImageModalTab('samples')}
                >
                  Curated Stock
                </button>
                <button
                  className={`${styles.subActionBtn} ${imageModalTab === 'url' ? styles.presetBtnActive : ''}`}
                  onClick={() => setImageModalTab('url')}
                >
                  Web URL
                </button>
              </div>

              {imageModalTab === 'upload' && (
                <div
                  className={styles.dropzone}
                  onClick={() => imageInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={imageInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file && currentSlide) {
                        const imgId = generateId();
                        await saveLocalFile(imgId, file, file.name);
                        const url = `local:${imgId}`;
                        const resolved = (await getLocalFileUrl(url)) || url;
                        const newEl: SlideElement = {
                          id: generateId(),
                          type: 'image',
                          x: 20,
                          y: 20,
                          width: 60,
                          height: 50,
                          content: resolved,
                          style: {},
                        };
                        updateSlide({ elements: [...currentSlide.elements, newEl] });
                        setSelectedElementId(newEl.id);
                        setShowImageModal(false);
                      }
                    }}
                  />
                  <UploadCloud size={32} className={styles.dropzoneIcon} />
                  <span className={styles.dropzoneText}>Click to browse image from computer</span>
                  <span className={styles.dropzoneSub}>PNG, JPG, WEBP, GIF supported</span>
                </div>
              )}

              {imageModalTab === 'samples' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {SAMPLE_IMAGES.map((img) => (
                    <div
                      key={img.label}
                      style={{
                        borderRadius: 8,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '1px solid var(--border-default)',
                        background: '#090d16',
                        transition: 'transform 0.15s ease',
                      }}
                      onClick={() => {
                        if (currentSlide) {
                          const newEl: SlideElement = {
                            id: generateId(),
                            type: 'image',
                            x: 20,
                            y: 20,
                            width: 60,
                            height: 50,
                            content: img.url,
                            style: {},
                          };
                          updateSlide({ elements: [...currentSlide.elements, newEl] });
                          setSelectedElementId(newEl.id);
                          setShowImageModal(false);
                        }
                      }}
                    >
                      <img src={img.url} alt={img.label} style={{ width: '100%', height: 75, objectFit: 'cover' }} />
                      <div style={{ padding: '6px 8px', fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {img.thumb} {img.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {imageModalTab === 'url' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      fontSize: 13,
                    }}
                  />
                  <button
                    className={`${styles.actionBtn} ${styles.btnPrimary}`}
                    onClick={() => {
                      if (imageUrlInput && currentSlide) {
                        const newEl: SlideElement = {
                          id: generateId(),
                          type: 'image',
                          x: 20,
                          y: 20,
                          width: 60,
                          height: 50,
                          content: imageUrlInput,
                          style: {},
                        };
                        updateSlide({ elements: [...currentSlide.elements, newEl] });
                        setSelectedElementId(newEl.id);
                        setShowImageModal(false);
                        setImageUrlInput('');
                      }
                    }}
                  >
                    Insert Image from URL
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: ADD LINK ─── */}
      {showLinkModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowLinkModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                <ExternalLink size={18} />
                <span>Add Web Link Resource</span>
              </span>
              <button className={styles.modalCloseBtn} onClick={() => setShowLinkModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className={styles.modalBody} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="text"
                placeholder="Link Title (e.g. Documentation)"
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontSize: 13,
                }}
              />
              <input
                type="url"
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontSize: 13,
                }}
              />
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.subActionBtn} onClick={() => setShowLinkModal(false)}>Cancel</button>
              <button
                className={`${styles.actionBtn} ${styles.btnPrimary}`}
                onClick={() => {
                  if (linkUrl && currentSlide) {
                    const newRes: Resource = {
                      id: generateId(),
                      type: 'link',
                      name: linkName || linkUrl,
                      url: linkUrl,
                      createdAt: Date.now(),
                    };
                    updateSlide({ resources: [...currentSlide.resources, newRes] });
                    setShowLinkModal(false);
                    setLinkUrl('');
                    setLinkName('');
                  }
                }}
              >
                Attach Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: LIVE CODE SANDBOX RUNNER ─── */}
      {previewCodeResource && (
        <div className={styles.modalBackdrop} onClick={() => setPreviewCodeResource(null)}>
          <div className={`${styles.modalCard} ${styles.codeRunnerCard}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Code2 size={18} color="var(--accent-blue)" />
                <span className={styles.modalTitle}>Live Code Sandbox — {previewCodeResource.name}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className={`${styles.actionBtn} ${styles.btnPrimary}`}
                  onClick={() => runCodeResource(previewCodeResource)}
                  title="Re-run sandbox"
                >
                  <Play size={14} fill="currentColor" />
                  <span>Run</span>
                </button>
                <button className={styles.modalCloseBtn} onClick={() => setPreviewCodeResource(null)}>
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className={styles.modalBody} style={{ padding: 12 }}>
              <div className={styles.codeRunnerGrid}>
                <div className={styles.codeEditorPane}>
                  <div className={styles.codePaneHeader}>
                    <span>Source Code (Editable)</span>
                    <span style={{ fontSize: 11, color: 'var(--accent-cyan)' }}>Live Execution</span>
                  </div>
                  <textarea
                    className={styles.codeTextarea}
                    value={previewCodeResource.content || ''}
                    onChange={(e) => {
                      setPreviewCodeResource({ ...previewCodeResource, content: e.target.value });
                    }}
                  />
                </div>
                <div className={styles.codePreviewPane}>
                  <iframe
                    className={styles.codeIframe}
                    srcDoc={codeRunnerHtml}
                    title="Live Code Sandbox Output"
                    sandbox="allow-scripts allow-modals"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: IN-APP PDF PREVIEW ─── */}
      {previewPdfResource && (
        <div className={styles.modalBackdrop} onClick={() => setPreviewPdfResource(null)}>
          <div className={`${styles.modalCard} ${styles.codeRunnerCard}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} color="var(--accent-rose)" />
                <span className={styles.modalTitle}>PDF Document — {previewPdfResource.name}</span>
              </div>
              <button className={styles.modalCloseBtn} onClick={() => setPreviewPdfResource(null)}>
                <X size={16} />
              </button>
            </div>
            <div className={styles.modalBody} style={{ padding: 0 }}>
              <iframe
                src={previewPdfResource.url}
                title={previewPdfResource.name}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: INTEGRATED WHITEBOARD STUDIO (EXCALIDRAW) ─── */}
      <WhiteboardModal
        isOpen={showWhiteboardModal}
        onClose={() => setShowWhiteboardModal(false)}
        onExportToSlide={handleExportWhiteboardToSlide}
        onSaveAsResource={handleSaveWhiteboardResource}
        slideNumber={currentSlideIndex + 1}
      />
    </div>
  );
}
