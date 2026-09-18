'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getPresentation, saveSlides, uploadResourceWithTimeout } from '@/lib/firestore';
import { saveLocalFile, getLocalFileUrl } from '@/lib/localFileStore';
import { compressImage } from '@/lib/imageCompressor';
import type { Presentation, Slide, SlideElement, Resource } from '@/lib/types';
import { generateId, getResourceIcon, clamp } from '@/lib/utils';
import ExcalidrawModal from '@/components/excalidraw/ExcalidrawModal';
import InSlideExcalidraw from '@/components/excalidraw/InSlideExcalidraw';
import type { ExcalidrawSavePayload } from '@/components/excalidraw/ExcalidrawWrapper';
import toast from 'react-hot-toast';
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
  { name: 'Midnight Obsidian', value: 'linear-gradient(135deg, #07090e 0%, #131929 100%)' },
  { name: 'Royal Indigo', value: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)' },
  { name: 'Electric Azure', value: 'linear-gradient(135deg, #0c192c 0%, #082f49 100%)' },
  { name: 'Deep Emerald', value: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)' },
  { name: 'Sunset Amethyst', value: 'linear-gradient(135deg, #2e1065 0%, #4c0519 100%)' },
  { name: 'Clean Slate', value: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' },
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
      background: { type: 'color', value: '#0a0d16' },
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
            color: '#f8fafc',
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
      background: { type: 'color', value: '#0c101b' },
      elements: [
        {
          id: 'e3',
          type: 'text',
          x: 8,
          y: 10,
          width: 84,
          height: 16,
          content: 'Slide-Specific Context & Resources',
          style: { fontSize: '2.2rem', fontWeight: '700', color: '#f8fafc' },
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
          style: { fontSize: '1.25rem', color: '#cbd5e1', lineHeight: '1.6' },
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
      background: { type: 'color', value: '#0d1322' },
      elements: [
        {
          id: 'e5',
          type: 'text',
          x: 8,
          y: 10,
          width: 84,
          height: 16,
          content: 'Interactive Live Code Snippet',
          style: { fontSize: '2.2rem', fontWeight: '700', color: '#f8fafc' },
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
  const [zoomLevel, setZoomLevel] = useState(100);

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

  // Excalidraw Slide Component Modal & In-Slide Drawing
  const [showExcalidrawModal, setShowExcalidrawModal] = useState(false);
  const [editingExcalidrawElement, setEditingExcalidrawElement] = useState<SlideElement | null>(null);
  const [isResourceWhiteboard, setIsResourceWhiteboard] = useState(false);
  const [activeInlineExcalidrawId, setActiveInlineExcalidrawId] = useState<string | null>(null);
  const [fullSlideExcalidrawId, setFullSlideExcalidrawId] = useState<string | null>(null);

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
            color: '#f8fafc',
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
            color: '#94a3b8',
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
            color: '#f8fafc',
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
            color: '#cbd5e1',
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
          style: { fontSize: '2.2rem', fontWeight: '700', color: '#f8fafc' },
        },
        {
          id: generateId(),
          type: 'text',
          x: 8,
          y: 30,
          width: 40,
          height: 55,
          content: 'Approach A:\n• Simple implementation\n• Fast delivery\n• Lower overhead',
          style: { fontSize: '1.15rem', color: '#cbd5e1' },
        },
        {
          id: generateId(),
          type: 'text',
          x: 52,
          y: 30,
          width: 40,
          height: 55,
          content: 'Approach B:\n• High scalability\n• Strict typing\n• Long-term stability',
          style: { fontSize: '1.15rem', color: '#cbd5e1' },
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
          style: { fontSize: '2.2rem', fontWeight: '700', color: '#f8fafc' },
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
      background: { type: 'color', value: '#0a0d16' },
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
        color: '#f8fafc',
        fontFamily: 'var(--font-sans)',
        textAlign: 'left',
      },
    };

    updateSlide({ elements: [...currentSlide.elements, newEl] });
    setSelectedElementId(newEl.id);
    setShowTextMenu(false);
  };

  const addShapeElement = (shapeType: 'rect' | 'circle' | 'arrow' | 'callout' | 'star') => {
    if (!currentSlide) return;
    const newEl: SlideElement = {
      id: generateId(),
      type: 'shape',
      shapeType,
      x: 35,
      y: 35,
      width: 30,
      height: 25,
      content: '',
      style: {
        backgroundColor: '#1e293b',
        border: '1.5px solid #6366f1',
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

  const handleSaveExcalidraw = (payload: ExcalidrawSavePayload) => {
    if (!currentSlide) return;

    if (isResourceWhiteboard) {
      const newRes: Resource = {
        id: generateId(),
        type: 'excalidraw',
        name: payload.name.endsWith('.excalidraw') ? payload.name : `${payload.name}.excalidraw`,
        content: payload.svgString,
        excalidrawElements: [...payload.elements],
        createdAt: Date.now(),
        size: Math.round(payload.svgString.length),
      };
      updateSlide({ resources: [...currentSlide.resources, newRes] });
      setIsResourceWhiteboard(false);
      toast.success('Diagram saved to slide resources!');
      return;
    }

    if (editingExcalidrawElement) {
      updateElement(editingExcalidrawElement.id, {
        content: payload.svgString,
        excalidrawElements: [...payload.elements],
        excalidrawAppState: payload.appState,
        excalidrawFiles: payload.files,
        diagramName: payload.name,
      });
      setEditingExcalidrawElement(null);
      toast.success('Excalidraw component updated!');
    } else {
      const newEl: SlideElement = {
        id: generateId(),
        type: 'excalidraw',
        x: 12,
        y: 18,
        width: 76,
        height: 58,
        content: payload.svgString,
        style: {},
        excalidrawElements: [...payload.elements],
        excalidrawAppState: payload.appState,
        excalidrawFiles: payload.files,
        diagramName: payload.name,
      };
      updateSlide({ elements: [...currentSlide.elements, newEl] });
      setSelectedElementId(newEl.id);
      toast.success('Diagram saved as slide component!');
    }
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
        <div className={styles.loadingSpinner}>⬡</div>
        <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
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
            <span>←</span> Workspace
          </button>

          <img src="/favicon.png" alt="HowTo-Web" className={styles.brandLogo} />

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
            <span>{isSaving ? 'Saving...' : hasChanges ? 'Unsaved changes' : 'Synced to Cloud'}</span>
          </div>

          {/* Preset Buttons (70/30, 60/40, 80/20, Reset) */}
          <div className={styles.presetGroup}>
            <button
              className={`${styles.presetBtn} ${dividerPosition === 70 ? styles.presetBtnActive : ''}`}
              onClick={() => setDividerPosition(70)}
              title="Default 70% Presentation / 30% Resources"
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
              className={styles.presetBtn}
              onClick={() => setDividerPosition(70)}
              title="Reset to 70/30 split"
            >
              Reset
            </button>
          </div>
        </div>

        <div className={styles.topBarRight}>
          {/* Undo / Redo */}
          <button
            className={styles.actionBtn}
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            title="Undo (Ctrl+Z)"
            style={{ opacity: historyIndex <= 0 ? 0.4 : 1 }}
          >
            ↶
          </button>
          <button
            className={styles.actionBtn}
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            title="Redo (Ctrl+Y)"
            style={{ opacity: historyIndex >= history.length - 1 ? 0.4 : 1 }}
          >
            ↷
          </button>

          {/* Theme Toggle */}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            type="button"
          >
            <span className="theme-toggle-icon">
              {theme === 'dark' ? '🌙' : '☀️'}
            </span>
          </button>

          {/* View Presentation */}
          <button
            className={`${styles.actionBtn} ${styles.btnSecondary}`}
            onClick={() => router.push(`/view/${presentation.id}`)}
            title="Open Public Viewer"
          >
            <span>👁</span> View
          </button>

          {/* Present Mode */}
          <button
            className={`${styles.actionBtn} ${styles.btnPrimary}`}
            onClick={() => router.push(`/present/${presentation.id}`)}
            title="Enter Fullscreen Presentation Mode (F5)"
          >
            <span>▶</span> Present
          </button>
        </div>
      </header>

      {/* ─── 2. QUICK ELEMENT INSERTION & CONTEXTUAL FORMATTING SHELF ─── */}
      <div className={styles.toolShelf}>
        <div className={styles.toolGroup}>
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
              <span>T</span>
              <span>+ Text ▾</span>
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
                  <span style={{ fontWeight: 700 }}>H1</span> Title Heading
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    addTextElement('subheading');
                    setShowTextMenu(false);
                  }}
                >
                  <span style={{ fontWeight: 600 }}>H2</span> Section Subheading
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    addTextElement('body');
                    setShowTextMenu(false);
                  }}
                >
                  <span>¶</span> Paragraph Text
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    addTextElement('bullets');
                    setShowTextMenu(false);
                  }}
                >
                  <span>•</span> Bullet Points
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
              title="Insert Shapes"
            >
              <span>◇</span>
              <span>+ Shape ▾</span>
            </button>
            {showShapesMenu && (
              <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    addShapeElement('rect');
                    setShowShapesMenu(false);
                  }}
                >
                  <span>▭</span> Rectangle
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    addShapeElement('circle');
                    setShowShapesMenu(false);
                  }}
                >
                  <span>◯</span> Circle
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    addShapeElement('arrow');
                    setShowShapesMenu(false);
                  }}
                >
                  <span>➔</span> Arrow
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    addShapeElement('callout');
                    setShowShapesMenu(false);
                  }}
                >
                  <span>💬</span> Callout Bubble
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    addShapeElement('star');
                    setShowShapesMenu(false);
                  }}
                >
                  <span>★</span> Star Badge
                </button>
              </div>
            )}
          </div>

          {/* Add Image */}
          <button
            className={styles.toolPill}
            onClick={() => setShowImageModal(true)}
            title="Add Image"
          >
            <span>🖼</span>
            <span>Image</span>
          </button>

          {/* Add Table */}
          <button
            className={styles.toolPill}
            onClick={addTableElement}
            title="Insert Structured Table"
          >
            <span>⊞</span>
            <span>Table</span>
          </button>

          {/* Add Code Block */}
          <button
            className={styles.toolPill}
            onClick={addCodeElement}
            title="Insert Code Snippet"
          >
            <span>&lt;/&gt;</span>
            <span>Code</span>
          </button>

          {/* Add Excalidraw Component directly on slide */}
          <button
            className={`${styles.toolPill} ${styles.excalidrawPill}`}
            onClick={() => {
              if (!currentSlide) return;
              const newEl: SlideElement = {
                id: generateId(),
                type: 'excalidraw',
                x: 10,
                y: 15,
                width: 80,
                height: 68,
                content: '',
                style: {},
                diagramName: 'Hand-drawn Diagram',
                excalidrawElements: [],
                excalidrawAppState: { theme: 'dark' },
                excalidrawFiles: {},
              };
              updateSlide({ elements: [...currentSlide.elements, newEl] });
              setSelectedElementId(newEl.id);
              setActiveInlineExcalidrawId(newEl.id);
              toast.success('Drawing canvas active on slide!');
            }}
            title="Draw hand-drawn flowchart or diagram directly on this slide"
          >
            <span>✏️</span>
            <span>+ Diagram</span>
          </button>
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
                  <option value="1.75rem">Heading 2 (28px)</option>
                  <option value="2.5rem">Heading 1 (40px)</option>
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
                  B
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
                  I
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

            {selectedElement.type === 'excalidraw' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className={`${styles.formatBtn} ${styles.formatBtnPrimary}`}
                  onClick={() => {
                    setActiveInlineExcalidrawId(selectedElement.id);
                  }}
                  title="Draw or edit diagram directly on this slide"
                >
                  <span>✏️</span>
                  <span>{activeInlineExcalidrawId === selectedElement.id ? 'Active on Slide' : '✏️ Draw on Slide'}</span>
                </button>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, paddingRight: 6 }}>
                  {selectedElement.diagramName || 'Hand-drawn Diagram'}
                </span>
              </div>
            )}

            <button
              className={styles.formatBtn}
              onClick={() => bringToFront(selectedElement.id)}
              title="Bring to Front"
            >
              ▲
            </button>
            <button
              className={styles.formatBtn}
              onClick={() => sendToBack(selectedElement.id)}
              title="Send to Back"
            >
              ▼
            </button>
            <button
              className={styles.formatBtn}
              onClick={() => duplicateElement(selectedElement.id)}
              title="Duplicate (Ctrl+D)"
            >
              ❐
            </button>
            <button
              className={styles.formatBtn}
              onClick={() => deleteElement(selectedElement.id)}
              title="Delete (Del)"
              style={{ color: 'var(--accent-rose)' }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ─── 3. MAIN WORKSPACE: THUMBNAILS + 70% PRESENTATION CANVAS + DIAGONAL DIVIDER + 30% RESOURCES ─── */}
      <div className={styles.workspaceStage} ref={containerRef}>
        {/* Left Slide Deck Sidebar (~210px) */}
        <aside className={styles.slideDeck}>
          <div className={styles.slideDeckHeader}>
            <span className={styles.slideDeckTitle}>Slides ({presentation.slides.length})</span>
            <div className={styles.dropdownContainer}>
              <button
                className={styles.newSlideBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddSlideMenu(!showAddSlideMenu);
                  setShowTextMenu(false);
                  setShowShapesMenu(false);
                }}
              >
                + New
              </button>
              {showAddSlideMenu && (
                <div className={`${styles.dropdownMenu} ${styles.dropdownMenuRight}`} onClick={(e) => e.stopPropagation()}>
                  <button
                    className={styles.dropdownItem}
                    onClick={() => {
                      addSlide('titleAndContent');
                      setShowAddSlideMenu(false);
                    }}
                  >
                    <span>📑</span> Title & Content
                  </button>
                  <button
                    className={styles.dropdownItem}
                    onClick={() => {
                      addSlide('title');
                      setShowAddSlideMenu(false);
                    }}
                  >
                    <span>📰</span> Title Slide
                  </button>
                  <button
                    className={styles.dropdownItem}
                    onClick={() => {
                      addSlide('twoContent');
                      setShowAddSlideMenu(false);
                    }}
                  >
                    <span>▥</span> Two Columns
                  </button>
                  <button
                    className={styles.dropdownItem}
                    onClick={() => {
                      addSlide('code');
                      setShowAddSlideMenu(false);
                    }}
                  >
                    <span>&lt;/&gt;</span> Code Focus
                  </button>
                  <button
                    className={styles.dropdownItem}
                    onClick={() => {
                      addSlide('blank');
                      setShowAddSlideMenu(false);
                    }}
                  >
                    <span>▭</span> Blank Slide
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={styles.slideDeckList}>
            {presentation.slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`${styles.slideThumbCard} ${index === currentSlideIndex ? styles.slideThumbCardActive : ''}`}
                onClick={() => setCurrentSlideIndex(index)}
                title={`Slide ${index + 1}`}
              >
                <span className={styles.slideThumbNumber}>{index + 1}</span>
                <div
                  className={styles.slideThumbPreview}
                  style={{ background: slide.background?.value || '#0a0d16' }}
                >
                  {slide.elements.slice(0, 4).map((el) => (
                    <div
                      key={el.id}
                      className={styles.slideThumbMiniElement}
                      style={{
                        left: `${el.x}%`,
                        top: `${el.y}%`,
                        width: `${el.width}%`,
                        height: `${el.height}%`,
                        background: el.type === 'text' ? 'rgba(255,255,255,0.4)' : '#6366f1',
                      }}
                    />
                  ))}
                </div>

                <div className={styles.slideThumbControls}>
                  {index > 0 && (
                    <button
                      className={styles.thumbControlBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSlide(index, 'up');
                      }}
                      title="Move Up"
                    >
                      ▲
                    </button>
                  )}
                  {index < presentation.slides.length - 1 && (
                    <button
                      className={styles.thumbControlBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSlide(index, 'down');
                      }}
                      title="Move Down"
                    >
                      ▼
                    </button>
                  )}
                  <button
                    className={styles.thumbControlBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateSlide(index);
                    }}
                    title="Duplicate"
                  >
                    ❐
                  </button>
                  {presentation.slides.length > 1 && (
                    <button
                      className={styles.thumbControlBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSlide(index);
                      }}
                      title="Delete"
                      style={{ color: '#f87171' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ─── 4. MAIN 70% PRESENTATION AREA (slideArea) ─── */}
        <main
          className={styles.slideArea}
          style={{ width: `calc(${dividerPosition}% - 14px)` }}
          onClick={() => setSelectedElementId(null)}
        >
          <div className={styles.slideViewport}>
            <div
              className={styles.slideStage}
              style={{
                background: currentSlide?.background?.value || '#0a0d16',
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
                    left: fullSlideExcalidrawId === el.id ? '0%' : `${el.x}%`,
                    top: fullSlideExcalidrawId === el.id ? '0%' : `${el.y}%`,
                    width: fullSlideExcalidrawId === el.id ? '100%' : `${el.width}%`,
                    height: fullSlideExcalidrawId === el.id ? '100%' : `${el.height}%`,
                    zIndex: activeInlineExcalidrawId === el.id ? 90 : (el.id === selectedElementId ? 30 : 10),
                    cursor: activeInlineExcalidrawId === el.id ? 'default' : 'move',
                    outline: activeInlineExcalidrawId === el.id ? 'none' : undefined,
                  }}
                  onMouseDown={(e) => {
                    if (activeInlineExcalidrawId === el.id) {
                      e.stopPropagation();
                      return;
                    }
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
                        alt="Slide image"
                        className={styles.slideImage}
                        draggable={false}
                      />
                    )}

                    {/* Shape Element */}
                    {el.type === 'shape' && (
                      <div
                        className={`${styles.shapeEl} ${styles['shape_' + (el.shapeType || 'rect')]}`}
                        style={{
                          ...el.style,
                          width: '100%',
                          height: '100%',
                        }}
                      >
                        {el.content && <span>{el.content}</span>}
                      </div>
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

                    {/* Excalidraw Hand-Drawn Component */}
                    {el.type === 'excalidraw' && (
                      activeInlineExcalidrawId === el.id ? (
                        <InSlideExcalidraw
                          element={el}
                          isFullSlide={fullSlideExcalidrawId === el.id}
                          onToggleFullSlide={() => {
                            setFullSlideExcalidrawId((prev) => (prev === el.id ? null : el.id));
                          }}
                          onSave={(payload) => {
                            if (!payload.svgString && (!payload.elements || payload.elements.length === 0) && !el.content) {
                              deleteElement(el.id);
                              toast('Empty diagram removed');
                            } else {
                              updateElement(el.id, {
                                content: payload.svgString || el.content,
                                excalidrawElements: [...payload.elements],
                                excalidrawAppState: payload.appState,
                                excalidrawFiles: payload.files,
                                diagramName: payload.name,
                              });
                              toast.success('Diagram saved directly on slide!');
                            }
                            setActiveInlineExcalidrawId(null);
                            setFullSlideExcalidrawId(null);
                          }}
                          onCancel={() => {
                            if (!el.content && (!el.excalidrawElements || el.excalidrawElements.length === 0)) {
                              deleteElement(el.id);
                            }
                            setActiveInlineExcalidrawId(null);
                            setFullSlideExcalidrawId(null);
                          }}
                        />
                      ) : (
                        <div
                          className={styles.excalidrawElementWrapper}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setActiveInlineExcalidrawId(el.id);
                          }}
                          title="Double-click to draw directly on this slide"
                          dangerouslySetInnerHTML={{ __html: el.content }}
                        />
                      )
                    )}
                  </div>

                  {/* 8-point Resize Handles when selected (hidden while actively drawing on slide) */}
                  {el.id === selectedElementId && activeInlineExcalidrawId !== el.id && (
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
            </div>
          </div>

          {/* Canvas Zoom Controls */}
          <div className={styles.canvasZoomBar}>
            <button className={styles.zoomBtn} onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}>-</button>
            <span className={styles.zoomLabel}>{zoomLevel}%</span>
            <button className={styles.zoomBtn} onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}>+</button>
            <button className={styles.zoomBtn} onClick={() => setZoomLevel(100)} title="Reset Zoom">↺</button>
          </div>
        </main>

        {/* ─── 5. SIGNATURE DRAGGABLE DIAGONAL SLASH DIVIDER (/) ─── */}
        <div
          className={`${styles.diagonalDivider} ${isDraggingDivider ? styles.dividerActive : ''}`}
          onMouseDown={handleDividerMouseDown}
          onDoubleClick={() => setDividerPosition(70)}
          title="Drag to resize 70/30 layout (Double-click to reset)"
        >
          <svg
            className={styles.slashSvg}
            preserveAspectRatio="none"
            viewBox="0 0 28 1000"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="studioSlashGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                <stop offset="30%" stopColor="#6366f1" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
                <stop offset="70%" stopColor="#8b5cf6" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
              </linearGradient>
              <filter id="studioSlashGlow" x="-50%" y="-50%" width="200%" height="200%">
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
              stroke="url(#studioSlashGrad)"
              strokeWidth="2.5"
              filter="url(#studioSlashGlow)"
            />
          </svg>

          {/* Central Pill Handle with split ratio */}
          <div className={styles.slashPillHandle}>
            {Math.round(dividerPosition)}/{Math.round(100 - dividerPosition)}
          </div>
        </div>

        {/* ─── 6. RIGHT 30% INTERACTIVE SLIDE RESOURCES & NOTES PANEL ─── */}
        <aside
          className={styles.resourceArea}
          style={{ width: `calc(${100 - dividerPosition}% - 14px)` }}
        >
          {/* Header */}
          <div className={styles.resourceHeader}>
            <div className={styles.resourceHeaderTitle}>
              <span>Slide {currentSlideIndex + 1} Context</span>
              <span className={styles.resourceBadge}>
                {currentSlide?.resources.length || 0} Files • {currentSlide?.notes.length || 0} Notes
              </span>
            </div>
          </div>

          {/* Segmented Tabs */}
          <div className={styles.resourceTabs}>
            <button
              className={`${styles.resourceTab} ${activeResourceTab === 'resources' ? styles.resourceTabActive : ''}`}
              onClick={() => setActiveResourceTab('resources')}
            >
              <span>📁</span> Resources
              <span className={styles.resourceTabBadge}>{currentSlide?.resources.length || 0}</span>
            </button>
            <button
              className={`${styles.resourceTab} ${activeResourceTab === 'notes' ? styles.resourceTabActive : ''}`}
              onClick={() => setActiveResourceTab('notes')}
            >
              <span>📝</span> Notes
              <span className={styles.resourceTabBadge}>{currentSlide?.notes.length || 0}</span>
            </button>
            <button
              className={`${styles.resourceTab} ${activeResourceTab === 'design' ? styles.resourceTabActive : ''}`}
              onClick={() => setActiveResourceTab('design')}
            >
              <span>🎨</span> Design
            </button>
          </div>

          {/* Tab 1: Resources & Attachments */}
          {activeResourceTab === 'resources' && (
            <div className={styles.resourceBody}>
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
                <span className={styles.dropzoneIcon}>📁</span>
                <span className={styles.dropzoneText}>Click or drop files to attach</span>
                <span className={styles.dropzoneSub}>Supports PDF, HTML/JS/CSS, Images, Docs</span>
              </div>

              {/* Action Buttons */}
              <div className={styles.actionRow}>
                <button
                  className={styles.subActionBtn}
                  onClick={() => fileInputRef.current?.click()}
                >
                  + Upload File
                </button>
                <button
                  className={styles.subActionBtn}
                  onClick={() => setShowLinkModal(true)}
                >
                  + Add Link
                </button>
                <button
                  className={styles.subActionBtn}
                  onClick={() => {
                    setIsResourceWhiteboard(true);
                    setEditingExcalidrawElement(null);
                    setShowExcalidrawModal(true);
                  }}
                  title="Draw and attach a hand-drawn diagram to this slide"
                >
                  ✏️ + Whiteboard
                </button>
              </div>

              {/* Resource Item Cards */}
              {currentSlide?.resources && currentSlide.resources.length > 0 ? (
                currentSlide.resources.map((res) => (
                  <div key={res.id} className={styles.resourceCard}>
                    <div className={styles.resourceLeft}>
                      <span className={styles.resourceIcon}>{getResourceIcon(res.type)}</span>
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
                          ▶ Run
                        </button>
                      )}

                      {res.type === 'link' && res.url && (
                        <button
                          className={styles.resBtn}
                          onClick={() => window.open(res.url, '_blank')}
                          title="Open Link"
                        >
                          ↗
                        </button>
                      )}

                      {res.type === 'excalidraw' && (
                        <button
                          className={styles.resBtn}
                          onClick={() => {
                            setIsResourceWhiteboard(true);
                            setEditingExcalidrawElement({
                              id: res.id,
                              type: 'excalidraw',
                              x: 0,
                              y: 0,
                              width: 0,
                              height: 0,
                              content: res.content || '',
                              style: {},
                              excalidrawElements: res.excalidrawElements,
                              diagramName: res.name.replace('.excalidraw', ''),
                            });
                            setShowExcalidrawModal(true);
                          }}
                          title="Open and edit Whiteboard"
                        >
                          ✏️ Edit
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
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12, padding: '24px 0' }}>
                  No resources attached to this slide yet.
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Comic-Style Speaker Notes */}
          {activeResourceTab === 'notes' && (
            <div className={styles.resourceBody}>
              <button
                className={styles.subActionBtn}
                onClick={addNote}
                style={{ width: '100%' }}
              >
                + Add Comic Note
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
                        ✕
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
                      placeholder="Type your speaker note or talking points here..."
                    />
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12, padding: '24px 0' }}>
                  No notes for this slide. Click "+ Add Comic Note" to create one.
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Slide Canvas Design & Background */}
          {activeResourceTab === 'design' && (
            <div className={styles.resourceBody}>
              <div className={styles.designSection}>
                <span className={styles.sectionTitle}>Curated Gradients</span>
                <div className={styles.gradientGrid}>
                  {GRADIENT_PRESETS.map((p) => (
                    <div
                      key={p.name}
                      className={`${styles.gradientCard} ${
                        currentSlide?.background?.value === p.value ? styles.gradientCardActive : ''
                      }`}
                      style={{ background: p.value }}
                      onClick={() => updateSlide({ background: { type: 'gradient', value: p.value } })}
                      title={p.name}
                    >
                      {p.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.designSection} style={{ marginTop: 12 }}>
                <span className={styles.sectionTitle}>Solid Color Fill</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    className={styles.colorPickerBtn}
                    style={{
                      width: 32,
                      height: 32,
                      background: currentSlide?.background?.value || '#0a0d16',
                    }}
                  >
                    <input
                      type="color"
                      className={styles.hiddenColorInput}
                      value={currentSlide?.background?.value?.startsWith('#') ? currentSlide.background.value : '#0a0d16'}
                      onChange={(e) => updateSlide({ background: { type: 'color', value: e.target.value } })}
                    />
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Pick custom canvas color
                  </span>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ─── MODAL 1: ADD IMAGE ─── */}
      {showImageModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowImageModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Insert Image</span>
              <button className={styles.modalCloseBtn} onClick={() => setShowImageModal(false)}>✕</button>
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
                  <span className={styles.dropzoneIcon}>🖼</span>
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
                        borderRadius: 6,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '1px solid var(--border-default)',
                        background: '#090d16',
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
                      <div style={{ padding: '4px 8px', fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
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
                      padding: '8px 12px',
                      borderRadius: 6,
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
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Add Web Link Resource</span>
              <button className={styles.modalCloseBtn} onClick={() => setShowLinkModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="text"
                placeholder="Link Title (e.g. Documentation)"
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
              <input
                type="url"
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  outline: 'none',
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
                <span className={styles.modalTitle}>⚡ Live Code Sandbox — {previewCodeResource.name}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className={`${styles.actionBtn} ${styles.btnPrimary}`}
                  onClick={() => runCodeResource(previewCodeResource)}
                  title="Re-run sandbox"
                >
                  ▶ Run
                </button>
                <button className={styles.modalCloseBtn} onClick={() => setPreviewCodeResource(null)}>✕</button>
              </div>
            </div>
            <div className={styles.modalBody} style={{ padding: 12 }}>
              <div className={styles.codeRunnerGrid}>
                <div className={styles.codeEditorPane}>
                  <div className={styles.codePaneHeader}>
                    <span>Source Code (Editable)</span>
                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Live Sandbox</span>
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
              <span className={styles.modalTitle}>📕 PDF Reference — {previewPdfResource.name}</span>
              <button className={styles.modalCloseBtn} onClick={() => setPreviewPdfResource(null)}>✕</button>
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

      {/* ─── MODAL 5: EXCALIDRAW HAND-DRAWN DIAGRAM & WHITEBOARD ─── */}
      <ExcalidrawModal
        isOpen={showExcalidrawModal}
        onClose={() => {
          setShowExcalidrawModal(false);
          setEditingExcalidrawElement(null);
          setIsResourceWhiteboard(false);
        }}
        onSave={handleSaveExcalidraw}
        initialData={
          editingExcalidrawElement
            ? {
                elements: editingExcalidrawElement.excalidrawElements,
                appState: editingExcalidrawElement.excalidrawAppState,
                files: editingExcalidrawElement.excalidrawFiles,
                name: editingExcalidrawElement.diagramName,
              }
            : null
        }
        defaultTheme={theme}
      />
    </div>
  );
}
