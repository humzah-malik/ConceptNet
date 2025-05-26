import React, { useState } from 'react';
import MindMap from './MindMap';

export default function App() {
  const [graph, setGraph] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const text = await file.text();

    try {
      const response = await fetch('http://127.0.0.1:8000/extract-graph', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transcript: text })
      });

      const data = await response.json();
      setGraph(data);
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to fetch graph');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <input type="file" accept=".txt" onChange={handleFileUpload} />
      {loading && <p>Loading concept map...</p>}
      {graph && <MindMap graph={graph} />}
    </div>
  );
}