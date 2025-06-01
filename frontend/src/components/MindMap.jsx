import React, { useEffect, useRef, useState } from 'react'
import { DataSet, Network } from 'vis-network/standalone'
import { BASE_URL } from '../api';

// just below your imports:
const normalize = s =>
  s
    .normalize('NFD')     
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019]/g, "'") 
    .replace(/[^a-zA-Z0-9' ]/g, '') 
    .toLowerCase()

export default function MindMap({ graph, onNodeClick, setGraph, searchTerm }) {
  const containerRef = useRef(null)
  const networkRef = useRef(null)
  const originalDataRef = useRef(null)
  const [editingNodeId, setEditingNodeId] = useState(null)
  const [editingEdgeId, setEditingEdgeId] = useState(null)
  const [newLabel, setNewLabel] = useState('')
  
  // 1️⃣ Initial graph construction
  useEffect(() => {
    if (!containerRef.current || !graph?.nodes || !graph?.links) {
      console.log('Missing required graph data:', { graph })
      return
    }

    // Build DataSets
    const nodes = new DataSet(
      graph.nodes.map(n => ({
        id: n.id,
        label: n.label,
        value: n.weight,
        ...(n.fixed
          ? { fixed: { x: true, y: true }, x: n.x, y: n.y }
          : { fixed: false })
      }))
    )
    const edges = new DataSet(
      graph.links.map(l => ({
        id: `${l.source}-${l.target}`,
        from: l.source,
        to: l.target,
        value: l.weight,
        arrows: 'to',
        label: l.relation,
        font: { size: 12, align: 'middle', face: 'arial' }
      }))
    )

    // Save full, original graph
    originalDataRef.current = { nodes, edges }

    // Network options
    const options = {
      layout: { randomSeed: 2, improvedLayout: true, clusterThreshold: 150 },
      physics: {
        enabled: true,
        barnesHut: {
          gravitationalConstant: -2000,
          centralGravity: 0.1,
          springLength: 200,
          springConstant: 0.04,
          damping: 0.09,
          avoidOverlap: 1.5
        },
        repulsion: { nodeDistance: 250 },
        solver: 'barnesHut',
        stabilization: { enabled: true, iterations: 1000, updateInterval: 25, onlyDynamicEdges: false, fit: true }
      },
      nodes: {
        shape: 'dot',
        size: 20,
        borderWidth: 2,
        color: {
          border: '#97C2FC',
          background: '#D2E5FF',
          highlight: { border: '#2B7CE9', background: '#D2E5FF' },
          hover: { border: '#2B7CE9', background: '#FFF5D2' }
        },
        font: { color: '#343434', size: 14 },
        margin: 20,
        mass: 1.5
      },  
      edges: {
        smooth: { type: 'continuous', forceDirection: 'none', roundness: 0.5 },
        color: { color: '#97C2FC', highlight: '#7AA3E5', hover: '#FBC02D', opacity: 0.8 },
        width: 1.5,
        selectionWidth: 2,
        hoverWidth: 2,
        arrows: { to: { enabled: true, scaleFactor: 1.0, type: 'triangle'} }
      },
      interaction: {
        hover: true,
        tooltipDelay: 0,
        hideEdgesOnDrag: true,
        navigationButtons: false,
        keyboard: true,
        zoomView: true
      }
    }

    // Instantiate
    const network = new Network(containerRef.current, { nodes, edges }, options)
    networkRef.current = network
    network.on('click', params => {
      if (params.nodes.length === 1) {
        const nodeId = params.nodes[0]
        const jsEvent = params.event.srcEvent
        if (jsEvent.ctrlKey) {
          // CTRL+click: toggle lock/freeze for this node
          // 1) find current position
          const pos = network.getPosition(nodeId)
          // 2) see if it's already locked in our DataSet
          const current = nodes.get(nodeId)
          const wasLocked = current.fixed && current.fixed.x && current.fixed.y
          if (wasLocked) {
            // unlock: allow physics again
            nodes.update({ id: nodeId, fixed: false })
            // remove x/y flags from our graph.nodes
            const newGraph = {
              ...graph,
              nodes: graph.nodes.map(n =>
                n.id === nodeId
                  ? { id: n.id, label: n.label, weight: n.weight /* drop x/y/fixed */ }
                  : n
              )
            }
            setGraph(newGraph)
            localStorage.setItem('galleryMaps', JSON.stringify(
              JSON.parse(localStorage.getItem('galleryMaps') || '[]').map(m =>
                m.id === graph.id ? { ...m, graph: newGraph } : m
              )
            ))
          } else {
            // lock: fix in place at (pos.x, pos.y)
            nodes.update({ id: nodeId, fixed: { x: true, y: true }, x: pos.x, y: pos.y })
            // record x,y,fixed=true in our own graph object
            const newGraph = {
              ...graph,
              nodes: graph.nodes.map(n =>
                n.id === nodeId
                  ? { ...n, fixed: true, x: pos.x, y: pos.y }
                  : n
              )
            }
            setGraph(newGraph)
            localStorage.setItem('galleryMaps', JSON.stringify(
              JSON.parse(localStorage.getItem('galleryMaps') || '[]').map(m =>
                m.id === graph.id ? { ...m, graph: newGraph } : m
              )
            ))
          }
        } else if (params.edges.length === 1) {
        const edgeId = params.edges[0]
        const edge = edges.get(edgeId)
        if (edge) {
          setEditingEdgeId(edgeId)
          setNewLabel(edge.label)
        }
      }}
    })

    // Double‑click opens NodeModal
    network.on('doubleClick', params => {
      if (!params.nodes.length) return
      const clicked = graph.nodes.find(n => n.id === params.nodes[0])
      if (clicked) onNodeClick(clicked)
    })

    // After stabilization, soften physics
    network.once('stabilizationIterationsDone', () => {
      network.setOptions({
        physics: {
          enabled: true,
          barnesHut: {
            gravitationalConstant: -1000,
            centralGravity: 0.05,
            springLength: 200,
            springConstant: 0.02,
            damping: 0.2,
            avoidOverlap: 1.5
          },
          stabilization: false
        }
      })
    })

    return () => network.destroy()
  }, [graph, onNodeClick, setGraph])

  // 2️⃣ Subgraph filtering whenever searchTerm changes
  useEffect(() => {
    const net = networkRef.current
    const full = originalDataRef.current
    if (!net || !full) return

    const term = (searchTerm || '').trim().toLowerCase()
    if (!term) {
      // show full graph
      net.setData({ nodes: full.nodes, edges: full.edges })
      net.fit({ animation: { duration: 200, easingFunction: 'easeInOutQuad' } })
      return
    }

    // find matching nodes
    const allNodes = full.nodes.get()
    const matched = allNodes.filter(n => normalize(n.label).includes(normalize(term)))
    const matchedIds = matched.map(n => n.id)

    // find edges that touch matched nodes
    const allEdges = full.edges.get()
    const related = allEdges.filter(e => matchedIds.includes(e.from) || matchedIds.includes(e.to))

    // include neighbor nodes
    const neighborIds = new Set(matchedIds)
    related.forEach(e => {
      neighborIds.add(e.from)
      neighborIds.add(e.to)
    })

    // build subgraph
    const subNodes = allNodes.filter(n => neighborIds.has(n.id))
    const subEdges = related

    // render and fit
    net.setData({
      nodes: new DataSet(subNodes),
      edges: new DataSet(subEdges)
    })
    net.fit({ animation: { duration: 200, easingFunction: 'easeInOutQuad' } })
  }, [searchTerm])

  const handleRename = () => {
    const full = originalDataRef.current
    if (editingNodeId !== null) {
      full.nodes.update({ id: editingNodeId, label: newLabel })
      networkRef.current.setData({ nodes: full.nodes, edges: full.edges })
  
      // Update graph in localStorage + Supabase
      const updated = {
        ...graph,
        nodes: graph.nodes.map(n =>
          n.id === editingNodeId ? { ...n, label: newLabel } : n
        )
      }
      setGraph(updated)
      localStorage.setItem('latestGraph', JSON.stringify(updated))
  
      const gallery = JSON.parse(localStorage.getItem('galleryMaps') || '[]')
      const updatedGallery = gallery.map(m =>
        m.id === updated.id ? { ...m, graph: updated } : m
      )
      localStorage.setItem('galleryMaps', JSON.stringify(updatedGallery))
  
      fetch(`${BASE_URL}/store-graph`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ transcript: graph.transcript, graph: updated })
      }).catch(console.error)
  
      setEditingNodeId(null)
    } else if (editingEdgeId !== null) {
      full.edges.update({ id: editingEdgeId, label: newLabel })
      networkRef.current.setData({ nodes: full.nodes, edges: full.edges })
  
      const updated = {
        ...graph,
        links: graph.links.map(e =>
          `${e.source}-${e.target}` === editingEdgeId ? { ...e, relation: newLabel } : e
        )
      }
      setGraph(updated)
      localStorage.setItem('latestGraph', JSON.stringify(updated))
      const gallery = JSON.parse(localStorage.getItem('galleryMaps') || '[]')
      const updatedGallery = gallery.map(m =>
        m.id === updated.id ? { ...m, graph: updated } : m
      )
      localStorage.setItem('galleryMaps', JSON.stringify(updatedGallery))
  
      // Only call store-graph if you actually have a transcript
      if (graph.transcript) {
        fetch(`${BASE_URL}/store-graph`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: graph.transcript,
            graph: updated
          })
        }).catch(console.error)
      }
  
      setEditingEdgeId(null)
    }
  }  

  return (
    <div
      ref={containerRef}
      className="w-full h-[800px] bg-white rounded-md border shadow"
    >
    </div>
  )
}