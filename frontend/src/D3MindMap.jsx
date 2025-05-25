import React, { useRef, useEffect } from 'react'
import * as d3 from 'd3'

export default function D3MindMap({ graph }) {
  const container = useRef()

  useEffect(() => {
    if (!graph) return

    const width = container.current.clientWidth
    const height = container.current.clientHeight

    // Clear any existing SVG
    d3.select(container.current).selectAll('*').remove()

    // Create SVG
    const svg = d3
      .select(container.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)

    // Force simulation
    const sim = d3
      .forceSimulation(graph.nodes)
      .force(
        'link',
        d3.forceLink(graph.links).id((d) => d.id).distance(120)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))

    // Draw links
    const link = svg
      .append('g')
      .attr('stroke', '#60A5FA')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(graph.links)
      .join('line')
      .attr('stroke-width', (d) => d.weight * 8)

    // Draw nodes
    const node = svg
      .append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(graph.nodes)
      .join('circle')
      .attr('r', (d) => Math.sqrt(d.weight) * 4)
      .attr('fill', '#2563EB')
      .call(
        d3
          .drag()
          .on('start', (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) sim.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )
      .on('click', (event, d) => {
        // Show label + relation on click
        alert(`${d.label}\n\nRelation: ${
          // find the matching link
          graph.links.find(
            (l) =>
              (l.source === d.id || l.source.id === d.id) &&
              (l.target === d.id || l.target.id === d.id)
          )?.relation || '—'
        }`)
      })

    // Tooltip on hover
    node.append('title').text((d) => d.label)

    // Tick handler
    sim.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y)

      node.attr('cx', (d) => d.x).attr('cy', (d) => d.y)
    })

    // Cleanup on unmount
    return () => {
      sim.stop()
      d3.select(container.current).selectAll('*').remove()
    }
  }, [graph])

  return (
    <div
      ref={container}
      className="w-full h-[600px] border rounded-md bg-gray-800"
    />
  )
}