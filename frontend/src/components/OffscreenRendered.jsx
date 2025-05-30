import React, { useEffect, useRef } from 'react';
import { DataSet, Network } from 'vis-network/standalone';

export default function OffscreenRenderer({ graph, onReady }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !graph?.nodes || !graph?.links) return;

    const nodes = new DataSet(graph.nodes.map((n) => ({
      id: n.id,
      label: n.label,
      value: n.weight
    })));

    const edges = new DataSet(graph.links.map((l) => ({
      from: l.source,
      to: l.target,
      label: l.relation
    })));

    const network = new Network(containerRef.current, { nodes, edges }, {
      layout: { improvedLayout: true },
      physics: { stabilization: true },
      interaction: { dragNodes: false, zoomView: false }
    });

    network.once('stabilizationIterationsDone', () => {
      if (onReady) {
        const canvas = network.canvas.frame.canvas;
        onReady(canvas);
      }
    });

    return () => network.destroy();
  }, [graph, onReady]);

  return (
    <div
      ref={containerRef}
      style={{
        width: 800,
        height: 600,
        position: 'absolute',
        top: '-9999px',
        left: '-9999px',
        opacity: 0
      }}
    />
  );
}