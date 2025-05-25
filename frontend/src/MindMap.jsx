import React, { useEffect, useRef } from 'react'
import { DataSet, Network } from 'vis-network/standalone'

export default function MindMap({ graph }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !graph) return

    // 1) Transform to vis format, adding fixed positions if desired:
    const nodes = new DataSet(
      graph.nodes.map((n, i) => ({
        id: n.id,
        label: n.label,
        value: n.weight,
        // optional: pin every node at an X/Y grid
        x: (i % 3) * 150,
        y: Math.floor(i / 3) * 150,
        fixed: { x: false, y: false } // set to true,true to lock them completely
      }))
    )

    const edges = new DataSet(
      graph.links.map((l) => ({
        from: l.source,
        to:   l.target,
        value: l.weight,
        title: l.relation,
        arrows: { to: { enabled: true, type: 'arrow' } }  // ← directed
      }))
    )

    const data = { nodes, edges }

    // 2) Choose a hierarchical, non‑physics layout:
    const options = {
      physics: false,                    // disable free‑floating
      layout: {
        hierarchical: {
          direction: 'LR',               // left‑to‑right tree
          sortMethod: 'directed',        // follow link direction
          nodeSpacing: 200,
          levelSeparation: 150
        }
      },
      nodes: { shape: 'circle' },
      edges: { smooth: true },
      interaction: { hover: true, dragNodes: true }
    }

    // 3) Initialize
    const network = new Network(containerRef.current, data, options)

    return () => network.destroy()
  }, [graph])

  return (
    <div
      ref={containerRef}
      className="w-full h-[600px] border rounded-md"
    />
  )
}