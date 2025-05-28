import React, { useEffect, useState } from 'react'
import MindMap from './MindMap'

export default function MapView() {
  const [graph, setGraph] = useState(null);

  useEffect(() => {
    const cached = localStorage.getItem("latestGraph");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.nodes && parsed?.links) {
        setGraph(parsed);
      }
    }
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Your Mind Map</h1>
      {graph ? (
        <MindMap graph={graph} />
      ) : (
        <p className="text-gray-600">No graph found. Please create one first.</p>
      )}
    </div>
  );
}