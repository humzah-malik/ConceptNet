import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion'
import MindMap from '../components/MindMap';
import { HiArrowLeft, HiHome, HiDownload, HiTrash } from 'react-icons/hi';
import jsPDF from 'jspdf';
import NodeModal from '../components/NodeModal';

export default function MapView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [graph, setGraph] = useState(null);
  const [activeNode, setActiveNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const quizStats = JSON.parse(localStorage.getItem("quizStats") || "{}");


  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('galleryMaps') || '[]');
    const found = stored.find(m => m.id === id);
    if (found) {
      setGraph(found.graph);
    }
  }, [id]);

  const handleExport = (format = 'png') => {
    const originalCanvas = document.querySelector('#vis-graph canvas');
    if (!originalCanvas) return;

    const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = originalCanvas.width;
    tempCanvas.height = originalCanvas.height;

    const ctx = tempCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; // enforce white background
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    ctx.drawImage(originalCanvas, 0, 0);

    const dataURL = tempCanvas.toDataURL(mime);

    if (format === 'pdf') {
      const pdf = new jsPDF();
      pdf.addImage(dataURL, 'PNG', 10, 10, 180, 135);
      pdf.save('map.pdf');
    } else {
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `map.${format}`;
      link.click();
    }
  };

  const handleDelete = () => {
    const stored = JSON.parse(localStorage.getItem('galleryMaps') || '[]');
    const updated = stored.filter(m => m.id !== id);
    localStorage.setItem('galleryMaps', JSON.stringify(updated));
    navigate('/maps');
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Floating Header Buttons */}
      <div className="absolute top-4 left-4 flex space-x-2 z-50">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow hover:bg-gray-100">
          <HiArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <button onClick={() => navigate('/')} className="p-2 bg-white rounded-full shadow hover:bg-gray-100">
          <HiHome className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Center Title */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40">
        <h1 className="text-lg font-semibold text-gray-800">MindMapper</h1>
      </div>

      {/* Right Side Buttons */}
    <div className="absolute top-4 right-4 flex space-x-2 z-50">
      <button
        onClick={() => handleExport('png')}
        className="p-2 bg-white rounded-full shadow hover:bg-gray-100"
      >
        <HiDownload className="w-5 h-5 text-gray-700" />
      </button>
      <button
        onClick={handleDelete}
        className="p-2 bg-white rounded-full shadow hover:bg-gray-100"
      >
        <HiTrash className="w-5 h-5 text-red-600" />
      </button>
      <button
        onClick={() => {
          const shareURL = `${window.location.origin}/share/${id}`
          navigator.clipboard.writeText(shareURL)
            .then(() => alert('Shareable link copied to clipboard!'))
            .catch(() => alert('Failed to copy link.'))
        }}
        className="p-2 bg-white rounded-full shadow hover:bg-gray-100"
        title="Copy shareable link"
      >
        {/* You can pick any icon—for simplicity, reuse HiDownload but ideally use a link icon */}
        <span className="w-5 h-5 text-gray-700">🔗</span>
      </button>
    </div>

      {/* Left-side Search Bar */}
      <div className="absolute top-20 left-4 z-50 w-64">
        <input
          type="text"
          placeholder="Search node title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-indigo-200"
        />
      </div>

      {/* Quiz Analytics Panel */}
      <div className="absolute top-44 left-4 w-64 z-50 bg-white border rounded-md shadow-md p-4">
        <h2 className="text-md font-semibold mb-3 text-center text-gray-800">Quiz Analytics</h2>

        {graph && (() => {
          const nodeStats = quizStats?.[id] || {};
          const allStats = Object.values(nodeStats);
          const totalAttempts = allStats.reduce((sum, s) => sum + s.attempts, 0);
          const totalCorrect = allStats.reduce((sum, s) => sum + s.correct, 0);

          const topNodes = Object.entries(nodeStats)
            .map(([nodeId, stat]) => {
              const nodeLabel = graph.nodes.find(n => n.id == nodeId)?.label || 'Unknown';
              return { ...stat, label: nodeLabel };
            })
            .sort((a, b) => (b.correct / b.attempts) - (a.correct / a.attempts))
            .slice(0, 3);

          return (
            <div className="text-sm text-gray-700 space-y-3">
              {/* Total Score */}
              <div>
                <p className="font-medium">Total Score</p>
                <div className="w-full h-2 bg-gray-200 rounded overflow-hidden mb-1">
                  <div
                    className="h-full bg-indigo-500"
                    style={{ width: totalAttempts > 0 ? `${(totalCorrect / totalAttempts) * 100}%` : '0%' }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {totalCorrect} / {totalAttempts} correct ({totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0}%)
                </p>
              </div>

              {/* Section Heading */}
              <p className="text-xs text-center font-semibold text-gray-500 mt-2">Top 3 Topics</p>

              {/* Top Nodes */}
              {topNodes.map((n, idx) => (
                <div key={idx}>
                  <p className="font-medium truncate">{n.label}</p>
                  <div className="w-full h-2 bg-gray-200 rounded overflow-hidden mb-1">
                    <div
                      className="h-full bg-indigo-500"
                      style={{ width: `${(n.correct / n.attempts) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {n.correct} / {n.attempts} correct ({Math.round((n.correct / n.attempts) * 100)}%)
                  </p>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Graph */}
      <div id="vis-graph" className="w-full h-full">
        {graph ? (
          <MindMap graph={graph} onNodeClick={setActiveNode} setGraph={setGraph} searchTerm={searchTerm} />
        ) : (
          <p className="text-center pt-20 text-gray-500">Map not found</p>
        )}

        <AnimatePresence>
          {activeNode && (
            <NodeModal
              key={activeNode.id}
              graphId={id}
              node={activeNode}
              onClose={() => setActiveNode(null)}
              mapId={id}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}