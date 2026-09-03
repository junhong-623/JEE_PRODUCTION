import { Handle, Position } from '@xyflow/react'

// Handles must have: unique id, zIndex above visual layers, larger hit area
const hs = {
  width: 12, height: 12,
  background: '#94a3b8',
  border: '2px solid white',
  borderRadius: '50%',
  zIndex: 10,
}

// Clamp text to 2 lines with ellipsis, centered
const clamp = {
  overflow: 'hidden',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  textAlign: 'center',
  wordBreak: 'break-word',
  userSelect: 'none',
}

const labelStyle  = { fontSize: 13, fontWeight: 500, ...clamp }
const descStyle   = { fontSize: 11, marginTop: 4, opacity: 0.7, ...clamp }
const circleLabel = { fontSize: 12, fontWeight: 600, ...clamp }

export function StartNode({ data, selected }) {
  return (
    <div style={{ position: 'relative', width: 80, height: 80 }}>
      {/* Visual layer — pointerEvents:none so handles stay clickable */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: selected ? '#bbf7d0' : '#dcfce7',
        border: `2px solid ${selected ? '#16a34a' : '#22c55e'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: selected ? '0 0 0 3px rgba(34,197,94,0.25)' : '0 2px 8px rgba(34,197,94,0.15)',
        transition: 'all 0.15s',
        pointerEvents: 'none',
      }}>
        <span style={{ ...circleLabel, color: '#166534', padding: '0 10px' }}>
          {data.label || 'Start'}
        </span>
      </div>
      <Handle id="bottom" type="source" position={Position.Bottom} style={hs} />
      <Handle id="right"  type="source" position={Position.Right}  style={hs} />
      <Handle id="left"   type="source" position={Position.Left}   style={hs} />
      <Handle id="top"    type="source" position={Position.Top}    style={hs} />
    </div>
  )
}

export function EndNode({ data, selected }) {
  return (
    <div style={{ position: 'relative', width: 80, height: 80 }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: selected ? '#fecaca' : '#fee2e2',
        border: `2px solid ${selected ? '#dc2626' : '#ef4444'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: selected ? '0 0 0 3px rgba(239,68,68,0.25)' : '0 2px 8px rgba(239,68,68,0.15)',
        transition: 'all 0.15s',
        pointerEvents: 'none',
      }}>
        <span style={{ ...circleLabel, color: '#991b1b', padding: '0 10px' }}>
          {data.label || 'End'}
        </span>
      </div>
      <Handle id="top"    type="target" position={Position.Top}    style={hs} />
      <Handle id="left"   type="target" position={Position.Left}   style={hs} />
      <Handle id="right"  type="target" position={Position.Right}  style={hs} />
      <Handle id="bottom" type="target" position={Position.Bottom} style={hs} />
    </div>
  )
}

export function ProcessNode({ data, selected }) {
  return (
    <div style={{
      position: 'relative', minWidth: 160, maxWidth: 220,
      background: selected ? '#dbeafe' : '#eff6ff',
      border: `2px solid ${selected ? '#2563eb' : '#3b82f6'}`,
      borderRadius: 10,
      boxShadow: selected ? '0 0 0 3px rgba(59,130,246,0.2)' : '0 2px 8px rgba(59,130,246,0.12)',
      padding: '10px 14px',
      transition: 'all 0.15s',
    }}>
      <Handle id="top"    type="target" position={Position.Top}    style={hs} />
      <Handle id="left"   type="target" position={Position.Left}   style={hs} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={hs} />
      <Handle id="right"  type="source" position={Position.Right}  style={hs} />
      {/* Content — pointerEvents:none only on overlapping elements */}
      <div style={{ position: 'relative', zIndex: 1, pointerEvents: 'none' }}>
        <div style={{ ...labelStyle, color: '#1e3a8a' }}>
          {data.label || 'Process'}
        </div>
        {data.description && (
          <div style={{ ...descStyle, color: '#3730a3' }}>
            {data.description}
          </div>
        )}
        {data.imageUrl && (
          <img
            src={data.imageUrl} alt=""
            style={{ marginTop: 8, width: '100%', borderRadius: 6, objectFit: 'cover', maxHeight: 100, display: 'block' }}
          />
        )}
      </div>
    </div>
  )
}

export function DecisionNode({ data, selected }) {
  return (
    <div style={{ position: 'relative', width: 130, height: 130 }}>
      {/* Rotated diamond shape — pointerEvents:none so edge handles stay clickable */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: 90, height: 90,
        transform: 'translate(-50%, -50%) rotate(45deg)',
        background: selected ? '#fef08a' : '#fefce8',
        border: `2px solid ${selected ? '#ca8a04' : '#eab308'}`,
        borderRadius: 5,
        boxShadow: selected ? '0 0 0 3px rgba(234,179,8,0.25)' : '0 2px 8px rgba(234,179,8,0.2)',
        transition: 'all 0.15s',
        pointerEvents: 'none',
      }} />
      {/* Label centred over the diamond */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <span style={{ ...circleLabel, color: '#713f12', fontSize: 12, padding: '0 14px' }}>
          {data.label || 'Decision'}
        </span>
      </div>
      <Handle id="top"   type="target" position={Position.Top}    style={hs} />
      <Handle id="no"    type="source" position={Position.Bottom} style={hs} />
      <Handle id="yes"   type="source" position={Position.Right}  style={hs} />
      <Handle id="left"  type="source" position={Position.Left}   style={hs} />
    </div>
  )
}

export function IONode({ data, selected }) {
  return (
    <div style={{ position: 'relative', width: 180, height: 64 }}>
      {/* Parallelogram via clip-path — pointerEvents:none */}
      <div style={{
        position: 'absolute', inset: 0,
        background: selected ? '#e9d5ff' : '#f5f3ff',
        border: `2px solid ${selected ? '#7c3aed' : '#8b5cf6'}`,
        borderRadius: 4,
        clipPath: 'polygon(20px 0%, 100% 0%, calc(100% - 20px) 100%, 0% 100%)',
        boxShadow: selected ? '0 0 0 3px rgba(139,92,246,0.2)' : '0 2px 8px rgba(139,92,246,0.12)',
        transition: 'all 0.15s',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '6px 28px',
        pointerEvents: 'none',
      }}>
        <div style={{ ...labelStyle, color: '#4c1d95' }}>
          {data.label || 'Input / Output'}
        </div>
        {data.description && (
          <div style={{ ...descStyle, color: '#6d28d9', marginTop: 3 }}>
            {data.description}
          </div>
        )}
      </div>
      <Handle id="top"    type="target" position={Position.Top}    style={hs} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={hs} />
      <Handle id="left"   type="target" position={Position.Left}   style={hs} />
      <Handle id="right"  type="source" position={Position.Right}  style={hs} />
    </div>
  )
}

export const NODE_TYPES = { start: StartNode, end: EndNode, process: ProcessNode, decision: DecisionNode, io: IONode }

export const NODE_SIZE = {
  start:    { width: 80,  height: 80  },
  end:      { width: 80,  height: 80  },
  process:  { width: 160, height: 60  },
  decision: { width: 130, height: 130 },
  io:       { width: 180, height: 64  },
}

export const PALETTE = [
  { type: 'start',    label: 'Start',    color: '#22c55e', desc: 'Entry point' },
  { type: 'process',  label: 'Process',  color: '#3b82f6', desc: 'Action or step' },
  { type: 'decision', label: 'Decision', color: '#eab308', desc: 'Branch / condition' },
  { type: 'io',       label: 'I / O',    color: '#8b5cf6', desc: 'Input or output' },
  { type: 'end',      label: 'End',      color: '#ef4444', desc: 'Exit point' },
]
