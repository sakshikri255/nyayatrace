'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Pin,
  FileText,
  AlertTriangle,
  User,
  Compass,
  Plus,
  X,
  ExternalLink,
  ChevronRight,
  Scale,
  Clock,
  Filter,
  LayoutGrid,
  Eye,
  EyeOff,
  Move,
  ShieldAlert,
  Maximize2,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type {
  DetectiveWallData,
  DetectiveNode,
  DetectiveLink,
  DetectiveNodeCategory,
} from '@/lib/analysis/detectiveWall'

interface DetectiveInvestigationWallProps {
  initialCaseId: number
  allCases?: Array<{ id: number; title: string; caseNumber: string }>
  onOpenCase?: (id: number) => void
}

const CATEGORY_STYLES: Record<
  DetectiveNodeCategory,
  {
    name: string
    icon: React.ElementType
    pinColor: string
    cardBorder: string
    cardBgNoir: string
    cardBgDark: string
    tagBg: string
    tagText: string
    glowBorder: string
    stringColorNoir: string
    stringColorDark: string
  }
> = {
  scenario: {
    name: 'Timeline & Events',
    icon: Clock,
    pinColor: 'bg-amber-500',
    cardBorder: 'border-amber-500/30',
    cardBgNoir: 'bg-[#3d271d] text-amber-100 border-[#784428]',
    cardBgDark: 'bg-slate-900/95 text-slate-100 border-amber-500/40',
    tagBg: 'bg-amber-500/15 border border-amber-500/30',
    tagText: 'text-amber-400',
    glowBorder: 'ring-2 ring-amber-400 shadow-amber-500/20 shadow-lg',
    stringColorNoir: '#d97706',
    stringColorDark: '#f59e0b',
  },
  person: {
    name: 'People Involved',
    icon: User,
    pinColor: 'bg-sky-500',
    cardBorder: 'border-sky-500/30',
    cardBgNoir: 'bg-[#212c3b] text-sky-100 border-[#324f70]',
    cardBgDark: 'bg-slate-900/95 text-slate-100 border-sky-500/40',
    tagBg: 'bg-sky-500/15 border border-sky-500/30',
    tagText: 'text-sky-400',
    glowBorder: 'ring-2 ring-sky-400 shadow-sky-500/20 shadow-lg',
    stringColorNoir: '#0284c7',
    stringColorDark: '#38bdf8',
  },
  evidence: {
    name: 'Evidence & Proof',
    icon: FileText,
    pinColor: 'bg-emerald-500',
    cardBorder: 'border-emerald-500/30',
    cardBgNoir: 'bg-[#1a332a] text-emerald-100 border-[#285744]',
    cardBgDark: 'bg-slate-900/95 text-slate-100 border-emerald-500/40',
    tagBg: 'bg-emerald-500/15 border border-emerald-500/30',
    tagText: 'text-emerald-400',
    glowBorder: 'ring-2 ring-emerald-400 shadow-emerald-500/20 shadow-lg',
    stringColorNoir: '#059669',
    stringColorDark: '#34d399',
  },
  conflict: {
    name: 'Issues & Conflicts',
    icon: AlertTriangle,
    pinColor: 'bg-rose-500',
    cardBorder: 'border-rose-500/50',
    cardBgNoir: 'bg-[#3b1a20] text-rose-100 border-[#702934]',
    cardBgDark: 'bg-slate-900/95 text-slate-100 border-rose-500/60',
    tagBg: 'bg-rose-500/20 border border-rose-500/40 font-bold',
    tagText: 'text-rose-400',
    glowBorder: 'ring-2 ring-rose-500 shadow-rose-500/30 shadow-xl',
    stringColorNoir: '#dc2626',
    stringColorDark: '#f43f5e',
  },
  legal: {
    name: 'Court Orders & Rules',
    icon: Scale,
    pinColor: 'bg-purple-500',
    cardBorder: 'border-purple-500/30',
    cardBgNoir: 'bg-[#311f3d] text-purple-100 border-[#573070]',
    cardBgDark: 'bg-slate-900/95 text-slate-100 border-purple-500/40',
    tagBg: 'bg-purple-500/15 border border-purple-500/30',
    tagText: 'text-purple-400',
    glowBorder: 'ring-2 ring-purple-400 shadow-purple-500/20 shadow-lg',
    stringColorNoir: '#9333ea',
    stringColorDark: '#c084fc',
  },
}

// Proportional dimensions designed to fit neatly on standard laptop displays
const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 820

export function DetectiveInvestigationWall({
  initialCaseId,
  allCases = [],
  onOpenCase,
}: DetectiveInvestigationWallProps) {
  const [caseId, setCaseId] = useState(initialCaseId)
  const [wallData, setWallData] = useState<DetectiveWallData | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'canvas' | 'columns'>('canvas')
  const [theme, setTheme] = useState<'forensic' | 'noir'>('forensic')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  // Requirement 1: Strictly 100% (1) zoom by default
  const [zoomLevel, setZoomLevel] = useState(1)
  const [showAllLabels, setShowAllLabels] = useState(false)
  const [showStrings, setShowStrings] = useState(true)
  const [nodeOffsets, setNodeOffsets] = useState<Record<string, { x: number; y: number }>>({})
  const [customPins, setCustomPins] = useState<DetectiveNode[]>([])
  const [customLinks, setCustomLinks] = useState<DetectiveLink[]>([])
  const [addClueModalOpen, setAddClueModalOpen] = useState(false)
  const [newClueLabel, setNewClueLabel] = useState('')
  const [newClueBrief, setNewClueBrief] = useState('')
  const [newClueCategory, setNewClueCategory] = useState<DetectiveNodeCategory>('scenario')
  const [connectToNodeId, setConnectToNodeId] = useState<string>('')

  // Requirement 2: State for directly pulling string from top middle dot to join cards
  const [pullingFromNodeId, setPullingFromNodeId] = useState<string | null>(null)
  const [pullCurrentPos, setPullCurrentPos] = useState<{ x: number; y: number } | null>(null)
  const [hoveredDropNodeId, setHoveredDropNodeId] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  // Track dragging state to prevent opening inspector drawer when moving cards
  const isDraggingCardRef = useRef(false)
  const dragDistanceRef = useRef(0)
  const dragSuppressionTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (dragSuppressionTimerRef.current) {
        clearTimeout(dragSuppressionTimerRef.current)
      }
    }
  }, [])

  // Close inspector drawer on Escape key
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedNodeId) {
        setSelectedNodeId(null)
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [selectedNodeId])

  // Fit zoom helper if user clicks "Fit" button
  const handleFitToScreen = () => {
    if (containerRef.current) {
      const availableWidth = containerRef.current.clientWidth - 16
      if (availableWidth > 0) {
        const fitZoom = Math.min(1, Math.max(0.65, Number((availableWidth / CANVAS_WIDTH).toFixed(2))))
        setZoomLevel(fitZoom)
        toast.success(`Board scaled to ${Math.round(fitZoom * 100)}% to fit your screen.`)
        return
      }
    }
    setZoomLevel(1)
  }

  // Fetch detective wall data when case changes
  useEffect(() => {
    async function loadWall() {
      try {
        setLoading(true)
        const res = await fetch(`/api/cases/${caseId}/detective-wall`)
        if (res.ok) {
          const json = await res.json()
          setWallData(json)
          setSelectedNodeId(null)
          setHoveredNodeId(null)
          setHoveredLinkId(null)
          setNodeOffsets({})
          setCustomPins([])
          setCustomLinks([])
        }
      } catch (err) {
        console.error('Failed to load investigation board', err)
      } finally {
        setLoading(false)
      }
    }
    loadWall()
  }, [caseId])

  const allNodes = useMemo(() => {
    const base = wallData?.nodes || []
    return [...base, ...customPins]
  }, [wallData, customPins])

  const allLinks = useMemo(() => {
    const base = wallData?.links || []
    return [...base, ...customLinks]
  }, [wallData, customLinks])

  // Helper to translate client mouse events into virtual canvas coordinates
  const getCanvasCoords = (e: MouseEvent | React.MouseEvent) => {
    if (!boardRef.current) return { x: 0, y: 0 }
    const rect = boardRef.current.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) / zoomLevel,
      y: (e.clientY - rect.top) / zoomLevel,
    }
  }

  // Active focus node (hovered preview takes priority, else selected)
  const activeFocusId = hoveredNodeId || selectedNodeId

  // Set of connected node IDs for current active focus
  const connectedNodeIds = useMemo(() => {
    if (!activeFocusId) return new Set<string>()
    const set = new Set<string>([activeFocusId])
    allLinks.forEach((link) => {
      if (link.source === activeFocusId) set.add(link.target)
      if (link.target === activeFocusId) set.add(link.source)
    })
    return set
  }, [activeFocusId, allLinks])

  // Filtered nodes based on category & search
  const filteredNodes = useMemo(() => {
    return allNodes.filter((node) => {
      if (filterCategory !== 'all' && node.category !== filterCategory) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          node.label.toLowerCase().includes(q) ||
          node.brief.toLowerCase().includes(q) ||
          node.source?.toLowerCase().includes(q) ||
          node.tags?.some((t) => t.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [allNodes, filterCategory, searchQuery])

  // Selected node details for inspector
  const selectedNode = allNodes.find((n) => n.id === selectedNodeId)

  // Compute absolute pixel coordinates on virtual canvas
  const getNodePixelPos = (node: DetectiveNode) => {
    const offset = nodeOffsets[node.id] || { x: 0, y: 0 }
    const baseX = (node.x / 100) * CANVAS_WIDTH
    const baseY = (node.y / 100) * CANVAS_HEIGHT
    return {
      x: Math.max(125, Math.min(CANVAS_WIDTH - 125, baseX + offset.x)),
      y: Math.max(90, Math.min(CANVAS_HEIGHT - 95, baseY + offset.y)),
    }
  }

  // Compute exact pixel coordinates of the top colored pin dot on each card
  const getNodePinPos = (node: DetectiveNode) => {
    const p = getNodePixelPos(node)
    // Card left is pos.x - 112px, top is pos.y - 71px.
    // Pin button horizontal center: (pos.x - 112) + 112.5 = pos.x.
    // Pin button vertical center: (pos.y - 71) + 8 = pos.y - 63.
    return {
      x: p.x,
      y: p.y - 63,
    }
  }

  /**
   * Generates an optimized, collision-free curve connecting the top pin dot of Card 1
   * to the top pin dot of Card 2.
   * - Lines start and end strictly at the cards' top pin dots.
   * - Vertical links in the same column loop neatly around card sides without cutting text.
   * - Adjacent column links curve with natural corkboard string sag.
   * - Multi-column long spans arch gracefully above or below intervening cards.
   * - Calculates exact cubic bezier midpoint so relationship badges sit right on the string.
   */
  const getOptimizedStringCurve = (
    pin1: { x: number; y: number },
    pin2: { x: number; y: number }
  ) => {
    const isReversed = pin1.x > pin2.x || (pin1.x === pin2.x && pin1.y > pin2.y)
    const start = isReversed ? pin2 : pin1
    const end = isReversed ? pin1 : pin2

    const dx = end.x - start.x
    const dy = end.y - start.y

    let cp1x = start.x
    let cp1y = start.y
    let cp2x = end.x
    let cp2y = end.y

    if (dx < 70) {
      // ── Case 1: Same Column Vertical Connection (e.g. State to Accused) ──
      // Loop out to the side of the card so it never intersects the card body.
      const sideOffset = start.x < 450 ? -145 : -135
      cp1x = start.x + sideOffset
      cp1y = start.y + dy * 0.25
      cp2x = end.x + sideOffset
      cp2y = end.y - dy * 0.25
    } else if (dx <= 650) {
      // ── Case 2: Adjacent / Neighboring Columns (Col 1 to Col 2, Col 2 to Col 3, Col 3 to Col 4) ──
      // Controlled horizontal bezier with gentle natural string sag
      const cpDx = Math.min(180, Math.max(70, dx * 0.36))
      const sag = Math.min(30, Math.max(10, dx * 0.05))

      cp1x = start.x + cpDx
      cp1y = start.y + (dy * 0.12) + sag
      cp2x = end.x - cpDx
      cp2y = end.y - (dy * 0.12) + sag
    } else {
      // ── Case 3: Long Span Across Multiple Columns (Col 1 to Col 4) ──
      // Route gracefully in the clear headroom above or open space below cards
      const cpDx = Math.min(280, dx * 0.32)
      if (Math.min(start.y, end.y) < 520) {
        // Upper cards: arch upward into clear header airspace
        const archHeight = Math.min(85, 30 + (dx - 600) * 0.05)
        const peakY = Math.min(start.y, end.y) - archHeight
        cp1x = start.x + cpDx
        cp1y = peakY
        cp2x = end.x - cpDx
        cp2y = peakY
      } else {
        // Lower cards: drape downward under cards into lower space
        const drapeDepth = Math.min(85, 30 + (dx - 600) * 0.05)
        const bottomY = Math.max(start.y, end.y) + drapeDepth
        cp1x = start.x + cpDx
        cp1y = bottomY
        cp2x = end.x - cpDx
        cp2y = bottomY
      }
    }

    const path = `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`

    // Exact cubic bezier point at t = 0.5:
    // B(0.5) = 0.125 * start + 0.375 * cp1 + 0.375 * cp2 + 0.125 * end
    const midX = 0.125 * start.x + 0.375 * cp1x + 0.375 * cp2x + 0.125 * end.x
    const midY = 0.125 * start.y + 0.375 * cp1y + 0.375 * cp2y + 0.125 * end.y

    return { path, midPoint: { x: midX, y: midY }, start, end }
  }

  // Requirement 2: Start pulling connection thread from top middle dot of card
  const handleStartPull = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    const sourceNode = allNodes.find((n) => n.id === nodeId)
    if (!sourceNode) return
    const pin = getNodePinPos(sourceNode)
    setPullingFromNodeId(nodeId)
    setPullCurrentPos({ x: pin.x, y: pin.y })
    setHoveredDropNodeId(null)
  }

  // Smooth, collision-free card dragging without Framer Motion transform conflicts
  const activeDragNodeIdRef = useRef<string | null>(null)
  const dragStartPointerRef = useRef<{ clientX: number; clientY: number } | null>(null)
  const dragStartOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const handleCardPointerDown = (e: React.PointerEvent, nodeId: string) => {
    if (pullingFromNodeId) return

    activeDragNodeIdRef.current = nodeId
    dragStartPointerRef.current = { clientX: e.clientX, clientY: e.clientY }
    const currentOffset = nodeOffsets[nodeId] || { x: 0, y: 0 }
    dragStartOffsetRef.current = { ...currentOffset }
    isDraggingCardRef.current = false
    dragDistanceRef.current = 0

    const handlePointerMove = (moveEvt: PointerEvent) => {
      if (!dragStartPointerRef.current || !activeDragNodeIdRef.current) return
      const dx = (moveEvt.clientX - dragStartPointerRef.current.clientX) / zoomLevel
      const dy = (moveEvt.clientY - dragStartPointerRef.current.clientY) / zoomLevel
      const dist = Math.hypot(dx, dy)

      if (dist > 3) {
        isDraggingCardRef.current = true
        dragDistanceRef.current = dist
        setNodeOffsets((prev) => ({
          ...prev,
          [activeDragNodeIdRef.current!]: {
            x: dragStartOffsetRef.current.x + dx,
            y: dragStartOffsetRef.current.y + dy,
          },
        }))
      }
    }

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)

      if (isDraggingCardRef.current) {
        if (dragSuppressionTimerRef.current) clearTimeout(dragSuppressionTimerRef.current)
        dragSuppressionTimerRef.current = setTimeout(() => {
          isDraggingCardRef.current = false
        }, 150)
      }

      activeDragNodeIdRef.current = null
      dragStartPointerRef.current = null
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  // Requirement 2: Track mouse dragging and drop targets across the screen
  useEffect(() => {
    if (!pullingFromNodeId) return

    const handleMouseMove = (e: MouseEvent) => {
      const coords = getCanvasCoords(e)
      setPullCurrentPos(coords)

      // Find if current cursor position is hovering over any other card
      const target = allNodes.find((n) => {
        if (n.id === pullingFromNodeId) return false
        const p = getNodePixelPos(n)
        const dx = Math.abs(coords.x - p.x)
        const dy = Math.abs(coords.y - p.y)
        return dx < 120 && dy < 75
      })
      setHoveredDropNodeId(target ? target.id : null)
    }

    const handleMouseUp = (e: MouseEvent) => {
      const coords = getCanvasCoords(e)
      const target = allNodes.find((n) => {
        if (n.id === pullingFromNodeId) return false
        const p = getNodePixelPos(n)
        const dx = Math.abs(coords.x - p.x)
        const dy = Math.abs(coords.y - p.y)
        return dx < 120 && dy < 75
      })

      if (target) {
        const source = allNodes.find((n) => n.id === pullingFromNodeId)
        if (source) {
          // Check if already connected
          const alreadyLinked = allLinks.some(
            (l) =>
              (l.source === source.id && l.target === target.id) ||
              (l.source === target.id && l.target === source.id)
          )

          if (alreadyLinked) {
            toast.info(`"${source.label}" and "${target.label}" are already connected.`)
          } else {
            const newLinkId = `custom-link-${Date.now()}`
            const newLink: DetectiveLink = {
              id: newLinkId,
              source: source.id,
              target: target.id,
              label: 'Investigator Link',
              relationType: 'supports',
              strength: 'strong',
            }
            setCustomLinks((prev) => [...prev, newLink])
            toast.success(
              `Connected "${source.label.slice(0, 20)}" to "${target.label.slice(0, 20)}"! 🔗`
            )
          }
        }
      }

      setPullingFromNodeId(null)
      setPullCurrentPos(null)
      setHoveredDropNodeId(null)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPullingFromNodeId(null)
        setPullCurrentPos(null)
        setHoveredDropNodeId(null)
        toast.info('Connection cancelled.')
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [pullingFromNodeId, allNodes, allLinks, zoomLevel])

  // Reset dragged positions back to collision-free grid
  function handleResetPositions() {
    setNodeOffsets({})
    toast.success('Cards re-aligned into neat columns.')
  }

  // Add custom clue
  function handleAddClue(e: React.FormEvent) {
    e.preventDefault()
    if (!newClueLabel.trim() || !newClueBrief.trim()) {
      toast.error('Please enter a title and description for this card.')
      return
    }

    const newId = `custom-card-${Date.now()}`
    const newNode: DetectiveNode = {
      id: newId,
      label: newClueLabel.trim(),
      category: newClueCategory,
      brief: newClueBrief.trim(),
      source: 'User Note',
      x: 50,
      y: 50,
      importance: 'medium',
      tags: ['Personal Note'],
    }

    setCustomPins((prev) => [...prev, newNode])

    if (connectToNodeId) {
      const newLink: DetectiveLink = {
        id: `link-${newId}-${connectToNodeId}`,
        source: newId,
        target: connectToNodeId,
        label: 'Connected note',
        relationType: 'supports',
        strength: 'unverified',
      }
      setCustomLinks((prev) => [...prev, newLink])
    }

    setSelectedNodeId(newId)
    setAddClueModalOpen(false)
    setNewClueLabel('')
    setNewClueBrief('')
    toast.success('Card pinned to the board!')
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-slate-950 rounded-2xl border border-slate-800 text-white shadow-xl">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
          <Compass className="w-5 h-5 text-teal-400 absolute" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-200">
          Loading Case Investigation Board…
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Connecting people, documents, timeline events, and legal rules in simple terms
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Top Bar & Case Selector ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 shrink-0">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight">Case Investigation Board</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                Visual Case Map
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive visual map connecting people, evidence, timeline events, and key issues in plain words.
            </p>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Case Dropdown */}
          {allCases.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
              <span className="text-slate-400 font-medium">Case:</span>
              <select
                value={caseId}
                onChange={(e) => {
                  const id = parseInt(e.target.value, 10)
                  setCaseId(id)
                  if (onOpenCase) onOpenCase(id)
                }}
                className="bg-transparent text-teal-300 font-semibold focus:outline-hidden cursor-pointer"
              >
                {allCases.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                    {c.caseNumber} — {c.title.slice(0, 28)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* View Mode Toggle: Board vs Columns */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setViewMode('canvas')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium',
                viewMode === 'canvas'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              )}
              title="Interactive Visual Board View"
            >
              <Move className="w-3.5 h-3.5" />
              <span>Board View</span>
            </button>
            <button
              onClick={() => setViewMode('columns')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium',
                viewMode === 'columns'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              )}
              title="Organized Column View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Column View</span>
            </button>
          </div>

          {/* Theme Switcher */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setTheme('forensic')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all font-medium',
                theme === 'forensic'
                  ? 'bg-slate-700 text-teal-300 font-bold'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              🌙 Dark
            </button>
            <button
              onClick={() => setTheme('noir')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all font-medium',
                theme === 'noir'
                  ? 'bg-amber-700/80 text-amber-200 font-bold'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              📜 Warm
            </button>
          </div>

          {/* Zoom controls (Active in canvas view — 100% default) */}
          {viewMode === 'canvas' && (
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg border border-slate-700 p-1 text-xs">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.65, Number((z - 0.1).toFixed(1))))}
                className="p-1 text-slate-400 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1 text-[11px] font-mono text-slate-300 min-w-[34px] text-center font-bold">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.3, Number((z + 0.1).toFixed(1))))}
                className="p-1 text-slate-400 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1 text-slate-400 hover:text-white"
                title="Reset Zoom to 100%"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleFitToScreen}
                className="px-1.5 py-0.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors text-[10px] font-semibold flex items-center gap-0.5"
                title="Fit board to screen"
              >
                <Maximize2 className="w-3 h-3 text-teal-400" />
                <span>Fit</span>
              </button>
            </div>
          )}

          {/* Canvas Strings & Labels Toggles */}
          {viewMode === 'canvas' && (
            <>
              <button
                onClick={() => setShowStrings((prev) => !prev)}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors',
                  showStrings
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                )}
                title="Show or hide connection lines between cards"
              >
                <span>Lines</span>
              </button>

              <button
                onClick={() => setShowAllLabels((prev) => !prev)}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors',
                  showAllLabels
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                )}
                title="Show or hide labels on connection lines"
              >
                {showAllLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Line Notes</span>
              </button>

              {Object.keys(nodeOffsets).length > 0 && (
                <button
                  onClick={handleResetPositions}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/40 text-xs font-semibold transition-colors"
                  title="Snap cards back into clean aligned columns"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Cards</span>
                </button>
              )}
            </>
          )}

          {/* Add Clue Button */}
          <button
            onClick={() => setAddClueModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Card</span>
          </button>
        </div>
      </div>

      {/* ── Filter & Search Subheader ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-white">
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
          {[
            { id: 'all', label: `All Items (${allNodes.length})` },
            {
              id: 'person',
              label: `People (${allNodes.filter((n) => n.category === 'person').length})`,
            },
            {
              id: 'scenario',
              label: `Timeline & Events (${allNodes.filter((n) => n.category === 'scenario').length})`,
            },
            {
              id: 'evidence',
              label: `Evidence & Proof (${allNodes.filter((n) => n.category === 'evidence').length})`,
            },
            {
              id: 'conflict',
              label: `Issues & Conflicts (${allNodes.filter((n) => n.category === 'conflict').length})`,
            },
            {
              id: 'legal',
              label: `Court Orders & Rules (${allNodes.filter((n) => n.category === 'legal').length})`,
            },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={cn(
                'px-2.5 py-1 rounded-lg font-medium transition-colors',
                filterCategory === cat.id
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-xs'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Live Search */}
        <div className="relative min-w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search people, evidence, notes…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-teal-500"
          />
        </div>
      </div>

      {/* ── View Mode: Structured Swimlane Columns (Zero Overlap) ────────── */}
      {viewMode === 'columns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              category: 'person' as DetectiveNodeCategory,
              title: 'People Involved',
              icon: User,
              accent: 'border-sky-500/40 text-sky-400 bg-sky-500/10',
            },
            {
              category: 'scenario' as DetectiveNodeCategory,
              title: 'Timeline & Events',
              icon: Clock,
              accent: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
            },
            {
              category: 'evidence' as DetectiveNodeCategory,
              title: 'Evidence & Proof',
              icon: FileText,
              accent: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
            },
            {
              category: 'conflict' as DetectiveNodeCategory,
              title: 'Issues & Court Orders',
              icon: ShieldAlert,
              accent: 'border-rose-500/40 text-rose-400 bg-rose-500/10',
              extraFilter: (n: DetectiveNode) => n.category === 'conflict' || n.category === 'legal',
            },
          ].map((col) => {
            const colNodes = filteredNodes.filter((n) =>
              col.extraFilter ? col.extraFilter(n) : n.category === col.category
            )
            const ColIcon = col.icon

            return (
              <div
                key={col.title}
                className="flex flex-col gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className={cn('p-1.5 rounded-lg border', col.accent)}>
                      <ColIcon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-white">{col.title}</span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {colNodes.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="flex flex-col gap-3 overflow-y-auto max-h-[620px] pr-1">
                  {colNodes.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No matching records
                    </div>
                  ) : (
                    colNodes.map((node) => {
                      const cfg = CATEGORY_STYLES[node.category]
                      const isSelected = node.id === selectedNodeId
                      const connectedLinks = allLinks.filter(
                        (l) => l.source === node.id || l.target === node.id
                      )

                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNodeId(node.id)}
                          className={cn(
                            'p-3.5 rounded-xl border transition-all cursor-pointer select-none relative group',
                            theme === 'noir' ? cfg.cardBgNoir : cfg.cardBgDark,
                            cfg.cardBorder,
                            isSelected
                              ? 'ring-2 ring-teal-400 shadow-xl'
                              : 'hover:border-slate-500 hover:shadow-md'
                          )}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span
                              className={cn(
                                'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded',
                                cfg.tagBg,
                                cfg.tagText
                              )}
                            >
                              {cfg.name}
                            </span>
                            {node.date && (
                              <span className="text-[10px] font-mono text-slate-400">
                                {node.date.slice(0, 10)}
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-xs text-white leading-snug">
                            {node.label}
                          </h4>

                          <p className="text-[11px] text-slate-300 mt-1 line-clamp-3 leading-relaxed">
                            {node.brief}
                          </p>

                          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                            <span className="truncate max-w-[130px]">
                              {node.source || 'Case Record'}
                            </span>
                            <span className="font-mono text-teal-400 font-medium">
                              🔗 {connectedLinks.length} connections
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── View Mode: Interactive Corkboard Mindmap ───────────────────── */}
      {viewMode === 'canvas' && (
        <div
          ref={containerRef}
          className="relative overflow-x-auto rounded-2xl border border-slate-800 shadow-2xl bg-slate-950"
        >
          <div
            ref={boardRef}
            className={cn(
              'relative select-none transition-all duration-150 overflow-hidden',
              theme === 'noir' ? 'bg-[#2b1810]' : 'bg-[#0a0f1d]',
              pullingFromNodeId && 'cursor-crosshair'
            )}
            style={{
              width: `${CANVAS_WIDTH * zoomLevel}px`,
              height: `${CANVAS_HEIGHT * zoomLevel}px`,
              minWidth: '100%',
              minHeight: '740px',
              backgroundImage:
                theme === 'noir'
                  ? 'radial-gradient(#4a2b1f 1.5px, transparent 1.5px), radial-gradient(#3d2116 1.5px, #2b1810 1.5px)'
                  : 'radial-gradient(rgba(20, 184, 166, 0.12) 1.5px, transparent 1.5px), radial-gradient(rgba(30, 41, 59, 0.8) 1.5px, #070b14 1.5px)',
              backgroundSize: '28px 28px',
            }}
          >
            {/* Column Guide Headers */}
            <div
              className="absolute top-3 inset-x-0 grid grid-cols-4 px-6 pointer-events-none z-10 transition-transform origin-top-left"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {[
                { title: 'People Involved' },
                { title: 'Timeline & Events' },
                { title: 'Evidence & Proof' },
                { title: 'Issues & Court Orders' },
              ].map((h) => (
                <div key={h.title} className="text-center">
                  <span className="text-[11px] uppercase font-mono font-bold tracking-wider text-slate-300 bg-slate-900/80 px-3.5 py-1 rounded-full border border-slate-700/80 shadow-md">
                    {h.title}
                  </span>
                </div>
              ))}
            </div>

            {/* SVG Connection Strings Layer */}
            {showStrings && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
                viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
                preserveAspectRatio="none"
              >
                <defs>
                  <filter id="neon-glow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {allLinks.map((link) => {
                  const sourceNode = allNodes.find((n) => n.id === link.source)
                  const targetNode = allNodes.find((n) => n.id === link.target)
                  if (!sourceNode || !targetNode) return null

                  const isConnected =
                    activeFocusId &&
                    (link.source === activeFocusId || link.target === activeFocusId)
                  const isHoveredLink = hoveredLinkId === link.id
                  const isDimmed = activeFocusId && !isConnected && !isHoveredLink

                  const isContradiction = link.relationType === 'contradicts'
                  const color = isContradiction
                    ? theme === 'noir'
                      ? '#dc2626'
                      : '#f43f5e'
                    : theme === 'noir'
                    ? '#d97706'
                    : '#14b8a6'

                  const p1 = getNodePinPos(sourceNode)
                  const p2 = getNodePinPos(targetNode)

                  const { path: pathData, midPoint, start, end } = getOptimizedStringCurve(
                    p1,
                    p2
                  )

                  const shouldShowBadge = showAllLabels || isConnected || isHoveredLink
                  const isCustom = customLinks.some((cl) => cl.id === link.id)

                  return (
                    <g
                      key={link.id}
                      className="transition-opacity duration-300"
                      opacity={isDimmed ? 0.12 : 1}
                    >
                      {/* Curved String from Card Dot to Card Dot */}
                      <path
                        d={pathData}
                        fill="none"
                        stroke={color}
                        strokeWidth={isConnected || isHoveredLink ? 3.5 : 2}
                        strokeDasharray={isContradiction ? '7 5' : undefined}
                        filter={isConnected || isHoveredLink ? 'url(#neon-glow)' : undefined}
                        className={isContradiction ? 'animate-pulse' : undefined}
                      />

                      {/* Pin Tie Rings at Start and End Dot */}
                      <circle
                        cx={start.x}
                        cy={start.y}
                        r={isConnected || isHoveredLink ? 4.5 : 3}
                        fill={color}
                        stroke="#ffffff"
                        strokeWidth={1.5}
                        className="transition-all"
                      />
                      <circle
                        cx={end.x}
                        cy={end.y}
                        r={isConnected || isHoveredLink ? 4.5 : 3}
                        fill={color}
                        stroke="#ffffff"
                        strokeWidth={1.5}
                        className="transition-all"
                      />

                      {/* Relationship Badge placed exactly at curve midpoint */}
                      {shouldShowBadge && (
                        <foreignObject
                          x={midPoint.x - 100}
                          y={midPoint.y - 14}
                          width="200"
                          height="28"
                          className="overflow-visible pointer-events-auto"
                        >
                          <div
                            onMouseEnter={() => setHoveredLinkId(link.id)}
                            onMouseLeave={() => setHoveredLinkId(null)}
                            onClick={() => {
                              if (isCustom) {
                                setCustomLinks((prev) => prev.filter((cl) => cl.id !== link.id))
                                toast.success('Connection link removed.')
                              }
                            }}
                            className={cn(
                              'px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-tight text-center shadow-lg border truncate transition-transform hover:scale-105 cursor-pointer flex items-center justify-center gap-1',
                              isContradiction
                                ? 'bg-rose-950/95 text-rose-300 border-rose-500/80 shadow-rose-900/40'
                                : theme === 'noir'
                                ? 'bg-[#3b2316]/95 text-amber-200 border-amber-600/80'
                                : 'bg-slate-900/95 text-teal-300 border-teal-500/60 shadow-teal-950/50'
                            )}
                            title={isCustom ? `${link.label} (Click to remove link)` : link.label}
                          >
                            <span>{link.label}</span>
                            {isCustom && <span className="text-rose-400 font-bold ml-1">✕</span>}
                          </div>
                        </foreignObject>
                      )}
                    </g>
                  )
                })}

                {/* Requirement 2: Dynamic Rubber-Band String while pulling from dot */}
                {pullingFromNodeId && pullCurrentPos && (() => {
                  const sourceNode = allNodes.find((n) => n.id === pullingFromNodeId)
                  if (!sourceNode) return null
                  const p1 = getNodePinPos(sourceNode)
                  const targetNode = hoveredDropNodeId
                    ? allNodes.find((n) => n.id === hoveredDropNodeId)
                    : null
                  const p2 = targetNode ? getNodePinPos(targetNode) : pullCurrentPos

                  const dx = p2.x - p1.x
                  const dy = p2.y - p1.y
                  const cpDx = Math.min(180, Math.max(50, Math.abs(dx) * 0.35))
                  const pathData = `M ${p1.x} ${p1.y} C ${p1.x + (dx >= 0 ? cpDx : -cpDx)} ${p1.y + dy * 0.2}, ${
                    p2.x - (dx >= 0 ? cpDx : -cpDx)
                  } ${p2.y - dy * 0.2}, ${p2.x} ${p2.y}`
                  const strokeColor = targetNode ? '#10b981' : '#38bdf8'

                  return (
                    <g className="z-50 pointer-events-none">
                      {/* Outer pulsing glow line */}
                      <path
                        d={pathData}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={4.5}
                        strokeDasharray="8 5"
                        className="animate-pulse"
                        opacity={0.9}
                        filter="url(#neon-glow)"
                      />
                      {/* Inner crisp line */}
                      <path
                        d={pathData}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth={2}
                        strokeDasharray="8 5"
                      />
                      {/* Circle tip tracking cursor or snapped to target dot */}
                      <circle
                        cx={p2.x}
                        cy={p2.y}
                        r={targetNode ? 9 : 7}
                        fill={strokeColor}
                        stroke="#ffffff"
                        strokeWidth={2.5}
                      />
                      {/* Source pin ring */}
                      <circle
                        cx={p1.x}
                        cy={p1.y}
                        r={6}
                        fill={strokeColor}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />

                      {/* Tooltip badge floating right next to mouse */}
                      <foreignObject
                        x={p2.x + 14}
                        y={p2.y - 28}
                        width="240"
                        height="36"
                        className="overflow-visible pointer-events-none"
                      >
                        <div
                          className={cn(
                            'px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xl border whitespace-nowrap inline-flex items-center gap-1.5 backdrop-blur-md',
                            targetNode
                              ? 'bg-emerald-950 text-emerald-200 border-emerald-400 ring-2 ring-emerald-400/50 scale-105 transition-transform'
                              : 'bg-slate-900/95 text-sky-200 border-sky-400/60'
                          )}
                        >
                          {targetNode ? (
                            <>
                              <span>🔗</span>
                              <span>Drop to connect with &quot;{targetNode.label.slice(0, 18)}&quot;</span>
                            </>
                          ) : (
                            <>
                              <span>🧵</span>
                              <span>Pull string to another card to connect</span>
                            </>
                          )}
                        </div>
                      </foreignObject>
                    </g>
                  )
                })()}
              </svg>
            )}

            {/* Interactive Pins Container */}
            <div
              className="absolute inset-0 w-full h-full pointer-events-none z-20"
              style={{
                width: `${CANVAS_WIDTH}px`,
                height: `${CANVAS_HEIGHT}px`,
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top left',
              }}
            >
              {filteredNodes.map((node) => {
                const cfg = CATEGORY_STYLES[node.category]
                const Icon = cfg.icon
                const isSelected = node.id === selectedNodeId
                const isHovered = node.id === hoveredNodeId
                const isConnected = connectedNodeIds.has(node.id)
                const isDimmed = activeFocusId && !isConnected

                const isPullSource = pullingFromNodeId === node.id
                const isHoveredDropTarget = hoveredDropNodeId === node.id

                const pos = getNodePixelPos(node)
                const connectedCount = allLinks.filter(
                  (l) => l.source === node.id || l.target === node.id
                ).length

                return (
                  <motion.div
                    key={node.id}
                    onPointerDown={(e) => handleCardPointerDown(e, node.id)}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{
                      opacity: isDimmed ? 0.2 : 1,
                      scale: isHoveredDropTarget ? 1.08 : isSelected ? 1.04 : 1,
                    }}
                    transition={{ duration: 0.15 }}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    onClick={(e) => {
                      if (isDraggingCardRef.current || pullingFromNodeId) {
                        e.stopPropagation()
                        return
                      }
                      setSelectedNodeId(node.id)
                    }}
                    style={{
                      position: 'absolute',
                      left: `${pos.x - 112}px`,
                      top: `${pos.y - 71}px`,
                    }}
                    className={cn(
                      'group cursor-grab active:cursor-grabbing select-none pointer-events-auto transition-shadow',
                      isSelected && 'z-40',
                      isHovered && 'z-30',
                      isHoveredDropTarget && 'z-50'
                    )}
                  >
                    {/* Requirement 2: Interactive Pull Dot on top middle border of card */}
                    <div
                      className="flex justify-center -mb-2.5 relative z-40 pointer-events-auto"
                      title="Pull this dot to directly connect with another card"
                    >
                      <button
                        type="button"
                        onMouseDown={(e) => handleStartPull(e, node.id)}
                        className={cn(
                          'w-4 h-4 rounded-full shadow-lg border-2 border-white flex items-center justify-center transition-all cursor-crosshair group/pin',
                          cfg.pinColor,
                          isPullSource && 'ring-4 ring-sky-400 scale-140 animate-pulse',
                          isHoveredDropTarget
                            ? 'ring-4 ring-emerald-400 scale-150 animate-bounce shadow-emerald-400 shadow-xl'
                            : 'hover:scale-135 hover:ring-4 hover:ring-teal-400/60 active:scale-125'
                        )}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white opacity-90 pointer-events-none" />
                      </button>
                    </div>

                    {/* Card Body */}
                    <div
                      className={cn(
                        'w-[225px] h-[142px] p-3 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-150 flex flex-col justify-between',
                        theme === 'noir' ? cfg.cardBgNoir : cfg.cardBgDark,
                        cfg.cardBorder,
                        isSelected && cfg.glowBorder,
                        isHoveredDropTarget && 'ring-4 ring-emerald-400 shadow-emerald-500/40 shadow-2xl border-emerald-400',
                        isHovered && !isSelected && !isHoveredDropTarget && 'shadow-teal-500/20 shadow-lg border-teal-500/50'
                      )}
                    >
                      <div>
                        {/* Header with Category Pill */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span
                            className={cn(
                              'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded',
                              cfg.tagBg,
                              cfg.tagText
                            )}
                          >
                            {cfg.name}
                          </span>
                          <Icon className="w-3.5 h-3.5 opacity-80 shrink-0" />
                        </div>

                        {/* Node Title */}
                        <h4 className="font-bold text-xs text-white leading-snug line-clamp-2">
                          {node.label}
                        </h4>

                        {/* Brief Preview */}
                        <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                          {node.brief}
                        </p>
                      </div>

                      {/* Card Footer */}
                      <div className="mt-auto pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="truncate max-w-[125px]" title={node.source}>
                          {node.source || 'Case Record'}
                        </span>
                        <span className="font-mono text-teal-400 font-semibold shrink-0">
                          🔗 {connectedCount} {connectedCount === 1 ? 'link' : 'links'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Quick Canvas Tip pinned neatly to the bottom left of the visible viewport */}
          <div className="sticky bottom-3 left-3 inline-flex items-center gap-2 z-30 pointer-events-none text-xs text-slate-300 bg-slate-900/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/80 shadow-2xl ml-4 mb-3">
            <Move className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>Drag cards to move • Pull the top colored dot to link cards • Click to inspect</span>
          </div>
        </div>
      )}

      {/* ── Slide-Over / Card Inspector Drawer ───────────────── */}
      <AnimatePresence>
        {selectedNode && (
          <div className="fixed inset-0 z-50 pointer-events-none flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNodeId(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs pointer-events-auto"
            />

            {/* Drawer */}
            <motion.div
              initial={{ opacity: 0, x: 360 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 360 }}
              transition={{ type: 'spring', damping: 26, stiffness: 230 }}
              className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 text-white p-6 shadow-2xl flex flex-col gap-4 overflow-y-auto pointer-events-auto h-full"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-3 h-3 rounded-full',
                      CATEGORY_STYLES[selectedNode.category].pinColor
                    )}
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                    Card Details &amp; Connections
                  </span>
                </div>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Title & Category */}
              <div>
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded',
                    CATEGORY_STYLES[selectedNode.category].tagBg,
                    CATEGORY_STYLES[selectedNode.category].tagText
                  )}
                >
                  {CATEGORY_STYLES[selectedNode.category].name}
                </span>
                <h3 className="text-lg font-bold text-white mt-1.5 leading-snug">
                  {selectedNode.label}
                </h3>
                {selectedNode.date && (
                  <p className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                    <span>Date: {selectedNode.date}</span>
                  </p>
                )}
              </div>

              {/* Narrative Brief */}
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Summary &amp; Key Facts
                </span>
                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                  {selectedNode.brief}
                </p>
              </div>

              {/* Source Document Citation */}
              {selectedNode.source && (
                <div className="flex items-center gap-2.5 text-xs bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                  <FileText className="w-4 h-4 text-teal-400 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] text-slate-400 block">Source Document</span>
                    <span className="text-slate-200 font-medium truncate block">
                      {selectedNode.source}
                    </span>
                  </div>
                </div>
              )}

              {/* Connected Dots Network List */}
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-800 flex-1">
                <span className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Connected Cards</span>
                  <span className="text-teal-400 font-mono text-[11px]">
                    {
                      allLinks.filter(
                        (l) => l.source === selectedNode.id || l.target === selectedNode.id
                      ).length
                    }{' '}
                    connected
                  </span>
                </span>

                <div className="flex flex-col gap-2 overflow-y-auto max-h-60 pr-1">
                  {allLinks
                    .filter((l) => l.source === selectedNode.id || l.target === selectedNode.id)
                    .map((link) => {
                      const otherId = link.source === selectedNode.id ? link.target : link.source
                      const otherNode = allNodes.find((n) => n.id === otherId)
                      if (!otherNode) return null

                      const isContradiction = link.relationType === 'contradicts'

                      return (
                        <button
                          key={link.id}
                          onClick={() => setSelectedNodeId(otherId)}
                          className={cn(
                            'flex flex-col text-left p-2.5 rounded-xl border transition-all text-xs group',
                            isContradiction
                              ? 'bg-rose-950/40 border-rose-500/40 hover:bg-rose-950/70 hover:border-rose-400'
                              : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-teal-500/50'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200 group-hover:text-white truncate">
                              {otherNode.label}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                          </div>
                          <span
                            className={cn(
                              'text-[10px] mt-1 font-medium',
                              isContradiction ? 'text-rose-400 font-bold' : 'text-teal-400'
                            )}
                          >
                            ↳ {link.label}
                          </span>
                        </button>
                      )
                    })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                <Link
                  href={`/cases/${caseId}`}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors shadow-md"
                >
                  <span>Open Full Case Details</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Add Custom Clue / Card Modal ────────────────────────── */}
      <AnimatePresence>
        {addClueModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Pin className="w-4 h-4 text-teal-400" />
                  <h3 className="font-bold text-base text-white">Add a Note or Card to the Board</h3>
                </div>
                <button
                  onClick={() => setAddClueModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddClue} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Card Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alibi Witness saw accused at taxi stand"
                    value={newClueLabel}
                    onChange={(e) => setNewClueLabel(e.target.value)}
                    required
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-300">Category</label>
                    <select
                      value={newClueCategory}
                      onChange={(e) =>
                        setNewClueCategory(e.target.value as DetectiveNodeCategory)
                      }
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-teal-500 cursor-pointer"
                    >
                      <option value="scenario">🕒 Timeline &amp; Events</option>
                      <option value="person">👤 People Involved</option>
                      <option value="evidence">📑 Evidence &amp; Proof</option>
                      <option value="conflict">🚨 Issues &amp; Conflicts</option>
                      <option value="legal">⚖️ Court Orders &amp; Rules</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Connect to Existing Card
                    </label>
                    <select
                      value={connectToNodeId}
                      onChange={(e) => setConnectToNodeId(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-teal-500 cursor-pointer"
                    >
                      <option value="">(None - Standalone Card)</option>
                      {allNodes.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.label.slice(0, 30)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Details &amp; Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe what happened, what was found, or why this matters in simple words…"
                    value={newClueBrief}
                    onChange={(e) => setNewClueBrief(e.target.value)}
                    required
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-500 resize-none"
                  />
                </div>

                <div className="mt-3 flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAddClueModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-slate-950 bg-teal-500 hover:bg-teal-400 rounded-lg transition-colors shadow-md"
                  >
                    Save Card to Board
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
