import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ReactFlow, ReactFlowProvider, useNodesState, useEdgesState,
  useReactFlow, addEdge, Background, Controls, MiniMap, Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useAuth } from '../../contexts/AuthContext'
import { getFlowchart, updateFlowchart, getAccessForFlowchart } from '../services/firestore'
import { NODE_TYPES, NODE_SIZE, PALETTE } from '../components/nodes'
import { EDGE_TYPES } from '../components/edges'
import NodePropertiesPanel from '../components/NodePropertiesPanel'
import EdgePropertiesPanel from '../components/EdgePropertiesPanel'
import ShareModal from '../components/ShareModal'

export default function EditorPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [flowchart, setFlowchart] = useState(null)
  const [permission, setPermission] = useState(null) // 'owner' | 'edit' | 'view'
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const fc = await getFlowchart(id)
        if (fc.ownerId === user.uid) {
          setPermission('owner')
        } else {
          const access = await getAccessForFlowchart(id, user.uid)
          if (!access) { setError('You do not have access to this flowchart.'); return }
          setPermission(access.permission)
        }
        setFlowchart(fc)
      } catch (e) {
        setError(e.message)
      }
    })()
  }, [id, user])

  if (error) return (
    <div className="flex min-h-screen items-center justify-center aurora-bg">
      <div className="text-center space-y-4">
        <p className="text-sm text-ink/50 dark:text-paper/50">{error}</p>
        <a href="/flowchart" className="text-xs text-accent underline">← Back to dashboard</a>
      </div>
    </div>
  )

  if (!flowchart || !permission) return (
    <div className="flex min-h-screen items-center justify-center aurora-bg">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-ink dark:border-paper/20 dark:border-t-paper" />
    </div>
  )

  return (
    <ReactFlowProvider>
      <EditorCanvas flowchart={flowchart} permission={permission} />
    </ReactFlowProvider>
  )
}

// ── Inner canvas (inside ReactFlowProvider) ──────────────────────────────────

function EditorCanvas({ flowchart, permission }) {
  const navigate = useNavigate()
  const { screenToFlowPosition, getNodes } = useReactFlow()
  const canEdit = permission === 'owner' || permission === 'edit'

  const [nodes, setNodes, onNodesChange] = useNodesState(flowchart.nodes ?? [])
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowchart.edges ?? [])
  const [title, setTitle]               = useState(flowchart.title)
  const [editingTitle, setEditingTitle] = useState(false)
  const [saveStatus, setSaveStatus]     = useState('saved') // 'saved' | 'saving' | 'error'
  const [selectedNode, setSelectedNode] = useState(null)
  const [selectedEdge, setSelectedEdge] = useState(null)
  const [showShare, setShowShare]       = useState(false)
  const [exporting, setExporting]       = useState(false)
  const titleInputRef = useRef(null)
  const saveTimer = useRef(null)

  const nodeTypes = useMemo(() => NODE_TYPES, [])
  const edgeTypes = useMemo(() => EDGE_TYPES, [])

  // Keep selectedNode in sync with nodes state
  useEffect(() => {
    if (!selectedNode) return
    const updated = nodes.find(n => n.id === selectedNode.id)
    if (updated) setSelectedNode(updated)
    else setSelectedNode(null)
  }, [nodes])

  // Keep selectedEdge in sync with edges state
  useEffect(() => {
    if (!selectedEdge) return
    const updated = edges.find(e => e.id === selectedEdge.id)
    if (updated) setSelectedEdge(updated)
    else setSelectedEdge(null)
  }, [edges])

  // Auto-save
  useEffect(() => {
    if (!canEdit) return
    clearTimeout(saveTimer.current)
    setSaveStatus('saving')
    saveTimer.current = setTimeout(async () => {
      try {
        const clean = (arr) => arr.map(({ selected, dragging, ...rest }) => rest)
        await updateFlowchart(flowchart.id, { nodes: clean(nodes), edges: clean(edges) })
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      }
    }, 1500)
    return () => clearTimeout(saveTimer.current)
  }, [nodes, edges])

  const onConnect = useCallback((params) => {
    if (!canEdit) return
    setEdges(eds => addEdge({
      ...params,
      type: 'smoothstep',
      style: { stroke: '#94a3b8', strokeWidth: 2 },
      labelStyle: { fontSize: 11, fontWeight: 600, fill: '#374151' },
      labelBgStyle: { fill: '#ffffff', fillOpacity: 0.92 },
      labelBgPadding: [5, 4],
      labelBgBorderRadius: 4,
      data: { lineStyle: 'solid' },
    }, eds))
  }, [canEdit, setEdges])

  const updateEdgeProperty = useCallback((edgeId, key, value) => {
    setEdges(eds => eds.map(e => {
      if (e.id !== edgeId) return e
      if (key === 'label') return { ...e, label: value || undefined }
      if (key === 'lineStyle') {
        // Destructure strokeDasharray out so solid truly removes it
        const { strokeDasharray: _removed, ...restStyle } = e.style || {}
        const dash = value === 'dashed' ? '8,4' : value === 'dotted' ? '2,5' : null
        return {
          ...e,
          style: dash ? { ...restStyle, strokeDasharray: dash } : restStyle,
          data: { ...e.data, lineStyle: value },
        }
      }
      return e
    }))
  }, [setEdges])

  const deleteEdge = useCallback((edgeId) => {
    setEdges(eds => eds.filter(e => e.id !== edgeId))
    setSelectedEdge(null)
  }, [setEdges])

  const addNode = useCallback((type, clientX, clientY) => {
    if (!canEdit) return
    const size = NODE_SIZE[type]
    const rfContainer = document.querySelector('.react-flow')
    const rect = rfContainer?.getBoundingClientRect() ?? { left: 0, top: 0 }
    const pos = screenToFlowPosition({ x: clientX ?? rect.left + rect.width / 2, y: clientY ?? rect.top + rect.height / 2 })
    const newNode = {
      id: `node_${Date.now()}`,
      type,
      position: { x: pos.x - size.width / 2, y: pos.y - size.height / 2 },
      data: { label: type.charAt(0).toUpperCase() + type.slice(1) },
    }
    setNodes(nds => [...nds, newNode])
  }, [canEdit, screenToFlowPosition, setNodes])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('application/reactflow')
    if (!type) return
    addNode(type, e.clientX, e.clientY)
  }, [addNode])

  const onDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: newData } : n))
  }, [setNodes])

  const deleteNode = useCallback((nodeId) => {
    setNodes(nds => nds.filter(n => n.id !== nodeId))
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId))
    setSelectedNode(null)
  }, [setNodes, setEdges])

  const handleTitleSave = async () => {
    setEditingTitle(false)
    if (!title.trim()) { setTitle(flowchart.title); return }
    await updateFlowchart(flowchart.id, { title: title.trim() })
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const { toPng } = await import('html-to-image')
      const el = document.querySelector('.react-flow')
      if (!el) return
      const dataUrl = await toPng(el, { pixelRatio: 2, backgroundColor: '#f8f8f2' })
      const a = document.createElement('a')
      a.download = `${title || 'flowchart'}.png`
      a.href = dataUrl
      a.click()
    } catch (e) {
      alert('Export failed: ' + e.message)
    } finally {
      setExporting(false)
    }
  }

  const onNodeClick = useCallback((_, node) => { setSelectedNode(node); setSelectedEdge(null) }, [])
  const onEdgeClick = useCallback((_, edge) => { setSelectedEdge(edge); setSelectedNode(null) }, [])
  const onPaneClick = useCallback(() => { setSelectedNode(null); setSelectedEdge(null) }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'transparent' }}>
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-ink/8 dark:border-paper/8 bg-paper/80 dark:bg-ink/70 backdrop-blur px-4 py-3 shrink-0 z-10">
        <button
          onClick={() => navigate('/flowchart')}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-ink/35 dark:text-paper/35 hover:bg-ink/6 dark:hover:bg-paper/6 hover:text-ink dark:hover:text-paper transition-colors text-sm"
        >
          ←
        </button>

        {editingTitle ? (
          <input
            ref={titleInputRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={e => { if (e.key === 'Enter') handleTitleSave(); if (e.key === 'Escape') { setTitle(flowchart.title); setEditingTitle(false) } }}
            autoFocus
            className="min-w-0 flex-1 rounded-xl border border-ink/15 dark:border-paper/15 bg-paper dark:bg-ink px-3 py-1.5 text-sm font-medium outline-none focus:border-ink/35 dark:focus:border-paper/35 max-w-xs"
          />
        ) : (
          <button
            onClick={() => canEdit && setEditingTitle(true)}
            className={`min-w-0 truncate text-sm font-medium text-ink dark:text-paper ${canEdit ? 'hover:text-accent transition-colors cursor-text' : 'cursor-default'}`}
            title={canEdit ? 'Click to rename' : ''}
          >
            {title}
          </button>
        )}

        <div className="flex items-center gap-1 ml-auto">
          {/* Save status */}
          <span className={`font-mono text-[10px] mr-2 transition-opacity ${
            saveStatus === 'saved' ? 'text-green-500 opacity-70'
            : saveStatus === 'saving' ? 'text-ink/30 dark:text-paper/30'
            : 'text-red-500'
          }`}>
            {saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'saving' ? '○ Saving…' : '! Error'}
          </span>

          {/* Permission badge */}
          {permission !== 'owner' && (
            <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider mr-1 ${
              permission === 'edit'
                ? 'bg-blue-50 text-blue-500 dark:bg-blue-950 dark:text-blue-400'
                : 'bg-ink/6 text-ink/38 dark:bg-paper/6 dark:text-paper/38'
            }`}>{permission}</span>
          )}

          {/* Share */}
          {permission === 'owner' && (
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 rounded-xl border border-ink/10 dark:border-paper/10 px-3 py-1.5 text-xs text-ink/55 dark:text-paper/55 hover:border-ink/25 dark:hover:border-paper/25 hover:text-ink dark:hover:text-paper transition-colors"
            >
              Share
            </button>
          )}

          {/* Export PNG */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-xl border border-ink/10 dark:border-paper/10 px-3 py-1.5 text-xs text-ink/55 dark:text-paper/55 hover:border-ink/25 dark:hover:border-paper/25 hover:text-ink dark:hover:text-paper transition-colors disabled:opacity-50"
          >
            {exporting ? '…' : '↓ Export'}
          </button>
        </div>
      </div>

      {/* ── Editor body ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Left palette */}
        {canEdit && (
          <aside className="w-44 shrink-0 border-r border-ink/8 dark:border-paper/8 bg-paper/60 dark:bg-ink/50 backdrop-blur flex flex-col overflow-y-auto">
            <p className="px-4 pt-4 pb-2 font-mono text-[9px] uppercase tracking-[0.22em] text-ink/25 dark:text-paper/25">
              Drag to add
            </p>
            <div className="flex flex-col gap-1.5 px-3 pb-4">
              {PALETTE.map(item => (
                <PaletteItem
                  key={item.type}
                  item={item}
                  onAdd={() => {
                    const rfEl = document.querySelector('.react-flow')
                    const rect = rfEl?.getBoundingClientRect()
                    if (rect) addNode(item.type, rect.left + rect.width / 2, rect.top + rect.height / 2)
                  }}
                />
              ))}
            </div>
            <div className="mt-auto px-3 pb-4">
              <p className="font-mono text-[9px] text-ink/20 dark:text-paper/20 leading-5">
                Drag nodes onto canvas or click to add. Click a connection line to label or style it.
              </p>
            </div>
          </aside>
        )}

        {/* React Flow canvas */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={canEdit ? onNodesChange : undefined}
            onEdgesChange={canEdit ? onEdgesChange : undefined}
            onConnect={canEdit ? onConnect : undefined}
            onDrop={canEdit ? onDrop : undefined}
            onDragOver={canEdit ? onDragOver : undefined}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            deleteKeyCode={canEdit ? 'Delete' : null}
            connectionMode="loose"
            nodesDraggable={canEdit}
            nodesConnectable={canEdit}
            elementsSelectable={true}
            style={{ background: 'transparent' }}
          >
            <Background color="#94a3b820" gap={24} size={1} />
            <Controls showInteractive={false} className="!shadow-sm !rounded-xl !border-ink/8 dark:!border-paper/8 !bg-paper/80 dark:!bg-ink/70 !backdrop-blur" />
            <MiniMap
              nodeColor={n => {
                const c = { start: '#22c55e', end: '#ef4444', process: '#3b82f6', decision: '#eab308', io: '#8b5cf6' }
                return c[n.type] ?? '#94a3b8'
              }}
              className="!rounded-xl !border-ink/8 dark:!border-paper/8 !bg-paper/80 dark:!bg-ink/70 !backdrop-blur"
            />

            {/* Empty state panel */}
            {nodes.length === 0 && canEdit && (
              <Panel position="top-center">
                <div className="mt-16 rounded-2xl border border-dashed border-ink/12 dark:border-paper/12 bg-paper/70 dark:bg-ink/50 backdrop-blur px-8 py-6 text-center">
                  <p className="text-sm text-ink/30 dark:text-paper/30">Drag a node from the left panel to start</p>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* Right properties panel — node or edge */}
        {selectedNode && (
          <NodePropertiesPanel
            node={selectedNode}
            onUpdate={updateNodeData}
            onDelete={deleteNode}
            readOnly={!canEdit}
          />
        )}
        {selectedEdge && !selectedNode && (
          <EdgePropertiesPanel
            edge={selectedEdge}
            onUpdate={updateEdgeProperty}
            onDelete={deleteEdge}
            readOnly={!canEdit}
          />
        )}
      </div>

      {/* Share modal */}
      {showShare && (
        <ShareModal
          flowchartId={flowchart.id}
          flowchartTitle={title}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  )
}

// ── Palette item ─────────────────────────────────────────────────────────────

function PaletteItem({ item, onAdd }) {
  const onDragStart = (e) => {
    e.dataTransfer.setData('application/reactflow', item.type)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onAdd}
      className="group flex cursor-grab items-center gap-2.5 rounded-xl border border-ink/8 dark:border-paper/8 bg-paper/70 dark:bg-ink/40 px-3 py-2.5 active:cursor-grabbing hover:border-opacity-50 transition-all hover:shadow-sm"
      style={{ '--hover-color': item.color }}
    >
      <span style={{
        width: 10, height: 10, borderRadius: item.type === 'start' || item.type === 'end' ? '50%'
          : item.type === 'decision' ? 3 : item.type === 'io' ? 2 : 4,
        background: item.color, flexShrink: 0,
        transform: item.type === 'decision' ? 'rotate(45deg)' : 'none',
      }} />
      <div className="min-w-0">
        <div className="text-xs font-medium text-ink/70 dark:text-paper/70">{item.label}</div>
        <div className="text-[10px] text-ink/30 dark:text-paper/30">{item.desc}</div>
      </div>
    </div>
  )
}
