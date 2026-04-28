import { getSmoothStepPath, EdgeLabelRenderer, BaseEdge } from '@xyflow/react'

export function FlowEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data, label, style, markerEnd, selected,
}) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })

  const edgeStyle = {
    stroke: selected ? '#6366f1' : '#94a3b8',
    strokeWidth: selected ? 2.5 : 2,
    ...style,
  }

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={edgeStyle} />

      {label && (
        <EdgeLabelRenderer>
          {/* translate(-50%, -100%) centers horizontally and places it above the midpoint */}
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -100%) translate(${labelX}px, ${labelY - 8}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <span className="inline-block rounded bg-paper px-2 py-0.5 text-[11px] font-semibold text-ink shadow-sm border border-ink/10 select-none dark:bg-ink dark:text-paper dark:border-paper/10">
              {label}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export const EDGE_TYPES = { smoothstep: FlowEdge }
