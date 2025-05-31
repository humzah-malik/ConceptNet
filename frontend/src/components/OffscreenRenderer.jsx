import React, { useEffect, useRef } from 'react';
import { DataSet, Network } from 'vis-network/standalone';

export default function OffscreenRenderer({ graph, onReady }) {
  const containerRef = useRef(null);
  const networkRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !graph?.nodes || !graph?.links) return;

    const nodes = new DataSet(
      graph.nodes.map(n => ({ id: n.id, label: n.label, value: n.weight }))
    );
    const edges = new DataSet(
      graph.links.map(l => ({ from: l.source, to: l.target, label: l.relation }))
    );

    networkRef.current = new Network(containerRef.current, { nodes, edges }, {
      layout: { improvedLayout: true },
      physics: {
        enabled: true,
        stabilization: { iterations: 100, fit: true },
      },
      interaction: { dragNodes: false, zoomView: false, selectable: false }
    });

    // Wait for Vis.js to render, then trigger callback
    const waitAndExport = () => {
      requestAnimationFrame(() => {
        const canvas = containerRef.current.querySelector('canvas');
        if (canvas && canvas.width > 0 && canvas.height > 0) {
          onReady(canvas);
        } else {
          // Retry in next frame
          setTimeout(waitAndExport, 100);
        }
      });
    };

    // Start after a short delay
    setTimeout(waitAndExport, 300);

    return () => networkRef.current?.destroy();
  }, [graph, onReady]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '800px',
        height: '600px',
        position: 'absolute',
        top: '-1000px',
        left: '-1000px',
        opacity: 0.01, // not 0 to avoid canvas skip
        pointerEvents: 'none',
        zIndex: -1
      }}
    />
  );
}