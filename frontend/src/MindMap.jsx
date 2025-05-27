import React, { useEffect, useRef } from 'react'
import { DataSet, Network } from 'vis-network/standalone'

export default function MindMap({ graph }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !graph || !graph.nodes || !graph.links) {
      console.log('Missing required graph data:', { graph });
      return;
    }

    const nodes = new DataSet(
      graph.nodes.map((n) => ({
        id: n.id,
        label: n.label,
        value: n.weight,
        title: `${n.summary}\n\nQuiz Questions:\n${n.quiz?.map((q, i) =>
          `Q${i + 1}: ${q.question}\n${q.options.map((opt, j) =>
            `${j === q.answer_index ? '✓' : ' '} ${opt}`
          ).join('\n')}`
        ).join('\n\n') || 'No quiz available'}`,
        font: {
          size: 16,
          face: 'arial',
          multi: 'false',
          maxWrap: 15  // Wrap long labels
        }
      }))
    )

    const edges = new DataSet(
      graph.links.map((l) => ({
        from: l.source,
        to: l.target,
        value: l.weight,
        arrows: 'to',
        title: l.relation,
        label: l.relation,
        font: {
          size: 12,
          align: 'middle',
          face: 'arial'
        }
      }))
    )

    const data = { nodes, edges }

    const options = {
      layout: {
        randomSeed: 2,
        improvedLayout: true,
        clusterThreshold: 150
      },
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
        repulsion: {
          nodeDistance: 250
        },
        solver: 'barnesHut',
        stabilization: {
          enabled: true,
          iterations: 1000,
          updateInterval: 25,
          onlyDynamicEdges: false,
          fit: true
        }
      },
      nodes: {
        shape: 'dot',
        size: 20,
        borderWidth: 2,
        color: {
          border: '#97C2FC',
          background: '#D2E5FF',
          highlight: {
            border: '#2B7CE9',
            background: '#D2E5FF'
          },
          hover: {
            border: '#2B7CE9',
            background: '#D2E5FF'
          }
        },
        font: {
          color: '#343434',
          size: 14
        },
        margin: 20,
        mass: 1.5
      },
      edges: {
        smooth: {
          type: 'continuous',
          forceDirection: 'none',
          roundness: 0.5
        },
        color: {
          color: '#97C2FC',
          highlight: '#7AA3E5',
          hover: '#7AA3E5',
          opacity: 0.8
        },
        width: 1.5,
        selectionWidth: 2,
        hoverWidth: 2,
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 0.2,
            type: 'arrow'
          }
        },
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        hideEdgesOnDrag: true,
        navigationButtons: false,
        keyboard: true,
        zoomView: true
      }
    }

    const network = new Network(containerRef.current, data, options)

    // Let physics run for initial layout, then reduce forces for subtle movement
    network.once('stabilizationIterationsDone', function() {
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
      });
    });

    return () => network.destroy()
  }, [graph])

  return (
    <div
      ref={containerRef}
      className="w-full h-[650px] bg-white rounded-md border shadow"
    />
  )
}